/**
 * Saheli 7.0 — Isolated Developer Synthetic Test Fixtures
 *
 * Strict Privacy & Verification Rules:
 * 1. ZERO personal health data or PII. All dates and logs are strictly synthetic.
 * 2. Generated relative to given todayStr (defaulting to todayStr()).
 * 3. Never auto-merged with actual user records.
 * 4. Used exclusively for deterministic unit testing, clinical verification,
 *    and developer acceptance diagnostics.
 */

import { addDays, todayStr } from "../lib/localDate.js";
import { emptyRecord, blankDay } from "../lib/exportImport.js";

/**
 * Fixture 1: No History (Fresh start, 0 entries)
 * Expected Status: insufficient / unavailable_data
 */
export function buildFixtureNoHistory(today = todayStr(), ageGroup = "adult") {
  const rec = emptyRecord();
  rec.settings.ageGroup = ageGroup;
  return rec;
}

/**
 * Fixture 2: One Completed Cycle (2 periods logged)
 * Period 1: start at today - 42, length 5
 * Period 2: start at today - 14, length 5
 * Cycle length: 28 days (1 complete cycle)
 * Expected Status: insufficient_history (< 3 complete cycles)
 */
export function buildFixtureOneCycle(today = todayStr(), ageGroup = "adult") {
  const rec = emptyRecord();
  rec.settings.ageGroup = ageGroup;

  const starts = [addDays(today, -42), addDays(today, -14)];
  starts.forEach((s) => {
    for (let d = 0; d < 5; d++) {
      const date = addDays(s, d);
      rec.days[date] = {
        ...blankDay(date),
        period: true,
        flow: d === 0 ? "medium" : d === 1 ? "heavy" : "light",
      };
    }
  });

  return rec;
}

/**
 * Fixture 3: Two Completed Cycles (3 periods logged)
 * Cycle lengths: 28 days, 29 days (2 complete cycles)
 * Expected Status: insufficient_history (< 3 complete cycles)
 */
export function buildFixtureTwoCycles(today = todayStr(), ageGroup = "adult") {
  const rec = emptyRecord();
  rec.settings.ageGroup = ageGroup;

  const starts = [addDays(today, -71), addDays(today, -43), addDays(today, -14)];
  starts.forEach((s) => {
    for (let d = 0; d < 5; d++) {
      const date = addDays(s, d);
      rec.days[date] = {
        ...blankDay(date),
        period: true,
        flow: d === 0 ? "medium" : d === 1 ? "heavy" : "light",
      };
    }
  });

  return rec;
}

/**
 * Fixture 4: Several Relatively Regular Adult Cycles (Eligible for Ovulation Estimation)
 * Adult profile, 5 periods logged (4 complete cycles: 28, 29, 28, 29)
 * Spread: 1 day (<= 7 days, well within 21-35 days)
 * Expected Status: estimate_available
 */
export function buildFixtureRegularAdult(today = todayStr()) {
  const rec = emptyRecord();
  rec.settings.ageGroup = "adult";
  rec.settings.showFertility = true;

  const lengths = [28, 29, 28, 29];
  const currentCycleDay = 14;
  let start = addDays(today, -(lengths.reduce((a, b) => a + b, 0) + currentCycleDay - 1));

  const starts = [];
  for (const l of lengths) {
    starts.push(start);
    start = addDays(start, l);
  }
  starts.push(start); // current cycle start (14 days ago)

  starts.forEach((s, i) => {
    for (let d = 0; d < 5; d++) {
      const date = addDays(s, d);
      rec.days[date] = {
        ...blankDay(date),
        period: true,
        flow: d === 0 ? "medium" : d === 1 ? "heavy" : "light",
        pain: d === 0 ? 3 : 1,
        symptoms: d === 0 ? ["cramps"] : [],
      };
    }
  });

  return rec;
}

/**
 * Fixture 5: Highly Variable Adult Cycles (Irregularity Safeguard)
 * Adult profile, 5 periods logged (4 complete cycles: 26, 42, 28, 38)
 * Spread: 16 days (> 7 days maxSpread, and 42 days > 35 days maxLen)
 * Expected Status: irregular_cycles
 */
export function buildFixtureVariableAdult(today = todayStr()) {
  const rec = emptyRecord();
  rec.settings.ageGroup = "adult";
  rec.settings.showFertility = true;

  const lengths = [26, 42, 28, 38];
  const currentCycleDay = 12;
  let start = addDays(today, -(lengths.reduce((a, b) => a + b, 0) + currentCycleDay - 1));

  const starts = [];
  for (const l of lengths) {
    starts.push(start);
    start = addDays(start, l);
  }
  starts.push(start);

  starts.forEach((s) => {
    for (let d = 0; d < 5; d++) {
      const date = addDays(s, d);
      rec.days[date] = {
        ...blankDay(date),
        period: true,
        flow: d === 0 ? "medium" : d === 1 ? "heavy" : "light",
      };
    }
  });

  return rec;
}

/**
 * Fixture 6: Adolescent Profile (Under 18 Safeguard)
 * Age: under 18. Regular cycles (29, 30, 29, 30).
 * Medical Rule: Never display ovulation/fertile estimates for minors.
 * Expected Status: adolescent_safeguard
 */
