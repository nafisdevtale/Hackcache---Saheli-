/**
 * Saheli 11.0 — Partner Connect Client & Offline Outbox Engine
 *
 * Provides:
 * 1. Owner-side invitation generation, SAS verification calculation, and auto-sync outbox.
 * 2. Partner-side pairing join, snapshot decryption, and offline caching.
 * 3. Air-gapped manual encrypted snapshot export/import (.sahelipartner JSON).
 * 4. Automatic reconnection flushing.
 */

import { idbGet, idbWrite } from "./storage.js";
import { getOrCreateIdentity } from "./identity.js";
import {
  type PartnerPermissions,
  type PartnerPairingState,
  type PartnerSnapshotPayload,
  type EncryptedPartnerEnvelope,
  DEFAULT_PARTNER_PERMISSIONS,
  generateInvitationCode,
  computeVerificationCode,
  deriveSnapshotSharingKey,
  buildPartnerSnapshot,
  encryptPartnerSnapshot,
  decryptPartnerSnapshot,
} from "./partner.js";
import { b64, unb64 } from "./vault.js";

const PARTNER_STATE_KEY = "partner_state";
const PARTNER_OUTBOX_KEY = "partner_outbox";
const PARTNER_CACHE_KEY = "partner_cache";

/**
 * Loads current partner pairing state
 */
export async function loadPartnerState(): Promise<PartnerPairingState> {
  const state = (await idbGet(PARTNER_STATE_KEY)) as PartnerPairingState | undefined;
  return (
    state || {
      enabled: false,
      status: "idle",
      partnerName: "Partner",
      permissions: { ...DEFAULT_PARTNER_PERMISSIONS },
    }
  );
}

/**
 * Saves partner pairing state
 */
export async function savePartnerState(state: PartnerPairingState): Promise<void> {
  await idbWrite([[PARTNER_STATE_KEY, state]]);
}

/**
 * Owner initiates Partner Connect invitation
 */
export async function createPartnerInvitation(
  permissions: PartnerPermissions = DEFAULT_PARTNER_PERMISSIONS,
  partnerName: string = "Partner",
): Promise<{
  invitationCode: string;
  expiresAt: string;
}> {
  const { identity, exchangePrivateKey } = await getOrCreateIdentity();
  if (!exchangePrivateKey) throw new Error("identity-keys-missing");

  const invitationCode = generateInvitationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Register with ephemeral relay
  try {
    await fetch("/api/partner/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitationCode,
        ownerSerialId: identity.serialId,
        ownerExchangePubKey: identity.exchangePublicKeyJwk,
        permissions,
      }),
    });
  } catch (e) {
    console.warn("Relay invitation warning (offline pairing available via manual export):", e);
  }

  const state: PartnerPairingState = {
    enabled: true,
    status: "inviting",
    partnerName,
    permissions,
    invitationCode,
    invitationExpiresAt: expiresAt,
  };

  await savePartnerState(state);

  return { invitationCode, expiresAt };
}

/**
 * Partner joins using an invitation code
 */
export async function joinAsPartner(invitationCode: string): Promise<{
  ownerSerialId: string;
  verificationCode: string;
  permissions: PartnerPermissions;
}> {
  const { identity, exchangePrivateKey } = await getOrCreateIdentity();
  if (!exchangePrivateKey) throw new Error("identity-keys-missing");

  const res = await fetch("/api/partner/pair", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitationCode,
      partnerDeviceId: identity.installationId,
      partnerExchangePubKey: identity.exchangePublicKeyJwk,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "pairing-failed");
  }

  const { ownerSerialId, ownerExchangePubKey, permissions } = await res.json();

  // Derive Shared SSK via ECDH + HKDF
  const ssk = await deriveSnapshotSharingKey(exchangePrivateKey, ownerExchangePubKey);
  const exportedSSK = await crypto.subtle.exportKey("raw", ssk);

  // Compute 6-digit out-of-band Short Authentication String (SAS)
  const verificationCode = await computeVerificationCode(
    ownerExchangePubKey,
    identity.exchangePublicKeyJwk,
  );

  const state: PartnerPairingState = {
    enabled: true,
    status: "paired",
    partnerName: "Cycle Owner",
    partnerDeviceId: ownerSerialId,
    sharedKeyB64: b64(exportedSSK),
    verificationCode,
    permissions,
    lastSyncedAt: new Date().toISOString(),
  };

  await savePartnerState(state);

  return {
    ownerSerialId,
    verificationCode,
    permissions,
  };
}

