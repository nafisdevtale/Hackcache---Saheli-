/**
 * Saheli 11.0 — Partner Connect Cryptographic Protocol & E2EE Sharing Engine
 *
 * Security & Privacy Architecture:
 * 1. Strict Owner Authority: Sharing is 100% optional, disabled by default.
 * 2. Asymmetric Pairing: Key exchange using ECDH P-256 + HKDF-SHA256.
 * 3. Out-of-band Verification: 6-digit Short Authentication String (SAS) prevents MITM attacks.
 * 4. Field-Level Consent: Filtered client-side before encryption. Highly sensitive notes
 *    and private diary logs are excluded by default.
 * 5. Zero-Knowledge Remote Relay: Server stores only ciphertext. No plaintext data or master
 *    keys ever leave the owner's device.
 * 6. Offline Resilient: Reliable outbox queue with automatic retry on reconnection.
 */

import { idbGet, idbWrite } from "./storage.js";
import { b64, unb64 } from "./vault.js";

const enc = new TextEncoder();
const dec = new TextDecoder();

export interface PartnerPermissions {
  calendar: boolean;
  periodDates: boolean;
  cycleHistory: boolean;
  periodEstimates: boolean;
  cycleEducation: boolean;
  wellnessUpdates: boolean;
  symptoms: boolean; // default false
  diaryNotes: boolean; // strictly false by default
  fertilityOvulation: boolean; // default false, disabled for under 18
}

export const DEFAULT_PARTNER_PERMISSIONS: PartnerPermissions = {
  calendar: true,
  periodDates: true,
  cycleHistory: true,
  periodEstimates: true,
  cycleEducation: true,
  wellnessUpdates: true,
  symptoms: false,
  diaryNotes: false,
  fertilityOvulation: false,
};

export interface PartnerPairingState {
  enabled: boolean;
  status: "idle" | "inviting" | "paired" | "revoked";
  partnerName: string;
  partnerDeviceId?: string;
  sharedKeyB64?: string; // HKDF-derived SSK (base64)
  verificationCode?: string; // 6-digit SAS
  permissions: PartnerPermissions;
  lastSyncedAt?: string;
  invitationCode?: string;
  invitationExpiresAt?: string;
}

export interface PartnerSnapshotPayload {
  version: 1;
  snapshotId: string;
  ownerSerialId: string;
  timestamp: string;
  permissions: PartnerPermissions;
  data: {
    calendar?: Record<string, { period?: boolean; flow?: string }>;
    cycleStats?: { median: number; avgPeriod: number; totalCycles: number };
    prediction?: { nextDate: string; confidence: string };
    education?: { currentPhase: string; phaseDescription: string };
    wellness?: { recentSleep?: number; recentWater?: number; moodSummary?: string };
    symptoms?: string[]; // only if permitted
  };
}

export interface EncryptedPartnerEnvelope {
  v: 1;
  alg: "AES-256-GCM";
  snapshotId: string;
  ownerSerialId: string;
  iv: string;
  ct: string;
  ts: string;
  permissionsDigest: string;
}

/**
 * Computes a 6-digit Short Authentication String (SAS) from two public keys
 */
export async function computeVerificationCode(
  pubKeyJwk1: JsonWebKey,
  pubKeyJwk2: JsonWebKey,
): Promise<string> {
  const combined = JSON.stringify(pubKeyJwk1) + JSON.stringify(pubKeyJwk2);
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(combined));
  const bytes = new Uint8Array(hash);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1000000).padStart(6, "0");
}

/**
 * Derives a 256-bit Snapshot Sharing Key (SSK) using ECDH and HKDF-SHA256
 */
export async function deriveSnapshotSharingKey(
  localPrivateKey: CryptoKey,
  remotePublicKey: CryptoKey | JsonWebKey,
  _context?: string,
): Promise<CryptoKey> {
  const remoteKey =
    remotePublicKey instanceof CryptoKey || (remotePublicKey as any).algorithm
      ? (remotePublicKey as CryptoKey)
      : await crypto.subtle.importKey(
          "jwk",
          remotePublicKey as JsonWebKey,
          { name: "ECDH", namedCurve: "P-256" },
          false,
          [],
        );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: remoteKey },
    localPrivateKey,
    256,
  );

  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, { name: "HKDF" }, false, [
    "deriveKey",
  ]);

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode("SAHELI_PARTNER_SALT_V1"),
      info: enc.encode("SAHELI_PARTNER_CONNECT_KEY"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    true, // extractable to persist in partner state
    ["encrypt", "decrypt"],
  );
}

/**
 * Filters the owner's diary record strictly according to approved permissions.
 * Never leaks private notes, AI chats, or unapproved symptoms.
 */
