import { describe, it, expect } from "vitest";
import { analyze } from "../lib/cycle.js";
import { computeCycleInsights } from "../lib/insights.js";
import {
  DEFAULT_DASHBOARD_WIDGETS,
  emptyRecord,
  normalizeRecord,
  parseImport,
  exportJSON,
} from "../lib/exportImport.js";
import {
  isValidPin,
  isValidPassphrase,
  isValidSecret,
  deriveKey,
  encryptJSON,
  decryptJSON,
  randomSaltB64,
} from "../lib/encryption.js";
import { matchFaq } from "../content/faq.js";

describe("Saheli 6.1: Competitor-Informed Final Feature Gap Closure", () => {
  describe("P0: Fertility & Cycle Estimation Reliability", () => {
    it("exposes calculationVersion, inputValidity, and explicit suppression reasons in diagnosticInfo", () => {
      // 1. Adolescent with regular cycles -> suppressed for adolescent_safety
      const adolescentDays = {
        "2026-01-01": { date: "2026-01-01", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-01-02": { date: "2026-01-02", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-01-29": { date: "2026-01-29", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-01-30": { date: "2026-01-30", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-02-26": { date: "2026-02-26", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-02-27": { date: "2026-02-27", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-03-26": { date: "2026-03-26", period: true, flow: "medium", pain: 0, symptoms: [] },
      };

      const teenAnalysis = analyze(adolescentDays, {
        ageGroup: "under18",
        today: "2026-04-01",
        showFertility: true,
      });

      expect(teenAnalysis.fertility).toBeNull();
      expect(teenAnalysis.fertilitySuppressionReason).toBe("adolescent_safeguard");
      expect(teenAnalysis.diagnosticInfo).toBeDefined();
      expect(teenAnalysis.diagnosticInfo.calculationVersion).toBe("6.1.0");
      expect(teenAnalysis.diagnosticInfo.inputValidity.valid).toBe(true);
      expect(teenAnalysis.diagnosticInfo.activeAgeBand).toBe("under18");
      expect(teenAnalysis.diagnosticInfo.suppressionReason).toBe("adolescent_safeguard");
    });

    it("evaluates adult regular cycles and provides educational estimate with valid diagnostics", () => {
      const adultDays = {
        "2026-01-01": { date: "2026-01-01", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-01-29": { date: "2026-01-29", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-02-26": { date: "2026-02-26", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-03-26": { date: "2026-03-26", period: true, flow: "medium", pain: 0, symptoms: [] },
      };

      const adultAnalysis = analyze(adultDays, {
        ageGroup: "adult",
        today: "2026-04-01",
        showFertility: true,
      });

      expect(adultAnalysis.fertility).not.toBeNull();
      expect(adultAnalysis.fertilitySuppressionReason).toBeNull();
      expect(adultAnalysis.diagnosticInfo.suppressionReason).toBeNull();
      expect(adultAnalysis.diagnosticInfo.fertilityStatus).toBe("estimate_available");
      expect(adultAnalysis.diagnosticInfo.cyclesConsidered).toBe(3);
      expect(adultAnalysis.diagnosticInfo.inputValidity.valid).toBe(true);
    });

    it("suppresses fertility with too_irregular reason when cycle variation exceeds safe medical thresholds", () => {
      const irregularDays = {
        "2026-01-01": { date: "2026-01-01", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-01-22": { date: "2026-01-22", period: true, flow: "medium", pain: 0, symptoms: [] }, // 21 days
        "2026-02-28": { date: "2026-02-28", period: true, flow: "medium", pain: 0, symptoms: [] }, // 37 days (spread = 16 > 7)
        "2026-03-28": { date: "2026-03-28", period: true, flow: "medium", pain: 0, symptoms: [] },
      };

      const irregularAnalysis = analyze(irregularDays, {
        ageGroup: "adult",
        today: "2026-04-01",
        showFertility: true,
      });

      expect(irregularAnalysis.fertility).toBeNull();
      expect(irregularAnalysis.fertilitySuppressionReason).toBe("irregular_cycles");
      expect(irregularAnalysis.diagnosticInfo.suppressionReason).toBe("irregular_cycles");
      expect(irregularAnalysis.diagnosticInfo.variationMeasure).toBeGreaterThan(7);
    });
  });

  describe("P1: Advanced Insights & Analytics with Strict Provenance", () => {
    const buildMultiCycleData = () => {
      const days = {};
      // 8 regular cycles of 28 days with period 5 days
      const starts = [
        "2025-05-01",
        "2025-05-29",
        "2025-06-26",
        "2025-07-24",
        "2025-08-21",
        "2025-09-18",
        "2025-10-16",
        "2025-11-13",
        "2025-12-11",
      ];

      for (let c = 0; c < starts.length; c++) {
        const start = starts[c];
        const startDate = new Date(start);
        for (let d = 0; d < 5; d++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + d);
          const dateStr = date.toISOString().slice(0, 10);
          days[dateStr] = {
            date: dateStr,
            period: true,
            flow: d === 0 ? "heavy" : "medium",
            pain: d === 0 ? 5 : 0,
            symptoms: ["cramps"],
            symptomIntensities: { cramps: "moderate" },
          };
        }
      }

      return days;
    };

    it("filters cycle insights by scope ('recent' 6 cycles vs 'all' cycles)", () => {
      const days = buildMultiCycleData();
      const rec = { ...emptyRecord(), days };
      const a = analyze(days, { today: "2025-12-20" });

      const recentInsights = computeCycleInsights({
        record: rec,
        analysis: a,
        today: "2025-12-20",
        scope: "recent",
      });

      const allInsights = computeCycleInsights({
        record: rec,
        analysis: a,
        today: "2025-12-20",
        scope: "all",
      });

      expect(recentInsights.totalCyclesCount).toBe(8);
      expect(recentInsights.recentCycles.length).toBe(6); // Limited to 6 in recent scope
      expect(allInsights.cycles.length).toBe(8); // All 8 evaluated in all scope
    });

    it("attaches verifiable provenance metadata with supporting dates to frequent symptoms and patterns", () => {
      const days = buildMultiCycleData();
      const rec = { ...emptyRecord(), days };
      const a = analyze(days, { today: "2025-12-20" });

      const insights = computeCycleInsights({
        record: rec,
        analysis: a,
        today: "2025-12-20",
      });

      expect(insights.frequentSymptoms.length).toBeGreaterThan(0);
      const cramps = insights.frequentSymptoms.find((s) => s.id === "cramps");
      expect(cramps).toBeDefined();
      expect(cramps.provenance).toBeDefined();
      expect(cramps.provenance.supportingDates.length).toBeGreaterThan(0);
      expect(cramps.provenance.confidence).toBe("sufficient");
      expect(cramps.provenance.methodology).toContain("Direct tally");

      // Verify unlogged days transparency note
      expect(insights.totalDaysInSpan).toBeGreaterThan(0);
      expect(insights.unloggedDaysCount).toBeGreaterThan(0);
    });

    it("distinguishes missing data from confirmed symptom-free days", () => {
      const days = {
        "2026-01-01": { date: "2026-01-01", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-01-29": { date: "2026-01-29", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-02-26": { date: "2026-02-26", period: true, flow: "medium", pain: 0, symptoms: [] },
        "2026-03-26": { date: "2026-03-26", period: true, flow: "medium", pain: 0, symptoms: [] },
      };

      const rec = { ...emptyRecord(), days };
      const a = analyze(days, { today: "2026-04-01" });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: "2026-04-01" });

      // In this span, only 4 days were logged; the rest are unlogged (unknown, not confirmed absent)
      expect(insights.unloggedDaysCount).toBeGreaterThan(70);
      expect(insights.totalLoggedDays).toBe(4);
    });
  });

  describe("P1: Customizable Dashboard & Settings Integration", () => {
    it("initializes empty record with default dashboard widgets order and visibility", () => {
      const rec = emptyRecord();
      expect(rec.settings.dashboardWidgets).toEqual(DEFAULT_DASHBOARD_WIDGETS);
      expect(rec.settings.dashboardWidgets.length).toBe(8);
      expect(rec.settings.dashboardWidgets[0].id).toBe("rhythmRing");
      expect(rec.settings.dashboardWidgets.every((w) => w.visible === true)).toBe(true);
    });

    it("normalizes and preserves custom dashboard widgets order and visibility", () => {
      const customizedWidgets = [
        { id: "nextPeriod", visible: true },
        { id: "rhythmRing", visible: false },
        { id: "insights", visible: true },
      ];

      const raw = {
        days: {},
        settings: {
          dashboardWidgets: customizedWidgets,
        },
      };

      const normalized = normalizeRecord(raw);
      expect(normalized.settings.dashboardWidgets).toEqual(customizedWidgets);
    });

    it("exports and imports record with dashboardWidgets validation", () => {
      const rec = emptyRecord();
      rec.settings.dashboardWidgets = [
        { id: "nextPeriod", visible: true },
        { id: "rhythmRing", visible: true },
        { id: "fertility", visible: false },
      ];

      const exported = exportJSON(rec);
      const parsed = parseImport(exported);

      expect(parsed.ok).toBe(true);
      expect(parsed.record.settings.dashboardWidgets).toEqual(rec.settings.dashboardWidgets);
    });
  });

  describe("P1: Privacy & Data Control Hardening (AES-GCM & Passphrase)", () => {
    it("validates 4-digit PINs strictly", () => {
      expect(isValidPin("1234")).toBe(true);
      expect(isValidPin("0000")).toBe(true);
      expect(isValidPin("9999")).toBe(true);
      expect(isValidPin("123")).toBe(false);
      expect(isValidPin("12345")).toBe(false);
      expect(isValidPin("abcd")).toBe(false);
    });

    it("validates alphanumeric passphrases (6+ characters) and secret selector", () => {
      expect(isValidPassphrase("secretpass")).toBe(true);
      expect(isValidPassphrase("my strong phrase 123")).toBe(true);
      expect(isValidPassphrase("123456")).toBe(true);
      expect(isValidPassphrase("12345")).toBe(false);
      expect(isValidPassphrase("abc")).toBe(false);

      expect(isValidSecret("1234")).toBe(true); // PIN
      expect(isValidSecret("my-passphrase-2026")).toBe(true); // Passphrase
      expect(isValidSecret("123")).toBe(false);
    });

    it("performs full AES-GCM round trip encryption and decryption using a strong passphrase", async () => {
      const passphrase = "saheli-super-secret-key-2026";
      const salt = randomSaltB64();
      const key = await deriveKey(passphrase, salt, 1000);

      const secretHealthData = {
        diary: "Confidential period notes",
        pain: 8,
        symptoms: ["severe_cramps"],
      };

      const encrypted = await encryptJSON(key, secretHealthData);
      expect(encrypted.enc).toBe(1);
      expect(encrypted.alg).toBe("AES-GCM");
      expect(typeof encrypted.iv).toBe("string");
      expect(typeof encrypted.ct).toBe("string");

      const decrypted = await decryptJSON(key, encrypted);
      expect(decrypted).toEqual(secretHealthData);
    });
  });

  describe("P1: Local FAQ Search & Regional Synonyms", () => {
    it("matches queries with trailing punctuation", () => {
      const res = matchFaq("normal cycle length?");
      expect(res.type).toBe("match");
      expect(res.item.id).toBe("normal_length");
    });

    it("matches Indian vernacular synonyms (e.g. mahavari, dard)", () => {
      const res = matchFaq("mahavari dard");
      expect(res.type).toBe("match");
      expect(res.item.id).toBe("cramps_help");
    });

    it("matches regional terms for discharge (e.g. safed pani)", () => {
      const res = matchFaq("safed pani");
      expect(res.type).toBe("match");
      expect(res.item.id).toBe("discharge");
    });
  });
});
