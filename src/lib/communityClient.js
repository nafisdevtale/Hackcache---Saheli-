/**
 * Client-Side Helper for Saheli Safe Pseudonymous Community
 *
 * Identity generation:
 * - Generates random alias: "Saheli " + 4 digits (e.g. "Saheli 4821")
 * - Generates random secret token in localStorage
 * - Hashes token with SHA-256 for author_hash (device-held credential)
 * - Zero personal info, zero phone numbers, zero emails
 */

const STORAGE_KEY = "saheli_community_identity_v1";

async function sha256(str) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback hash for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

export async function getCommunityIdentity() {
  if (typeof window === "undefined") {
    return { alias: "Saheli 1000", hash: "mock-hash" };
  }

  let stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.alias && parsed.hash) return parsed;
    } catch {
      // regenerate
    }
  }

  const rand4 = Math.floor(1000 + Math.random() * 9000);
  const alias = `Saheli ${rand4}`;
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hash = await sha256(secret);

  const identity = { alias, secret, hash };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export async function fetchCommunityPosts(ageGroup = "adult", topic = "all") {
  const identity = await getCommunityIdentity();
  const params = new URLSearchParams({
    age_group: ageGroup,
    topic: topic || "all",
    author_hash: identity.hash,
  });

  const res = await fetch(`/api/community/posts?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
  return await res.json();
}

export async function fetchPostDetail(postId, ageGroup = "adult") {
  const identity = await getCommunityIdentity();
  const params = new URLSearchParams({
    id: postId,
    age_group: ageGroup,
    author_hash: identity.hash,
  });

  const res = await fetch(`/api/community/post-detail?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load post (${res.status})`);
  return await res.json();
}

export async function createCommunityPost({ topic, title, content, ageGroup = "adult" }) {
  const identity = await getCommunityIdentity();
  const res = await fetch("/api/community/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author_alias: identity.alias,
      author_hash: identity.hash,
      age_group: ageGroup,
      topic,
      title,
      content,
    }),
  });

  return await res.json();
}

export async function createCommunityReply({ postId, content }) {
  const identity = await getCommunityIdentity();
  const res = await fetch("/api/community/replies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      post_id: postId,
      author_alias: identity.alias,
      author_hash: identity.hash,
      content,
    }),
  });

  return await res.json();
}

export async function reportCommunityTarget({ targetType, targetId, reason }) {
  const identity = await getCommunityIdentity();
  const res = await fetch("/api/community/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_type: targetType,
      target_id: targetId,
      reason,
      reporter_hash: identity.hash,
    }),
  });

  return await res.json();
}

export async function deleteAllCommunityData() {
  const identity = await getCommunityIdentity();
  const res = await fetch("/api/community/delete-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author_hash: identity.hash,
      author_secret: identity.secret,
    }),
  });

  return await res.json();
}