export function buildPartnerSnapshot(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
): PartnerSnapshotPayload {
  let record: any;
  let permissions: PartnerPermissions;
  let ownerSerialId: string = "";
  let analysis: any;

  if (arg1 && typeof arg1 === "object" && "record" in arg1 && "permissions" in arg1) {
    record = arg1.record;
    permissions = arg1.permissions;
    ownerSerialId = arg1.ownerSerialId || "";
    analysis = arg1.analysis;
  } else {
    record = arg1;
    permissions = arg2 || DEFAULT_PARTNER_PERMISSIONS;
    ownerSerialId = arg3 || "";
    analysis = arg4;
  }

  const canCalendar =
    (permissions as any).shareCalendar !== undefined
      ? Boolean((permissions as any).shareCalendar)
      : Boolean(permissions.calendar);
  const canPeriodDates =
    (permissions as any).sharePeriodDates !== undefined
      ? Boolean((permissions as any).sharePeriodDates)
      : Boolean(permissions.periodDates);
  const canSymptoms =
    (permissions as any).shareSymptoms !== undefined
      ? Boolean((permissions as any).shareSymptoms)
      : Boolean(permissions.symptoms);
  const canWellness =
    (permissions as any).shareWellness !== undefined
      ? Boolean((permissions as any).shareWellness)
      : Boolean(permissions.wellnessUpdates);

  const filteredDays: Record<string, any> = {};

  if (canCalendar) {
    const rawDays = record?.days || {};
    for (const [dateStr, dayData] of Object.entries(rawDays) as [string, any][]) {
      if (!dayData) continue;
      const dayObj: any = { logged: true };
      if (canPeriodDates && (dayData.period || dayData.flow)) {
        dayObj.period = true;
        dayObj.flow = dayData.flow || "medium";
      }
      if (canSymptoms && Array.isArray(dayData.symptoms)) {
        dayObj.symptoms = dayData.symptoms;
      }
      if (canWellness) {
        if (dayData.sleep) dayObj.sleep = dayData.sleep;
        if (dayData.water) dayObj.water = dayData.water;
      }
      // Note: dayData.notes/note and AI chats are NEVER attached to partner snapshots
      if (Object.keys(dayObj).length > 0) {
        filteredDays[dateStr] = dayObj;
      }
    }
  }

  const snapshotData: PartnerSnapshotPayload["data"] = {
    calendar: filteredDays,
  };

  if (permissions.cycleHistory && analysis?.stats) {
    snapshotData.cycleStats = {
      median: analysis.stats.median || 28,
      avgPeriod: Math.round(analysis.stats.avgPeriod || 5),
      totalCycles: analysis.stats.cycleCount || 0,
    };
  }

  if (permissions.periodEstimates && analysis?.prediction) {
    snapshotData.prediction = {
      nextDate: analysis.prediction.expectedStart || "",
      confidence: analysis.prediction.confidence || "normal",
    };
  }

  if (permissions.cycleEducation && analysis?.phase) {
    snapshotData.education = {
      currentPhase: analysis.phase,
      phaseDescription: analysis.phaseName || "Active Cycle Phase",
    };
  }

  const result: any = {
    version: 1,
    snapshotId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ownerSerialId,
    timestamp: new Date().toISOString(),
    permissions,
    data: snapshotData,
    days: filteredDays,
  };

  return result;
}

/**
 * Encrypts a filtered snapshot using the Snapshot Sharing Key (SSK)
 */
export async function encryptPartnerSnapshot(
  arg1: any,
  arg2: any,
): Promise<EncryptedPartnerEnvelope> {
  const ssk: CryptoKey = arg1 instanceof CryptoKey || arg1.algorithm ? arg1 : arg2;
  const snapshot: any = ssk === arg1 ? arg2 : arg1;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payloadBytes = enc.encode(JSON.stringify(snapshot));

  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, ssk, payloadBytes);

  return {
    v: 1,
    alg: "AES-256-GCM",
    snapshotId: snapshot.snapshotId || `snap-${Date.now()}`,
    ownerSerialId: snapshot.ownerSerialId || "",
    iv: b64(iv),
    ct: b64(ct),
    ts: snapshot.timestamp || new Date().toISOString(),
    permissionsDigest: b64(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          enc.encode(JSON.stringify(snapshot.permissions || {})),
        ),
      ),
    ),
  };
}

/**
 * Decrypts a received partner snapshot envelope using the Snapshot Sharing Key (SSK)
 */
export async function decryptPartnerSnapshot(
  arg1: any,
  arg2: any,
): Promise<PartnerSnapshotPayload> {
  const ssk: CryptoKey = arg1 instanceof CryptoKey || arg1.algorithm ? arg1 : arg2;
  const envelope: any = ssk === arg1 ? arg2 : arg1;

  if (!envelope || envelope.v !== 1 || envelope.alg !== "AES-256-GCM") {
    throw new Error("unsupported-snapshot-envelope");
  }

  const iv = unb64(envelope.iv);
  const ct = unb64(envelope.ct);

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    ssk,
    ct as unknown as BufferSource,
  );

  return JSON.parse(dec.decode(decryptedBytes));
}

/**
 * Generates an alphanumeric pairing invitation code
 */
export function generateInvitationCode(): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
  return `SAHELI-PAIR-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}
