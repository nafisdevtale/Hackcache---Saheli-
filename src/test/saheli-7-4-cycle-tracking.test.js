import { describe, it, expect } from "vitest";
import { getAuthoritativeCycleState, analyze, computeCycleDay } from "@/lib/cycle.js";
import {
  emptyRecord,
  validateObservation,
  parseImport,
  exportJSON,
  exportCSV,
  parseCSVImport,
} from "@/lib/exportImport.js";
import { computeCycleInsights } from "@/lib/insights.js";
import { DICTS } from "@/i18n/index.js";

describe("Saheli 7.4 — Complete Cycle Phase & Ovulation Tracking Engine Acceptance", () => {
  // Scenario A: First-time user logs single period
  it("Scenario A: First-time user logs single period — tracks cycle day without personalised ovulation predictions", () => {
    const record = emptyRecord();
    record.settings.birthYear = 1995;
    record.settings.showFertility = true;
    record.settings.fertilityOptIn = true;

    // First period: 2026-10-10 to 2026-10-14
    record.days["2026-10-10"] = { period: true, flow: "heavy", pain: 2 };
    record.days["2026-10-11"] = { period: true, flow: "medium", pain: 1 };
    record.days["2026-10-12"] = { period: true, flow: "medium", pain: 0 };
    record.days["2026-10-13"] = { period: true, flow: "light", pain: 0 };
    record.days["2026-10-14"] = { period: true, flow: "spotting", pain: 0 };

    // Today is 2026-10-18 (Cycle Day 9)
    const targetDate = "2026-10-18";
    const state = getAuthoritativeCycleState(record, targetDate);

    expect(state.cycleDay).toBe(9);
    expect(state.currentCycleStart).toBe("2026-10-10");
    expect(state.completedCycleCount).toBe(0);
    expect(state.currentBleedingStatus).toBe("none");

    // Phase status is educational follicular
    expect(state.phaseStatus).toBe("follicular");
    expect(state.phaseEstimationMethod).toBe("educational_only");
    expect(state.ovulationEstimateStatus).toBe("insufficient_history");
    expect(state.estimateExplanation).toMatch(/insufficient/i);
    expect(state.calculationVersion).toBe("7.4.0");
  });

  // Scenario B: Regular adult user (3 cycles, 28-day intervals)
  it("Scenario B: Regular adult user (3 cycles, 28d intervals) — provides calendar-based fertile window and ovulation estimate", () => {
    const record = emptyRecord();
    record.settings.birthYear = 1992;
    record.settings.showFertility = true;
    record.settings.fertilityOptIn = true;

    // Cycle 1 start: 2026-07-15
    record.days["2026-07-15"] = { period: true, flow: "heavy" };
    record.days["2026-07-16"] = { period: true, flow: "medium" };
    // Cycle 2 start: 2026-08-12 (28 days later)
    record.days["2026-08-12"] = { period: true, flow: "heavy" };
    record.days["2026-08-13"] = { period: true, flow: "medium" };
    // Cycle 3 start: 2026-09-09 (28 days later)
    record.days["2026-09-09"] = { period: true, flow: "heavy" };
    record.days["2026-09-10"] = { period: true, flow: "medium" };
    // Cycle 4 start: 2026-10-07 (28 days later)
    record.days["2026-10-07"] = { period: true, flow: "heavy" };
    record.days["2026-10-08"] = { period: true, flow: "medium" };

    // Today is 2026-10-20 (Cycle Day 14)
    const targetDate = "2026-10-20";
    const state = getAuthoritativeCycleState(record, targetDate);

    expect(state.cycleDay).toBe(14);
    expect(state.currentCycleStart).toBe("2026-10-07");
    expect(state.completedCycleCount).toBe(3);
    expect(state.cycleLengthMedian).toBe(28);
    expect(state.cycleLengthVariability).toBe(0);

    expect(state.ovulationEstimateStatus).toBe("estimate_available");
    expect(state.phaseEstimationMethod).toBe("calendar_bounded");
    expect(state.phaseStatus).toBe("follicular");
    expect(state.phaseUncertainty).toBe("phase.uncertainty.estimated");
    expect(state.estimateExplanation).toMatch(/calendar/i);
  });

  // Scenario C: Irregular cycle history (>7 days variation)
  it("Scenario C: Irregular cycle history (>7d variation) — cycle day displayed but ovulation estimates strictly suppressed", () => {
    const record = emptyRecord();
    record.settings.birthYear = 1990;
    record.settings.showFertility = true;
    record.settings.fertilityOptIn = true;

    // Cycle 1: 2026-06-01
    record.days["2026-06-01"] = { period: true, flow: "heavy" };
    // Cycle 2: 2026-06-25 (24 days)
    record.days["2026-06-25"] = { period: true, flow: "heavy" };
    // Cycle 3: 2026-07-28 (33 days, diff = 9 days > 7)
    record.days["2026-07-28"] = { period: true, flow: "heavy" };
    // Cycle 4: 2026-08-20 (23 days)
    record.days["2026-08-20"] = { period: true, flow: "heavy" };

    const targetDate = "2026-08-30"; // Cycle Day 11
    const state = getAuthoritativeCycleState(record, targetDate);

    expect(state.cycleDay).toBe(11);
    expect(state.currentCycleStart).toBe("2026-08-20");
    expect(state.cycleLengthVariability).toBeGreaterThan(7);
    expect(state.ovulationEstimateStatus).toBe("irregular_cycles");
    expect(state.phaseEstimationMethod).toBe("educational_only");
    expect(state.estimateExplanation).toMatch(/irregular/i);
  });

  // Scenario D: Adolescent user profile (<18)
  it("Scenario D: Adolescent user profile (<18) — cycle day displayed but calendar predictions withheld", () => {
    const record = emptyRecord();
    const currentYear = new Date().getFullYear();
    record.settings.birthYear = currentYear - 15; // 15 years old (Adolescent)
    record.settings.showFertility = true;
    record.settings.fertilityOptIn = true;

    // 4 regular 28d cycles logged
    record.days["2026-07-01"] = { period: true, flow: "heavy" };
    record.days["2026-07-29"] = { period: true, flow: "heavy" };
    record.days["2026-08-26"] = { period: true, flow: "heavy" };
    record.days["2026-09-23"] = { period: true, flow: "heavy" };

    const targetDate = "2026-10-05"; // Cycle Day 13
    const state = getAuthoritativeCycleState(record, targetDate);

    expect(state.cycleDay).toBe(13);
    expect(state.ovulationEstimateStatus).toBe("adolescent_safeguard");
    expect(state.phaseEstimationMethod).toBe("educational_only");
    expect(state.estimateExplanation).toMatch(/adolescent/i);
  });

  // Scenario E: Ovulation observations logging & validation
  it("Scenario E: Logs ovulation test (LH surge), BBT, and cervical fluid with validation", () => {
    const record = emptyRecord();
    const targetDate = "2026-10-15";

    const validObs = {
      testResult: "positive",
      bbt: 36.8,
      bbtUnit: "C",
      cervicalFluid: "eggwhite",
      notes: "Clear LH surge test",
      excludedFromCalculations: false,
    };

    expect(validateObservation(validObs)).toBe(true);

    // Invalid observation tests
    expect(validateObservation({ testResult: "invalid_value" })).toBe(false);
    expect(validateObservation({ bbt: 25.0 })).toBe(false); // Below 30.0 C
    expect(validateObservation({ bbt: 48.0 })).toBe(false); // Above 45.0 C
    expect(validateObservation({ bbtUnit: "K" })).toBe(false);
    expect(validateObservation({ cervicalFluid: "green_jelly" })).toBe(false);

    // Save observation in record
    record.ovulationObservations[targetDate] = { ...validObs, date: targetDate };

    const state = getAuthoritativeCycleState(record, targetDate);
    expect(state.ovulationObservationStatus.status).toBe("positive_lh_recorded");
    expect(state.relevantSourceDates.observationDates).toContain(targetDate);
  });

  // Scenario F: Historical edit recalculation
  it("Scenario F: Historical edit of past period start propagates cleanly to cycle state", () => {
    const record = emptyRecord();
    record.days["2026-09-01"] = { period: true, flow: "heavy" };
    record.days["2026-09-29"] = { period: true, flow: "heavy" };

    let state = getAuthoritativeCycleState(record, "2026-10-10");
    expect(state.cycleDay).toBe(12); // from 2026-09-29 to 2026-10-10: 11 days diff + 1 = 12

    // User edits: cycle start was actually 2026-10-01, not 2026-09-29
    delete record.days["2026-09-29"];
    record.days["2026-10-01"] = { period: true, flow: "heavy" };

    state = getAuthoritativeCycleState(record, "2026-10-10");
    expect(state.cycleDay).toBe(10); // from 2026-10-01 to 2026-10-10: 9 days diff + 1 = 10
    expect(state.currentCycleStart).toBe("2026-10-01");
  });

  // Scenario G: Delete observation & export/import persistence
  it("Scenario G: Deleting observation cleans up properly and survives JSON & CSV roundtrips", () => {
    const record = emptyRecord();
    const obsDate = "2026-10-14";
    record.ovulationObservations[obsDate] = {
      date: obsDate,
      testResult: "positive",
      bbt: 36.9,
      bbtUnit: "C",
      cervicalFluid: "eggwhite",
      notes: "Peak fertility observation",
      excludedFromCalculations: false,
    };

    // Export to JSON and re-import
    const jsonStr = exportJSON(record);
    const parsed = parseImport(jsonStr);
    expect(parsed.ok).toBe(true);
    expect(parsed.record.ovulationObservations[obsDate].testResult).toBe("positive");
    expect(parsed.record.ovulationObservations[obsDate].bbt).toBe(36.9);

    // Export to CSV and re-import
    record.days[obsDate] = { period: false, notes: "test day" };
    const csvStr = exportCSV(record);
    expect(csvStr).toContain("ovulationTest");
    expect(csvStr).toContain("positive");
    expect(csvStr).toContain("36.9");

    const csvParsed = parseCSVImport(csvStr);
    expect(csvParsed.ok).toBe(true);
    expect(csvParsed.record.ovulationObservations[obsDate]).toBeDefined();
    expect(csvParsed.record.ovulationObservations[obsDate].testResult).toBe("positive");

    // Delete observation
    delete record.ovulationObservations[obsDate];
    expect(record.ovulationObservations[obsDate]).toBeUndefined();
    const stateAfterDelete = getAuthoritativeCycleState(record, obsDate);
    expect(stateAfterDelete.ovulationObservationStatus.status).toBe("none_recorded");
  });

  // Scenario H: Pregnancy mode or tracking paused
  it("Scenario H: Handles pregnancy mode or tracking paused appropriately", () => {
    const record = emptyRecord();
    record.days["2026-10-01"] = { period: true, flow: "heavy" };

    // 1. Tracking paused
    record.settings.trackingPaused = true;
    let state = getAuthoritativeCycleState(record, "2026-10-12");
    expect(state.phaseStatus).toBe("paused");
    expect(state.ovulationEstimateStatus).toBe("disabled_by_user");
    expect(state.estimateExplanation).toMatch(/paused/i);

    // 2. Pregnancy active
    record.settings.trackingPaused = false;
    record.pregnancy.active = true;
    record.pregnancy.lmp = "2026-10-01";
    state = getAuthoritativeCycleState(record, "2026-10-12");
    expect(state.phaseStatus).toBe("pregnancy");
    expect(state.ovulationEstimateStatus).toBe("pregnancy_mode");
    expect(state.estimateExplanation).toMatch(/pregnancy/i);
  });

  // Scenario I: Multilingual completeness and placeholder checks
  it("Scenario I: All supported languages contain all Saheli 7.4 phase & ovulation keys without placeholder corruption", () => {
    const requiredKeys = [
      "phase.myCyclePhases",
      "phase.cycleDayCard",
      "phase.currentCycleDay",
      "phase.startedOn",
      "phase.confidenceTitle",
      "phase.follicularBoundary",
      "phase.lutealBoundary",
      "phase.ovulationCardTitle",
      "phase.recordObservation",
      "phase.obsDisclaimer",
      "phase.lhTest",
      "phase.bbt",
      "phase.cervicalFluid",
      "ins.phaseInsightsTitle",
      "ins.observationsLogged",
      "cal.obsDay",
    ];

    const langCodes = Object.keys(DICTS);
    expect(langCodes.length).toBe(3);

    for (const code of langCodes) {
      const dict = DICTS[code];
      for (const key of requiredKeys) {
        expect(dict[key], `Missing ${key} in [${code}]`).toBeDefined();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }

      // Check placeholder tokens
      expect(dict["phase.currentCycleDay"]).toContain("{day}");
      expect(dict["phase.startedOn"]).toContain("{date}");
      expect(dict["ins.observationsLogged"]).toContain("{count}");
    }
  });

  // Scenario J: Insights cycle day symptom pattern calculation
  it("Scenario J: computeCycleInsights accurately calculates cycle-day-relative symptom patterns", () => {
    const record = emptyRecord();
    record.days["2026-09-01"] = { period: true, flow: "heavy" };
    record.days["2026-09-14"] = { symptoms: ["cramps", "headache"], mood: "sensitive" };
    record.days["2026-09-29"] = { period: true, flow: "heavy" };
    record.days["2026-10-12"] = { symptoms: ["cramps"], mood: "sensitive" };

    const a = analyze(record.days, { today: "2026-10-24" });
    const insights = computeCycleInsights({ record, analysis: a, today: "2026-10-24" });
    expect(insights.cycleDaySymptomPatterns).toBeDefined();
    expect(Array.isArray(insights.cycleDaySymptomPatterns)).toBe(true);

    const crampsPattern = insights.cycleDaySymptomPatterns.find((p) => p.symptom === "cramps");
    expect(crampsPattern).toBeDefined();
    expect(crampsPattern.cycleDay).toBe(14);
    expect(crampsPattern.count).toBe(2);
  });
});
