/*
 Cycle engine (deterministic, documented):
 1. Period days = logged days with period:true. Consecutive days (allowing
    CONFIG.periodGroupGapDays unlogged day) form one period.
 2. A complete cycle = first day of one period -> first day of the next.
    The current, unfinished cycle is never counted.
 3. Use the last CONFIG.historyWindow complete cycles.
 4. < CONFIG.minCyclesForPrediction cycles => no prediction.
 5. median = median of included lengths; spread = max - min.
    halfWidth = max(minHalfWidth, spread) (+ irregularExtraDays if irregular).
    Estimate = [lastStart + median - halfWidth, lastStart + median + halfWidth].
 6. Irregular (age-dependent, CONFIG.irregular): spread > maxSpread or any
    cycle outside [minLen, maxLen].
 7. Ovulation ~ lutealDays before estimated period, as a range; fertile window
    = fertileDaysBefore days before + ovulation. Never computed when irregular.
 This is an implementation definition, not a medical guarantee.
*/
import { CONFIG } from "../config.js";
import { addDays, diffDays, todayStr } from "./localDate.js";

export function periodDates(days = {}) {
  return Object.keys(days)
    .filter((d) => days[d] && days[d].period)
    .sort();
}

export function groupPeriods(dates, gap = CONFIG.periodGroupGapDays, days = {}) {
  const out = [];
  for (const d of dates) {
    const last = out[out.length - 1];
    const explicitlyEnded =
      last &&
      Array.from({ length: Math.max(0, diffDays(last.end, d) - 1) }, (_, i) =>
        addDays(last.end, i + 1),
      ).some((date) => days[date]?.period === false);
    if (last && diffDays(last.end, d) <= gap + 1 && !explicitlyEnded) {
      last.end = d;
      last.days.push(d);
    } else out.push({ start: d, end: d, days: [d] });
  }
  return out.map((p) => ({ ...p, length: diffDays(p.start, p.end) + 1 }));
}

export function completeCycles(periods) {
  const c = [];
  for (let i = 0; i < periods.length - 1; i++) {
    c.push({
      start: periods[i].start,
      nextStart: periods[i + 1].start,
      length: diffDays(periods[i].start, periods[i + 1].start),
      periodLength: periods[i].length,
    });
  }
  return c;
}

export function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function isIrregular(lengths, ageGroup = "adult") {
  if (lengths.length < 2) return { irregular: false, reason: null };
  const r = CONFIG.irregular[ageGroup === "under18" ? "under18" : "adult"];
  const spread = Math.max(...lengths) - Math.min(...lengths);
  if (spread > r.maxSpread) return { irregular: true, reason: "spread", spread };
  if (lengths.some((l) => l < r.minLen || l > r.maxLen))
    return { irregular: true, reason: "range", spread };
  return { irregular: false, reason: null, spread };
}

export function getFertilitySuppressionMessageKey(reason) {
  switch (reason) {
    case "adolescent_safeguard":
      return "today.fertility.adolescent";
    case "insufficient_history":
      return "today.fertility.insufficient";
    case "irregular_cycles":
      return "today.fertility.irregular";
    case "disabled_by_user":
      return "today.fertility.disabled";
    case "pregnancy_mode":
      return "today.fertility.pregnancy";
    case "unavailable_data":
      return "today.fertility.unavailable";
    default:
      return "today.fertilityIrregular";
  }
}

