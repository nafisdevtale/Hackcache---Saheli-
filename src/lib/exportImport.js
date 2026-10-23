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
  let s = v == null ? "" : String(v);
  // Protect against spreadsheet formula injection (CSV Injection / DDE)
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
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

/**
 * Robust CSV parser supporting quotes, multiline values, and formula sanitization.
 */
export function parseCSVText(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        // ignore carriage returns
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Parse date from ISO YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
 */
function normalizeCsvDate(rawDate) {
  if (!rawDate) return null;
  const trimmed = rawDate.trim().replace(/^['"]|['"]$/g, "");
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidDate(trimmed) ? trimmed : null;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return isValidDate(iso) ? iso : null;
  }
  return null;
}

/**
 * Sanitizes cell input by stripping formula injection prefix
 */
function sanitizeCsvValue(val) {
  if (typeof val !== "string") return val;
  let s = val.trim();
  if (s.startsWith("'") && /^[=+\-@\t\r]/.test(s.slice(1))) {
    s = s.slice(1);
  }
  return s;
}

/**
 * Validates and imports CSV data into a clean Saheli record
 */
export function parseCSVImport(csvText) {
  if (!csvText || typeof csvText !== "string") {
    return { ok: false, error: "imp.csvEmpty" };
  }

  const rows = parseCSVText(csvText);
  if (rows.length < 2) {
    return { ok: false, error: "imp.csvNoData" };
  }

  const rawHeaders = rows[0].map((h) => sanitizeCsvValue(h).toLowerCase());
  const headerMap = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const dateIdx = headerMap["date"];
  if (dateIdx === undefined) {
    return { ok: false, error: "imp.csvMissingDateHeader" };
  }

  const rec = emptyRecord();
  const errors = [];
  let validCount = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && !row[0].trim()) continue; // skip blank lines

    const rawDate = row[dateIdx];
    const normalizedDate = normalizeCsvDate(rawDate);

    if (!normalizedDate) {
      errors.push({ row: r + 1, error: "imp.badEntry", date: rawDate });
      continue;
    }

    const day = blankDay(normalizedDate);

    // period
    if (headerMap["period"] !== undefined) {
      const v = sanitizeCsvValue(row[headerMap["period"]]).toLowerCase();
      day.period = v === "true" || v === "1" || v === "yes";
    }

    // flow
    if (headerMap["flow"] !== undefined) {
      const f = sanitizeCsvValue(row[headerMap["flow"]]).toLowerCase();
      if (["spotting", "light", "medium", "heavy"].includes(f)) {
        day.flow = f;
      }
    }

    // pain
    if (headerMap["pain"] !== undefined) {
      const p = parseInt(sanitizeCsvValue(row[headerMap["pain"]]), 10);
      if (!isNaN(p) && p >= 0 && p <= 5) {
        day.pain = p;
      }
    }

    // symptoms
    if (headerMap["symptoms"] !== undefined) {
      const symStr = sanitizeCsvValue(row[headerMap["symptoms"]]);
      if (symStr) {
        day.symptoms = symStr
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter((s) => SYMPTOM_IDS.includes(s));
      }
    }

    // mood
    if (headerMap["mood"] !== undefined) {
      const m = sanitizeCsvValue(row[headerMap["mood"]]).toLowerCase();
      if (MOODS.includes(m)) day.mood = m;
    }

    // energy
    if (headerMap["energy"] !== undefined) {
      const e = sanitizeCsvValue(row[headerMap["energy"]]).toLowerCase();
      if (ENERGY.includes(e)) day.energy = e;
    }

    // note & medicines
    if (headerMap["note"] !== undefined) {
      day.note = sanitizeCsvValue(row[headerMap["note"]]).substring(0, 2000);
    }
    if (headerMap["medicines"] !== undefined) {
      day.medicines = sanitizeCsvValue(row[headerMap["medicines"]]).substring(0, 300);
    }

    rec.days[normalizedDate] = day;
    validCount++;
  }

  if (validCount === 0) {
    return { ok: false, error: "imp.csvNoValidEntries", errors };
  }

  return { ok: true, record: rec, validCount, totalRows: rows.length - 1, errors };
}

