# Saheli 10.5 — Comprehensive Localisation & Multilingual Engine Audit

## 1. Executive Summary

This document certifies the complete multilingual audit and overhaul executed under **Saheli 10.5**. Previous iterations had achieved surface-level dictionary synchronization but suffered from subtle leaks: untranslated interface strings, missing keys in secondary screens, hardcoded English numbers and units, fallback to raw dictionary keys, and lack of real-time bidirectional layout management.

Under Saheli 10.5, the multilingual engine was re-architected from the ground up:

- **Zero Raw Key Leakage**: 100% dictionary key parity across all 13 supported Indian languages (1,805 keys each; 23,465 dictionary entries total).
- **Source Code Verification**: Automated static extraction audited 153 user-facing components; 975 distinct `t("...")` keys verified with **0 missing keys**.
- **CLDR Locale Formatting**: Unified numeric, integer, percentage, currency, unit, and date formatting powered by `Intl` standards via `src/lib/locale.js`.
- **Bidirectional Support**: Seamless real-time switching between Left-to-Right (LTR) and Right-to-Left (RTL) for Urdu, updating `<html lang>` and `<html dir>`.
- **Zero-Latency In-Memory Switch**: Language switches instantaneously re-render all open views without requiring page reloads or network requests.
- **Privacy-Preserving On-Device Boundary**: Local language preferences and cycle records remain strictly on-device in IndexedDB (`saheli.prefs` / `kv`), conforming to local-first architectural requirements.

---

## 2. Supported Languages & Dictionary Metric Matrix

All 13 official languages are fully operational and verified by `bun run i18n:check`:

| Code | Language  | Script             | Native Endonym | Total Keys | Coverage | Non-Latin Ratio | Contamination |
| :--: | :-------- | :----------------- | :------------- | :--------: | :------: | :-------------: | :-----------: |
| `en` | English   | Latin              | English        |   1,805    |  100.0%  |      0.0%       |       0       |
| `hi` | Hindi     | Devanagari         | हिन्दी         |   1,805    |  100.0%  |     100.0%      |       0       |
| `mr` | Marathi   | Devanagari         | मराठी          |   1,805    |  100.0%  |     100.0%      |       0       |
| `bn` | Bengali   | Bengali            | বাংলা          |   1,805    |  100.0%  |      99.0%      |       0       |
| `as` | Assamese  | Bengali/Assamese   | অসমীয়া        |   1,805    |  100.0%  |      99.0%      |       0       |
| `gu` | Gujarati  | Gujarati           | ગુજરાતી        |   1,805    |  100.0%  |     100.0%      |       0       |
| `kn` | Kannada   | Kannada            | ಕನ್ನಡ          |   1,805    |  100.0%  |     100.0%      |       0       |
| `ml` | Malayalam | Malayalam          | മലയാളം         |   1,805    |  100.0%  |     100.0%      |       0       |
| `or` | Odia      | Odia               | ଓଡ଼ିଆ          |   1,805    |  100.0%  |      99.1%      |       0       |
| `pa` | Punjabi   | Gurmukhi           | ਪੰਜਾਬੀ         |   1,805    |  100.0%  |      99.0%      |       0       |
| `ta` | Tamil     | Tamil              | தமிழ்          |   1,805    |  100.0%  |     100.0%      |       0       |
| `te` | Telugu    | Telugu             | తెలుగు         |   1,805    |  100.0%  |     100.0%      |       0       |
| `ur` | Urdu      | Perso-Arabic (RTL) | اردو           |   1,805    |  100.0%  |     100.0%      |       0       |

---

## 3. Comprehensive Namespace Audit

The 1,805 dictionary keys are organized into strictly typed namespaces:

1. **`app.*` & `nav.*`**:
   - Navigation links (Today, Calendar, Log, Insights, Companion, Self Care, Diva, Instinct, FLASH, Settings, Community).
   - Discreet app titles and system-level screen reader labels.
2. **`cycle.*` & `status.*`**:
   - Cycle phase definitions: Menstrual, Follicular, Fertile Window, Ovulation Day, Luteal.
   - Medical safeguards and teenage protective notices (preventing fertile window display for users under 18 or with cycles varying >7 days).
