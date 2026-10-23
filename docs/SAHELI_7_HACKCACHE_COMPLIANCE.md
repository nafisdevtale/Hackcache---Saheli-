# Saheli 7.0 — HackCache Problem Statement 5 Compliance Report

## Executive Summary

**Project:** Saheli — Your Cycle, Your Rhythm  
**Target Statement:** HackCache Problem Statement 5 — Building a Free, Supportive Menstrual Health Companion  
**Repository:** `nafisdevtale/remix-of-saheli-cycle-companion`  
**Baseline Verification:** Commit `b1cf613` + Saheli 7.0 Implementation  
**Quality Metrics:** 262 Passing Tests • 0 Failures • 100% Translation Parity (13 Languages, 762 keys each) • Zero Lovable Dependencies • 0 Remote Tracking SDKs

Saheli 7.0 demonstrates the full implementation of an offline-first, culturally sensitive, free, and supportive menstrual health companion tailored for women and adolescents across India.

---

## 1. Traceability: All 10 HackCache Competition Features

### Feature 1: Ovulation & Fertility Tracking (Safe & Non-Contraceptive)

- **Clinical Safeguards:**
  - Evaluates cycle variation (`spread = max(lengths) - min(lengths)`); if `spread > 7 days` (FIGO AUB guidelines), fertility estimation is strictly suppressed.
  - Strictly suppresses fertility estimates for users under 18 (`adolescent_safeguard`), presenting educational cycle maturation guidance instead.
  - Requires a minimum of 3 completed cycles (`insufficient_history`) before calculating ovulation estimates.
- **Uncertainty & Transparency:**
  - Surfaces estimated timing with explicit uncertainty intervals (`±{halfWidth} days`), based on historical variation.
  - Exposes the exact number of cycles considered (`basedOn`).
  - Emphasizes deterministic medical disclaimers on every card stating that calendar predictions must never be used for contraception.
- **Verification:** `src/test/saheli-7-ovulation.test.js`, `src/test/saheli-7-fixtures.test.js`.

### Feature 2: PCOS / PCOD Education & Evidence Registry

- **Comprehensive Condition Guide:**
  - Enriched `CONDITIONS.pcos` with all 10 required educational structural elements across all 13 languages: What it is, common signs, why symptoms vary, doctor evaluation, lifestyle management, when to seek advice, related lessons, sources, review date (`October 2026`), and non-diagnostic notice.
  - Explains the common Indian interchangeable usage of "PCOD" and "PCOS" while clarifying clinical distinctions.
- **Official Clinical Evidence Registry:**
  - `src/content/sources.js` documents 35 authoritative sources across WHO, NHS, ACOG, FIGO, FOGSI, MoHFW, eSanjeevani, and Tele-MANAS with metadata (`title`, `organization`, `topic`, `accessed`, `status`, and secure HTTPS `url`).
- **Verification:** `src/test/saheli-7-education.test.js`, `src/test/medical-sources.test.js`.

### Feature 3: Supportive AI Assistant (Two-Tier Consent & Triage)

- **Safety-First Architecture:**
  - Default mode is 100% offline verified medical FAQ library (32 questions).
  - Optional AI Assistant mode requires affirmative general consent and explicit second consent before sharing anonymized cycle context.
- **Deterministic Multi-Language Triage:**
  - Intercepts acute emergencies (heavy hemorrhaging, sudden severe pelvic pain, foul discharge with fever, ectopic risk) and crisis/self-harm keywords across English, Hindi, Marathi, Bengali, Tamil, Telugu, and Urdu before making any API call.
  - Immediately routes to emergency services (112, 108) and Tele-MANAS (14416) with 0 API key dependency.
  - Refuses unprescribed medication dosing and warns against rhythm-method contraception.
- **Verification:** `src/test/saheli-7-ai-evaluation.test.js` (exercising all 18 evaluation scenarios).

### Feature 4: Smart Reminders & Personalisation

- **Quiet Hours & Deduplication:**
  - Respects overnight quiet hours wrap-around (e.g., 22:00 to 07:00) and daylight quiet hours without missing scheduled notifications.
  - Uses idempotent deduplication keys (`${id}-${today}-${time}`) preventing repeat alert spamming.
- **Estimation-Aware Alerting:**
  - Next period reminder triggers only when a valid cycle prediction exists; strictly suppressed when cycles are irregular or data is insufficient.
- **Discreet Mode Lockscreen Privacy:**
  - Disguises notification titles to "Health Diary" / "डायरी" and neutral body text ("Time to check in"), completely hiding menstrual terms on shared family phones.
- **Verification:** `src/test/saheli-7-reminders.test.js`, `src/test/push.test.js`.

### Feature 5: Privacy & Safe Community

- **Local-First Zero-Account Storage:**
  - All personal diaries live inside IndexedDB with optional WebCrypto AES-GCM (256-bit) client-side encryption derived from a 4-digit PIN or passphrase via PBKDF2-SHA256 (100k iterations).
  - Zero analytics cookies, ad trackers, or third-party telemetry scripts.
- **DPDP Act 2023 Section 9 Compliance:**
  - Strictly prohibits under-18 users from accessing or posting to public forums; teen community feed is disabled by default.
  - Automatic PII redaction for Indian mobile numbers, email addresses, and external links.
  - Anti-abuse rate limiting (max 3 posts per 10 minutes) and automatic moderation flagging after 3 reports.
