# Saheli 11.0 — Multi-Method Application Locking & Authentication

## 1. Supported Unlock Modalities

Saheli 11.0 provides five distinct unlock methods:

1. **4–12 Digit Numeric PIN**:
   - Clean numeric on-screen keypad with native Indic numeral support.
   - Masked input with toggle visibility.
2. **Alphanumeric Passphrase**:
   - Password manager friendly (supports 6 to 128+ characters).
3. **3x3 Pattern Lock**:
   - Touch and pointer gesture canvas connecting points `0` through `8`.
   - Minimum 4 distinct nodes.
   - Normalized into secret string: `pattern:0-1-2-5-8`.
4. **Device Biometrics (WebAuthn)**:
   - Uses platform authenticators (Face ID, Touch ID, Windows Hello, Android Biometric Prompt).
   - Generates and stores credentials with user verification.
5. **Account-Free Emergency Recovery Key**:
   - High-entropy code (`REC-XXXX-XXXX-XXXX-XXXX`) unwraps the Vault DEK directly if the user forgets their primary secret.

---

## 2. Progressive Lockout Delay Schedule

To prevent automated or physical brute-force attempts on numeric PINs or patterns:

$$ \text{Lockout Delay}(F) = \begin{cases}
0\text{ ms} & F < 3 \\
3,000\text{ ms (3s)} & 3 \le F < 5 \\
15,000\text{ ms (15s)} & 5 \le F < 8 \\
30,000\text{ ms (30s)} & 8 \le F < 10 \\
60,000\text{ ms (60s)} & F \ge 10
\end{cases}$$

- Countdown timer is visually rendered on the lock screen.
- Inputs are disabled and keyboard listeners suppressed during active lockout.

---

## 3. Auto-Lock & Background Visibility Protection

- **Inactivity Timeout**: Configurable in Settings (1 min, 5 min, 10 min, 30 min, Never). Resets on `pointerdown`, `keydown`, `touchstart`.
- **Background Tab Lock**: When `prefs.autoLockOnBackground` is enabled, switching away from the tab or locking the phone triggers `api.lock()` immediately via the Page Visibility API (`visibilitychange`).
$$
