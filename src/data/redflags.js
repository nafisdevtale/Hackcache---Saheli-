// Doctor-guidance rules. Each check returns evidence items or null.
// Evidence: { kind: 'period'|'cycle'|'day', start, end?, n? }
// Texts: i18n keys "rf.<id>.title|why|action".
import { CONFIG } from "../config.js";
import { addDays, diffDays } from "../lib/localDate.js";

const daysWhere = (days, fn) => Object.keys(days).sort().filter((d) => fn(days[d] || {}));
const dayEv = (ds) => (ds.length ? ds.slice(-6).map((d) => ({ kind: "day", start: d })) : null);

export const RED_FLAG_RULES = [
  {
    id: "long_period",
    sources: ["nhs_heavy", "acog_heavy"],
    check: ({ analysis }) => {
      const ev = analysis.periods.filter((p) => p.length > CONFIG.longPeriodDays).map((p) => ({ kind: "period", start: p.start, end: p.end, n: p.length }));
      return ev.length ? ev : null;
    },
  },
  { id: "pad_hourly", sources: ["nhs_heavy", "acog_heavy"], check: ({ days }) => dayEv(daysWhere(days, (e) => e.padHourly === true)) },
  { id: "clots", sources: ["nhs_heavy"], check: ({ days }) => dayEv(daysWhere(days, (e) => e.bigClots === true)) },
  {
    id: "cycle_range",
    sources: ["acog_adolescent", "nhs_irregular"],
    check: ({ analysis, ageGroup }) => {
      const max = ageGroup === "under18" ? CONFIG.cycleLongUnder18 : CONFIG.cycleLongAdult;
      const out = (c) => c.length < CONFIG.cycleShort || c.length > max;
      const cs = analysis.cycles;
      for (let i = cs.length - CONFIG.consecutiveCycles; i >= 0; i--) {
        const run = cs.slice(i, i + CONFIG.consecutiveCycles);
        if (run.length === CONFIG.consecutiveCycles && run.every(out)) return run.map((c) => ({ kind: "cycle", start: c.start, end: addDays(c.nextStart, -1), n: c.length }));
      }
      return null;
    },
    params: ({ ageGroup }) => ({ min: CONFIG.cycleShort, max: ageGroup === "under18" ? CONFIG.cycleLongUnder18 : CONFIG.cycleLongAdult }),
  },
  {
    id: "no_period_90",
    sources: ["nhs_missed"],
    check: ({ analysis, today, pregnancyActive }) => {
      if (pregnancyActive || !analysis.lastStart) return null;
      const gap = diffDays(analysis.lastStart, today);
      return gap >= CONFIG.noPeriodDays ? [{ kind: "day", start: analysis.lastStart, n: gap }] : null;
    },
  },
  { id: "intermenstrual", sources: ["nhs_irregular", "acog_heavy"], check: ({ days }) => dayEv(daysWhere(days, (e) => (e.symptoms || []).some((s) => s === "bleeding_between" || s === "bleeding_after_sex"))) },
  { id: "pain_disruptive", sources: ["nhs_pain", "acog_dysmenorrhea"], check: ({ days }) => dayEv(daysWhere(days, (e) => e.painStoppedActivities === true || e.painkillerHelped === "no")) },
  {
    id: "anaemia",
    sources: ["nhs_anaemia", "nhs_heavy"],
    check: ({ days, analysis }) => {
      const ev = [];
      for (const p of analysis.periods) {
        const heavy = p.days.some((d) => days[d]?.flow === "heavy");
        const tired = p.days.some((d) => (days[d]?.symptoms || []).some((s) => ["tiredness", "breathless", "dizziness"].includes(s)));
        if (heavy && tired) ev.push({ kind: "period", start: p.start, end: p.end, n: p.length });
      }
      return ev.length ? ev.slice(-6) : null;
    },
  },
];

// Urgent: only entries in the last CONFIG.urgentRecentDays days.
export const URGENT_RULES = [
  { id: "sudden_pain", sources: ["nhs_pain", "india_112"], check: ({ recent }) => recent.filter((e) => (e.symptoms || []).includes("sudden_severe_pain")) },
  { id: "heavy_faint", sources: ["nhs_heavy", "india_112"], check: ({ recent }) => recent.filter((e) => (e.flow === "heavy" || e.padHourly) && (e.symptoms || []).some((s) => s === "fainting" || s === "dizziness")) },
  { id: "preg_bleeding", sources: ["nhs_preg_bleeding", "india_112"], check: ({ recent, pregnancyActive }) => (pregnancyActive ? recent.filter((e) => e.period || e.flow || (e.pain || 0) >= 7 || (e.symptoms || []).includes("bleeding_between")) : []) },
];

// Important signs the app cannot detect from logs.
export const UNLOGGABLE_SIGNS = [
  { id: "no_period_15", sources: ["acog_adolescent", "nhs_starting"] },
  { id: "sudden_change", sources: ["nhs_irregular"] },
  { id: "postmenopause", sources: ["nhs_pmb"] },
];
