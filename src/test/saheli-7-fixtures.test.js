import { describe, it, expect } from "vitest";
import {
  FIXTURE_CATALOG,
  buildFixtureNoHistory,
  buildFixtureOneCycle,
  buildFixtureTwoCycles,
  buildFixtureRegularAdult,
  buildFixtureVariableAdult,
  buildFixtureAdolescent,
  buildFixtureDisabledPreference,
  buildFixturePregnancyMode,
  buildFixtureEditedHistoryTransition,
  buildFixtureRestoredHistory,
} from "../data/fixtures.js";
import { analyze } from "../lib/cycle.js";
import { todayStr } from "../lib/localDate.js";

describe("Saheli 7.0 — Developer Synthetic Test Fixtures", () => {
  const today = todayStr();

  it("Fixture 1: Profile with no history yields unavailable_data status", () => {
    const rec = buildFixtureNoHistory(today);
    expect(Object.keys(rec.days).length).toBe(0);
    const a = analyze(rec.days, { ageGroup: rec.settings.ageGroup, today });
    expect(a.fertilityStatus).toBe("unavailable_data");
    expect(a.fertility).toBeNull();
  });

  it("Fixture 2: Profile with 1 completed cycle yields insufficient_history status", () => {
    const rec = buildFixtureOneCycle(today);
    const a = analyze(rec.days, { ageGroup: rec.settings.ageGroup, today });
    expect(a.cycles.length).toBe(1);
    expect(a.fertilityStatus).toBe("insufficient_history");
    expect(a.fertility).toBeNull();
  });

  it("Fixture 3: Profile with 2 completed cycles yields insufficient_history status", () => {
    const rec = buildFixtureTwoCycles(today);
    const a = analyze(rec.days, { ageGroup: rec.settings.ageGroup, today });
    expect(a.cycles.length).toBe(2);
    expect(a.fertilityStatus).toBe("insufficient_history");
    expect(a.fertility).toBeNull();
  });

  it("Fixture 4: Profile with regular adult cycles yields estimate_available status", () => {
    const rec = buildFixtureRegularAdult(today);
    const a = analyze(rec.days, {
      ageGroup: rec.settings.ageGroup,
      today,
      showFertility: rec.settings.showFertility,
    });
    expect(a.cycles.length).toBeGreaterThanOrEqual(3);
    expect(a.irregular).toBe(false);
    expect(a.fertilityStatus).toBe("estimate_available");
    expect(a.fertility).not.toBeNull();
    expect(a.fertility?.ovulation).toBeDefined();
    expect(a.fertility?.fertile).toBeDefined();
    expect(a.prediction?.basedOn).toBe(4);
  });

  it("Fixture 5: Profile with highly variable adult cycles yields irregular_cycles status", () => {
    const rec = buildFixtureVariableAdult(today);
    const a = analyze(rec.days, {
      ageGroup: rec.settings.ageGroup,
      today,
      showFertility: rec.settings.showFertility,
    });
    expect(a.irregular).toBe(true);
    expect(a.fertilityStatus).toBe("irregular_cycles");
    expect(a.fertility).toBeNull();
    expect(a.prediction).not.toBeNull(); // Still gives widened period prediction
  });

  it("Fixture 6: Profile with adolescent age group yields adolescent_safeguard status", () => {
    const rec = buildFixtureAdolescent(today);
    const a = analyze(rec.days, {
      ageGroup: "under18",
      today,
      showFertility: rec.settings.showFertility,
    });
    expect(a.fertilityStatus).toBe("adolescent_safeguard");
    expect(a.fertility).toBeNull();
  });

  it("Fixture 7: Profile with disabled preference yields disabled_by_user status", () => {
    const rec = buildFixtureDisabledPreference(today);
    const a = analyze(rec.days, {
      ageGroup: rec.settings.ageGroup,
      today,
      showFertility: false,
    });
    expect(a.fertilityStatus).toBe("disabled_by_user");
    expect(a.fertility).toBeNull();
  });

  it("Fixture 8: Profile with active pregnancy yields pregnancy_mode status", () => {
    const rec = buildFixturePregnancyMode(today);
    const a = analyze(rec.days, {
      ageGroup: rec.settings.ageGroup,
      today,
      pregnancyActive: true,
    });
    expect(a.status).toBe("paused");
    expect(a.fertilityStatus).toBe("pregnancy_mode");
    expect(a.fertility).toBeNull();
  });

  it("Fixture 9: Profile transitioning from edited history flips eligibility dynamically", () => {
    const { before, after } = buildFixtureEditedHistoryTransition(today);
    const aBefore = analyze(before.days, { ageGroup: "adult", today, showFertility: true });
    const aAfter = analyze(after.days, { ageGroup: "adult", today, showFertility: true });

    expect(aBefore.fertilityStatus).toBe("irregular_cycles");
    expect(aBefore.fertility).toBeNull();

    expect(aAfter.fertilityStatus).toBe("estimate_available");
    expect(aAfter.fertility).not.toBeNull();
  });

  it("Fixture 10: Restored history generates valid JSON and identical analysis", () => {
    const { original, jsonString } = buildFixtureRestoredHistory(today);
    const parsed = JSON.parse(jsonString);
    expect(parsed.schema).toBe("saheli");
    expect(parsed.version).toBe(3);

    const aOriginal = analyze(original.days, { ageGroup: "adult", today, showFertility: true });
    const aRestored = analyze(parsed.days, { ageGroup: "adult", today, showFertility: true });

    expect(aRestored.fertilityStatus).toBe(aOriginal.fertilityStatus);
    expect(aRestored.prediction?.start).toBe(aOriginal.prediction?.start);
  });

  it("Fixture Catalog contains all 10 documented test cases", () => {
    const keys = Object.keys(FIXTURE_CATALOG);
    expect(keys.length).toBe(10);
    for (const key of keys) {
      const item = FIXTURE_CATALOG[key];
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(typeof item.build).toBe("function");
    }
  });
});
