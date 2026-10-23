# SAHELI 6.0 — Complete Feature Integration Matrix

**Date:** 2026-10-23  
**Status:** In Progress — Master Implementation  
**Baseline:** Saheli 5.1 (Commit `93950f5`), 168 Passing Tests, 13 Indian Languages

---

## 1. Feature Integration Matrix Overview

This document tracks the end-to-end integration, functional verification, and test coverage for all 10 problem statement requirements of Saheli 6.0.

| #   | Requirement                                | Implementation Status | Core Files                                                                                                            | Test Coverage                                                         |
| --- | ------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **Period & Cycle Tracking**                | Ready for Enhancement | `src/lib/cycle.js`, `src/pages/Calendar.jsx`, `src/pages/Today.jsx`, `src/lib/exportImport.js`                        | `src/test/saheli.test.js`, `src/test/cycle-tracking.test.js`          |
| 2   | **Ovulation & Fertility Education**        | Ready for Enhancement | `src/lib/cycle.js`, `src/pages/Insights.jsx`, `src/content/lessons.js`                                                | `src/test/insights.test.js`, `src/test/fertility.test.js`             |
| 3   | **Personalised Daily Insights**            | Ready for Enhancement | `src/lib/insights.js`, `src/pages/Insights.jsx`, `src/pages/Today.jsx`                                                | `src/test/insights.test.js`, `src/test/patterns.test.js`              |
| 4   | **Customisable Symptoms & Mood**           | Ready for Enhancement | `src/data/symptoms.js`, `src/components/logging/QuickLogSheet.jsx`, `src/pages/LogDay.jsx`, `src/lib/exportImport.js` | `src/test/symptoms.test.js`                                           |
| 5   | **Menstrual & PCOS Education**             | Integrated / Verified | `src/content/lessons.js`, `src/content/conditions.js`, `src/pages/Learn.jsx`                                          | `src/test/medical-sources.test.js`, `src/test/content-parity.test.js` |
| 6   | **Supportive AI Health Assistant**         | Ready for Enhancement | `src/pages/Ask.jsx`, `src/lib/askAssistant.js`, `src/server/api/chat.ts`                                              | `src/test/ai-assistant.test.js`                                       |
| 7   | **Smart Reminders & Quiet Hours**          | Ready for Enhancement | `src/pages/Reminders.jsx`, `src/server/api/push.ts`, `src/lib/exportImport.js`                                        | `src/test/push.test.js`, `src/test/reminders.test.js`                 |
| 8   | **Pregnancy & Life Stages**                | Ready for Enhancement | `src/pages/Pregnancy.jsx`, `src/data/pregnancyWeeks.js`, `src/content/firstPeriod.js`                                 | `src/test/pregnancy.test.js`                                          |
| 9   | **Privacy, Data Control & Safe Community** | Ready for Enhancement | `src/lib/encryption.js`, `src/lib/exportImport.js`, `src/server/api/community.ts`, `src/pages/Settings.jsx`           | `src/test/encryption.test.js`, `src/test/community.test.js`           |
| 10  | **Free, Accessible & Multilingual**        | Integrated / Verified | `src/lib/i18n.jsx`, `src/data/languages.js`, `src/data/dicts/*`                                                       | `src/test/multilingual.test.js`, `src/test/a11y.test.js`              |

---

## 2. Detailed Requirement Gap & Action Plan

### Req 1: Complete Period and Cycle Tracking

- **Current State:** Cycle engine calculates cycles, median length, variability, and regular/irregular status. Calendar and LogDay allow logging flow, pain, mood, pads, and notes.
- **Enhancements Needed:**
  - Add transparent uncertainty prediction window visualization in Calendar and Today.
  - Clarify non-alarming cycle variability notifications.
  - Ensure cycle-by-cycle comparison table in Insights reflects flow duration and cycle length trends.
- **Verification Plan:** Unit tests for window calculations, irregular cycle widenings, and multi-month calendar navigation.

### Req 2: Ovulation & Fertility Education

- **Current State:** `cycle.js` calculates `fertileWindow` and ovulation day.
- **Enhancements Needed:**
  - Strict suppression for under-18 users by default.
  - Strict suppression when irregular cycle detected (`isIrregular.irregular === true`) or < 3 recorded cycles.
  - Prominent non-contraception medical disclaimers ("Never rely on calendar estimates to prevent or plan pregnancy").
  - Clear educational module explaining luteal phase variance, follicular variation, and cervical mucus cues.
- **Verification Plan:** New unit tests validating under-18 suppression, irregular cycle gating, and disclaimer presence.

### Req 3: Personalised Daily Health Insights

