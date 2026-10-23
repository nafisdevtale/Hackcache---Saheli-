# SAHELI 6.1 — FINAL COMPETITOR-INFORMED FEATURE GAP AUDIT

**Date:** October 2026  
**Project:** Saheli — Your Cycle, Your Rhythm  
**Repository:** `nafisdevtale/remix-of-saheli-cycle-companion`  
**Milestone:** Saheli 6.1 Competitor-Informed Final Feature Gap Closure  
**Build & Test Status:** All 208 Vitest/Bun tests passing (100%), 0 lint errors, 100% multilingual parity (755 keys across 13 Indian languages), Production Vite build successful.

---

## 1. Executive Summary & Purpose

Saheli 6.1 systematically closes all competitive and functional feature gaps identified across global and regional menstrual health benchmarks (Flo, Clue, Stardust, Lunavi, P Tracker) while strictly maintaining Saheli’s founding principles:

- **Local-first privacy** (WebCrypto AES-GCM-256 + PBKDF2 with optional high-entropy passphrase).
- **Conservative medical safety** (strict adolescent suppression under 18, irregular cycle safeguards, zero contraception claims).
- **Zero data loss & non-destructive migration** (seamless backward compatibility for existing records).
- **Authentic multilingual accessibility** (755 dictionary keys with 100% key parity across 13 Indian languages and authentic Urdu RTL alignment).

---

## 2. Comprehensive Audit Matrix

| Domain                                       | Competitor Benchmark                 | Saheli 6.1 Implementation                                                                                                                                                                                                                                                  | Verification Evidence                                                                | Status       |
| :------------------------------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :----------- |
| **Fertility & Cycle Estimation Reliability** | Clue / Flo                           | Recalculation verification; transparent machine-readable `diagnosticInfo` (`calculationVersion: "6.1.0"`, `inputValidity`, `eligibilityStatus`); explicit suppression reasons (`adolescent_safeguard`, `irregular_cycles`, `insufficient_history`, `opt_out`, `pregnant`). | `src/lib/cycle.js`, `src/test/saheli-6-1-gap-closure.test.js`                        | **VERIFIED** |
| **Cycle History Comparison**                 | Clue Analytics                       | Dynamic scope filtering: toggle between Recent 6 Cycles (`CONFIG.historyWindow`) and All Cycles; median, min, max, and spread recalculated dynamically.                                                                                                                    | `src/lib/insights.js`, `src/pages/Insights.jsx`                                      | **VERIFIED** |
| **Strict Data Provenance**                   | Evidence-based health apps           | Verifiable provenance metadata attached to all patterns, frequent symptoms, bleeding alerts, and pain summaries (`supportingDates`, `observationsCount`, `cyclesEvaluated`, `methodology`, `confidence`).                                                                  | `src/pages/Insights.jsx`, `src/lib/insights.js`                                      | **VERIFIED** |
| **Interactive Provenance Exploration**       | Modern clinical dashboards           | Inspect Evidence modal rendering contributing dates as clickable deep-links navigating to `/log?date=YYYY-MM-DD` for immediate diary inspection.                                                                                                                           | `src/pages/Insights.jsx`                                                             | **VERIFIED** |
| **Missing Data Transparency**                | Data integrity standards             | Explicitly distinguishes between missing/unlogged days and confirmed symptom-free days. Displays transparent notice with unlogged day counts vs total span.                                                                                                                | `src/lib/insights.js`, `src/pages/Insights.jsx`                                      | **VERIFIED** |
| **Customizable Dashboard**                   | Lunavi                               | Reorderable, toggleable dashboard widgets persisted in `record.settings.dashboardWidgets` via serialized updates without touching medical records; accessible Move Up/Down controls and Reset to Defaults.                                                                 | `src/pages/Today.jsx`, `src/lib/exportImport.js`                                     | **VERIFIED** |
| **Pinned Emergency Governance**              | Clinical Safety Standard             | Urgent clinical red flags (`UrgentCard`) are strictly pinned above customizable dashboard widgets and can never be hidden or disabled.                                                                                                                                     | `src/pages/Today.jsx`                                                                | **VERIFIED** |
| **Fast & Flexible Daily Logging**            | P Tracker                            | 1-tap quick logging sheet from today and calendar; custom symptom history preservation with `c_` prefix and retired state support; 3-tier intensity tracking (`mild`, `moderate`, `severe`).                                                                               | `src/components/logging/QuickLogSheet.jsx`, `src/lib/exportImport.js`                | **VERIFIED** |
| **Strong Passphrase Encryption**             | Stardust privacy benchmark           | WebCrypto AES-GCM-256 with PBKDF2-SHA256 supports custom alphanumeric passphrases alongside 4-digit PINs; zero plaintext leakage in IndexedDB.                                                                                                                             | `src/lib/encryption.js`, `src/pages/Settings.jsx`, `src/components/layout/Shell.jsx` | **VERIFIED** |
| **Local Vernacular Health Search**           | Indian vernacular health NLP         | Tokenized offline FAQ search with punctuation stripping and synonym expansion for Hindi/Hinglish terms (`mahavari`, `dard`, `safed pani`, `garbh`, `thakan`, `motapa`).                                                                                                    | `src/content/faq.js`, `src/test/saheli-6-1-gap-closure.test.js`                      | **VERIFIED** |
| **AI Assistant Governance**                  | Digital Personal Data Protection Act | Explicit user consent gate required before AI queries; strict question-only mode (cycle context toggle defaults to false with payload inspection).                                                                                                                         | `src/pages/Ask.jsx`, `src/test/ai-assistant.test.js`                                 | **VERIFIED** |
| **Multilingual Parity (13 Languages)**       | National Language Standards          | 755 dictionary keys across English, Hindi, Marathi, Bengali, Telugu, Urdu, Tamil, Kannada, Gujarati, Punjabi, Malayalam, Odia, Assamese; 0 cross-contamination.                                                                                                            | `scripts/i18n-check.js`, `src/i18n/*.js`                                             | **VERIFIED** |
| **Urdu Right-to-Left (RTL)**                 | Bi-directional UX                    | Native RTL font stack (`Noto Nastaliq Urdu`), bidirectional layout mirroring, and contextual alignment.                                                                                                                                                                    | `src/styles.css`, `src/components/layout/Shell.jsx`                                  | **VERIFIED** |

