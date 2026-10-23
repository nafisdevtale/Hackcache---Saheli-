import { describe, it, expect } from "vitest";
import { analyze, getFertilitySuppressionMessageKey } from "../lib/cycle.js";
import { addDays, todayStr } from "../lib/localDate.js";
import {
  buildFixtureRegularAdult,
  buildFixtureVariableAdult,
  buildFixtureAdolescent,
  buildFixtureEditedHistoryTransition,
} from "../data/fixtures.js";

describe("Saheli 7.0 — Module A: Ovulation & Fertility Engine Acceptance", () => {
  const today = todayStr();

  it("A1 & A2: Distinguishes all 7 machine-readable fertility states with correct message keys", () => {
    // 1. unavailable_data
    expect(getFertilitySuppressionMessageKey("unavailable_data")).toBe(
      "today.fertility.unavailable",
    );
    // 2. insufficient_history
    expect(getFertilitySuppressionMessageKey("insufficient_history")).toBe(
      "today.fertility.insufficient",
    );
    // 3. irregular_cycles
    expect(getFertilitySuppressionMessageKey("irregular_cycles")).toBe("today.fertility.irregular");
    // 4. adolescent_safeguard
    expect(getFertilitySuppressionMessageKey("adolescent_safeguard")).toBe(
      "today.fertility.adolescent",
    );
    // 5. disabled_by_user
    expect(getFertilitySuppressionMessageKey("disabled_by_user")).toBe("today.fertility.disabled");
    // 6. pregnancy_mode
    expect(getFertilitySuppressionMessageKey("pregnancy_mode")).toBe("today.fertility.pregnancy");
    // 7. fallback
    expect(getFertilitySuppressionMessageKey("unknown")).toBe("today.fertilityIrregular");
  });

  it("A3: Live recalculation when adding a new period start date", () => {
    // Start with a user on day 28 of their cycle (ready for next period)
    const rec = buildFixtureRegularAdult(today);
    // Find the last period start date in rec
    const periods = Object.keys(rec.days)
      .filter((d) => rec.days[d].period)
      .sort();
    const lastStart = periods[periods.length - 5]; // 5 days of bleeding, so first day of last period
    const nextStartCandidate = addDays(lastStart, 28);

    const initialAnalysis = analyze(rec.days, {
      ageGroup: "adult",
      today: nextStartCandidate,
      showFertility: true,
    });
    expect(initialAnalysis.fertilityStatus).toBe("estimate_available");
    const initialOvulation = initialAnalysis.fertility.ovulation;

    // Log a new period starting on nextStartCandidate
    const updatedDays = {
      ...rec.days,
      [nextStartCandidate]: { period: true, flow: "medium" },
      [addDays(nextStartCandidate, 1)]: { period: true, flow: "heavy" },
    };
    const updatedAnalysis = analyze(updatedDays, {
      ageGroup: "adult",
      today: nextStartCandidate,
      showFertility: true,
    });

    // Since nextStartCandidate is now day 1 of a new period, cycle length is 28 days (regular!)
    expect(updatedAnalysis.fertilityStatus).toBe("estimate_available");
    expect(updatedAnalysis.fertility.ovulation.start).not.toBe(initialOvulation.start);
    expect(updatedAnalysis.inPeriod).toBe(true);
    expect(updatedAnalysis.currentCycleDay).toBe(1);
  });

  it("A3: Live recalculation when editing/correcting historical cycle dates", () => {
    const { before, after } = buildFixtureEditedHistoryTransition(today);

    // Initial variable state: spread > 7 days => irregular_cycles
    const initialAnalysis = analyze(before.days, { ageGroup: "adult", today, showFertility: true });
    expect(initialAnalysis.irregular).toBe(true);
    expect(initialAnalysis.fertilityStatus).toBe("irregular_cycles");
    expect(initialAnalysis.fertility).toBeNull();

    // After correcting historical mislogs => estimate_available
    const fixedAnalysis = analyze(after.days, { ageGroup: "adult", today, showFertility: true });
    expect(fixedAnalysis.irregular).toBe(false);
    expect(fixedAnalysis.fertilityStatus).toBe("estimate_available");
    expect(fixedAnalysis.fertility).not.toBeNull();
    expect(fixedAnalysis.fertility?.ovulation).toBeDefined();
  });

  it("A4: Surface estimated timing, uncertainty range, and cycles considered for eligible adults", () => {
    const rec = buildFixtureRegularAdult(today);
    const a = analyze(rec.days, { ageGroup: "adult", today, showFertility: true });

    expect(a.fertilityStatus).toBe("estimate_available");
    expect(a.fertility.fertile.start).toBeDefined();
    expect(a.fertility.fertile.end).toBeDefined();
    expect(a.fertility.ovulation.start).toBeDefined();
    expect(a.fertility.ovulation.end).toBeDefined();

    // Check uncertainty measure
    expect(a.prediction.halfWidth).toBeGreaterThanOrEqual(2);
    // Check records considered
    expect(a.diagnosticInfo.cyclesConsidered).toBeGreaterThanOrEqual(3);
    expect(a.prediction.basedOn).toBeGreaterThanOrEqual(3);
  });

  it("A4: Strictly suppresses fertility dates for adolescents even with regular cycles", () => {
    const rec = buildFixtureAdolescent(today);
    const a = analyze(rec.days, { ageGroup: "under18", today, showFertility: true });

    expect(a.fertilityStatus).toBe("adolescent_safeguard");
    expect(a.fertility).toBeNull();
    expect(a.diagnosticInfo.suppressionReason).toBe("adolescent_safeguard");
  });
});
