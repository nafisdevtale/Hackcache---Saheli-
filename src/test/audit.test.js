import { describe, it, expect } from "vitest";
import {
  blankDay,
  emptyRecord,
  exportJSON,
  parseImport,
  mergeRecords,
  exportCSV,
  importPreview,
} from "@/lib/exportImport.js";
import { analyze, symptomPatterns } from "@/lib/cycle.js";
import { evaluateSafety } from "@/lib/safetyRules.js";
import { addDays, formatDate } from "@/lib/localDate.js";
import { matchFaq } from "@/content/faq.js";

const today = "2026-10-22";
const safety = (r) =>
  evaluateSafety({
    record: r,
    analysis: analyze(r.days, { today, ageGroup: r.settings.ageGroup, paused: r.pregnancy.active }),
    today,
  });
const one = (patch) => {
  const r = emptyRecord();
  r.days[today] = { ...blankDay(today), ...patch };
  return r;
};

describe("import validates before replacing records", () => {
  for (const [name, modify] of [
    [
      "invalid age",
      (r) => {
        r.settings.ageGroup = "invalid";
      },
    ],
    [
      "non-array reminders",
      (r) => {
        r.reminders.medicines = {};
      },
    ],
    [
      "invalid reminder time",
      (r) => {
        r.reminders.daily.time = "99:00";
      },
    ],
    [
      "active pregnancy without LMP",
      (r) => {
        r.pregnancy.active = true;
      },
    ],
    [
      "string period flag",
      (r) => {
        r.days[today].period = "false";
      },
    ],
    [
      "invalid symptom",
      (r) => {
        r.days[today].symptoms = ["unknown"];
      },
    ],
    [
      "non-finite pain",
      (r) => {
        r.days[today].pain = NaN;
      },
    ],
    [
      "mismatched day relationship",
      (r) => {
        r.days[today].date = "2026-10-21";
      },
    ],
    [
      "malformed daily reminder not an object",
      (r) => {
        r.reminders.daily = "not an object";
      },
    ],
    [
      "extra setting key",
      (r) => {
        r.settings.unknownKey = true;
      },
    ],
    [
      "extra reminder key",
      (r) => {
        r.reminders.unknownKey = true;
      },
    ],
    [
      "extra day entry key",
      (r) => {
        r.days[today].extraKey = "bad";
      },
    ],
    [
      "non-date day key",
      (r) => {
        r.days["not-a-date"] = { ...blankDay("2026-10-22"), date: "not-a-date" };
      },
    ],
  ])
    it(name, () => {
      const r = one({});
      modify(r);
      expect(parseImport(exportJSON(r)).ok).toBe(false);
    });
  it("merge keeps existing entries and adds new dates once", () => {
    const a = one({ note: "keep" }),
      b = one({ note: "incoming" });
    b.days["2026-10-21"] = blankDay("2026-10-21");
    const preview = importPreview(a, b);
    expect(preview).toEqual({ total: 2, conflicts: 1, fresh: 1 });
    const merged = mergeRecords(a, b, "merge");
    expect(merged.days[today].note).toBe("keep");
    expect(Object.keys(mergeRecords(merged, b, "merge").days)).toHaveLength(2);
    const replaced = mergeRecords(a, b, "replace");
    expect(replaced.days[today].note).toBe("incoming");
  });
  it("CSV escapes multiline notes and medicines", () => {
    const csv = exportCSV(one({ note: 'one,"two"\nthree', medicines: "a,b" }));
    expect(csv).toContain('"one,""two""\nthree"');
    expect(csv).toContain('"a,b"');
  });
});

