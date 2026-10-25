// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  getLocaleTag,
  isRTL,
  formatNumber,
  formatInteger,
  formatPercent,
  formatCurrency,
  formatUnit,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatList,
  parseLocalizedNumber,
  SUPPORTED_LOCALES,
  NATIVE_NUMBERING_SYSTEMS,
} from "../lib/locale.js";
import { translate } from "../i18n/index.js";
import { LANGUAGES } from "../i18n/languages.js";
import { PET_PERSONALITIES } from "../lib/companion/petPersonality.js";
import { generateDoctorSummaryPDF } from "../lib/exportImport.js";
import { screenSafety } from "../server/api/ai.ts";

describe("Saheli 10.5 — Authoritative Multilingual Engine", () => {
  describe("1. Core Locale Engine (src/lib/locale.js)", () => {
    it("maps all 13 supported languages to valid BCP 47 locale tags", () => {
      const expectedTags: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        bn: "bn-IN",
        as: "as-IN",
        gu: "gu-IN",
        kn: "kn-IN",
        ml: "ml-IN",
        or: "or-IN",
        pa: "pa-IN",
        ta: "ta-IN",
        te: "te-IN",
        ur: "ur-IN",
      };

      for (const [code, expected] of Object.entries(expectedTags)) {
        expect(getLocaleTag(code)).toBe(expected);
      }
    });

    it("correctly identifies Urdu as RTL and others as LTR", () => {
      expect(isRTL("ur")).toBe(true);
      const ltrLangs = ["en", "hi", "mr", "bn", "as", "gu", "kn", "ml", "or", "pa", "ta", "te"];
      for (const lang of ltrLangs) {
        expect(isRTL(lang)).toBe(false);
      }
    });

    it("formats integers with native digits by default for non-English, and Latin digits for English", () => {
      expect(formatInteger(14, "en")).toBe("14");
      expect(formatInteger(28, "hi")).toBe("२८");
      expect(formatInteger(28, "bn")).toBe("২৮");
      expect(formatInteger(1000, "en")).toBe("1,000");
      expect(formatInteger(28, "hi", { latinNumerals: true })).toBe("28");
    });

    it("formats numbers with native Indic digits when nativeNumerals is requested", () => {
      const hiDeva = formatInteger(14, "hi", { nativeNumerals: true });
      expect(hiDeva).toBe("१४");

      const bnDigits = formatInteger(14, "bn", { nativeNumerals: true });
      expect(bnDigits).toBe("১৪");

      const guDigits = formatInteger(14, "gu", { nativeNumerals: true });
      expect(guDigits).toBe("૧૪");

      const knDigits = formatInteger(14, "kn", { nativeNumerals: true });
      expect(knDigits).toBe("೧೪");

      const taDigits = formatInteger(14, "ta", { nativeNumerals: true });
      expect(taDigits).toBe("௧௪");

      const teDigits = formatInteger(14, "te", { nativeNumerals: true });
      expect(teDigits).toBe("౧౪");

      const mlDigits = formatInteger(14, "ml", { nativeNumerals: true });
      expect(mlDigits).toBe("൧൪");

      const orDigits = formatInteger(14, "or", { nativeNumerals: true });
      expect(orDigits).toBe("୧୪");

      const paDigits = formatInteger(14, "pa", { nativeNumerals: true });
      expect(paDigits).toBe("੧੪");

      const urDigits = formatInteger(14, "ur", { nativeNumerals: true });
      expect(urDigits).toBe("۱۴");
    });

    it("parses localized native Indic numbers back to standard numbers", () => {
      expect(parseLocalizedNumber("१४", "hi")).toBe(14);
      expect(parseLocalizedNumber("১৪", "bn")).toBe(14);
      expect(parseLocalizedNumber("૧૪", "gu")).toBe(14);
      expect(parseLocalizedNumber("೧೪", "kn")).toBe(14);
      expect(parseLocalizedNumber("௧௪", "ta")).toBe(14);
      expect(parseLocalizedNumber("౧౪", "te")).toBe(14);
      expect(parseLocalizedNumber("1,234.56", "en")).toBe(1234.56);
    });

    it("formats percentages, currency, and units correctly across locales", () => {
      const pct = formatPercent(0.75, "hi");
      expect(pct).toContain("%");

      const curr = formatCurrency(500, "en");
      expect(curr).toContain("500");

      const unit = formatUnit(28, "day", "en");
      expect(unit).toContain("28");
    });

    it("formats dates and relative time in locale-specific text", () => {
      const testDate = new Date(2026, 4, 15);
      const enDate = formatDate(testDate, "en", { dateStyle: "medium" });
      expect(enDate).toContain("2026");

      const hiDate = formatDate(testDate, "hi", { dateStyle: "medium" });
      expect(hiDate).toBeTruthy();

      const relPast = formatRelativeTime(-2, "day", "en");
      expect(relPast).toMatch(/2 days ago|yesterday/i);

      const relFuture = formatRelativeTime(3, "day", "en");
      expect(relFuture).toMatch(/in 3 days/i);
    });

    it("formats lists with proper conjunctions", () => {
      const listEn = formatList(["Cramps", "Headache", "Fatigue"], "en");
      expect(listEn).toMatch(/Cramps, Headache,? and Fatigue/);
    });
  });

  describe("2. Translation & Dictionary Parity", () => {
    it("ensures all 13 languages are registered in LANGUAGES metadata", () => {
      expect(LANGUAGES.length).toBe(13);
      const codes = LANGUAGES.map((l) => l.code);
      const required = [
        "en",
        "hi",
        "mr",
        "bn",
        "as",
        "gu",
        "kn",
        "ml",
        "or",
        "pa",
        "ta",
        "te",
        "ur",
      ];
      for (const r of required) {
        expect(codes).toContain(r);
      }
    });

    it("automatically formats numeric variables through translate()", () => {
      const result = translate("hi", "today.cycleDay", { n: 5 });
      expect(result).toBe("आपके चक्र का दिन 5");

      const enResult = translate("en", "today.cycleDay", { n: 12 });
      expect(enResult).toBe("Day 12 of your cycle");
    });

    it("provides localized quotes, treats, and toys for all 15 companion species", () => {
      for (const [id, p] of Object.entries(PET_PERSONALITIES)) {
        for (const quoteKey of p.quotes) {
          for (const lang of ["en", "hi", "mr", "ta", "bn", "ur"]) {
            const q = translate(lang, quoteKey);
            expect(q, `Missing quote ${quoteKey} in ${lang}`).toBeTruthy();
            expect(q).not.toBe(quoteKey);
          }
        }

        for (const lang of ["en", "hi", "mr", "ta", "bn", "ur"]) {
          const tr = translate(lang, p.favoriteTreatKey);
          const ty = translate(lang, p.favoriteToyKey);

          expect(tr, `Missing treat ${p.favoriteTreatKey} in ${lang}`).toBeTruthy();
          expect(tr).not.toBe(p.favoriteTreatKey);

          expect(ty, `Missing toy ${p.favoriteToyKey} in ${lang}`).toBeTruthy();
          expect(ty).not.toBe(p.favoriteToyKey);
        }
      }
    });

    it("provides complete translations for Diva, Instinct, FLASH, and Eeve", () => {
      const keysToCheck = [
        "diva.title",
        "diva.tagline",
        "diva.specialistsTitle",
        "diva.compositePrefix",
        "diva.privacyTitle",
        "instinct.assistantTitle",
        "instinct.yourRating",
        "instinct.trackProgress",
        "doc.eSanjeevani",
        "doc.emergencyNumber",
        "comm.teenNoticeTitle",
        "settings.nativeNumerals",
      ];

      for (const k of keysToCheck) {
        for (const lang of ["en", "hi", "mr", "ta", "bn", "te", "ur"]) {
          const res = translate(lang, k);
          expect(res, `Key ${k} missing in ${lang}`).toBeTruthy();
          expect(res).not.toBe(k);
        }
      }
    });
  });

  describe("3. Red Flag Safety & Multi-language Screening", () => {
    it("screens emergency queries in multiple Indian languages deterministically", () => {
      const redFlagHindi = screenSafety("मुझे बहुत ज्यादा खून बह रहा है और चक्कर आ रहे हैं");
      expect(redFlagHindi.isRedFlag).toBe(true);
      expect(redFlagHindi.type).toBe("urgent");

      const redFlagBengali = screenSafety("অতিরিক্ত রক্তক্ষরণ হচ্ছে");
      expect(redFlagBengali.isRedFlag).toBe(true);

      const redFlagTamil = screenSafety("அதிக இரத்தப்போக்கு மற்றும் மயக்கம்");
      expect(redFlagTamil.isRedFlag).toBe(true);

      const redFlagUrdu = screenSafety("شدید خون بہنا اور بے ہوشی");
      expect(redFlagUrdu.isRedFlag).toBe(true);
    });

    it("screens mental health crisis queries in multiple languages", () => {
      const crisisHindi = screenSafety("मुझे आत्महत्या के विचार आ रहे हैं");
      expect(crisisHindi.isRedFlag).toBe(true);
      expect(crisisHindi.type).toBe("crisis");
      expect(crisisHindi.helplines?.some((h) => h.number === "14416")).toBe(true);
    });
  });

  describe("4. Clinical Document Export Localisation", () => {
    it("generates clinical summary HTML with selected language, formatted numbers, and RTL for Urdu", () => {
      const mockRecord = {
        days: {
          "2026-04-01": { period: true, flow: "heavy", pain: 3, symptoms: ["cramps"] },
          "2026-04-02": { period: true, flow: "medium", pain: 2, symptoms: ["headache"] },
        },
        settings: { lang: "ur" },
      };

      const mockAnalysis = {
        cycles: [28, 29],
        stats: { meanLength: 28.5 },
      };

      const urHtml = generateDoctorSummaryPDF(mockRecord, mockAnalysis, { lang: "ur" });
      expect(urHtml).toContain('lang="ur"');
      expect(urHtml).toContain('dir="rtl"');
      expect(urHtml).toContain("direction: rtl");

      const hiHtml = generateDoctorSummaryPDF(mockRecord, mockAnalysis, { lang: "hi" });
      expect(hiHtml).toContain('lang="hi"');
      expect(hiHtml).toContain('dir="ltr"');
      expect(hiHtml).toContain("चिकित्सीय सूचना:");
    });
  });
});
