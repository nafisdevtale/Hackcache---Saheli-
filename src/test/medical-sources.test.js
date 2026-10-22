import { describe, it, expect } from "vitest";
import { SOURCES } from "@/content/sources.js";
import { LESSONS } from "@/content/lessons.js";
import { CONDITIONS } from "@/content/conditions.js";
import { PREGNANCY_WEEKS } from "@/content/pregnancyWeeks.js";
import { FIRST_PERIOD } from "@/content/firstPeriod.js";
import { RED_FLAG_RULES, URGENT_RULES, UNLOGGABLE_SIGNS } from "@/data/redflags.js";
import { CONFIG, EMERGENCY } from "@/config.js";

describe("Medical Education & Clinical Governance Audit", () => {
  it("every source entry in SOURCES has a valid name and secure HTTPS URL", () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThanOrEqual(25);
    for (const [id, src] of Object.entries(SOURCES)) {
      expect(src.name, `Source ${id} must have a name`).toBeTruthy();
      expect(src.url, `Source ${id} must have a url`).toMatch(/^https:\/\//);
    }
  });

  it("all source references in RED_FLAG_RULES, URGENT_RULES, and UNLOGGABLE_SIGNS exist in SOURCES", () => {
    const allRules = [...RED_FLAG_RULES, ...URGENT_RULES];
    for (const rule of allRules) {
      expect(
        rule.sources && rule.sources.length,
        `Rule ${rule.id} must cite sources`,
      ).toBeGreaterThan(0);
      for (const srcId of rule.sources) {
        expect(SOURCES[srcId], `Rule ${rule.id} references missing source: ${srcId}`).toBeDefined();
      }
    }

    for (const sign of UNLOGGABLE_SIGNS) {
      expect(
        sign.sources && sign.sources.length,
        `Sign ${sign.id} must cite sources`,
      ).toBeGreaterThan(0);
      for (const srcId of sign.sources) {
        expect(SOURCES[srcId], `Sign ${sign.id} references missing source: ${srcId}`).toBeDefined();
      }
    }
  });

  it("all educational lessons, conditions, and pregnancy weeks reference valid sources", () => {
    for (const lesson of LESSONS) {
      expect(lesson.title.en, `Lesson ${lesson.id} missing en title`).toBeTruthy();
      expect(lesson.title.hi, `Lesson ${lesson.id} missing hi title`).toBeTruthy();
      for (const para of lesson.paras) {
        expect(para.en).toBeTruthy();
        expect(para.hi).toBeTruthy();
        expect(para.src, `Paragraph in ${lesson.id} missing src`).toBeTruthy();
        expect(
          SOURCES[para.src],
          `Lesson ${lesson.id} references unknown source: ${para.src}`,
        ).toBeDefined();
      }
    }

    for (const [condId, cond] of Object.entries(CONDITIONS)) {
      for (const para of cond.paras) {
        expect(
          SOURCES[para.src],
          `Condition ${condId} references unknown source: ${para.src}`,
        ).toBeDefined();
      }
    }

    for (const week of PREGNANCY_WEEKS) {
      expect(week.src, `Pregnancy week range ${week.from}-${week.to} missing src`).toBeTruthy();
      expect(
        SOURCES[week.src],
        `Pregnancy week references unknown source: ${week.src}`,
      ).toBeDefined();
    }

    for (const para of FIRST_PERIOD.paras) {
      expect(
        SOURCES[para.src],
        `First period lesson references unknown source: ${para.src}`,
      ).toBeDefined();
    }
  });

  it("preserves established emergency contact numbers and mental health helpline", () => {
    expect(EMERGENCY.national).toBe("112");
    expect(EMERGENCY.ambulance).toBe("108");
    expect(EMERGENCY.teleManas).toBe("14416");
    expect(SOURCES.india_112.url).toBe("https://112.gov.in/");
    expect(SOURCES.telemanas.url).toBe("https://telemanas.mohfw.gov.in/");
  });

  it("clinical thresholds align with established medical literature", () => {
    // FIGO 2018 adult normal limits: 24-38 days, variation <= 7-9 days
    expect(CONFIG.irregular.adult.minLen).toBe(24);
    expect(CONFIG.irregular.adult.maxLen).toBe(38);
    expect(CONFIG.irregular.adult.maxSpread).toBe(7);

    // ACOG Committee Opinion 651: adolescent normal limits 21-45 days, variation <= 9 days
    expect(CONFIG.irregular.under18.minLen).toBe(21);
    expect(CONFIG.irregular.under18.maxLen).toBe(45);
    expect(CONFIG.irregular.under18.maxSpread).toBe(9);

    // NHS heavy bleeding threshold: > 7 days
    expect(CONFIG.longPeriodDays).toBe(7);

    // NHS missed periods threshold: 90 days (3 months)
    expect(CONFIG.noPeriodDays).toBe(90);
  });
});
