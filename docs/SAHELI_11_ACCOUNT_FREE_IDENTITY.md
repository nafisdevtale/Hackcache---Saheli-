# Saheli 11.0 — Account-Free Identity & Serial ID Architecture

## 1. Zero Account Philosophy

Traditional digital health apps force users into email verification, phone numbers, or social logins, creating an indelible centralized paper trail. In sensitive contexts, such identities can be subpoenaed, sold to data brokers, or discovered by hostile domestic parties.

Saheli 11.0 operates on an **account-free cryptographic identity architecture**:

- No email, phone, or name is ever requested.
- Identity is generated locally on device during initial app launch.
- Identity is cryptographically anchored by local keypairs and a human-readable Serial ID.

---

## 2. Saheli Serial ID Format & Checksum

### Encoding

The Serial ID uses **Crockford Base32** (characters `0-9`, `A-H`, `J-K`, `M-N`, `P-Z`), omitting visually ambiguous letters `I`, `L`, `O`, `U` to prevent transcription errors.

### Structure

```
SH-XXXX-XXXX-XXXX-XXXX
│  └───┬───┘└───┬───┘└───┬───┘└──┬─┘│
│      │        │        │       │  └── Modulo-32 Verification Checksum (1 char)
│      └────────┴────────┴───────┴───── 75-bit High-Entropy Payload (15 chars)
└────────────────────────────────────── Saheli Namespace Prefix
```

### Modulo-32 Checksum Algorithm

1. Convert each character in the 15-character payload to its 5-bit numerical value `[0..31]`.
2. Compute weighted polynomial checksum:
   $$\text{Checksum} = \left(\sum_{i=0}^{14} v_i \times (i + 1)\right) \pmod{32}$$
3. Map result back to Crockford character.
4. Appended as the final 16th character. Any single-character substitution or transposition fails validation automatically.

---

## 3. Device Cryptographic Keys

On installation, Saheli generates two non-extractable Web Crypto keypairs:

1. **Device Identity Keypair (ECDSA P-256)**:
   - Used for signing local audit records and verifying device ownership.
   - Public key exportable as JWK (`kty: "EC"`, `crv: "P-256"`).
2. **Device Key Exchange Keypair (ECDH P-256)**:
   - Used for Diffie-Hellman key agreement during Partner Connect pairing.
   - Private key never leaves device storage.
