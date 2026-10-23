# SAHELI 2.0 — Gap Analysis & Architectural Audit

**Generated:** 2026-10-23  
**Baseline Commit:** `907a60f`  
**Test Suite Baseline:** 162 tests passed (13 test files), 0 ESLint errors, Vite production build clean.

---

## Executive Summary

Saheli has a functional local-first foundation with client-side IndexedDB persistence, WebCrypto AES-GCM encryption, basic cycle calculations, PWA offline caching, and initial multilingual structures. However, to transform Saheli into a consumer healthcare product with clinical integrity, the following gaps must be systematically resolved:

1. **Visual System & Themes:** Missing dark mode variables in `src/styles.css` (only `:root` and `.hc` defined; no `.dark` theme block); palette needs alignment with the warm, dignified Indian healthcare tokens (Iris Purple, Dusty Rose, Soft Peach, Sage Green, Warm Ivory, Deep Ink).
2. **Onboarding Experience:** Current onboarding is a 4-step technical form lacking welcoming brand storytelling, privacy reassurances in simple terms, tracking goal selections, and flexible entry paths.
3. **Multilingual Architecture:** While dictionary keys exist, English/Hindi/Marathi translations require comprehensive natural-phrasing audit, UI label review, pluralization safety, and dynamic switching across every screen without hardcoded UI strings.
4. **Today Dashboard:** Currently displays technical stats; needs a warm, supportive, plain-language greeting, clear uncertainty communication on predictions, contextual doctor guidance cards, and explicit absence of fabricated ovulation precision.
5. **Interactive Calendar & Logger:** Logger needs swift category toggles, customizable symptom severity, and clear visual differentiation between confirmed logs vs estimated ranges using patterns and non-color cues.
6. **Health Intelligence & Educational Library:** Lessons and FAQs must have explicit medical source attribution ([`src/content/sources.js`](file:///Users/nafisdevtale/Documents/remix-of-saheli-cycle-companion/src/content/sources.js)), structured topic categories, reading progress, and verified citations (FOGSI, MoHFW, WHO, NHS, ACOG).
7. **Ask Saheli Modes:** Must clearly demarcate **Mode A (Private Local Knowledge Assistant)** operating 100% offline from **Mode B (Optional Remote AI Answers)** with explicit user consent and privacy boundaries.

---

## Area-by-Area Gap Matrix

| #   | Problem Statement Area                          | Current Implementation Status      | Identified Issues & Gaps                                                                                                                                                             | Proposed Solution                                                                                                                                   | Risk   | Priority | Verification Method                                                           |
| --- | ----------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| 1   | **Daily Cycle Tracking & Flow/Symptom Logging** | Partially Implemented              | Flow, pain, symptoms are logged in `src/pages/LogDay.jsx`, but UI lacks quick category filters, customizable severity indicators, and swift edit confirmations.                      | Redesign daily logger into structured, accessible categories with 44-48px touch targets, undo feedback, and instant save to IndexedDB.              | Low    | High     | Vitest unit tests on `saveDay`, touch target a11y checks.                     |
| 2   | **Cycle Prediction & Calendar**                 | Complete / Needs Polish            | Uses start-to-start median calculation (`src/lib/cycle.js`), but calendar cells lack distinct patterns for color-blind users and clear sparse-data explanations.                     | Implement `.predicted-pattern` CSS hatching, non-color symbols, and plain-language explanation when history < 3 cycles.                             | Medium | High     | Automated tests for sparse data (<3 cycles), irregular cycles, leap years.    |
| 3   | **Pattern Analysis & Insights**                 | Partially Implemented              | Basic cycle length chart and symptom list (`src/pages/Insights.jsx`). Lacks interactive timeline, mood summaries, energy trends, and plain-language question-answering format.       | Build purposeful visual analytics: cycle variability overview, symptom frequency breakdown, and accessible table alternatives.                      | Low    | Medium   | Responsive tests at 320px/360px, screen-reader text tables.                   |
| 4   | **Medical Red Flags & Doctor Guidance**         | Complete / Requires Medical Review | Red flags detect prolonged bleeding, severe pain, and teen-specific irregularity (`src/lib/safetyRules.js`). Rules are sound but need explicit source tags and age-band adaptations. | Ensure every guidance card links to verified sources (FOGSI, MoHFW), explains trigger plainly without diagnosing, and provides dismiss action.      | High   | Critical | Scenario testing against representative clinical vignettes.                   |
| 5   | **Doctor Visit Preparation**                    | Partially Implemented              | Generates summary in `src/pages/VisitSummary.jsx`. Needs fine-grained user redaction checkboxes before print/PDF, and privacy reminder that export stays strictly local.             | Add toggleable sections (symptoms, cycle history, personal notes) and clean A4 print styles.                                                        | Low    | Medium   | Print stylesheet verification and local PDF preview tests.                    |
| 6   | **Health Education & FAQ Library**              | Complete / Requires Medical Review | Rich content exists in `src/content/lessons.js` and `faq.js`. Needs topic filtering, reading progress, related lessons, and source registry links.                                   | Implement search, category pills, reading-time estimates, and explicit citations to MoHFW, WHO, and FOGSI.                                          | Medium | High     | Content audit tests verifying 100% citation coverage.                         |
| 7   | **Multilingual Localization (EN, HI, MR)**      | Partially Implemented              | English, Hindi, and Marathi dictionaries exist (606 keys), but need natural human phrasing, pluralization verification, and zero hardcoded English text in components.               | Expand namespaces, implement i18n quality tests (detecting hardcoded text, placeholder mismatches), and verify instant switching across all routes. | Medium | Critical | `bun run test` on `multilingual.test.js`, translation key comparison scripts. |
| 8   | **Offline-First Storage & Data Privacy**        | Complete / Verified                | Client-side IndexedDB with atomic transactions, PBKDF2/AES-GCM encryption, export/import, zero tracking.                                                                             | Preserve local-first architecture; add theme preference persistence, discreet mode polish, and clean migration paths.                               | Low    | Critical | Encryption roundtrip tests, data tamper checks, zero-network audit.           |
| 9   | **Ask Saheli (Health Assistant)**               | Partially Implemented              | Hardened API routes exist with emergency keywords. Needs clean UI separation: Mode A (offline local knowledge base) vs Mode B (optional AI assistant with explicit consent).         | Implement dedicated Mode A / Mode B toggle in `src/pages/Ask.jsx` with instant local answers for Mode A and transparent disclaimer for Mode B.      | High   | High     | Triage test suite covering red flags, emergency 112/108, Tele-MANAS 14416.    |
| 10  | **Accessibility, Theming & Responsiveness**     | Partially Implemented              | High contrast and font scaling exist. Missing dark mode theme variables, Devanagari font stack refinement, and 320px viewport layout hardening.                                      | Add complete `.dark` theme block in `src/styles.css` matching design tokens; refine touch targets to 44px+ and test at 320px/360px.                 | Low    | High     | Lighthouse accessibility audits, keyboard navigation verification.            |

---

## Baseline Verification State

- **Build Tool:** Vite 8.1.5 + TanStack Start + Nitro SSR
- **Runtime:** Bun 1.x
- **Test Framework:** Vitest 4.1.11 (162 tests passing across 13 suites)
- **Formatting:** Prettier (100% compliant)
- **Linting:** ESLint 9 (0 errors)