---

## 3. Detailed Verification Findings

### 3.1 Cycle Engine & Fertility Diagnostics (`src/lib/cycle.js`)

- Enriched `diagnosticInfo` payload:
  - `calculationVersion`: `"6.1.0"`
  - `inputValidity`: `{ valid: boolean, periodsCount: number, completeCyclesCount: number }`
  - `eligibilityStatus`: Current eligibility classification (`"adolescent_safety"`, `"irregular_cycles"`, `"insufficient_history"`, `"opt_out"`, `"pregnant"`, `"estimate_available"`)
- Safe educational window:
  - Strict adolescent suppression (`under18`) regardless of cycle regularity.
  - Suppression when cycle variation (spread) > 7 days in adults.
  - Suppression when complete cycles < 3.

### 3.2 Advanced Insights Engine (`src/lib/insights.js` & `src/pages/Insights.jsx`)

- Supports dynamic `scope`:
  - `"recent"`: Windowed to the last 6 cycles (`CONFIG.historyWindow = 6`).
  - `"all"`: Evaluates the complete recorded cycle history.
- Provenance details attached to each pattern, frequent symptom, and bleeding anomaly:
  - `supportingDates`: Sorted array of ISO date strings (`YYYY-MM-DD`).
  - `observationsCount`: Total occurrences recorded in diary.
  - `cyclesEvaluated`: Number of cycles included in the statistical calculation.
  - `methodology`: Transparent description of calculation formula.
  - `confidence`: Calibrated confidence indicator (`"high"`, `"sufficient"`, `"preliminary"`).
- Deep linking:
  - Tapping any date in the Provenance Modal opens `/log?date=YYYY-MM-DD` allowing the user to view or edit the exact journal entry.

### 3.3 Customizable Dashboard (`src/pages/Today.jsx` & `src/lib/exportImport.js`)

- Persisted in `record.settings.dashboardWidgets`:
  - `DEFAULT_DASHBOARD_WIDGETS`: `[ { id: "rhythmRing", visible: true }, { id: "nextPeriod", visible: true }, { id: "todayLog", visible: true }, { id: "reminders", visible: true }, { id: "fertility", visible: true }, { id: "insights", visible: true }, { id: "learning", visible: true }, { id: "doctorShortcuts", visible: true } ]`.
- Accessible Modal Customizer:
  - Accessible `ArrowUp` and `ArrowDown` buttons for keyboard and screen-reader reordering.
  - Checkbox toggles for visibility.
  - "Reset defaults" action restoring canonical order.
  - Non-destructive: Does not alter diary entries or medical records.

### 3.4 Encryption & Passphrase Mode (`src/lib/encryption.js`)

- Derivation: PBKDF2-SHA-256 with 100,000 iterations and fresh 96-bit random IVs.
- Validation:
  - `isValidPin(s)`: 4-digit numeric string (`/^\d{4}$/`).
  - `isValidPassphrase(s)`: 6+ character alphanumeric/symbol string.
  - `isValidSecret(s)`: Validates either PIN or Passphrase.
- Settings & Lock screen:
  - User can toggle between 4-Digit PIN and Strong Passphrase when setting up or changing lock.
  - Lock screen supports both tactile 4-digit keypad and full keyboard passphrase entry.

### 3.5 Local FAQ Search & Regional Synonyms (`src/content/faq.js`)

- Tokenized string normalization stripping all punctuation marks across scripts.
- Indian vernacular health synonym dictionary (`INDIAN_VERNACULAR_SYNONYMS`):
  - `mahavari`, `mahina`, `mc` -> `period`, `cycle`
  - `dard`, `peeda`, `dukhna` -> `pain`, `cramps`
  - `safed pani`, `likoria`, `leukorrhea` -> `discharge`
  - `garbh`, `hamal` -> `pregnant`, `pregnancy`
  - `kamjor`, `kamjori`, `thakan` -> `tired`, `fatigue`
- Resolves queries offline with zero remote telemetry.

---

## 4. Test & Quality Summary

- **Total Unit & Integration Tests:** 208 passing tests across 16 test files.
- **Prettier Code Formatting:** 100% compliant across all files (`bun x prettier --check .`).
- **ESLint Code Quality:** 0 errors (`bun run lint`).
- **Multilingual Key Parity:** 755/755 keys across all 13 languages, 0 cross-contamination (`bun run i18n:check`).
- **Production Build:** Vite production build passes with optimized static assets and server bundle.
