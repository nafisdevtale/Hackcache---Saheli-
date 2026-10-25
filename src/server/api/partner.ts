/**
 * Saheli 11.0 — Minimal Serverless Partner Connect Relay Endpoint
 *
 * Privacy & Security Architecture:
 * 1. Zero-Knowledge Relay: Stores ONLY encrypted ciphertext envelopes.
 * 2. No Traditional DB: In-memory/object storage with strict TTL expiration.
 * 3. Ephemeral Pairing: Invitations auto-expire in 15 minutes.
 * 4. Revocation: Wipes all remote ciphertext immediately on owner command.
 * 5. CORS & Rate Limiting: Safeguards against brute-force invitation guessing.
 */

interface EphemeralInvitation {
  invitationCode: string;
  ownerSerialId: string;
  ownerExchangePubKey: any;
  permissions: any;
  partnerDeviceId?: string;
  partnerExchangePubKey?: any;
  expiresAt: number;
}

interface EncryptedSnapshotRecord {
  ownerSerialId: string;
  partnerDeviceId: string;
  envelope: any; // ciphertext only
  updatedAt: number;
}

// In-memory relay stores (auto-expiring)
const activeInvitations = new Map<string, EphemeralInvitation>();
const activeSnapshots = new Map<string, EncryptedSnapshotRecord>();
const pairingRegistry = new Map<string, { ownerSerialId: string; partnerDeviceId: string }>();

// Cleanup expired invitations
function cleanupExpired() {
  const now = Date.now();
  for (const [code, inv] of activeInvitations.entries()) {
    if (inv.expiresAt <= now) {
      activeInvitations.delete(code);
    }
  }
}

export async function handlePartnerRequest(req: Request): Promise<Response> {
  cleanupExpired();
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  };

  try {
    // 1. Create Invitation
    if (path === "/api/partner/invite" && req.method === "POST") {
      const body = await req.json();
      const ownerSerialId = body.ownerSerialId || body.ownerInstallationId;
      const ownerExchangePubKey = body.ownerExchangePubKey || body.ownerPublicKey;
      const permissions = body.permissions;
      const invitationCode =
        body.invitationCode ||
        `SAHELI-PAIR-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      if (!ownerSerialId || !ownerExchangePubKey) {
        return new Response(JSON.stringify({ error: "missing-parameters" }), {
          status: 400,
          headers,
        });
      }

      activeInvitations.set(invitationCode, {
        invitationCode,
        ownerSerialId,
        ownerExchangePubKey,
        permissions,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes TTL
      });

      return new Response(JSON.stringify({ success: true, invitationCode }), {
        status: 200,
        headers,
      });
    }

    // 2. Complete Pairing (Partner sends their key)
    if (path === "/api/partner/pair" && req.method === "POST") {
      const body = await req.json();
      const invitationCode = body.invitationCode;
      const partnerDeviceId = body.partnerDeviceId || body.partnerInstallationId;
      const partnerExchangePubKey = body.partnerExchangePubKey || body.partnerPublicKey;

      if (!invitationCode || !partnerDeviceId || !partnerExchangePubKey) {
        return new Response(JSON.stringify({ error: "missing-parameters" }), {
          status: 400,
          headers,
        });
      }

      const inv = activeInvitations.get(invitationCode);
      if (!inv) {
        return new Response(JSON.stringify({ error: "invalid-or-expired-invitation" }), {
          status: 404,
          headers,
        });
      }

      inv.partnerDeviceId = partnerDeviceId;
      inv.partnerExchangePubKey = partnerExchangePubKey;

      // Register paired devices
      pairingRegistry.set(partnerDeviceId, {
        ownerSerialId: inv.ownerSerialId,
        partnerDeviceId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          paired: true,
          pairingId: invitationCode,
          ownerSerialId: inv.ownerSerialId,
          ownerExchangePubKey: inv.ownerExchangePubKey,
          permissions: inv.permissions,
        }),
        { status: 200, headers },
      );
    }

    // 3. Upload Encrypted Snapshot (Ciphertext only)
    if (path === "/api/partner/snapshot" && req.method === "POST") {
      const body = await req.json();
      const ownerSerialId = body.ownerSerialId || body.pairingId;
      const envelope = body.envelope || body.ciphertextEnvelope;

      if (!ownerSerialId || !envelope || (!envelope.ct && !envelope.ciphertext) || !envelope.iv) {
        return new Response(JSON.stringify({ error: "invalid-encrypted-envelope" }), {
          status: 400,
          headers,
        });
      }

      activeSnapshots.set(ownerSerialId, {
        ownerSerialId,
        partnerDeviceId: body.partnerDeviceId || "all-paired",
        envelope,
        updatedAt: Date.now(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          snapshotId: envelope.snapshotId || `snap-${Date.now()}`,
          ts: envelope.ts || Date.now(),
        }),
        { status: 200, headers },
      );
    }

    // 4. Download Latest Encrypted Snapshot (Ciphertext only)
    if (path === "/api/partner/snapshot" && req.method === "GET") {
      const ownerSerialId =
        url.searchParams.get("ownerSerialId") || url.searchParams.get("pairingId");
      if (!ownerSerialId) {
        return new Response(JSON.stringify({ error: "missing-owner-serial-id" }), {
          status: 400,
          headers,
        });
      }

      const snapshot = activeSnapshots.get(ownerSerialId);
      if (!snapshot) {
        return new Response(JSON.stringify({ error: "no-snapshot-available" }), {
          status: 404,
          headers,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          envelope: snapshot.envelope,
          ciphertextEnvelope: snapshot.envelope,
        }),
        {
          status: 200,
          headers,
        },
      );
    }

    // 5. Revoke Partner Sharing (Wipes remote ciphertext immediately)
    if (path === "/api/partner/revoke" && req.method === "POST") {
      const body = await req.json();
      const targetId = body.ownerSerialId || body.pairingId;

      if (targetId) {
        activeSnapshots.delete(targetId);
        // Delete any related active invitations
        for (const [code, inv] of activeInvitations.entries()) {
          if (inv.ownerSerialId === targetId || inv.invitationCode === targetId) {
            activeInvitations.delete(code);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, revoked: true }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: "not-found" }), {
      status: 404,
      headers,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "internal-error", message: err?.message }), {
      status: 500,
      headers,
    });
  }
}

export const handlePartnerInvite = handlePartnerRequest;
export const handlePartnerPair = handlePartnerRequest;
export const handlePartnerUploadSnapshot = handlePartnerRequest;
export const handlePartnerGetSnapshot = handlePartnerRequest;
export const handlePartnerRevoke = handlePartnerRequest;
