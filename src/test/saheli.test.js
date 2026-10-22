import { describe, it, expect } from "vitest";
import { analyze } from "@/lib/cycle.js";
import { addDays, diffDays } from "@/lib/localDate.js";
import { evaluateSafety } from "@/lib/safetyRules.js";
import { buildDemo } from "@/data/demo.js";
import { emptyRecord, exportJSON, parseImport } from "@/lib/exportImport.js";
import en from "@/i18n/en.js"; import hi from "@/i18n/hi.js";
import { FAQ, matchFaq } from "@/content/faq.js";

const T = "2026-10-22";
function days(starts, len = 5) { const d = {}; starts.forEach((s) => { for (let i = 0; i < len; i++) d[addDays(s, i)] = { period: true }; }); return d; }
function starts(first, lengths) { const out = [first]; lengths.forEach((l) => out.push(addDays(out[out.length - 1], l))); return out; }

describe("dates", () => {
  it("leap year and month boundary", () => { expect(addDays("2024-02-28", 1)).toBe("2024-02-29"); expect(addDays("2024-12-31", 1)).toBe("2025-01-01"); });
  it("DST-safe diff", () => { expect(diffDays("2026-03-07", "2026-03-09")).toBe(2); expect(diffDays("2026-10-24", "2026-10-26")).toBe(2); });
});
describe("cycle engine", () => {
  it("no prediction with < 3 cycles", () => { const a = analyze(days(starts("2026-07-01", [28, 28])), { today: T }); expect(a.status).toBe("insufficient"); expect(a.prediction).toBeNull(); });
  it("3 regular cycles => range, half-width 2, fertility shown", () => {
    const s = starts("2026-06-01", [28, 28, 28]); const a = analyze(days(s), { today: T });
    expect(a.prediction.center).toBe(addDays(s[3], 28)); expect(a.prediction.halfWidth).toBe(2); expect(a.fertility).not.toBeNull();
  });
  it("uses last 6 cycles only", () => { const a = analyze(days(starts("2025-10-01", [60, 28, 28, 28, 28, 28, 28])), { today: T }); expect(a.recent.length).toBe(6); expect(a.prediction.spread).toBe(0); });
  it("irregular widens and hides fertility", () => { const a = analyze(days(starts("2026-02-01", [28, 40, 30, 33])), { today: T }); expect(a.irregular).toBe(true); expect(a.prediction.halfWidth).toBe(12 + 3); expect(a.fertility).toBeNull(); });
  it("long gap asks about missed log", () => { const s = starts("2026-04-01", [28, 28, 28]); const a = analyze(days(s), { today: addDays(s[3], 60) }); expect(a.possibleMissedLog).toBe(true); });
});
describe("safety rules", () => {
  const rec = (lengths, age) => { const r = emptyRecord(); r.settings.ageGroup = age; r.days = days(starts("2026-01-01", lengths)); return r; };
  const run = (r) => evaluateSafety({ record: r, analysis: analyze(r.days, { ageGroup: r.settings.ageGroup, today: T }), today: T });
  it("40-day cycles flag adults, not under-18", () => {
    expect(run(rec([40, 40, 40], "adult")).cards.some((c) => c.id === "cycle_range")).toBe(true);
    expect(run(rec([40, 40, 40], "under18")).cards.some((c) => c.id === "cycle_range")).toBe(false);
    expect(run(rec([50, 50, 50], "under18")).cards.some((c) => c.id === "cycle_range")).toBe(true);
  });
  it("demo triggers >= 2 doctor cards and mood support", () => { const r = buildDemo(T); const s = run(r); expect(s.cards.length).toBeGreaterThanOrEqual(2); expect(s.mood).not.toBeNull(); expect(s.urgent.length).toBe(0); });
  it("urgent rule on recent sudden pain", () => { const r = emptyRecord(); r.days[T] = { symptoms: ["sudden_severe_pain"] }; expect(run(r).urgent[0].id).toBe("sudden_pain"); });
});
describe("content & data", () => {
  it("hindi has every key", () => { expect(Object.keys(en).filter((k) => !(k in hi))).toEqual([]); });
  it(">= 30 bilingual FAQs; unknown => none", () => { expect(FAQ.length).toBeGreaterThanOrEqual(30); FAQ.forEach((f) => { expect(f.q.hi && f.a.hi).toBeTruthy(); }); expect(matchFaq("qwerty zzz").type).toBe("none"); expect(matchFaq("what is pcos").type).toBe("match"); });
  it("export/import round-trip", () => { const r = buildDemo(T); const back = parseImport(exportJSON(r)); expect(back.ok).toBe(true); expect(back.record.days).toEqual(Object.fromEntries(Object.entries(r.days).map(([k, v]) => [k, { ...v }]))); });
});
