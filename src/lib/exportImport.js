import { isValidDate } from "./localDate.js";
import { SYMPTOM_IDS, MOODS, ENERGY, FLOWS } from "../data/symptoms.js";
import { translate } from "../i18n/index.js";
import { formatDate, formatInteger } from "./locale.js";

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

export function defaultHealthConditions() {
  return {
    conditions: [], // array of { id: string, status: "confirmed_diagnosis" | "being_evaluated" | "seeking_info" }
    otherText: "",
    preferNotToSay: false,
    personalisationEnabled: true,
    lastUpdated: null,
  };
}

export function defaultOvulationObservation(date = "") {
  return {
    date,
    testResult: "none", // "none" | "negative" | "faint" | "positive"
    bbt: null, // number or null
    bbtUnit: "C", // "C" | "F"
    cervicalFluid: "none", // "none" | "dry" | "sticky" | "creamy" | "eggwhite" | "watery"
    notes: "",
    source: "manual", // "manual" | "kit" | "temp"
    excludedFromCalculations: false,
  };
}

export const ALLOWED_OBSERVATION_KEYS = [
  "date",
  "testResult",
  "bbt",
  "bbtUnit",
  "cervicalFluid",
  "notes",
  "source",
  "excludedFromCalculations",
];

export function validateObservation(obs) {
  if (!obs || typeof obs !== "object") return false;
  if (!Object.keys(obs).every((k) => ALLOWED_OBSERVATION_KEYS.includes(k))) return false;
  if (obs.date && !isValidDate(obs.date)) return false;
  if (obs.testResult && !["none", "negative", "faint", "positive"].includes(obs.testResult))
    return false;
  if (obs.bbt != null) {
    if (typeof obs.bbt !== "number" || isNaN(obs.bbt)) return false;
    if (obs.bbtUnit === "F") {
      if (obs.bbt < 85 || obs.bbt > 110) return false;
    } else {
      if (obs.bbt < 30 || obs.bbt > 45) return false;
    }
  }
  if (obs.bbtUnit && !["C", "F"].includes(obs.bbtUnit)) return false;
  if (
    obs.cervicalFluid &&
    !["none", "dry", "sticky", "creamy", "eggwhite", "watery"].includes(obs.cervicalFluid)
  )
    return false;
  if (obs.notes && (typeof obs.notes !== "string" || obs.notes.length > 500)) return false;
  if (obs.source && (typeof obs.source !== "string" || obs.source.length > 50)) return false;
  if (
    obs.excludedFromCalculations !== undefined &&
    typeof obs.excludedFromCalculations !== "boolean"
  )
    return false;
  return true;
}

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
    healthConditions: defaultHealthConditions(),
    ovulationObservations: {},
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
    healthConditions: {
      ...defaultHealthConditions(),
      conditions: Array.isArray(r.healthConditions?.conditions)
        ? r.healthConditions.conditions
            .filter(
              (c) =>
                c &&
                typeof c.id === "string" &&
                [
                  "dysmenorrhea",
                  "pms",
                  "heavy_bleeding",
                  "uterine_fibroids",
                  "pcos",
                  "hypothyroidism",
                  "endometriosis",
                  "adenomyosis",
                  "thyroid_general",
                  "bleeding_disorder",
                  "other",
                ].includes(c.id),
            )
            .map((c) => ({
              id: c.id,
              status: ["confirmed_diagnosis", "being_evaluated", "seeking_info"].includes(c.status)
                ? c.status
                : "confirmed_diagnosis",
            }))
        : [],
      otherText:
        typeof r.healthConditions?.otherText === "string" ? r.healthConditions.otherText : "",
      preferNotToSay:
        typeof r.healthConditions?.preferNotToSay === "boolean"
          ? r.healthConditions.preferNotToSay
          : false,
      personalisationEnabled:
        typeof r.healthConditions?.personalisationEnabled === "boolean"
          ? r.healthConditions.personalisationEnabled
          : true,
      lastUpdated:
        typeof r.healthConditions?.lastUpdated === "string" ? r.healthConditions.lastUpdated : null,
    },
    ovulationObservations:
      r.ovulationObservations && typeof r.ovulationObservations === "object"
        ? Object.fromEntries(
            Object.entries(r.ovulationObservations)
              .filter(([date, obs]) => isValidDate(date) && obs && typeof obs === "object")
              .map(([date, obs]) => [
                date,
                {
                  ...defaultOvulationObservation(date),
                  ...obs,
                  date,
                },
              ]),
          )
        : {},
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
const ALLOWED_ROOT_KEYS = [
  "version",
  "days",
  "settings",
  "pregnancy",
  "reminders",
  "healthConditions",
  "ovulationObservations",
];
const ALLOWED_HEALTH_CONDITIONS_KEYS = [
  "conditions",
  "otherText",
  "preferNotToSay",
  "personalisationEnabled",
  "lastUpdated",
];
const ALLOWED_CONDITION_ITEM_KEYS = ["id", "status"];
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
  "role",
  "dob",
  "adultConsent",
  "lang",
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

