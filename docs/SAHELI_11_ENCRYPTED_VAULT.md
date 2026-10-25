# Saheli 11.0 — Unified Encrypted Vault & Key Hierarchy

## 1. Key Hierarchy Architecture

The Saheli 11.0 Vault separates record encryption from user authentication:

```mermaid
flowchart TD
    UserSecret["User Secret (PIN, Passphrase, Pattern, WebAuthn)"]
    PBKDF2["PBKDF2-SHA256 (CONFIG.pbkdf2Iterations)"]
    KEK["Key Encryption Key (KEK - AES-256)"]
    WrappedDEK["Wrapped DEK in vault_meta (AES-GCM-256)"]
    VaultDEK["Vault Data Encryption Key (DEK - 256-bit AES-GCM)"]
    HealthRecords["IndexedDB: Encrypted Health Diary Envelope (v2)"]
    RecoveryKey["Recovery Key (REC-XXXX-XXXX-XXXX-XXXX)"]

    UserSecret --> PBKDF2
    PBKDF2 --> KEK
    KEK -.->|Unwraps| WrappedDEK
    WrappedDEK --> VaultDEK
    RecoveryKey -.->|Alternative Unwrap| WrappedDEK
    VaultDEK -->|Authenticated Decryption| HealthRecords
```

---

## 2. Vault Data Encryption Key (DEK)

- **Algorithm**: `AES-GCM` 256-bit.
- **Generation**: `crypto.subtle.generateKey` on onboarding or migration.
- **In-Memory Residency**: Unwrapped DEK exists only as a reference in `dekRef` while status is `"ready"`.
- **Locking**: Cryptographic lock nullifies `dekRef.current = null` and wipes React state.

---

## 3. Record Envelope Specification (v2)

```typescript
interface EncryptedVaultPayload {
  v: 2;
  alg: "AES-256-GCM";
  iv: string; // 96-bit random nonce (Base64)
  ct: string; // Authenticated ciphertext (Base64)
  ciphertext: string; // Backward compatibility alias
  ts: string; // ISO 8601 generation timestamp
}
```

- **Authentication Tag**: Embedded in GCM ciphertext (last 16 bytes).
- **IV Freshness**: Every write generates a cryptographically secure 96-bit IV via `crypto.getRandomValues`. Nonce reuse probability is $< 2^{-32}$.
