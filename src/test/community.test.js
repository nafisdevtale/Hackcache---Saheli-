import { describe, it, expect, beforeEach } from "vitest";
import { redactPII, handleCommunityRequest, resetCommunityStore } from "../server/api/community";

describe("Saheli Safe Pseudonymous Community", () => {
  beforeEach(() => {
    resetCommunityStore(true);
  });

  it("redacts Indian mobile numbers, emails, and external URLs", () => {
    const raw =
      "Call me at 9876543210 or email test.user@example.com or visit https://spam-site.com";
    const cleaned = redactPII(raw);
    expect(cleaned).not.toContain("9876543210");
    expect(cleaned).not.toContain("test.user@example.com");
    expect(cleaned).not.toContain("https://spam-site.com");
    expect(cleaned).toContain("[phone hidden]");
    expect(cleaned).toContain("[email hidden]");
    expect(cleaned).toContain("[link hidden]");
  });

  it("enforces strict age separation between adult and under18 feeds", async () => {
    // Adult feed query
    const adultReq = new Request("http://localhost/api/community/posts?age_group=adult");
    const adultRes = await handleCommunityRequest(adultReq);
    const adultData = await adultRes.json();
    expect(adultData.ok).toBe(true);
    expect(adultData.posts.length).toBeGreaterThan(0);
    expect(adultData.posts.every((p) => p.age_group === "adult")).toBe(true);

    // Under-18 feed query
    const teenReq = new Request("http://localhost/api/community/posts?age_group=under18");
    const teenRes = await handleCommunityRequest(teenReq);
    const teenData = await teenRes.json();
    expect(teenData.ok).toBe(true);
    expect(teenData.posts.length).toBeGreaterThan(0);
    expect(teenData.posts.every((p) => p.age_group === "under18")).toBe(true);

    // Cross-age isolation check: no adult posts in teen feed
    const teenTitles = teenData.posts.map((p) => p.title);
    expect(adultData.posts.some((ap) => teenTitles.includes(ap.title))).toBe(false);
  });

  it("queues newly created posts as pending and excludes them from public feed until approved", async () => {
    const createReq = new Request("http://localhost/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_alias: "Saheli 9999",
        author_hash: "test-author-hash-123",
        age_group: "adult",
        topic: "cycles",
        title: "Testing Moderation Queue",
        content: "This post should start in pending status.",
      }),
    });
    const createRes = await handleCommunityRequest(createReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.ok).toBe(true);
    expect(createData.post.status).toBe("pending");

    // Public feed (without author_hash) should NOT show pending post
    const publicReq = new Request("http://localhost/api/community/posts?age_group=adult");
    const publicRes = await handleCommunityRequest(publicReq);
    const publicData = await publicRes.json();
    expect(publicData.posts.some((p) => p.title === "Testing Moderation Queue")).toBe(false);

    // Author feed (with author_hash) SHOULD show their pending post
    const authorReq = new Request(
      "http://localhost/api/community/posts?age_group=adult&author_hash=test-author-hash-123",
    );
    const authorRes = await handleCommunityRequest(authorReq);
    const authorData = await authorRes.json();
    expect(authorData.posts.some((p) => p.title === "Testing Moderation Queue")).toBe(true);
  });

  it("auto-flags and hides a post when 3 reports are submitted", async () => {
    // Submit a post
    const createReq = new Request("http://localhost/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_alias: "Saheli 1111",
        author_hash: "abusive-author",
        age_group: "adult",
        topic: "general",
        title: "Flag Test Post",
        content: "Testing reporting auto-flag",
      }),
    });
    const createRes = await handleCommunityRequest(createReq);
    const createData = await createRes.json();
    const postId = createData.post.id;

    // Approve it via moderation decision
    const modReq = new Request("http://localhost/api/community/moderation/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_type: "post",
        target_id: postId,
        action: "approved",
      }),
    });
    await handleCommunityRequest(modReq);

    // Verify it is in public feed
    let feedRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/posts?age_group=adult"),
    );
    let feedData = await feedRes.json();
    expect(feedData.posts.some((p) => p.id === postId)).toBe(true);

    // Submit 3 reports
    for (let i = 0; i < 3; i++) {
      const repReq = new Request("http://localhost/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "post",
          target_id: postId,
          reason: "Spam",
          reporter_hash: `rep-${i}`,
        }),
      });
      await handleCommunityRequest(repReq);
    }

    // Verify post is now flagged and hidden from public feed
    feedRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/posts?age_group=adult"),
    );
    feedData = await feedRes.json();
    expect(feedData.posts.some((p) => p.id === postId)).toBe(false);
  });

  it("supports delete-all-my-data to wipe all posts and replies by device author_hash", async () => {
    const testHash = "author-to-wipe-" + Date.now();

    // Create a post
    await handleCommunityRequest(
      new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli 7777",
          author_hash: testHash,
          age_group: "adult",
          topic: "cycles",
          title: "My Personal Post",
          content: "Content to wipe",
        }),
      }),
    );

    // Wipe all
    const deleteReq = new Request("http://localhost/api/community/delete-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_hash: testHash }),
    });
    const deleteRes = await handleCommunityRequest(deleteReq);
    const deleteData = await deleteRes.json();
    expect(deleteData.ok).toBe(true);
    expect(deleteData.deleted.posts).toBe(1);

    // Confirm post is gone even for author query
    const checkRes = await handleCommunityRequest(
      new Request(`http://localhost/api/community/posts?age_group=adult&author_hash=${testHash}`),
    );
    const checkData = await checkRes.json();
    expect(checkData.posts.some((p) => p.title === "My Personal Post")).toBe(false);
  });
});
