import { describe, it, expect } from "bun:test";
import { QUESTIONNAIRE_CONDITIONS, CONFIRMATION_STATUSES } from "../content/conditions.js";
import {
  defaultHealthConditions,
  emptyRecord,
  normalizeRecord,
  parseImport,
  exportJSON,
  mergeRecords,
} from "../lib/exportImport.js";
import { deriveKey, encryptJSON, decryptJSON, randomSaltB64 } from "../lib/encryption.js";

describe("Saheli 7.3 — Module B: Pre-existing Health Conditions & Governance", () => {
  describe("Catalogue Integrity & Clinical Taxonomy", () => {
    it("contains 11 distinct plain-language categories", () => {
      expect(QUESTIONNAIRE_CONDITIONS.length).toBe(11);
      const expectedIds = [
        "dysmenorrhea",
        "pms",
        "heavy_bleeding",
        "uterine_fibroids",
        "pcos",
        "hypothyroidism",
        "endometriosis",
        "adenomyosis",
        "thyroid_general",
        "bleeding_disorder",
        "other",
      ];
      expect(QUESTIONNAIRE_CONDITIONS.map((c) => c.id)).toEqual(expectedIds);
    });

    it("explicitly excludes and rejects unverified PMOS (Polyendocrine Metabolic Ovarian Syndrome)", () => {
      // Clinically unverified non-FIGO/WHO terminology must be rejected
      const hasPmos = QUESTIONNAIRE_CONDITIONS.some(
        (c) => c.id === "pmos" || c.labelKey?.includes("pmos"),
      );
      expect(hasPmos).toBe(false);

      // Verify PCOS is the authoritative verified clinical entity
      const pcos = QUESTIONNAIRE_CONDITIONS.find((c) => c.id === "pcos");
      expect(pcos).toBeDefined();
      expect(pcos.sourceIds).toContain("who_pcos");
      expect(pcos.sourceIds).toContain("fogsi");
    });

    it("supports 3 distinct confirmation statuses", () => {
      expect(CONFIRMATION_STATUSES.length).toBe(3);
      const statuses = CONFIRMATION_STATUSES.map((s) => s.id);
      expect(statuses).toContain("confirmed_diagnosis");
      expect(statuses).toContain("being_evaluated");
      expect(statuses).toContain("seeking_info");
    });

    it("allows custom text note only for 'other' category", () => {
      const other = QUESTIONNAIRE_CONDITIONS.find((c) => c.id === "other");
      expect(other.allowsCustomText).toBe(true);

      const pcos = QUESTIONNAIRE_CONDITIONS.find((c) => c.id === "pcos");
      expect(pcos.allowsCustomText).toBeUndefined();
    });
  });

  describe("Schema Normalization & Default Initialization", () => {
    it("initializes empty record with default healthConditions structure", () => {
      const rec = emptyRecord();
      expect(rec.healthConditions).toBeDefined();
      expect(rec.healthConditions.conditions).toEqual([]);
      expect(rec.healthConditions.otherText).toBe("");
      expect(rec.healthConditions.preferNotToSay).toBe(false);
      expect(rec.healthConditions.personalisationEnabled).toBe(true);
      expect(rec.healthConditions.lastUpdated).toBeNull();
    });

    it("normalizes and sanitizes healthConditions without leaking invalid keys", () => {
      const raw = {
        version: 1,
        days: {},
        settings: { ageGroup: "adult" },
        healthConditions: {
          conditions: [
            { id: "pcos", status: "confirmed_diagnosis", maliciousKey: "bad" },
            { id: "unknown_bogus", status: "fake_status" },
          ],
          otherText: "Special health notes",
          preferNotToSay: false,
          personalisationEnabled: true,
          unauthorizedField: "leak",
        },
      };

      const normalized = normalizeRecord(raw);
      expect(normalized.healthConditions).toBeDefined();
      expect(normalized.healthConditions.otherText).toBe("Special health notes");
      expect(normalized.healthConditions.unauthorizedField).toBeUndefined();

      // Only valid conditions and allowed keys survive
      const pcos = normalized.healthConditions.conditions.find((c) => c.id === "pcos");
      expect(pcos).toBeDefined();
      expect(pcos.status).toBe("confirmed_diagnosis");
      expect(pcos.maliciousKey).toBeUndefined();

      // Unknown condition without standard taxonomy is discarded or sanitized
      const bogus = normalized.healthConditions.conditions.find((c) => c.id === "unknown_bogus");
      expect(bogus).toBeUndefined();
    });
  });

  describe("Privacy, Encryption & Zero Leakage", () => {
    it("safely encrypts and decrypts healthConditions with user secret (AES-GCM)", async () => {
      const rec = emptyRecord();
      rec.healthConditions = {
        conditions: [
          { id: "endometriosis", status: "confirmed_diagnosis" },
          { id: "heavy_bleeding", status: "being_evaluated" },
        ],
        otherText: "Pelvic exam scheduled next month",
        preferNotToSay: false,
        personalisationEnabled: true,
        lastUpdated: "2026-10-23",
      };

      const salt = randomSaltB64();
      const key = await deriveKey("testPassword123", salt, 1000);
      const encrypted = await encryptJSON(key, rec);

      expect(typeof encrypted).toBe("object");
      expect(encrypted.enc).toBe(1);
      expect(encrypted.ct).toBeDefined();
      expect(typeof encrypted.ct).toBe("string");
      expect(encrypted.ct.includes("endometriosis")).toBe(false);
      expect(encrypted.ct.includes("Pelvic exam scheduled")).toBe(false);

      const decrypted = await decryptJSON(key, encrypted);
      expect(decrypted.healthConditions.conditions.length).toBe(2);
      expect(decrypted.healthConditions.conditions[0].id).toBe("endometriosis");
      expect(decrypted.healthConditions.otherText).toBe("Pelvic exam scheduled next month");
    });
  });

  describe("Data Portability & Import/Export Resilience", () => {
    it("preserves healthConditions across export and import JSON round trip", () => {
      const rec = emptyRecord();
      rec.healthConditions = {
        conditions: [
          { id: "pms", status: "seeking_info" },
          { id: "other", status: "confirmed_diagnosis" },
        ],
        otherText: "Iron deficiency anemia",
        preferNotToSay: false,
        personalisationEnabled: true,
        lastUpdated: "2026-10-23",
      };

      const jsonStr = exportJSON(rec);
      const parsed = parseImport(jsonStr);

      expect(parsed.ok).toBe(true);
      expect(parsed.record.healthConditions).toBeDefined();
      expect(parsed.record.healthConditions.conditions.length).toBe(2);
      expect(parsed.record.healthConditions.otherText).toBe("Iron deficiency anemia");
      expect(parsed.record.healthConditions.personalisationEnabled).toBe(true);
    });

    it("merges imported healthConditions when importing with merge strategy", () => {
      const local = emptyRecord();
      local.healthConditions = {
        conditions: [{ id: "dysmenorrhea", status: "confirmed_diagnosis" }],
        otherText: "",
        preferNotToSay: false,
        personalisationEnabled: true,
        lastUpdated: "2026-10-20",
      };

      const imported = emptyRecord();
      imported.healthConditions = {
        conditions: [{ id: "hypothyroidism", status: "confirmed_diagnosis" }],
        otherText: "Mild sluggishness",
        preferNotToSay: false,
        personalisationEnabled: true,
        lastUpdated: "2026-10-23",
      };

      const merged = mergeRecords(local, imported);
      expect(merged.healthConditions.conditions.length).toBe(2);
      const ids = merged.healthConditions.conditions.map((c) => c.id);
      expect(ids).toContain("dysmenorrhea");
      expect(ids).toContain("hypothyroidism");
      expect(merged.healthConditions.otherText).toBe("Mild sluggishness");
    });
  });
});
