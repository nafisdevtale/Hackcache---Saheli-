/**
 * Saheli Safe Pseudonymous Community Server Handler
 *
 * Safety & Privacy Architecture:
 * 1. Complete pseudonymity: No personal accounts, phones, or emails.
 * 2. Client-held device hash (SHA-256) used for ownership & deletion rights.
 * 3. Strict age separation: Adults and Under-18 (teens) feeds are completely partitioned.
 * 4. Automated PII Redaction: Phone numbers, emails, and external URLs stripped before saving.
 * 5. Moderation Queue: New posts/replies start as 'pending' until approved.
 * 6. Automated Flagging: 3+ reports automatically flags and hides content.
 * 7. "Delete All My Data": Author can wipe all their posts/replies instantly using their device hash.
 * 8. Seeded with 10 synthetic demo posts for clean initial experience.
 */

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
  is_seed?: boolean;
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

// In-Memory Database (persists across runtime, or fallback when Supabase is not configured)
let postsStore: Post[] = [];
let repliesStore: Reply[] = [];
let reportsStore: Report[] = [];

export function redactPII(text: string): string {
  if (!text) return "";
  let clean = text;

  // Indian mobile numbers (10 digits starting with 6-9, optionally with +91)
  clean = clean.replace(/(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, "[phone hidden]");
  clean = clean.replace(/\b[6-9]\d{9}\b/g, "[phone hidden]");

  // Emails
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email hidden]");

  // URLs / links
  clean = clean.replace(/https?:\/\/[^\s]+/gi, "[link hidden]");

  return clean;
}

// Seed posts
const SEED_POSTS: Post[] = [
  // 5 Adult posts
  {
    id: "seed-adult-1",
    author_alias: "Saheli 4821",
    author_hash: "seed-hash-1",
    age_group: "adult",
    topic: "pcos",
    title: "How did you find a non-judgmental gynaecologist for PCOS?",
    content:
      "I was diagnosed with PCOS last month. My family kept saying it's just weight, but finding a supportive gynaecologist who explained insulin resistance and lifestyle tweaks made a world of difference. Don't lose hope!",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-adult-2",
    author_alias: "Saheli 9104",
    author_hash: "seed-hash-2",
    age_group: "adult",
    topic: "cycles",
    title: "Tracking ovulation signs while planning pregnancy",
    content:
      "Started noticing cervical mucus changes around day 14. Combining that with the Saheli calendar estimates helped me understand my cycle rhythm so much better without expensive kits.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-adult-3",
    author_alias: "Saheli 3127",
    author_hash: "seed-hash-3",
    age_group: "adult",
    topic: "pain",
    title: "What non-medicine remedies help with day 1 cramps?",
    content:
      "A hot water bag on the lower back and drinking warm ginger water helped me survive my heaviest cramp days at work. What helps you all?",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-adult-4",
    author_alias: "Saheli 7741",
    author_hash: "seed-hash-4",
    age_group: "adult",
    topic: "hygiene",
    title: "Switching from pads to menstrual cup — my honest experience",
    content:
      "It took me 3 cycles to get used to inserting the cup properly, but it completely stopped chafing in hot humid weather. Make sure to sterilize in boiling water before and after every cycle.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-adult-5",
    author_alias: "Saheli 6032",
    author_hash: "seed-hash-5",
    age_group: "adult",
    topic: "general",
    title: "Check your Ferritin levels if you have heavy periods!",
    content:
      "I felt constantly exhausted for months. My doctor ordered a CBC and Ferritin test and found severe iron deficiency from heavy flow. Iron supplements and jaggery/spinach made a huge difference.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    is_seed: true,
  },

  // 5 Under-18 / Teen posts
  {
    id: "seed-teen-1",
    author_alias: "Saheli 1209",
    author_hash: "seed-hash-6",
    age_group: "under18",
    topic: "first_period",
    title: "Got my first period in 8th grade today — feeling nervous",
    content:
      "I was at school when it started. My friend gave me a pad and told me it's totally normal. Reading the lessons in Saheli helped me calm down.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-teen-2",
    author_alias: "Saheli 5843",
    author_hash: "seed-hash-7",
    age_group: "under18",
    topic: "pain",
    title: "Managing period cramps during exam days",
    content:
      "I always keep a small heat patch in my bag and drink warm water from my thermos bottle. Does anyone else get leg aches too?",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-teen-3",
    author_alias: "Saheli 3490",
    author_hash: "seed-hash-8",
    age_group: "under18",
    topic: "cycles",
    title: "Is it normal if my period skipped 40 days?",
    content:
      "My periods started 8 months ago and they don't arrive on the exact same date. The doctor lesson in the app says cycles can take 2-3 years to become regular in teens, which was such a relief to know.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-teen-4",
    author_alias: "Saheli 8215",
    author_hash: "seed-hash-9",
    age_group: "under18",
    topic: "hygiene",
    title: "How often do you change pads during school hours?",
    content:
      "I make sure to change every 4 to 5 hours even if the pad isn't full, to stay fresh and avoid rashes or infections. Always keep 2 spares in an opaque pouch.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_seed: true,
  },
  {
    id: "seed-teen-5",
    author_alias: "Saheli 6750",
    author_hash: "seed-hash-10",
    age_group: "under18",
    topic: "general",
    title: "How I talked to my mom about painful periods",
    content:
      "I was scared she would say it's just something we have to bear, but showing her the symptom log in Saheli helped her see how bad the pain was. We visited a lady doctor together.",
    status: "approved",
    report_count: 0,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    is_seed: true,
  },
];

