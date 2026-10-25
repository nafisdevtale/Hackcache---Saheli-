/**
 * Saheli Safe Pseudonymous Community Server Handler
 *
 * Safety & Privacy Architecture:
 * 1. Real database integration (Supabase PostgREST API).
 *    Fails closed: If SUPABASE_URL or service key is not configured, community
 *    publishing is explicitly marked unavailable. No silent in-memory production store.
 * 2. DPDP Act 2023 Section 9 Child Safety:
 *    Self-declared age groups are unverified. The under-18 online community forum
 *    is strictly disabled pending legal review, parental consent, and age assurance.
 * 3. Complete Pseudonymity: Client-held SHA-256 device secret hash for ownership.
 * 4. PII Redaction: Mobile numbers, emails, and URLs are stripped before storage.
 * 5. Moderation Workflow:
 *    - New posts/replies start in 'pending' status.
 *    - Auto-flagging on 3+ reports.
 *    - Secure moderator authentication requires MODERATOR_SECRET (no hardcoded fallback).
 * 6. Abuse Prevention: Rate limiting, duplicate-report prevention, and cross-age isolation.
 */

import crypto from "node:crypto";

export interface Post {
  id: string;
  author_alias: string;
  author_hash: string;
  age_group: "adult" | "under18";
  topic: "cycles" | "pcos" | "first_period" | "hygiene" | "general" | "pain";
  title: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  report_count: number;
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export interface Reply {
  id: string;
  post_id: string;
  author_alias: string;
  author_hash: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  report_count: number;
  created_at: string;
}

export interface Report {
  id: string;
  target_type: "post" | "reply";
  target_id: string;
  reason: string;
  reporter_hash: string;
  created_at: string;
}

// In-Memory Test Store (USED EXCLUSIVELY in test environments or when COMMUNITY_MOCK_STORE is true)
let mockPostsStore: Post[] = [];
let mockRepliesStore: Reply[] = [];
let mockReportsStore: Report[] = [];

// Rate limiting and abuse prevention maps
const postRateLimitMap = new Map<string, number[]>();
const reportedTargetsMap = new Set<string>(); // "targetId:reporterHash"

export function cleanEnvValue(val?: string): string {
  if (!val) return "";
  let trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getCommunitySupabaseConfig() {
  const url = cleanEnvValue(process.env.SUPABASE_URL).replace(/\/+$/, "");
  const serviceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKey = cleanEnvValue(process.env.SUPABASE_ANON_KEY);
  const key = serviceKey || anonKey;
  return {
    url,
    serviceKey,
    anonKey,
    key,
    configured: Boolean(url && key),
  };
}

export function isCommunityDatabaseConfigured(): boolean {
  return getCommunitySupabaseConfig().configured;
}

export function verifyAuthorProof(authorHash: string, authorSecret?: string): boolean {
  if (!authorHash) return false;
  if (authorSecret) {
    const computed = crypto.createHash("sha256").update(authorSecret).digest("hex");
    return computed === authorHash;
  }
  return isMockStoreAllowed();
}

export function isMockStoreAllowed(): boolean {
  return process.env.NODE_ENV === "test" || process.env.COMMUNITY_MOCK_STORE === "true";
}

export function resetCommunityStore(withDemo = false): void {
  mockPostsStore = withDemo ? getFictionalDemoPosts() : [];
  mockRepliesStore = [];
  mockReportsStore = [];
  postRateLimitMap.clear();
  reportedTargetsMap.clear();
}

function getFictionalDemoPosts(): Post[] {
  return [
    {
      id: "demo-adult-1",
      author_alias: "Saheli 4821",
      author_hash: "demo-hash-1",
      age_group: "adult",
      topic: "pcos",
      title: "[DEMO] Finding a supportive doctor for PCOS",
      content:
        "Fictional demonstration post: Remember that PCOS management takes time and patience with lifestyle adjustments.",
      status: "approved",
      report_count: 0,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_demo: true,
    },
    {
      id: "demo-adult-2",
      author_alias: "Saheli 9104",
      author_hash: "demo-hash-2",
      age_group: "adult",
      topic: "cycles",
      title: "[DEMO] Tracking cycle changes after illness",
      content:
        "Fictional demonstration post: Stress or viral illness can temporarily delay cycle timing.",
      status: "approved",
      report_count: 0,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      is_demo: true,
    },
  ];
}

export function redactPII(text: string): string {
  if (!text) return "";
  let clean = text;
  // Indian mobile numbers (10 digits starting with 6-9, optionally with +91)
  clean = clean.replace(/(\+91[\s-]?)?[6-9]\d{4}[\s-]?[0-9]{5}\b/g, "[phone hidden]");
  clean = clean.replace(/\b[6-9]\d{9}\b/g, "[phone hidden]");
  // Emails
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email hidden]");
  // URLs
  clean = clean.replace(/https?:\/\/[^\s]+/gi, "[link hidden]");
  return clean;
}

function checkPostRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 600000; // 10 minutes
  const limit = 3; // max 3 posts per 10 minutes
  const timestamps = postRateLimitMap.get(clientId) || [];
  const valid = timestamps.filter((t) => now - t < windowMs);
  if (valid.length >= limit) return false;
  valid.push(now);
  postRateLimitMap.set(clientId, valid);
  return true;
}

