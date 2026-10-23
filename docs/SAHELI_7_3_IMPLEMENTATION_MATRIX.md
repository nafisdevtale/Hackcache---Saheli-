# Saheli 7.3 — Implementation & Verification Matrix

**Virtual Companions, Health Conditions & Menstrual Phase Education**  
**Repository:** `remix-of-saheli-cycle-companion`  
**Feature Branch:** `feat/saheli-7-3-companion-conditions-phases`  
**Baseline:** Saheli 7.2 Verified Baseline

---

## 1. Feature Architecture & Module Matrix

| Module             | Requirement                          | Key Architectural Decisions & Safeguards                                                                                                                                                                                                                                   | Affected Files                                                                                                                                | Verification Method                                           |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **A: Companion**   | A1: Discoverable Navigation          | Accessible via Today card, More menu, and desktop navigation bar (`/companion`). 100% optional; skippable without affecting cycle features.                                                                                                                                | `src/routes/companion.jsx`<br>`src/pages/Companion.jsx`<br>`src/components/layout/Shell.jsx`<br>`src/pages/Today.jsx`<br>`src/pages/More.jsx` | Browser nav test + routing unit test                          |
| **A: Companion**   | A2: Exactly 15 Pets                  | Original procedural/SVG character artwork in Saheli warm palette. Exactly 15 animals: Cat, Dog, Rabbit, Fox, Panda, Bear, Koala, Hamster, Hedgehog, Penguin, Butterfly, Turtle, Owl, Otter, Frog. Not reliant on raw system emoji.                                         | `src/content/pets.js`<br>`src/components/companion/PetArtwork.jsx`                                                                            | Test verifying species catalogue count === 15 & SVG rendering |
| **A: Companion**   | A3: Naming & Customisation           | Unicode name support in 13 languages, length bounds (1–30 chars), renaming, 4 habitat themes, 4 accessories, reset confirmation.                                                                                                                                           | `src/lib/companionStorage.js`<br>`src/pages/Companion.jsx`                                                                                    | Unicode input tests + name sanitisation unit tests            |
| **A: Companion**   | A4: Growth Without Penalties         | 4 stages (New, Growing, Established, Mature). Growth driven strictly by optional care activities & elapsed days. **Zero** dependency on period logging, symptoms, or health data. Zero streak penalties; pets never get sick/die/express distress upon absence.            | `src/lib/companionStorage.js`<br>`src/test/saheli-7-3-companion.test.js`                                                                      | Elapsed-time & absent-streak simulation tests                 |
| **A: Companion**   | A5: Care Activities                  | Fictional treats, play, rest, grooming, decorating, affection animations, toy selection. Accessible keyboard & touch controls, reduced motion support.                                                                                                                     | `src/pages/Companion.jsx`<br>`src/components/companion/CareActivities.jsx`                                                                    | Interactive action dispatch tests                             |
| **A: Companion**   | A6: Companion Behaviour              | 5 playful moods (Happy, Sleepy, Curious, Playful, Calm) based strictly on in-game actions. Never reflects user medical/cycle state. Non-medical gentle encouragement.                                                                                                      | `src/lib/companionStorage.js`<br>`src/content/pets.js`                                                                                        | State transition tests                                        |
| **A: Companion**   | A7: Local Persistence                | Stored on-device in `saheli_companion_data`, completely decoupled from clinical records. Reset/deletion available. Zero remote transmission.                                                                                                                               | `src/lib/companionStorage.js`                                                                                                                 | Storage isolation & reset unit tests                          |
| **B: Conditions**  | B1: Optional Onboarding              | New optional onboarding step with supportive copy: "You can share conditions previously diagnosed by a healthcare professional...". Continue, Skip, Prefer not to say, Edit later.                                                                                         | `src/components/onboarding/OnboardingFlow.jsx`<br>`src/pages/Settings.jsx`                                                                    | Onboarding flow unit tests                                    |
| **B: Conditions**  | B2: Catalogue & Sources              | Plain-language definitions for 11 categories (Dysmenorrhea, PMS, Heavy Bleeding, Fibroids, PCOS, Hypothyroidism, Endometriosis, Adenomyosis, Thyroid-related concerns, Bleeding disorder, Other). Clinical review: PMOS excluded as unverified. Linked to trusted sources. | `src/content/conditions.js`<br>`src/content/sources.js`                                                                                       | Clinical catalogue test + PMOS exclusion check                |
| **B: Conditions**  | B3: Confirmation Status              | Explicit distinction: "Diagnosed by HCP", "Being evaluated by HCP", "Unsure / wants educational information", or "None known". No automated inferences from symptom logs.                                                                                                  | `src/lib/exportImport.js`<br>`src/components/onboarding/OnboardingFlow.jsx`                                                                   | Schema validation tests                                       |
| **B: Conditions**  | B4: Privacy & Isolation              | Stored inside encrypted record (`record.healthConditions`), export/import preserved, zero transmission to FLASH or remote AI without explicit consent, no Community sharing, no lockscreen leakage.                                                                        | `src/lib/exportImport.js`<br>`src/server/api/ai.ts`<br>`src/lib/flashRecommender.js`                                                          | Privacy leakage & round-trip tests                            |
| **B: Conditions**  | B5: Non-Diagnostic Personalisation   | Surfaces contextual education cards in Learn/Insights based on selected conditions. No automatic drug, diet, or treatment recommendations. Can be disabled by user.                                                                                                        | `src/pages/Insights.jsx`<br>`src/pages/Learn.jsx`                                                                                             | Condition-driven educational card tests                       |
| **C: Phases**      | C1 & C2: Phase Definitions & Cards   | Dedicated Follicular and Luteal phase cards. Follicular: Day 1 to ovulation. Luteal: post-ovulation to before next period. Clear descriptions, biological changes, individual variation, medical citations (ACOG/NHS).                                                     | `src/content/cyclePhases.js`<br>`src/components/cycle/PhaseCards.jsx`                                                                         | Clinical content & definition tests                           |
| **C: Phases**      | C3: Safe Personalised Phase Handling | Conservative bounds: adolescents (<18) and irregular cycles (>7d variation) show standard educational cards with explicit message: "Your current phase cannot be estimated reliably from the available records."                                                           | `src/lib/cycle.js`<br>`src/components/cycle/PhaseCards.jsx`                                                                                   | Adolescent & irregular history unit tests                     |
| **C: Phases**      | C4: Estimated Visualisation          | Regular adult cycles: labeled as _estimated_, discloses number of completed cycles, notes uncertainty, updates dynamically on record change, never contraception advice. No day-14 rigid assumptions.                                                                      | `src/lib/cycle.js`<br>`src/pages/Insights.jsx`<br>`src/pages/Today.jsx`                                                                       | Recalculation & uncertainty tests                             |
| **C: Phases**      | C5: Cycle Consistency                | Consistent states across Today, Calendar, RhythmRing, Insights, and Phase Cards. Pregnancy mode and paused tracking preserved.                                                                                                                                             | `src/pages/Today.jsx`<br>`src/pages/Calendar.jsx`<br>`src/components/cycle/RhythmRing.jsx`                                                    | Multi-page state consistency tests                            |
| **D: Boundaries**  | Information Boundaries               | Strict separation between Companion (gameplay), Conditions (private clinical history), and Phase Cards (bounded education). Zero cross-contamination.                                                                                                                      | `src/lib/storage.js`<br>`src/lib/exportImport.js`                                                                                             | Boundary isolation tests                                      |
| **E: i18n & a11y** | 13 Languages & Accessibility         | 100% key parity across all 13 languages (En, Hi, Mr, Bn, As, Gu, Kn, Ml, Or, Pa, Ta, Te, Ur). Urdu RTL support. Touch, keyboard, ARIA, reduced-motion.                                                                                                                     | `src/i18n/*.js`<br>`scripts/i18n-check.js`                                                                                                    | `bun run i18n:check` + ARIA inspection                        |
| **F & G: Tests**   | Synthetic Testing & Journeys         | Comprehensive automated suites for companion, conditions, phases, and regression.                                                                                                                                                                                          | `src/test/saheli-7-3-*.test.js`                                                                                                               | `bun test` across 30+ files                                   |
| **H: CI & Docs**   | Release Verification                 | Prettier, ESLint, i18n parity, Vitest suite, Vite build, release audit documents.                                                                                                                                                                                          | Documentation files in `docs/`                                                                                                                | Full GitHub CI script pass                                    |