const hasOnlyRootKeys = (obj) => {
  const keys = Object.keys(obj);
  const required = ["version", "days", "settings", "pregnancy", "reminders"];
  return (
    required.every((k) => keys.includes(k)) && keys.every((k) => ALLOWED_ROOT_KEYS.includes(k))
  );
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
    "ovulationTest",
    "bbt",
    "cervicalFluid",
  ];
  const allDates = Array.from(
    new Set([...Object.keys(record.days), ...Object.keys(record.ovulationObservations || {})]),
  ).sort();

  const rows = allDates.map((k) => {
    const d = { ...blankDay(k), ...(record.days[k] || {}) };
    const obs = record.ovulationObservations?.[k] || {};
    return cols
      .map((c) => {
        if (c === "symptoms") return csvCell(d.symptoms.join(";"));
        if (c === "ovulationTest")
          return csvCell(obs.testResult && obs.testResult !== "none" ? obs.testResult : "");
        if (c === "bbt") return csvCell(obs.bbt != null ? obs.bbt : "");
        if (c === "cervicalFluid")
          return csvCell(
            obs.cervicalFluid && obs.cervicalFluid !== "none" ? obs.cervicalFluid : "",
          );
        return csvCell(d[c]);
      })
      .join(",");
  });
  return [cols.join(","), ...rows].join("\n");
}

/**
 * Robust CSV parser supporting quotes, multiline values, and formula sanitization.
 */