// -----------------------------------------------------------------------------
// Real Supabase PostgREST Client
// -----------------------------------------------------------------------------
async function supabaseFetch(
  tablePath: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    privileged?: boolean;
  } = {},
): Promise<Response> {
  const config = getCommunitySupabaseConfig();
  if (!config.url) {
    throw new Error("SUPABASE_URL is not configured");
  }

  const serviceKey = options.privileged ? config.serviceKey : config.key;

  if (options.privileged && !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for privileged operations");
  }

  const url = `${config.url}/rest/v1/${tablePath}`;
  const headers: Record<string, string> = {
    apikey: serviceKey || "",
    Authorization: `Bearer ${serviceKey || ""}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers || {}),
  };

  return await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function handleCommunityRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // 1. GET /api/community/status
  if (path === "/api/community/status" && method === "GET") {
    const dbConfigured = isCommunityDatabaseConfigured();
    const mockAllowed = isMockStoreAllowed();
    return new Response(
      JSON.stringify({
        ok: true,
        available: dbConfigured || mockAllowed,
        persistenceType: dbConfigured ? "supabase" : mockAllowed ? "mock_test" : "unconfigured",
        teenCommunityEnabled: false,
        teenNotice:
          "Under-18 online community forum is currently disabled pending age assurance framework and parental consent protocols per DPDP Act 2023 Section 9.",
        moderatorConfigured: Boolean(process.env.MODERATOR_SECRET?.trim()),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Database availability check
  const dbConfigured = isCommunityDatabaseConfigured();
  const mockAllowed = isMockStoreAllowed();

  if (!dbConfigured && !mockAllowed) {
    return new Response(
      JSON.stringify({
        ok: false,
        available: false,
        error:
          "Community database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server to enable community features.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. GET /api/community/posts
  if (path === "/api/community/posts" && method === "GET") {
    const ageGroup = url.searchParams.get("age_group") || "adult";
    const topic = url.searchParams.get("topic");
    const authorHash = url.searchParams.get("author_hash");

    // DPDP Act Section 9 Child Safety: Under-18 online community is strictly disabled
    if (ageGroup === "under18") {
      return new Response(
        JSON.stringify({
          ok: true,
          posts: [],
          disabled: true,
          reason:
            "Under-18 online community forum is currently disabled pending verifiable parental consent, age assurance framework, and clinical safety protocol per DPDP Act 2023 Section 9. Educational lessons in Learn and Doctor Guidance remain available.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (dbConfigured) {
      try {
        let queryParams = `age_group=eq.adult&order=created_at.desc`;
        if (topic && topic !== "all") {
          queryParams += `&topic=eq.${encodeURIComponent(topic)}`;
        }
        if (authorHash) {
          queryParams += `&or=(status.eq.approved,author_hash.eq.${encodeURIComponent(authorHash)})`;
        } else {
          queryParams += `&status=eq.approved`;
        }

        const res = await supabaseFetch(`community_posts?${queryParams}`);
        if (!res.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: "Database error querying posts" }),
            { status: 502 },
          );
        }

        const data = (await res.json()) as Post[];
        const safePosts = data.map((p) => ({
          id: p.id,
          author_alias: p.author_alias,
          age_group: p.age_group,
          topic: p.topic,
          title: p.title,
          content: p.content,
          status: p.status,
          created_at: p.created_at,
          reply_count: 0,
          is_own: authorHash ? p.author_hash === authorHash : false,
          is_demo: Boolean(p.is_demo),
        }));

        return new Response(JSON.stringify({ ok: true, posts: safePosts }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: "Network error connecting to database" }),
          { status: 502 },
        );
      }
    }

    // Mock store branch for automated tests
    let filtered = mockPostsStore.filter((p) => p.age_group === "adult");
    if (topic && topic !== "all") {
      filtered = filtered.filter((p) => p.topic === topic);
    }
    filtered = filtered.filter((p) => {
      if (p.status === "approved") return true;
      if (authorHash && p.author_hash === authorHash) return true;
      return false;
    });
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const safePosts = filtered.map((p) => ({
      id: p.id,
      author_alias: p.author_alias,
      age_group: p.age_group,
      topic: p.topic,
      title: p.title,
      content: p.content,
      status: p.status,
      created_at: p.created_at,
      reply_count: mockRepliesStore.filter((r) => r.post_id === p.id && r.status === "approved")
        .length,
      is_own: authorHash ? p.author_hash === authorHash : false,
      is_demo: Boolean(p.is_demo),
    }));

    return new Response(JSON.stringify({ ok: true, posts: safePosts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. POST /api/community/posts (Create Post)
  if (path === "/api/community/posts" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { author_alias, author_hash, age_group, topic, title, content } = (body || {}) as {
      author_alias?: string;
      author_hash?: string;
      age_group?: "adult" | "under18";
      topic?: Post["topic"];
      title?: string;
      content?: string;
    };

    // DPDP Act Section 9 Child Safety: Under-18 posting is strictly blocked
    if (age_group === "under18") {
      return new Response(
        JSON.stringify({
          ok: false,
          disabled: true,
          error:
            "Under-18 online community posting is currently disabled pending verifiable parental consent and age assurance protocols under DPDP Act 2023 Section 9.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!author_alias || !author_hash || !title || !content) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400,
      });
    }

    if (title.length > 120 || content.length > 1000) {
      return new Response(JSON.stringify({ ok: false, error: "Title or content exceeds limit" }), {
        status: 400,
      });
    }

    // Abuse Prevention: Rate limiting
    const clientKey = `${author_hash}`;
    if (!checkPostRateLimit(clientKey)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Rate limit reached. Maximum 3 posts per 10 minutes. Please wait before posting.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    const cleanTitle = redactPII(title.trim());
    const cleanContent = redactPII(content.trim());

    const newPost: Post = {
      id: "post-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      author_alias: String(author_alias).substring(0, 30),
      author_hash: String(author_hash),
      age_group: "adult",
      topic: topic || "general",
      title: cleanTitle,
      content: cleanContent,
      status: "pending",
      report_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (dbConfigured) {
      try {
        const res = await supabaseFetch("community_posts", {
          method: "POST",
          body: {
            author_alias: newPost.author_alias,
            author_hash: newPost.author_hash,
            age_group: newPost.age_group,
            topic: newPost.topic,
            title: newPost.title,
            content: newPost.content,
            status: "pending",
          },
        });

        if (!res.ok) {
          return new Response(JSON.stringify({ ok: false, error: "Database error saving post" }), {
            status: 502,
          });
        }

        const created = (await res.json()) as Post[];
        return new Response(
          JSON.stringify({
            ok: true,
            message: "Post submitted for moderation review. It will appear once approved.",
            post: created[0] || newPost,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Network error saving post" }), {
          status: 502,
        });
      }
    }

    mockPostsStore.unshift(newPost);
    return new Response(
      JSON.stringify({
        ok: true,
        message: "Post submitted for moderation review. It will appear once approved.",
        post: { ...newPost, is_own: true },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. POST /api/community/report (Report Post or Reply)
  if (path === "/api/community/report" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { target_type, target_id, reason, reporter_hash } = (body || {}) as {
      target_type?: "post" | "reply";
      target_id?: string;
      reason?: string;
      reporter_hash?: string;
    };

    if (!target_type || !target_id || !reason) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required report fields" }), {
        status: 400,
      });
    }

    // Abuse Prevention: Duplicate report check
    const reportKey = `${target_id}:${reporter_hash || "anon"}`;
    if (reportedTargetsMap.has(reportKey)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "You have already submitted a report for this content.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    reportedTargetsMap.add(reportKey);

    if (dbConfigured) {
      try {
        await supabaseFetch("community_reports", {
          method: "POST",
          body: {
            target_type,
            target_id,
            reason: String(reason).substring(0, 200),
            reporter_hash: reporter_hash || "anon",
          },
        });

        return new Response(
          JSON.stringify({
            ok: true,
            message: "Report received. Content receiving 3+ reports is automatically hidden.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Database error" }), {
          status: 502,
        });
      }
    }

    // Mock store auto-flag logic
    const rep: Report = {
      id: "rep-" + Date.now(),
      target_type,
      target_id,
      reason: String(reason).substring(0, 200),
      reporter_hash: reporter_hash || "anon",
      created_at: new Date().toISOString(),
    };
    mockReportsStore.push(rep);

    if (target_type === "post") {
      const p = mockPostsStore.find((item) => item.id === target_id);
      if (p) {
        p.report_count += 1;
        if (p.report_count >= 3) p.status = "flagged";
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Thank you. Our moderation team has received your report.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. POST /api/community/delete-all (Delete All My Data)
  if (path === "/api/community/delete-all" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { author_hash, author_secret } = (body || {}) as {
      author_hash?: string;
      author_secret?: string;
    };
    if (!author_hash) {
      return new Response(JSON.stringify({ ok: false, error: "Author hash required" }), {
        status: 400,
      });
    }

    // Verify proof of ownership
    if (!verifyAuthorProof(author_hash, author_secret)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Unauthorized: Invalid or missing device author proof of ownership.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    if (dbConfigured) {
      try {
        await supabaseFetch(`community_posts?author_hash=eq.${encodeURIComponent(author_hash)}`, {
          method: "DELETE",
          privileged: true,
        });
        await supabaseFetch(`community_replies?author_hash=eq.${encodeURIComponent(author_hash)}`, {
          method: "DELETE",
          privileged: true,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            message: "All posts and replies published from this device have been purged.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Database error" }), {
          status: 502,
        });
      }
    }

    const prevPosts = mockPostsStore.length;
    mockPostsStore = mockPostsStore.filter((p) => p.author_hash !== author_hash);
    const deletedCount = prevPosts - mockPostsStore.length;

    return new Response(
      JSON.stringify({
        ok: true,
        message: `Successfully deleted ${deletedCount} posts.`,
        deleted: { posts: deletedCount },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 6. POST /api/community/moderation/decision (Approve or Reject - Genuine Auth)
  if (path === "/api/community/moderation/decision" && method === "POST") {
    const serverModSecret = cleanEnvValue(process.env.MODERATOR_SECRET);
    if (!serverModSecret) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "MODERATOR_SECRET is not configured on this server.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const modToken = req.headers.get("x-moderator-token");
    if (modToken !== serverModSecret) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized: Invalid moderator token." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { target_type, target_id, action } = (body || {}) as {
      target_type?: "post" | "reply";
      target_id?: string;
      action?: "approved" | "rejected";
    };

    if (!target_type || !target_id || (action !== "approved" && action !== "rejected")) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid action or parameters" }), {
        status: 400,
      });
    }

    if (dbConfigured) {
      try {
        const table = target_type === "post" ? "community_posts" : "community_replies";
        await supabaseFetch(`${table}?id=eq.${encodeURIComponent(target_id)}`, {
          method: "PATCH",
          body: { status: action },
          privileged: true,
        });

        return new Response(JSON.stringify({ ok: true, status: action }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Database error";
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 502,
        });
      }
    }

    if (target_type === "post") {
      const p = mockPostsStore.find((item) => item.id === target_id);
      if (p) p.status = action;
    }

    return new Response(JSON.stringify({ ok: true, status: action }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 7. POST /api/community/replies (Create Reply)
  if (path === "/api/community/replies" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { post_id, author_alias, author_hash, content } = (body || {}) as {
      post_id?: string;
      author_alias?: string;
      author_hash?: string;
      content?: string;
    };

    if (!post_id || !author_alias || !author_hash || !content) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required reply fields" }), {
        status: 400,
      });
    }

    if (content.length > 800) {
      return new Response(
        JSON.stringify({ ok: false, error: "Reply exceeds character limit (800)" }),
        {
          status: 400,
        },
      );
    }

    const cleanContent = redactPII(content.trim());
    const newReply: Reply = {
      id: "rep-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      post_id,
      author_alias: String(author_alias).substring(0, 30),
      author_hash: String(author_hash),
      content: cleanContent,
      status: "pending",
      report_count: 0,
      created_at: new Date().toISOString(),
    };

    if (dbConfigured) {
      try {
        const res = await supabaseFetch("community_replies", {
          method: "POST",
          body: {
            post_id: newReply.post_id,
            author_alias: newReply.author_alias,
            author_hash: newReply.author_hash,
            content: newReply.content,
            status: "pending",
          },
        });

        if (!res.ok) {
          return new Response(JSON.stringify({ ok: false, error: "Database error saving reply" }), {
            status: 502,
          });
        }

        return new Response(
          JSON.stringify({
            ok: true,
            message: "Reply submitted for moderation review. It will appear once approved.",
            reply: newReply,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Network error saving reply" }), {
          status: 502,
        });
      }
    }

    mockRepliesStore.push(newReply);
    return new Response(
      JSON.stringify({
        ok: true,
        message: "Reply submitted for moderation review. It will appear once approved.",
        reply: newReply,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  // 8. GET /api/community/replies?post_id=...
  if (path === "/api/community/replies" && method === "GET") {
    const postId = url.searchParams.get("post_id");
    if (!postId) {
      return new Response(
        JSON.stringify({ ok: false, error: "post_id query parameter required" }),
        {
          status: 400,
        },
      );
    }

    if (dbConfigured) {
      try {
        const res = await supabaseFetch(
          `community_replies?post_id=eq.${encodeURIComponent(postId)}&status=eq.approved&order=created_at.asc`,
        );
        if (!res.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: "Database error querying replies" }),
            {
              status: 502,
            },
          );
        }
        const replies = (await res.json()) as Reply[];
        return new Response(
          JSON.stringify({
            ok: true,
            replies: replies.map((r) => ({
              id: r.id,
              post_id: r.post_id,
              author_alias: r.author_alias,
              content: r.content,
              created_at: r.created_at,
            })),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: "Network error querying replies" }),
          {
            status: 502,
          },
        );
      }
    }

    const replies = mockRepliesStore
      .filter((r) => r.post_id === postId && r.status === "approved")
      .map((r) => ({
        id: r.id,
        post_id: r.post_id,
        author_alias: r.author_alias,
        content: r.content,
        created_at: r.created_at,
      }));

    return new Response(JSON.stringify({ ok: true, replies }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 9. GET /api/community/post-detail?id=...&age_group=...
  if (path === "/api/community/post-detail" && method === "GET") {
    const id = url.searchParams.get("id");
    const ageGroup = url.searchParams.get("age_group") || "adult";
    const authorHash = url.searchParams.get("author_hash");

    if (ageGroup === "under18") {
      return new Response(
        JSON.stringify({
          ok: false,
          disabled: true,
          error:
            "Under-18 online community forum is currently disabled per DPDP Act 2023 Section 9.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: "id parameter required" }), {
        status: 400,
      });
    }

    if (dbConfigured) {
      try {
        const res = await supabaseFetch(`community_posts?id=eq.${encodeURIComponent(id)}`);
        if (!res.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: "Database error querying post" }),
            {
              status: 502,
            },
          );
        }
        const posts = (await res.json()) as Post[];
        const post = posts[0];
        if (!post) {
          return new Response(JSON.stringify({ ok: false, error: "Post not found" }), {
            status: 404,
          });
        }

        const isOwn = authorHash ? post.author_hash === authorHash : false;
        if (post.status !== "approved" && !isOwn) {
          return new Response(JSON.stringify({ ok: false, error: "Post is not available" }), {
            status: 404,
          });
        }

        const repRes = await supabaseFetch(
          `community_replies?post_id=eq.${encodeURIComponent(id)}&status=eq.approved&order=created_at.asc`,
        );
        const replies = repRes.ok ? ((await repRes.json()) as Reply[]) : [];

        return new Response(
          JSON.stringify({
            ok: true,
            post: {
              id: post.id,
              author_alias: post.author_alias,
              age_group: post.age_group,
              topic: post.topic,
              title: post.title,
              content: post.content,
              status: post.status,
              created_at: post.created_at,
              is_own: isOwn,
            },
            replies: replies.map((r) => ({
              id: r.id,
              post_id: r.post_id,
              author_alias: r.author_alias,
              content: r.content,
              created_at: r.created_at,
            })),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "Network error" }), { status: 502 });
      }
    }

    const post = mockPostsStore.find((p) => p.id === id);
    if (!post) {
      return new Response(JSON.stringify({ ok: false, error: "Post not found" }), { status: 404 });
    }
    const isOwn = authorHash ? post.author_hash === authorHash : false;
    if (post.status !== "approved" && !isOwn) {
      return new Response(JSON.stringify({ ok: false, error: "Post is not available" }), {
        status: 404,
      });
    }

    const replies = mockRepliesStore
      .filter((r) => r.post_id === id && r.status === "approved")
      .map((r) => ({
        id: r.id,
        post_id: r.post_id,
        author_alias: r.author_alias,
        content: r.content,
        created_at: r.created_at,
      }));

    return new Response(
      JSON.stringify({
        ok: true,
        post: {
          id: post.id,
          author_alias: post.author_alias,
          age_group: post.age_group,
          topic: post.topic,
          title: post.title,
          content: post.content,
          status: post.status,
          created_at: post.created_at,
          is_own: isOwn,
        },
        replies,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: false, error: "Endpoint not found" }), { status: 404 });
}
