# Saheli India: Regulatory, Privacy & Clinical Compliance Register

**Compliance & Verification Status · October 2026**
_Status: Architecture Implemented · External Certifications Pending_

---

> [!IMPORTANT]
> **Independent Review Notice**: Saheli's software architecture enforces strict local-first privacy, deterministic safety triage, and data minimization. However, **formal clinical accreditation, native-speaker translation certification, and legal sign-off under the DPDP Act 2023 remain in PENDING status** until independent accredited professionals complete formal reviews.

---

## 1. Digital Personal Data Protection (DPDP) Act 2023 Readiness

The Digital Personal Data Protection Act, 2023 (DPDP Act) governs personal data processing in India. Saheli is engineered to prioritize data minimization and local device processing.

### 1.1 Local-First Architecture & Zero Remote Tracking

- **No Remote Account Creation:** Saheli does not collect phone numbers, email addresses, Aadhaar numbers, or social logins.
- **Client-Side Encrypted Storage:** Health records (menstrual dates, flow volume, symptoms, notes) reside exclusively in browser IndexedDB.
- **Client-Side WebCrypto AES-256-GCM Encryption:** When a PIN is configured, data is encrypted via browser WebCrypto PBKDF2 (100,000 iterations) with AES-GCM. _This is standard browser-level software encryption and has not been evaluated or certified as hardware-enclave backed._
- **Zero Third-Party Analytics & SDKs:** Saheli does not bundle Google Analytics, Meta Pixel, advertising SDKs, or background telemetry.

### 1.2 Data Transmission Matrix

| Data Category                   | Storage Location         | Transmitted Over Network? | Conditions & Safeguards                                                                                       |
| :------------------------------ | :----------------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------ |
| **Menstrual Dates & Flow Logs** | Local IndexedDB          | **NEVER**                 | Remains 100% on device; deleted on "Delete everything".                                                       |
| **Symptoms, Pain, Notes**       | Local IndexedDB          | **NEVER**                 | Encrypted when PIN is set.                                                                                    |
| **Custom Symptom Names**        | Local IndexedDB          | **NEVER**                 | Backed up only when user manually exports JSON.                                                               |
| **PIN & Salt**                  | Local IndexedDB / Memory | **NEVER**                 | Derived key never leaves local memory.                                                                        |
| **AI Assistant Questions**      | Temporary in transit     | **YES (Optional)**        | Sent to Google Gemini API only when user accepts consent and submits. No user identifier attached.            |
| **Cycle Summary for AI**        | Temporary in transit     | **YES (Opt-in only)**     | **Default OFF**. User must check the box. Transmits only general non-PII values (e.g. cycle length ~28 days). |
| **Adult Community Posts**       | Supabase Database        | **YES (Adults only)**     | Pseudonymous author alias ("Saheli 4821") + SHA-256 device secret hash. PII automatically redacted.           |
| **Under-18 Community Posts**    | N/A                      | **DISABLED**              | **Disabled by default** per DPDP Act Section 9 child safety requirements.                                     |
| **Web Push Subscriptions**      | Server Push Store        | **YES (Optional)**        | Browser endpoint + VAPID public key. Only registered when user enables push.                                  |

### 1.3 Child Safety & Teen Protections (Section 9 DPDP Act)

Under Section 9 of the DPDP Act 2023, processing personal data of children requires verifiable parental consent and prohibits tracking or targeted advertising:

1. **Unverified Age Groups**: Self-declared age groups in mobile apps cannot be legally verified without verifiable parental consent or age assurance infrastructure.
2. **Teen Community Disabled**: To ensure absolute compliance and protect adolescents from online risks, the **under-18 online community forum is strictly disabled**.
3. **Adolescent Education Safe-Harbor**: Adolescents retain full offline access to verified clinical health lessons (first period, puberty, cramp relief, normal cycle variation) and doctor preparation tools.

---

## 2. Telemedicine Guidelines & Medical Device Non-Diagnostic Notice

### 2.1 Non-Diagnostic Classification

- Saheli is an educational health information companion, **NOT** a certified medical device, diagnostic system, or prescription dispensing service under the Central Drugs Standard Control Organisation (CDSCO) Medical Device Rules, 2017.
- Prominent disclaimers appear across Dashboard, Learn, Ask, Insights, and Doctor Visit screens:
  > _"Saheli provides educational health guidance, not medical diagnosis or treatment. Always consult a qualified healthcare professional (gynaecologist or primary care physician) for health concerns or persistent symptoms."_

### 2.2 Deterministic Safety Screening & Emergency Triage

- Automated keyword screening is an assistive safety filter, not a guarantee that all acute emergencies will be caught.
- Critical red flags deterministically bypass AI:
  - Heavy hemorrhage (soaking 2+ pads/hour for 2+ hours): **Emergency 112 / Ambulance 108**
  - Sudden severe pelvic pain / acute abdomen: **Emergency 112 / Ambulance 108**
  - High fever with foul-smelling discharge: **Immediate in-person medical evaluation**
  - Positive pregnancy test with bleeding / severe cramping: **Ectopic pregnancy warning**
- Mental Health Crisis & Self-Harm:
  - Immediate direct routing in English and Hindi to **Tele-MANAS (14416 / 1800-891-4416)** and **KIRAN Helpline (1800-599-0019)**.

---

## 3. External Review & Certification Register

| Domain                            | Current Status               | Required Action Prior to Commercial Deployment                                              |
| :-------------------------------- | :--------------------------- | :------------------------------------------------------------------------------------------ |
| **Clinical Advisory Review**      | ⏳ **PENDING**               | Formal review of lessons and guidance by FOGSI / Indian Medical Association obstetricians.  |
| **DPDP Act Legal Sign-off**       | ⏳ **PENDING**               | Independent legal counsel review of parental consent mechanisms as DPDP Rules are gazetted. |
| **Native-Speaker Translation**    | ⏳ **PENDING**               | Formal review of non-English dictionaries by certified regional language translators.       |
| **Web Push VAPID Deployment**     | ⏳ **ENVIRONMENT-DEPENDENT** | Active only when VAPID keys are configured on production server; fails closed otherwise.    |
| **Supabase Database Persistence** | ⏳ **ENVIRONMENT-DEPENDENT** | Active only when SUPABASE_URL and service key are configured; fails closed otherwise.       |
| **Moderator Workflow**            | ⏳ **ENVIRONMENT-DEPENDENT** | Requires server-side MODERATOR_SECRET; hardcoded fallback secrets are prohibited.           |
