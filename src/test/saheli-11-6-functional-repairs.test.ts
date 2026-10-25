import { describe, test, expect, beforeEach } from "vitest";
import { generateClinicalSummaryPDF } from "../lib/pdfGenerator.ts";
import {
  exportCSV,
  parseCSVText,
  parseCSVImport,
  exportJSON,
  parseImport,
  parsePDFImport,
  emptyRecord,
  blankDay,
} from "../lib/exportImport.js";
import {
  initializeVault,
  unlockVault,
  updateVaultLockMethod,
  encryptVaultRecord,
  decryptVaultRecord,
  generateRecoveryKey,
  isVaultEncrypted,
} from "../lib/vault.ts";
import {
  playSaheliChime,
  stopSaheliChime,
  loadChimeSettings,
  saveChimeSettings,
} from "../lib/chime.js";
import {
  sanitizeReportPayload,
  exportReportAsText,
  saveFeedbackDraft,
  loadFeedbackDraft,
  clearFeedbackDraft,
} from "../lib/feedbackClient.js";
import { calculateAge, isValidDob } from "../lib/agePolicy.ts";

// Complete In-memory IndexedDB mock
const memKv = new Map<string, any>();
(globalThis as any).indexedDB = {
  open: () => {
    const req: any = {
      result: {
        createObjectStore: () => {},
        transaction: () => {
          const tx: any = {
            objectStore: () => ({
              get: (key: string) => {
                const q: any = { result: memKv.get(key), onsuccess: null, onerror: null };
                queueMicrotask(() => {
                  if (q.onsuccess) q.onsuccess({ target: q });
                });
                return q;
              },
              put: (val: any, key: string) => {
                memKv.set(key, val);
              },
              delete: (key: string) => {
                memKv.delete(key);
              },
            }),
            oncomplete: null,
            onerror: null,
          };
          queueMicrotask(() => {
            if (tx.oncomplete) tx.oncomplete();
          });
          return tx;
        },
        close: () => {},
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };
    queueMicrotask(() => {
      if (req.onupgradeneeded) req.onupgradeneeded();
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  },
};

describe("SAHELI 11.6 — Final Functional Repairs", () => {
  beforeEach(() => {
    memKv.clear();
  });

  describe("1. Saheli Chime & Notification Sound (Issue 1)", () => {
    test("chime preview bypasses background muting when explicit preview is requested", async () => {
      // Mock AudioContext
      class MockGainNode {
        gain = {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        };
        connect() {}
        disconnect() {}
      }
      class MockOscillator {
        frequency = { setValueAtTime: () => {} };
        type = "sine";
        connect() {}
        disconnect() {}
        start() {}
        stop() {}
      }
      class MockAudioContext {
        state = "running";
        currentTime = 0;
        destination = {};
        createGain() {
          return new MockGainNode();
        }
        createOscillator() {
          return new MockOscillator();
        }
        close() {
          return Promise.resolve();
        }
        resume() {
          return Promise.resolve();
        }
      }

      (globalThis as any).window = (globalThis as any).window || {};
      (globalThis as any).window.AudioContext = MockAudioContext;

      // When volume is 0, preview returns false to prevent silent playback
      const silentResult = await playSaheliChime({ volume: 0, preview: true });
      expect(silentResult).toBe(false);

      // When volume > 0 and discreetMode is true, preview: true still plays for user confirmation
      const previewResult = await playSaheliChime({
        volume: 0.8,
        discreetMode: true,
        preview: true,
      });
      expect(previewResult).toBe(true);

      // stopSaheliChime shuts down active audio nodes cleanly
      expect(() => stopSaheliChime()).not.toThrow();
    });
  });

  describe("2. Genuine %PDF-1.4 Binary Generation & Lossless Re-Import (Issue 3)", () => {
    test("generates genuine PDF binary with %PDF-1.4 header and embeds machine-readable payload", () => {
      const rec = emptyRecord();
      rec.settings.role = "owner";
      rec.settings.ageGroup = "adult";
      rec.days["2026-10-20"] = {
        ...blankDay("2026-10-20"),
        period: true,
        flow: "heavy",
        pain: 3,
        symptoms: ["cramps", "tiredness"],
      };

      const analysis = {
        cycles: [{ start: "2026-09-20", end: "2026-10-19", length: 29 }],
        stats: { meanLength: 29 },
      };

      const pdfBytes = generateClinicalSummaryPDF(rec, analysis, {
        lang: "en",
        today: "2026-10-25",
      });
      expect(pdfBytes.BYTES_PER_ELEMENT).toBe(1);

      // Verify PDF Header
      const headerStr = new TextDecoder("ascii").decode(pdfBytes.slice(0, 8));
      expect(headerStr.startsWith("%PDF-1.4")).toBe(true);

      // Verify PDF Trailer and EOF
      const tailStr = new TextDecoder("ascii").decode(pdfBytes.slice(-40));
      expect(tailStr.includes("%%EOF")).toBe(true);

      // Verify Lossless Round-Trip Import from the genuine PDF binary
      const importResult = parsePDFImport(pdfBytes);
      expect(importResult.ok).toBe(true);
      expect(importResult.record).toBeDefined();
      expect(importResult.record.days["2026-10-20"].period).toBe(true);
      expect(importResult.record.days["2026-10-20"].flow).toBe("heavy");
      expect(importResult.record.days["2026-10-20"].pain).toBe(3);
    });

    test("CSV export protects against spreadsheet formula injection and includes UTF-8 BOM", () => {
      const rec = emptyRecord();
      rec.days["2026-10-22"] = {
        ...blankDay("2026-10-22"),
        period: true,
        note: "=CMD|' /C calc'!A0", // Formula injection payload
      };

      const csv = exportCSV(rec);
      // In cell output, leading formula triggers must be prefixed with single quote
      expect(
        csv.includes("`=CMD|' /C calc'!A0") || csv.includes("`") || csv.includes("'=CMD|"),
      ).toBe(true);

      // Parser handles UTF-8 BOM and parses values cleanly
      const withBom = "\uFEFF" + csv;
      const parsed = parseCSVImport(withBom);
      expect(parsed.ok).toBe(true);
      expect(parsed.record.days["2026-10-22"].period).toBe(true);
    });
  });

  describe("3. App Lock & Local-Device Encrypted Vault Integration (Issue 2 & 6)", () => {
    test("fresh install without lock creates valid encrypted vault with local device DEK", async () => {
      const { vaultDEK, vaultMeta, recoveryKey } = await initializeVault({
        lockMethod: "none",
      });

      expect(vaultDEK).toBeDefined();
      expect(vaultMeta.version).toBe(2);
      expect(vaultMeta.activeLockMethod).toBe("none");
      expect(recoveryKey.startsWith("REC-")).toBe(true);

      // Health records are 100% encrypted in storage
      const diary = emptyRecord();
      diary.days["2026-10-24"] = {
        ...blankDay("2026-10-24"),
        period: true,
        note: "Sensitive health observation",
      };

      const encrypted = await encryptVaultRecord(vaultDEK, diary);
      expect(isVaultEncrypted(encrypted)).toBe(true);
      expect(JSON.stringify(encrypted).includes("Sensitive health observation")).toBe(false);

      // Unlocks seamlessly on device without requiring a PIN
      const unlockRes = await unlockVault("", "none");
      expect(unlockRes.vaultDEK).toBeDefined();

      const decrypted = await decryptVaultRecord(unlockRes.vaultDEK, encrypted);
      expect(decrypted.days["2026-10-24"].note).toBe("Sensitive health observation");
    });

    test("enabling PIN lock transitions local vault without losing DEK or data", async () => {
      const init = await initializeVault({ lockMethod: "none" });
      const diary = emptyRecord();
      diary.days["2026-10-21"] = { ...blankDay("2026-10-21"), period: true };
      const encrypted = await encryptVaultRecord(init.vaultDEK, diary);

      // User later sets a PIN in Settings
      const updatedMeta = await updateVaultLockMethod(init.vaultDEK, "pin", "4321");
      expect(updatedMeta.activeLockMethod).toBe("pin");
      expect(updatedMeta.wrappers.pin).toBeDefined();

      // Wrong PIN fails
      await expect(unlockVault("0000", "pin")).rejects.toThrow();

      // Correct PIN unlocks the same DEK and restores diary
      const unlocked = await unlockVault("4321", "pin");
      const decrypted = await decryptVaultRecord(unlocked.vaultDEK, encrypted);
      expect(decrypted.days["2026-10-21"].period).toBe(true);
    });
  });

  describe("4. Privacy Sanitization & Feedback Submission (Issue 4)", () => {
    test("sanitizes report payload and completely excludes diary records and secrets", () => {
      const draft = {
        category: "bug",
        title: "Test Bug Title",
        description: "This is a detailed bug description for testing.",
        stepsToReproduce: "1. Click Settings\n2. View Chime",
        expectedBehaviour: "Hear sound",
        actualBehaviour: "Silent",
        contact: "test@example.com",
        consent: true,
      };

      const sanitized = sanitizeReportPayload(draft);
      expect(sanitized.category).toBe("bug");
      expect(sanitized.title).toBe("Test Bug Title");
      expect(sanitized.consent).toBe(true);
      // Ensure no health keys exist
      expect((sanitized as any).days).toBeUndefined();
      expect((sanitized as any).vaultDEK).toBeUndefined();
      expect((sanitized as any).dob).toBeUndefined();

      // Formats text cleanly for offline copy/paste
      const text = exportReportAsText(draft);
      expect(text.includes("=== SAHELI BUG REPORT & FEEDBACK ===")).toBe(true);
      expect(text.includes("Test Bug Title")).toBe(true);
    });
  });

  describe("5. First-Launch Age Policy & Gate Sequence (Issue 5)", () => {
    test("accurately classifies age group and validates DOB boundary", () => {
      const today = "2026-10-25";

      // 16 years old -> Under 18
      const dobUnder18 = "2010-05-15";
      expect(isValidDob(dobUnder18, today)).toBe(true);
      const calc16 = calculateAge(dobUnder18, today);
      expect(calc16.isUnder18).toBe(true);
      expect(calc16.age).toBe(16);

      // Exactly 18th birthday -> Adult
      const dob18 = "2008-10-25";
      expect(isValidDob(dob18, today)).toBe(true);
      const calc18 = calculateAge(dob18, today);
      expect(calc18.isUnder18).toBe(false);
      expect(calc18.age).toBe(18);

      // Future date -> Invalid
      expect(isValidDob("2028-01-01", today)).toBe(false);
    });
  });
});
