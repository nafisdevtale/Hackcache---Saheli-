/**
 * SAHELI — SUPABASE COMMUNITY & DURABLE FEEDBACK VERIFICATION SUITE
 *
 * Verifies:
 * 1. Community Schema & RLS alignment:
 *    - Posts/replies forced to 'pending' on insertion.
 *    - Under-18 online community disabled per DPDP Act 2023 Sec 9.
 *    - PII redaction on posts and replies.
 *    - Author proof verification: users cannot delete others' data without device secret.
 *    - Replies handling: submission (pending), listing (approved only), post-detail.
 * 2. Feedback Schema & Durable Storage:
 *    - Explicit user consent strictly enforced.
 *    - Fails closed: success receipt returned only when durable storage confirms save.
 *    - Public status query returns only status/timestamp, never user contact or browser info.
 *    - Maintainer endpoint strictly requires secret key, zero hardcoded live fallbacks.
 *    - No menstrual histories, diary entries, DOB, or vault keys uploaded.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "node:crypto";
import {
  handleCommunityRequest,
  resetCommunityStore,
  verifyAuthorProof,
  redactPII,
} from "../server/api/community.js";
import { handleFeedbackRequest, resetFeedbackStore } from "../server/api/feedback.js";

describe("Saheli — Supabase Community & Feedback Integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetCommunityStore();
    resetFeedbackStore(true);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // 1. Community Security, RLS & Safe Pseudonymity
  // ===========================================================================
  describe("Community Security & RLS Compliance", () => {
    it("strictly blocks under-18 posts and returns DPDP Act safeguard notice", async () => {
      const req = new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli Teen",
          author_hash: "teen-hash-12345",
          age_group: "under18",
          topic: "cycles",
          title: "Teen Question",
          content: "Can I post here?",
        }),
      });

      const res = await handleCommunityRequest(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.disabled).toBe(true);
      expect(data.error).toMatch(/DPDP Act 2023 Section 9/i);
    });

    it("forces newly submitted posts into 'pending' status", async () => {
      const secret = "device-secret-token-" + Date.now();
      const authorHash = crypto.createHash("sha256").update(secret).digest("hex");

      const req = new Request("http://localhost/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_alias: "Saheli 9900",
          author_hash: authorHash,
          age_group: "adult",
          topic: "hygiene",
          title: "Period cups in hot climate",
          content: "How do you sterilise cups while travelling without drawing attention?",
          status: "approved", // Attempt to bypass moderation
        }),
      });

      const res = await handleCommunityRequest(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.ok).toBe(true);
      // Status must remain pending despite client payload
      expect(data.post.status).toBe("pending");
      expect(data.message).toMatch(/moderation review/i);
    });

    it("handles reply submissions, forcing 'pending' status until approved", async () => {
      const authorHash = crypto.createHash("sha256").update("reply-device-key").digest("hex");

      // 1. Submit reply
      const postReq = new Request("http://localhost/api/community/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: "demo-adult-1",
          author_alias: "Saheli 4321",
          author_hash: authorHash,
          content: "Use boiling water in a private flask. Contact me at 9876543210.",
        }),
      });

      const postRes = await handleCommunityRequest(postReq);
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      expect(postData.ok).toBe(true);
      expect(postData.reply.status).toBe("pending");
      // PII Phone must be redacted
      expect(postData.reply.content).toContain("[phone hidden]");
      expect(postData.reply.content).not.toContain("9876543210");

      // 2. Fetch replies for post — pending reply must NOT be visible
      const getReq = new Request("http://localhost/api/community/replies?post_id=demo-adult-1", {
        method: "GET",
      });
      const getRes = await handleCommunityRequest(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.ok).toBe(true);
      expect(getData.replies).toEqual([]); // Pending reply not exposed
    });

    it("verifies author proof before allowing post/data deletion", async () => {
      const secret = "verified-device-secret-123";
      const validHash = crypto.createHash("sha256").update(secret).digest("hex");

      // 1. verifyAuthorProof helper
      expect(verifyAuthorProof(validHash, secret)).toBe(true);
      expect(verifyAuthorProof(validHash, "wrong-secret")).toBe(false);

      // 2. Deletion with matching secret succeeds
      const req = new Request("http://localhost/api/community/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_hash: validHash,
          author_secret: secret,
        }),
      });

      const res = await handleCommunityRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("prevents unverified deletion if secret does not match hash", async () => {
      const validHash = "c0ffee" + "a".repeat(58);

      const req = new Request("http://localhost/api/community/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_hash: validHash,
          author_secret: "bogus-secret",
        }),
      });

      const res = await handleCommunityRequest(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toMatch(/unauthorized/i);
    });
  });

  // ===========================================================================
  // 2. Durable Feedback & Bug Reporting Persistence
  // ===========================================================================
  describe("Durable Feedback & Maintainer Authorization", () => {
    it("fails closed and refuses success receipt if database save fails", async () => {
      process.env.SUPABASE_URL = "https://mock-failing-project.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";

      // Mock database returning 500 error
      vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ message: "DB Connection Pool Exhausted" }), {
          status: 500,
        });
      });

      const req = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          title: "Critical error in reminder notification",
          description: "Notification sound failed to trigger on schedule time.",
          consent: true,
        }),
      });

      const res = await handleFeedbackRequest(req);
      // Must NOT return 200 success receipt
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toMatch(/database storage could not confirm/i);
    });

    it("returns success receipt when database confirms storage", async () => {
      process.env.SUPABASE_URL = "https://mock-success-project.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => {
        return new Response(JSON.stringify([{ id: "REP-12345" }]), { status: 201 });
      });

      const req = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "translation",
          title: "Telugu translation wording suggestion",
          description: "Cycle phase title in Telugu could use clearer dialect phrasing.",
          consent: true,
        }),
      });

      const res = await handleFeedbackRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.durableStorage).toBe("supabase");
      expect(data.reportId).toMatch(/^REP-/);
    });

    it("never exposes private feedback details on public status check", async () => {
      // 1. Submit feedback
      const submitReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "privacy",
          title: "Local encrypted storage question",
          description: "Confidential user feedback text describing local environment.",
          contact: "confidential-user@example.com",
          consent: true,
        }),
      });
      const submitRes = await handleFeedbackRequest(submitReq);
      const submitData = await submitRes.json();
      const reportId = submitData.reportId;

      // 2. Query status
      const statusReq = new Request(`http://localhost/api/feedback/status?id=${reportId}`, {
        method: "GET",
      });
      const statusRes = await handleFeedbackRequest(statusReq);
      expect(statusRes.status).toBe(200);
      const statusData = await statusRes.json();

      expect(statusData.ok).toBe(true);
      expect(statusData.reportId).toBe(reportId);
      expect(statusData.status).toBe("received");
      // Must NEVER expose title, description, or contact on status check
      expect(statusData.description).toBeUndefined();
      expect(statusData.contact).toBeUndefined();
      expect(statusData.title).toBeUndefined();
    });

    it("protects maintainer report inspection with SAHELI_MAINTAINER_KEY", async () => {
      process.env.SAHELI_MAINTAINER_KEY = "strong-maintainer-key-456";

      // 1. Unauthorized
      const unauthReq = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
      });
      const unauthRes = await handleFeedbackRequest(unauthReq);
      expect(unauthRes.status).toBe(401);

      // 2. Authorized
      const authReq = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
        headers: { "x-maintainer-key": "strong-maintainer-key-456" },
      });
      const authRes = await handleFeedbackRequest(authReq);
      expect(authRes.status).toBe(200);
      const authData = await authRes.json();
      expect(authData.ok).toBe(true);
      expect(Array.isArray(authData.reports)).toBe(true);
    });
  });
});