export function buildFixtureAdolescent(today = todayStr()) {
  const rec = emptyRecord();
  rec.settings.ageGroup = "under18";
  rec.settings.showFertility = true;

  const lengths = [29, 30, 29, 30];
  const currentCycleDay = 10;
  let start = addDays(today, -(lengths.reduce((a, b) => a + b, 0) + currentCycleDay - 1));

  const starts = [];
  for (const l of lengths) {
    starts.push(start);
    start = addDays(start, l);
  }
  starts.push(start);

  starts.forEach((s) => {
    for (let d = 0; d < 5; d++) {
      const date = addDays(s, d);
      rec.days[date] = {
        ...blankDay(date),
        period: true,
        flow: d === 0 ? "medium" : d === 1 ? "heavy" : "light",
      };
    }
  });

  return rec;
}

/**
 * Fixture 7: Disabled Preference
 * Regular adult cycles, but user toggled showFertility: false in Settings.
 * Expected Status: disabled_by_user
 */
export function buildFixtureDisabledPreference(today = todayStr()) {
  const rec = buildFixtureRegularAdult(today);
  rec.settings.showFertility = false;
  return rec;
}

/**
 * Fixture 8: Pregnancy Mode
 * User active in pregnancy mode (pause period predictions, suppress ovulation).
 * Expected Status: pregnancy_mode
 */
export function buildFixturePregnancyMode(today = todayStr()) {
  const rec = buildFixtureRegularAdult(today);
  rec.pregnancy = {
    active: true,
    lastPeriodStart: addDays(today, -70), // ~10 weeks pregnant
    positiveTestDate: addDays(today, -45),
    dueDate: addDays(today, 210),
  };
  return rec;
}

/**
 * Fixture 9: Edited History Changing Eligibility
 * Returns a tuple of [initialVariableRecord, editedRegularRecord] demonstrating
 * that updating an erroneous past period immediately switches state from
 * 'irregular_cycles' to 'estimate_available'.
 */
export function buildFixtureEditedHistoryTransition(today = todayStr()) {
  // Step 1: User initially has erratic cycles with spread > 7 days (26, 42, 28, 38)
  const before = buildFixtureVariableAdult(today);

  // Step 2: User corrects the mislogged entry, restoring regular cycles (28, 29, 28, 29)
  const after = buildFixtureRegularAdult(today);

  return { before, after };
}

/**
 * Fixture 10: Restored / Imported History
 * Demonstrates an exported valid JSON backup payload and reconstituted record
 */
export function buildFixtureRestoredHistory(today = todayStr()) {
  const rec = buildFixtureRegularAdult(today);
  const jsonString = JSON.stringify({
    schema: "saheli",
    version: 3,
    exportedAt: today,
    settings: rec.settings,
    days: rec.days,
    reminders: rec.reminders,
    pregnancy: rec.pregnancy,
  });

  return {
    original: rec,
    jsonString,
  };
}

/**
 * Fixture Catalog Map
 */
export const FIXTURE_CATALOG = {
  profile_no_history: {
    id: "profile_no_history",
    label: "1. No History (0 entries)",
    build: buildFixtureNoHistory,
    expectedFertilityStatus: "unavailable_data",
  },
  profile_one_cycle: {
    id: "profile_one_cycle",
    label: "2. One Completed Cycle",
    build: buildFixtureOneCycle,
    expectedFertilityStatus: "insufficient_history",
  },
  profile_two_cycles: {
    id: "profile_two_cycles",
    label: "3. Two Completed Cycles",
    build: buildFixtureTwoCycles,
    expectedFertilityStatus: "insufficient_history",
  },
  profile_regular_adult: {
    id: "profile_regular_adult",
    label: "4. Regular Adult Cycles (Eligible)",
    build: buildFixtureRegularAdult,
    expectedFertilityStatus: "estimate_available",
  },
  profile_variable_adult: {
    id: "profile_variable_adult",
    label: "5. Variable Adult Cycles (Irregular)",
    build: buildFixtureVariableAdult,
    expectedFertilityStatus: "irregular_cycles",
  },
  profile_adolescent: {
    id: "profile_adolescent",
    label: "6. Adolescent Profile (Under 18)",
    build: buildFixtureAdolescent,
    expectedFertilityStatus: "adolescent_safeguard",
  },
  profile_disabled_preference: {
    id: "profile_disabled_preference",
    label: "7. Disabled Preference (User off)",
    build: buildFixtureDisabledPreference,
    expectedFertilityStatus: "disabled_by_user",
  },
  profile_pregnancy_mode: {
    id: "profile_pregnancy_mode",
    label: "8. Pregnancy Mode Active",
    build: buildFixturePregnancyMode,
    expectedFertilityStatus: "pregnancy_mode",
  },
  profile_edited_history: {
    id: "profile_edited_history",
    label: "9. Edited History (Irregular -> Regular)",
    build: buildFixtureEditedHistoryTransition,
    expectedFertilityStatus: "estimate_available",
  },
  profile_restored_history: {
    id: "profile_restored_history",
    label: "10. Restored / Imported History",
    build: buildFixtureRestoredHistory,
    expectedFertilityStatus: "estimate_available",
  },
};
