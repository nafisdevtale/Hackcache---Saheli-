import { isValidDate } from "./localDate.js";
import { SYMPTOM_IDS, MOODS, ENERGY, FLOWS } from "../data/symptoms.js";

export const DEFAULT_DASHBOARD_WIDGETS = [
  { id: "rhythmRing", visible: true },
  { id: "nextPeriod", visible: true },
  { id: "todayLog", visible: true },
  { id: "reminders", visible: true },
  { id: "fertility", visible: true },
  { id: "insights", visible: true },
  { id: "learning", visible: true },
  { id: "doctorShortcuts", visible: true },
];

export function emptyRecord() {
  return {
    version: 1,
    days: {},
    settings: {
      ageGroup: "adult",
      trackedSymptoms: [...SYMPTOM_IDS],
      customSymptoms: [],
      symptomCategories: ["physical", "emotional", "digestive", "sleep_energy", "safety"],
      quickLogFavorites: ["cramps", "headache", "tiredness", "bloating"],
      dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
      showFertility: true,
      fertilityOptIn: false,
      pregnancyOptIn: false,
      trackingPaused: false,
      discreetMode: false,
    },
    pregnancy: { active: false, lmp: null },
    reminders: {
      notify: false,
      nextPeriod: false,
      daily: { on: false, time: "20:00" },
      medicines: [],
      custom: { on: false, text: "", time: "09:00" },
      quietHours: { on: false, start: "22:00", end: "07:00" },
    },
  };
}

export function normalizeRecord(r) {
  const e = emptyRecord();
  if (!r || typeof r !== "object") return e;
  return {
    version: 1,
    days: r.days && typeof r.days === "object" ? r.days : {},
    settings: {
      ...e.settings,
      ...(r.settings || {}),
      customSymptoms: Array.isArray(r.settings?.customSymptoms) ? r.settings.customSymptoms : [],
      symptomCategories: Array.isArray(r.settings?.symptomCategories)
        ? r.settings.symptomCategories
        : e.settings.symptomCategories,
      quickLogFavorites: Array.isArray(r.settings?.quickLogFavorites)
        ? r.settings.quickLogFavorites
        : e.settings.quickLogFavorites,
      dashboardWidgets: Array.isArray(r.settings?.dashboardWidgets)
        ? r.settings.dashboardWidgets
        : [...e.settings.dashboardWidgets],
    },
    pregnancy: { ...e.pregnancy, ...(r.pregnancy || {}) },
    reminders: {
      ...e.reminders,
      ...(r.reminders || {}),
      daily: { ...e.reminders.daily, ...(r.reminders?.daily || {}) },
      custom: { ...e.reminders.custom, ...(r.reminders?.custom || {}) },
      quietHours: { ...e.reminders.quietHours, ...(r.reminders?.quietHours || {}) },
    },
  };
}

export function blankDay(date) {
  return {
    date,
    period: false,
    flow: null,
    padHourly: null,
    bigClots: null,
    pain: 0,
    painStoppedActivities: false,
    painkillerHelped: "na",
    symptoms: [],
    symptomIntensities: {},
    mood: null,
    energy: null,
    sleep: null,
    medicines: "",
    note: "",
  };
}

const ALLOWED_DAY_KEYS = [
  "date",
  "period",
  "flow",
  "padHourly",
  "bigClots",
  "pain",
  "painStoppedActivities",
  "painkillerHelped",
  "symptoms",
  "symptomIntensities",
  "mood",
  "energy",
  "sleep",
  "medicines",
  "note",
];
const ALLOWED_ROOT_KEYS = ["version", "days", "settings", "pregnancy", "reminders"];
const ALLOWED_SETTINGS_KEYS = [
  "ageGroup",
  "trackedSymptoms",
  "customSymptoms",
  "symptomCategories",
  "quickLogFavorites",
  "dashboardWidgets",
  "showFertility",
  "fertilityOptIn",
  "pregnancyOptIn",
  "trackingPaused",
  "discreetMode",
];
const ALLOWED_PREGNANCY_KEYS = ["active", "lmp"];
const ALLOWED_REMINDERS_KEYS = [
  "notify",
  "nextPeriod",
  "daily",
  "medicines",
  "custom",
  "quietHours",
];
const ALLOWED_DAILY_KEYS = ["on", "time"];
const ALLOWED_CUSTOM_KEYS = ["on", "text", "time"];
const ALLOWED_MEDICINE_KEYS = ["name", "time"];
const ALLOWED_QUIET_HOURS_KEYS = ["on", "start", "end"];

const hasOnlyKeys = (obj, allowed) => {
  const keys = Object.keys(obj);
  return keys.length === allowed.length && keys.every((k) => allowed.includes(k));
};

const hasOnlyRemindersKeys = (obj) => {
  const keys = Object.keys(obj);
  const required = ["notify", "nextPeriod", "daily", "medicines", "custom"];
  return (
    required.every((k) => keys.includes(k)) && keys.every((k) => ALLOWED_REMINDERS_KEYS.includes(k))
  );
};

