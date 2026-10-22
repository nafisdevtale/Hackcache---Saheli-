import { describe, it, expect } from "vitest";
import { computeCycleInsights } from "@/lib/insights.js";
import { analyze, symptomPatterns } from "@/lib/cycle.js";
import { addDays } from "@/lib/localDate.js";
import { emptyRecord, blankDay } from "@/lib/exportImport.js";
import { CONFIG } from "@/config.js";
import en from "@/i18n/en.js";
import hi from "@/i18n/hi.js";

const TODAY = "2026-10-23";

function createRecordWithCycles(cycleLengths, opts = {}) {
  const { startDate = "2026-01-01", periodLength = 5, ageGroup = "adult", paused = false } = opts;

  const rec = emptyRecord();
  rec.settings.ageGroup = ageGroup;
  rec.pregnancy.active = paused;

  let currentStart = startDate;
  const starts = [currentStart];

  for (const len of cycleLengths) {
    currentStart = addDays(currentStart, len);
    starts.push(currentStart);
  }

  for (const s of starts) {
    for (let p = 0; p < periodLength; p++) {
      const d = addDays(s, p);
      rec.days[d] = {
        ...blankDay(d),
        period: true,
        flow: p === 0 || p === 1 ? "heavy" : "medium",
      };
    }
  }

  return { rec, starts };
}

