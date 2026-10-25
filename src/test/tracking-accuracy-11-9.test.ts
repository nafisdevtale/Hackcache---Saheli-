import { describe, it, expect } from "vitest";
import {
  periodDates,
  groupPeriods,
  completeCycles,
  median,
  analyze,
  getAuthoritativeCycleState,
} from "../lib/cycle.js";
import { diffDays, addDays } from "../lib/localDate.js";
import { emptyRecord } from "../lib/exportImport.js";

describe("Saheli 11.9 — Menstrual Tracking Accuracy & Statistical Integrity", () => {
  describe("1. Calendar-day diff calculations & leap year boundaries", () => {
    it("calculates exact calendar-day diff across leap year boundary (Feb 2028)", () => {
      // 2028 is a leap year (Feb 29 exists)
      const feb1 = "2028-02-01";
      const feb29 = "2028-02-29";
      const mar1 = "2028-03-01";

      expect(diffDays(feb1, feb29)).toBe(28);
      expect(diffDays(feb1, mar1)).toBe(29);
      expect(diffDays(feb29, mar1)).toBe(1);

      expect(addDays(feb1, 28)).toBe("2028-02-29");
      expect(addDays(feb1, 29)).toBe("2028-03-01");
    });

    it("calculates exact calendar-day diff across non-leap year boundary (Feb 2027)", () => {
      // 2027 is non-leap
      const feb1 = "2027-02-01";
      const mar1 = "2027-03-01";

      expect(diffDays(feb1, mar1)).toBe(28);
      expect(addDays(feb1, 28)).toBe("2027-03-01");
    });
  });

  describe("2. Period duration and bleeding episode calculation", () => {
    it("calculates bleeding duration strictly by calendar episode days", () => {
      const dates = ["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05"];
      const periods = groupPeriods(dates, 1);

      expect(periods.length).toBe(1);
      expect(periods[0].start).toBe("2026-05-01");
      expect(periods[0].end).toBe("2026-05-05");
      expect(periods[0].length).toBe(5);
    });

    it("allows a 1-day unlogged gap within an active bleeding episode", () => {
      // User forgot to log on 2026-05-03
      const dates = ["2026-05-01", "2026-05-02", "2026-05-04", "2026-05-05"];
      const periods = groupPeriods(dates, 1);

      expect(periods.length).toBe(1);
      expect(periods[0].start).toBe("2026-05-01");
      expect(periods[0].end).toBe("2026-05-05");
      expect(periods[0].length).toBe(5);
    });

    it("splits episodes when gap exceeds periodGroupGapDays", () => {
      // 2-day gap between 2026-05-03 and 2026-05-06
      const dates = ["2026-05-01", "2026-05-02", "2026-05-06", "2026-05-07"];
      const periods = groupPeriods(dates, 1);

      expect(periods.length).toBe(2);
      expect(periods[0].start).toBe("2026-05-01");
      expect(periods[0].end).toBe("2026-05-02");
      expect(periods[0].length).toBe(2);

      expect(periods[1].start).toBe("2026-05-06");
      expect(periods[1].end).toBe("2026-05-07");
      expect(periods[1].length).toBe(2);
    });
  });

  describe("3. Spotting separation from confirmed period starts", () => {
    it("separates isolated mid-cycle spotting from confirmed menstrual cycle starts", () => {
      const days = {
        // Cycle 1: Confirmed period
        "2026-01-01": { period: true, flow: "medium" },
        "2026-01-02": { period: true, flow: "medium" },
        "2026-01-03": { period: true, flow: "light" },
        // Isolated spotting mid-cycle on day 15
        "2026-01-15": { period: true, flow: "spotting" },
        // Cycle 2: Confirmed period
        "2026-01-29": { period: true, flow: "heavy" },
        "2026-01-30": { period: true, flow: "medium" },
        "2026-01-31": { period: true, flow: "light" },
      };

      const dates = periodDates(days);
      const periods = groupPeriods(dates, 1, days);
      expect(periods.length).toBe(3);
      expect(periods[1].isSpottingOnly).toBe(true);

      const cycles = completeCycles(periods);
      // Only 1 completed cycle between 2026-01-01 and 2026-01-29
      expect(cycles.length).toBe(1);
      expect(cycles[0].start).toBe("2026-01-01");
      expect(cycles[0].nextStart).toBe("2026-01-29");
      expect(cycles[0].length).toBe(28);
    });

    it("retains multi-day bleeding starting with spotting as a confirmed period", () => {
      const days = {
        // Cycle 1 starts with spotting followed by full flow
        "2026-02-01": { period: true, flow: "spotting" },
        "2026-02-02": { period: true, flow: "heavy" },
        "2026-02-03": { period: true, flow: "medium" },
        // Cycle 2
        "2026-03-01": { period: true, flow: "heavy" },
        "2026-03-02": { period: true, flow: "medium" },
      };

      const dates = periodDates(days);
      const periods = groupPeriods(dates, 1, days);
      expect(periods.length).toBe(2);
      expect(periods[0].isSpottingOnly).toBe(false);

      const cycles = completeCycles(periods);
      expect(cycles.length).toBe(1);
      expect(cycles[0].start).toBe("2026-02-01");
      expect(cycles[0].nextStart).toBe("2026-03-01");
      expect(cycles[0].length).toBe(28);
    });
  });

  describe("4. Statistical robustness & consecutive cycle math", () => {
    it("calculates median accurately for odd and even sets", () => {
      expect(median([28, 29, 30])).toBe(29);
      expect(median([28, 30])).toBe(29);
      expect(median([27, 28, 30, 31])).toBe(29);
      expect(median([])).toBeNull();
    });

    it("computes accurate completed cycles across 4 consecutive periods", () => {
      const periods = [
        { start: "2026-01-01", end: "2026-01-05", length: 5 },
        { start: "2026-01-29", end: "2026-02-02", length: 5 },
        { start: "2026-02-26", end: "2026-03-02", length: 5 },
        { start: "2026-03-27", end: "2026-03-31", length: 5 },
      ];

      const cycles = completeCycles(periods);
      expect(cycles.length).toBe(3);
      expect(cycles[0].length).toBe(28); // Jan 1 -> Jan 29
      expect(cycles[1].length).toBe(28); // Jan 29 -> Feb 26
      expect(cycles[2].length).toBe(29); // Feb 26 -> Mar 27

      const lengths = cycles.map((c) => c.length);
      expect(median(lengths)).toBe(28);
    });
  });

  describe("5. Under-18 Safeguards & Irregular Cycle Detection", () => {
    it("suppresses fertility prediction for under-18 users even with 4 regular cycles", () => {
      const record = emptyRecord();
      record.settings.birthYear = 2012; // 14 years old
      record.settings.showFertility = true;
      record.settings.fertilityOptIn = true;

      // 4 regular 28-day cycles
      record.days["2026-01-01"] = { period: true, flow: "medium" };
      record.days["2026-01-29"] = { period: true, flow: "medium" };
      record.days["2026-02-26"] = { period: true, flow: "medium" };
      record.days["2026-03-26"] = { period: true, flow: "medium" };

      const state = getAuthoritativeCycleState(record, "2026-04-05");
      expect(state.ovulationEstimateStatus).toBe("adolescent_safeguard");
      expect(state.analysis.fertility).toBeNull();
      expect(state.relevantSourceDates.estimatedOvulationStart).toBeNull();
      expect(state.analysis.fertilitySuppressionReason).toBe("adolescent_safeguard");
    });

    it("suppresses fertility prediction for adult with irregular cycles (> 7 days variation)", () => {
      const record = emptyRecord();
      record.settings.birthYear = 1995; // 31 years old
      record.settings.showFertility = true;

      // Irregular cycles: 24d, 35d (spread = 11 > 7)
      record.days["2026-01-01"] = { period: true, flow: "medium" };
      record.days["2026-01-25"] = { period: true, flow: "medium" }; // 24d
      record.days["2026-03-01"] = { period: true, flow: "medium" }; // 35d
      record.days["2026-03-29"] = { period: true, flow: "medium" }; // 28d

      const state = getAuthoritativeCycleState(record, "2026-04-05");
      expect(state.ovulationEstimateStatus).toBe("irregular_cycles");
      expect(state.analysis.fertility).toBeNull();
      expect(state.relevantSourceDates.estimatedOvulationStart).toBeNull();
      expect(state.analysis.fertilitySuppressionReason).toBe("irregular_cycles");
    });
  });
});
