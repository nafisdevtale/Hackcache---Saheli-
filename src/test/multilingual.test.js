import { describe, it, expect } from "vitest";
import { DICTS } from "../i18n/index.js";
import { LANGUAGES } from "../i18n/languages.js";
import { matchFaq, FAQ } from "../content/faq.js";
import { LESSONS } from "../content/lessons.js";
import { CONDITIONS } from "../content/conditions.js";
import { FIRST_PERIOD } from "../content/firstPeriod.js";
import { PREGNANCY_WEEKS } from "../content/pregnancyWeeks.js";
import { formatNumber, LOCALE_MAP } from "../lib/localDate.js";

describe("Saheli Supported Languages & Multilingual Framework", () => {
  it("registers exactly three supported languages (en, hi, mr) in LANGUAGES registry", () => {
    const expectedCodes = ["en", "hi", "mr"];
    expect(LANGUAGES.length).toBe(3);
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(expectedCodes);
  });

  it("exports all supported language dictionaries in DICTS", () => {
    const dictCodes = Object.keys(DICTS);
    expect(dictCodes.length).toBe(3);
    for (const lang of LANGUAGES) {
      expect(DICTS[lang.code]).toBeDefined();
    }
  });

  it("maintains 100% key parity with English across all supported dictionaries", () => {
    const enKeys = Object.keys(DICTS.en).sort();
    expect(enKeys.length).toBeGreaterThan(600);

    for (const lang of LANGUAGES) {
      const langKeys = Object.keys(DICTS[lang.code]).sort();
      const missingKeys = enKeys.filter((k) => !(k in DICTS[lang.code]));
      expect(
        missingKeys,
        `Language ${lang.code} (${lang.name}) is missing keys: ${missingKeys.slice(0, 5).join(", ")}`,
      ).toEqual([]);
    }
  });

  it("all supported languages are left-to-right (ltr)", () => {
    for (const lang of LANGUAGES) {
      expect(lang.dir).toBe("ltr");
    }
  });

  it("verifies authentic native script translations for core UI in each language", () => {
    // English core checks
    expect(DICTS.en["nav.today"]).toBe("Today");
    expect(DICTS.en["common.save"]).toBe("Save");

    // Hindi core checks
    expect(DICTS.hi["nav.today"]).toBe("आज");
    expect(DICTS.hi["common.save"]).toBe("सेव करें");
    expect(DICTS.hi["sym.cramps"]).toBe("पेट में ऐंठन");

    // Marathi core checks
    expect(DICTS.mr["nav.today"]).toBe("आज");
    expect(DICTS.mr["common.save"]).toBe("जतन करा");
    expect(DICTS.mr["sym.cramps"]).toBe("पोटदुखी / पेटके");
  });

  it("matches FAQ questions and urgent symptoms across supported Indian languages", () => {
    // English query
    const enMatch = matchFaq("normal cycle length");
    expect(enMatch.type).toBe("match");
    expect(enMatch.item.id).toBe("normal_length");

    // Hindi query
    const hiMatch = matchFaq("सामान्य चक्र कितने दिन");
    expect(hiMatch.type).toBe("match");
    expect(hiMatch.item.id).toBe("normal_length");

    // Emergency red flag in Hindi
    const hiUrgent = matchFaq("अचानक तेज़ दर्द");
    expect(hiUrgent.type).toBe("urgent");

    // Self harm in Hindi
    const hiCrisis = matchFaq("मैं आत्महत्या करना चाहता हूं");
    expect(hiCrisis.type).toBe("selfharm");
  });

  it("verifies complete coverage in medical educational lessons and conditions across supported languages", () => {
    const allCodes = LANGUAGES.map((l) => l.code);

    // Lessons check
    for (const lesson of LESSONS) {
      for (const code of allCodes) {
        expect(lesson.title[code], `Lesson ${lesson.id} missing title in ${code}`).toBeTruthy();
      }
      for (const para of lesson.paras) {
        for (const code of allCodes) {
          expect(para[code], `Paragraph in ${lesson.id} missing text in ${code}`).toBeTruthy();
        }
      }
    }

    // PCOS condition
    for (const code of allCodes) {
      expect(CONDITIONS.pcos.title[code]).toBeTruthy();
      for (const para of CONDITIONS.pcos.paras) {
        expect(para[code]).toBeTruthy();
      }
    }

    // First period guide
    for (const code of allCodes) {
      expect(FIRST_PERIOD.title[code]).toBeTruthy();
      for (const para of FIRST_PERIOD.paras) {
        expect(para[code]).toBeTruthy();
      }
    }

    // Pregnancy weeks
    for (const stage of PREGNANCY_WEEKS) {
      for (const code of allCodes) {
        expect(stage[code]).toBeTruthy();
      }
    }

    // All FAQs
    expect(FAQ.length).toBeGreaterThanOrEqual(30);
    for (const item of FAQ) {
      for (const code of allCodes) {
        expect(item.q[code], `FAQ ${item.id} missing question in ${code}`).toBeTruthy();
        expect(item.a[code], `FAQ ${item.id} missing answer in ${code}`).toBeTruthy();
      }
    }
  });

  it("provides locale mapping and localized number formatting for all supported languages", () => {
    expect(Object.keys(LOCALE_MAP).length).toBe(3);
    for (const lang of LANGUAGES) {
      expect(LOCALE_MAP[lang.code]).toBeDefined();
    }
    expect(formatNumber(1234, "en")).toBe("1,234");
    // Saheli 10.6: Non-English languages default to native digits with Indian grouping
    expect(formatNumber(1234, "hi")).toBe("१,२३४");
    expect(formatNumber(1234567, "hi")).toBe("१२,३४,५६७");
    // Explicit Latin override maintains compatibility
    expect(formatNumber(1234, "hi", { latinNumerals: true })).toBe("1,234");
    expect(formatNumber(1234567, "hi", { latinNumerals: true })).toBe("12,34,567");
  });
});
