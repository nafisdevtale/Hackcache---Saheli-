# Saheli 11.0 — Account-Free Recovery & Safe Storage Migration

## 1. Account-Free Recovery Mechanism

Because Saheli does not require an email or cloud account, recovery cannot rely on standard "forgot password" email links.

Instead, Saheli generates a high-entropy **Emergency Recovery Key**:

- **Format**: `REC-XXXX-XXXX-XXXX-XXXX` (128-bit entropy, Crockford Base32).
- **Independent DEK Wrap**: The Recovery Key wraps the Vault DEK independently using PBKDF2-SHA256 and AES-GCM.
- **Key Display**: Presented clearly to the user during vault setup and accessible in Settings -> Privacy.
- **Unwrapping**: Entering the 24-character key unwraps the Vault DEK directly, allowing the user to reset their lock secret without data loss.

---

## 2. Non-Destructive Storage Migration Engine

When upgrading from Saheli v1 (unencrypted or legacy PIN storage) to Saheli 11.0 Vault (v2):

### Pre-Flight Verification

- Checks `vault_meta` in IndexedDB. If missing, runs inspection:
  - Detects whether existing records are unencrypted or PIN-encrypted.
  - Verifies presence of existing cycle logs, symptoms, and companion pet adoptions.

### Atomic Commit & Verification

1. Reads existing record and counts logged days ($D_{\text{pre}}$).
2. Derives Vault DEK and re-encrypts records with AES-256-GCM envelope ($v=2$).
3. Creates new `vault_meta` with configured wrappers and recovery key.
4. Performs an atomic `idbWrite`:
   - Writes `vault_meta` and new `vault_record`.
   - Backs up legacy record under `legacy_backup`.
5. Post-verification verifies $D_{\text{post}} = D_{\text{pre}}$. If a mismatch occurs, migration aborts without altering legacy storage.
