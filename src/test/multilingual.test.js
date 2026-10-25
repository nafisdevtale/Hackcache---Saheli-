import { describe, it, expect } from "vitest";
import { DICTS } from "../i18n/index.js";
import { LANGUAGES } from "../i18n/languages.js";
import { matchFaq, FAQ } from "../content/faq.js";
import { LESSONS } from "../content/lessons.js";
import { CONDITIONS } from "../content/conditions.js";
import { FIRST_PERIOD } from "../content/firstPeriod.js";
import { PREGNANCY_WEEKS } from "../content/pregnancyWeeks.js";
import { formatNumber, LOCALE_MAP } from "../lib/localDate.js";

describe("Saheli 13 Indian Languages & Multilingual Framework", () => {
  it("registers all 13 supported Indian languages in LANGUAGES registry", () => {
    const expectedCodes = [
      "en",
      "hi",
      "mr",
      "te",
      "kn",
      "ta",
      "bn",
      "gu",
      "pa",
      "ml",
      "or",
      "as",
      "ur",
    ];
    expect(LANGUAGES.length).toBe(13);
    const codes = LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(expectedCodes);
  });

  it("exports all 13 language dictionaries in DICTS", () => {
    const dictCodes = Object.keys(DICTS);
    expect(dictCodes.length).toBe(13);
    for (const lang of LANGUAGES) {
      expect(DICTS[lang.code]).toBeDefined();
    }
  });

  it("maintains 100% key parity with English across all 13 dictionaries", () => {
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

  it("marks Urdu as right-to-left (rtl) in the registry", () => {
    const urdu = LANGUAGES.find((l) => l.code === "ur");
    expect(urdu).toBeDefined();
    expect(urdu?.dir).toBe("rtl");

    // All other 12 languages should be ltr
    const ltrLangs = LANGUAGES.filter((l) => l.code !== "ur");
    expect(ltrLangs.every((l) => l.dir === "ltr")).toBe(true);
  });

  it("verifies authentic native script translations for core UI in each language", () => {
    // Tamil core checks
    expect(DICTS.ta["nav.today"]).toBe("இன்று");
    expect(DICTS.ta["common.save"]).toBe("சேமிக்க");
    expect(DICTS.ta["sym.cramps"]).toContain("வலி");

    // Bengali core checks
    expect(DICTS.bn["nav.today"]).toBe("আজ");
    expect(DICTS.bn["common.save"]).toBe("সংরক্ষণ করুন");
    expect(DICTS.bn["sym.headache"]).toBe("মাথাব্যথা");

    // Marathi core checks
    expect(DICTS.mr["nav.today"]).toBe("आज");
    expect(DICTS.mr["common.save"]).toBe("जतन करा");
    expect(DICTS.mr["sym.cramps"]).toBe("पोटदुखी / पेटके");

    // Telugu core checks
    expect(DICTS.te["nav.today"]).toBe("ఈరోజు");
    expect(DICTS.te["common.save"]).toBe("భద్రపరచు");

    // Urdu core checks
    expect(DICTS.ur["nav.today"]).toBe("آج");
    expect(DICTS.ur["common.save"]).toBe("محفوظ کریں");
    expect(DICTS.ur["sym.cramps"]).toContain("درد");

    // Gujarati core checks
    expect(DICTS.gu["nav.today"]).toBe("આજે");
    expect(DICTS.gu["common.save"]).toBe("સાચવો");

    // Kannada core checks
    expect(DICTS.kn["nav.today"]).toBe("ಇಂದು");
    expect(DICTS.kn["common.save"]).toBe("ಉಳಿಸಿ");

    // Malayalam core checks
    expect(DICTS.ml["nav.today"]).toBe("ഇന്ന്");
    expect(DICTS.ml["common.save"]).toBe("സൂക്ഷിക്കുക");

    // Punjabi core checks
    expect(DICTS.pa["nav.today"]).toBe("ਅੱਜ");
    expect(DICTS.pa["common.save"]).toBe("ਸੰਭਾਲੋ");

    // Odia core checks
    expect(DICTS.or["nav.today"]).toBe("ଆଜି");
    expect(DICTS.or["common.save"]).toBe("ସାଇତନ୍ତୁ");

    // Assamese core checks
    expect(DICTS.as["nav.today"]).toBe("আজি");
    expect(DICTS.as["common.save"]).toBe("সংৰক্ষণ কৰক");
  });

  it("verifies zero verbatim Hindi copying in non-Devanagari regional dictionaries", () => {
    const nonDevanagari = ["bn", "te", "kn", "ta", "gu", "pa", "ml", "or", "as", "ur"];
    // Exclude shared Indic danda punctuation (\u0964 and \u0965) used across Bengali, Assamese, Odia, etc.
    const devanagariRegex = /[\u0900-\u0963\u0966-\u097F]/;

    for (const code of nonDevanagari) {
      const dict = DICTS[code];
      let contaminatedCount = 0;
      for (const [key, val] of Object.entries(dict)) {
        if (typeof val === "string" && devanagariRegex.test(val)) {
          // Allowed only if English original also has Devanagari or currency symbol
          if (!devanagariRegex.test(DICTS.en[key] || "")) {
            contaminatedCount++;
          }
        }
      }
      expect(
        contaminatedCount,
        `Dictionary ${code} has ${contaminatedCount} Hindi Devanagari contaminated keys!`,
      ).toBe(0);
    }
  });

  it("matches FAQ questions and urgent symptoms across multiple Indian languages", () => {
    // English query
    const enMatch = matchFaq("normal cycle length");
    expect(enMatch.type).toBe("match");
    expect(enMatch.item.id).toBe("normal_length");

    // Hindi query
    const hiMatch = matchFaq("सामान्य चक्र कितने दिन");
    expect(hiMatch.type).toBe("match");
    expect(hiMatch.item.id).toBe("normal_length");

    // Emergency red flag in Bengali
    const bnUrgent = matchFaq("প্রচুর রক্তপাত মাথা ঘোরা");
    expect(bnUrgent.type).toBe("urgent");

    // Self harm in Urdu
    const urCrisis = matchFaq("میں خودکشی کرنا چاہتا ہوں");
    expect(urCrisis.type).toBe("selfharm");
  });

  it("verifies complete 13-language coverage in medical educational lessons and conditions", () => {
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

  it("provides locale mapping and localized number formatting for all 13 languages", () => {
    expect(Object.keys(LOCALE_MAP).length).toBe(13);
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