- **Current State:** `src/lib/insights.js` generates insights for pain, bleeding, and cycle length.
- **Enhancements Needed:**
  - Grounded daily insights reflecting current cycle day/phase.
  - Pattern detection for recurring symptoms (e.g., headache on cycle days 26-28).
  - Sleep & energy correlation insights with non-causation phrasing.
  - Data completeness indicator ("Based on X of Y days logged") and graceful insufficient data states.
- **Verification Plan:** Unit tests verifying recurring pattern recognition, data completeness metrics, and absence of causal claims.

### Req 4: Fully Customisable Symptom and Mood Tracking

- **Current State:** 12 preset symptoms in `src/data/symptoms.js`. `blankDay` has `symptoms: []`.
- **Enhancements Needed:**
  - Expand category sets (physical, emotional, digestive, sleep, energy).
  - Support category show/hide toggles in Settings.
  - Quick-log favorite symptom toggles.
  - Custom symptoms management (add custom name, edit, retire/archive without altering historical logs).
  - Symptom intensity ratings (mild, moderate, severe) per day.
  - Schema extension in `exportImport.js` (`symptomIntensities`, `customSymptoms`, `quickLogFavorites`, `symptomCategories`) with full backward/forward compatibility.
- **Verification Plan:** Unit tests for custom symptom lifecycle, intensity serialization, and export/import round-trips.

### Req 5: Menstrual Health and PCOS/PCOD Education

- **Current State:** 10 comprehensive lessons, 4 conditions, first period guide, 13 languages, verified medical citations (WHO, FOGSI, NHS, ACOG).
- **Enhancements Needed:**
  - Ensure reading time estimation and Web Speech API TTS read-aloud support are accessible across all educational pages.
  - Search & category filter capabilities in Learn view.
- **Verification Plan:** Tests verifying search indexing, TTS trigger safety, and reading time computation.

### Req 6: Complete Supportive AI Health Assistant

- **Current State:** Private offline 30+ FAQ matcher + remote Gemini proxy with emergency triage (Tele-MANAS, bleeding, acute pain).
- **Enhancements Needed:**
  - Explicit data transmission preview drawer/dialog: when opting into remote AI, show the exact cycle context payload that will be sent.
  - Offline mode indicator clarifying that queries stay 100% on-device unless remote option is explicitly chosen.
- **Verification Plan:** Tests for emergency triage, rate limiting, and transmission payload preview schema.

### Req 7: Smart Reminders and Personalisation

- **Current State:** Web Push API and local notifications for period range and daily logging.
- **Enhancements Needed:**
  - Support quiet hours (start/end time configuration e.g. 22:00 to 07:00) during which notifications are suppressed.
  - Medication and routine hydration/wellness reminders.
  - Strictly discreet notification wording ("Saheli check-in", "Self-care reminder") without sensitive medical terms on lock screens.
- **Verification Plan:** Tests for quiet hours filtering, payload sanitization, and permission fallbacks.

### Req 8: Pregnancy and Life-Stage Support

- **Current State:** Pregnancy mode pauses predictions; 40-week fetal guide in `src/data/pregnancyWeeks.js`.
- **Enhancements Needed:**
  - Conception date vs. Last Menstrual Period (LMP) due date calculator.
  - Dedicated life-stage educational paths (puberty/first period, reproductive years, postpartum, perimenopause).
  - Clear milestone timeline and prenatal appointment checklist.
- **Verification Plan:** Tests for pregnancy calculations, prediction pause preservation, and life-stage routing.

### Req 9: Privacy, Data Control and Safe Community

- **Current State:** WebCrypto AES-GCM + PBKDF2 encryption with 4-digit PIN, export/import with checksum, full data wipe. Safe community proxy with moderation & DPDP Act compliance.
- **Enhancements Needed:**
  - Discreet mode UI toggle (blurs calendar/data or masks sensitive headers for privacy in public spaces).
  - Export preview modal displaying record summary before download.
  - Clear UI distinction between technical moderation readiness and operational moderation status.
- **Verification Plan:** Security tests for PIN encryption, discreet mode toggle, and community redactions.

### Req 10: Free, Accessible and Multilingual

- **Current State:** 100% free, all 13 Indian languages supported with 699 dictionary keys each, Urdu RTL support.
- **Enhancements Needed:**
  - WCAG 2.2 AA audit for contrast, aria-labels, focus indicators, and tap target sizes (>= 44x44px).
  - Verify seamless RTL presentation across new custom symptom and reminder controls.
- **Verification Plan:** Automated accessibility tests, translation completeness checks, and visual contrast checks.
