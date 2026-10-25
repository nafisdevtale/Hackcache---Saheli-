import { CONFIG } from "../config.js";
import { addDays, diffDays, todayStr } from "./localDate.js";
import { RED_FLAG_RULES, URGENT_RULES } from "../data/redflags.js";
import { calculateAge } from "./agePolicy.ts";

export function evaluateSafety({ record, analysis, today = todayStr() }) {
  const days = record.days || {};
  const isUnder18 =
    record.settings?.ageGroup === "under18" ||
    (record.settings?.dob && calculateAge(record.settings.dob, today).isUnder18);
  const ageGroup = isUnder18 ? "under18" : record.settings?.ageGroup || "adult";
  const pregnancyActive = !!record.pregnancy?.active;
  const ctx = { days, analysis, today, ageGroup, pregnancyActive };

  const cards = [];
  for (const r of RED_FLAG_RULES) {
    const evidence = r.check(ctx);
    if (evidence && evidence.length)
      cards.push({
        id: r.id,
        severity: "doctor",
        evidence,
        sources: r.sources,
        params: r.params ? r.params(ctx) : {},
      });
  }

  const recentDates = Object.keys(days).filter(
    (d) => d <= today && diffDays(d, today) < CONFIG.urgentRecentDays,
  );
  const recent = recentDates.sort().map((d) => ({ ...days[d], date: d }));
  const urgent = [];
  for (const r of URGENT_RULES) {
    const hits = r.check({ ...ctx, recent });
    if (hits.length)
      urgent.push({
        id: r.id,
        severity: "urgent",
        evidence: hits.map((e) => ({ kind: "day", start: e.date })),
        sources: r.sources,
      });
  }

  return { cards, urgent, mood: lowMoodRun(days, today) };
}

export function lowMoodRun(days, today = todayStr()) {
  let run = [];
  let best = null;
  for (let i = CONFIG.lowMoodLookbackDays; i >= 0; i--) {
    const d = addDays(today, -i);
    if (days[d]?.mood === "very_low") {
      run.push(d);
      if (run.length >= CONFIG.lowMoodDays) best = [...run];
    } else run = [];
  }
  return best ? { dates: best } : null;
}