export function analyze(days = {}, opts = {}) {
  const {
    ageGroup = "adult",
    today = todayStr(),
    paused = false,
    pregnancyActive = false,
    pregnancyMode = false,
    trackingPaused = false,
    showFertility = true,
    fertilityOptIn = false,
  } = opts;
  const isPregnancyActive = !!(pregnancyActive || pregnancyMode || (paused && !trackingPaused));
  const isPaused = paused || isPregnancyActive || trackingPaused;
  const periods = groupPeriods(
    periodDates(days).filter((d) => d <= today),
    CONFIG.periodGroupGapDays,
    days,
  );
  const cycles = completeCycles(periods);
  const recent = cycles.slice(-CONFIG.historyWindow);
  const lengths = recent.map((c) => c.length);
  const lastPeriod = periods[periods.length - 1] || null;
  const lastStart = lastPeriod ? lastPeriod.start : null;
  const currentCycleDay = lastStart ? diffDays(lastStart, today) + 1 : null;
  const inPeriod = !!(
    lastPeriod &&
    today >= lastPeriod.start &&
    diffDays(lastPeriod.end, today) <= CONFIG.periodGroupGapDays
  );

  const stats = lengths.length
    ? {
        count: lengths.length,
        avg: Math.round((lengths.reduce((a, b) => a + b, 0) / lengths.length) * 10) / 10,
        min: Math.min(...lengths),
        max: Math.max(...lengths),
        median: median(lengths),
        avgPeriod:
          Math.round((periods.reduce((a, p) => a + p.length, 0) / periods.length) * 10) / 10,
      }
    : null;

  const irr = isIrregular(lengths, ageGroup);
  const spread = lengths.length > 1 ? Math.max(...lengths) - Math.min(...lengths) : 0;
  const base = {
    periods,
    cycles,
    recent,
    lastStart,
    lastPeriod,
    inPeriod,
    currentCycleDay,
    stats,
    irregular: irr.irregular,
    irregularReason: irr.reason,
  };

  // Determine standard machine-readable fertility suppression state
  let fertilityStatus = "estimate_available";
  let fertilitySuppressionReason = null;

  if (isPregnancyActive) {
    fertilityStatus = "pregnancy_mode";
    fertilitySuppressionReason = "pregnancy_mode";
  } else if (periods.length === 0) {
    fertilityStatus = "unavailable_data";
    fertilitySuppressionReason = "unavailable_data";
  } else if (ageGroup === "under18") {
    fertilityStatus = "adolescent_safeguard";
    fertilitySuppressionReason = "adolescent_safeguard";
  } else if (showFertility === false || trackingPaused) {
    fertilityStatus = "disabled_by_user";
    fertilitySuppressionReason = "disabled_by_user";
  } else if (recent.length < CONFIG.minCyclesForPrediction) {
    fertilityStatus = "insufficient_history";
    fertilitySuppressionReason = "insufficient_history";
  } else if (irr.irregular) {
    fertilityStatus = "irregular_cycles";
    fertilitySuppressionReason = "irregular_cycles";
  } else {
    fertilityStatus = "estimate_available";
    fertilitySuppressionReason = null;
  }

  // Backward-compatible fertilityUnavailable flag
  let fertilityUnavailable = null;
  if (fertilityStatus === "adolescent_safeguard") fertilityUnavailable = "under18";
  else if (fertilityStatus === "irregular_cycles") fertilityUnavailable = "irregular";
  else if (fertilityStatus === "insufficient_history") fertilityUnavailable = "insufficient";
  else if (fertilityStatus === "pregnancy_mode") fertilityUnavailable = "paused";
  else if (fertilityStatus === "disabled_by_user") fertilityUnavailable = "disabled";
  else if (fertilityStatus === "unavailable_data") fertilityUnavailable = "insufficient";

  const diagnosticInfo = {
    calculationVersion: "6.1.0",
    cyclesConsidered: recent.length,
    cycleLengths: lengths,
    variationMeasure: spread,
    activeAgeBand: ageGroup,
    estimationPreference: showFertility !== false,
    pregnancyMode: isPregnancyActive,
    eligibilityStatus: fertilityStatus === "estimate_available" ? "eligible" : "suppressed",
    inputValidity: {
      periodsCount: periods.length,
      completeCyclesCount: cycles.length,
      valid: true,
    },
    suppressionReason: fertilitySuppressionReason,
    fertilityStatus,
  };

  if (isPaused)
    return {
      ...base,
      status: "paused",
      prediction: null,
      fertility: null,
      fertilityUnavailable: "paused",
      fertilityStatus,
      fertilitySuppressionReason,
      diagnosticInfo,
      possibleMissedLog: false,
    };

  if (recent.length < CONFIG.minCyclesForPrediction) {
    return {
      ...base,
      status: "insufficient",
      prediction: null,
      fertility: null,
      fertilityUnavailable: fertilityUnavailable || "insufficient",
      fertilityStatus,
      fertilitySuppressionReason,
      diagnosticInfo,
      possibleMissedLog: false,
    };
  }

  const med = median(lengths);
  const halfWidth =
    Math.max(CONFIG.minHalfWidth, spread) + (irr.irregular ? CONFIG.irregularExtraDays : 0);
  const center = addDays(lastStart, med);
  const prediction = {
    start: addDays(center, -halfWidth),
    end: addDays(center, halfWidth),
    center,
    halfWidth,
    median: med,
    spread,
    basedOn: recent.length,
  };

  const gap = diffDays(lastStart, today);
  const possibleMissedLog =
    gap > med * CONFIG.missingLogFactor && gap > med + CONFIG.missingLogMinExtra;

  let fertility = null;
  if (fertilityStatus === "estimate_available") {
    const ovStart = addDays(prediction.start, -CONFIG.lutealDays);
    const ovEnd = addDays(prediction.end, -CONFIG.lutealDays);
    fertility = {
      ovulation: { start: ovStart, end: ovEnd },
      fertile: { start: addDays(ovStart, -CONFIG.fertileDaysBefore), end: ovEnd },
    };
  }

  return {
    ...base,
    status: "ok",
    prediction,
    fertility,
    fertilityUnavailable,
    fertilityStatus,
    fertilitySuppressionReason,
    diagnosticInfo,
    possibleMissedLog,
  };
}

