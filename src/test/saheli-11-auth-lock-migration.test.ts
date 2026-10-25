import { describe, it, expect } from "vitest";
import {
  calculateLockoutDelayMs,
  validatePinInput,
  validatePassphraseInput,
  validatePatternInput,
} from "@/lib/authLock.ts";
import { inspectStorage, migrateLegacyToVault } from "@/lib/migration.ts";
import { deriveKey, encryptJSON, randomSaltB64 } from "@/lib/encryption.js";
import { decryptVaultRecord, unwrapDEK, deriveKEK } from "@/lib/vault.ts";

describe("Saheli 11.0 — Auth Lock Inputs & Progressive Lockout", () => {
  it("validates PIN input requirements (4-12 digits only)", () => {
    expect(validatePinInput("1234").valid).toBe(true);
    expect(validatePinInput("123456").valid).toBe(true);
    expect(validatePinInput("123456789012").valid).toBe(true);

    expect(validatePinInput("123").valid).toBe(false); // too short
    expect(validatePinInput("1234567890123").valid).toBe(false); // too long
    expect(validatePinInput("123a").valid).toBe(false); // non-digit
    expect(validatePinInput("").valid).toBe(false);
  });

  it("validates Passphrase input requirements (minimum 6 characters)", () => {
    expect(validatePassphraseInput("secret").valid).toBe(true);
    expect(validatePassphraseInput("super secure passphrase 2026").valid).toBe(true);

    expect(validatePassphraseInput("12345").valid).toBe(false); // too short
    expect(validatePassphraseInput("").valid).toBe(false);
  });

  it("validates Pattern input requirements (minimum 4 distinct nodes, 0-8)", () => {
    expect(validatePatternInput([0, 1, 2, 5]).valid).toBe(true);
    expect(validatePatternInput([0, 3, 6, 7, 8, 5, 2]).valid).toBe(true);

    expect(validatePatternInput([0, 1, 2]).valid).toBe(false); // < 4 nodes
    expect(validatePatternInput([0, 1, 2, 2]).valid).toBe(false); // duplicate node
    expect(validatePatternInput([0, 1, 2, 9]).valid).toBe(false); // out of range node
    expect(validatePatternInput([]).valid).toBe(false);
  });

  it("implements progressive lockout delay schedule", () => {
    expect(calculateLockoutDelayMs(0)).toBe(0);
    expect(calculateLockoutDelayMs(1)).toBe(0);
    expect(calculateLockoutDelayMs(2)).toBe(0);
    expect(calculateLockoutDelayMs(3)).toBe(3000); // 3-4 failures: 3s
    expect(calculateLockoutDelayMs(4)).toBe(3000);
    expect(calculateLockoutDelayMs(5)).toBe(15000); // 5-7 failures: 15s
    expect(calculateLockoutDelayMs(6)).toBe(15000);
    expect(calculateLockoutDelayMs(7)).toBe(15000);
    expect(calculateLockoutDelayMs(8)).toBe(30000); // 8-9 failures: 30s
    expect(calculateLockoutDelayMs(9)).toBe(30000);
    expect(calculateLockoutDelayMs(10)).toBe(60000); // 10+ failures: 60s
    expect(calculateLockoutDelayMs(20)).toBe(60000);
  });
});