---

## 3. Verification & CI Results (Executed & Passed)

- **Test Suite Pass**: 352 passing tests across 31 files (12,470 expectations, 0 failures).
- **Internationalization**: 13/13 languages pass with 100% key parity (1,329 keys) and zero script cross-contamination.
- **Code Style (Prettier)**: Clean check across all repository files.
- **Linter (ESLint)**: 0 errors, 0 warnings.
- **Production Build (Vite & Nitro)**: Clean client and server bundles produced without warnings.

1. **Step 1: Module A (My Saheli Companion)**
   - Define 15 pets catalogue with attributes and bespoke SVG artwork in `src/content/pets.js` and `src/components/companion/PetArtwork.jsx`.
   - Implement storage manager `src/lib/companionStorage.js` with growth algorithm, mood handling, and zero-medical-data isolation.
   - Build companion screen `src/pages/Companion.jsx` with care activities (fictional treats, grooming, play, rest, affection, habitat, accessories) and route `src/routes/companion.jsx`.
   - Integrate entry points in `Shell.jsx`, `Today.jsx`, and `More.jsx`.
2. **Step 2: Module B (Optional Health Conditions Questionnaire)**
   - Define verified conditions catalogue in `src/content/conditions.js` (including rejection/exclusion of unverified "PMOS").
   - Update `record` schema in `src/lib/exportImport.js` to include `healthConditions: { list: [], statusMap: {}, notes: "", personalisationEnabled: true }`.
   - Add optional step in `src/components/onboarding/OnboardingFlow.jsx`.
   - Add condition management, editing, and deletion in `src/pages/Settings.jsx`.
   - Connect non-diagnostic educational links in `Insights.jsx` and `Learn.jsx`.
