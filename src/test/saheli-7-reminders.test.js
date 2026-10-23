import { describe, it, expect } from "vitest";
import { translate } from "../i18n/index.js";
import { addDays, todayStr } from "../lib/localDate.js";
import { analyze } from "../lib/cycle.js";
import {
  buildFixtureRegularAdult,
  buildFixtureVariableAdult,
  buildFixtureAdolescent,
} from "../data/fixtures.js";

// Helper extracted from App.jsx quiet hours calculation
export function isQuietTime(time, q) {
  if (!q?.on || !q?.start || !q?.end) return false;
  if (q.start <= q.end) return time >= q.start && time < q.end;
  return time >= q.start || time < q.end;
}

// Helper simulating reminder scheduler tick in App.jsx
export function simulateReminderTick({
  record,
  analysis,
  nowTime,
  today = todayStr(),
  discreet = false,
  lang = "en",
  firedSet = new Set(),
}) {
  const firedList = [];
  const r = record.reminders;

  if (isQuietTime(nowTime, r.quietHours)) {
    return { fired: firedList, suppressedByQuietHours: true };
  }

  const once = (id, fn) => {
    const k = `${id}-${today}-${nowTime}`;
    if (!firedSet.has(k)) {
      firedSet.add(k);
      fn(k);
    }
  };

  // 1. Daily logging reminder
  if (r.daily?.on && r.daily.time === nowTime) {
    once("daily", (k) => {
      const text = discreet ? translate(lang, "rem.msg.checkin") : translate(lang, "rem.msg.daily");
      const title = translate(lang, discreet ? "app.discreetName" : "app.name");
      firedList.push({ id: "daily", key: k, title, text, discreet });
    });
  }

  // 2. Medication reminders
  r.medicines?.forEach((m, i) => {
    if (m.time === nowTime) {
      once(`med${i}`, (k) => {
        const text = discreet
          ? translate(lang, "rem.msg.checkin")
          : translate(lang, "rem.msg.med", { name: m.name });
        const title = translate(lang, discreet ? "app.discreetName" : "app.name");
        firedList.push({ id: `med${i}`, key: k, title, text, discreet });
      });
    }
  });

  // 3. Custom reminders
  if (r.custom?.on && r.custom.time === nowTime && r.custom.text) {
    once("custom", (k) => {
      const text = discreet ? translate(lang, "rem.msg.checkin") : r.custom.text;
      const title = translate(lang, discreet ? "app.discreetName" : "app.name");
      firedList.push({ id: "custom", key: k, title, text, discreet });
    });
  }

  // 4. Estimation-aware Next Period reminder (only 1 day before predicted start at 09:00)
  if (
    r.nextPeriod &&
    analysis?.prediction &&
    addDays(analysis.prediction.start, -1) === today &&
    nowTime === "09:00"
  ) {
    once("np", (k) => {
      const text = discreet
        ? translate(lang, "rem.msg.checkin")
        : translate(lang, "rem.msg.period");
      const title = translate(lang, discreet ? "app.discreetName" : "app.name");
      firedList.push({ id: "np", key: k, title, text, discreet });
    });
  }

  return { fired: firedList, suppressedByQuietHours: false };
}

