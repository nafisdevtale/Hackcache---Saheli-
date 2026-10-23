import { describe, it, expect, beforeEach } from "vitest";
import { redactPII, handleCommunityRequest, resetCommunityStore } from "../server/api/community";

describe("Saheli Safe Pseudonymous Community", () => {
  beforeEach(() => {
    process.env.COMMUNITY_MOCK_STORE = "true";
    process.env.MODERATOR_SECRET = "test-secret-123";
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

  it("strictly disables the online teen community under DPDP Act Section 9", async () => {
    // Attempting to fetch under-18 feed returns disabled status
    const teenReq = new Request("http://localhost/api/community/posts?age_group=under18");
    const teenRes = await handleCommunityRequest(teenReq);
    const teenData = await teenRes.json();
    expect(teenData.ok).toBe(true);
    expect(teenData.disabled).toBe(true);
    expect(teenData.posts).toHaveLength(0);
    expect(teenData.reason).toContain("DPDP Act 2023 Section 9");

    // Attempting to post to under-18 space returns 403 Forbidden
    const createTeenPostReq = new Request("http://localhost/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_alias: "Saheli 1234",
        author_hash: "teen-hash",
        age_group: "under18",
        topic: "first_period",
        title: "Teen Question",
        content: "Trying to post to teen forum",
      }),
    });
    const createTeenRes = await handleCommunityRequest(createTeenPostReq);
    expect(createTeenRes.status).toBe(403);
    const createTeenData = await createTeenRes.json();
    expect(createTeenData.disabled).toBe(true);
  });

  it("enforces abuse rate limits on post creation (max 3 posts per 10 minutes)", async () => {
    const authorHash = "rate-limit-test-hash-" + Date.now();

    for (let i = 0; i < 3; i++) {
      const res = await handleCommunityRequest(
        new Request("http://localhost/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_alias: "Saheli 9999",
            author_hash: authorHash,
            age_group: "adult",
            topic: "general",
            title: `Post ${i}`,
            content: `Content ${i}`,
          }),
        }),
      );
      expect(res.status).toBe(201);
    }

    // 4th attempt should be blocked with 429 Rate Limit
    const blockedRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli 9999",
          author_hash: authorHash,
          age_group: "adult",
          topic: "general",
          title: "Post 4",
          content: "Should be blocked",
        }),
      }),
    );
    expect(blockedRes.status).toBe(429);
    const blockedData = await blockedRes.json();
    expect(blockedData.error).toContain("Rate limit reached");
  });

  it("prevents duplicate reports from the same reporter hash (HTTP 409)", async () => {
    // Create a post
    const createRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli 5555",
          author_hash: "author-report-target",
          age_group: "adult",
          topic: "cycles",
          title: "Post to report",
          content: "Report content",
        }),
      }),
    );
    const createData = await createRes.json();
    const postId = createData.post.id;

    // First report succeeds
    const rep1 = await handleCommunityRequest(
      new Request("http://localhost/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "post",
          target_id: postId,
          reason: "Spam",
          reporter_hash: "same-reporter-1",
        }),
      }),
    );
    expect(rep1.status).toBe(200);

    // Duplicate report by same reporter returns 409 Conflict
    const rep2 = await handleCommunityRequest(
      new Request("http://localhost/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "post",
          target_id: postId,
          reason: "Spam",
          reporter_hash: "same-reporter-1",
        }),
      }),
    );
    expect(rep2.status).toBe(409);
    const rep2Data = await rep2.json();
    expect(rep2Data.error).toContain("already submitted a report");
  });

  it("requires genuine moderator authentication and rejects invalid or missing tokens", async () => {
    // Missing token
    const noTokenRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/moderation/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "post",
          target_id: "demo-adult-1",
          action: "approved",
        }),
      }),
    );
    expect(noTokenRes.status).toBe(401);

    // Invalid token
    const wrongTokenRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/moderation/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-moderator-token": "wrong-secret",
        },
        body: JSON.stringify({
          target_type: "post",
          target_id: "demo-adult-1",
          action: "approved",
        }),
      }),
    );
    expect(wrongTokenRes.status).toBe(401);

    // Valid token succeeds
    const validRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/moderation/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-moderator-token": "test-secret-123",
        },
        body: JSON.stringify({
          target_type: "post",
          target_id: "demo-adult-1",
          action: "approved",
        }),
      }),
    );
    expect(validRes.status).toBe(200);
  });

  it("supports delete-all-my-data to wipe all posts published from a device identifier", async () => {
    const testHash = "author-wipe-test-" + Date.now();

    await handleCommunityRequest(
      new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli 7777",
          author_hash: testHash,
          age_group: "adult",
          topic: "cycles",
          title: "Post to Wipe",
          content: "Content",
        }),
      }),
    );

    const deleteRes = await handleCommunityRequest(
      new Request("http://localhost/api/community/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_hash: testHash }),
      }),
    );
    const deleteData = await deleteRes.json();
    expect(deleteData.ok).toBe(true);
    expect(deleteData.deleted.posts).toBe(1);
  });
});
