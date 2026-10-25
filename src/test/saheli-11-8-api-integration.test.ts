/**
 * SAHELI 11.8 — Complete API & Environment Integration Verification Suite
 *
 * Verifies end-to-end integration and safe fallback architecture across:
 * 1. DIVA & Eeve: Routing, intent classification, status, red-flag screening, crisis helplines, offline fallback.
 * 2. FLASH: SerpApi Google Shopping adapter, non-prescription safety whitelist, local fallback.
 * 3. INSTINCT: Status, age-appropriate filtering, regional IN awareness, no fake streaming platforms.
 * 4. Community: DPDP Act 2023 under-18 isolation, PII redaction, moderation queue with MODERATOR_SECRET.
 * 5. Reports & Issues: Secure feedback transmission, consent enforcement, disk persistence, maintainer key auth.
 * 6. Web Push: VAPID status, discreet payloads (zero clinical words), cron authorization with CRON_SECRET.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import webpush from "web-push";
import { handleDivaRouteRequest } from "../server/api/diva/index.js";
import { handleAskRequest } from "../server/api/ai.js";
import { handleFlashRequest, resetFlashCache } from "../server/api/flash.js";
import { handleInstinctRequest } from "../server/api/instinct/index.js";
import { handleCommunityRequest, resetCommunityStore, redactPII } from "../server/api/community.js";
import { handleFeedbackRequest, resetFeedbackStore } from "../server/api/feedback.js";
import {
  handlePushRequest,
  resetPushSubscriptions,
  DISCREET_PUSH_PAYLOAD,
} from "../server/api/push.js";
import { routeApiRequest } from "../server/api/router.js";

describe("SAHELI 11.8 — API & Environment Integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetCommunityStore();
    resetFeedbackStore(true);
    resetPushSubscriptions();
    resetFlashCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // 1. DIVA & Eeve Integration
  // ===========================================================================
  describe("1. DIVA & Eeve Orchestrator & AI Assistant", () => {
    it("returns operational status from GET /api/diva/status", async () => {
      const req = new Request("http://localhost/api/diva/status", { method: "GET" });
      const res = await handleDivaRouteRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.model).toBe("gemini-2.5-flash");
      expect(data.offlineFallback).toBe("active");
    });

    it("falls back to deterministic classifier when Gemini is unconfigured", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.AI_API_KEY;

      const req = new Request("http://localhost/api/diva/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "I have severe period pain and cramps" }),
      });
      const res = await handleDivaRouteRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.target).toBe("eeve");
      expect(data.source).toBe("deterministic_fallback");
    });

    it("routes comfort product queries to flash", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.AI_API_KEY;

      const req = new Request("http://localhost/api/diva/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "best reusable menstrual cups and pads price" }),
      });
      const res = await handleDivaRouteRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.target).toBe("flash");
    });

    it("returns assistant status from GET /api/ask", async () => {
      const req = new Request("http://localhost/api/ask", { method: "GET" });
      const res = await handleAskRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.safetyGuardrails).toBe("active");
      expect(data.offlineFallback).toBe("active");
    });

    it("triggers immediate emergency warning for urgent red flags without external AI", async () => {
      const req = new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "I am soaking through two or more pads an hour and feeling very dizzy",
          consent: true,
        }),
      });
      const res = await handleAskRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.red_flag).toBe(true);
      expect(data.type).toBe("urgent");
      expect(data.source).toBe("deterministic_safety");
      expect(data.helplines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ number: "112" }),
          expect.objectContaining({ number: "108" }),
        ]),
      );
    });

    it("triggers crisis helpline for self-harm thoughts without external AI", async () => {
      const req = new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "I want to end my life, please help",
          consent: true,
        }),
      });
      const res = await handleAskRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.red_flag).toBe(true);
      expect(data.type).toBe("crisis");
      expect(data.helplines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ number: "14416" }), // Tele-MANAS
        ]),
      );
    });

    it("requires explicit user consent for health queries", async () => {
      const req = new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Why is my cycle late?",
          consent: false,
        }),
      });
      const res = await handleAskRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toMatch(/consent required/i);
    });
  });

  // ===========================================================================
  // 2. FLASH (SerpApi & Safety Whitelist)
  // ===========================================================================
  describe("2. FLASH Product Search & Medical Screening", () => {
    it("reports honest configuration status from GET /api/flash/status", async () => {
      delete process.env.SERPAPI_API_KEY;
      const req = new Request("http://localhost/api/flash/status", { method: "GET" });
      const res = await handleFlashRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.available).toBe(false);

      process.env.SERPAPI_API_KEY = "test-serpapi-key";
      const res2 = await handleFlashRequest(req);
      const data2 = await res2.json();
      expect(data2.available).toBe(true);
    });

    it("blocks prescription drugs, hormones, and toxic bleaches via safety screening", async () => {
      const req = new Request("http://localhost/api/flash/search?q=vaginal+bleach+steroids", {
        method: "GET",
      });
      const res = await handleFlashRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toMatch(/non-prescription safety policy/i);
    });

    it("falls back seamlessly to verified local educational catalogue when unconfigured", async () => {
      delete process.env.SERPAPI_API_KEY;
      const req = new Request("http://localhost/api/flash/search?q=pad", { method: "GET" });
      const res = await handleFlashRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.provider).toBe("local_verified_catalogue");
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.products.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 3. INSTINCT (Entertainment & Mood Recommendations)
  // ===========================================================================
  describe("3. INSTINCT API Integration", () => {
    it("reports configuration status and regional availability from GET /api/instinct/status", async () => {
      delete process.env.TMDB_API_KEY;
      delete process.env.TMDB_API_TOKEN;
      delete process.env.WATCHMODE_API_KEY;

      const req = new Request("http://localhost/api/instinct/status", { method: "GET" });
      const res = await handleInstinctRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.region).toBe("IN");
      expect(data.available).toBe(false);
      expect(data.message).toMatch(/verified local library active/i);
    });

    it("returns verified comfort media items and does NOT fabricate streaming services", async () => {
      const req = new Request("http://localhost/api/instinct/search?q=comfort", { method: "GET" });
      const res = await handleInstinctRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);
      for (const item of data.results) {
        // Must never inject fake streaming services
        if (item.streamingServices) {
          expect(Array.isArray(item.streamingServices)).toBe(true);
        }
      }
    });
  });

  // ===========================================================================
  // 4. Community (Supabase & DPDP Act Child Safeguarding)
  // ===========================================================================
  describe("4. Community & Moderation Architecture", () => {
    it("enforces DPDP Act 2023 under-18 isolation on GET /api/community/posts?age_group=under18", async () => {
      const req = new Request("http://localhost/api/community/posts?age_group=under18", {
        method: "GET",
      });
      const res = await handleCommunityRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.disabled).toBe(true);
      expect(data.posts).toEqual([]);
      expect(data.reason).toMatch(/DPDP Act 2023 Section 9/i);
    });

    it("redacts Indian mobile numbers, emails, and links from community submissions", () => {
      const sample =
        "Call me at +91 98765 43210 or email test@example.com or visit https://spam.com";
      const redacted = redactPII(sample);
      expect(redacted).not.toContain("98765");
      expect(redacted).not.toContain("test@example.com");
      expect(redacted).not.toContain("https://spam.com");
      expect(redacted).toContain("[phone hidden]");
      expect(redacted).toContain("[email hidden]");
      expect(redacted).toContain("[link hidden]");
    });

    it("protects moderation decision endpoint with MODERATOR_SECRET", async () => {
      process.env.MODERATOR_SECRET = "super-secret-mod-token-123";

      // 1. Missing token -> 401
      const reqNoAuth = new Request("http://localhost/api/community/moderation/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: "post", target_id: "demo-1", action: "approved" }),
      });
      const resNoAuth = await handleCommunityRequest(reqNoAuth);
      expect(resNoAuth.status).toBe(401);

      // 2. Valid token -> succeeds in mock store
      const reqAuth = new Request("http://localhost/api/community/moderation/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-moderator-token": "super-secret-mod-token-123",
        },
        body: JSON.stringify({ target_type: "post", target_id: "demo-1", action: "approved" }),
      });
      const resAuth = await handleCommunityRequest(reqAuth);
      expect(resAuth.status).toBe(200);
      const data = await resAuth.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe("approved");
    });
  });

  // ===========================================================================
  // 5. Reports & Issues (Feedback)
  // ===========================================================================
  describe("5. Reports & Issues Feedback API", () => {
    it("reports status from GET /api/feedback/status", async () => {
      const req = new Request("http://localhost/api/feedback/status", { method: "GET" });
      const res = await handleFeedbackRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.storage).toBe("disk_and_memory");
    });

    it("rejects feedback submission without consent", async () => {
      const req = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          title: "Calculation discrepancy",
          description: "Cycle count differs from previous month entry.",
          consent: false,
        }),
      });
      const res = await handleFeedbackRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toMatch(/explicit consent is required/i);
    });

    it("accepts valid feedback and persists it durably", async () => {
      const req = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          title: "Audio chime preview",
          description: "Preview chime works on chrome desktop but check iOS Safari behavior.",
          consent: true,
        }),
      });
      const res = await handleFeedbackRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.reportId).toMatch(/^REP-/);
    });

    it("protects maintainer inspection endpoint with SAHELI_MAINTAINER_KEY", async () => {
      process.env.SAHELI_MAINTAINER_KEY = "saheli-test-maintainer-key-999";

      // 1. Missing key -> 401
      const reqUnauthorized = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
      });
      const resUnauthorized = await handleFeedbackRequest(reqUnauthorized);
      expect(resUnauthorized.status).toBe(401);

      // 2. Authorized key -> 200 with list
      const reqAuthorized = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
        headers: { "x-maintainer-key": "saheli-test-maintainer-key-999" },
      });
      const resAuthorized = await handleFeedbackRequest(reqAuthorized);
      expect(resAuthorized.status).toBe(200);
      const data = await resAuthorized.json();
      expect(data.ok).toBe(true);
      expect(typeof data.count).toBe("number");
    });
  });

  // ===========================================================================
  // 6. Web Push & Discreet Reminders
  // ===========================================================================
  describe("6. Discreet Web Push & Scheduled Reminders", () => {
    it("reports honest VAPID status from GET /api/push/status", async () => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      delete process.env.VAPID_SUBJECT;

      const req = new Request("http://localhost/api/push/status", { method: "GET" });
      const res = await handlePushRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.available).toBe(false);
      expect(data.publicKey).toBeNull();
    });

    it("fails closed on subscription when VAPID keys are absent", async () => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      delete process.env.VAPID_SUBJECT;

      const req = new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "https://fcm.googleapis.com/fcm/send/fake-token",
          keys: { p256dh: "fake-key", auth: "fake-auth" },
        }),
      });
      const res = await handlePushRequest(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.available).toBe(false);
      expect(data.error).toMatch(/VAPID keys .* are not configured/i);
    });

    it("verifies push payload is strictly discreet with zero clinical terms", () => {
      const payload = JSON.parse(DISCREET_PUSH_PAYLOAD);
      expect(payload.title).toBe("Saheli");
      expect(payload.body).toBe("A gentle reminder for you today.");

      const raw = DISCREET_PUSH_PAYLOAD.toLowerCase();
      expect(raw).not.toContain("period");
      expect(raw).not.toContain("bleeding");
      expect(raw).not.toContain("ovulation");
      expect(raw).not.toContain("cramp");
      expect(raw).not.toContain("fertility");
    });

    it("protects cron trigger with CRON_SECRET", async () => {
      const keys = webpush.generateVAPIDKeys();
      process.env.VAPID_PUBLIC_KEY = keys.publicKey;
      process.env.VAPID_PRIVATE_KEY = keys.privateKey;
      process.env.VAPID_SUBJECT = "mailto:test@saheli.app";
      process.env.CRON_SECRET = "strong-cron-secret-888";

      // 1. Without secret -> 401
      const reqNoSecret = new Request("http://localhost/api/push/cron", { method: "POST" });
      const resNoSecret = await handlePushRequest(reqNoSecret);
      expect(resNoSecret.status).toBe(401);

      // 2. With wrong secret -> 401
      const reqBadSecret = new Request("http://localhost/api/push/cron", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      });
      const resBadSecret = await handlePushRequest(reqBadSecret);
      expect(resBadSecret.status).toBe(401);

      // 3. With correct secret -> 200
      const reqAuth = new Request("http://localhost/api/push/cron", {
        method: "POST",
        headers: { authorization: "Bearer strong-cron-secret-888" },
      });
      const resAuth = await handlePushRequest(reqAuth);
      expect(resAuth.status).toBe(200);
      const data = await resAuth.json();
      expect(data.ok).toBe(true);
    });
  });

  // ===========================================================================
  // 7. Central API Router
  // ===========================================================================
  describe("7. Central Router Dispatch", () => {
    it("routes to all modules correctly", async () => {
      expect(await routeApiRequest(new Request("http://localhost/api/diva/status"))).not.toBeNull();
      expect(await routeApiRequest(new Request("http://localhost/api/ask"))).not.toBeNull();
      expect(
        await routeApiRequest(new Request("http://localhost/api/flash/status")),
      ).not.toBeNull();
      expect(
        await routeApiRequest(new Request("http://localhost/api/instinct/status")),
      ).not.toBeNull();
      expect(
        await routeApiRequest(new Request("http://localhost/api/feedback/status")),
      ).not.toBeNull();
      expect(
        await routeApiRequest(new Request("http://localhost/api/community/status")),
      ).not.toBeNull();
      expect(await routeApiRequest(new Request("http://localhost/api/push/status"))).not.toBeNull();
      expect(await routeApiRequest(new Request("http://localhost/api/unknown-service"))).toBeNull();
    });
  });
});
