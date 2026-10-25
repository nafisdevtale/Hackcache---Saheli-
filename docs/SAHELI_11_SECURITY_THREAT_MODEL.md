# Saheli 11.0 — Security Threat Model & Risk Analysis

## 1. Threat Environment & Adversary Personas

Saheli is deployed in real-world scenarios where users face diverse and asymmetrical privacy adversaries:

| Adversary Persona                           | Capability                                      | Attack Vector                                | Mitigation in Saheli 11.0                                                                          |
| :------------------------------------------ | :---------------------------------------------- | :------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Snooping Family Member**                  | Physical possession of phone, casual inspection | Opens app while owner is away from room      | Multi-method lock (PIN/Passphrase/Pattern), auto-lock on inactivity, discreet mode title/icon      |
| **Coercive Partner**                        | Demands access to period diary                  | Demands unlock or snoops notifications       | Granular field-level permissions, discreet notifications, emergency PIN reset / dummy demo mode    |
| **Network Eavesdropper (ISP/Public Wi-Fi)** | Man-in-the-Middle packet inspection             | Intercepts relay requests (`/api/partner/*`) | Client-side AES-256-GCM envelope encryption, out-of-band 6-digit SAS code, TLS 1.3                 |
| **Compromised Relay Server**                | Full read access to backend memory              | Dumps server memory or logs                  | Zero-knowledge architecture: server only handles encrypted ciphertext envelopes; zero private keys |
| **Malicious App on Device**                 | Local IndexedDB extraction attempts             | Reads local IndexedDB storage files          | Sensitive records encrypted with AES-256-GCM Vault DEK; DEK wrapped with PBKDF2/AES-GCM            |

---

## 2. Cryptographic Security Invariants

### Invariant 1: Forward & Backward Secrecy in Partner Connect

- Changing permissions immediately applies to subsequent encrypted snapshots.
- Revoking partner pairing purges the relay envelope and invalidates the session sharing key.

### Invariant 2: Cryptographic Tampering Resistance

- AES-256-GCM produces a 128-bit authentication tag.
- Any modification of ciphertext or initialization vector (IV) fails decryption atomically with an unrecoverable exception.

### Invariant 3: Zero Plaintext Leakage in Error Logs

- Exception handlers and crash reporters scrub ciphertext, recovery keys, and derived KEKs.

---

## 3. Threat Assessment Matrix (STRIDE)

| Threat Category            | Description                                           | Saheli 11.0 Countermeasure                                               |
| :------------------------- | :---------------------------------------------------- | :----------------------------------------------------------------------- |
| **Spoofing**               | Attacker impersonates legitimate partner              | 6-digit Short Authentication String (SAS) computed over ECDH public keys |
| **Tampering**              | Relay alters cycle predictions in transit             | Authenticated ciphertext envelope with AES-256-GCM auth tags             |
| **Repudiation**            | Partner claims owner consented to share private notes | Granular permission digest embedded in envelope header                   |
| **Information Disclosure** | Server admin views cycle dates or notes               | End-to-end encryption with client-derived Snapshot Sharing Key (SSK)     |
| **Denial of Service**      | Flooding relay with fake pairing requests             | 15-minute TTL expiration, rate limits, in-memory cleanup loops           |
| **Elevation of Privilege** | Partner attempts to edit owner diary                  | Partner endpoints and views are strictly read-only by design             |