describe("Saheli 2.1 Cycle Insights Engine", () => {
  describe("Minimum-history and insufficient-data states", () => {
    it("handles zero recorded cycles with graceful empty state", () => {
      const rec = emptyRecord();
      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.totalCyclesCount).toBe(0);
      expect(insights.hasMinimumHistory).toBe(false);
      expect(insights.isInsufficient).toBe(true);
      expect(insights.isEstimateAvailable).toBe(false);
      expect(insights.medianCycle).toBeNull();
      expect(insights.medianPeriod).toBeNull();
    });

    it("requires at least 3 complete cycles before generating future estimates", () => {
      // 2 complete cycles (3 period starts)
      const { rec } = createRecordWithCycles([28, 28], { startDate: "2026-06-01" });
      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.totalCyclesCount).toBe(2);
      expect(insights.hasMinimumHistory).toBe(false);
      expect(insights.isInsufficient).toBe(true);
      expect(insights.isEstimateAvailable).toBe(false);
      expect(insights.estimateWindow).toBeNull();
      // Historical summaries are available even when prediction is not
      expect(insights.medianCycle).toBe(28);
      expect(insights.recentCycles).toHaveLength(2);
    });

    it("generates cautious window estimate once 3 cycles are recorded", () => {
      // 3 complete cycles (4 period starts)
      const { rec } = createRecordWithCycles([28, 29, 27], { startDate: "2026-05-01" });
      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.totalCyclesCount).toBe(3);
      expect(insights.hasMinimumHistory).toBe(true);
      expect(insights.isInsufficient).toBe(false);
      expect(insights.isEstimateAvailable).toBe(true);
      expect(insights.estimateWindow).not.toBeNull();
      expect(insights.estimateWindow.windowDays).toBeGreaterThanOrEqual(3);
    });

    it("pauses estimates during pregnancy without deleting historical summaries", () => {
      const { rec } = createRecordWithCycles([28, 28, 28], {
        startDate: "2026-03-01",
        paused: true,
      });
      const a = analyze(rec.days, { today: TODAY, paused: true });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.isPaused).toBe(true);
      expect(insights.isEstimateAvailable).toBe(false);
      expect(insights.medianCycle).toBe(28);
    });
  });

  describe("Cycle length summaries, ranges, and comparisons", () => {
    it("calculates median, min, max, and spread accurately", () => {
      const { rec } = createRecordWithCycles([26, 30, 28], { startDate: "2026-04-01" });
      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.medianCycle).toBe(28);
      expect(insights.minCycle).toBe(26);
      expect(insights.maxCycle).toBe(30);
      expect(insights.cycleSpread).toBe(4);
    });

    it("limits history window to CONFIG.historyWindow (6 cycles)", () => {
      const { rec } = createRecordWithCycles([28, 28, 28, 28, 28, 28, 28, 28], {
        startDate: "2024-01-01",
      });
      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.totalCyclesCount).toBe(8);
      expect(insights.recentCycles).toHaveLength(CONFIG.historyWindow);
    });

    it("calculates cycle-by-cycle comparisons against median and previous cycle", () => {
      const { rec } = createRecordWithCycles([28, 31, 27], { startDate: "2026-05-01" });
      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      const comparisons = insights.cycleComparisons;
      expect(comparisons).toHaveLength(3);

      // First cycle: 28 days (median is 28)
      expect(comparisons[0].length).toBe(28);
      expect(comparisons[0].diffFromMedian).toBe(0);
      expect(comparisons[0].diffFromPrev).toBeNull();

      // Second cycle: 31 days (+3 vs median, +3 vs prev)
      expect(comparisons[1].length).toBe(31);
      expect(comparisons[1].diffFromMedian).toBe(3);
      expect(comparisons[1].diffFromPrev).toBe(3);

      // Third cycle: 27 days (-1 vs median, -4 vs prev)
      expect(comparisons[2].length).toBe(27);
      expect(comparisons[2].diffFromMedian).toBe(-1);
      expect(comparisons[2].diffFromPrev).toBe(-4);
    });
  });

  describe("Irregular cycles and age-group restrictions", () => {
    it("flags adult cycles with spread > 7 as irregular and widens uncertainty window", () => {
      const { rec } = createRecordWithCycles([26, 35, 27], {
        startDate: "2026-04-01",
        ageGroup: "adult",
      });
      const a = analyze(rec.days, { today: TODAY, ageGroup: "adult" });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.isIrregular).toBe(true);
      expect(insights.estimateWindow.isWidened).toBe(true);
      expect(insights.supportiveCards.some((c) => c.id === "cycle_variation")).toBe(true);
    });

    it("respects adolescent normal range (21–45 days) for users under 18", () => {
      // 40-day cycles are normal in adolescence (ACOG CO 651)
      const { rec } = createRecordWithCycles([40, 40, 40], {
        startDate: "2026-03-01",
        ageGroup: "under18",
      });
      const a = analyze(rec.days, { today: TODAY, ageGroup: "under18" });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.isIrregular).toBe(false);
      expect(insights.supportiveCards.some((c) => c.id === "adolescent_info")).toBe(true);
    });
  });

  describe("Symptom frequency, phase timing, and data completeness", () => {
    it("does not treat unlogged days as confirmed symptom-free days", () => {
      const { rec, starts } = createRecordWithCycles([28, 28, 28], { startDate: "2026-05-01" });

      // Explicitly log cramps on 3 days
      rec.days[starts[0]].symptoms = ["cramps"];
      rec.days[starts[1]].symptoms = ["cramps"];
      rec.days[starts[2]].symptoms = ["cramps"];

      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      // Total logged days should only count days with logs
      expect(insights.totalLoggedDays).toBeGreaterThan(0);
      const cramps = insights.frequentSymptoms.find((s) => s.id === "cramps");
      expect(cramps).toBeDefined();
      expect(cramps.count).toBe(3);
      // Dominant phase during period
      expect(cramps.dominantPhase).toBe("period");
    });

    it("accurately identifies premenstrual symptom associations", () => {
      const { rec, starts } = createRecordWithCycles([28, 28, 28, 28], { startDate: "2026-03-01" });

      // Log headache 2 days before periods 1, 2, and 3
      for (let i = 1; i < starts.length; i++) {
        const preDate = addDays(starts[i], -2);
        rec.days[preDate] = {
          ...blankDay(preDate),
          symptoms: ["headache", "bloating"],
        };
      }

      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      const headache = insights.frequentSymptoms.find((s) => s.id === "headache");
      expect(headache).toBeDefined();
      expect(headache.count).toBe(4);
      expect(headache.dominantPhase).toBe("premenstrual");

      // Verify recurring pattern detection
      const prePatterns = symptomPatterns(rec.days, a);
      expect(prePatterns.some((p) => p.symptom === "headache")).toBe(true);
    });

    it("tracks disruptive pain and connects to supportive medical guidance", () => {
      const { rec, starts } = createRecordWithCycles([28, 28, 28], { startDate: "2026-05-01" });

      rec.days[starts[0]].pain = 8;
      rec.days[starts[0]].painStoppedActivities = true;
      rec.days[starts[1]].pain = 7;
      rec.days[starts[1]].painkillerHelped = "no";

      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.pain.disruptivePainDays).toBe(2);
      expect(insights.pain.highPainDays).toBe(2);
      expect(insights.pain.avgPain).toBe(7.5);
      expect(insights.supportiveCards.some((c) => c.id === "pain_guidance")).toBe(true);
    });

    it("tracks heavy bleeding and large clots with supportive care links", () => {
      const { rec, starts } = createRecordWithCycles([28, 28, 28], { startDate: "2026-05-01" });

      rec.days[starts[0]].padHourly = true;
      rec.days[starts[1]].bigClots = true;

      const a = analyze(rec.days, { today: TODAY });
      const insights = computeCycleInsights({ record: rec, analysis: a, today: TODAY });

      expect(insights.padHourlyDays).toBe(1);
      expect(insights.bigClotsDays).toBe(1);
      expect(insights.supportiveCards.some((c) => c.id === "heavy_bleeding")).toBe(true);
    });
  });

  describe("Localization coverage", () => {
    it("ensures all new insight keys are present in both English and Hindi dictionaries", () => {
      const insightKeys = [
        "ins.medianCycle",
        "ins.medianPeriod",
        "ins.basedOnCycles",
        "ins.basedOnPeriods",
        "ins.currentCycle",
        "ins.nextWindow",
        "ins.nextWindowDesc",
        "ins.notContraception",
        "ins.historyVsEstimate",
        "ins.historyVsEstimateDesc",
        "ins.windowWidenedIrregular",
        "ins.insufficientForEstimate",
        "ins.insufficientSubtitle",
        "ins.symptomsTitle",
        "ins.frequentSymptoms",
        "ins.loggedTimes",
        "ins.phaseAssociation",
        "ins.phasePremenstrual",
        "ins.phasePeriod",
        "ins.phaseOther",
        "ins.associationNotice",
        "ins.painOverview",
        "ins.avgPain",
        "ins.disruptivePain",
        "ins.highPainDays",
        "ins.moodEnergy",
        "ins.sleepAvg",
        "ins.shortSleep",
        "ins.dataCompleteness",
        "ins.completenessNote",
        "ins.supportTitle",
        "ins.supportHeavyTitle",
        "ins.supportHeavyDesc",
        "ins.supportPainTitle",
        "ins.supportPainDesc",
        "ins.supportIrregularTitle",
        "ins.supportIrregularDesc",
        "ins.adolescentTitle",
        "ins.adolescentNotice",
        "ins.viewDoctorGuidance",
        "ins.learnArticle",
        "ins.visitSummary",
        "ins.compareMedianSame",
        "ins.compareMedianLonger",
        "ins.compareMedianShorter",
        "ins.comparePrevious",
        "ins.flowTitle",
        "ins.flowBreakdown",
        "ins.chartSummaryCycle",
        "ins.chartSummaryPeriod",
        "ins.tableCycleCaption",
        "ins.tableFlowCaption",
        "ins.flowSpotting",
        "ins.flowLight",
        "ins.flowMedium",
        "ins.flowHeavy",
        "ins.patternPremenstrual",
        "ins.patternDisruptivePain",
      ];

      for (const key of insightKeys) {
        expect(en[key], `Missing English key: ${key}`).toBeDefined();
        expect(typeof en[key], `English key ${key} must be a string`).toBe("string");
        expect(hi[key], `Missing Hindi key: ${key}`).toBeDefined();
        expect(typeof hi[key], `Hindi key ${key} must be a string`).toBe("string");
      }
    });
  });
});
