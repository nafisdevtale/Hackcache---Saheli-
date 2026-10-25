# Saheli 11.0 — End-to-End Encryption Key Management & Derivation

## 1. Key Derivation Pipeline

Partner Connect uses **ECDH P-256** combined with **HKDF-SHA256** to derive the symmetric **Snapshot Sharing Key (SSK)**:

1. **Shared Secret Agreement**:
   $$Z = \text{ECDH}(\text{LocalPrivExchangeKey}, \text{RemotePubExchangeKey})$$
   $Z$ is a 32-byte shared point on curve P-256.
2. **HKDF Extract & Expand**:
   - Salt: `"SAHELI_PARTNER_SALT_V1"` (fixed application domain separator).
   - Info: `"SAHELI_PARTNER_CONNECT_KEY"`.
   - Length: 256 bits (32 bytes).
   - Output: `CryptoKey` (`AES-GCM`, 256-bit).

---

## 2. Short Authentication String (SAS) Calculation

To prevent active Man-in-the-Middle (MitM) relay tampering, both devices calculate a 6-digit verification code:

1. Export both public keys in canonical JWK format (`crv`, `kty`, `x`, `y`).
2. Sort keys lexicographically by `x` coordinate to make computation independent of initiator order.
3. Compute SHA-256 digest over concatenation.
4. Extract first 4 bytes as unsigned 32-bit integer $N$.
5. Format:
   $$\text{SAS Code} = (N \pmod{10^6}) \text{ padded to 6 digits}$$

Users verify this number matches across both screens.

---

## 3. Snapshot Encryption & Tamper Detection

Snapshots are encrypted using `AES-GCM-256` with:

- Unique 96-bit IV per snapshot.
- 128-bit authentication tag appended to ciphertext.
- SHA-256 digest of active permissions embedded in header.
- Any modification causes decryption to throw `unsupported-snapshot-envelope` or `corrupt-ciphertext`.