/**
 * Generate a printable / PDF document with embedded machine-readable payload
 */
export function generateDoctorSummaryPDF(record, analysis, options = {}) {
  const jsonPayload = exportJSON(record);
  let base64Payload = "";
  try {
    if (typeof Buffer !== "undefined") {
      base64Payload = Buffer.from(jsonPayload, "utf-8").toString("base64");
    } else if (typeof btoa !== "undefined") {
      base64Payload = btoa(unescape(encodeURIComponent(jsonPayload)));
    }
  } catch {}

  const periodDays = Object.values(record.days).filter((d) => d.period);
  const cycleCount = analysis?.cycles?.length || 0;
  const avgLength = analysis?.stats?.meanLength ? Math.round(analysis.stats.meanLength) : "N/A";
  const exportedAt = new Date().toLocaleDateString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Saheli Menstrual Health Summary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1f2937; line-height: 1.5; }
    h1 { color: #831843; margin-bottom: 4px; font-size: 24px; }
    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .stat-grid { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 12px 16px; flex: 1; }
    .stat-val { font-size: 20px; font-weight: bold; color: #9d174d; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #e5e7eb; font-weight: bold; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #fce7f3; color: #be185d; }
    .disclaimer { margin-top: 32px; padding: 16px; border-radius: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 12px; color: #4b5563; }
  </style>
</head>
<body>
  <!-- SAHELI_RECORD_PAYLOAD_V1:${base64Payload} -->
  <h1>Saheli · Clinical Health Summary</h1>
  <div class="subtitle">Generated on ${exportedAt} · Private On-Device Record</div>

  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-lbl">Completed Cycles</div>
      <div class="stat-val">${cycleCount}</div>
    </div>
    <div class="stat-box">
      <div class="stat-lbl">Average Cycle Length</div>
      <div class="stat-val">${avgLength} days</div>
    </div>
    <div class="stat-box">
      <div class="stat-lbl">Total Period Days Logged</div>
      <div class="stat-val">${periodDays.length}</div>
    </div>
  </div>

  <h2>Recent Period & Symptom Log</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Period</th>
        <th>Flow</th>
        <th>Pain (0-5)</th>
        <th>Symptoms</th>
      </tr>
    </thead>
    <tbody>
      ${Object.keys(record.days)
        .sort()
        .reverse()
        .slice(0, 30)
        .map((k) => {
          const d = record.days[k];
          return `<tr>
            <td><strong>${k}</strong></td>
            <td>${d.period ? '<span class="badge">Period</span>' : "-"}</td>
            <td>${d.flow || "-"}</td>
            <td>${d.pain > 0 ? d.pain : "0"}</td>
            <td>${d.symptoms?.length ? d.symptoms.join(", ") : "-"}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <div class="disclaimer">
    <strong>Clinical Notice:</strong> This summary was generated from patient-recorded observations in the Saheli Menstrual Health Companion. Saheli operates 100% locally on-device. Ovulation estimates are educational and strictly suppressed when cycle variability exceeds clinical thresholds.
  </div>
</body>
</html>`;
}

/**
 * Extracts and validates embedded Saheli payload from an exported PDF/HTML file
 */
export function parsePDFImport(content) {
  if (!content || typeof content !== "string") {
    return { ok: false, error: "imp.unsupportedPdfNoPayload" };
  }

  // Look for the versioned embedded payload
  const match = content.match(/<!--\s*SAHELI_RECORD_PAYLOAD_V1:([A-Za-z0-9+/=]+)\s*-->/);
  if (!match || !match[1]) {
    return {
      ok: false,
      error: "imp.unsupportedPdfNoPayload",
      explanation:
        "This PDF does not contain an embedded Saheli backup payload. To protect your data, only Saheli-generated PDFs can be imported automatically.",
    };
  }

  try {
    let rawJson = "";
    if (typeof Buffer !== "undefined") {
      rawJson = Buffer.from(match[1], "base64").toString("utf-8");
    } else if (typeof atob !== "undefined") {
      rawJson = decodeURIComponent(escape(atob(match[1])));
    }
    return parseImport(rawJson);
  } catch {
    return { ok: false, error: "imp.corruptedPdfPayload" };
  }
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