/**
 * Owner confirms pairing after verifying the 6-digit SAS code
 */
export async function confirmOwnerPairing(
  partnerExchangePubKeyJwk: JsonWebKey,
  partnerDeviceId: string,
): Promise<{ verificationCode: string }> {
  const { identity, exchangePrivateKey } = await getOrCreateIdentity();
  if (!exchangePrivateKey) throw new Error("identity-keys-missing");

  const ssk = await deriveSnapshotSharingKey(exchangePrivateKey, partnerExchangePubKeyJwk);
  const exportedSSK = await crypto.subtle.exportKey("raw", ssk);

  const verificationCode = await computeVerificationCode(
    identity.exchangePublicKeyJwk,
    partnerExchangePubKeyJwk,
  );

  const current = await loadPartnerState();
  const nextState: PartnerPairingState = {
    ...current,
    status: "paired",
    partnerDeviceId,
    sharedKeyB64: b64(exportedSSK),
    verificationCode,
  };

  await savePartnerState(nextState);
  return { verificationCode };
}

/**
 * Owner creates and queues an encrypted snapshot update.
 * Tries remote upload; if offline, enqueues in outbox.
 */
export async function syncOwnerSnapshot({
  record,
  analysis,
}: {
  record: any;
  analysis?: any;
}): Promise<{ synced: boolean; queued: boolean }> {
  const state = await loadPartnerState();
  if (!state.enabled || state.status !== "paired" || !state.sharedKeyB64) {
    return { synced: false, queued: false };
  }

  const { identity } = await getOrCreateIdentity();
  const rawKey = unb64(state.sharedKeyB64);
  const ssk = await crypto.subtle.importKey(
    "raw",
    rawKey as unknown as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const snapshot = buildPartnerSnapshot({
    record,
    permissions: state.permissions,
    ownerSerialId: identity.serialId,
    analysis,
  });

  const envelope = await encryptPartnerSnapshot(snapshot, ssk);

  // Attempt upload to relay
  let uploaded = false;
  try {
    const res = await fetch("/api/partner/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerSerialId: identity.serialId,
        partnerDeviceId: state.partnerDeviceId,
        envelope,
      }),
    });
    if (res.ok) {
      uploaded = true;
      state.lastSyncedAt = envelope.ts;
      await savePartnerState(state);
    }
  } catch {
    uploaded = false;
  }

  if (!uploaded) {
    // Queue in offline outbox for automatic retry on reconnect
    await idbWrite([[PARTNER_OUTBOX_KEY, envelope]]);
    return { synced: false, queued: true };
  }

  // Clear outbox if successful
  await idbWrite([], [PARTNER_OUTBOX_KEY]);
  return { synced: true, queued: false };
}

/**
 * Flushes pending outbox uploads when connectivity returns
 */
export async function flushPartnerOutbox(): Promise<boolean> {
  const pendingEnvelope = (await idbGet(PARTNER_OUTBOX_KEY)) as
    EncryptedPartnerEnvelope | undefined;

  if (!pendingEnvelope) return false;
  const state = await loadPartnerState();
  if (!state.enabled || !state.sharedKeyB64) return false;

  const { identity } = await getOrCreateIdentity();

  try {
    const res = await fetch("/api/partner/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerSerialId: identity.serialId,
        partnerDeviceId: state.partnerDeviceId,
        envelope: pendingEnvelope,
      }),
    });

    if (res.ok) {
      await idbWrite([], [PARTNER_OUTBOX_KEY]);
      state.lastSyncedAt = pendingEnvelope.ts;
      await savePartnerState(state);
      return true;
    }
  } catch {
    // Still offline, will retry later
  }
  return false;
}

/**
 * Partner fetches and decrypts the latest snapshot
 */
