# Saheli India: Regulatory, Privacy & Clinical Compliance Review

**Prepared for Production & India-wide Deployment**
_Document Version: 1.0 · Date: October 2026_

---

## 1. Digital Personal Data Protection (DPDP) Act 2023 Readiness

The Digital Personal Data Protection Act, 2023 (DPDP Act) governs personal data processing in India. Saheli's architecture was intentionally designed around strict data minimization and local-first privacy to align with and exceed DPDP Act standards.

### 1.1 Local-First Architecture & Zero Data Processing

- **No Remote Account Creation:** Saheli does not require a phone number, email address, Aadhaar number, or social login. Users remain completely anonymous.
- **Client-Side Encrypted Storage:** Health records (menstrual dates, flow volume, symptoms, notes) reside exclusively in browser IndexedDB.
- **Hardware-Backed AES-256-GCM Encryption:** When a PIN is configured, data is encrypted via WebCrypto PBKDF2 (100,000 iterations) with AES-GCM. Neither Saheli developers nor hosting providers possess decryption keys.
- **Zero Third-Party Analytics & SDKs:** Saheli does not bundle Google Analytics, Facebook Pixel, Mixpanel, or third-party advertising SDKs.

### 1.2 Notice and Consent Architecture (Section 6)

- **First-Run Notice:** Onboarding presents clear, plain-language notices in 13 Indian languages explaining that data stays on the device and is not medical advice.
- **Separate Affirmative Consent for AI:** The AI Health Assistant requires affirmative user consent before transmitting any query.
- **Opt-In Cycle Context:** The option to include cycle length and phase in AI questions is toggled **OFF by default** and requires active opt-in. When enabled, only generalized non-PII values are sent.

### 1.3 Right to Erasure & Right to Nominate (Section 12)

- **Local Wipe:** Settings provides "Delete All Data" which purges IndexedDB databases, deletes WebCrypto master keys from memory, clears `localStorage`, and unregisters service-worker caches.
- **Community Wipe:** Community submissions are tied to a client-held device hash (SHA-256). Users can trigger "Delete All My Community Data" at any time to purge their posts and replies from server memory/database.

### 1.4 Obligations Concerning Children (Section 9)

The DPDP Act sets strict duties regarding processing data of individuals under 18 years:

1. **Strict Age Partitioning:** Users identify as Teen (Under-18) or Adult during setup. The Safe Community strictly segregates under-18 users into a separate peer forum. Adults cannot view or interact with under-18 discussions.
2. **Automated PII Redaction:** Phone numbers (Indian 10-digit mobile formats `[6-9]XXXXXXXXX`), email addresses, and external links are automatically redacted before submissions are queued.
3. **No Behavioral Tracking or Targeted Ads:** The app performs zero user tracking, psychographic profiling, or commercial advertising targeting minors.
4. **Moderation Before Publication:** Submissions enter a pending moderation queue to prevent bullying, predation, or harmful advice.

---

## 2. Telemedicine Practice Guidelines & Medical Device Rules

### 2.1 Medical Disclaimer Architecture

- Saheli is an educational health information companion, **NOT** a telemedicine platform, diagnostic device, or prescription dispenser under the Central Drugs Standard Control Organisation (CDSCO) Medical Device Rules, 2017.
- Prominent disclaimers appear across Dashboard, Learn, Ask, Insights, and Doctor Visit screens:
  > _"Saheli provides educational health guidance, not medical diagnosis or treatment. Always consult a qualified healthcare professional (gynaecologist or primary care physician) for persistent symptoms or emergencies."_

### 2.2 Deterministic Safety Screening & Emergency Red Flags

- Acute red flags bypass generative AI and return deterministic emergency instructions:
  - Heavy hemorrhaging (soaking 2+ pads/hour for 2+ consecutive hours): **112 / 108 Emergency Ambulance**
  - Sudden severe pelvic pain / acute abdomen: **112 / 108 Emergency Ambulance**
  - High fever with foul-smelling discharge (pelvic inflammatory risk): **Urgent in-person medical evaluation**
  - Positive pregnancy test with bleeding / severe cramping (ectopic risk): **Emergency evaluation**
- Mental Health Crisis & Self-Harm:
  - Immediate routing to **Tele-MANAS** (National Tele-Mental Health Programme of India: `14416` / `1800-891-4416`) and **KIRAN Helpline** (`1800-599-0019`).

---

## 3. Safe Community Guidelines & Intermediary Guidelines

Under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:

1. **Grievance Reporting Mechanism:** Every community post and reply features a "Report" action with predefined violation categories (misinformation, inappropriate content, harassment, PII).
2. **Automated Threshold Flagging:** Any content receiving 3 or more reports is automatically hidden from public feeds and flagged for moderator review.
3. **Pre-Publication Moderation Queue:** New posts start with `status = 'pending'` and must be approved before appearing in public feeds.
4. **Discreet Notifications:** Lock-screen and push notifications omit clinical or sensitive terms ("period", "ovulation") to safeguard women and teenagers using shared family devices.

---

## 4. Legal & Clinical Deployment Recommendations

Before commercial deployment or nationwide marketing in India, the following external reviews are strongly advised:

1. **Clinical Advisory Review:** Formal sign-off on the expanded educational lessons (Thyroid, Menopause, Postpartum, Iron Deficiency) by a certified Indian Obstetrician & Gynaecologist (FOGSI member).
2. **Legal Counsel Review:** Independent review of the DPDP Act 2023 minor consent provisions, particularly around parental consent mechanisms as rules are finalized by the Data Protection Board of India.
3. **Local Helpline Partnerships:** Verification and formal partnership with local women's health helplines (181 Women Helpline) and community health organizations (ASHA/Anganwadi networks).
