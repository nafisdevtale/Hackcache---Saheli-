# Saheli 11.0 — Two-Device Real-Browser Cross-Device Acceptance Tests

## 1. Test Methodology

Verification was conducted via Chrome DevTools Protocol (CDP) automating two completely isolated Google Chrome browser instances:

- **Device A (Cycle Owner)**: `http://127.0.0.1:5173` on isolated profile directory `/tmp/saheli-chrome-profile-device-a`.
- **Device B (Remote Partner)**: `http://127.0.0.1:5173/partner` on isolated profile directory `/tmp/saheli-chrome-profile-device-b`.
- **Relay Endpoint**: `/api/partner/*` zero-knowledge serverless router.

Execution Script: `scripts/verify-saheli-11-two-device.js`.

---

## 2. Test Execution Log & Results

| Test Step | Description               | Verification Criterion                                                      | Status   |
| :-------- | :------------------------ | :-------------------------------------------------------------------------- | :------- |
| **01**    | First launch onboarding   | Saheli Serial ID badge (`SH-XXXX-...`) rendered with Mod-32 checksum        | **PASS** |
| **02**    | Settings -> Privacy       | Serial ID card, account-free identity, multi-method lock setup              | **PASS** |
| **03**    | Vault Lock Screen         | `UnifiedLockScreen` rendered with PIN keypad, Passphrase, Pattern, WebAuthn | **PASS** |
| **04**    | Partner Connect (Owner)   | Field-level permissions, 15-minute temporary invite code generated          | **PASS** |
| **05**    | SAS Verification Code     | 6-digit Short Authentication String displayed for out-of-band comparison    | **PASS** |
| **06**    | Partner Connect (Partner) | Partner enters pairing code, submits to relay                               | **PASS** |
| **07**    | Read-Only Dashboard       | Partner decrypts and renders read-only Companion View (Zero private notes)  | **PASS** |
| **08**    | Owner Revocation          | Owner clicks Disconnect; remote ciphertext envelope wiped immediately       | **PASS** |

---

## 3. High-Resolution Visual Artifacts

The following visual artifacts were generated and verified in `docs/screenshots/saheli-11/`:

1. `01_device_a_onboarding_serial_id.png`: Owner onboarding screen featuring assigned Saheli Serial ID.
2. `02_device_a_settings_vault_identity.png`: Settings -> Privacy featuring Saheli Serial ID card and multi-lock selector.
3. `03_device_a_unified_lock_screen.png`: Unified Lock Screen with progressive delay timers.
4. `04_device_a_partner_connect_owner_invite.png`: Partner Connect owner permission configuration.
5. `05_device_a_active_invite_sas.png`: Active 15-minute pairing code and 6-digit SAS code.
6. `06_device_b_partner_entry.png`: Partner device entering temporary pairing code.
7. `07_device_b_companion_view_decrypted.png`: Decrypted read-only companion dashboard on partner device.
8. `08_device_a_revocation_confirmed.png`: Owner revocation confirmation screen.
