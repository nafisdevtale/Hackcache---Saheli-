// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { addDays } from "@/lib/localDate.js";
import { CONFIG, EMERGENCY } from "@/config.js";
import { CHECKUP_WEEKS } from "@/content/pregnancyWeeks.js";
import { evaluateSafety } from "@/lib/safetyRules.js";
import { analyze } from "@/lib/cycle.js";
import { emptyRecord, blankDay } from "@/lib/exportImport.js";
import { DEFAULT_PREFS, loadPrefs, savePrefs } from "@/lib/storage.js";

const TODAY = "2026-10-23";

describe("Saheli User Workflows & Resilience", () => {
  describe("Pregnancy workflow & clinical scheduling", () => {
    it("calculates due date at exactly 280 days (40 weeks) from LMP per NHS/WHO", () => {
      const lmp = "2026-01-01";
      const dueDate = addDays(lmp, CONFIG.gestationDays);
      expect(CONFIG.gestationDays).toBe(280);
      expect(dueDate).toBe("2026-10-08");
    });

    it("includes WHO 8-contact antenatal checkup schedule", () => {
      expect(CHECKUP_WEEKS).toEqual([12, 20, 26, 30, 34, 36, 38, 40]);
    });

    it("pauses cycle estimation when pregnancy mode is active", () => {
      const r = emptyRecord();
      r.days["2026-08-01"] = { ...blankDay("2026-08-01"), period: true };
      r.days["2026-08-29"] = { ...blankDay("2026-08-29"), period: true };
      r.days["2026-09-26"] = { ...blankDay("2026-09-26"), period: true };
      r.pregnancy.active = true;
      r.pregnancy.lmp = "2026-09-26";

      const a = analyze(r.days, { today: TODAY, paused: r.pregnancy.active });
      expect(a.status).toBe("paused");
      expect(a.prediction).toBeNull();
      expect(a.fertility).toBeNull();
    });

    it("flags vaginal bleeding during pregnancy as urgent", () => {
      const r = emptyRecord();
      r.pregnancy.active = true;
      r.pregnancy.lmp = "2026-08-01";
      r.days[TODAY] = { ...blankDay(TODAY), period: true };

      const a = analyze(r.days, { today: TODAY, paused: true });
      const safety = evaluateSafety({ record: r, analysis: a, today: TODAY });

      expect(safety.urgent.some((u) => u.id === "preg_bleeding")).toBe(true);
    });
  });

  describe("Doctor-visit summary data aggregation", () => {
    it("correctly aggregates symptoms, max pain, disrupted days, and active guidance", () => {
      const r = emptyRecord();
      r.days["2026-10-20"] = {
        ...blankDay("2026-10-20"),
        period: true,
        pain: 8,
        painStoppedActivities: true,
        symptoms: ["cramps", "headache"],
        medicines: "paracetamol",
      };
      r.days["2026-10-21"] = {
        ...blankDay("2026-10-21"),
        period: true,
        pain: 6,
        symptoms: ["cramps", "nausea"],
      };

      const days = Object.values(r.days);
      const symCount = {};
      days.forEach((d) =>
        (d.symptoms || []).forEach((s) => (symCount[s] = (symCount[s] || 0) + 1)),
      );

      expect(symCount.cramps).toBe(2);
      expect(symCount.headache).toBe(1);
      expect(symCount.nausea).toBe(1);

      const maxPain = Math.max(0, ...days.map((d) => d.pain || 0));
      const stoppedCount = days.filter((d) => d.painStoppedActivities).length;
      expect(maxPain).toBe(8);
      expect(stoppedCount).toBe(1);

      const a = analyze(r.days, { today: TODAY });
      const safety = evaluateSafety({ record: r, analysis: a, today: TODAY });
      expect(safety.cards.some((c) => c.id === "pain_disruptive")).toBe(true);
    });
  });

  describe("UI Preferences and accessibility options", () => {
    it("persists language, text size, contrast, and discreet preferences safely", () => {
      const testPrefs = {
        lang: "hi",
        textSize: "lg",
        contrast: true,
        readAloud: false,
        discreet: true,
      };

      savePrefs(testPrefs);
      const loaded = loadPrefs();

      expect(loaded.lang).toBe("hi");
      expect(loaded.textSize).toBe("lg");
      expect(loaded.contrast).toBe(true);
      expect(loaded.discreet).toBe(true);

      // Clean up back to default
      savePrefs(DEFAULT_PREFS);
    });

    it("falls back gracefully to default preferences on corrupt storage", () => {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("saheli.prefs", "INVALID_JSON{{{{");
      }
      const loaded = loadPrefs();
      expect(loaded).toEqual(DEFAULT_PREFS);
      savePrefs(DEFAULT_PREFS);
    });
  });
});