export function phaseKey(a, today = todayStr()) {
  if (!a?.lastStart || a?.status === "paused") return "phase.unknown";
  if (a.inPeriod) return "phase.period";
  if (!a.prediction) return "phase.dayOnly";
  if (today > a.prediction.end) return "phase.late";
  if (a.irregular) return "phase.irregular";
  if (diffDays(today, a.prediction.start) <= 5) return "phase.premenstrual";
  if (a.currentCycleDay <= Math.floor(a.prediction.median / 2) - 3) return "phase.follicular";
  return "phase.middle";
}

// Symptom patterns across cycles. Only reported when seen in >= patternMinCycles cycles.
export function symptomPatterns(days, a) {
  const out = [];
  const periods = a.periods.slice(0, -1).slice(-CONFIG.historyWindow);
  if (periods.length < CONFIG.patternMinCycles) return out;
  const symCounts = {};
  for (const p of periods) {
    const seen = new Set();
    for (const off of [0, 1]) {
      const e = days[addDays(p.start, off)];
      (e?.symptoms || []).forEach((s) => seen.add(s));
    }
    seen.forEach((s) => (symCounts[s] = (symCounts[s] || 0) + 1));
  }
  for (const [s, n] of Object.entries(symCounts)) {
    if (n >= CONFIG.patternMinCycles)
      out.push({ type: "earlySymptom", symptom: s, n, total: periods.length });
  }
  // Energy before period: low energy in 5 days before a period start.
  let lowBefore = 0;
  let checked = 0;
  for (const p of periods.slice(1)) {
    let any = false,
      logged = false;
    for (let i = 1; i <= 5; i++) {
      const e = days[addDays(p.start, -i)];
      if (e?.energy) logged = true;
      if (e?.energy === "low") any = true;
    }
    if (logged) checked++;
    if (any) lowBefore++;
  }
  if (lowBefore >= CONFIG.patternMinCycles)
    out.push({ type: "lowEnergyBefore", n: lowBefore, total: checked });
  // Pain on day 1
  let pain = 0;
  for (const p of periods) if ((days[p.start]?.pain || 0) >= 6) pain++;
  if (pain >= CONFIG.patternMinCycles)
    out.push({ type: "painDay1", n: pain, total: periods.length });

  // Premenstrual symptoms (in 5 days before period start across >= patternMinCycles cycles)
  const premenstrualCounts = {};
  for (const p of periods.slice(1)) {
    const seenPre = new Set();
    for (let i = 1; i <= 5; i++) {
      const e = days[addDays(p.start, -i)];
      (e?.symptoms || []).forEach((s) => seenPre.add(s));
    }
    seenPre.forEach((s) => (premenstrualCounts[s] = (premenstrualCounts[s] || 0) + 1));
  }
  for (const [s, n] of Object.entries(premenstrualCounts)) {
    if (n >= CONFIG.patternMinCycles) {
      out.push({ type: "premenstrualSymptom", symptom: s, n, total: periods.length - 1 });
    }
  }

  // Recurrent disruptive pain across cycles
  let disruptivePain = 0;
  for (const p of periods) {
    let anyDisruptive = false;
    for (const d of p.days || [p.start]) {
      const entry = days[d];
      if (entry?.painStoppedActivities === true || entry?.painkillerHelped === "no") {
        anyDisruptive = true;
      }
    }
    if (anyDisruptive) disruptivePain++;
  }
  if (disruptivePain >= CONFIG.patternMinCycles) {
    out.push({ type: "recurrentDisruptivePain", n: disruptivePain, total: periods.length });
  }

  return out.sort((x, y) => y.n - x.n);
}

