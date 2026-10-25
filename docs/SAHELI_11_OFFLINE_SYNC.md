# Saheli 11.0 — Offline-First Outbox & Synchronization Engine

## 1. Local-First Architecture

Saheli is fully operational without an internet connection. Partner Connect is designed to accommodate sporadic or absent connectivity seamlessly.

---

## 2. Owner Outbox Queue (`partner_outbox`)

When a cycle owner logs a new entry:

1. Entry is committed immediately to the local IndexedDB Vault.
2. If partner pairing is active:
   - Filters record according to current permissions.
   - Encrypts snapshot into ciphertext envelope.
   - If device is **online**: Uploads immediately via `POST /api/partner/snapshot`.
   - If device is **offline** or request fails: Enqueues envelope into IndexedDB `partner_outbox`.

### Automatic Outbox Flush

- Listens to `window.addEventListener("online", flushPartnerOutbox)`.
- When connectivity resumes, outbox items are transmitted in FIFO order.
- On successful 200 response, outbox is cleared.

---

## 3. Partner Local Cache (`partner_cache`) & Stale Detection

When the partner views the companion dashboard:

1. Attempts to fetch latest ciphertext envelope from relay.
2. On success:
   - Decrypts envelope using local SSK.
   - Updates IndexedDB `partner_cache` with decrypted snapshot and timestamp.
   - Sets status to **Live / Synced**.
3. If network fails or partner is offline:
   - Loads last known snapshot from `partner_cache`.
   - Displays clear indicator: **"Offline: Showing cached data from [timestamp]"**.

---

## 4. Air-Gapped Manual File Export (`.sahelipartner`)

For environments with strict network blocking or zero internet access:

- **Export**: Owner can export an encrypted snapshot file (`.sahelipartner`).
- **Transfer**: File transferred via Bluetooth, SD card, or local sharing.
- **Import**: Partner imports the `.sahelipartner` file directly into their app, which decrypts it using their paired SSK.
