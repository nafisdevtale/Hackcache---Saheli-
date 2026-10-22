// Synthetic demo profile ("Ananya", 17). Built relative to today, at selection time.
// ~8 months of history incl. one long cycle (52 days), painful periods and mood changes.
import { addDays } from "../lib/localDate.js";
import { emptyRecord, blankDay } from "../lib/exportImport.js";

export function buildDemo(today) {
  const rec = emptyRecord();
  rec.settings.ageGroup = "under18";
  const lengths = [31, 29, 52, 30, 33, 28, 34];
  const currentDay = 10; // today is day 10 of the current cycle
  let start = addDays(today, -(lengths.reduce((a, b) => a + b, 0) + currentDay - 1));
  const starts = [];
  for (const l of lengths) {
    starts.push(start);
    start = addDays(start, l);
  }
  starts.push(start);

  starts.forEach((s, i) => {
    const len = i === 4 ? 8 : 5; // one 8-day period
    for (let d = 0; d < len; d++) {
      const date = addDays(s, d);
      const flow =
        d === 0
          ? "medium"
          : d === 1
            ? "heavy"
            : d < 3
              ? "medium"
              : d < len - 1
                ? "light"
                : "spotting";
      const e = { ...blankDay(date), period: true, flow };
      if (d <= 1) {
        e.pain = i % 2 === 0 ? 8 : 6;
        e.symptoms = ["cramps", ...(d === 0 ? ["back_pain"] : ["tiredness"])];
        e.medicines = "Painkiller (as advised)";
        e.painkillerHelped = i % 3 === 0 ? "no" : "yes";
        e.painStoppedActivities = i % 2 === 0 && d === 0;
        e.energy = "low";
        e.mood = "low";
      }
      if (i === 5 && d === 1) {
        e.padHourly = true;
        e.bigClots = false;
      }
      if (d >= 2) {
        e.pain = 2;
        e.energy = "medium";
        e.mood = "okay";
      }
      rec.days[date] = e;
    }
    // pre-period days: low energy, mood changes, acne
    if (i > 0)
      for (let k = 1; k <= 3; k++) {
        const date = addDays(s, -k);
        rec.days[date] = {
          ...blankDay(date),
          energy: "low",
          mood: k === 1 ? "low" : "okay",
          symptoms: ["bloating", "acne", "mood_changes"],
          sleep: 6,
        };
      }
  });
  // Recent very low mood (3 consecutive days) to demonstrate Tele-MANAS support.
  for (const k of [6, 5, 4]) {
    const date = addDays(today, -k);
    rec.days[date] = {
      ...(rec.days[date] || blankDay(date)),
      mood: "very_low",
      energy: "low",
      sleep: 5,
      symptoms: ["trouble_sleeping"],
      note: "Exam stress (demo)",
    };
  }
  return rec;
}
