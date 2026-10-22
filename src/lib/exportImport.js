import { isValidDate } from "./localDate.js";
import { SYMPTOM_IDS, MOODS, ENERGY, FLOWS } from "../data/symptoms.js";

export function emptyRecord() {
  return {
    version: 1,
    days: {},
    settings: { ageGroup: "adult", trackedSymptoms: [...SYMPTOM_IDS], showFertility: true, fertilityOptIn: false, pregnancyOptIn: false, trackingPaused: false },
    pregnancy: { active: false, lmp: null },
    reminders: { notify: false, nextPeriod: false, daily: { on: false, time: "20:00" }, medicines: [], custom: { on: false, text: "", time: "09:00" } },
  };
}

export function normalizeRecord(r) {
  const e = emptyRecord();
  if (!r || typeof r !== "object") return e;
  return {
    version: 1,
    days: r.days && typeof r.days === "object" ? r.days : {},
    settings: { ...e.settings, ...(r.settings || {}) },
    pregnancy: { ...e.pregnancy, ...(r.pregnancy || {}) },
    reminders: { ...e.reminders, ...(r.reminders || {}), daily: { ...e.reminders.daily, ...(r.reminders?.daily || {}) }, custom: { ...e.reminders.custom, ...(r.reminders?.custom || {}) } },
  };
}

export function blankDay(date) {
  return { date, period: false, flow: null, padHourly: null, bigClots: null, pain: 0, painStoppedActivities: false, painkillerHelped: "na", symptoms: [], mood: null, energy: null, sleep: null, medicines: "", note: "" };
}

// Validates a single day entry; returns list of error keys.
export function validateDay(d) {
  const errs = [];
  if (!isValidDate(d.date)) errs.push("err.date");
  if (d.flow != null && !FLOWS.includes(d.flow)) errs.push("err.flow");
  if (typeof d.pain !== "number" || d.pain < 0 || d.pain > 10) errs.push("err.pain");
  if (d.sleep != null && (typeof d.sleep !== "number" || isNaN(d.sleep) || d.sleep < 0 || d.sleep > 24)) errs.push("err.sleep");
  if (d.mood != null && !MOODS.includes(d.mood)) errs.push("err.mood");
  if (d.energy != null && !ENERGY.includes(d.energy)) errs.push("err.energy");
  if (!Array.isArray(d.symptoms) || d.symptoms.some((s) => !SYMPTOM_IDS.includes(s))) errs.push("err.symptoms");
  if (typeof d.note !== "string" || d.note.length > 2000) errs.push("err.note");
  if (typeof d.medicines !== "string" || d.medicines.length > 300) errs.push("err.medicines");
  return errs;
}

export function exportJSON(record) {
  return JSON.stringify({ app: "saheli", format: 1, exportedAt: new Date().toISOString(), record }, null, 2);
}

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function exportCSV(record) {
  const cols = ["date", "period", "flow", "padHourly", "bigClots", "pain", "painStoppedActivities", "painkillerHelped", "symptoms", "mood", "energy", "sleep", "medicines", "note"];
  const rows = Object.keys(record.days).sort().map((k) => {
    const d = { ...blankDay(k), ...record.days[k] };
    return cols.map((c) => csvCell(c === "symptoms" ? d.symptoms.join(";") : d[c])).join(",");
  });
  return [cols.join(","), ...rows].join("\n");
}

// Returns { ok, record?, error? }. Never mutates storage.
export function parseImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return { ok: false, error: "imp.notJson" }; }
  if (!obj || obj.app !== "saheli" || obj.format !== 1 || !obj.record) return { ok: false, error: "imp.wrongFormat" };
  const rec = normalizeRecord(obj.record);
  for (const [k, v] of Object.entries(rec.days)) {
    const day = { ...blankDay(k), ...v };
    if (day.date !== k || validateDay(day).length) return { ok: false, error: "imp.badEntry", date: k };
    rec.days[k] = day;
  }
  return { ok: true, record: rec };
}

export function mergeRecords(existing, incoming, strategy) {
  if (strategy === "replace") return incoming;
  // merge: existing entries win on conflicting dates — nothing is overwritten
  return { ...existing, days: { ...incoming.days, ...existing.days } };
}

export function importPreview(existing, incoming) {
  const inc = Object.keys(incoming.days);
  const conflicts = inc.filter((d) => existing.days[d]);
  return { total: inc.length, conflicts: conflicts.length, fresh: inc.length - conflicts.length };
}