describe("concrete doctor rule boundaries", () => {
  const has = (r, id) => safety(r).cards.some((c) => c.id === id);
  it("more than seven days, not seven", () => {
    const r = emptyRecord();
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i - 7);
      r.days[d] = { ...blankDay(d), period: true };
    }
    expect(has(r, "long_period")).toBe(false);
    r.days[today] = { ...blankDay(today), period: true };
    expect(has(r, "long_period")).toBe(true);
  });
  it("pad changing indicator", () =>
    expect(has(one({ period: true, flow: "heavy", padHourly: true }), "pad_hourly")).toBe(true));
  it("large clot indicator", () =>
    expect(has(one({ period: true, flow: "heavy", bigClots: true }), "clots")).toBe(true));
  it("bleeding between periods", () =>
    expect(has(one({ symptoms: ["bleeding_between"] }), "intermenstrual")).toBe(true));
  it("bleeding after sex", () =>
    expect(has(one({ symptoms: ["bleeding_after_sex"] }), "intermenstrual")).toBe(true));
  it("pain stops activities", () =>
    expect(has(one({ pain: 7, painStoppedActivities: true }), "pain_disruptive")).toBe(true));
  it("painkiller not helping", () =>
    expect(has(one({ pain: 7, painkillerHelped: "no" }), "pain_disruptive")).toBe(true));
  it("heavy bleeding and tiredness", () =>
    expect(has(one({ period: true, flow: "heavy", symptoms: ["tiredness"] }), "anaemia")).toBe(
      true,
    ));
  it("90-day gap and pregnancy exception", () => {
    const r = emptyRecord(),
      d = addDays(today, -89);
    r.days[d] = { ...blankDay(d), period: true };
    expect(has(r, "no_period_90")).toBe(false);
    delete r.days[d];
    const older = addDays(today, -90);
    r.days[older] = { ...blankDay(older), period: true };
    expect(has(r, "no_period_90")).toBe(true);
    r.pregnancy = { active: true, lmp: older };
    expect(has(r, "no_period_90")).toBe(false);
  });
  it("heavy bleeding with fainting is urgent", () =>
    expect(
      safety(one({ period: true, flow: "heavy", symptoms: ["fainting"] })).urgent.some(
        (c) => c.id === "heavy_faint",
      ),
    ).toBe(true));
  it("pregnancy bleeding is urgent", () => {
    const r = one({ period: true });
    r.pregnancy = { active: true, lmp: "2026-08-01" };
    expect(safety(r).urgent.some((c) => c.id === "preg_bleeding")).toBe(true);
  });
  it("three consecutive very-low moods, not two", () => {
    const r = one({ mood: "very_low" });
    for (const n of [-1, -2]) {
      const d = addDays(today, n);
      r.days[d] = { ...blankDay(d), mood: "very_low" };
      if (n === -1) expect(safety(r).mood).toBeNull();
    }
    expect(safety(r).mood.dates).toEqual(["2026-10-20", "2026-10-21", today]);
  });
  it("English and Hindi self-harm questions get support", () => {
    expect(matchFaq("I want to hurt myself").type).toBe("selfharm");
    expect(matchFaq("खुद को नुकसान").type).toBe("selfharm");
  });
});

describe("date and cycle invariants", () => {
  it("pregnancy pauses both kinds of estimates", () => {
    const a = analyze({}, { today, paused: true });
    expect(a.prediction).toBeNull();
    expect(a.fertility).toBeNull();
    expect(a.status).toBe("paused");
  });
  it("formats calendar components without shifts", () =>
    expect(
      formatDate("2024-02-29", "en", { year: "numeric", month: "2-digit", day: "2-digit" }),
    ).toBe("29/02/2024"));
  it("unfinished current cycle is not complete", () => {
    const r = emptyRecord();
    for (const d of ["2026-07-01", "2026-07-29", "2026-08-26", "2026-09-23"])
      r.days[d] = { period: true };
    const a = analyze(r.days, { today });
    expect(a.cycles).toHaveLength(3);
    expect(a.prediction.median).toBe(28);
  });
  it("patterns require at least three complete supporting cycles", () => {
    const days = {};
    const periods = ["2026-07-01", "2026-07-29", "2026-08-26", "2026-09-23"].map((start) => ({
      start,
    }));
    periods.slice(0, 2).forEach((p) => {
      days[p.start] = { symptoms: ["cramps"] };
    });
    expect(symptomPatterns(days, { periods })).toEqual([]);
    days[periods[2].start] = { symptoms: ["cramps"] };
    expect(symptomPatterns(days, { periods: periods.slice(0, 3) })).toEqual([]);
    expect(symptomPatterns(days, { periods })[0]).toMatchObject({ symptom: "cramps", n: 3 });
  });
  it("an explicit non-period day ends a period; an unlogged day may bridge", () => {
    const days = { "2026-10-01": { period: true }, "2026-10-03": { period: true } };
    expect(analyze(days, { today }).periods).toHaveLength(1);
    days["2026-10-02"] = { period: false };
    expect(analyze(days, { today }).periods).toHaveLength(2);
  });
  it("bleeding after sex matches relevant care guidance, not normal cycle length", () =>
    expect(matchFaq("I am bleeding after sex").item.id).toBe("spotting"));
  it("explicit desire to die triggers support", () =>
    expect(matchFaq("I want to die").type).toBe("selfharm"));
  it("heavy bleeding with faintness triggers urgent care", () =>
    expect(matchFaq("I have heavy bleeding and feel faint").type).toBe("urgent"));
  it("Hindi heavy bleeding with dizziness triggers urgent care", () =>
    expect(matchFaq("बहुत खून और चक्कर").type).toBe("urgent"));
});
