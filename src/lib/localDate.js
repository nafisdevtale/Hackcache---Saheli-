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

export const LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  te: "te-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  ml: "ml-IN",
  or: "or-IN",
  as: "as-IN",
  ur: "ur-IN",
};

export const loc = (lang) => LOCALE_MAP[lang] || "en-IN";

export function formatNumber(n, lang = "en") {
  if (typeof n !== "number" || isNaN(n)) return String(n);
  try {
    return new Intl.NumberFormat(loc(lang)).format(n);
  } catch {
    return String(n);
  }
}
export function formatDate(s, lang = "en", opts = { day: "numeric", month: "short" }) {
  if (!isValidDate(s)) return "";
  return new Intl.DateTimeFormat(loc(lang), { ...opts, timeZone: "UTC" }).format(
    new Date(toNum(s) * DAY),
  );
}
export function formatRange(a, b, lang = "en") {
  if (a === b) return formatDate(a, lang);
  return `${formatDate(a, lang)} – ${formatDate(b, lang)}`;
}
export function monthTitle(y, m0, lang = "en") {
  return new Intl.DateTimeFormat(loc(lang), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m0, 1)));
}
export function weekdayNames(lang = "en") {
  const f = new Intl.DateTimeFormat(loc(lang), { weekday: "short", timeZone: "UTC" });
  return [0, 1, 2, 3, 4, 5, 6].map((i) => f.format(new Date(Date.UTC(2023, 0, 1 + i)))); // 2023-01-01 is Sunday
}