3. **Step 3: Module C (Follicular & Luteal Phase Cards)**
   - Define educational content, biological changes, and medical references in `src/content/cyclePhases.js`.
   - Update `src/lib/cycle.js` with conservative, bounded phase calculations and explicit suppression reasons (`adolescent_safeguard`, `irregular_cycles`, `insufficient_history`, `pregnancy_mode`, `tracking_paused`).
   - Create `src/components/cycle/PhaseCards.jsx` with educational vs estimated status displays.
   - Integrate phase cards into `Today.jsx`, `Calendar.jsx`, and `Insights.jsx`.
4. **Step 4: Module D, E & i18n Translation Matrix**
   - Add all translation keys to `src/i18n/en.js` and across all 12 regional languages (`as`, `bn`, `gu`, `hi`, `kn`, `ml`, `mr`, `or`, `pa`, `ta`, `te`, `ur`).
   - Verify 100% key parity via `bun run i18n:check`.
5. **Step 5: Testing & Acceptance Verification**
   - Write comprehensive test suites:
     - `src/test/saheli-7-3-companion.test.js`
     - `src/test/saheli-7-3-health-conditions.test.js`
     - `src/test/saheli-7-3-cycle-phases.test.js`
   - Run full regression suite (`bun test`).
6. **Step 6: CI, Release Audit & Delivery**
   - Create documentation:
     - `docs/SAHELI_7_3_COMPANION_IMPLEMENTATION.md`
     - `docs/SAHELI_7_3_HEALTH_CONDITIONS.md`
     - `docs/SAHELI_7_3_CYCLE_PHASE_EDUCATION.md`
     - `docs/SAHELI_7_3_FINAL_ACCEPTANCE.md`
   - Run Prettier, ESLint, i18n checks, build.
   - Commit, push, and verify remote CI.