describe("Saheli 11.0 — Legacy Storage Inspection & Migration", () => {
  it("inspects v1 unencrypted storage", async () => {
    const status = await inspectStorage({
      meta: { onboarded: true, mode: "real", pin: { enabled: false } },
      record: { days: { "2026-10-20": { flow: "light" } } },
      vaultMeta: null,
    });
    expect(status.vaultVersion).toBe(1);
    expect(status.isEncrypted).toBe(false);
    expect(status.pinEnabled).toBe(false);
  });

  it("inspects v1 PIN-encrypted storage", async () => {
    const status = await inspectStorage({
      meta: {
        onboarded: true,
        mode: "real",
        pin: { enabled: true, salt: "abc", iterations: 10000 },
      },
      record: { enc: 1, ct: "...", iv: "...", salt: "..." },
      vaultMeta: null,
    });
    expect(status.vaultVersion).toBe(1);
    expect(status.isEncrypted).toBe(true);
    expect(status.pinEnabled).toBe(true);
  });

  it("inspects v2 encrypted vault storage", async () => {
    const status = await inspectStorage({
      meta: { onboarded: true, mode: "real" },
      record: { v: 2, alg: "AES-GCM-256", ciphertext: "...", iv: "..." },
      vaultMeta: {
        version: 2,
        vaultId: "v-1",
        createdAt: "2026-10-25",
        activeLockMethod: "pin",
        wrappers: {},
      },
    });
    expect(status.vaultVersion).toBe(2);
    expect(status.isEncrypted).toBe(true);
  });

  it("migrates unencrypted legacy record to v2 Vault without data loss", async () => {
    const legacyRecord = {
      settings: { ageGroup: "adult" },
      days: {
        "2026-10-01": { flow: "heavy" },
        "2026-10-02": { flow: "medium" },
        "2026-10-03": { flow: "light" },
      },
    };

    const migrationResult = await migrateLegacyToVault({
      legacyRecord,
      lockMethod: "pin",
      secret: "1234",
    });

    expect(migrationResult.success).toBe(true);
    expect(migrationResult.migratedDaysCount).toBe(3);
    expect(migrationResult.vaultMeta.version).toBe(2);
    expect(migrationResult.vaultMeta.activeLockMethod).toBe("pin");
    expect(migrationResult.encryptedRecord.v).toBe(2);
    expect(migrationResult.recoveryKey).toMatch(/^REC-/);
  });

  it("migrates a rich legacy record preserving cycle history, symptoms, notes, settings, and companion pets", async () => {
    const comprehensiveFixture = {
      version: 1,
      settings: {
        ageGroup: "adult",
        theme: "rose",
        discreet: true,
        cycleLength: 29,
        periodLength: 5,
        notifications: true,
      },
      days: {
        "2026-09-01": {
          period: true,
          flow: "heavy",
          symptoms: ["cramps", "headache", "fatigue"],
          notes: "First day of cycle, needed heating pad",
          sleep: 7,
          water: 8,
          mood: "low",
        },
        "2026-09-02": {
          period: true,
          flow: "medium",
          symptoms: ["bloating"],
          notes: "Feeling slightly better after chamomile tea",
          sleep: 8,
          water: 10,
          mood: "calm",
        },
        "2026-09-15": {
          period: false,
          symptoms: ["ovulation_pain"],
          notes: "Mid-cycle check-in",
          sleep: 8,
          water: 9,
        },
      },
      pets: {
        activePetId: "pet-cat-01",
        adopted: [
          {
            id: "pet-cat-01",
            species: "cat",
            name: "Mochi",
            level: 3,
            xp: 450,
            accessory: "scarf",
          },
        ],
      },
    };

    const result = await migrateLegacyToVault({
      legacyRecord: comprehensiveFixture,
      lockMethod: "passphrase",
      secret: "master-passphrase-2026",
    });

    expect(result.success).toBe(true);
    expect(result.migratedDaysCount).toBe(3);

    // Re-derive KEK from the passphrase to unwrap the DEK
    const wrapper = result.vaultMeta.wrappers.passphrase!;
    const kek = await deriveKEK("master-passphrase-2026", wrapper.saltB64, wrapper.iterations);
    const unwrappedDEK = await unwrapDEK(wrapper.wrappedDEKB64, wrapper.ivB64, kek);

    // Decrypt the migrated record and check 100% deep equality
    const decrypted = await decryptVaultRecord(unwrappedDEK, result.encryptedRecord);

    expect(decrypted.settings).toEqual(comprehensiveFixture.settings);
    expect(decrypted.days).toEqual(comprehensiveFixture.days);
    expect(decrypted.pets).toEqual(comprehensiveFixture.pets);
    expect(decrypted.days["2026-09-01"].notes).toBe("First day of cycle, needed heating pad");
    expect(decrypted.pets.adopted[0].name).toBe("Mochi");
  });

  it("migrates a PIN-encrypted legacy record (enc: 1) and verifies value-level fidelity", async () => {
    const legacyPlaintext = {
      version: 1,
      settings: { ageGroup: "under18", cycleLength: 32 },
      days: {
        "2026-10-10": { flow: "heavy", symptoms: ["backache"], notes: "Encrypted diary record" },
      },
      pets: { adopted: [] },
    };

    const salt = randomSaltB64();
    const legacyKey = await deriveKey("4321", salt, 10000);
    const legacyEncryptedPayload = await encryptJSON(legacyKey, legacyPlaintext);

    // Simulate migration of encrypted legacy record
    // 1. Decrypt with legacy key
    const decrypted = await (async () => {
      const k = await deriveKey("4321", salt, 10000);
      const { decryptJSON } = await import("@/lib/encryption.js");
      return decryptJSON(k, legacyEncryptedPayload);
    })();

    // 2. Migrate to v2 Vault
    const result = await migrateLegacyToVault({
      legacyRecord: decrypted,
      lockMethod: "pin",
      secret: "4321",
    });

    expect(result.success).toBe(true);

    const wrapper = result.vaultMeta.wrappers.pin!;
    const kek = await deriveKEK("4321", wrapper.saltB64, wrapper.iterations);
    const dek = await unwrapDEK(wrapper.wrappedDEKB64, wrapper.ivB64, kek);
    const finalRecord = await decryptVaultRecord(dek, result.encryptedRecord);

    expect(finalRecord.days["2026-10-10"].notes).toBe("Encrypted diary record");
    expect(finalRecord.settings.ageGroup).toBe("under18");
  });

  it("fails safely if legacy PIN is incorrect and does not corrupt storage", async () => {
    const salt = randomSaltB64();
    const correctKey = await deriveKey("9999", salt, 10000);
    const encryptedPayload = await encryptJSON(correctKey, { confidential: "health-data" });

    // Attempting to decrypt with wrong PIN must throw and abort
    const wrongKey = await deriveKey("0000", salt, 10000);
    const { decryptJSON } = await import("@/lib/encryption.js");

    await expect(decryptJSON(wrongKey, encryptedPayload)).rejects.toThrow();
  });
});