const hasOnlySettingsKeys = (obj) => {
  const keys = Object.keys(obj);
  const required = [
    "ageGroup",
    "trackedSymptoms",
    "showFertility",
    "fertilityOptIn",
    "pregnancyOptIn",
    "trackingPaused",
  ];
  return (
    required.every((k) => keys.includes(k)) && keys.every((k) => ALLOWED_SETTINGS_KEYS.includes(k))
  );
};

// Validates a single day entry; returns list of error keys.
export function validateDay(d) {
  const errs = [];
  if (!Object.keys(d).every((k) => ALLOWED_DAY_KEYS.includes(k))) {
    errs.push("imp.badEntry");
  }
  if (
    typeof d.period !== "boolean" ||
    typeof d.painStoppedActivities !== "boolean" ||
    ![true, false, null].includes(d.padHourly) ||
    ![true, false, null].includes(d.bigClots) ||
    !["yes", "no", "na"].includes(d.painkillerHelped)
  )
    errs.push("imp.badEntry");
  if (!isValidDate(d.date)) errs.push("err.date");
  if (d.flow != null && !FLOWS.includes(d.flow)) errs.push("err.flow");
  if (!Number.isInteger(d.pain) || d.pain < 0 || d.pain > 10) errs.push("err.pain");
  if (
    d.sleep != null &&
    (typeof d.sleep !== "number" || isNaN(d.sleep) || d.sleep < 0 || d.sleep > 24)
  )
    errs.push("err.sleep");
  if (d.mood != null && !MOODS.includes(d.mood)) errs.push("err.mood");
  if (d.energy != null && !ENERGY.includes(d.energy)) errs.push("err.energy");
  if (
    !Array.isArray(d.symptoms) ||
    d.symptoms.some(
      (s) =>
        typeof s !== "string" ||
        s.length > 35 ||
        (!SYMPTOM_IDS.includes(s) && !s.startsWith("c_") && !s.startsWith("custom_")),
    )
  )
    errs.push("err.symptoms");
  if (
    d.symptomIntensities != null &&
    (typeof d.symptomIntensities !== "object" ||
      Array.isArray(d.symptomIntensities) ||
      Object.entries(d.symptomIntensities).some(
        ([sym, int]) =>
          (!SYMPTOM_IDS.includes(sym) && !sym.startsWith("c_") && !sym.startsWith("custom_")) ||
          !["mild", "moderate", "severe"].includes(int),
      ))
  )
    errs.push("err.symptoms");
  if (typeof d.note !== "string" || d.note.length > 2000) errs.push("err.note");
  if (typeof d.medicines !== "string" || d.medicines.length > 300) errs.push("err.medicines");
  return errs;
}

export function exportJSON(record) {
  return JSON.stringify(
    { app: "saheli", format: 1, exportedAt: new Date().toISOString(), record },
    null,
    2,
  );
}

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function exportCSV(record) {
  const cols = [
    "date",
    "period",
    "flow",
    "padHourly",
    "bigClots",
    "pain",
    "painStoppedActivities",
    "painkillerHelped",
    "symptoms",
    "mood",
    "energy",
    "sleep",
    "medicines",
    "note",
  ];
  const rows = Object.keys(record.days)
    .sort()
    .map((k) => {
      const d = { ...blankDay(k), ...record.days[k] };
      return cols.map((c) => csvCell(c === "symptoms" ? d.symptoms.join(";") : d[c])).join(",");
    });
  return [cols.join(","), ...rows].join("\n");
}

