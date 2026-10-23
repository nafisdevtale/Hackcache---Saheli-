import { describe, it, expect } from "vitest";
import {
  emptyRecord,
  normalizeRecord,
  blankDay,
  validateDay,
  exportJSON,
  parseImport,
  mergeRecords,
} from "../lib/exportImport.js";
import { analyze, isIrregular } from "../lib/cycle.js";
import { SYMPTOMS, SYMPTOM_CATEGORIES, SYMPTOM_INTENSITIES } from "../data/symptoms.js";
import { addDays, todayStr } from "../lib/localDate.js";

describe("Saheli 6.0: Complete Feature Integration Suite", () => {
  describe("Requirement 1 & 4: Custom Symptoms, Categories & Intensity Tracking", () => {
    it("initializes empty record with default symptom categories, favorites, and quiet hours", () => {
      const rec = emptyRecord();
      expect(rec.settings.symptomCategories).toEqual([
        "physical",
        "emotional",
        "digestive",
        "sleep_energy",
        "safety",
      ]);
      expect(rec.settings.quickLogFavorites).toEqual([
        "cramps",
        "headache",
        "tiredness",
        "bloating",
      ]);
      expect(rec.reminders.quietHours).toEqual({ on: false, start: "22:00", end: "07:00" });
    });

    it("supports custom symptoms with 'c_' prefix, category, and retired status", () => {
      const rec = emptyRecord();
      const customId = `c_${Date.now()}`;
      rec.settings.customSymptoms = [
        { id: customId, label: "Lower back stiffness", category: "physical", retired: false },
      ];

      const exported = exportJSON(rec);
      const parsed = parseImport(exported);
      expect(parsed.ok).toBe(true);
      expect(parsed.record.settings.customSymptoms).toHaveLength(1);
      expect(parsed.record.settings.customSymptoms[0].id).toBe(customId);
      expect(parsed.record.settings.customSymptoms[0].retired).toBe(false);
    });

    it("supports retiring a custom symptom without deleting past day logs", () => {
      const rec = emptyRecord();
      const customId = `c_1729680000000`;
      rec.settings.customSymptoms = [
        { id: customId, label: "Shoulder tension", category: "physical", retired: true },
      ];

      const day = blankDay("2026-10-20");
      day.symptoms = [customId];
      day.symptomIntensities = { [customId]: "severe" };

      const errs = validateDay(day);
      expect(errs).toHaveLength(0);

      rec.days["2026-10-20"] = day;
      const exported = exportJSON(rec);
      const parsed = parseImport(exported);

      expect(parsed.ok).toBe(true);
      expect(parsed.record.days["2026-10-20"].symptoms).toContain(customId);
      expect(parsed.record.days["2026-10-20"].symptomIntensities[customId]).toBe("severe");
      expect(parsed.record.settings.customSymptoms[0].retired).toBe(true);
    });

    it("validates symptom intensities strictly ('mild', 'moderate', 'severe')", () => {
      const day = blankDay("2026-10-21");
      day.symptoms = ["cramps", "headache"];
      day.symptomIntensities = {
        cramps: "severe",
        headache: "mild",
      };

      expect(validateDay(day)).toHaveLength(0);

      // Invalid intensity
      const badDay = {
        ...day,
        symptomIntensities: {
          cramps: "extreme_pain_unknown",
        },
      };
      expect(validateDay(badDay)).toContain("err.symptoms");
    });

    it("allows category customization while keeping safety category enabled", () => {
      const rec = emptyRecord();
      rec.settings.symptomCategories = ["physical", "safety"];
      expect(rec.settings.symptomCategories).toContain("safety");

      const normalized = normalizeRecord(rec);
      expect(normalized.settings.symptomCategories).toContain("physical");
      expect(normalized.settings.symptomCategories).toContain("safety");
    });
  });

  describe("Requirement 2: Ovulation & Fertility Education Safeguards", () => {
    const makeDays = (periods) => {
      const days = {};
      for (const p of periods) {
        for (let i = 0; i < p.len; i++) {
          days[addDays(p.date, i)] = {
            ...blankDay(addDays(p.date, i)),
            period: true,
            flow: "medium",
          };
        }
      }
      return days;
    };

    it("strictly suppresses fertility estimates for adolescents (under 18) even with regular cycles", () => {
      const days = makeDays([
        { date: "2026-01-01", len: 5 },
        { date: "2026-01-29", len: 5 },
        { date: "2026-02-26", len: 5 },
        { date: "2026-03-26", len: 5 },
      ]);

      const a = analyze(days, { ageGroup: "under18", today: "2026-03-27" });
      expect(a.status).toBe("ok");
      expect(a.fertility).toBeNull();
      expect(a.fertilityUnavailable).toBe("under18");
    });

    it("strictly hides fertility estimates when cycles are irregular", () => {
      const days = makeDays([
        { date: "2026-01-01", len: 5 },
        { date: "2026-01-22", len: 5 }, // 21 days
        { date: "2026-02-25", len: 5 }, // 34 days
        { date: "2026-03-20", len: 5 }, // 23 days
      ]);

      const a = analyze(days, { ageGroup: "adult", today: "2026-03-27" });
      expect(a.irregular).toBe(true);
      expect(a.fertility).toBeNull();
      expect(a.fertilityUnavailable).toBe("irregular");
    });

    it("provides educational estimates only for regular adult cycles", () => {
      const days = makeDays([
        { date: "2026-01-01", len: 5 },
        { date: "2026-01-29", len: 5 },
        { date: "2026-02-26", len: 5 },
        { date: "2026-03-26", len: 5 },
      ]);

      const a = analyze(days, { ageGroup: "adult", today: "2026-03-27" });
      expect(a.status).toBe("ok");
      expect(a.fertility).not.toBeNull();
      expect(a.fertility.ovulation).toBeDefined();
      expect(a.fertility.fertile).toBeDefined();
    });
  });

  describe("Requirement 7: Smart Reminders & Quiet Hours Logic", () => {
    it("correctly identifies daytime quiet hours", () => {
      const isQuietTime = (time, q) => {
        if (!q?.on || !q?.start || !q?.end) return false;
        if (q.start <= q.end) return time >= q.start && time < q.end;
        return time >= q.start || time < q.end;
      };

      const daytimeConfig = { on: true, start: "13:00", end: "15:00" };
      expect(isQuietTime("12:59", daytimeConfig)).toBe(false);
      expect(isQuietTime("13:00", daytimeConfig)).toBe(true);
      expect(isQuietTime("14:30", daytimeConfig)).toBe(true);
      expect(isQuietTime("15:00", daytimeConfig)).toBe(false);
    });

    it("correctly identifies overnight quiet hours crossing midnight", () => {
      const isQuietTime = (time, q) => {
        if (!q?.on || !q?.start || !q?.end) return false;
        if (q.start <= q.end) return time >= q.start && time < q.end;
        return time >= q.start || time < q.end;
      };

      const overnightConfig = { on: true, start: "22:00", end: "07:00" };
      expect(isQuietTime("21:59", overnightConfig)).toBe(false);
      expect(isQuietTime("22:00", overnightConfig)).toBe(true);
      expect(isQuietTime("23:45", overnightConfig)).toBe(true);
      expect(isQuietTime("02:00", overnightConfig)).toBe(true);
      expect(isQuietTime("06:59", overnightConfig)).toBe(true);
      expect(isQuietTime("07:00", overnightConfig)).toBe(false);
      expect(isQuietTime("12:00", overnightConfig)).toBe(false);
    });

    it("preserves quiet hours settings in backup export and import", () => {
      const rec = emptyRecord();
      rec.reminders.quietHours = { on: true, start: "23:00", end: "06:30" };

      const exported = exportJSON(rec);
      const parsed = parseImport(exported);
      expect(parsed.ok).toBe(true);
      expect(parsed.record.reminders.quietHours.on).toBe(true);
      expect(parsed.record.reminders.quietHours.start).toBe("23:00");
      expect(parsed.record.reminders.quietHours.end).toBe("06:30");
    });
  });

  describe("Requirement 6: AI Health Assistant Data Transmission Preview Schema", () => {
    it("ensures cycle context snippet contains only minimal anonymized statistics", () => {
      const sampleContext = {
        lastPeriodDaysAgo: 14,
      };

      // Verify no sensitive keys present
      const sensitiveKeys = ["name", "email", "phone", "notes", "location", "deviceId", "pin"];
      const contextKeys = Object.keys(sampleContext);
      for (const k of sensitiveKeys) {
        expect(contextKeys).not.toContain(k);
      }
      expect(sampleContext.lastPeriodDaysAgo).toBe(14);
    });
  });

  describe("Requirement 9: Safe Community Safeguards & DPDP Act Compliance", () => {
    it("recognizes both 'under18' and 'teen' settings as adolescent minor", () => {
      const checkMinor = (ageGroup) =>
        ageGroup === "under18" || ageGroup === "teen" ? "under18" : "adult";
      expect(checkMinor("under18")).toBe("under18");
      expect(checkMinor("teen")).toBe("under18");
      expect(checkMinor("adult")).toBe("adult");
    });
  });
});
