import { describe, it, expect } from "vitest";
import { DICTS } from "../i18n/index.js";
import { LANGUAGES } from "../i18n/languages.js";
import { matchFaq } from "../content/faq.js";

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

  it("matches FAQ questions in both English and Hindi", () => {
    // English query
    const enMatch = matchFaq("normal cycle length");
    expect(enMatch.type).toBe("match");
    expect(enMatch.item.id).toBe("normal_length");

    // Hindi query
    const hiMatch = matchFaq("सामान्य चक्र कितने दिन");
    expect(hiMatch.type).toBe("match");
    expect(hiMatch.item.id).toBe("normal_length");
  });
});
