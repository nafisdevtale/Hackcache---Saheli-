import { describe, it, expect } from "vitest";
import { generateDeviceKeys } from "@/lib/identity.ts";
import {
  DEFAULT_PARTNER_PERMISSIONS,
  deriveSnapshotSharingKey,
  computeVerificationCode,
  buildPartnerSnapshot,
  encryptPartnerSnapshot,
  decryptPartnerSnapshot,
  generateInvitationCode,
} from "@/lib/partner.ts";
import {
  handlePartnerInvite,
  handlePartnerPair,
  handlePartnerUploadSnapshot,
  handlePartnerGetSnapshot,
  handlePartnerRevoke,
} from "@/server/api/partner.ts";

describe("Saheli 11.0 — Partner E2EE Key Agreement & Verification", () => {
  it("generates 12-character alphanumeric pairing invitation code", () => {
    const code = generateInvitationCode();
    expect(code).toMatch(/^SAHELI-PAIR-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  it("derives matching Snapshot Sharing Keys (SSK) across Owner and Partner", async () => {
    const ownerKeys = await generateDeviceKeys();
    const partnerKeys = await generateDeviceKeys();
    const pairingContext = "test-session-123";

    // Owner derives SSK using Owner private exchange key + Partner public exchange key
    const ownerSSK = await deriveSnapshotSharingKey(
      ownerKeys.exchangeKey.privateKey,
      partnerKeys.exchangeKey.publicKey,
      pairingContext,
    );

    // Partner derives SSK using Partner private exchange key + Owner public exchange key
    const partnerSSK = await deriveSnapshotSharingKey(
      partnerKeys.exchangeKey.privateKey,
      ownerKeys.exchangeKey.publicKey,
      pairingContext,
    );

    expect(ownerSSK).toBeDefined();
    expect(partnerSSK).toBeDefined();

    // Verify both keys can encrypt and decrypt each other's data
    const testData = { greeting: "Hello Partner" };
    const encrypted = await encryptPartnerSnapshot(ownerSSK, testData);
    const decrypted = await decryptPartnerSnapshot(partnerSSK, encrypted);
    expect(decrypted).toEqual(testData);
  });

  it("computes matching 6-digit Short Authentication String (SAS) verification code", async () => {
    const ownerKeys = await generateDeviceKeys();
    const partnerKeys = await generateDeviceKeys();

    const sasOwner = await computeVerificationCode(
      ownerKeys.exchangeKey.publicKey,
      partnerKeys.exchangeKey.publicKey,
    );
    const sasPartner = await computeVerificationCode(
      ownerKeys.exchangeKey.publicKey,
      partnerKeys.exchangeKey.publicKey,
    );

    expect(sasOwner).toMatch(/^\d{6}$/);
    expect(sasOwner).toBe(sasPartner);
  });
});

describe("Saheli 11.0 — Field-Level Privacy Filtering & Snapshot Encryption", () => {
  const fullOwnerRecord = {
    settings: {
      ageGroup: "adult",
      showFertility: true,
      cycleLength: 28,
      periodLength: 5,
    },
    days: {
      "2026-10-01": { flow: "medium", symptoms: ["cramps"], note: "Super private diary note" },
      "2026-10-02": { flow: "heavy", note: "Another secret thought" },
    },
    aiConversations: [{ text: "Private AI chat" }],
  };

  it("strictly excludes private diary notes and AI chats from partner snapshot", () => {
    const permissions = { ...DEFAULT_PARTNER_PERMISSIONS };
    const snapshot = buildPartnerSnapshot(fullOwnerRecord, permissions);

    expect(snapshot.days["2026-10-01"]).toBeDefined();
    expect(snapshot.days["2026-10-01"].flow).toBe("medium");
    // Private notes must be undefined!
    expect(snapshot.days["2026-10-01"].note).toBeUndefined();
    expect(snapshot.days["2026-10-02"].note).toBeUndefined();
    // AI conversations must be undefined!
    expect((snapshot as any).aiConversations).toBeUndefined();
  });

  it("respects granular permission toggles", () => {
    const noCalendar = { ...DEFAULT_PARTNER_PERMISSIONS, shareCalendar: false };
    const snapshot = buildPartnerSnapshot(fullOwnerRecord, noCalendar);
    expect(Object.keys(snapshot.days).length).toBe(0);

    const noPeriodDates = { ...DEFAULT_PARTNER_PERMISSIONS, sharePeriodDates: false };
    const snapshot2 = buildPartnerSnapshot(fullOwnerRecord, noPeriodDates);
    expect(snapshot2.days["2026-10-01"].flow).toBeUndefined();
  });

  it("suppresses fertility window estimates for minors under 18 regardless of settings", () => {
    const minorRecord = {
      ...fullOwnerRecord,
      settings: { ...fullOwnerRecord.settings, ageGroup: "under18", showFertility: true },
    };
    const permissions = { ...DEFAULT_PARTNER_PERMISSIONS, sharePredictions: true };
    const snapshot = buildPartnerSnapshot(minorRecord, permissions);

    // Fertility estimations must NOT be included for minors
    expect((snapshot as any).fertilityWindow).toBeUndefined();
  });
});

describe("Saheli 11.0 — Relay API & Revocation Lifecycle", () => {
  it("creates invitation, pairs partner, uploads encrypted snapshot, fetches and revokes", async () => {
    // 1. Owner creates invite
    const inviteRes = await handlePartnerInvite(
      new Request("https://saheli.local/api/partner/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerInstallationId: "inst-owner-1",
          ownerPublicKey: { kty: "EC", crv: "P-256", x: "x1", y: "y1" },
          permissions: DEFAULT_PARTNER_PERMISSIONS,
        }),
      }),
    );
    const inviteData = await inviteRes.json();
    expect(inviteRes.status).toBe(200);
    expect(inviteData.invitationCode).toMatch(/^SAHELI-PAIR-/);
    const code = inviteData.invitationCode;

    // 2. Partner pairs using the invitation code
    const pairRes = await handlePartnerPair(
      new Request("https://saheli.local/api/partner/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationCode: code,
          partnerInstallationId: "inst-partner-2",
          partnerPublicKey: { kty: "EC", crv: "P-256", x: "x2", y: "y2" },
        }),
      }),
    );
    const pairData = await pairRes.json();
    expect(pairRes.status).toBe(200);
    expect(pairData.paired).toBe(true);
    expect(pairData.pairingId).toBeDefined();
    const pairingId = pairData.pairingId;

    // 3. Owner uploads encrypted snapshot ciphertext
    const uploadRes = await handlePartnerUploadSnapshot(
      new Request("https://saheli.local/api/partner/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairingId,
          ciphertextEnvelope: {
            v: 1,
            alg: "AES-GCM-256",
            iv: "mock-iv",
            ciphertext: "mock-encrypted-blob",
            timestamp: Date.now(),
          },
        }),
      }),
    );
    expect(uploadRes.status).toBe(200);

    // 4. Partner fetches latest encrypted snapshot
    const fetchRes = await handlePartnerGetSnapshot(
      new Request(
        `https://saheli.local/api/partner/snapshot?pairingId=${pairingId}&partnerInstallationId=inst-partner-2`,
      ),
    );
    const fetchData = await fetchRes.json();
    expect(fetchRes.status).toBe(200);
    expect(fetchData.ciphertextEnvelope.ciphertext).toBe("mock-encrypted-blob");

    // 5. Owner revokes partner sharing
    const revokeRes = await handlePartnerRevoke(
      new Request("https://saheli.local/api/partner/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingId }),
      }),
    );
    expect(revokeRes.status).toBe(200);

    // 6. After revocation, partner fetch returns 404
    const afterRevokeRes = await handlePartnerGetSnapshot(
      new Request(
        `https://saheli.local/api/partner/snapshot?pairingId=${pairingId}&partnerInstallationId=inst-partner-2`,
      ),
    );
    expect(afterRevokeRes.status).toBe(404);
  });
});