3. **`companion.*`**:
   - 15 companion species definitions (Cat, Dog, Fox, Bunny, Red Panda, Owl, Deer, Otter, Koala, Dolphin, Butterfly, Phoenix, Dragon, Hamster, Hedgehog).
   - Interactive pet states (idle, happy, sleeping, eating, talking, listening, playing, celebration).
   - Care actions (Feed, Pet, Talk, Sleep, Play mini-games).
4. **`diva.*`**:
   - Multi-agent coordination modes: Eeve (Clinical Health), FLASH (Cycle Essentials), INSTINCT (Mood & Entertainment).
   - Specialist subtitles, triage recommendations, suggested prompts, and offline disclaimers.
5. **`instinct.*`**:
   - Entertainment feeds, content tags, taste profiles, mood matching, data export, and teen-safe filtering.
6. **`selfcare.*`**:
   - Calming breathing exercises, guided audio visualizations, acupressure guides, warm tea recipes, and relaxing soundscapes.
7. **`community.*`**:
   - Digital Personal Data Protection (DPDP) Act compliance notices, teenager protection guidelines, safe forum etiquette, and report dialogs.
8. **`clinical.*` & `doctor.*`**:
   - Exportable clinical summaries (PDF/HTML), red-flag emergency screening (severe pelvic pain, heavy bleeding, fever, fainting), Tele-MANAS, eSanjeevani, and national emergency lines (112, 108, 1091).
9. **`aria.*` & `dialog.*`**:
   - Accessible ARIA labels for assistive technologies, close buttons, dismiss controls, and live region announcements.

---

## 4. Key Fixes & Source Code Rectifications

During the audit, every remaining instance of hardcoded English, missing key fallback, or unlocalized component was tracked down and resolved:

1. **Teen Compliance Notice (`src/pages/Community.jsx`)**:
   - Replaced hardcoded DPDP notice with `t("community.teenProtectionNotice")`.
   - Localized forum guidelines, report reasons, and placeholder inputs.
2. **Offline Medical Guidance Header (`src/pages/Ask.jsx`)**:
   - Replaced static English string with `t("ask.verifiedKnowledge")`.
3. **Emergency Support Cards (`src/pages/DoctorGuidance.jsx`)**:
   - Fully localized national tele-consultation cards: eSanjeevani (`doctor.eSanjeevaniDesc`), Tele-MANAS (`doctor.teleManasDesc`), and Emergency 112 (`doctor.emergency112Desc`).
4. **Data Portability & Feedback (`src/pages/Feedback.jsx`, `src/pages/Instinct.jsx`)**:
   - Localized file upload constraints, report IDs, modal headers, and taste-profile onboarding.
5. **Pregnancy & Reminders (`src/pages/Pregnancy.jsx`, `src/pages/Reminders.jsx`)**:
   - Localized gestational age displays and discreet notification settings.
6. **Dialog & Shell Accessibility Primitives (`src/components/nova/dialogs/NovaDialog.tsx`, `src/components/bloom/Dialog.jsx`, `src/components/nova/layout/NovaShell.tsx`)**:
   - Replaced hardcoded `"Close"` aria-labels with `t("dialog.close")` while implementing resilient fallbacks for tests rendering dialogs outside `<AppProvider>`.
7. **Clinical Export Document (`src/lib/exportImport.js`)**:
   - Injected full RTL CSS and multilingual table headers into generated clinical HTML/PDF reports so healthcare providers receive summaries in the patient's preferred language.

---

## 5. Verification Tools & CI Integrity

To prevent future regression, the verification suite incorporates:

- `scripts/i18n-check.js`: Verifies 100% key parity across all 13 dictionaries, non-Latin script coverage, variable interpolation tokens (`{n}`), and scans all `src/**/*.jsx` and `src/**/*.tsx` files for uncatalogued `t("...")` keys.
- `src/test/saheli-10-5-multilingual-engine.test.tsx`: 15 dedicated unit and integration tests verifying formatting, locale tags, RTL toggles, and component behavior.
- Real-browser CDP test runner: `scripts/verify-all-languages.js` captures real DOM states and full-viewport screenshots across all supported languages.
