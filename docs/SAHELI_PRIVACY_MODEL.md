# SAHELI Privacy & Data Model

## 1. Foundational Architecture: Local-First

Saheli operates under a strict **local-first privacy paradigm**:

- **Zero Account Creation:** No email, phone number, real name, or cloud authentication is ever required.
- **On-Device Storage:** All personal cycle records, symptoms, notes, flow tracking, and settings are stored locally in the user's browser via IndexedDB (`saheli` database, `kv` object store).
- **Zero Third-Party Trackers:** No Google Analytics, Meta Pixel, advertising SDKs, or telemetry scripts are bundled or loaded.

---

## 2. Cryptographic Architecture (PBKDF2 + AES-GCM)

For users who enable the optional App Lock PIN:

1. **Key Derivation:**
   - Primitives: PBKDF2 via WebCrypto API.
   - Salt: 16 cryptographically secure random bytes (`crypto.getRandomValues`), base64 encoded.
   - Work Factor: 100,000 iterations of SHA-256.
   - Output: 256-bit AES-GCM symmetric key.
2. **Authenticated Encryption:**
   - Cipher: AES-GCM with 256-bit key length.
   - Initialization Vector (IV): 12 cryptographically random bytes per encryption.
   - Storage: The ciphertext and IV are serialized into an authenticated payload. The plaintext PIN is never stored anywhere on disk or in memory after derivation.
3. **Graceful Failure & Anti-Corruption:**
   - Atomic IndexedDB writes ensure partial writes never overwrite valid data.
   - If an incorrect PIN is entered, decryption fails authentication tag validation, cleanly aborting without data corruption.

---

## 3. Data Transmission Matrix

| Data Element           | Storage Location           | Leaves Device? | Destination        | Conditions & Consent                                                              |
| ---------------------- | -------------------------- | -------------- | ------------------ | --------------------------------------------------------------------------------- |
| Menstrual Dates & Flow | IndexedDB (Client)         | **NO**         | Never              | Stays strictly on local device.                                                   |
| Symptoms, Pain & Mood  | IndexedDB (Client)         | **NO**         | Never              | Stays strictly on local device.                                                   |
| Personal Notes         | IndexedDB (Client)         | **NO**         | Never              | Stays strictly on local device.                                                   |
| User PIN & Salt        | Volatile RAM / Salt in IDB | **NO**         | Never              | Salt stored locally; PIN never persisted.                                         |
| Ask Saheli (Mode A)    | Client Memory              | **NO**         | Never              | Searches bundled local lessons 100% offline.                                      |
| Ask Saheli (Mode B)    | HTTPS Request Body         | **YES**        | AI Server Boundary | Explicit user click; sends ONLY the question text. Zero personal cycle data.      |
| Web Push Endpoint      | Push Server (KV)           | **YES**        | Push Service       | Only if user explicitly enables remote push notifications. Zero medical payload.  |
| Community Posts        | Supabase Database          | **YES**        | Supabase REST      | Only if adult user explicitly chooses to post in online forum. Under-18 disabled. |

---

## 4. Discreet Mode & Shared Phone Protections

In many Indian households, smartphones are shared among family members:

- **Discreet App Name:** Toggles browser tab title and install metadata to "My Diary" / "डायरी".
- **Discreet Push Payloads:** Remote push notifications strictly read:
  `"Saheli Reminder" - "Open your private Saheli app to check your updates"`.
  Zero reproductive, cycle, or bleeding terms ever appear on device lock-screens.
- **One-Click Data Purge:** The user can permanently erase all IndexedDB databases, preferences, and cached assets in one click from Settings.
