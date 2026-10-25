import { describe, it, expect } from "vitest";
import {
  calculateLockoutDelayMs,
  validatePinInput,
  validatePassphraseInput,
  validatePatternInput,
} from "@/lib/authLock.ts";
import { inspectStorage, migrateLegacyToVault } from "@/lib/migration.ts";

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
});