export async function fetchPartnerSnapshot(): Promise<{
  snapshot: PartnerSnapshotPayload | null;
  fromCache: boolean;
  lastSyncedAt: string;
  isStale: boolean;
}> {
  const state = await loadPartnerState();
  if (!state.enabled || !state.sharedKeyB64 || !state.partnerDeviceId) {
    throw new Error("partner-not-paired");
  }

  const rawKey = unb64(state.sharedKeyB64);
  const ssk = await crypto.subtle.importKey(
    "raw",
    rawKey as unknown as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  let envelope: EncryptedPartnerEnvelope | null = null;

  try {
    const res = await fetch(
      `/api/partner/snapshot?ownerSerialId=${encodeURIComponent(state.partnerDeviceId)}`,
    );
    if (res.ok) {
      const data = await res.json();
      envelope = data.envelope;
    }
  } catch {
    // Network offline, fall back to cached snapshot
  }

  if (envelope) {
    const decrypted = await decryptPartnerSnapshot(envelope, ssk);
    // Cache decrypted snapshot locally for offline viewing
    await idbWrite([[PARTNER_CACHE_KEY, { snapshot: decrypted, envelope }]]);
    state.lastSyncedAt = envelope.ts;
    await savePartnerState(state);
    return {
      snapshot: decrypted,
      fromCache: false,
      lastSyncedAt: envelope.ts,
      isStale: false,
    };
  }

  // Load from offline cache
  const cached = (await idbGet(PARTNER_CACHE_KEY)) as
    { snapshot: PartnerSnapshotPayload; envelope: EncryptedPartnerEnvelope } | undefined;

  if (cached && cached.snapshot) {
    return {
      snapshot: cached.snapshot,
      fromCache: true,
      lastSyncedAt: cached.snapshot.timestamp,
      isStale: true,
    };
  }

  return {
    snapshot: null,
    fromCache: false,
    lastSyncedAt: "",
    isStale: true,
  };
}

/**
 * Revokes partner sharing completely
 */
export async function revokePartnerSharing(): Promise<void> {
  const { identity } = await getOrCreateIdentity();

  try {
    await fetch("/api/partner/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerSerialId: identity.serialId }),
    });
  } catch {
    // Best effort remote wipe
  }

  // Wipe local partner state, outbox, and cache
  await idbWrite([], [PARTNER_STATE_KEY, PARTNER_OUTBOX_KEY, PARTNER_CACHE_KEY]);
}

/**
 * Air-Gapped / Manual Offline Export
 * Generates an encrypted snapshot JSON string that can be shared manually (e.g. via local file/AirDrop)
 */
export async function exportManualEncryptedSnapshot(
  record: any,
  permissions: PartnerPermissions,
  analysis?: any,
): Promise<string> {
  const state = await loadPartnerState();
  if (!state.sharedKeyB64) throw new Error("partner-not-paired");

  const { identity } = await getOrCreateIdentity();
  const rawKey = unb64(state.sharedKeyB64);
  const ssk = await crypto.subtle.importKey(
    "raw",
    rawKey as unknown as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const snapshot = buildPartnerSnapshot({
    record,
    permissions,
    ownerSerialId: identity.serialId,
    analysis,
  });

  const envelope = await encryptPartnerSnapshot(snapshot, ssk);
  return JSON.stringify({ saheliPartnerExport: 1, envelope }, null, 2);
}

/**
 * Air-Gapped / Manual Offline Import
 * Decrypts a manually imported .sahelipartner JSON file
 */
export async function importManualEncryptedSnapshot(
  jsonStr: string,
): Promise<PartnerSnapshotPayload> {
  const state = await loadPartnerState();
  if (!state.sharedKeyB64) throw new Error("partner-not-paired");

  const parsed = JSON.parse(jsonStr);
  if (!parsed.saheliPartnerExport || !parsed.envelope) {
    throw new Error("invalid-partner-export-file");
  }

  const rawKey = unb64(state.sharedKeyB64);
  const ssk = await crypto.subtle.importKey(
    "raw",
    rawKey as unknown as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  const decrypted = await decryptPartnerSnapshot(parsed.envelope, ssk);
  await idbWrite([[PARTNER_CACHE_KEY, { snapshot: decrypted, envelope: parsed.envelope }]]);
  return decrypted;
}
