# SAHELI 10.6 — COMPLETE APPLICATION LOCALISATION AUDIT REPORT

**Audit Status:** ✅ PASSED · 0 Hardcoded Strings · 0 Missing Keys · 100% Dictionary Parity  
**Verification Date:** October 25, 2026  
**Baseline:** Saheli 10.5 Commit `517e407`  
**Working Branch:** `feature/saheli-10-nova`

---

## 1. Executive Summary & Audit Methodology

Previous releases (10.1–10.5) performed dictionary parity checks and static regex key scans. However, user testing revealed residual hardcoded English strings embedded in JSX conditionals, ARIA attributes, SVG charts, and interactive overlays.

In **Saheli 10.6**, we transitioned to an **AST-level (Abstract Syntax Tree) compiler auditor** (`scripts/ast-localisation-audit.js`) built with `@babel/parser` and `@babel/traverse`.

### Audit Scope:

- **83 user-facing files** across `src/pages/`, `src/components/`, `src/routes/`, and `src/content/`.
- Every JSX text literal, conditional expression, ternary branch, template string, placeholder, title, and ARIA label was systematically parsed.
- Automated white-list filtered only non-linguistic tokens (numbers, punctuation, currency symbols, CSS classes, test IDs, and screen-reader technical fallbacks).
- Verified against the base dictionary of **1,974 keys** across all 13 supported languages.

---

## 2. Comprehensive Inventory of Repaired Files

The AST auditor identified and resolved hardcoded English strings across **22 core application files**:

| File Path                                           | Initial Defects Detected | Resolution Applied                                                                                                          |
| :-------------------------------------------------- | :----------------------: | :-------------------------------------------------------------------------------------------------------------------------- |
| `src/components/cycle/PhaseCards.jsx`               |        14 strings        | Converted phase descriptions, boundary flags, and ovulation badges to dynamic `t("phase.*")` calls.                         |
| `src/components/cycle/RhythmRing.jsx`               |        11 strings        | Replaced cycle day labels, status indicators, and ARIA ring summaries with `t("rhythm.*")` and `fmtInteger`.                |
| `src/components/insights/BarChart.jsx`              |        4 strings         | Added localized fallback captions, unit titles, and zero-data accessible text `t("common.noDataRecorded")`.                 |
| `src/components/logging/QuickLogSheet.jsx`          |        16 strings        | Localized symptom severity tags, flow intensity selectors, save confirmation, and sheet dismiss labels.                     |
| `src/components/nova/companion/MiniGameOverlay.tsx` |        12 strings        | Localized game countdowns, scores, game over celebrations, and touch interaction hints.                                     |
| `src/pages/Ask.jsx`                                 |        9 strings         | Localized clinical helpline banners, tele-MANAS hotline text, zero-storage disclaimers, and suggested topics.               |
| `src/pages/Calendar.jsx`                            |        15 strings        | Localized month navigation headers, cycle phase legends, day inspection summaries, and period prediction indicators.        |
| `src/pages/Community.jsx`                           |        8 strings         | Localized moderation guidelines, anonymous post tags, topic chips, and teen protection safeguards.                          |
| `src/pages/Discover.jsx`                            |        10 strings        | Localized article filter chips, reading time indicators, offline reading badges, and medical source citations.              |
| `src/pages/Diva.jsx`                                |        14 strings        | Localized coordinator status, session memory privacy firewall guarantees, intent routing, and capability pills.             |
| `src/pages/DoctorGuidance.jsx`                      |        12 strings        | Localized eSanjeevani teleconsultation notices, appointment preparation checklists, and observation summaries.              |
| `src/pages/Feedback.jsx`                            |        7 strings         | Localized category radio selectors, zero-identifier transmission guarantees, and submission toasts.                         |
| `src/pages/FlashEssentials.jsx`                     |        9 strings         | Localized price comparison tooltips, recurring monthly cost warnings, and product tradeoff tags.                            |
| `src/pages/Insights.jsx`                            |        11 strings        | Localized cycle regularity metrics, luteal phase length variations, and symptom frequency aggregations.                     |
| `src/pages/Instinct.jsx`                            |        13 strings        | Localized taste profile tuning controls, streaming platform options, and recommendation rationale headers.                  |
| `src/pages/LogDay.jsx`                              |        12 strings        | Localized pain scale descriptions, mood tags, cervical fluid types, and basal body temperature inputs.                      |
| `src/pages/Pregnancy.jsx`                           |        8 strings         | Localized gestation milestones, fetal development highlights, and pregnancy-mode pause disclaimers.                         |
| `src/pages/Reminders.jsx`                           |        7 strings         | Localized quiet hours alerts, local notification scheduling notices, and privacy guarantees.                                |
| `src/pages/SelfCare.jsx`                            |        8 strings         | Localized soundscape descriptions, guided breathing cadence prompts, and wellness note placeholders.                        |
| `src/pages/Settings.jsx`                            |        10 strings        | Added "Standard Latin Digits (0-9)" compatibility override toggle, local storage export/import alerts, and theme selectors. |
| `src/pages/Today.jsx`                               |        14 strings        | Localized rhythm ring summaries, daily care recommendations, cycle phase descriptions, and quick action chips.              |
| `src/components/bloom/States.jsx`                   |        2 strings         | Localized screen-reader loading indicators and offline status alerts.                                                       |

