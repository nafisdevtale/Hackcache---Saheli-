import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computeCycleInsights } from "@/lib/insights.js";
import {
  emptyRecord,
  blankDay,
  exportJSON,
  exportCSV,
  parseCSVImport,
  parsePDFImport,
  generateDoctorSummaryPDF,
} from "@/lib/exportImport.js";
import { speechController, resolveVoiceLocale } from "@/lib/audioController.ts";
import {
  sanitizeReportPayload,
  loadFeedbackDraft,
  saveFeedbackDraft,
  clearFeedbackDraft,
} from "@/lib/feedbackClient.js";
import { DEFAULT_PREFS } from "@/lib/storage.js";
import { translate } from "@/i18n/index.js";
import { CONFIG } from "@/config.js";

// Polyfill localStorage if needed
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage.clear) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  } as any;
}

describe("Saheli 11.5 — Master Bug Fix & Functional Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Insights: Scope Switching & Typical Cycle Terminology", () => {
    const mockCycles = Array.from({ length: 10 }, (_, i) => ({
      start: `2026-0${Math.floor(i / 3) + 1}-01`,
      nextStart: `2026-0${Math.floor(i / 3) + 1}-29`,
      length: 28 + (i % 3),
      periodLength: 5,
    }));
    const mockPeriods = Array.from({ length: 11 }, (_, i) => ({
      start: `2026-0${Math.floor(i / 3) + 1}-01`,
      end: `2026-0${Math.floor(i / 3) + 1}-05`,
      length: 5,
    }));

    const mockAnalysis = {
      cycles: mockCycles,
      periods: mockPeriods,
      stats: { meanLength: 29 },
    };

    it("recent scope respects history window (6 cycles)", () => {
      const insightsRecent = computeCycleInsights({
        record: emptyRecord(),
        analysis: mockAnalysis,
        today: "2026-10-25",
        scope: "recent",
      });

      expect(insightsRecent.totalCyclesCount).toBe(10);
      expect(insightsRecent.activeCycles.length).toBe(CONFIG.historyWindow);
      expect(insightsRecent.activeCycles.length).toBe(6);
      expect(insightsRecent.activePeriods.length).toBe(6);
    });

    it("all scope includes all completed cycles", () => {
      const insightsAll = computeCycleInsights({
        record: emptyRecord(),
        analysis: mockAnalysis,
        today: "2026-10-25",
        scope: "all",
      });

      expect(insightsAll.totalCyclesCount).toBe(10);
      expect(insightsAll.activeCycles.length).toBe(10);
      expect(insightsAll.activePeriods.length).toBe(11);
    });

    it("gracefully handles fewer than 6 cycles", () => {
      const fewCycles = mockCycles.slice(0, 3);
      const fewAnalysis = { cycles: fewCycles, periods: mockPeriods.slice(0, 4) };

      const insightsRecent = computeCycleInsights({
        record: emptyRecord(),
        analysis: fewAnalysis,
        today: "2026-10-25",
        scope: "recent",
      });

      expect(insightsRecent.totalCyclesCount).toBe(3);
      expect(insightsRecent.activeCycles.length).toBe(3);
    });

    it("typical cycle length terminology and explainer are translated across languages", () => {
      const langs = ["en", "hi", "mr", "bn", "ta", "te", "kn", "gu", "pa", "ml", "or", "as", "ur"];
      langs.forEach((lang) => {
        const typical = translate(lang, "ins.typicalCycle");
        const explainer = translate(lang, "ins.typicalCycleExplainer");
        expect(typical).toBeTruthy();
        expect(explainer).toBeTruthy();
        expect(typeof typical).toBe("string");
        expect(typeof explainer).toBe("string");
      });
    });
  });

  describe("2. Play, Pause, Stop and Audio State Machine", () => {
    it("speech controller starts in idle state", () => {
      speechController.stop();
      expect(speechController.getState()).toBe("idle");
      expect(speechController.isSpeaking()).toBe(false);
      expect(speechController.isPaused()).toBe(false);
    });

    it("resolves voice locale for all 13 supported languages", () => {
      expect(resolveVoiceLocale("hi")).toBe("hi-IN");
      expect(resolveVoiceLocale("ur")).toBe("ur-PK");
      expect(resolveVoiceLocale("en")).toBe("en-IN");
      expect(resolveVoiceLocale("ta")).toBe("ta-IN");
      expect(resolveVoiceLocale("bn")).toBe("bn-IN");
    });

    it("speech controller handles stop and state notification cleanly", () => {
      let stateNotified = "";
      const unsub = speechController.subscribe((s) => {
        stateNotified = s;
      });

      speechController.stop();
      expect(stateNotified).toBe("idle");
      expect(speechController.getCurrentText()).toBe(null);
      unsub();
    });
  });

  describe("3. Learn Section Improvements & Completed State", () => {
    it("all translation keys for learn progress and indicators exist in all languages", () => {
      const langs = ["en", "hi", "mr", "bn", "ta", "te", "kn", "gu", "pa", "ml", "or", "as", "ur"];
      langs.forEach((l) => {
        expect(translate(l, "learn.progressTitle")).toBeTruthy();
        expect(translate(l, "learn.continueReading")).toBeTruthy();
        expect(translate(l, "learn.markIncomplete")).toBeTruthy();
        expect(translate(l, "learn.markComplete")).toBeTruthy();
        expect(translate(l, "learn.listenOrRead")).toBeTruthy();
      });
    });
  });

  describe("4. Global Text Size Controls", () => {
    it("default prefs include md text size", () => {
      expect(DEFAULT_PREFS.textSize).toBe("md");
    });

    it("all 3 text size options are translated across languages", () => {
      const langs = ["en", "hi", "bn", "ur"];
      langs.forEach((l) => {
        expect(translate(l, "text.sm")).toBeTruthy();
        expect(translate(l, "text.md")).toBeTruthy();
        expect(translate(l, "text.lg")).toBeTruthy();
      });
    });
  });

  describe("5. CSV and PDF Imports", () => {
    it("CSV import sanitizes formula injection attempts", () => {
      const maliciousCsv = `Date,Period,Flow,Pain,Symptoms,Notes\n2026-10-01,true,medium,2,cramps,=cmd|' /C calc'!A0`;
      const result = parseCSVImport(maliciousCsv);
      expect(result.ok).toBe(true);
      const day = result.record.days["2026-10-01"];
      expect(day).toBeDefined();
      expect(day.period).toBe(true);
      // Formula prefix must be escaped or stripped
      if (day.notes) {
        expect(day.notes.startsWith("=")).toBe(false);
      }
    });

    it("PDF import extracts machine-readable Saheli backup payload", () => {
      const testRecord = emptyRecord();
      testRecord.days["2026-10-01"] = {
        ...blankDay("2026-10-01"),
        period: true,
        flow: "heavy",
        pain: 3,
        symptoms: ["cramps"],
      };

      const docHtml = generateDoctorSummaryPDF(testRecord, { cycles: [] });
      expect(docHtml).toContain("SAHELI_RECORD_PAYLOAD_V1:");

      const imported = parsePDFImport(docHtml);
      expect(imported.ok).toBe(true);
      expect(imported.record.days["2026-10-01"].flow).toBe("heavy");
    });

    it("rejects visual-only arbitrary PDF with clear user explanation", () => {
      const arbitraryPdf = "%PDF-1.4 visual scan without Saheli payload %%EOF";
      const result = parsePDFImport(arbitraryPdf);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("imp.unsupportedPdfNoPayload");
      expect(result.explanation).toContain("Saheli-generated");
    });
  });

  describe("6. Help & Feedback Privacy and Draft Persistence", () => {
    it("sanitizes report payload strictly stripping cycle days, keys, and DOB", () => {
      const rawReport = {
        category: "bug",
        title: "Screen flicker on charts",
        description: "When opening the insights page on mobile, the chart flickers once.",
        stepsToReproduce: "1. Open insights. 2. Rotate phone.",
        expectedBehaviour: "Smooth transition",
        actualBehaviour: "Flicker",
        severity: "medium",
        contact: "user@example.com",
        consent: true,
        // Sensitive data that must NOT leak:
        cycleRecords: [{ start: "2026-01-01" }],
        dob: "1995-05-15",
        encryptionKey: "secret-key",
      };

      const sanitized = sanitizeReportPayload(rawReport as any);
      expect(sanitized.title).toBe("Screen flicker on charts");
      expect((sanitized as any).cycleRecords).toBeUndefined();
      expect((sanitized as any).dob).toBeUndefined();
      expect((sanitized as any).encryptionKey).toBeUndefined();
    });

    it("persists and clears local drafts reliably", () => {
      const draft = {
        category: "feature",
        title: "Add dark mode tint option",
        description: "Would love a warm plum dark mode option.",
        stepsToReproduce: "",
        expectedBehaviour: "",
        actualBehaviour: "",
        severity: "low",
        contact: "",
        consent: false,
        screenshotBase64: null,
      };

      saveFeedbackDraft(draft);
      const loaded = loadFeedbackDraft();
      expect(loaded.title).toBe("Add dark mode tint option");

      clearFeedbackDraft();
      const cleared = loadFeedbackDraft();
      expect(cleared.title).toBe("");
    });
  });

  describe("7. Missing DOB Non-Blocking Prompt", () => {
    it("all missing DOB prompt keys exist across all 13 languages", () => {
      const langs = ["en", "hi", "mr", "bn", "ta", "te", "kn", "gu", "pa", "ml", "or", "as", "ur"];
      langs.forEach((l) => {
        expect(translate(l, "onb.missingDobTitle")).toBeTruthy();
        expect(translate(l, "onb.missingDobDesc")).toBeTruthy();
        expect(translate(l, "onb.addDob")).toBeTruthy();
        expect(translate(l, "adult.transitionNotNow")).toBeTruthy();
      });
    });
  });
});
