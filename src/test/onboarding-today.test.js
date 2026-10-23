// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { emptyRecord, blankDay } from "@/lib/exportImport.js";
import { analyze } from "@/lib/cycle.js";
import { evaluateSafety } from "@/lib/safetyRules.js";
import {
  isValidPin,
  deriveKey,
  encryptJSON,
  decryptJSON,
  randomSaltB64,
} from "@/lib/encryption.js";
import { CONFIG } from "@/config.js";
import en from "@/i18n/en.js";
import hi from "@/i18n/hi.js";

const TODAY = "2026-10-23";

describe("Saheli 3.0: First-Run Onboarding, Dashboard & Shared Privacy", () => {
  describe("Onboarding configuration & adolescent safeguards", () => {
    it("safely defaults adolescents (under 18) with fertility predictions disabled", () => {
      const rec = emptyRecord();
      rec.settings.ageGroup = "under18";
      if (rec.settings.ageGroup === "under18") {
        rec.settings.showFertility = false;
      }

      expect(rec.settings.ageGroup).toBe("under18");
      expect(rec.settings.showFertility).toBe(false);

      const a = analyze(rec.days, { ageGroup: "under18", today: TODAY });
      expect(a.fertility).toBeNull();
    });

    it("allows adult users to configure fertility preferences", () => {
      const rec = emptyRecord();
      rec.settings.ageGroup = "adult";
      rec.settings.showFertility = true;

      expect(rec.settings.ageGroup).toBe("adult");
      expect(rec.settings.showFertility).toBe(true);
    });

    it("validates 4-digit PIN setup during onboarding", () => {
      expect(isValidPin("1234")).toBe(true);
      expect(isValidPin("0000")).toBe(true);
      expect(isValidPin("9876")).toBe(true);

      // Rejections
      expect(isValidPin("123")).toBe(false);
      expect(isValidPin("12345")).toBe(false);
      expect(isValidPin("abcd")).toBe(false);
      expect(isValidPin("")).toBe(false);
      expect(isValidPin(null)).toBe(false);
    });

    it("encrypts initial record with WebCrypto AES-GCM when PIN is enabled on first run", async () => {
      const rec = emptyRecord();
      rec.settings.ageGroup = "under18";
      rec.settings.showFertility = false;
      rec.days[TODAY] = {
        ...blankDay(TODAY),
        period: true,
        flow: "medium",
      };

      const pin = "2468";
      const salt = randomSaltB64();
      const iterations = CONFIG.pbkdf2Iterations;
      const key = await deriveKey(pin, salt, iterations);

      const ct = await encryptJSON(key, rec);
      expect(ct).toHaveProperty("iv");
      expect(ct).toHaveProperty("ct");
      expect(typeof ct.iv).toBe("string");
      expect(typeof ct.ct).toBe("string");

      // Verify correct decryption
      const recovered = await decryptJSON(key, ct);
      expect(recovered.settings.ageGroup).toBe("under18");
      expect(recovered.days[TODAY].period).toBe(true);
      expect(recovered.days[TODAY].flow).toBe("medium");

      // Verify wrong PIN fails decryption
      const wrongKey = await deriveKey("0000", salt, iterations);
      await expect(decryptJSON(wrongKey, ct)).rejects.toThrow();
    });

    it("supports optional first-period entry with valid date format", () => {
      const firstDate = "2026-10-20";
      const rec = emptyRecord();
      rec.days[firstDate] = {
        ...blankDay(firstDate),
        period: true,
        flow: "medium",
        pain: 0,
        painStoppedActivities: false,
        symptoms: [],
      };

      expect(rec.days[firstDate].period).toBe(true);
      expect(rec.days[firstDate].flow).toBe("medium");

      const a = analyze(rec.days, { today: TODAY });
      expect(a.lastStart).toBe(firstDate);
      expect(a.currentCycleDay).toBe(4); // 20, 21, 22, 23 = day 4
    });
  });

  describe("Today dashboard state transitions", () => {
    it("distinguishes empty diary (0 days logged) from active tracking", () => {
      const emptyRec = emptyRecord();
      const dayCount = Object.keys(emptyRec.days).length;
      expect(dayCount).toBe(0);

      const a = analyze(emptyRec.days, { today: TODAY });
      expect(a.status).toBe("insufficient");
      expect(a.lastStart).toBeNull();
      expect(a.currentCycleDay).toBeNull();
      expect(a.prediction).toBeNull();
    });

    it("displays reassuring progress state for 1-2 cycles without alarmist messaging", () => {
      const rec = emptyRecord();
      // Add one cycle (start Sept 20, next start Oct 18)
      rec.days["2026-09-20"] = { ...blankDay("2026-09-20"), period: true };
      rec.days["2026-09-21"] = { ...blankDay("2026-09-21"), period: true };
      rec.days["2026-10-18"] = { ...blankDay("2026-10-18"), period: true };

      const a = analyze(rec.days, { today: TODAY });
      expect(a.status).toBe("insufficient");
      expect(a.cycles.length).toBe(1); // 1 complete cycle
      expect(a.cycles[0].length).toBe(28); // Sept 20 to Oct 18 = 28 days
      expect(a.prediction).toBeNull(); // Needs 3 complete cycles
      expect(a.currentCycleDay).toBe(6); // Oct 18 to Oct 23 = day 6
    });

    it("provides full cycle estimates and interval windows once 3 cycles exist", () => {
      const rec = emptyRecord();
      rec.days["2026-07-01"] = { ...blankDay("2026-07-01"), period: true };
      rec.days["2026-07-29"] = { ...blankDay("2026-07-29"), period: true };
      rec.days["2026-08-26"] = { ...blankDay("2026-08-26"), period: true };
      rec.days["2026-09-23"] = { ...blankDay("2026-09-23"), period: true };

      const a = analyze(rec.days, { today: TODAY });
      expect(a.status).toBe("ok");
      expect(a.cycles.length).toBe(3);
      expect(a.prediction).not.toBeNull();
      expect(a.prediction.start).toBeDefined();
      expect(a.prediction.end).toBeDefined();
      expect(a.prediction.basedOn).toBe(3);
    });

    it("evaluates safety and provides doctor guidance links when pain or symptoms disrupt life", () => {
      const rec = emptyRecord();
      rec.days[TODAY] = {
        ...blankDay(TODAY),
        period: true,
        pain: 8,
        painStoppedActivities: true,
        symptoms: ["cramps"],
      };

      const a = analyze(rec.days, { today: TODAY });
      const safety = evaluateSafety({ record: rec, analysis: a, today: TODAY });

      expect(safety.cards.some((c) => c.id === "pain_disruptive")).toBe(true);
    });
  });

  describe("Discreet mode and shared phone privacy", () => {
    it("maintains neutral titles and labels in discreet mode", () => {
      expect(en["app.discreetName"]).toBe("Diary");
      expect(hi["app.discreetName"]).toBe("डायरी");

      expect(en["rem.msg.checkin"]).toBe("Time to check in");
      expect(hi["rem.msg.checkin"]).toBe("देखने का समय");
    });

    it("includes transparent shared-device privacy explanations in English and Hindi", () => {
      expect(en["set.sharedPhone"]).toBeDefined();
      expect(hi["set.sharedPhone"]).toBeDefined();

      expect(en["set.sharedWhatProtected"]).toBeDefined();
      expect(hi["set.sharedWhatProtected"]).toBeDefined();
      expect(en["set.sharedWhatProtectedDesc"]).toContain("AES-GCM-256");
      expect(hi["set.sharedWhatProtectedDesc"]).toContain("AES-GCM-256");

      expect(en["set.sharedLimitations"]).toBeDefined();
      expect(hi["set.sharedLimitations"]).toBeDefined();

      expect(en["set.sharedTips"]).toBeDefined();
      expect(hi["set.sharedTips"]).toBeDefined();
    });

    it("preserves exact 1-to-1 bilingual key parity across all onboarding, today, and privacy keys", () => {
      const enKeys = Object.keys(en);
      const hiKeys = Object.keys(hi);

      expect(enKeys.length).toBe(hiKeys.length);

      const missingInHi = enKeys.filter((k) => !(k in hi) || hi[k] === "");
      const missingInEn = hiKeys.filter((k) => !(k in en) || en[k] === "");

      expect(missingInHi).toEqual([]);
      expect(missingInEn).toEqual([]);
    });

    it("supports theme customization (system, light, dark) and UI preferences", () => {
      expect(en["set.theme"]).toBe("Theme");
      expect(hi["set.theme"]).toBe("थीम");
      expect(en["theme.system"]).toBe("System default");
      expect(hi["theme.system"]).toBe("सिस्टम डिफ़ॉल्ट");
      expect(en["theme.dark"]).toBe("Dark");
      expect(hi["theme.dark"]).toBe("डार्क");
    });

    it("supports doctor visit summary customization controls", () => {
      expect(en["visit.customize"]).toBeDefined();
      expect(en["visit.includeCycles"]).toBeDefined();
      expect(en["visit.includeSymptoms"]).toBeDefined();
      expect(en["visit.includePain"]).toBeDefined();
      expect(en["visit.includeMeds"]).toBeDefined();
      expect(en["visit.includeGuidance"]).toBeDefined();
      expect(en["visit.localOnlyNotice"]).toContain("device");
    });

    it("supports educational topic categories and search placeholders", () => {
      expect(en["learn.catAll"]).toBe("All topics");
      expect(hi["learn.catAll"]).toBe("सभी विषय");
      expect(en["learn.catBiology"]).toBeDefined();
      expect(en["learn.catConditions"]).toBeDefined();
      expect(en["learn.catHygiene"]).toBeDefined();
      expect(en["learn.searchPlaceholder"]).toBeDefined();
    });
  });
});