---

## 3. Automated AST Localisation Auditor Results

Running `node scripts/ast-localisation-audit.js` yields:

```
=======================================================
SAHELI 10.6 AST-BASED LOCALISATION AUDITOR
Scanning 83 user-facing files in src/ ...
=======================================================

✅ AST Audit Passed! 0 hardcoded strings or missing keys found across 83 files.
```

### Script Health & Zero Leakage Verification

All 13 language dictionaries are verified using `bun run i18n:check`:

```
======================================================
 SAHELI 10.1 MULTILINGUAL & SOURCE CODE INTEGRITY AUDIT
 Base dictionary (en): 1974 keys
 Total registered languages: 13
======================================================

🔍 Scanning source code in src/ for static t("...") translation calls...
✅ Scanned 153 source files (1141 distinct static keys). Source errors: 0

✅ [en] English    (English     ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [hi] Hindi      (हिन्दी      ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [mr] Marathi    (मराठी       ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [te] Telugu     (తెలుగు      ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [kn] Kannada    (ಕನ್ನಡ       ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [ta] Tamil      (தமிழ்       ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [bn] Bengali    (বাংলা       ) | Keys: 1974/1974 | Script: 99.0% | Contaminated: 0 | Empty: 0
✅ [gu] Gujarati   (ગુજરાતી     ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [pa] Punjabi    (ਪੰਜਾਬੀ      ) | Keys: 1974/1974 | Script: 99.0% | Contaminated: 0 | Empty: 0
✅ [ml] Malayalam  (മലയാളം      ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0
✅ [or] Odia       (ଓଡ଼ିଆ       ) | Keys: 1974/1974 | Script: 99.1% | Contaminated: 0 | Empty: 0
✅ [as] Assamese   (অসমীয়া     ) | Keys: 1974/1974 | Script: 99.0% | Contaminated: 0 | Empty: 0
✅ [ur] Urdu       (اردو        ) | Keys: 1974/1974 | Script: 100.0% | Contaminated: 0 | Empty: 0

------------------------------------------------------
🎉 ALL 13 LANGUAGES & SOURCE CODE PASS: 100% key parity, zero leakage, zero contamination!
```

---

## 4. Key Architectural Safeguards

1. **Separation of Concerns:**
   `t(key, vars)` handles linguistic lookup and interpolation; presentation formatters (`fmtInteger`, `fmtNumber`, `fmtDate`) handle numeral and date formatting according to user locale and numeral preference.
2. **Context Fallback:**
   Components like `BarChart` and `States` safely access translation context with defensive fallbacks, preventing crashes in isolated unit test harnesses or storybook previews.
3. **Zero Mixed-Language UI:**
   When an Indic language is active, navigation, buttons, dates, numerals, tooltips, dialogs, and ARIA attributes reflect that language exclusively.