export function parseCSVText(csvText) {
  const text = (csvText || "").replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

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

    // Ovulation Observations in CSV
    let hasObs = false;
    const obs = defaultOvulationObservation(normalizedDate);
    if (headerMap["ovulationtest"] !== undefined) {
      const ot = sanitizeCsvValue(row[headerMap["ovulationtest"]]).toLowerCase();
      if (["positive", "negative", "faint", "none"].includes(ot)) {
        obs.testResult = ot;
        hasObs = true;
      }
    }
    if (headerMap["bbt"] !== undefined) {
      const bbtVal = parseFloat(sanitizeCsvValue(row[headerMap["bbt"]]));
      if (!isNaN(bbtVal) && bbtVal >= 30 && bbtVal <= 110) {
        obs.bbt = bbtVal;
        obs.bbtUnit = bbtVal > 50 ? "F" : "C";
        hasObs = true;
      }
    }
    if (headerMap["cervicalfluid"] !== undefined) {
      const cf = sanitizeCsvValue(row[headerMap["cervicalfluid"]]).toLowerCase();
      if (["dry", "sticky", "creamy", "eggwhite", "watery", "none"].includes(cf)) {
        obs.cervicalFluid = cf;
        hasObs = true;
      }
    }
    if (hasObs) {
      rec.ovulationObservations[normalizedDate] = obs;
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
  const lang = options.lang || record?.settings?.lang || "en";
  const isRTL = lang === "ur";
  const dir = isRTL ? "rtl" : "ltr";
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
  const exportedAt = formatDate(new Date(), lang, { dateStyle: "medium" });

  const t = (k, vars) => translate(lang, k, vars) || "";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <title>${t("export.summaryTitle") || "Saheli Menstrual Health Summary"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1f2937; line-height: 1.5; direction: ${dir}; }
    h1 { color: #831843; margin-bottom: 4px; font-size: 24px; }
    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .stat-grid { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 12px 16px; flex: 1; }
    .stat-val { font-size: 20px; font-weight: bold; color: #9d174d; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; text-align: ${isRTL ? "right" : "left"}; }
    th { background: #f3f4f6; text-align: ${isRTL ? "right" : "left"}; padding: 10px; border-bottom: 2px solid #e5e7eb; font-weight: bold; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #fce7f3; color: #be185d; }
    .disclaimer { margin-top: 32px; padding: 16px; border-radius: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 12px; color: #4b5563; }
    @media print {
      body { margin: 15mm 20mm; font-size: 11pt; color: #000; }
      .no-print { display: none !important; }
      .stat-box { border: 1px solid #e5e7eb; background: #fff !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <!-- SAHELI_RECORD_PAYLOAD_V1:${base64Payload} -->
  <div class="no-print" style="margin-bottom: 24px; display: flex; gap: 12px; align-items: center; background: #fdf2f8; padding: 12px 16px; border-radius: 12px; border: 1px solid #fbcfe8;">
    <button onclick="window.print()" style="background: #9d174d; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">🖨️ ${t("common.print") || "Print / Save as PDF"}</button>
    <span style="font-size: 12px; color: #6b7280;">${t("export.summaryDocNote") || "Use this document for doctor appointments. For full database restoration, use Encrypted JSON."}</span>
  </div>
  <h1>${lang === "en" ? "Saheli · Clinical Health Summary" : t("export.summaryTitle") || "Saheli · Clinical Health Summary"}</h1>
  <div class="subtitle">${t("export.generatedOn", { date: exportedAt }) || `Generated on ${exportedAt}`} · ${t("export.privateRecord") || "Private On-Device Record"}</div>

  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-lbl">${t("export.completedCycles") || "Completed Cycles"}</div>
      <div class="stat-val">${formatInteger(cycleCount, lang)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-lbl">${t("export.avgCycleLength") || "Average Cycle Length"}</div>
      <div class="stat-val">${typeof avgLength === "number" ? `${formatInteger(avgLength, lang)} ${lang === "en" ? "days" : t("common.days", { n: avgLength }) || "days"}` : avgLength}</div>
    </div>
    <div class="stat-box">
      <div class="stat-lbl">${t("export.totalPeriodDays") || "Total Period Days Logged"}</div>
      <div class="stat-val">${formatInteger(periodDays.length, lang)}</div>
    </div>
  </div>

  <h2>${t("export.recentLog") || "Recent Period & Symptom Log"}</h2>
  <table>
    <thead>
      <tr>
        <th>${t("export.colDate") || "Date"}</th>
        <th>${t("export.colPeriod") || "Period"}</th>
        <th>${t("export.colFlow") || "Flow"}</th>
        <th>${t("export.colPain") || "Pain (0-5)"}</th>
        <th>${t("export.colSymptoms") || "Symptoms"}</th>
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
            <td>${d.period ? `<span class="badge">${t("export.colPeriod") || "Period"}</span>` : "-"}</td>
            <td>${d.flow ? t(`flow.${d.flow}`) || d.flow : "-"}</td>
            <td>${d.pain > 0 ? formatInteger(d.pain, lang) : "0"}</td>
            <td>${d.symptoms?.length ? d.symptoms.map((s) => t(`sym.${s}`) || s).join(", ") : "-"}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  ${(() => {
    const obsEntries = Object.entries(record.ovulationObservations || {})
      .filter(([, o]) => o && !o.excludedFromCalculations)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 15);
    if (!obsEntries.length) return "";
    return `<h2>${t("export.recordedOvulation") || "Recorded Ovulation & Fertility Observations"}</h2>
  <table>
    <thead>
      <tr>
        <th>${t("export.colDate") || "Date"}</th>
        <th>${t("export.colLh") || "LH / OPK Test"}</th>
        <th>${t("export.colBbt") || "Basal Body Temp"}</th>
        <th>${t("export.colFluid") || "Cervical Fluid"}</th>
        <th>${t("export.colNotes") || "Notes"}</th>
      </tr>
    </thead>
    <tbody>
      ${obsEntries
        .map(
          ([k, o]) => `<tr>
          <td><strong>${k}</strong></td>
          <td>${o.testResult && o.testResult !== "none" ? `<span class="badge">${o.testResult}</span>` : "-"}</td>
          <td>${o.bbt != null ? `${o.bbt} °${o.bbtUnit || "C"}` : "-"}</td>
          <td>${o.cervicalFluid && o.cervicalFluid !== "none" ? o.cervicalFluid : "-"}</td>
          <td>${o.notes || "-"}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
  })()}

  <div class="disclaimer">
    <strong>${t("export.clinicalNoticeHeading") || "Clinical Notice:"}</strong> ${t("export.clinicalNotice") || "This summary was generated from patient-recorded observations in the Saheli Menstrual Health Companion for healthcare consultations. Saheli operates 100% locally on-device. Ovulation estimates are educational and strictly suppressed when cycle variability exceeds clinical thresholds. For full two-way diary backup and lossless data restoration, always use an Encrypted JSON backup."}
  </div>
</body>
</html>`;
}

export { generateClinicalSummaryPDF } from "./pdfGenerator.ts";

/**
 * Extracts and validates embedded Saheli payload from an exported PDF/HTML file
 */
export function parsePDFImport(content) {
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (
    content instanceof ArrayBuffer ||
    ArrayBuffer.isView(content) ||
    (content && typeof content === "object" && "byteLength" in content)
  ) {
    try {
      text = new TextDecoder("utf-8").decode(content);
    } catch {
      return { ok: false, error: "imp.unsupportedPdfNoPayload" };
    }
  } else {
    return { ok: false, error: "imp.unsupportedPdfNoPayload" };
  }

  // Look for the versioned embedded payload
  const match =
    text.match(/<!--\s*SAHELI_RECORD_PAYLOAD_V1:([A-Za-z0-9+/=]+)\s*-->/) ||
    text.match(/SAHELI_RECORD_PAYLOAD_V1:([A-Za-z0-9+/=]+)/);
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
    !hasOnlyRootKeys(raw) ||
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
        !hasOnlyKeys(raw.reminders.quietHours, ALLOWED_QUIET_HOURS_KEYS))) ||
    (raw.healthConditions &&
      (!object(raw.healthConditions) ||
        !hasOnlyKeys(raw.healthConditions, ALLOWED_HEALTH_CONDITIONS_KEYS))) ||
    (raw.ovulationObservations && !object(raw.ovulationObservations))
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
    ) ||
    (raw.healthConditions &&
      (!Array.isArray(raw.healthConditions.conditions) ||
        raw.healthConditions.conditions.some(
          (c) =>
            !object(c) ||
            !hasOnlyKeys(c, ALLOWED_CONDITION_ITEM_KEYS) ||
            typeof c.id !== "string" ||
            !["confirmed_diagnosis", "being_evaluated", "seeking_info"].includes(c.status),
        ) ||
        (raw.healthConditions.otherText !== undefined &&
          typeof raw.healthConditions.otherText !== "string") ||
        (raw.healthConditions.preferNotToSay !== undefined &&
          typeof raw.healthConditions.preferNotToSay !== "boolean") ||
        (raw.healthConditions.personalisationEnabled !== undefined &&
          typeof raw.healthConditions.personalisationEnabled !== "boolean")))
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
  if (raw.ovulationObservations) {
    for (const [k, v] of Object.entries(raw.ovulationObservations)) {
      if (!isValidDate(k) || !validateObservation(v)) {
        return { ok: false, error: "imp.badEntry", date: k };
      }
      rec.ovulationObservations[k] = { ...defaultOvulationObservation(k), ...v, date: k };
    }
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

  const mergedConditions = [...(existing.healthConditions?.conditions || [])];
  const existingCondIds = new Set(mergedConditions.map((c) => c.id));
  (incoming.healthConditions?.conditions || []).forEach((c) => {
    if (!existingCondIds.has(c.id)) mergedConditions.push(c);
  });

  const mergedObservations = {
    ...(incoming.ovulationObservations || {}),
    ...(existing.ovulationObservations || {}),
  };

  return {
    ...existing,
    settings: {
      ...existing.settings,
      customSymptoms: Array.from(customMap.values()),
    },
    healthConditions: {
      ...defaultHealthConditions(),
      ...(existing.healthConditions || {}),
      otherText: existing.healthConditions?.otherText || incoming.healthConditions?.otherText || "",
      conditions: mergedConditions,
    },
    days: { ...incoming.days, ...existing.days },
    ovulationObservations: mergedObservations,
  };
}

export function importPreview(existing, incoming) {
  const inc = Object.keys(incoming.days);
  const conflicts = inc.filter((d) => existing.days[d]);
  return { total: inc.length, conflicts: conflicts.length, fresh: inc.length - conflicts.length };
}
