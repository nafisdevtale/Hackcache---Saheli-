import { describe, it, expect } from "vitest";
import {
  generateSaheliSerialId,
  validateSaheliSerialId,
  generateDeviceKeys,
  exportPublicKeyJwk,
  computeKeyFingerprint,
} from "@/lib/identity.ts";
import {
  generateVaultDEK,
  deriveKEK,
  wrapDEK,
  unwrapDEK,
  generateRecoveryKey,
  wrapRecoveryKey,
  unwrapRecoveryKey,
  encryptVaultRecord,
  decryptVaultRecord,
  patternToSecret,
} from "@/lib/vault.ts";

describe("Saheli 11.0 — Identity & Serial ID", () => {
  it("generates a valid Crockford Base32 Serial ID with mod-32 checksum", () => {
    const serialId = generateSaheliSerialId();
    expect(serialId).toMatch(
      /^SH-[0-9A-HJ-KM-NP-Z]{4}-[0-9A-HJ-KM-NP-Z]{4}-[0-9A-HJ-KM-NP-Z]{4}-[0-9A-HJ-KM-NP-Z]{4}$/,
    );
    expect(validateSaheliSerialId(serialId)).toBe(true);
  });

  it("validates 100 independently generated Serial IDs", () => {
    for (let i = 0; i < 100; i++) {
      const id = generateSaheliSerialId();
      expect(validateSaheliSerialId(id)).toBe(true);
    }
  });

  it("rejects invalid Serial ID formats or corrupted checksums", () => {
    expect(validateSaheliSerialId("")).toBe(false);
    expect(validateSaheliSerialId("INVALID-SERIAL-ID")).toBe(false);
    expect(validateSaheliSerialId("SH-1234-5678-90AB")).toBe(false); // too short

    const validId = generateSaheliSerialId();
    // Corrupt the last character (checksum)
    const lastChar = validId[validId.length - 1];
    const corruptedLast = lastChar === "0" ? "1" : "0";
    const corruptedId = validId.slice(0, -1) + corruptedLast;
    expect(validateSaheliSerialId(corruptedId)).toBe(false);

    // Corrupt a payload character
    const payloadCorrupted =
      validId.slice(0, 3) + (validId[3] === "A" ? "B" : "A") + validId.slice(4);
    expect(validateSaheliSerialId(payloadCorrupted)).toBe(false);
  });

  it("generates ECDSA and ECDH device cryptographic keys and computes key fingerprint", async () => {
    const keys = await generateDeviceKeys();
    expect(keys.signingKey.privateKey).toBeDefined();
    expect(keys.signingKey.publicKey).toBeDefined();
    expect(keys.exchangeKey.privateKey).toBeDefined();
    expect(keys.exchangeKey.publicKey).toBeDefined();

    const jwk = await exportPublicKeyJwk(keys.signingKey.publicKey);
    expect(jwk.kty).toBe("EC");
    expect(jwk.crv).toBe("P-256");

    const fingerprint = await computeKeyFingerprint(keys.signingKey.publicKey);
    expect(fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("Saheli 11.0 — Vault Key Hierarchy & Record Encryption", () => {
  it("derives KEK with PBKDF2 and wraps/unwraps DEK", async () => {
    const dek = await generateVaultDEK();
    const secret = "SecureSecret123!";
    const salt = "randomSaltBase64String==";
    const iterations = 10000;

    const kek = await deriveKEK(secret, salt, iterations);
    const wrapped = await wrapDEK(kek, dek);

    expect(wrapped.ciphertext).toBeDefined();
    expect(wrapped.iv).toBeDefined();

    const unwrappedDek = await unwrapDEK(kek, wrapped);
    expect(unwrappedDek).toBeDefined();
  });

  it("fails to unwrap DEK if wrong secret or tampered ciphertext is supplied", async () => {
    const dek = await generateVaultDEK();
    const salt = "randomSaltBase64String==";
    const iterations = 10000;

    const kek1 = await deriveKEK("SecretOne", salt, iterations);
    const kek2 = await deriveKEK("WrongSecret", salt, iterations);

    const wrapped = await wrapDEK(kek1, dek);

    // Unwrapping with wrong KEK should fail
    await expect(unwrapDEK(kek2, wrapped)).rejects.toThrow();

    // Tampered ciphertext should fail
    const tampered = { ...wrapped, ciphertext: wrapped.ciphertext.slice(0, -4) + "AAAA" };
    await expect(unwrapDEK(kek1, tampered)).rejects.toThrow();
  });

  it("generates, wraps, and unwraps Recovery Key", async () => {
    const dek = await generateVaultDEK();
    const recoveryKey = generateRecoveryKey();
    expect(recoveryKey).toMatch(
      /^REC-[0-9A-HJ-KM-NP-Z]{4}-[0-9A-HJ-KM-NP-Z]{4}-[0-9A-HJ-KM-NP-Z]{4}-[0-9A-HJ-KM-NP-Z]{4}$/,
    );

    const wrappedRecovery = await wrapRecoveryKey(recoveryKey, dek);
    expect(wrappedRecovery.ciphertext).toBeDefined();
    expect(wrappedRecovery.salt).toBeDefined();

    const unwrappedDek = await unwrapRecoveryKey(recoveryKey, wrappedRecovery);
    expect(unwrappedDek).toBeDefined();

    // Wrong recovery key should throw
    const wrongRecovery = generateRecoveryKey();
    await expect(unwrapRecoveryKey(wrongRecovery, wrappedRecovery)).rejects.toThrow();
  });

  it("encrypts and decrypts diary records with AES-256-GCM envelope", async () => {
    const dek = await generateVaultDEK();
    const testRecord = {
      settings: { ageGroup: "adult", showFertility: true },
      days: {
        "2026-10-25": { flow: "medium", symptoms: ["cramps", "headache"] },
      },
    };

    const envelope = await encryptVaultRecord(dek, testRecord);
    expect(envelope.v).toBe(2);
    expect(envelope.alg).toBe("AES-256-GCM");
    expect(envelope.iv).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();

    const decrypted = await decryptVaultRecord(dek, envelope);
    expect(decrypted).toEqual(testRecord);
  });

  it("detects and rejects tampered ciphertext or IV in record envelope", async () => {
    const dek = await generateVaultDEK();
    const testRecord = { test: "data" };
    const envelope = await encryptVaultRecord(dek, testRecord);

    // Tampered ciphertext
    const tamperedCt = {
      ...envelope,
      ct: envelope.ct.slice(0, -2) + "00",
      ciphertext: envelope.ciphertext.slice(0, -2) + "00",
    };
    await expect(decryptVaultRecord(dek, tamperedCt)).rejects.toThrow();

    // Tampered IV
    const tamperedIv = { ...envelope, iv: "AAAA" + envelope.iv.slice(4) };
    await expect(decryptVaultRecord(dek, tamperedIv)).rejects.toThrow();
  });

  it("converts 3x3 pattern nodes to deterministic secret", () => {
    const pattern = [0, 1, 2, 5, 8];
    const secret = patternToSecret(pattern);
    expect(secret).toBe("pattern:0-1-2-5-8");

    const emptySecret = patternToSecret([]);
    expect(emptySecret).toBe("pattern:");
  });
});
