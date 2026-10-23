import { describe, it, expect } from "vitest";
import { analyze, getFertilitySuppressionMessageKey } from "@/lib/cycle.js";
import { blankDay, emptyRecord } from "@/lib/exportImport.js";
import { addDays } from "@/lib/localDate.js";
import { DICTS, translate } from "@/i18n/index.js";
import { LANGUAGES } from "@/i18n/languages.js";

const makeDays = (periods) => {
  const days = {};
  for (const p of periods) {
    for (let i = 0; i < p.len; i++) {
      const d = addDays(p.date, i);
      days[d] = {
        ...blankDay(d),
        period: true,
        flow: "medium",
      };
    }
  }
  return days;
};

describe("Saheli 6.0: Ovulation Estimate Recalculation & Suppression Diagnosis Suite", () => {
  const TODAY = "2026-04-01";

  // Case A: Regular adult cycles (3+ cycles, spread <= 7) -> estimate_available
  it("Case A: Regular adult cycles (3+ cycles, spread <= 7) -> estimate_available", () => {
    const days = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 }, // 28d
      { date: "2026-02-26", len: 5 }, // 28d
      { date: "2026-03-26", len: 5 }, // 28d
    ]);

    const a = analyze(days, { ageGroup: "adult", today: TODAY, showFertility: true });
    expect(a.status).toBe("ok");
    expect(a.fertilityStatus).toBe("estimate_available");
    expect(a.fertilitySuppressionReason).toBeNull();
    expect(a.fertility).not.toBeNull();
    expect(a.fertility.ovulation).toBeDefined();
    expect(a.fertility.fertile).toBeDefined();
    expect(a.diagnosticInfo.variationMeasure).toBe(0);
    expect(a.diagnosticInfo.cyclesConsidered).toBe(3);
  });

  // Case B: Highly variable cycles (spread > 7) -> irregular_cycles
  it("Case B: Highly variable cycles (spread > 7) -> irregular_cycles", () => {
    const days = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-23", len: 5 }, // 22d
      { date: "2026-02-25", len: 5 }, // 33d (spread = 11d > 7d)
      { date: "2026-03-24", len: 5 }, // 27d
    ]);

    const a = analyze(days, { ageGroup: "adult", today: TODAY, showFertility: true });
    expect(a.status).toBe("ok");
    expect(a.irregular).toBe(true);
    expect(a.fertilityStatus).toBe("irregular_cycles");
    expect(a.fertilitySuppressionReason).toBe("irregular_cycles");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.variationMeasure).toBe(11);
    expect(a.diagnosticInfo.suppressionReason).toBe("irregular_cycles");
  });

  // Case C: Insufficient cycles (< 3) -> insufficient_history
  it("Case C: Insufficient cycles (< 3) -> insufficient_history", () => {
    const days = makeDays([
      { date: "2026-02-01", len: 5 },
      { date: "2026-03-01", len: 5 }, // only 1 complete cycle
    ]);

    const a = analyze(days, { ageGroup: "adult", today: TODAY, showFertility: true });
    expect(a.status).toBe("insufficient");
    expect(a.fertilityStatus).toBe("insufficient_history");
    expect(a.fertilitySuppressionReason).toBe("insufficient_history");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.cyclesConsidered).toBe(1);
  });

  // Case D: Adolescent user (< 18) -> adolescent_safeguard
  it("Case D: Adolescent user (< 18) -> adolescent_safeguard", () => {
    const days = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 }, // 28d
      { date: "2026-02-26", len: 5 }, // 28d
      { date: "2026-03-26", len: 5 }, // 28d
    ]);

    const a = analyze(days, { ageGroup: "under18", today: TODAY });
    expect(a.status).toBe("ok");
    expect(a.fertilityStatus).toBe("adolescent_safeguard");
    expect(a.fertilitySuppressionReason).toBe("adolescent_safeguard");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.activeAgeBand).toBe("under18");
  });

  // Case E: Adult with fertility estimates toggled off -> disabled_by_user
  it("Case E: Adult with fertility estimates toggled off -> disabled_by_user", () => {
    const days = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 },
      { date: "2026-02-26", len: 5 },
      { date: "2026-03-26", len: 5 },
    ]);

    const a = analyze(days, { ageGroup: "adult", today: TODAY, showFertility: false });
    expect(a.fertilityStatus).toBe("disabled_by_user");
    expect(a.fertilitySuppressionReason).toBe("disabled_by_user");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.estimationPreference).toBe(false);
  });

  // Case F: Active pregnancy mode -> pregnancy_mode
  it("Case F: Active pregnancy mode -> pregnancy_mode", () => {
    const days = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 },
      { date: "2026-02-26", len: 5 },
      { date: "2026-03-26", len: 5 },
    ]);

    const a = analyze(days, {
      ageGroup: "adult",
      today: TODAY,
      pregnancyActive: true,
      paused: true,
    });
    expect(a.status).toBe("paused");
    expect(a.fertilityStatus).toBe("pregnancy_mode");
    expect(a.fertilitySuppressionReason).toBe("pregnancy_mode");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.pregnancyMode).toBe(true);
  });

  // Case G: Zero logged periods -> unavailable_data
  it("Case G: Zero logged periods -> unavailable_data", () => {
    const days = {};
    const a = analyze(days, { ageGroup: "adult", today: TODAY });
    expect(a.fertilityStatus).toBe("unavailable_data");
    expect(a.fertilitySuppressionReason).toBe("unavailable_data");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.cyclesConsidered).toBe(0);
  });

  // Case H: Transitioning from irregular to regular by editing past periods -> recalculates to estimate_available
  it("Case H: Transitioning from irregular to regular by editing past periods -> recalculates to estimate_available", () => {
    // 1. Initial irregular history (lengths: 28, 38, 28 -> spread 10 > 7)
    const initialDays = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 }, // 28d
      { date: "2026-03-08", len: 5 }, // 38d
      { date: "2026-04-05", len: 5 }, // 28d
    ]);

    const aInitial = analyze(initialDays, {
      ageGroup: "adult",
      today: "2026-04-10",
      showFertility: true,
    });
    expect(aInitial.irregular).toBe(true);
    expect(aInitial.fertilityStatus).toBe("irregular_cycles");
    expect(aInitial.fertility).toBeNull();

    // 2. User corrects the logged start date of period #3 from 2026-03-08 to 2026-02-27 (29d)
    const correctedDays = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 }, // 28d
      { date: "2026-02-27", len: 5 }, // 29d
      { date: "2026-03-27", len: 5 }, // 28d
    ]);

    const aCorrected = analyze(correctedDays, {
      ageGroup: "adult",
      today: "2026-04-10",
      showFertility: true,
    });
    expect(aCorrected.irregular).toBe(false);
    expect(aCorrected.fertilityStatus).toBe("estimate_available");
    expect(aCorrected.fertilitySuppressionReason).toBeNull();
    expect(aCorrected.fertility).not.toBeNull();
  });

  // Case I: Deleting a cycle -> drops below minimum threshold -> recalculates to insufficient_history
  it("Case I: Deleting a cycle -> drops below minimum threshold -> recalculates to insufficient_history", () => {
    // 1. Initial 3 regular cycles
    const initialDays = makeDays([
      { date: "2026-01-01", len: 5 },
      { date: "2026-01-29", len: 5 },
      { date: "2026-02-26", len: 5 },
      { date: "2026-03-26", len: 5 },
    ]);
    const aInitial = analyze(initialDays, {
      ageGroup: "adult",
      today: "2026-04-01",
      showFertility: true,
    });
    expect(aInitial.fertilityStatus).toBe("estimate_available");

    // 2. User deletes the first period (leaving only 2 completed cycles)
    const afterDeleteDays = makeDays([
      { date: "2026-01-29", len: 5 },
      { date: "2026-02-26", len: 5 },
      { date: "2026-03-26", len: 5 },
    ]);
    const aAfterDelete = analyze(afterDeleteDays, {
      ageGroup: "adult",
      today: "2026-04-01",
      showFertility: true,
    });
    expect(aAfterDelete.status).toBe("insufficient");
    expect(aAfterDelete.fertilityStatus).toBe("insufficient_history");
    expect(aAfterDelete.fertilitySuppressionReason).toBe("insufficient_history");
    expect(aAfterDelete.fertility).toBeNull();
  });

  // Developer Diagnostics View Metadata Integrity
  describe("Developer Diagnostics View Metadata Integrity", () => {
    it("transparently provides all 7 required diagnostic fields", () => {
      const days = makeDays([
        { date: "2026-01-01", len: 5 },
        { date: "2026-01-30", len: 5 }, // 29d
        { date: "2026-02-27", len: 5 }, // 28d
        { date: "2026-03-29", len: 5 }, // 30d
      ]);

      const a = analyze(days, { ageGroup: "adult", today: TODAY, showFertility: true });
      expect(a.diagnosticInfo).toBeDefined();
      expect(a.diagnosticInfo.cyclesConsidered).toBe(3);
      expect(a.diagnosticInfo.cycleLengths).toEqual([29, 28, 30]);
      expect(a.diagnosticInfo.variationMeasure).toBe(2);
      expect(a.diagnosticInfo.activeAgeBand).toBe("adult");
      expect(a.diagnosticInfo.estimationPreference).toBe(true);
      expect(a.diagnosticInfo.pregnancyMode).toBe(false);
      expect(a.diagnosticInfo.suppressionReason).toBeNull();
      expect(a.diagnosticInfo.fertilityStatus).toBe("estimate_available");
    });
  });

  // Localization Verification for all Suppression Reasons
  describe("Multilingual Suppression Message Coverage", () => {
    const reasons = [
      "insufficient_history",
      "irregular_cycles",
      "adolescent_safeguard",
      "disabled_by_user",
      "pregnancy_mode",
      "unavailable_data",
    ];

    it("maps all suppression reasons to distinct valid translation keys", () => {
      const keys = reasons.map(getFertilitySuppressionMessageKey);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(reasons.length);
      for (const k of keys) {
        expect(k.startsWith("today.fertility.")).toBe(true);
      }
    });

    it("verifies non-empty translated explanations across all 13 supported languages", () => {
      for (const lang of LANGUAGES) {
        for (const reason of reasons) {
          const key = getFertilitySuppressionMessageKey(reason);
          const text = translate(lang.code, key);
          expect(text).toBeDefined();
          expect(typeof text).toBe("string");
          expect(text.trim().length).toBeGreaterThan(10);
          expect(text).not.toBe(key);
        }
      }
    });
  });
});
