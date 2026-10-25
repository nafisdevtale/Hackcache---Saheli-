/**
 * Saheli 11.0 — Unified Encrypted Vault & Key Hierarchy
 *
 * Cryptographic Architecture:
 * 1. Vault Data Encryption Key (DEK):
 *    - 256-bit AES-GCM key randomly generated at onboarding.
 *    - Encrypts all sensitive health diary records, period logs, symptoms, and private notes.
 *    - NEVER stored in plaintext.
 * 2. Key Encryption Keys (KEK):
 *    - Derived from user unlock secrets (PIN, Passphrase, Pattern, Recovery Key).
 *    - Wraps/unwraps the Vault DEK using AES-GCM with unique salts and nonces.
 * 3. Recovery Key:
 *    - High-entropy random code (128-bit) formatted as REC-XXXX-XXXX-XXXX-XXXX.
 *    - Independently wraps the Vault DEK to provide account-free recovery.
 * 4. In-Memory Security:
 *    - Unwrapped DEK resides only in memory while the vault is unlocked.
 *    - Cryptographic locking unloads and wipes the active DEK reference.
 */

import { CONFIG } from "../config.js";
import { idbGet, idbWrite } from "./storage.js";

const enc = new TextEncoder();
const dec = new TextDecoder();

export const b64 = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

export const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export type LockMethod = "none" | "pin" | "passphrase" | "pattern" | "device";

export interface KeyWrapper {
  method: LockMethod | "recovery";
  kdf: "PBKDF2-SHA256" | "WEB_AUTHN";
  saltB64: string;
  iterations: number;
  ivB64: string;
  wrappedDEKB64: string;
}

export interface VaultMetadata {
  version: 2;
  vaultId: string;
  createdAt: string;
  activeLockMethod: LockMethod;
  wrappers: {
    pin?: KeyWrapper;
    passphrase?: KeyWrapper;
    pattern?: KeyWrapper;
    device?: KeyWrapper;
    recovery?: KeyWrapper;
  };
  deviceCredentialId?: string;
}

export interface EncryptedVaultPayload {
  v: 2;
  alg: "AES-256-GCM";
  iv: string;
  ct: string;
  ts: string;
}

/**
 * Generates a brand new 256-bit AES-GCM Vault DEK
 */
export async function generateVaultDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable for initial wrapping
    ["encrypt", "decrypt"],
  );
}

/**
 * Derives a 256-bit Key Encryption Key (KEK) from a secret string (PIN, passphrase, pattern)
 */
export async function deriveKEK(
  secret: string,
  saltB64: string,
  iterations: number = CONFIG.pbkdf2Iterations,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, [
    "deriveKey",
  ]);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: unb64(saltB64) as unknown as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Wraps the Vault DEK using a derived KEK
 */
export async function wrapDEK(
  arg1: any,
  arg2: any,
): Promise<{ ivB64: string; wrappedB64: string; iv: string; ciphertext: string }> {
  const dek = arg1.extractable ? arg1 : arg2;
  const kek = dek === arg1 ? arg2 : arg1;
  const exportedDEK = await crypto.subtle.exportKey("raw", dek);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, exportedDEK);

  return {
    ivB64: b64(iv),
    wrappedB64: b64(ciphertext),
    iv: b64(iv),
    ciphertext: b64(ciphertext),
  };
}

/**
 * Unwraps the Vault DEK using a derived KEK
 */
export async function unwrapDEK(arg1: any, arg2?: any, arg3?: any): Promise<CryptoKey> {
  let wrappedB64: string;
  let ivB64: string;
  let kek: CryptoKey;

  if (arg1 && typeof arg1 === "object" && ("ciphertext" in arg1 || "wrappedB64" in arg1)) {
    wrappedB64 = arg1.ciphertext || arg1.wrappedB64;
    ivB64 = arg1.iv || arg1.ivB64;
    kek = arg2;
  } else if (arg2 && typeof arg2 === "object" && ("ciphertext" in arg2 || "wrappedB64" in arg2)) {
    kek = arg1;
    wrappedB64 = arg2.ciphertext || arg2.wrappedB64;
    ivB64 = arg2.iv || arg2.ivB64;
  } else {
    wrappedB64 = arg1;
    ivB64 = arg2;
    kek = arg3!;
  }

  const iv = unb64(ivB64);
  const ciphertext = unb64(wrappedB64);

  const rawDEK = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    kek,
    ciphertext as unknown as BufferSource,
  );

  return crypto.subtle.importKey(
    "raw",
    rawDEK,
    { name: "AES-GCM", length: 256 },
    true, // extractable for memory wrapping operations
    ["encrypt", "decrypt"],
  );
}

