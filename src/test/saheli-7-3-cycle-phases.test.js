import { describe, it, expect } from "vitest";
import { CYCLE_PHASES } from "../content/cyclePhases.js";
import { analyze, getCyclePhaseDiagnostics } from "../lib/cycle.js";
import { addDays, todayStr } from "../lib/localDate.js";

function buildHistory(starts, length = 5) {
  const days = {};
  for (const s of starts) {
    for (let i = 0; i < length; i++) {
      days[addDays(s, i)] = { period: true, flow: "medium", pain: 0, symptoms: [] };
    }
  }
  return days;
}

describe("Saheli 7.3 — Module C: Menstrual Phase Education & Engine", () => {
  describe("Phase Definitions & Evidence Governance", () => {
    it("defines distinct Follicular and Luteal phase modules with authoritative sources", () => {
      expect(CYCLE_PHASES.follicular).toBeDefined();
      expect(CYCLE_PHASES.luteal).toBeDefined();

      expect(CYCLE_PHASES.follicular.titleKey).toBe("phase.follicular.title");
      expect(CYCLE_PHASES.luteal.titleKey).toBe("phase.luteal.title");

      // Verifies ACOG and NHS clinical citations are present
      const folSources = CYCLE_PHASES.follicular.sources.map((s) => s.id);
      expect(folSources).toContain("acog_cycle");
      expect(folSources).toContain("nhs_cycle");

      const lutSources = CYCLE_PHASES.luteal.sources.map((s) => s.id);
      expect(lutSources).toContain("acog_pms");
      expect(lutSources).toContain("nhs_cycle");
    });

    it("includes evidence-based self-care recommendations for both phases", () => {
      expect(CYCLE_PHASES.follicular.selfCareTips.length).toBeGreaterThanOrEqual(4);
      expect(CYCLE_PHASES.luteal.selfCareTips.length).toBeGreaterThanOrEqual(4);
    });

    it("discloses biological variation and addresses the universal Day 14 myth", () => {
      expect(CYCLE_PHASES.follicular.variationKey).toBe("phase.follicular.variation");
      expect(CYCLE_PHASES.luteal.variationKey).toBe("phase.luteal.variation");
    });
  });

  describe("Medical Safety & Suppression Safeguards", () => {
    const today = "2026-10-23";

    it("strictly suppresses personalized day estimates for adolescents (<18)", () => {
      // 4 regular 28-day cycles
      const starts = ["2026-06-01", "2026-06-29", "2026-07-27", "2026-08-24", "2026-09-21"];
      const days = buildHistory(starts);
      const a = analyze(days, { ageGroup: "under18", today });

      const diagnostics = getCyclePhaseDiagnostics(a, { ageGroup: "under18" }, today);
      expect(diagnostics.status).toBe("suppressed");
      expect(diagnostics.reason).toBe("adolescent_safeguard");
      expect(diagnostics.eligible).toBe(false);
      expect(diagnostics.follicular).toBeNull();
      expect(diagnostics.luteal).toBeNull();
    });

    it("strictly suppresses personalized day estimates when cycles are irregular (>7 days variation)", () => {
      // Irregular cycles: 24, 38, 26, 35 days (spread = 14 > 7)
      const starts = ["2026-05-01", "2026-05-25", "2026-07-02", "2026-07-28", "2026-09-01"];
      const days = buildHistory(starts);
      const a = analyze(days, { ageGroup: "adult", today });

      const diagnostics = getCyclePhaseDiagnostics(a, { ageGroup: "adult" }, today);
      expect(diagnostics.status).toBe("suppressed");
      expect(diagnostics.reason).toBe("irregular_cycles");
      expect(diagnostics.eligible).toBe(false);
      expect(diagnostics.follicular).toBeNull();
      expect(diagnostics.luteal).toBeNull();
    });

    it("suppresses phase timelines when completed cycle history is insufficient (<3 cycles)", () => {
      // Only 2 cycles
      const starts = ["2026-08-01", "2026-08-29", "2026-09-26"];
      const days = buildHistory(starts);
      const a = analyze(days, { ageGroup: "adult", today });

      const diagnostics = getCyclePhaseDiagnostics(a, { ageGroup: "adult" }, today);
      expect(diagnostics.status).toBe("suppressed");
      expect(diagnostics.reason).toBe("insufficient_history");
      expect(diagnostics.eligible).toBe(false);
    });

    it("suppresses phase timelines when pregnancy mode is active or tracking is paused", () => {
      const starts = ["2026-06-01", "2026-06-29", "2026-07-27", "2026-08-24", "2026-09-21"];
      const days = buildHistory(starts);
      const aPreg = analyze(days, { ageGroup: "adult", pregnancyActive: true, today });
      const diagPreg = getCyclePhaseDiagnostics(aPreg, { pregnancyActive: true }, today);
      expect(diagPreg.status).toBe("suppressed");
      expect(diagPreg.reason).toBe("pregnancy_mode");

      const aPaused = analyze(days, { ageGroup: "adult", trackingPaused: true, today });
      const diagPaused = getCyclePhaseDiagnostics(aPaused, { trackingPaused: true }, today);
      expect(diagPaused.status).toBe("suppressed");
      expect(diagPaused.reason).toBe("tracking_paused");
    });
  });

  describe("Eligible Adult Estimation & Uncertainty Disclosures", () => {
    it("computes bounded follicular and luteal phases for regular adult history", () => {
      // 4 regular 28-day cycles, last started on 2026-10-01
      const starts = ["2026-06-11", "2026-07-09", "2026-08-06", "2026-09-03", "2026-10-01"];
      const days = buildHistory(starts);
      const today = "2026-10-18"; // Cycle day 18
      const a = analyze(days, { ageGroup: "adult", today });

      const diagnostics = getCyclePhaseDiagnostics(a, { ageGroup: "adult" }, today);
      expect(diagnostics.status).toBe("estimate_available");
      expect(diagnostics.eligible).toBe(true);
      expect(diagnostics.cyclesConsidered).toBeGreaterThanOrEqual(3);
      expect(diagnostics.uncertaintyDays).toBeDefined();

      // Follicular phase
      expect(diagnostics.follicular).toBeDefined();
      expect(diagnostics.follicular.startDay).toBe(1);
      expect(diagnostics.follicular.endDay).toBeGreaterThanOrEqual(10);
      expect(diagnostics.follicular.endDay).toBeLessThanOrEqual(16);

      // Luteal phase
      expect(diagnostics.luteal).toBeDefined();
      expect(diagnostics.luteal.startDay).toBe(diagnostics.follicular.endDay + 1);
      expect(diagnostics.luteal.endDay).toBeGreaterThanOrEqual(27);

      // Day 18 in a 28-day cycle with ~Day 14 ovulation is post-ovulation (luteal)
      expect(diagnostics.activePhase).toBe("luteal");
    });

    it("recalculates phase diagnostic immediately upon adding or modifying period entries", () => {
      const starts = ["2026-06-11", "2026-07-09", "2026-08-06", "2026-09-03", "2026-10-01"];
      const days = buildHistory(starts);
      const today = "2026-10-08"; // Cycle day 8 -> Follicular
      const a1 = analyze(days, { ageGroup: "adult", today });
      const d1 = getCyclePhaseDiagnostics(a1, { ageGroup: "adult" }, today);
      expect(d1.activePhase).toBe("follicular");

      // Now user logs a new regular period starting 28 days later
      const nextPeriod = "2026-10-29";
      days[nextPeriod] = { period: true, flow: "medium", pain: 0, symptoms: [] };
      const a2 = analyze(days, { ageGroup: "adult", today: nextPeriod });
      const d2 = getCyclePhaseDiagnostics(a2, { ageGroup: "adult" }, nextPeriod);

      // Recalculates dynamically with updated cycle analysis
      expect(d2.status).toBe("estimate_available");
      expect(d2.follicular.start).toBe(nextPeriod);
    });
  });
});
