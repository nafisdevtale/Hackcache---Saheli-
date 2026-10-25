// Local calendar date helpers. Dates are plain "YYYY-MM-DD" strings.
// Arithmetic uses Date.UTC on the calendar components, so it is immune to
// DST shifts and never re-interprets a stored date in another timezone.
const RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY = 86400000;

export function isValidDate(s) {
  if (typeof s !== "string") return false;
  const m = RE.exec(s);
  if (!m) return false;
  const y = +m[1],
    mo = +m[2],
    d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function toNum(s) {
  const m = RE.exec(s);
  if (!m) throw new Error("Invalid date");
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY);
}

function fromNum(n) {
  const dt = new Date(n * DAY);
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export const addDays = (s, n) => fromNum(toNum(s) + n);
export const diffDays = (a, b) => toNum(b) - toNum(a); // b - a in days

export function todayStr(now = new Date()) {
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function ymd(y, m0, d) {
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export const daysInMonth = (y, m0) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
export const weekdayOf = (s) => new Date(toNum(s) * DAY).getUTCDay(); // 0=Sun

import {
  LOCALE_MAP,
  formatNumber as formatNumLocale,
  formatDate as formatDtLocale,
  getLocaleTag,
  shouldUseNativeNumerals,
} from "./locale.js";

export { LOCALE_MAP };
export const loc = (lang) => LOCALE_MAP[lang] || "en-IN";

export function formatNumber(n, lang = "en", options = {}) {
  return formatNumLocale(n, lang, options);
}
export function formatDate(s, lang = "en", opts = { day: "numeric", month: "short" }) {
  if (!isValidDate(s)) return "";
  return formatDtLocale(s, lang, opts);
}
export function formatRange(a, b, lang = "en", opts = {}) {
  if (a === b) return formatDate(a, lang, opts);
  return `${formatDate(a, lang, opts)} – ${formatDate(b, lang, opts)}`;
}
export function monthTitle(y, m0, lang = "en", options = {}) {
  const useNative = shouldUseNativeNumerals(lang, options);
  const tag = getLocaleTag(lang, useNative);
  return new Intl.DateTimeFormat(tag, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m0, 1)));
}
export function weekdayNames(lang = "en") {
  const f = new Intl.DateTimeFormat(loc(lang), { weekday: "short", timeZone: "UTC" });
  return [0, 1, 2, 3, 4, 5, 6].map((i) => f.format(new Date(Date.UTC(2023, 0, 1 + i)))); // 2023-01-01 is Sunday
}
