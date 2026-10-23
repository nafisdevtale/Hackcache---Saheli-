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
