// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  deriveKey,
  encryptJSON,
  decryptJSON,
  randomSaltB64,
  isValidPin,
  isEncrypted,
} from "@/lib/encryption.js";

describe("WebCrypto AES-GCM & PBKDF2 Encryption", () => {
  it("AES-GCM round trip, unique IVs, wrong PIN fails", async () => {
    const salt = randomSaltB64();
    const k = await deriveKey("1234", salt, 1000);
    const a = await encryptJSON(k, { note: "secret cramps" });
    const b = await encryptJSON(k, { note: "secret cramps" });
    expect(a.iv).not.toBe(b.iv);
    expect(JSON.stringify(a)).not.toContain("secret");
    expect(await decryptJSON(k, a)).toEqual({ note: "secret cramps" });
    await expect(decryptJSON(await deriveKey("9999", salt, 1000), a)).rejects.toBeTruthy();
  });

  it("validates 4-digit PIN format strictly", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("0000")).toBe(true);
    expect(isValidPin("9999")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("abcd")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin(null)).toBe(false);
    expect(isValidPin("")).toBe(false);
  });

  it("detects valid encrypted payload format", () => {
    expect(isEncrypted({ enc: 1, iv: "abc", ct: "xyz" })).toBe(true);
    expect(isEncrypted({ enc: 0, iv: "abc", ct: "xyz" })).toBe(false);
    expect(isEncrypted({ enc: 1, iv: 123, ct: "xyz" })).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted({})).toBe(false);
  });

  it("rejects non-encrypted objects with clear error", async () => {
    const salt = randomSaltB64();
    const k = await deriveKey("1234", salt, 1000);
    await expect(decryptJSON(k, { plain: "text" })).rejects.toThrow("not-encrypted");
  });

  it("rejects corrupt ciphertext and invalid base64 cleanly", async () => {
    const salt = randomSaltB64();
    const k = await deriveKey("1234", salt, 1000);
    const corruptB64 = { enc: 1, iv: "@@@invalid@@@", ct: "@@@invalid@@@" };
    await expect(decryptJSON(k, corruptB64)).rejects.toThrow("corrupt-ciphertext");
  });

  it("fails to decrypt tampered ciphertext bytes (AES-GCM authentication tag check)", async () => {
    const salt = randomSaltB64();
    const k = await deriveKey("1234", salt, 1000);
    const encrypted = await encryptJSON(k, { diary: "confidential entry" });

    // Tamper with ciphertext by altering characters
    const ctBytes = Uint8Array.from(atob(encrypted.ct), (c) => c.charCodeAt(0));
    ctBytes[0] = ctBytes[0] ^ 0xff; // flip bits
    const tamperedCt = btoa(String.fromCharCode(...ctBytes));
    const tamperedPayload = { ...encrypted, ct: tamperedCt };

    await expect(decryptJSON(k, tamperedPayload)).rejects.toBeTruthy();
  });

  it("supports PIN change workflow: decrypt with old key, re-encrypt with new key", async () => {
    const originalRecord = {
      days: { "2026-10-22": { period: true } },
      settings: { ageGroup: "adult" },
    };
    const oldSalt = randomSaltB64();
    const oldKey = await deriveKey("1234", oldSalt, 1000);
    const oldPayload = await encryptJSON(oldKey, originalRecord);

    // Decrypt using old PIN key
    const decrypted = await decryptJSON(oldKey, oldPayload);
    expect(decrypted).toEqual(originalRecord);

    // Re-encrypt with new PIN key
    const newSalt = randomSaltB64();
    const newKey = await deriveKey("5678", newSalt, 1000);
    const newPayload = await encryptJSON(newKey, decrypted);

    // Decrypt using new PIN key succeeds
    const finalRecord = await decryptJSON(newKey, newPayload);
    expect(finalRecord).toEqual(originalRecord);

    // Old PIN key fails on new payload
    await expect(decryptJSON(oldKey, newPayload)).rejects.toBeTruthy();
  });
});