describe("Saheli 11.1 — Negative Tests & Third Unauthorized Device Defense", () => {
  it("guarantees commutative SAS calculation regardless of argument order", async () => {
    const devA = await generateDeviceKeys();
    const devB = await generateDeviceKeys();

    const sasAB = await computeVerificationCode(
      devA.exchangeKey.publicKey,
      devB.exchangeKey.publicKey,
    );
    const sasBA = await computeVerificationCode(
      devB.exchangeKey.publicKey,
      devA.exchangeKey.publicKey,
    );

    expect(sasAB).toBe(sasBA);
  });

  it("blocks a third unauthorized device from decrypting the owner's encrypted snapshot", async () => {
    const ownerKeys = await generateDeviceKeys();
    const authorizedPartnerKeys = await generateDeviceKeys();
    const attackerKeys = await generateDeviceKeys(); // Device C

    // Owner and authorized partner derive legitimate SSK
    const legitimateOwnerSSK = await deriveSnapshotSharingKey(
      ownerKeys.exchangeKey.privateKey,
      authorizedPartnerKeys.exchangeKey.publicKey,
    );
    const legitimatePartnerSSK = await deriveSnapshotSharingKey(
      authorizedPartnerKeys.exchangeKey.privateKey,
      ownerKeys.exchangeKey.publicKey,
    );

    // Attacker derives SSK against owner public key
    const attackerSSK = await deriveSnapshotSharingKey(
      attackerKeys.exchangeKey.privateKey,
      ownerKeys.exchangeKey.publicKey,
    );

    // Owner encrypts confidential snapshot
    const testPayload = { secretMedicalData: "Confidential cycle observation" };
    const encryptedEnvelope = await encryptPartnerSnapshot(legitimateOwnerSSK, testPayload);

    // Authorized partner can successfully decrypt
    const authorizedDecrypted = await decryptPartnerSnapshot(
      legitimatePartnerSSK,
      encryptedEnvelope,
    );
    expect(authorizedDecrypted).toEqual(testPayload);

    // Unauthorized third device attempting to decrypt MUST fail (AES-GCM authentication tag failure)
    await expect(decryptPartnerSnapshot(attackerSSK, encryptedEnvelope)).rejects.toThrow();
  });

  it("detects MITM public-key substitution via SAS code divergence", async () => {
    const ownerKeys = await generateDeviceKeys();
    const legitimatePartnerKeys = await generateDeviceKeys();
    const mitmAttackerKeys = await generateDeviceKeys();

    // Owner sees legitimate partner's key
    const ownerExpectedSAS = await computeVerificationCode(
      ownerKeys.exchangeKey.publicKey,
      legitimatePartnerKeys.exchangeKey.publicKey,
    );

    // If MITM substitutes attacker's key to partner
    const partnerTamperedSAS = await computeVerificationCode(
      mitmAttackerKeys.exchangeKey.publicKey,
      legitimatePartnerKeys.exchangeKey.publicKey,
    );

    // SAS codes differ, alerting users out-of-band to reject the pairing
    expect(ownerExpectedSAS).not.toBe(partnerTamperedSAS);
  });

  it("rejects unauthorized third device pairing with invalid or non-existent code", async () => {
    const res = await handlePartnerPair(
      new Request("https://saheli.local/api/partner/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationCode: "SAHELI-PAIR-FAKE-CODE",
          partnerInstallationId: "inst-attacker-3",
          partnerPublicKey: { kty: "EC", crv: "P-256", x: "x3", y: "y3" },
        }),
      }),
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("invalid-or-expired-invitation");
  });

  it("rejects tampered ciphertext envelopes with authentication failure", async () => {
    const ownerKeys = await generateDeviceKeys();
    const partnerKeys = await generateDeviceKeys();
    const ssk = await deriveSnapshotSharingKey(
      ownerKeys.exchangeKey.privateKey,
      partnerKeys.exchangeKey.publicKey,
    );

    const testPayload = { valid: true };
    const envelope = await encryptPartnerSnapshot(ssk, testPayload);

    // Tamper with ciphertext by flipping characters in Base64
    const tamperedCt =
      envelope.ct.slice(0, -4) + (envelope.ct.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
    const tamperedEnvelope = { ...envelope, ct: tamperedCt };

    await expect(decryptPartnerSnapshot(ssk, tamperedEnvelope)).rejects.toThrow();
  });
});
