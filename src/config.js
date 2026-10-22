// All numeric thresholds used by cycle and safety rules live here.
// Sources for each threshold are listed next to it (see src/content/sources.js).
export const CONFIG = {
  // --- Cycle engine ---
  minCyclesForPrediction: 3, // fewer complete cycles => no prediction
  historyWindow: 6, // last N complete cycles used
  minHalfWidth: 2, // estimate half-width is max(minHalfWidth, spread)
  irregularExtraDays: 3, // extra widening when history is irregular
  periodGroupGapDays: 1, // one unlogged day inside a period still counts as the same period
  // Irregularity (FIGO 2018 normal limits: frequency 24-38 days, variation <=7-9 days).
  // Adolescents (ACOG CO 651): cycles typically 21-45 days in the first years.
  irregular: {
    adult: { maxSpread: 7, minLen: 24, maxLen: 38 }, // figo_aub
    under18: { maxSpread: 9, minLen: 21, maxLen: 45 }, // acog_adolescent
  },
  missingLogFactor: 1.5, // gap > median * factor ...
  missingLogMinExtra: 10, // ... and > median + this => ask if a log was forgotten
  lutealDays: 14, // ovulation ~14 days before next period (nhs_fertility)
  fertileDaysBefore: 5, // fertile window = 5 days before + ovulation day (nhs_fertility)
  patternMinCycles: 3, // a symptom pattern must appear across >= 3 cycles

  // --- Red flags (nhs_heavy, acog_heavy, acog_adolescent, nhs_irregular, nhs_missed) ---
  longPeriodDays: 7,
  cycleShort: 21,
  cycleLongAdult: 35,
  cycleLongUnder18: 45,
  consecutiveCycles: 3,
  noPeriodDays: 90,
  urgentRecentDays: 3, // urgent rules only look at the last N days
  lowMoodDays: 3, // consecutive "very low" days => Tele-MANAS support
  lowMoodLookbackDays: 14,

  // --- Pregnancy (nhs_duedate) ---
  gestationDays: 280,

  // --- Encryption ---
  // PBKDF2-HMAC-SHA256, 600,000 iterations (OWASP Password Storage Cheat Sheet, 2023).
  pbkdf2Iterations: 600000,
  maxPinAttemptsBeforeDelay: 5,
  pinDelayMs: 30000,
};

export const EMERGENCY = { national: "112", ambulance: "108", teleManas: "14416" };
