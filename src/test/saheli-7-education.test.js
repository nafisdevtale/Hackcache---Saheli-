import { describe, it, expect } from "vitest";
import { CONDITIONS } from "../content/conditions.js";
import { LESSONS } from "../content/lessons.js";
import { SOURCES } from "../content/sources.js";

describe("Saheli 7.0 — Module B: PCOS/PCOD & Menstrual Health Education", () => {
  it("B1 & B2: PCOS condition guide contains all 10 required educational structural elements", () => {
    const pcos = CONDITIONS.pcos;
    expect(pcos).toBeDefined();

    // 1. What it is (Definition & prevalence)
    expect(pcos.paras[0].en).toContain(
      "PCOS (polycystic ovary syndrome) is a common hormone condition",
    );
    expect(pcos.paras[0].src).toBe("who_pcos");

    // 2. Indian terminology note (PCOD vs PCOS in India)
    expect(pcos.paras[1].en).toContain(
      'In India, people often say "PCOD" and "PCOS" for the same thing',
    );
    expect(pcos.paras[1].src).toBe("fogsi");

    // 3. Common signs & symptoms
    expect(pcos.paras[2].en).toContain("Common signs include irregular or missed periods");
    expect(pcos.paras[2].src).toBe("nhs_pcos");

    // 4. Why symptoms may vary
    expect(pcos.paras[3].en).toContain("Symptoms vary widely between different individuals");
    expect(pcos.paras[3].src).toBe("who_pcos");

    // 5. How a healthcare professional evaluates it (Doctor diagnosis, blood tests, ultrasound, teenage caution)
    expect(pcos.paras[4].en).toContain("Only a doctor can diagnose PCOS");
    expect(pcos.paras[4].src).toBe("who_pcos");

    // 6. General management and treatment approaches
    expect(pcos.paras[5].en).toContain("There is no cure, but symptoms can be managed");
    expect(pcos.paras[5].src).toBe("nhs_pcos");

    // 7. When to seek medical advice
    expect(pcos.paras[6].en).toContain(
      "Consult a healthcare professional if you miss three periods in a row",
    );
    expect(pcos.paras[6].src).toBe("acog_visit");

    // 8. Related educational lessons
    expect(pcos.relatedLessons).toContain("cycle");
    expect(pcos.relatedLessons).toContain("doctor_prep");

    // 9. Last editorial review date and credible references
    expect(pcos.lastReviewed).toBe("October 2026");
    expect(pcos.reviewStatus).toContain("Verified against WHO, NHS, FOGSI, and ACOG");
    expect(pcos.sources.length).toBeGreaterThanOrEqual(3);

    // 10. Explicit non-diagnostic limitation
    expect(pcos.nonDiagnosticNotice).toContain("Saheli provides health education only");
  });

  it("B2: PCOS guide has complete 13-language translations for every paragraph", () => {
    const langs = ["en", "hi", "mr", "bn", "te", "kn", "ta", "gu", "pa", "ml", "or", "as", "ur"];
    const pcos = CONDITIONS.pcos;

    // Check title
    for (const l of langs) {
      expect(pcos.title[l], `Missing PCOS title in ${l}`).toBeTruthy();
    }

    // Check all paragraphs
    pcos.paras.forEach((p, idx) => {
      for (const l of langs) {
        expect(p[l], `Paragraph ${idx} missing translation in ${l}`).toBeTruthy();
        expect(p[l].length, `Paragraph ${idx} translation too short in ${l}`).toBeGreaterThan(15);
      }
    });
  });

  it("B3: Source registry contains authoritative organizations, titles, topics, and verified HTTPS URLs", () => {
    const registryKeys = Object.keys(SOURCES);
    expect(registryKeys.length).toBeGreaterThanOrEqual(35);

    const requiredOrgs = ["WHO", "NHS", "ACOG", "FIGO", "FOGSI", "MoHFW"];
    const foundOrgs = new Set();

    for (const [id, src] of Object.entries(SOURCES)) {
      expect(src.name).toBeTruthy();
      expect(src.title, `Source ${id} missing title`).toBeTruthy();
      expect(src.organization, `Source ${id} missing organization`).toBeTruthy();
      expect(src.topic, `Source ${id} missing topic`).toBeTruthy();
      expect(src.url).toMatch(/^https:\/\//);
      expect(src.status).toBeTruthy();

      for (const org of requiredOrgs) {
        if (src.organization.includes(org) || src.name.includes(org)) {
          foundOrgs.add(org);
        }
      }
    }

    // All major organizations must be present in registry
    for (const org of requiredOrgs) {
      expect(foundOrgs.has(org), `Expected organization ${org} in sources registry`).toBe(true);
    }
  });

  it("B4 & B5: Lesson catalog covers adolescent education, hygiene, thyroid, and doctor prep", () => {
    const lessonIds = LESSONS.map((l) => l.id);
    expect(lessonIds).toContain("cycle");
    expect(lessonIds).toContain("first");
    expect(lessonIds).toContain("products");
    expect(lessonIds).toContain("thyroid");
    expect(lessonIds).toContain("cramps");
    expect(lessonIds).toContain("doctor_prep");
  });
});