/**
 * Saheli 7.3 — Phase Diagnostic Engine
 *
 * Provides bounded estimated cycle phases (Follicular & Luteal) for eligible regular adults.
 * Strictly suppresses personalized estimates and returns educational-only mode for:
 * - Adolescents (<18)
 * - Irregular cycles (>7 days spread or flagged irregular)
 * - Insufficient history (< 3 complete cycles)
 * - Pregnancy mode or paused tracking
 */
export function getCyclePhaseDiagnostics(a, opts = {}, today = todayStr()) {
  const ageGroup = opts.ageGroup || a?.diagnosticInfo?.activeAgeBand || "adult";
  const isTrackingPaused = opts.trackingPaused || (opts.paused && !opts.pregnancyActive);
  const isPregnancy =
    opts.pregnancyActive ||
    opts.pregnancyMode ||
    (!isTrackingPaused && a?.fertilitySuppressionReason === "pregnancy_mode");
  const paused = isTrackingPaused || opts.paused || a?.status === "paused";
  const isUnder18 = ageGroup === "under18";
  const isIrregularCycle = a?.irregular || a?.diagnosticInfo?.variationMeasure > 7;
  const minCycles = CONFIG.minCyclesForPrediction || 3;
  const cyclesCount = a?.cycles?.length || 0;

  if (isPregnancy) {
    return {
      status: "suppressed",
      reason: "pregnancy_mode",
      eligible: false,
      activePhase: null,
      uncertaintyNoteKey: "phase.suppressed.pregnancy",
      follicular: null,
      luteal: null,
    };
  }

  if (paused) {
    return {
      status: "suppressed",
      reason: "tracking_paused",
      eligible: false,
      activePhase: null,
      uncertaintyNoteKey: "phase.suppressed.paused",
      follicular: null,
      luteal: null,
    };
  }

  if (isUnder18) {
    return {
      status: "suppressed",
      reason: "adolescent_safeguard",
      eligible: false,
      activePhase: null,
      uncertaintyNoteKey: "phase.suppressed.adolescent",
      follicular: null,
      luteal: null,
    };
  }

  if (cyclesCount < minCycles) {
    return {
      status: "suppressed",
      reason: "insufficient_history",
      eligible: false,
      activePhase: null,
      uncertaintyNoteKey: "phase.suppressed.insufficient",
      follicular: null,
      luteal: null,
    };
  }

  if (isIrregularCycle) {
    return {
      status: "suppressed",
      reason: "irregular_cycles",
      eligible: false,
      activePhase: null,
      uncertaintyNoteKey: "phase.suppressed.irregular",
      follicular: null,
      luteal: null,
    };
  }

  if (!a?.prediction || !a?.lastStart) {
    return {
      status: "suppressed",
      reason: "insufficient_history",
      eligible: false,
      activePhase: null,
      uncertaintyNoteKey: "phase.suppressed.insufficient",
      follicular: null,
      luteal: null,
    };
  }

  const lastStart = a.lastStart;
  const med = a.prediction.median;
  const ovStart = a.fertility?.ovulation?.start || addDays(a.prediction.start, -CONFIG.lutealDays);
  const ovEnd = a.fertility?.ovulation?.end || addDays(a.prediction.end, -CONFIG.lutealDays);

  const follicularEndDay = Math.max(1, diffDays(lastStart, ovStart));
  const follicular = {
    start: lastStart,
    end: ovStart,
    startDay: 1,
    endDay: follicularEndDay,
    uncertaintyDays: a.prediction.halfWidth,
  };

  const lutealStart = addDays(ovEnd, 1);
  const lutealEnd = a.prediction.start;
  const lutealStartDay = follicularEndDay + 1;
  const lutealEndDay = med;
  const luteal = {
    start: lutealStart,
    end: lutealEnd,
    startDay: lutealStartDay,
    endDay: lutealEndDay,
    uncertaintyDays: a.prediction.halfWidth,
  };

  let activePhase = "follicular";
  if (today < lastStart) {
    activePhase = "unknown";
  } else if (today <= ovEnd) {
    activePhase = "follicular";
  } else if (today <= a.prediction.end) {
    activePhase = "luteal";
  } else {
    activePhase = "overdue";
  }

  return {
    status: "estimate_available",
    reason: null,
    eligible: true,
    activePhase,
    cyclesConsidered: a.prediction.basedOn,
    uncertaintyDays: a.prediction.halfWidth,
    follicular,
    luteal,
  };
}

