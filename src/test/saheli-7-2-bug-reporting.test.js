import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  sanitizeFeedbackData,
  formatFeedbackAsText,
  recordSubmittedReport,
  getSubmittedReports,
} from "@/lib/feedbackClient.js";
import {
  handleFeedbackRequest,
  reloadFeedbackStoreFromDisk,
  resetFeedbackStore,
  resetRateLimits,
} from "@/server/api/feedback.ts";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("Saheli 7.2 — In-App Bug Reporting & Feedback Center", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRateLimits();
  });

  afterEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    resetFeedbackStore(true);
  });

  describe("Client Privacy & Sanitization", () => {
    it("sanitizes payload and excludes personal period records", () => {
      const rawReport = {
        title: "  Calculation issue in cycle  ",
        description: "  Describing what happened during tracking  ",
        stepsToReproduce: "1. Step one\n2. Step two",
        expectedBehaviour: "Smooth transition",
        actualBehaviour: "Lag noticed",
        contact: "user@example.com",
        category: "bug",
        severity: "medium",
        consent: true,
      };

      const sanitized = sanitizeFeedbackData(rawReport);
      expect(sanitized.title).toBe("Calculation issue in cycle");
      expect(sanitized.description).toBe("Describing what happened during tracking");
      expect(sanitized.contact).toBe("user@example.com");
      expect(sanitized.appVersion).toBe("7.2.0");
      expect(sanitized.consent).toBe(true);
      // Health diary data must be undefined
      expect(sanitized.days).toBeUndefined();
      expect(sanitized.notes).toBeUndefined();
    });

    it("saves and loads draft accurately without leakage", () => {
      expect(loadDraft().title).toBe("");

      const draft = {
        category: "translation",
        severity: "low",
        title: "Translation typo in Hindi calendar",
        description: "The word for month header has a typo on mobile screen.",
        stepsToReproduce: "1. Switch to Hindi\n2. Open Calendar",
        expectedBehaviour: "Correct spelling",
        actualBehaviour: "Typo present",
        contact: "tester@example.com",
      };

      saveDraft(draft);
      const loaded = loadDraft();
      expect(loaded).not.toBeNull();
      expect(loaded.title).toBe(draft.title);
      expect(loaded.category).toBe("translation");

      clearDraft();
      expect(loadDraft().title).toBe("");
    });

    it("formats text export cleanly for offline transmission fallback", () => {
      const report = {
        category: "cycle_calculation",
        severity: "high",
        title: "Cycle length calculation discrepancy",
        description: "Editing a past period shifts average unexpectedly.",
        stepsToReproduce: "1. Open Calendar\n2. Edit period date\n3. Check Insights",
        expectedBehaviour: "Average cycle length recalculates smoothly",
        actualBehaviour: "Average cycle jumps erratically",
        contact: "dev@saheli.app",
        consent: true,
      };

      const text = formatFeedbackAsText(report);
      expect(text).toContain("=== SAHELI BUG REPORT & FEEDBACK ===");
      expect(text).toContain("Category: cycle_calculation");
      expect(text).toContain("Severity: high");
      expect(text).toContain("Cycle length calculation discrepancy");
      expect(text).toContain(
        "User has consented to transmission. Health records, cycle dates, and encryption secrets were strictly excluded.",
      );
    });

    it("stores and retrieves submitted report acknowledgments", () => {
      expect(getSubmittedReports()).toEqual([]);

      recordSubmittedReport({
        id: "REP-12345-ABCDEF",
        title: "Calendar glitch",
        category: "bug",
        createdAt: new Date().toISOString(),
        status: "received",
      });

      const list = getSubmittedReports();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe("REP-12345-ABCDEF");
      expect(list[0].title).toBe("Calendar glitch");
    });
  });

  describe("Server API & Validation (/api/feedback)", () => {
    it("rejects submissions without user consent", async () => {
      const req = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          severity: "low",
          title: "Valid title",
          description: "Detailed description of the issue occurring here.",
          consent: false,
        }),
      });

      const res = await handleFeedbackRequest(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error).toBe("Explicit consent is required to transmit the feedback report.");
    });

    it("rejects submissions with too short title or description", async () => {
      const shortTitleReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          severity: "low",
          title: "ab",
          description: "This is long enough for a description.",
          consent: true,
        }),
      });
      const res1 = await handleFeedbackRequest(shortTitleReq);
      expect(res1.status).toBe(400);
      const json1 = await res1.json();
      expect(json1.error).toBe("Title must be between 3 and 150 characters");

      const shortDescReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          severity: "low",
          title: "Proper title",
          description: "Too short",
          consent: true,
        }),
      });
      const res2 = await handleFeedbackRequest(shortDescReq);
      expect(res2.status).toBe(400);
      const json2 = await res2.json();
      expect(json2.error).toBe("Description must be between 10 and 3000 characters");
    });

    it("rejects invalid categories or severities", async () => {
      const badCatReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "unsupportedCategory",
          severity: "low",
          title: "Valid title",
          description: "Valid long description for testing error cases.",
          consent: true,
        }),
      });
      const res = await handleFeedbackRequest(badCatReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid issue category selected");
    });

    it("rejects invalid screenshot payloads", async () => {
      const badImgReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bug",
          severity: "medium",
          title: "Valid title",
          description: "Valid long description for testing screenshot validation.",
          consent: true,
          screenshotBase64: "data:application/pdf;base64,JVBERi0xLjQK...",
        }),
      });
      const res = await handleFeedbackRequest(badImgReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid screenshot format. Only PNG/JPEG/WebP are supported.");
    });

    it("accepts valid reports, generates real acknowledgment ID and allows status queries", async () => {
      const validReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.100",
        },
        body: JSON.stringify({
          category: "accessibility",
          severity: "medium",
          title: "Contrast issue on dark mode toggle button",
          description:
            "When high contrast mode is active, the toggle button outline is hard to distinguish.",
          stepsToReproduce: "1. Enable high contrast in Settings\n2. View Today header toggle",
          expectedBehaviour: "Bold outline around toggle button",
          actualBehaviour: "Faint border with low ratio",
          contact: "tester@saheli.local",
          consent: true,
          appVersion: "7.2.0",
        }),
      });

      const res = await handleFeedbackRequest(validReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.reportId).toMatch(/^REP-\d+-[A-Z0-9]+$/);

      // Query status via handleFeedbackRequest with GET
      const statusReq = new Request(`http://localhost/api/feedback/status?id=${json.reportId}`);
      const statusRes = await handleFeedbackRequest(statusReq);
      expect(statusRes.status).toBe(200);
      const statusJson = await statusRes.json();
      expect(statusJson.ok).toBe(true);
      expect(statusJson.status).toBe("received");
      expect(statusJson.reportId).toBe(json.reportId);
    });

    it("persists feedback reports across simulated server reloads", async () => {
      const submitReq = new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "translation",
          severity: "low",
          title: "Durable persistence test report",
          description: "Verifying report survives server restarts via disk storage.",
          consent: true,
        }),
      });

      const res = await handleFeedbackRequest(submitReq);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const savedId = json.reportId;

      // Simulate server reboot by clearing in-memory state and reloading from disk
      resetFeedbackStore(false); // clear memory only
      const reloadedStore = reloadFeedbackStoreFromDisk();
      expect(reloadedStore.has(savedId)).toBe(true);

      const statusReq = new Request(`http://localhost/api/feedback/status?id=${savedId}`);
      const statusRes = await handleFeedbackRequest(statusReq);
      expect(statusRes.status).toBe(200);
      const statusJson = await statusRes.json();
      expect(statusJson.reportId).toBe(savedId);
    });

    it("requires maintainer authorization key for GET /api/feedback/reports", async () => {
      // 1. Missing authorization
      const unauthReq = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
      });
      const unauthRes = await handleFeedbackRequest(unauthReq);
      expect(unauthRes.status).toBe(401);
      const unauthJson = await unauthRes.json();
      expect(unauthJson.ok).toBe(false);

      // 2. Invalid authorization
      const wrongKeyReq = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
        headers: { "x-maintainer-key": "invalid-secret" },
      });
      const wrongKeyRes = await handleFeedbackRequest(wrongKeyReq);
      expect(wrongKeyRes.status).toBe(401);

      // 3. Authorized request with valid maintainer key
      const authReq = new Request("http://localhost/api/feedback/reports", {
        method: "GET",
        headers: { "x-maintainer-key": "saheli-dev-maintainer-key-2026" },
      });
      const authRes = await handleFeedbackRequest(authReq);
      expect(authRes.status).toBe(200);
      const authJson = await authRes.json();
      expect(authJson.ok).toBe(true);
      expect(Array.isArray(authJson.reports)).toBe(true);
      expect(authJson.count).toBe(authJson.reports.length);
    });
  });
});
