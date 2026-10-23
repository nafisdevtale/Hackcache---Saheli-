import { describe, it, expect } from "vitest";
import { getAuthoritativeCycleState } from "@/lib/cycle.js";
import { emptyRecord } from "@/lib/exportImport.js";
import { DICTS } from "@/i18n/index.js";

describe("Saheli 7.4 — My Phase Tracker Interactive UI & Engine Acceptance", () => {
  // Test 1: User with one period start — cycle-day works, boundary not yet established
  it("Test 1: User with single period start — tracks cycle day, phase boundary is unestablished without fake progress", () => {
    const record = emptyRecord();
    record.settings.birthYear = 1996;
    record.days["2026-10-15"] = { period: true, flow: "heavy" };
    record.days["2026-10-16"] = { period: true, flow: "medium" };

    const targetDate = "2026-10-24"; // Day 10
    const state = getAuthoritativeCycleState(record, targetDate);

    expect(state.cycleDay).toBe(10);
    expect(state.currentCycleStart).toBe("2026-10-15");
    expect(state.completedCycleCount).toBe(0);

    // Follicular Tracker
    expect(state.follicularTracker).toBeDefined();
    expect(state.follicularTracker.status).toBe("current");
    expect(state.follicularTracker.evidence).toBe("boundary_not_established");
    expect(state.follicularTracker.progressPercent).toBeNull();
    expect(state.follicularTracker.endDay).toBeNull();
    expect(state.follicularTracker.elapsedDays).toBe(10);

    // Luteal Tracker
    expect(state.lutealTracker).toBeDefined();
    expect(state.lutealTracker.status).toBe("upcoming");
    expect(state.lutealTracker.evidence).toBe("boundary_not_established");
    expect(state.lutealTracker.startDay).toBeNull();
    expect(state.lutealTracker.progressPercent).toBeNull();
  });

  // Test 2: User with regular cycles (3 cycles, 28-day intervals)
  it("Test 2: User with 3 regular 28d cycles — provides calendar-bounded estimate and calculable phase progress", () => {
    const record = emptyRecord();
    record.settings.birthYear = 1993;
    record.settings.showFertility = true;
    record.settings.fertilityOptIn = true;

    // Cycle 1: 2026-07-15
    record.days["2026-07-15"] = { period: true, flow: "heavy" };
    // Cycle 2: 2026-08-12
    record.days["2026-08-12"] = { period: true, flow: "heavy" };
    // Cycle 3: 2026-09-09
    record.days["2026-09-09"] = { period: true, flow: "heavy" };
    // Current Cycle 4: 2026-10-07
    record.days["2026-10-07"] = { period: true, flow: "heavy" };

    // Today is 2026-10-15 (Cycle Day 9)
    let state = getAuthoritativeCycleState(record, "2026-10-15");
    expect(state.cycleDay).toBe(9);
    expect(state.completedCycleCount).toBe(3);
    expect(state.follicularTracker.status).toBe("current");
    expect(state.follicularTracker.evidence).toBe("calendar_estimate");
    expect(state.follicularTracker.endDay).toBeGreaterThanOrEqual(12);
    expect(state.follicularTracker.progressPercent).toBeGreaterThan(0);
    expect(state.lutealTracker.status).toBe("upcoming");

    // Later in cycle: 2026-10-27 (Cycle Day 21)
    state = getAuthoritativeCycleState(record, "2026-10-27");
    expect(state.cycleDay).toBe(21);
    expect(state.follicularTracker.status).toBe("past");
    expect(state.lutealTracker.status).toBe("current");
    expect(state.lutealTracker.evidence).toBe("calendar_estimate");
    expect(state.lutealTracker.elapsedDays).toBeGreaterThan(0);
    expect(state.lutealTracker.remainingDays).toBeGreaterThanOrEqual(0);
    expect(state.lutealTracker.progressPercent).toBeGreaterThan(0);
  });

  // Test 3: User with irregular cycles (>7 days spread)
  it("Test 3: Irregular cycles — cycle day tracking continues, but phase boundaries are strictly unestablished", () => {
    const record = emptyRecord();
    record.settings.birthYear = 1990;

    record.days["2026-06-01"] = { period: true, flow: "heavy" };
    record.days["2026-06-25"] = { period: true, flow: "heavy" }; // 24d
    record.days["2026-07-28"] = { period: true, flow: "heavy" }; // 33d (diff 9d > 7d)
    record.days["2026-08-20"] = { period: true, flow: "heavy" }; // 23d

    const state = getAuthoritativeCycleState(record, "2026-09-02"); // Cycle Day 14
    expect(state.cycleDay).toBe(14);
    expect(state.cycleLengthVariability).toBeGreaterThan(7);

    // Safeguard: boundaries strictly unestablished
    expect(state.follicularTracker.evidence).toBe("boundary_not_established");
    expect(state.follicularTracker.progressPercent).toBeNull();
    expect(state.lutealTracker.evidence).toBe("boundary_not_established");
    expect(state.lutealTracker.progressPercent).toBeNull();
  });

  // Test 4: Adolescent user profile (<18)
  it("Test 4: Adolescent profile — tracks cycle day, keeps phase progress unestablished for medical safety", () => {
    const record = emptyRecord();
    const currentYear = new Date().getFullYear();
    record.settings.birthYear = currentYear - 15; // 15 years old

    record.days["2026-08-01"] = { period: true, flow: "heavy" };
    record.days["2026-08-29"] = { period: true, flow: "heavy" };
    record.days["2026-09-26"] = { period: true, flow: "heavy" };
    record.days["2026-10-24"] = { period: true, flow: "heavy" };

    const state = getAuthoritativeCycleState(record, "2026-11-04"); // Cycle Day 12
    expect(state.cycleDay).toBe(12);
    expect(state.ovulationEstimateStatus).toBe("adolescent_safeguard");
    expect(state.follicularTracker.evidence).toBe("boundary_not_established");
    expect(state.follicularTracker.progressPercent).toBeNull();
    expect(state.lutealTracker.evidence).toBe("boundary_not_established");
  });

  // Test 5: Logged observations elevate evidence to 'supported_by_observations'
  it("Test 5: Ovulation observations elevate evidence level and reflect recorded biomarkers", () => {
    const record = emptyRecord();
    record.days["2026-10-01"] = { period: true, flow: "heavy" };
    record.ovulationObservations["2026-10-14"] = {
      date: "2026-10-14",
      testResult: "positive",
      bbt: 36.85,
      bbtUnit: "C",
      cervicalFluid: "eggwhite",
      notes: "Peak LH surge line",
      excludedFromCalculations: false,
    };

    const state = getAuthoritativeCycleState(record, "2026-10-14");
    expect(state.ovulationObservationStatus.hasObservations).toBe(true);
    expect(state.ovulationObservationStatus.status).toBe("positive_lh_recorded");
    expect(state.follicularTracker.evidence).toBe("supported_by_observations");
    expect(state.lutealTracker.evidence).toBe("supported_by_observations");
  });

  // Test 6: Historical cycle selector pastCycles model
  it("Test 6: pastCycles model accurately aggregates duration, period days, symptoms, and observations", () => {
    const record = emptyRecord();
    // Cycle 1: 2026-07-01 to 2026-07-29 (28 days)
    record.days["2026-07-01"] = { period: true, flow: "heavy" };
    record.days["2026-07-02"] = { period: true, flow: "medium" };
    record.days["2026-07-03"] = { period: true, flow: "light" };
    record.days["2026-07-14"] = { symptoms: ["cramps", "energy_high"] };

    // Cycle 2: 2026-07-29 to 2026-08-27 (29 days)
    record.days["2026-07-29"] = { period: true, flow: "heavy" };
    record.days["2026-07-30"] = { period: true, flow: "medium" };

    // Current Cycle: 2026-08-27
    record.days["2026-08-27"] = { period: true, flow: "heavy" };

    const state = getAuthoritativeCycleState(record, "2026-09-05");
    expect(state.pastCycles).toBeDefined();
    expect(state.pastCycles.length).toBe(2);

    const cycle1 = state.pastCycles.find((c) => c.start === "2026-07-01");
    expect(cycle1).toBeDefined();
    expect(cycle1.length).toBe(28);
    expect(cycle1.periodDuration).toBe(3);
    expect(cycle1.symptomsCount).toBe(2);
    expect(cycle1.symptoms[0].cycleDay).toBe(14);
  });

  // Test 7: Empty state when no period recorded
  it("Test 7: Empty state when no period has been recorded yet", () => {
    const record = emptyRecord();
    const state = getAuthoritativeCycleState(record, "2026-10-24");

    expect(state.cycleDay).toBeNull();
    expect(state.currentCycleStart).toBeNull();
    expect(state.completedCycleCount).toBe(0);
    expect(state.follicularTracker.status).toBe("unknown");
    expect(state.lutealTracker.status).toBe("unknown");
  });

  // Test 8: All 13 languages contain all new tracker keys
  it("Test 8: All 13 languages contain all My Phase Tracker keys with token preservation", () => {
    const trackerKeys = [
      "phase.myPhaseTracker",
      "phase.myPhaseTrackerSubtitle",
      "phase.follicularTrackerTitle",
      "phase.lutealTrackerTitle",
      "phase.phaseProgress",
      "phase.boundaryNotEstablished",
      "phase.boundaryNotEstablishedDesc",
      "phase.statusCurrent",
      "phase.statusUpcoming",
      "phase.statusPast",
      "phase.statusUnknown",
      "phase.evidenceEstimated",
      "phase.evidenceObserved",
      "phase.evidenceUnestablished",
      "phase.tapToInspect",
      "phase.cycleHistory",
      "phase.selectCycle",
      "phase.currentCycleTab",
      "phase.pastCycleTab",
      "phase.historicalTimeline",
      "phase.noDataStartTracking",
    ];

    for (const [code, dict] of Object.entries(DICTS)) {
      for (const key of trackerKeys) {
        expect(dict[key], `Language [${code}] is missing ${key}`).toBeDefined();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
      expect(dict["phase.boundaryNotEstablishedDesc"]).toContain("{day}");
      expect(dict["phase.currentCycleTab"]).toContain("{day}");
    }
  });
});