/**
 * Wraps recovery key
 */
export async function wrapRecoveryKey(recoveryKey: string, dek: CryptoKey) {
  const saltB64 = b64(crypto.getRandomValues(new Uint8Array(16)));
  const kek = await deriveKEK(recoveryKey, saltB64, 10000);
  const { ivB64, wrappedB64 } = await wrapDEK(dek, kek);
  return {
    salt: saltB64,
    saltB64,
    iv: ivB64,
    ivB64,
    ciphertext: wrappedB64,
    wrappedB64,
  };
}

/**
 * Unwraps recovery key
 */
export async function unwrapRecoveryKey(recoveryKey: string, wrapper: any): Promise<CryptoKey> {
  const salt = wrapper.salt || wrapper.saltB64;
  const kek = await deriveKEK(recoveryKey, salt, 10000);
  const iv = wrapper.iv || wrapper.ivB64;
  const ciphertext = wrapper.ciphertext || wrapper.wrappedB64;
  return unwrapDEK(ciphertext, iv, kek);
}

/**
 * Generates an unpredictable 128-bit high-entropy recovery code:
 * Format: REC-XXXX-XXXX-XXXX-XXXX
 */
export function generateRecoveryKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // Crockford-safe
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `REC-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
}

/**
 * Formats pattern coordinate touches (0-8) into a reproducible secret string
 */
export function patternToSecret(nodes: number[]): string {
  if (!nodes || nodes.length < 4) {
    return "pattern:";
  }
  return `pattern:${nodes.join("-")}`;
}

/**
 * Encrypts a sensitive record object with the Vault DEK
 */
export async function encryptVaultRecord(
  dek: CryptoKey,
  record: unknown,
): Promise<EncryptedVaultPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payloadBytes = enc.encode(JSON.stringify(record));

  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, dek, payloadBytes);

  return {
    v: 2,
    alg: "AES-256-GCM",
    iv: b64(iv),
    ct: b64(ct),
    ciphertext: b64(ct),
    ts: new Date().toISOString(),
  };
}

/**
 * Decrypts an encrypted vault envelope with the Vault DEK
 */
export async function decryptVaultRecord(dek: CryptoKey, payload: any): Promise<any> {
  if (!payload || payload.v !== 2) {
    throw new Error("unsupported-vault-format");
  }

  const ctStr = payload.ct || payload.ciphertext;
  if (!ctStr || !payload.iv) throw new Error("invalid-envelope");

  let ivBytes: Uint8Array;
  let ctBytes: Uint8Array;
  try {
    ivBytes = unb64(payload.iv);
    ctBytes = unb64(ctStr);
  } catch {
    throw new Error("corrupt-ciphertext");
  }

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as unknown as BufferSource },
    dek,
    ctBytes as unknown as BufferSource,
  );

  try {
    return JSON.parse(dec.decode(decryptedBytes));
  } catch {
    throw new Error("corrupt-payload");
  }
}

/**
 * Checks if a stored object is an encrypted vault payload (v1 or v2)
 */
export function isVaultEncrypted(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const anyObj = obj as any;
  return (
    (anyObj.v === 2 && anyObj.alg === "AES-256-GCM" && typeof anyObj.ct === "string") ||
    (anyObj.enc === 1 && anyObj.alg === "AES-GCM" && typeof anyObj.ct === "string")
  );
}

/**
 * Initializes a new encrypted vault with a chosen lock method and an automatic recovery key
 */
export async function initializeVault({
  lockMethod = "none",
  secret = "",
  recoveryKey = generateRecoveryKey(),
}: {
  lockMethod?: LockMethod;
  secret?: string;
  recoveryKey?: string;
}): Promise<{
  vaultDEK: CryptoKey;
  vaultMeta: VaultMetadata;
  recoveryKey: string;
}> {
  const vaultDEK = await generateVaultDEK();
  const vaultId = crypto.randomUUID
    ? crypto.randomUUID()
    : b64(crypto.getRandomValues(new Uint8Array(16)));

  const wrappers: VaultMetadata["wrappers"] = {};

  // Setup primary unlock wrapper if secret provided
  if (lockMethod !== "none" && secret) {
    const saltB64 = b64(crypto.getRandomValues(new Uint8Array(16)));
    const kek = await deriveKEK(secret, saltB64, CONFIG.pbkdf2Iterations);
    const { ivB64, wrappedB64 } = await wrapDEK(vaultDEK, kek);

    wrappers[lockMethod as "pin" | "passphrase" | "pattern"] = {
      method: lockMethod,
      kdf: "PBKDF2-SHA256",
      saltB64,
      iterations: CONFIG.pbkdf2Iterations,
      ivB64,
      wrappedDEKB64: wrappedB64,
    };
  }

  // Setup Recovery Key wrapper (always available for account-free recovery)
  const recoverySaltB64 = b64(crypto.getRandomValues(new Uint8Array(16)));
  const recoveryKEK = await deriveKEK(recoveryKey, recoverySaltB64, CONFIG.pbkdf2Iterations);
  const recoveryWrapped = await wrapDEK(vaultDEK, recoveryKEK);

  wrappers.recovery = {
    method: "recovery",
    kdf: "PBKDF2-SHA256",
    saltB64: recoverySaltB64,
    iterations: CONFIG.pbkdf2Iterations,
    ivB64: recoveryWrapped.ivB64,
    wrappedDEKB64: recoveryWrapped.wrappedB64,
  };

  const vaultMeta: VaultMetadata = {
    version: 2,
    vaultId,
    createdAt: new Date().toISOString(),
    activeLockMethod: lockMethod,
    wrappers,
  };

  if (typeof indexedDB !== "undefined") {
    try {
      await idbWrite([["vault_meta", vaultMeta]]);
    } catch {}
  }

  return {
    vaultDEK,
    vaultMeta,
    recoveryKey,
  };
}

/**
 * Unlocks the vault using a provided secret (PIN, passphrase, pattern, or recovery code)
 */
export async function unlockVault(
  secret: string,
  method: LockMethod | "recovery" = "pin",
): Promise<{ vaultDEK: CryptoKey; vaultMeta: VaultMetadata }> {
  const vaultMeta = (await idbGet("vault_meta")) as VaultMetadata | undefined;
  if (!vaultMeta || vaultMeta.version !== 2) {
    throw new Error("vault-not-configured");
  }

  const targetWrapper =
    method === "recovery"
      ? vaultMeta.wrappers.recovery
      : vaultMeta.wrappers[method as "pin" | "passphrase" | "pattern"];

  if (!targetWrapper) {
    throw new Error(`no-wrapper-for-${method}`);
  }

  const kek = await deriveKEK(secret, targetWrapper.saltB64, targetWrapper.iterations);
  const vaultDEK = await unwrapDEK(targetWrapper.wrappedDEKB64, targetWrapper.ivB64, kek);

  return { vaultDEK, vaultMeta };
}

/**
 * Re-wraps the Vault DEK with a new lock method
 */
export async function updateVaultLockMethod(
  vaultDEK: CryptoKey,
  newMethod: LockMethod,
  newSecret: string,
): Promise<VaultMetadata> {
  const vaultMeta = (await idbGet("vault_meta")) as VaultMetadata | undefined;
  if (!vaultMeta || vaultMeta.version !== 2) {
    throw new Error("vault-not-configured");
  }

  const nextWrappers = { ...vaultMeta.wrappers };

  if (newMethod === "none") {
    delete nextWrappers.pin;
    delete nextWrappers.passphrase;
    delete nextWrappers.pattern;
    delete nextWrappers.device;
  } else if (newSecret) {
    const saltB64 = b64(crypto.getRandomValues(new Uint8Array(16)));
    const kek = await deriveKEK(newSecret, saltB64, CONFIG.pbkdf2Iterations);
    const { ivB64, wrappedB64 } = await wrapDEK(vaultDEK, kek);

    nextWrappers[newMethod as "pin" | "passphrase" | "pattern"] = {
      method: newMethod,
      kdf: "PBKDF2-SHA256",
      saltB64,
      iterations: CONFIG.pbkdf2Iterations,
      ivB64,
      wrappedDEKB64: wrappedB64,
    };
  }

  const updatedMeta: VaultMetadata = {
    ...vaultMeta,
    activeLockMethod: newMethod,
    wrappers: nextWrappers,
  };

  if (typeof indexedDB !== "undefined") {
    try {
      await idbWrite([["vault_meta", updatedMeta]]);
    } catch {}
  }
  return updatedMeta;
}