// Returns { ok, record?, error? }. Never mutates storage.
export function parseImport(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: "imp.notJson" };
  }
  if (!obj || obj.app !== "saheli" || obj.format !== 1 || !obj.record)
    return { ok: false, error: "imp.wrongFormat" };
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const raw = obj.record;
  if (
    !object(raw) ||
    !hasOnlyKeys(raw, ALLOWED_ROOT_KEYS) ||
    raw.version !== 1 ||
    !object(raw.days) ||
    !object(raw.settings) ||
    !hasOnlySettingsKeys(raw.settings) ||
    !object(raw.pregnancy) ||
    !hasOnlyKeys(raw.pregnancy, ALLOWED_PREGNANCY_KEYS) ||
    !object(raw.reminders) ||
    !hasOnlyRemindersKeys(raw.reminders) ||
    !object(raw.reminders.daily) ||
    !hasOnlyKeys(raw.reminders.daily, ALLOWED_DAILY_KEYS) ||
    !object(raw.reminders.custom) ||
    !hasOnlyKeys(raw.reminders.custom, ALLOWED_CUSTOM_KEYS) ||
    (raw.reminders.quietHours &&
      (!object(raw.reminders.quietHours) ||
        !hasOnlyKeys(raw.reminders.quietHours, ALLOWED_QUIET_HOURS_KEYS)))
  )
    return { ok: false, error: "imp.wrongFormat" };
  const rec = normalizeRecord(obj.record);
  const s = rec.settings,
    p = rec.pregnancy,
    r = rec.reminders;
  const time = (v) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  const bool = (v) => typeof v === "boolean";
  if (
    !["adult", "under18"].includes(s.ageGroup) ||
    !Array.isArray(s.trackedSymptoms) ||
    s.trackedSymptoms.some((id) => !SYMPTOM_IDS.includes(id)) ||
    [
      s.showFertility,
      s.fertilityOptIn,
      s.pregnancyOptIn,
      s.trackingPaused,
      p.active,
      r.notify,
      r.nextPeriod,
      r.daily.on,
      r.custom.on,
    ].some((v) => !bool(v)) ||
    (s.discreetMode !== undefined && !bool(s.discreetMode)) ||
    (s.symptomCategories &&
      (!Array.isArray(s.symptomCategories) ||
        s.symptomCategories.some((c) => typeof c !== "string"))) ||
    (s.quickLogFavorites &&
      (!Array.isArray(s.quickLogFavorites) ||
        s.quickLogFavorites.some((f) => typeof f !== "string"))) ||
    (s.dashboardWidgets &&
      (!Array.isArray(s.dashboardWidgets) ||
        s.dashboardWidgets.some(
          (w) => !object(w) || typeof w.id !== "string" || typeof w.visible !== "boolean",
        ))) ||
    (p.lmp !== null && !isValidDate(p.lmp)) ||
    (p.active && !isValidDate(p.lmp)) ||
    !time(r.daily.time) ||
    !time(r.custom.time) ||
    typeof r.custom.text !== "string" ||
    r.custom.text.length > 80 ||
    (r.quietHours &&
      (!object(r.quietHours) ||
        !bool(r.quietHours.on) ||
        !time(r.quietHours.start) ||
        !time(r.quietHours.end))) ||
    !Array.isArray(r.medicines) ||
    r.medicines.some(
      (m) =>
        !object(m) ||
        !hasOnlyKeys(m, ALLOWED_MEDICINE_KEYS) ||
        typeof m.name !== "string" ||
        !m.name.trim() ||
        m.name.length > 60 ||
        !time(m.time),
    )
  )
    return { ok: false, error: "imp.wrongFormat" };
  if (raw.settings.customSymptoms != null) {
    if (!Array.isArray(raw.settings.customSymptoms) || raw.settings.customSymptoms.length > 20) {
      return { ok: false, error: "imp.badEntry" };
    }
    for (const cs of raw.settings.customSymptoms) {
      if (
        !object(cs) ||
        typeof cs.id !== "string" ||
        (!cs.id.startsWith("c_") && !cs.id.startsWith("custom_")) ||
        cs.id.length > 35 ||
        typeof cs.label !== "string" ||
        !cs.label.trim() ||
        cs.label.length > 30 ||
        SYMPTOM_IDS.includes(cs.id) ||
        (cs.retired !== undefined && typeof cs.retired !== "boolean")
      ) {
        return { ok: false, error: "imp.badEntry" };
      }
    }
    const ids = raw.settings.customSymptoms.map((c) => c.id);
    const labels = raw.settings.customSymptoms.map((c) => c.label.toLowerCase().trim());
    if (new Set(ids).size !== ids.length || new Set(labels).size !== labels.length) {
      return { ok: false, error: "imp.badEntry" };
    }
  }
  for (const [k, v] of Object.entries(raw.days)) {
    if (!isValidDate(k) || !object(v)) return { ok: false, error: "imp.badEntry", date: k };
    const day = { ...blankDay(k), ...v };
    if (day.date !== k || validateDay(v).length)
      return { ok: false, error: "imp.badEntry", date: k };
    rec.days[k] = day;
  }
  return { ok: true, record: rec };
}

export function mergeRecords(existing, incoming, strategy) {
  if (strategy === "replace") return incoming;
  // merge: existing entries win on conflicting dates — nothing is overwritten
  const existingCustom = existing.settings?.customSymptoms || [];
  const incomingCustom = incoming.settings?.customSymptoms || [];
  const customMap = new Map();
  existingCustom.forEach((c) => customMap.set(c.id, c));
  incomingCustom.forEach((c) => {
    if (!customMap.has(c.id)) customMap.set(c.id, c);
  });

  return {
    ...existing,
    settings: {
      ...existing.settings,
      customSymptoms: Array.from(customMap.values()),
    },
    days: { ...incoming.days, ...existing.days },
  };
}

export function importPreview(existing, incoming) {
  const inc = Object.keys(incoming.days);
  const conflicts = inc.filter((d) => existing.days[d]);
  return { total: inc.length, conflicts: conflicts.length, fresh: inc.length - conflicts.length };
}