// Initialize store with seed posts if empty
if (postsStore.length === 0) {
  postsStore = [...SEED_POSTS];
}

export function resetCommunityStore(withSeeds = true) {
  postsStore = withSeeds ? [...SEED_POSTS] : [];
  repliesStore = [];
  reportsStore = [];
}

export async function handleCommunityRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // 1. GET /api/community/posts
  // Query params: age_group ('adult' | 'under18'), topic (optional), author_hash (optional)
  if (path === "/api/community/posts" && method === "GET") {
    const ageGroup = url.searchParams.get("age_group") || "adult";
    const topic = url.searchParams.get("topic");
    const authorHash = url.searchParams.get("author_hash");

    // Strict age separation: ONLY return posts from requested age group
    let filtered = postsStore.filter((p) => p.age_group === ageGroup);

    if (topic && topic !== "all") {
      filtered = filtered.filter((p) => p.topic === topic);
    }

    // Default view: ONLY approved posts, EXCEPT if the author is requesting, include their pending posts
    filtered = filtered.filter((p) => {
      if (p.status === "approved") return true;
      if (authorHash && p.author_hash === authorHash) return true;
      return false;
    });

    // Sort descending by created_at
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Map without author_hash for public view, but include reply_count
    const safePosts = filtered.map((p) => {
      const replyCount = repliesStore.filter(
        (r) => r.post_id === p.id && r.status === "approved",
      ).length;
      return {
        id: p.id,
        author_alias: p.author_alias,
        age_group: p.age_group,
        topic: p.topic,
        title: p.title,
        content: p.content,
        status: p.status,
        created_at: p.created_at,
        reply_count: replyCount,
        is_own: authorHash ? p.author_hash === authorHash : false,
      };
    });

    return new Response(JSON.stringify({ ok: true, posts: safePosts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. GET /api/community/post-detail?id=...&age_group=...
  if (path === "/api/community/post-detail" && method === "GET") {
    const id = url.searchParams.get("id");
    const ageGroup = url.searchParams.get("age_group") || "adult";
    const authorHash = url.searchParams.get("author_hash");

    const post = postsStore.find((p) => p.id === id);
    if (!post) {
      return new Response(JSON.stringify({ ok: false, error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Age partition enforcement
    if (post.age_group !== ageGroup) {
      return new Response(
        JSON.stringify({ ok: false, error: "Access denied: Age group partition" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const replies = repliesStore
      .filter(
        (r) =>
          r.post_id === id &&
          (r.status === "approved" || (authorHash && r.author_hash === authorHash)),
      )
      .map((r) => ({
        id: r.id,
        post_id: r.post_id,
        author_alias: r.author_alias,
        content: r.content,
        status: r.status,
        created_at: r.created_at,
        is_own: authorHash ? r.author_hash === authorHash : false,
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
          is_own: authorHash ? post.author_hash === authorHash : false,
        },
        replies,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
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

    if (!author_alias || !author_hash || !age_group || !title || !content) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400,
      });
    }

    if (age_group !== "adult" && age_group !== "under18") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid age group" }), {
        status: 400,
      });
    }

    if (title.length > 120 || content.length > 1000) {
      return new Response(JSON.stringify({ ok: false, error: "Title or content too long" }), {
        status: 400,
      });
    }

    // PII Redaction
    const cleanTitle = redactPII(title.trim());
    const cleanContent = redactPII(content.trim());

    // In dev mode or test environments, can auto-approve or queue as pending
    // As per master prompt: Posts start as 'pending' moderation queue before public view
    const newPost: Post = {
      id: "post-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      author_alias: String(author_alias).substring(0, 30),
      author_hash: String(author_hash),
      age_group,
      topic: topic || "general",
      title: cleanTitle,
      content: cleanContent,
      status: "pending",
      report_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    postsStore.unshift(newPost);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Post submitted for community review. It will appear once approved by moderators.",
        post: {
          id: newPost.id,
          author_alias: newPost.author_alias,
          age_group: newPost.age_group,
          topic: newPost.topic,
          title: newPost.title,
          content: newPost.content,
          status: newPost.status,
          created_at: newPost.created_at,
          is_own: true,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. POST /api/community/replies (Create Reply)
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
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400,
      });
    }

    const targetPost = postsStore.find((p) => p.id === post_id);
    if (!targetPost) {
      return new Response(JSON.stringify({ ok: false, error: "Target post not found" }), {
        status: 404,
      });
    }

    const cleanContent = redactPII(content.trim());

    const newReply: Reply = {
      id: "reply-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      post_id,
      author_alias: String(author_alias).substring(0, 30),
      author_hash: String(author_hash),
      content: cleanContent,
      status: "pending",
      report_count: 0,
      created_at: new Date().toISOString(),
    };

    repliesStore.push(newReply);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Reply submitted for moderation review.",
        reply: {
          id: newReply.id,
          post_id: newReply.post_id,
          author_alias: newReply.author_alias,
          content: newReply.content,
          status: newReply.status,
          created_at: newReply.created_at,
          is_own: true,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. POST /api/community/report (Report Post or Reply)
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
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400,
      });
    }

    const report: Report = {
      id: "rep-" + Date.now(),
      target_type,
      target_id,
      reason: String(reason).substring(0, 200),
      reporter_hash: reporter_hash || "anon",
      created_at: new Date().toISOString(),
    };

    reportsStore.push(report);

    // Increment report counter on target
    if (target_type === "post") {
      const p = postsStore.find((item) => item.id === target_id);
      if (p) {
        p.report_count += 1;
        if (p.report_count >= 3) {
          p.status = "flagged";
        }
      }
    } else {
      const r = repliesStore.find((item) => item.id === target_id);
      if (r) {
        r.report_count += 1;
        if (r.report_count >= 3) {
          r.status = "flagged";
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message:
          "Thank you for helping keep Saheli safe. The moderation team has received your report.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 6. POST /api/community/delete-all (Delete All My Data)
  if (path === "/api/community/delete-all" && method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
    }

    const { author_hash } = (body || {}) as { author_hash?: string };
    if (!author_hash) {
      return new Response(JSON.stringify({ ok: false, error: "Author hash required" }), {
        status: 400,
      });
    }

    const deletedPosts = postsStore.filter((p) => p.author_hash === author_hash).length;
    postsStore = postsStore.filter((p) => p.author_hash !== author_hash);

    const deletedReplies = repliesStore.filter((r) => r.author_hash === author_hash).length;
    repliesStore = repliesStore.filter((r) => r.author_hash !== author_hash);

    return new Response(
      JSON.stringify({
        ok: true,
        message: `Successfully deleted ${deletedPosts} posts and ${deletedReplies} replies.`,
        deleted: { posts: deletedPosts, replies: deletedReplies },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 7. GET /api/community/moderation/pending (Moderation Queue)
  if (path === "/api/community/moderation/pending" && method === "GET") {
    const modToken = req.headers.get("x-moderator-token");
    const isDev = process.env.NODE_ENV !== "production";

    if (!isDev && modToken !== (process.env.MODERATOR_SECRET || "saheli-mod-secret")) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
    }

    const pendingPosts = postsStore.filter((p) => p.status === "pending" || p.status === "flagged");
    const pendingReplies = repliesStore.filter(
      (r) => r.status === "pending" || r.status === "flagged",
    );

    return new Response(
      JSON.stringify({
        ok: true,
        pending: {
          posts: pendingPosts,
          replies: pendingReplies,
          reports: reportsStore,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // 8. POST /api/community/moderation/decision (Approve or Reject)
  if (path === "/api/community/moderation/decision" && method === "POST") {
    const modToken = req.headers.get("x-moderator-token");
    const isDev = process.env.NODE_ENV !== "production";

    if (!isDev && modToken !== (process.env.MODERATOR_SECRET || "saheli-mod-secret")) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
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

    if (target_type === "post") {
      const p = postsStore.find((item) => item.id === target_id);
      if (p) p.status = action;
    } else {
      const r = repliesStore.find((item) => item.id === target_id);
      if (r) r.status = action;
    }

    return new Response(JSON.stringify({ ok: true, status: action }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });
}