/**
 * Saheli 7.4 — Authoritative Derived Cycle-State Model
 *
 * Provides a single unified, authoritative cycle state for Today, Calendar,
 * Rhythm Ring, and Insights. Works independently of fertility estimation so that
 * cycle-day and bleeding status tracking remain functional even when fertility
 * or phase estimates are suppressed.
 */
export function getAuthoritativeCycleState(record, targetDate = todayStr()) {
  const days = record?.days || {};
  const settings = record?.settings || {};
  const pregnancy = record?.pregnancy || {};
  const observations = record?.ovulationObservations || {};

  const isPregnancyActive = !!(pregnancy.active || settings.pregnancyMode);
  const isTrackingPaused = !!settings.trackingPaused;
  const isUnder18 =
    settings.ageGroup === "under18" ||
    (settings.birthYear && new Date(targetDate).getFullYear() - Number(settings.birthYear) < 18);
  const effectiveAgeGroup = isUnder18 ? "under18" : settings.ageGroup || "adult";

  const a = analyze(days, {
    ageGroup: effectiveAgeGroup,
    today: targetDate,
    paused: isTrackingPaused || isPregnancyActive,
    pregnancyActive: isPregnancyActive,
    pregnancyMode: isPregnancyActive,
    trackingPaused: isTrackingPaused,
    showFertility: settings.showFertility,
    fertilityOptIn: settings.fertilityOptIn,
  });

  const phaseDiag = getCyclePhaseDiagnostics(
    a,
    {
      ageGroup: effectiveAgeGroup,
      paused: isTrackingPaused || isPregnancyActive,
      pregnancyActive: isPregnancyActive,
      pregnancyMode: isPregnancyActive,
      trackingPaused: isTrackingPaused,
    },
    targetDate,
  );

  // Cycle Day & Menstrual Status Tracking (works independently of fertility)
  const currentCycleStart = a.lastStart;
  const previousCycleStarts = a.periods.slice(0, -1).map((p) => p.start);
  const completedCycleCount = a.cycles ? a.cycles.length : 0;
  const cycleLengthMedian = a.prediction?.median ?? a.stats?.median ?? null;
  const cycleLengthVariability =
    a.prediction?.spread ?? (a.stats ? a.stats.max - a.stats.min : null);

  // Cycle day computation
  let cycleDay = null;
  let isLongCycleGap = false;
  if (currentCycleStart && targetDate >= currentCycleStart) {
    cycleDay = diffDays(currentCycleStart, targetDate) + 1;
    if (cycleDay > 60) {
      isLongCycleGap = true;
    }
  }

  // Current bleeding status for targetDate
  const targetDayEntry = days[targetDate];
  let currentBleedingStatus = "none";
  if (targetDayEntry?.period) {
    currentBleedingStatus = targetDayEntry.flow === "spotting" ? "spotting" : "bleeding";
  } else if (a.inPeriod) {
    currentBleedingStatus = "bleeding";
  }

  // Phase status & estimation method
  let phaseStatus = "uncertain";
  let phaseLabel = "phase.uncertain";
  let phaseEstimationMethod = "educational_only";
  let phaseUncertainty = "phase.uncertainty.general";

  if (isPregnancyActive) {
    phaseStatus = "pregnancy";
    phaseLabel = "phase.pregnancy";
    phaseEstimationMethod = "suppressed";
    phaseUncertainty = "phase.suppressed.pregnancy";
  } else if (isTrackingPaused) {
    phaseStatus = "paused";
    phaseLabel = "phase.paused";
    phaseEstimationMethod = "suppressed";
    phaseUncertainty = "phase.suppressed.paused";
  } else if (
    currentBleedingStatus === "bleeding" ||
    (a.inPeriod && cycleDay && cycleDay <= (a.lastPeriod?.length || 5))
  ) {
    phaseStatus = "menstrual";
    phaseLabel = "phase.menstrual";
    phaseEstimationMethod = "recorded_menstruation";
    phaseUncertainty = "phase.uncertainty.menstrual";
  } else if (phaseDiag.eligible && phaseDiag.status === "estimate_available") {
    phaseStatus = phaseDiag.activePhase; // 'follicular' | 'luteal' | 'overdue'
    phaseLabel = `phase.${phaseDiag.activePhase}`;
    phaseEstimationMethod = "calendar_bounded";
    phaseUncertainty = "phase.uncertainty.estimated";
  } else {
    // Educational phase mapping when calendar prediction is withheld/suppressed
    phaseStatus =
      phaseDiag.activePhase ||
      (cycleDay != null
        ? cycleDay <= 14
          ? "follicular"
          : "luteal"
        : phaseDiag.reason || "uncertain");
    phaseLabel = `phase.${phaseStatus}`;
    phaseEstimationMethod = "educational_only";
    phaseUncertainty = phaseDiag.uncertaintyNoteKey || "phase.uncertainty.general";
  }

  // Ovulation estimate availability status
  const ovulationEstimateStatus = a.fertilityStatus;

  // Ovulation observations in current cycle
  const currentCycleObservations = Object.entries(observations)
    .filter(([d, obs]) => {
      if (obs?.excludedFromCalculations) return false;
      if (currentCycleStart && d < currentCycleStart) return false;
      return d <= targetDate;
    })
    .map(([d, obs]) => ({
      ...obs,
      date: d,
      cycleDay: currentCycleStart ? diffDays(currentCycleStart, d) + 1 : null,
    }))
    .sort((x, y) => x.date.localeCompare(y.date));

  const positiveLhObs = currentCycleObservations.find((o) => o.testResult === "positive");
  const bbtObsList = currentCycleObservations.filter((o) => o.bbt != null);
  const fluidObsList = currentCycleObservations.filter(
    (o) => o.cervicalFluid && o.cervicalFluid !== "none",
  );

  const observationStatusCode = positiveLhObs
    ? "positive_lh_recorded"
    : currentCycleObservations.length > 0
      ? "observations_recorded"
      : "none_recorded";

  const ovulationObservationStatus = {
    status: observationStatusCode,
    hasObservations: currentCycleObservations.length > 0,
    observationCount: currentCycleObservations.length,
    positiveLh: positiveLhObs || null,
    bbtEntries: bbtObsList.length,
    cervicalFluidEntries: fluidObsList.length,
    latestObservation:
      currentCycleObservations.length > 0
        ? currentCycleObservations[currentCycleObservations.length - 1]
        : null,
    currentCycleObservations,
    disclaimer:
      "Ovulation observations indicate recorded biological signs but do not medically guarantee or prove ovulation date.",
  };

  // Plain-language explanation
  let estimateExplanation = "";
  if (isTrackingPaused) {
    estimateExplanation =
      "Tracking paused: Cycle phase and ovulation estimates are temporarily withheld.";
  } else if (isPregnancyActive) {
    estimateExplanation =
      "Pregnancy mode active: Menstrual phase and ovulation estimates are paused.";
  } else {
    switch (ovulationEstimateStatus) {
      case "adolescent_safeguard":
        estimateExplanation =
          "Adolescent guidance: Personalised calendar ovulation estimates are withheld for users under 18 in accordance with clinical safety guidelines.";
        break;
      case "irregular_cycles":
        estimateExplanation =
          "Irregular cycles: Ovulation estimates are withheld because cycle lengths vary by more than 7 days, making calendar predictions medically unreliable.";
        break;
      case "insufficient_history":
        estimateExplanation =
          "Insufficient history: At least 3 completed cycles are required to generate an estimated calendar cycle range.";
        break;
      case "disabled_by_user":
        estimateExplanation = "Fertility and ovulation estimates are turned off in Settings.";
        break;
      case "estimate_available":
        estimateExplanation = `Calendar estimate based on ${completedCycleCount} completed cycles (median length: ${cycleLengthMedian} days). All phase timing is an estimate, not a medical certainty.`;
        break;
      default:
        estimateExplanation = "Record period dates to begin cycle-day and phase tracking.";
    }
  }

  const relevantSourceDates = {
    periodStart: currentCycleStart,
    periodEnd: a.lastPeriod?.end || null,
    predictedNextPeriodStart: a.prediction?.start || null,
    predictedNextPeriodEnd: a.prediction?.end || null,
    estimatedOvulationStart: a.fertility?.ovulation?.start || null,
    estimatedOvulationEnd: a.fertility?.ovulation?.end || null,
    observationDates: currentCycleObservations.map((o) => o.date),
    estimatedFollicularRange: phaseDiag.follicular
      ? { startDay: phaseDiag.follicular.startDay, endDay: phaseDiag.follicular.endDay }
      : null,
    estimatedLutealRange: phaseDiag.luteal
      ? { startDay: phaseDiag.luteal.startDay, endDay: phaseDiag.luteal.endDay }
      : null,
  };

  // Extract symptoms in current cycle for follicular vs luteal days
  const currentFollicularSymptoms = new Set();
  const currentLutealSymptoms = new Set();
  if (currentCycleStart) {
    Object.entries(days).forEach(([d, dayEntry]) => {
      if (d >= currentCycleStart && d <= targetDate && dayEntry?.symptoms?.length) {
        const dNum = diffDays(currentCycleStart, d) + 1;
        const isFoll = phaseDiag.follicular
          ? dNum <= (phaseDiag.follicular.endDay || 14)
          : dNum <= 14;
        dayEntry.symptoms.forEach((sym) => {
          if (isFoll) currentFollicularSymptoms.add(sym);
          else currentLutealSymptoms.add(sym);
        });
      }
    });
  }

  // Prior cycle symptoms patterns for follicular and luteal phases
  const priorFollicularPatterns = new Set();
  const priorLutealPatterns = new Set();
  if (a.cycles && a.cycles.length > 0) {
    a.cycles.forEach((c) => {
      const half = Math.round(c.length / 2);
      for (let offset = 0; offset < c.length; offset++) {
        const dt = addDays(c.start, offset);
        const dayEntry = days[dt];
        if (dayEntry?.symptoms?.length) {
          const dNum = offset + 1;
          dayEntry.symptoms.forEach((sym) => {
            if (dNum <= half) priorFollicularPatterns.add(sym);
            else priorLutealPatterns.add(sym);
          });
        }
      }
    });
  }

  // Follicular Phase Tracker Model
  let follicularStatus = "unknown";
  let follicularEvidence = "boundary_not_established";
  let follicularEndDay = null;
  let follicularProgressPercent = null;
  let follicularElapsedDays = null;

  if (cycleDay != null) {
    follicularElapsedDays = cycleDay;
    if (phaseDiag.eligible && phaseDiag.follicular) {
      follicularEndDay = phaseDiag.follicular.endDay;
      follicularEvidence = positiveLhObs ? "supported_by_observations" : "calendar_estimate";
      follicularProgressPercent = Math.min(
        100,
        Math.max(0, Math.round((cycleDay / follicularEndDay) * 100)),
      );
      if (cycleDay <= follicularEndDay) {
        follicularStatus = "current";
      } else {
        follicularStatus = "past";
      }
    } else {
      follicularStatus = cycleDay <= 14 ? "current" : "past";
      follicularEvidence = positiveLhObs ? "supported_by_observations" : "boundary_not_established";
      follicularEndDay = null;
      follicularProgressPercent = null;
    }
  }

  const follicularTracker = {
    titleKey: "phase.follicularTrackerTitle",
    status: follicularStatus,
    evidence: follicularEvidence,
    startDay: 1,
    endDay: follicularEndDay,
    elapsedDays: follicularElapsedDays,
    progressPercent: follicularProgressPercent,
    uncertaintyDays: phaseDiag.eligible ? a.prediction?.halfWidth || 2 : null,
    currentSymptoms: Array.from(currentFollicularSymptoms),
    previousPatterns: Array.from(priorFollicularPatterns),
    boundaryNoteKey: phaseDiag.eligible
      ? "phase.follicularBoundary"
      : "phase.boundaryNotEstablishedDesc",
  };

  // Luteal Phase Tracker Model
  let lutealStatus = "unknown";
  let lutealEvidence = "boundary_not_established";
  let lutealStartDay = null;
  let lutealEndDay = null;
  let lutealElapsedDays = null;
  let lutealRemainingDays = null;
  let lutealProgressPercent = null;

  if (cycleDay != null) {
    if (phaseDiag.eligible && phaseDiag.luteal) {
      lutealStartDay = phaseDiag.luteal.startDay;
      lutealEndDay = phaseDiag.luteal.endDay;
      lutealEvidence = positiveLhObs ? "supported_by_observations" : "calendar_estimate";
      const totalLutealDays = Math.max(1, lutealEndDay - lutealStartDay + 1);

      if (cycleDay < lutealStartDay) {
        lutealStatus = "upcoming";
        lutealElapsedDays = 0;
        lutealRemainingDays = totalLutealDays;
        lutealProgressPercent = 0;
      } else if (cycleDay <= lutealEndDay) {
        lutealStatus = "current";
        lutealElapsedDays = cycleDay - lutealStartDay + 1;
        lutealRemainingDays = Math.max(0, lutealEndDay - cycleDay);
        lutealProgressPercent = Math.min(
          100,
          Math.round((lutealElapsedDays / totalLutealDays) * 100),
        );
      } else {
        lutealStatus = "past";
        lutealElapsedDays = totalLutealDays;
        lutealRemainingDays = 0;
        lutealProgressPercent = 100;
      }
    } else {
      lutealStatus = cycleDay > 14 ? "current" : "upcoming";
      lutealEvidence = positiveLhObs ? "supported_by_observations" : "boundary_not_established";
      lutealStartDay = null;
      lutealEndDay = null;
      lutealElapsedDays = null;
      lutealRemainingDays = null;
      lutealProgressPercent = null;
    }
  }

  const lutealTracker = {
    titleKey: "phase.lutealTrackerTitle",
    status: lutealStatus,
    evidence: lutealEvidence,
    startDay: lutealStartDay,
    endDay: lutealEndDay,
    elapsedDays: lutealElapsedDays,
    remainingDays: lutealRemainingDays,
    progressPercent: lutealProgressPercent,
    uncertaintyDays: phaseDiag.eligible ? a.prediction?.halfWidth || 2 : null,
    currentSymptoms: Array.from(currentLutealSymptoms),
    previousPatterns: Array.from(priorLutealPatterns),
    boundaryNoteKey: phaseDiag.eligible
      ? "phase.lutealBoundary"
      : "phase.boundaryNotEstablishedDesc",
  };

  // Past Recorded Cycles Detail (for cycle history selector)
  const pastCycles = (a.cycles || [])
    .map((c, idx) => {
      const cycleObservations = Object.entries(observations)
        .filter(([d]) => d >= c.start && d < c.nextStart)
        .map(([d, obs]) => ({ ...obs, date: d, cycleDay: diffDays(c.start, d) + 1 }));

      const cycleSymptoms = [];
      for (let i = 0; i < c.length; i++) {
        const dt = addDays(c.start, i);
        const e = days[dt];
        if (e?.symptoms?.length) {
          cycleSymptoms.push({ date: dt, cycleDay: i + 1, symptoms: e.symptoms });
        }
      }

      const cyclePeriodDays = [];
      for (let i = 0; i < c.length; i++) {
        const dt = addDays(c.start, i);
        if (days[dt]?.period) {
          cyclePeriodDays.push(dt);
        }
      }

      const estimatedMid = Math.round(c.length / 2);
      return {
        cycleNumber: idx + 1,
        start: c.start,
        nextStart: c.nextStart,
        end: addDays(c.nextStart, -1),
        length: c.length,
        periodDuration: cyclePeriodDays.length,
        periodDays: cyclePeriodDays,
        symptomsCount: cycleSymptoms.reduce((acc, s) => acc + s.symptoms.length, 0),
        symptoms: cycleSymptoms,
        observationsCount: cycleObservations.length,
        observations: cycleObservations,
        estimatedFollicularEnd: estimatedMid,
        estimatedLutealStart: estimatedMid + 1,
        hasObservations: cycleObservations.length > 0,
      };
    })
    .reverse();

  return {
    cycleDay,
    isLongCycleGap,
    currentCycleStart,
    previousCycleStarts,
    completedCycleCount,
    cycleLengthMedian,
    cycleLengthVariability,
    currentBleedingStatus,
    phaseStatus,
    phaseLabel,
    phaseEstimationMethod,
    phaseUncertainty,
    ovulationEstimateStatus,
    ovulationObservationStatus,
    estimateExplanation,
    relevantSourceDates,
    follicularTracker,
    lutealTracker,
    pastCycles,
    phaseDiagnostics: phaseDiag,
    analysis: a,
    lastCalculatedAt: new Date().toISOString(),
    calculationVersion: "7.4.0",
  };
}