- **Verification:** `src/test/saheli-7-privacy-community.test.js`, `src/test/community.test.js`, `src/test/encryption.test.js`.

### Feature 6: Free & Accessible Design

- **100% Free Core:**
  - Zero paywalls, subscription tiers, locked analytics, or hidden monetization.
- **13 Indian Languages Completeness:**
  - Full key parity (762 keys each) across English, Hindi, Marathi, Telugu, Kannada, Tamil, Bengali, Gujarati, Punjabi, Malayalam, Odia, Assamese, and Urdu.
  - Automatic `dir="rtl"` layout flip and script optimization for Urdu.
- **WCAG 2.2 AA Accessibility:**
  - High contrast mode, text scaling (`sm`, `md`, `lg`, `xl`), minimum 44x44px touch targets (mostly 48px), visible focus rings, non-color status indicators, and screen reader announcements.
- **Verification:** `scripts/i18n-check.js`, `src/test/multilingual.test.js`, `src/test/saheli-7-privacy-community.test.js`.

### Feature 7: Period & Cycle Tracking Engine

- **Comprehensive Daily Diary:**
  - Daily logging of period status, flow (spotting, light, medium, heavy), pain intensity (0-4), pad-hourly soaking, large blood clots, painkiller response, and notes.
- **Transactional Consistency:**
  - Serialized mutations against IndexedDB guarantee that rapid UI logging cannot cause race conditions or state corruption.
  - Adding, editing, or deleting past periods dynamically recalculates all dependent metrics across Today, Calendar, and Insights.
- **Verification:** `src/test/saheli-7-ovulation.test.js`, `src/test/user-workflows.test.js`.

### Feature 8: Daily Health Insights & Patterns

- **Clinical Statistical Metrics:**
  - Calculates median cycle length, cycle spread, period duration, and symptom frequency.
  - Detects premenstrual patterns (symptoms occurring consistently in the luteal phase across ≥3 cycles) with explicit provenance metadata showing supporting cycle counts.
  - Distinguishes missing data from confirmed symptom-free days.
- **Verification:** `src/test/insights.test.js`, `src/test/saheli-6-1-gap-closure.test.js`.

### Feature 9: Symptom & Mood Tracking

- **Multi-Category Custom Symptoms:**
  - 5 comprehensive categories: physical, emotional, digestive, sleep/energy, and safety.
  - 3 intensity levels (mild, moderate, severe) with quick-log favorite chips.
  - Supports user-defined custom symptoms (`c_*`) that persist cleanly across reloads and schema-validated JSON import/export.
- **Verification:** `src/test/saheli-6-features.test.js`, `src/test/exportImport.test.js`.

### Feature 10: Pregnancy Educational Mode

- **Supportive Maternal Journey:**
  - 280-day gestational calculation from Last Menstrual Period (LMP).
  - 40 weekly milestones with developmental context and clinical safety tips.
  - Emergency warning signs triage (vaginal bleeding, severe abdominal cramps, reduced fetal movement).
  - Safely pauses menstrual predictions while preserving complete historical cycle data.
- **Verification:** `src/test/saheli-7-fixtures.test.js`, `src/test/user-workflows.test.js`.

---

## 2. Evaluation Across the 7 HackCache Criteria

| Evaluation Area                            | Saheli 7.0 Implementation Evidence                                                                                                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Problem Solved**                      | Empowers millions of women and young girls across Bharat with accurate, dignified, and clinically safe menstrual health tracking without data exploitation, predatory subscriptions, or surveillance.                        |
| **2. Innovation & Originality**            | Unique deterministic clinical safety architecture: pre-LLM emergency screening in 7 Indian scripts, dynamic FIGO irregularity suppression, two-tier privacy consent, and discreet mode disguise for shared household phones. |
| **3. User Experience & Design**            | Warm, respectful design system with indigenous cultural resonance (Rhythm Ring, herbal wellness accents), responsive across 320px to 1440px, full Urdu RTL support, and frictionless 4-step onboarding (<1 min).             |
| **4. Technical Feasibility & Reliability** | Standalone PWA running on modern Web Standards (Vite, React, TanStack, IndexedDB, WebCrypto). Zero cloud dependency for core functionality. Proven by 262 automated tests with 100% pass rate.                               |
| **5. Privacy & Ethics**                    | True local-first architecture: zero trackers, zero cloud accounts, client-side WebCrypto AES-GCM (256-bit), DPDP Act 2023 Section 9 minor protections, and strict non-contraception clinical disclaimers.                    |
| **6. Scalability & Extensibility**         | Modular architecture with strict separation between UI, clinical domain logic, storage, and server API. Automated i18n validator ensures 100% key parity across all 13 Indian languages.                                     |
| **7. Social Impact & Accessibility**       | Solves critical digital divide issues through free access (0 paywalls), complete offline operation, multi-lingual vernacular support, WCAG 2.2 AA accessibility, and culturally sensitive adolescent education.              |

---

## Conclusion

Saheli 7.0 exceeds the core requirements of HackCache Problem Statement 5, providing a fully tested, independent, and clinically grounded menstrual health companion built for real-world impact.
