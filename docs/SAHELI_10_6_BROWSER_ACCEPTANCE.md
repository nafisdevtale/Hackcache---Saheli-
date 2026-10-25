# SAHELI 10.6 — REAL-BROWSER QA & ACCEPTANCE REPORT

**Audit Date:** October 25, 2026  
**Execution Environment:** Headless Chromium via Chrome DevTools Protocol (CDP)  
**Target Viewport:** 1280 × 900  
**Test Script:** `scripts/verify-saheli-10-6.js`  
**Screenshot Directory:** `docs/screenshots/saheli-10-6/`  
**Overall Verdict:** ✅ PASSED — ALL ACCEPTANCE CRITERIA SATISFIED

---

## 1. Acceptance Criteria Checklist

| Requirement ID | Acceptance Criterion                                                                                                                                                               | Verification Method                              |  Status   |
| :------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- | :-------: |
|   **AC-01**    | **Native Numerals by Default:** All 12 non-English Indic languages render native numerals by default across Today, Calendar, Ring, and Logging.                                    | CDP DOM Inspection & Screenshots                 | ✅ PASSED |
|   **AC-02**    | **Standard Latin Digits for English:** English renders Western Arabic digits (`0-9`) by default.                                                                                   | Vitest & CDP Inspection                          | ✅ PASSED |
|   **AC-03**    | **Latin Numerals Override Toggle:** Settings displays "Standard Latin Digits (0-9)" for non-English locales, successfully switching rendered numbers to Latin digits when enabled. | DOM Evaluation & Screenshot 11/12                | ✅ PASSED |
|   **AC-04**    | **Zero Hardcoded English Strings:** All 83 user-facing files in `src/` contain 0 unlocalized JSX strings or missing dictionary keys.                                               | AST Compiler Audit (`ast-localisation-audit.js`) | ✅ PASSED |
|   **AC-05**    | **100% Dictionary Key Parity:** All 13 languages contain identical 1,974 keys with 0 cross-script contamination.                                                                   | `bun run i18n:check`                             | ✅ PASSED |
|   **AC-06**    | **Real-Time Language Switching:** Changing language updates the interface immediately without reloading, preserving modal open state and form inputs.                              | Vitest DOM Simulation & CDP                      | ✅ PASSED |
|   **AC-07**    | **RTL Bi-Directionality:** Urdu (`ur`) sets `<html dir="rtl">` with right-aligned layout and Eastern Arabic-Indic numerals.                                                        | CDP Evaluation & Screenshot 06                   | ✅ PASSED |
|   **AC-08**    | **Zero CI Regressions:** All 583 Vitest tests pass cleanly. `bun run build` succeeds without warnings.                                                                             | CI Build & Vitest Runner                         | ✅ PASSED |

---

## 2. Real-Browser Screenshot Verification Matrix

The test runner `scripts/verify-saheli-10-6.js` captured 14 high-resolution screenshots into `docs/screenshots/saheli-10-6/`:

| Screenshot File                       | Language & Context                | Verification Observations                                                                                       |   Result    |
| :------------------------------------ | :-------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :---------: |
| `01_today_english_latin.png`          | English (`en`) · Today Dashboard  | Clean English labels; cycle day and predictions rendered in standard Latin digits (`28`, `14`).                 | ✅ VERIFIED |
| `02_today_hindi_native.png`           | Hindi (`hi`) · Today Dashboard    | Devanagari numerals (`२८`, `१४`) rendered in RhythmRing; 100% Hindi labels with zero English leaks.             | ✅ VERIFIED |
| `03_today_bengali_native.png`         | Bengali (`bn`) · Today Dashboard  | Bengali numerals (`২৮`, `১৪`) rendered in cycle trackers and quick action chips; zero Devanagari contamination. | ✅ VERIFIED |
| `04_today_tamil_native.png`           | Tamil (`ta`) · Today Dashboard    | Tamil numerals (`௨௮`, `௧௪`) rendered in cycle trackers; pure Tamil typography.                                  | ✅ VERIFIED |
| `05_today_telugu_native.png`          | Telugu (`te`) · Today Dashboard   | Telugu numerals (`౨౮`, `౧౪`) rendered in cycle trackers; authentic Telugu typography.                           | ✅ VERIFIED |
| `06_today_urdu_rtl_native.png`        | Urdu (`ur`) · Today Dashboard     | Right-to-Left (RTL) layout active; Eastern Arabic-Indic numerals (`۲۸`, `۱۴`) rendered correctly.               | ✅ VERIFIED |
| `07_calendar_hindi_native.png`        | Hindi (`hi`) · Cycle Calendar     | Calendar grid dates rendered in Devanagari numerals (`१`, `२`, `३`... `२८`); phase legends in Hindi.            | ✅ VERIFIED |
| `08_companion_bengali.png`            | Bengali (`bn`) · Sanctuary & Pet  | Pet care actions, energy meter, and status badges localized in Bengali.                                         | ✅ VERIFIED |
| `09_diva_marathi.png`                 | Marathi (`mr`) · Diva Coordinator | Privacy firewall guarantees, session memory notice, and capability pills rendered in pure Marathi.              | ✅ VERIFIED |
| `10_instinct_tamil.png`               | Tamil (`ta`) · INSTINCT AI        | Entertainment categories, taste profile controls, and streaming platform badges rendered in Tamil.              | ✅ VERIFIED |
| `11_settings_latin_digits_toggle.png` | Hindi (`hi`) · Settings           | "Standard Latin Digits (0-9)" toggle visible and accessible under Regional Preferences.                         | ✅ VERIFIED |
| `12_today_hindi_latin_override.png`   | Hindi (`hi`) · Today (Override)   | With toggle enabled, Hindi text is preserved while numbers dynamically switch to Latin digits (`28`, `14`).     | ✅ VERIFIED |
| `13_doctor_guidance_hindi.png`        | Hindi (`hi`) · Doctor Guidance    | eSanjeevani teleconsultation notices, symptom checklists, and emergency helpline text localized.                | ✅ VERIFIED |
| `14_pregnancy_mode_hindi.png`         | Hindi (`hi`) · Pregnancy Mode     | Gestational milestones, disclaimers, and prenatal care notes localized in Hindi.                                | ✅ VERIFIED |

---

## 3. Test Suite & Build Output Log

```
$ vitest run
Test Files  50 passed (50)
Tests       583 passed (583)
Duration    4.60s

$ node scripts/i18n-check.js
Base dictionary (en): 1974 keys
Total registered languages: 13
✅ Scanned 153 source files (1141 distinct static keys). Source errors: 0
🎉 ALL 13 LANGUAGES & SOURCE CODE PASS: 100% key parity, zero leakage, zero contamination!

$ node scripts/ast-localisation-audit.js
Scanning 83 user-facing files in src/ ...
✅ AST Audit Passed! 0 hardcoded strings or missing keys found across 83 files.

$ eslint .
✅ 0 errors, 0 warnings

$ prettier --check .
All matched files use Prettier code style!

$ vite build
✓ built in 253ms
✔ Complete production build ready
```

---

## 4. Final Conclusion & Sign-Off

Saheli 10.6 achieves total translation completeness and native numeral enforcement across all 13 supported languages. All application-owned text and numerical values adapt authoritatively to user preferences while preserving local-first privacy, clinical triage safeguards, and architectural integrity.
