import { CONFIG } from "../config.js";
import { median, isIrregular, symptomPatterns } from "./cycle.js";
import { diffDays, todayStr } from "./localDate.js";
import { SYMPTOMS } from "../data/symptoms.js";

/**
 * Computes deep, local-only cycle insights, bleeding patterns, symptom frequencies,
 * and supportive medical guidance links from the user's local records.
 *
 * Designed as a health-information product, NOT a diagnostic engine.
 */
export function computeCycleInsights({ record = {}, analysis = {}, today = todayStr() }) {
  const days = record.days || {};
  const settings = record.settings || {};
  const ageGroup = settings.ageGroup || "adult";
  const limits = CONFIG.irregular[ageGroup === "under18" ? "under18" : "adult"];

  // 1. Cycle history & comparisons
  const allCycles = analysis.cycles || [];
  const recentCycles = allCycles.slice(-CONFIG.historyWindow);
  const cycleLengths = recentCycles.map((c) => c.length);
  const totalCyclesCount = allCycles.length;
  const hasMinimumHistory = recentCycles.length >= CONFIG.minCyclesForPrediction;

  const medianCycle = analysis.stats?.median ?? (cycleLengths.length ? median(cycleLengths) : null);
  const minCycle = analysis.stats?.min ?? (cycleLengths.length ? Math.min(...cycleLengths) : null);
  const maxCycle = analysis.stats?.max ?? (cycleLengths.length ? Math.max(...cycleLengths) : null);
  const cycleSpread = minCycle != null && maxCycle != null ? maxCycle - minCycle : 0;
  const avgCycle = analysis.stats?.avg ?? null;

  const cycleComparisons = recentCycles.map((c, i) => {
    const diffFromMedian = medianCycle != null ? c.length - medianCycle : 0;
    const diffFromPrev = i > 0 ? c.length - recentCycles[i - 1].length : null;
    const isOutsideNormal = c.length < limits.minLen || c.length > limits.maxLen;
    return {
      ...c,
      diffFromMedian,
      diffFromPrev,
      isOutsideNormal,
    };
  });

  const latestCycle = recentCycles.length ? recentCycles[recentCycles.length - 1] : null;
  const previousCycle = recentCycles.length > 1 ? recentCycles[recentCycles.length - 2] : null;
  const latestVsPreviousDiff =
    latestCycle && previousCycle ? latestCycle.length - previousCycle.length : null;

  // 2. Period duration and bleeding patterns
  const allPeriods = analysis.periods || [];
  const recentPeriods = allPeriods.slice(-CONFIG.historyWindow);
  const periodLengths = recentPeriods.map((p) => p.length);
  const medianPeriod = periodLengths.length ? median(periodLengths) : null;
  const minPeriod = periodLengths.length ? Math.min(...periodLengths) : null;
  const maxPeriod = periodLengths.length ? Math.max(...periodLengths) : null;
  const periodSpread = minPeriod != null && maxPeriod != null ? maxPeriod - minPeriod : 0;
  const avgPeriod = analysis.stats?.avgPeriod ?? null;

  const flowCounts = { spotting: 0, light: 0, medium: 0, heavy: 0 };
  let totalFlowDays = 0;
  let padHourlyDays = 0;
  let bigClotsDays = 0;
  let longPeriodsCount = 0;

  for (const p of recentPeriods) {
    if (p.length > CONFIG.longPeriodDays) {
      longPeriodsCount++;
    }
  }

  // Scan logged days for bleeding details
  const loggedDates = Object.keys(days)
    .filter((d) => d <= today)
    .sort();
  for (const d of loggedDates) {
    const entry = days[d];
    if (entry && entry.period) {
      if (entry.flow && flowCounts[entry.flow] !== undefined) {
        flowCounts[entry.flow]++;
        totalFlowDays++;
      }
      if (entry.padHourly === true) padHourlyDays++;
      if (entry.bigClots === true) bigClotsDays++;
    }
  }

  // 3. Symptom frequencies, trends, and severity
  let totalLoggedDays = 0;
  const customDefs = (settings.customSymptoms || []).map((cs) => ({
    id: cs.id,
    label: cs.label,
    custom: true,
  }));
  const allSymptomDefs = [...SYMPTOMS, ...customDefs];

  const symptomDayCounts = {};
  for (const s of allSymptomDefs) symptomDayCounts[s.id] = 0;

  const symptomPhaseCounts = {};
  for (const s of allSymptomDefs) {
    symptomPhaseCounts[s.id] = { period: 0, premenstrual: 0, other: 0 };
  }

  let painDaysCount = 0;
  let painTotalScore = 0;
  let highPainDaysCount = 0; // pain >= 6
  let disruptivePainDaysCount = 0; // painStoppedActivities or painkillerHelped === 'no'

  const moodCounts = { great: 0, good: 0, okay: 0, low: 0, very_low: 0 };
  const energyCounts = { high: 0, medium: 0, low: 0 };
  let sleepTotalHours = 0;
  let sleepLoggedDays = 0;
  let shortSleepDaysCount = 0; // < 6 hours

  // Helper set of period dates and premenstrual dates (5 days before period start)
  const periodDaySet = new Set();
  const premenstrualDaySet = new Set();
  for (const p of allPeriods) {
    for (const d of p.days || [p.start]) periodDaySet.add(d);
    for (let i = 1; i <= 5; i++) {
      const preDate = new Date(p.start);
      preDate.setDate(preDate.getDate() - i);
      // Format as local YYYY-MM-DD
      const y = preDate.getFullYear();
      const m = String(preDate.getMonth() + 1).padStart(2, "0");
      const dayNum = String(preDate.getDate()).padStart(2, "0");
      premenstrualDaySet.add(`${y}-${m}-${dayNum}`);
    }
  }

  for (const d of loggedDates) {
    const e = days[d];
    if (!e) continue;

    // Check if day has meaningful logged data
    const hasLog =
      e.period === true ||
      (e.symptoms && e.symptoms.length > 0) ||
      (e.pain != null && e.pain > 0) ||
      e.mood != null ||
      e.energy != null ||
      e.sleep != null ||
      (e.medicines && e.medicines.trim() !== "") ||
      (e.note && e.note.trim() !== "");

    if (!hasLog) continue;
    totalLoggedDays++;

    // Symptoms tracking
    const syms = e.symptoms || [];
    const isPeriodDay = periodDaySet.has(d);
    const isPreDay = premenstrualDaySet.has(d);

    for (const symId of syms) {
      if (symptomDayCounts[symId] !== undefined) {
        symptomDayCounts[symId]++;
        if (isPeriodDay) symptomPhaseCounts[symId].period++;
        else if (isPreDay) symptomPhaseCounts[symId].premenstrual++;
        else symptomPhaseCounts[symId].other++;
      }
    }

    // Pain tracking
    if (e.pain != null && e.pain > 0) {
      painDaysCount++;
      painTotalScore += Number(e.pain);
      if (e.pain >= 6) highPainDaysCount++;
    }
    if (e.painStoppedActivities === true || e.painkillerHelped === "no") {
      disruptivePainDaysCount++;
    }

    // Mood tracking
    if (e.mood && moodCounts[e.mood] !== undefined) {
      moodCounts[e.mood]++;
    }

    // Energy tracking
    if (e.energy && energyCounts[e.energy] !== undefined) {
      energyCounts[e.energy]++;
    }

    // Sleep tracking
    if (e.sleep != null && !isNaN(e.sleep) && e.sleep > 0) {
      sleepLoggedDays++;
      sleepTotalHours += Number(e.sleep);
      if (e.sleep < 6) shortSleepDaysCount++;
    }
  }

  // Calculate top symptoms and their associated timings
  const frequentSymptoms = allSymptomDefs
    .map((s) => {
      const count = symptomDayCounts[s.id] || 0;
      const phases = symptomPhaseCounts[s.id] || { period: 0, premenstrual: 0, other: 0 };
      let dominantPhase = null;
      if (count > 0) {
        if (phases.premenstrual >= phases.period && phases.premenstrual >= phases.other) {
          dominantPhase = "premenstrual";
        } else if (phases.period >= phases.premenstrual && phases.period >= phases.other) {
          dominantPhase = "period";
        } else {
          dominantPhase = "other";
        }
      }
      return {
        id: s.id,
        label: s.label,
        custom: s.custom,
        count,
        percentage: totalLoggedDays ? Math.round((count / totalLoggedDays) * 100) : 0,
        phases,
        dominantPhase,
      };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  // Recurrent patterns from cycle engine
  const patterns = symptomPatterns(days, analysis);

  // 4. Cautious estimates & uncertainty
  const isPaused = analysis.status === "paused";
  const isInsufficient = analysis.status === "insufficient" || !hasMinimumHistory;
  const isEstimateAvailable = !isPaused && !isInsufficient && !!analysis.prediction;

  const estimateWindow = isEstimateAvailable
    ? {
        start: analysis.prediction.start,
        end: analysis.prediction.end,
        center: analysis.prediction.center,
        halfWidth: analysis.prediction.halfWidth,
        windowDays: diffDays(analysis.prediction.start, analysis.prediction.end) + 1,
        basedOn: analysis.prediction.basedOn,
        isWidened: analysis.irregular,
      }
    : null;

  // 5. Supportive health guidance links (contextual medical guidance)
  const supportiveCards = [];

  if (longPeriodsCount > 0 || padHourlyDays > 0 || bigClotsDays > 0) {
    supportiveCards.push({
      id: "heavy_bleeding",
      severity: "doctor",
      titleKey: "ins.supportHeavyTitle",
      descKey: "ins.supportHeavyDesc",
      learnId: "normal",
      doctorLink: "/doctor",
    });
  }

  if (disruptivePainDaysCount > 0 || highPainDaysCount >= 3) {
    supportiveCards.push({
      id: "pain_guidance",
      severity: "doctor",
      titleKey: "ins.supportPainTitle",
      descKey: "ins.supportPainDesc",
      learnId: "cramps",
      doctorLink: "/doctor",
    });
  }

  if (analysis.irregular) {
    supportiveCards.push({
      id: "cycle_variation",
      severity: "info",
      titleKey: "ins.supportIrregularTitle",
      descKey: "ins.supportIrregularDesc",
      learnId: "cycle",
      doctorLink: "/doctor",
    });
  }

  if (ageGroup === "under18") {
    supportiveCards.push({
      id: "adolescent_info",
      severity: "info",
      titleKey: "ins.adolescentTitle",
      descKey: "ins.adolescentNotice",
      learnId: "cycle",
      doctorLink: null,
    });
  }

  return {
    // Cycle history
    cycles: allCycles,
    recentCycles,
    totalCyclesCount,
    hasMinimumHistory,
    medianCycle,
    minCycle,
    maxCycle,
    cycleSpread,
    avgCycle,
    isIrregular: !!analysis.irregular,
    irregularReason: analysis.irregularReason || null,
    cycleComparisons,
    latestCycle,
    previousCycle,
    latestVsPreviousDiff,
    limits,

    // Period & bleeding
    periods: allPeriods,
    recentPeriods,
    medianPeriod,
    minPeriod,
    maxPeriod,
    periodSpread,
    avgPeriod,
    flowCounts,
    totalFlowDays,
    padHourlyDays,
    bigClotsDays,
    longPeriodsCount,

    // Symptoms & well-being
    totalLoggedDays,
    frequentSymptoms,
    patterns,
    pain: {
      daysWithPain: painDaysCount,
      avgPain: painDaysCount ? Math.round((painTotalScore / painDaysCount) * 10) / 10 : 0,
      highPainDays: highPainDaysCount,
      disruptivePainDays: disruptivePainDaysCount,
    },
    moodCounts,
    energyCounts,
    sleep: {
      loggedDays: sleepLoggedDays,
      avgSleep: sleepLoggedDays ? Math.round((sleepTotalHours / sleepLoggedDays) * 10) / 10 : null,
      shortSleepDays: shortSleepDaysCount,
    },

    // Cautious estimates & uncertainty
    isPaused,
    isInsufficient,
    isEstimateAvailable,
    estimateWindow,
    fertility: analysis.fertility || null,
    fertilityUnavailable: analysis.fertilityUnavailable || null,
    fertilityStatus: analysis.fertilityStatus || "unavailable_data",
    fertilitySuppressionReason: analysis.fertilitySuppressionReason || null,
    diagnosticInfo: analysis.diagnosticInfo || null,

    // Supportive guidance
    supportiveCards,
  };
}