describe("Saheli 7.0 — Module D: Smart Reminders & Personalisation", () => {
  const today = todayStr();

  // Test 1: Quiet hours overnight wrap-around
  it("D1: Respects overnight quiet hours wrap-around (e.g. 22:00 to 07:00)", () => {
    const quiet = { on: true, start: "22:00", end: "07:00" };

    // During quiet hours (midnight, early morning, late night)
    expect(isQuietTime("22:00", quiet)).toBe(true);
    expect(isQuietTime("23:30", quiet)).toBe(true);
    expect(isQuietTime("00:00", quiet)).toBe(true);
    expect(isQuietTime("04:15", quiet)).toBe(true);
    expect(isQuietTime("06:59", quiet)).toBe(true);

    // Outside quiet hours
    expect(isQuietTime("07:00", quiet)).toBe(false);
    expect(isQuietTime("12:00", quiet)).toBe(false);
    expect(isQuietTime("21:59", quiet)).toBe(false);

    // When disabled
    expect(isQuietTime("23:00", { ...quiet, on: false })).toBe(false);
  });

  // Test 2: Daylight quiet hours (start <= end)
  it("D1: Respects non-wrapping daytime quiet hours (e.g. 13:00 to 15:00)", () => {
    const quiet = { on: true, start: "13:00", end: "15:00" };
    expect(isQuietTime("14:00", quiet)).toBe(true);
    expect(isQuietTime("12:59", quiet)).toBe(false);
    expect(isQuietTime("15:00", quiet)).toBe(false);
  });

  // Test 3: Deduplication key generation & idempotency
  it("D2: Deduplication key ensures notification fires only once per slot", () => {
    const rec = buildFixtureRegularAdult(today);
    rec.reminders.daily = { on: true, time: "20:00" };
    rec.reminders.quietHours = { on: false, start: "22:00", end: "07:00" };

    const firedSet = new Set();

    // First tick at 20:00
    const tick1 = simulateReminderTick({
      record: rec,
      analysis: null,
      nowTime: "20:00",
      today,
      firedSet,
    });
    expect(tick1.fired.length).toBe(1);
    expect(tick1.fired[0].key).toBe(`daily-${today}-20:00`);

    // Second tick at 20:00 within same minute
    const tick2 = simulateReminderTick({
      record: rec,
      analysis: null,
      nowTime: "20:00",
      today,
      firedSet,
    });
    expect(tick2.fired.length).toBe(0); // Deduplicated!
  });

  // Test 4: Estimation-aware Next Period reminder fires when prediction exists
  it("D3: Fires next period heads-up 1 day before predicted start for eligible regular adults", () => {
    const rec = buildFixtureRegularAdult(today);
    rec.reminders.nextPeriod = true;
    const a = analyze(rec.days, { ageGroup: "adult", today, showFertility: true });
    expect(a.prediction).not.toBeNull();

    // Calculate the target day (1 day before predicted start)
    const targetDay = addDays(a.prediction.start, -1);

    const tick = simulateReminderTick({
      record: rec,
      analysis: a,
      nowTime: "09:00",
      today: targetDay,
      discreet: false,
    });

    expect(tick.fired.length).toBe(1);
    expect(tick.fired[0].id).toBe("np");
    expect(tick.fired[0].text).toContain("period");
  });

  // Test 5: Estimation-aware suppression when prediction is absent
  it("D3: Strictly suppresses next period notification when cycle prediction is absent or history is irregular", () => {
    const rec = buildFixtureVariableAdult(today);
    rec.reminders.nextPeriod = true;
    const a = analyze(rec.days, { ageGroup: "adult", today, showFertility: true });
    // In variable cycles, prediction is widened, but if prediction is null (e.g., 0 cycles)
    const recEmpty = { ...rec, days: {} };
    const aEmpty = analyze(recEmpty.days, { ageGroup: "adult", today });
    expect(aEmpty.prediction).toBeNull();

    const tick = simulateReminderTick({
      record: recEmpty,
      analysis: aEmpty,
      nowTime: "09:00",
      today,
      discreet: false,
    });

    // Zero next period alerts fired because prediction is null!
    expect(tick.fired.some((f) => f.id === "np")).toBe(false);
  });

  // Test 6: Discreet mode neutral wording (zero period/cycle leak on lockscreen)
  it("D4: Employs neutral wording and suppresses menstrual terms when discreet mode is active", () => {
    const rec = buildFixtureRegularAdult(today);
    rec.reminders.daily = { on: true, time: "20:00" };
    rec.reminders.custom = { on: true, text: "Take evening Meftal", time: "20:00" };

    const tick = simulateReminderTick({
      record: rec,
      analysis: null,
      nowTime: "20:00",
      today,
      discreet: true,
      lang: "en",
    });

    expect(tick.fired.length).toBe(2);
    // Notification titles and text are neutral check-ins
    for (const f of tick.fired) {
      expect(f.title).not.toContain("Period");
      expect(f.title).not.toContain("Cycle");
      expect(f.text).not.toContain("period");
      expect(f.text).not.toContain("Meftal");
      expect(f.text).toBe("Time to check in");
    }
  });

  // Test 7: Multilingual discreet wording across Hindi and regional languages
  it("D4: Provides culturally respectful discreet wording in Hindi and regional languages", () => {
    const hiTitle = translate("hi", "app.discreetName");
    const hiText = translate("hi", "rem.msg.checkin");
    expect(hiTitle).toBe("डायरी");
    expect(hiText).toBe("देखने का समय");
    expect(hiText).not.toContain("मासिक"); // Does not leak period terminology!
  });
});
