/**
 * Saheli 11.0 — Account-Free Installation Identity & Cryptographic Device Identity
 *
 * Architecture Principles:
 * 1. Zero mandatory signup: No phone number, email address, username, or cloud account.
 * 2. On first launch, generates a cryptographic installation identity and an 80-bit
 *    user-friendly Saheli Serial ID (SH-XXXX-XXXX-XXXX-XXXX) using Crockford Base32.
 * 3. Separate identity domains:
 *    - Installation ID (UUIDv4)
 *    - Saheli Serial ID (user-facing display with checksum)
 *    - Cryptographic Device Identity (ECDSA P-256 for device signatures)
 *    - Key Exchange Identity (ECDH P-256 for partner key encapsulation)
 * 4. The Serial ID NEVER acts as an encryption key, password, or bearer token.
 */

import { idbGet, idbWrite } from "./storage.js";

// Crockford Base32 alphabet (excludes I, L, O, U to prevent visual confusion)
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export interface DeviceKeyBundle {
  signingPublicKeyJwk: JsonWebKey;
  signingPrivateKey: CryptoKey;
  exchangePublicKeyJwk: JsonWebKey;
  exchangePrivateKey: CryptoKey;
}

export interface SaheliIdentity {
  version: 1;
  installationId: string;
  serialId: string;
  createdAt: string;
  signingPublicKeyJwk: JsonWebKey;
  exchangePublicKeyJwk: JsonWebKey;
}

/**
 * Calculates a Crockford Base32 modulo checksum
 */
function calculateChecksum(chars: string): string {
  let sum = 0;
  for (let i = 0; i < chars.length; i++) {
    const idx = CROCKFORD_ALPHABET.indexOf(chars[i]);
    if (idx !== -1) {
      sum = (sum * 32 + idx) % 37;
    }
  }
  return CROCKFORD_ALPHABET[sum % 32];
}

/**
 * Generates an unpredictable 80-bit user-friendly Saheli Serial ID:
 * Format: SH-XXXX-XXXX-XXXX-XXXX (16 Crockford characters + SH- prefix)
 * The final character is a mod-32 verification checksum.
 */
export function generateSaheliSerialId(): string {
  const bytes = new Uint8Array(10); // 80 bits of cryptographically secure entropy
  crypto.getRandomValues(bytes);

  let rawChars = "";
  // Convert 10 bytes (80 bits) into 15 5-bit chunks (75 bits used)
  let bitBuffer = 0;
  let bitCount = 0;

  for (let i = 0; i < bytes.length && rawChars.length < 15; i++) {
    bitBuffer = (bitBuffer << 8) | bytes[i];
    bitCount += 8;

    while (bitCount >= 5 && rawChars.length < 15) {
      const index = (bitBuffer >>> (bitCount - 5)) & 31;
      rawChars += CROCKFORD_ALPHABET[index];
      bitCount -= 5;
    }
  }

  // Append checksum character
  const checksum = calculateChecksum(rawChars);
  const full16 = rawChars + checksum;

  return `SH-${full16.slice(0, 4)}-${full16.slice(4, 8)}-${full16.slice(8, 12)}-${full16.slice(12, 16)}`;
}

/**
 * Validates a formatted Saheli Serial ID and its internal checksum
 */
export function validateSaheliSerialId(id: string): boolean {
  if (typeof id !== "string") return false;
  const cleaned = id
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");

  // Must begin with SH (or 18 chars total with SH, 16 chars body)
  if (!id.toUpperCase().startsWith("SH-")) return false;
  const body = cleaned.startsWith("SH") ? cleaned.slice(2) : cleaned;
  if (body.length !== 16) return false;

  for (const c of body) {
    if (!CROCKFORD_ALPHABET.includes(c)) return false;
  }

  const expectedChecksum = calculateChecksum(body.slice(0, 15));
  return body[15] === expectedChecksum;
}

/**
 * Generates the local device cryptographic keypairs:
 * 1. ECDSA P-256 for device identity signing
 * 2. ECDH P-256 for partner key exchange
 */
export async function generateDeviceKeys(): Promise<DeviceKeyBundle> {
  const signingPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true, // extractable for JWK export
    ["sign", "verify"],
  );

  const exchangePair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable for JWK export
    ["deriveKey", "deriveBits"],
  );

  const signingPublicKeyJwk = await crypto.subtle.exportKey("jwk", signingPair.publicKey);
  const exchangePublicKeyJwk = await crypto.subtle.exportKey("jwk", exchangePair.publicKey);

  return {
    signingPublicKeyJwk,
    signingPrivateKey: signingPair.privateKey,
    exchangePublicKeyJwk,
    exchangePrivateKey: exchangePair.privateKey,
    signingKey: { privateKey: signingPair.privateKey, publicKey: signingPair.publicKey },
    exchangeKey: { privateKey: exchangePair.privateKey, publicKey: exchangePair.publicKey },
  };
}

export async function exportPublicKeyJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

export async function computeKeyFingerprint(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  const jsonStr = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(jsonStr));
  return Array.from(new Uint8Array(hash).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Loads or initializes the installation identity
 */
export async function getOrCreateIdentity(): Promise<{
  identity: SaheliIdentity;
  signingPrivateKey?: CryptoKey;
  exchangePrivateKey?: CryptoKey;
}> {
  try {
    const existing = (await idbGet("identity")) as SaheliIdentity | undefined;
    if (existing && existing.serialId && existing.installationId) {
      // Identity exists, retrieve private keys
      const privKeys = (await idbGet("identity_keys")) as
        { signingPrivateKey: CryptoKey; exchangePrivateKey: CryptoKey } | undefined;

      return {
        identity: existing,
        signingPrivateKey: privKeys?.signingPrivateKey,
        exchangePrivateKey: privKeys?.exchangePrivateKey,
      };
    }
  } catch {
    // Falls through to create fresh identity
  }

  // Create fresh cryptographic identity
  const installationId = crypto.randomUUID
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

  const serialId = generateSaheliSerialId();
  const keys = await generateDeviceKeys();

  const identity: SaheliIdentity = {
    version: 1,
    installationId,
    serialId,
    createdAt: new Date().toISOString(),
    signingPublicKeyJwk: keys.signingPublicKeyJwk,
    exchangePublicKeyJwk: keys.exchangePublicKeyJwk,
  };

  await idbWrite([
    ["identity", identity],
    [
      "identity_keys",
      {
        signingPrivateKey: keys.signingPrivateKey,
        exchangePrivateKey: keys.exchangePrivateKey,
      },
    ],
  ]);

  return {
    identity,
    signingPrivateKey: keys.signingPrivateKey,
    exchangePrivateKey: keys.exchangePrivateKey,
  };
}
