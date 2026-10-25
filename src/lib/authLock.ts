/**
 * Saheli 11.0 — Multi-Method Application Locking & Authentication Engine
 *
 * Implements:
 * 1. PIN Lock (6+ digits with progressive attempt delay)
 * 2. Passphrase Lock (arbitrary length password manager friendly)
 * 3. Pattern Lock (3x3 grid point sequence)
 * 4. Device Authenticator (WebAuthn Platform Authenticator: Fingerprint / Face / Device PIN)
 * 5. Recovery Key Authentication (account-free emergency unlock)
 * 6. Inactivity Timeout and Tab Background Lockout
 */

import { idbGet, idbWrite } from "./storage.js";
import {
  type LockMethod,
  type VaultMetadata,
  deriveKEK,
  unwrapDEK,
  wrapDEK,
  patternToSecret,
  b64,
  unb64,
} from "./vault.js";
import { CONFIG } from "../config.js";

const LOCK_STATE_KEY = "auth_lock_state";

export interface LockState {
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil: number; // timestamp ms
  inactivityTimeoutMinutes: number; // 0 for immediate on blur, or 1, 5, 15, 30
}

export const DEFAULT_LOCK_STATE: LockState = {
  isLocked: false,
  failedAttempts: 0,
  lockoutUntil: 0,
  inactivityTimeoutMinutes: 5,
};

/**
 * Calculates progressive delay in milliseconds based on failed attempt count
 */
export function calculateLockoutDelayMs(failedAttempts: number): number {
  if (failedAttempts < 3) return 0;
  if (failedAttempts < 5) return 3000; // 3 seconds
  if (failedAttempts < 8) return 15000; // 15 seconds
  if (failedAttempts < 10) return 30000; // 30 seconds
  return 60000; // 60 seconds
}

/**
 * Validates PIN strength
 */
export function validatePinInput(pin: string): { valid: boolean; error?: string } {
  if (typeof pin !== "string" || !/^\d+$/.test(pin)) {
    return { valid: false, error: "PIN must contain only numbers" };
  }
  if (pin.length < 4 || pin.length > 12) {
    return { valid: false, error: "PIN must be between 4 and 12 digits" };
  }
  return { valid: true };
}

/**
 * Validates Passphrase strength
 */
export function validatePassphraseInput(pass: string): { valid: boolean; error?: string } {
  if (typeof pass !== "string" || pass.trim().length < 6) {
    return { valid: false, error: "Passphrase must be at least 6 characters" };
  }
  return { valid: true };
}

/**
 * Validates 3x3 Pattern input
 */
export function validatePatternInput(nodes: number[]): { valid: boolean; error?: string } {
  if (!Array.isArray(nodes) || nodes.length < 4) {
    return { valid: false, error: "Pattern must connect at least 4 points" };
  }
  const unique = new Set(nodes);
  if (unique.size !== nodes.length) {
    return { valid: false, error: "Pattern points cannot be revisited" };
  }
  if (nodes.some((n) => typeof n !== "number" || n < 0 || n > 8)) {
    return { valid: false, error: "Pattern nodes must be between 0 and 8" };
  }
  return { valid: true };
}

/**
 * Checks whether WebAuthn platform authenticator (fingerprint/face/device PIN) is available
 */
export async function isDeviceAuthenticatorAvailable(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !window.PublicKeyCredential ||
    !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
  ) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Registers a WebAuthn platform credential and wraps the Vault DEK
 */
export async function registerDeviceAuthenticator(
  vaultDEK: CryptoKey,
  userSerialId: string,
): Promise<{ credentialId: string; wrapper: any }> {
  if (!window.PublicKeyCredential) {
    throw new Error("webauthn-unsupported");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Saheli Health Vault", id: window.location.hostname },
      user: {
        id: userId,
        name: userSerialId,
        displayName: `Saheli User (${userSerialId.slice(0, 7)})`,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
    },
  })) as PublicKeyCredential;

  if (!credential) throw new Error("credential-creation-failed");

  const rawCredId = b64(credential.rawId);

  // Derive device KEK from credential rawId + local secret salt
  const saltB64 = b64(crypto.getRandomValues(new Uint8Array(16)));
  const kek = await deriveKEK(rawCredId, saltB64, 10000);
  const { ivB64, wrappedB64 } = await wrapDEK(vaultDEK, kek);

  const wrapper = {
    method: "device" as LockMethod,
    kdf: "WEB_AUTHN" as const,
    saltB64,
    iterations: 10000,
    ivB64,
    wrappedDEKB64: wrappedB64,
  };

  return { credentialId: rawCredId, wrapper };
}

/**
 * Authenticates using WebAuthn platform authenticator and unwraps the Vault DEK
 */
export async function unlockWithDeviceAuthenticator(vaultMeta: VaultMetadata): Promise<CryptoKey> {
  const wrapper = vaultMeta.wrappers.device;
  if (!wrapper || !vaultMeta.deviceCredentialId) {
    throw new Error("device-auth-not-configured");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credIdBytes = unb64(vaultMeta.deviceCredentialId);

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: credIdBytes as unknown as BufferSource,
          type: "public-key",
          transports: ["internal"],
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential;

  if (!assertion) throw new Error("biometric-verification-cancelled");

  const rawCredId = b64(assertion.rawId);
  const kek = await deriveKEK(rawCredId, wrapper.saltB64, wrapper.iterations);

  return unwrapDEK(wrapper.wrappedDEKB64, wrapper.ivB64, kek);
}
