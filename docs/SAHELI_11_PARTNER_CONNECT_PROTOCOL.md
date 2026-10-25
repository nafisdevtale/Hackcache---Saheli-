# Saheli 11.0 — Partner Connect Protocol Specification

## 1. Protocol Overview

Saheli Partner Connect is an **optional, read-only, end-to-end encrypted sharing protocol** allowing cycle owners to share designated cycle metrics with a partner's device without granting access to personal diary notes or master credentials.

---

## 2. Four-Phase Handshake

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Cycle Owner (Device A)
    participant Relay as Ephemeral Relay (/api/partner/*)
    actor Partner as Remote Partner (Device B)

    Note over Owner, Partner: Phase 1: Ephemeral Pairing Invitation
    Owner->>Relay: POST /api/partner/invite (OwnerPubExchangeKey, Permissions)
    Relay-->>Owner: 200 OK (SAHELI-PAIR-XXXX-XXXX, Expires in 15m)

    Note over Owner, Partner: Phase 2: Key Agreement & Out-of-Band SAS Verification
    Owner-->>Partner: Out-of-band Pairing Code (SAHELI-PAIR-XXXX-XXXX)
    Partner->>Relay: POST /api/partner/pair (PairingCode, PartnerPubExchangeKey)
    Relay-->>Partner: 200 OK (OwnerPubExchangeKey, Permissions)

    Note over Owner, Partner: Both devices compute ECDH + HKDF -> SSK
    Note over Owner, Partner: Both devices compute 6-Digit SAS Code (e.g. 482910)
    Owner-->>Partner: Compare 6-digit code verbally/in-person (MitM prevention)

    Note over Owner, Partner: Phase 3: Encrypted Snapshot Sync
    Owner->>Relay: POST /api/partner/snapshot (CiphertextEnvelope)
    Partner->>Relay: GET /api/partner/snapshot (PairingID)
    Relay-->>Partner: 200 OK (CiphertextEnvelope)
    Note over Partner: Partner decrypts with SSK -> Reads cycle summary

    Note over Owner, Partner: Phase 4: Revocation
    Owner->>Relay: POST /api/partner/revoke (PairingID)
    Relay-->>Owner: 200 OK (Purged)
    Partner->>Relay: GET /api/partner/snapshot (PairingID)
    Relay-->>Partner: 404 Not Found
```

---

## 3. Endpoints Specification

1. `POST /api/partner/invite`:
   - Request: `{ ownerSerialId, ownerExchangePubKey, permissions }`
   - Response: `{ success: true, invitationCode }` (TTL: 15 minutes).
2. `POST /api/partner/pair`:
   - Request: `{ invitationCode, partnerDeviceId, partnerExchangePubKey }`
   - Response: `{ success: true, ownerSerialId, ownerExchangePubKey, permissions }`.
3. `POST /api/partner/snapshot`:
   - Request: `{ ownerSerialId, envelope: { v, alg, iv, ct, ts, permissionsDigest } }`
   - Response: `{ success: true, snapshotId, ts }`.
4. `GET /api/partner/snapshot`:
   - Query: `?ownerSerialId=...` or `?pairingId=...`
   - Response: `{ success: true, envelope: { v, alg, iv, ct, ts } }`.
5. `POST /api/partner/revoke`:
   - Request: `{ ownerSerialId }` or `{ pairingId }`
   - Response: `{ success: true, revoked: true }`.
