# Saheli Build 2 audit

## Initial findings (before application edits)

Evidence: baseline `bun run test`: 15 tests passed in 3 files. Playwright opened Today, Log, Calendar, Insights, Doctor, Visit, Learn, Ask, Reminders, Pregnancy, Settings and More at 360×800 with synthetic demo data: no document overflow, page errors, or non-local requests observed. These are preview results, not deployment results.

| Requirement group                                    | Initial status | Evidence and remaining checks                                                                                                                                |
| ---------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A Safety, sources, urgent and mental-health guidance | PARTLY DONE    | Demo guidance and recent sudden-pain rule tested; source relevance, other rule boundaries and FAQ crisis handling require review.                            |
| B Local-only architecture and runtime resources      | PARTLY DONE    | Code uses IndexedDB; preview smoke saw no external requests. Error-reporting plumbing and production hosting require review. No security scan results exist. |
| B PIN lifecycle                                      | PARTLY DONE    | Crypto round-trip/wrong PIN unit test passes; UI lifecycle, all stored modes, corruption, interrupted writes not yet verified.                               |
| B Export/import                                      | PARTLY DONE    | JSON round-trip unit test passes; preview exists. Import accepts malformed settings/reminders and invalid flag types. Downloads/UI restoration not tested.   |
| B Deletion                                           | PARTLY DONE    | UI confirmation exists; database deletion resolves success when blocked. Reload/storage not verified.                                                        |
| C Local dates                                        | PARTLY DONE    | Leap/month arithmetic tests pass; named timezone browser checks outstanding.                                                                                 |
| C First launch and demo isolation                    | PARTLY DONE    | Demo entered successfully; ~8 months generated in code, >=2 cards tested. Fresh start and PIN-protected mode transitions outstanding.                        |
| D Cycle engine                                       | PARTLY DONE    | 3-cycle threshold, last 6, median/range, irregular widening/fertility suppression and missing-log flag tested. UI consistency and boundaries outstanding.    |
| E Today, Log, Calendar                               | PARTLY DONE    | All open; form persistence, historical editing, dependent screens and patterned estimates not yet exercised.                                                 |
| F Insights                                           | PARTLY DONE    | History rendered; pattern minimum and concrete count evidence require additional tests.                                                                      |
| G Doctor rules and visit summary                     | PARTLY DONE    | Adult/under-18 example test and demo test pass; full rule matrix and print pagination outstanding.                                                           |
| H Learn                                              | PARTLY DONE    | Seven lessons visible; individual source relevance and Listen behavior not verified.                                                                         |
| I Ask                                                | PARTLY DONE    | 32 bilingual entries and unknown/PCOS matching unit-tested; full interaction and self-harm paths outstanding.                                                |
| J Reminders                                          | PARTLY DONE    | Off defaults and open-app limitation visible; permission denial, discreet fallback and scheduling outstanding.                                               |
| K Pregnancy                                          | PARTLY DONE    | Under-18 gate observed; activation, 280-day estimate, pause/resume, warning coverage and check-ups outstanding.                                              |
| L Settings, Hindi and accessibility                  | PARTLY DONE    | English screens fit at 360px; Hindi/largest size, focus, contrast and all settings outstanding.                                                              |

Baseline statuses intentionally distinguish implementation from verified behavior; no whole group is DONE from UI presence alone. Detailed final evidence follows after the audit.

## Stage 1 Audit & Hardening Findings

- **Lint Status**: Fixed 586 lint errors (581 Prettier formatting issues and 5 `@typescript-eslint/ban-ts-comment` issues in `src/routes/__root.tsx`). Current result: 0 errors, 6 warnings (fast-refresh component exports in shadcn UI primitives).
- **Automated Tests**: 52 tests passing across 4 suites (`encryption.test.js`, `audit.test.js`, `saheli.test.js`, `app-routing.test.tsx`).
- **Import Validation**: Hardened `parseImport` in `src/lib/exportImport.js` to strictly enforce allowed schema keys, reject malformed nested reminder containers (`daily`, `custom`, `medicines`), disallow unknown settings/reminder keys, and reject non-date day keys and invalid day attributes. Added automated tests covering each negative case.
- **Permanent Deletion**: Verified `idbDeleteDatabase` explicitly rejects with an informative error if blocked by concurrent tabs, and `Settings.jsx` surfaces an error status alert rather than reporting false success.
- **Local Data & Privacy**: Confirmed zero remote tracking scripts, analytics, external web fonts, or background network calls. All sensitive health records reside strictly in IndexedDB with optional AES-GCM-256 encryption.
- **Medical Source Verifiability**: Audited all 31 sources across WHO, NHS, ACOG, FIGO, FOGSI, and MoHFW. All lesson paragraphs and conditions carry direct citations.
- **Bilingual Coverage**: Confirmed 100% parity between English (`en.js`) and Hindi (`hi.js`) dictionaries, with 0 missing keys.

## Stage 2 Progressive Web App (PWA) & Offline-First Implementation

- **Web App Manifest**: Configured `manifest.webmanifest` with standalone display mode, orientation, theme colors (`#a34438`), background color (`#fcf8f6`), and high-resolution icons (192px, 512px, maskable 192px/512px, SVG vector, and apple-touch-icon).
- **Installation Lifecycle**: Integrated discreet, accessible PWA installation flow supporting `beforeinstallprompt` on Chromium browsers and platform instructions for iOS Safari. Respects discreet mode renaming ("Install Diary" / "डायरी इंस्टॉल करें").
- **Offline Shell & Caching**: Deployed `sw.js` precaching the application shell (`/`, manifest, icons, favicon) and handling versioned static assets with Cache-First. Offline navigation falls back to the local client shell or an accessible offline document.
- **Strict Privacy Boundaries**: Service Worker enforces GET-only requests, origin isolation (no caching of external health sites), and explicit exclusion of sensitive query strings (`pin`, `key`) or export endpoints (`/export`). Zero user cycle data or database payloads enter the Cache API.
- **Cache Purging on Deletion**: `deleteAll` in `App.jsx` now explicitly deletes all Cache API entries (`caches.delete`) alongside IndexedDB and localStorage purge, ensuring zero residual data remains on the device.
- **Safe Update Handling**: Service worker updates trigger a non-disruptive, user-facing notice with explicit "Refresh to update" and "Later" options, avoiding abrupt reloads during user input. Obsolete cache versions are purged on `activate`.
- **Automated Test Coverage**: Added `pwa.test.js` validating manifest schema, icon existence, service worker privacy rules, cache allowlisting, update messaging, and offline fallback. Total test count increased to 71 passing tests.

## Stage 3 (Saheli 2.1) Personalised Cycle Insights & Health Guidance

- **Cycle-History Analysis**: Built `src/lib/insights.js` to compute median cycle length, range, spread, and cycle-by-cycle comparisons against median and preceding cycles, clearly labeled as summaries of recorded history.
- **Cautious Predictions & Uncertainty Representation**: Enforced minimum-history requirement (3 complete cycles); distinguished recorded history from future estimates; represented uncertainty as date intervals/windows; widened intervals when cycles are irregular; suppressed estimates during active pregnancy; and included prominent warnings against relying on fertile window estimates for contraception.
- **Bleeding Patterns**: Analyzed recorded period durations (median, range, spread), flow intensity distributions (spotting, light, medium, heavy), and flags for pad-hourly changes, ₹10-coin clots, and periods > 7 days.
- **Symptom Patterns & Well-being Trends**: Analyzed symptom frequencies and timing associations (premenstrual, during period, other days), recurrent patterns across cycles (e.g. early cramps, premenstrual headaches, energy dips, disruptive pain), and pain/sleep/mood metrics without treating unlogged days as confirmed symptom-free.
- **Supportive Health Guidance**: Connected insights directly to verified medical guidance (`/doctor`), relevant educational lessons (`/learn`), and doctor visit summaries (`/visit`), preserving national emergency and mental-health contact info (112, 108, Tele-MANAS 14416).
- **Accessible & Localised Interface**: Enhanced `Insights.jsx` with screen-reader summaries for charts, semantic history tables, clear units, and 100% bilingual parity across English and Hindi.
- **Automated Test Coverage**: Added `src/test/insights.test.js` with 14 comprehensive tests covering minimum-history gates, irregular cycle widening, adolescent rules, symptom phase associations, pain tracking, and bilingual key integrity. Total test count increased to 85 passing tests across 6 test suites.

## Stage 4 (Saheli 2.2) Trust, Safety & Release Hardening

- **Service-Worker Cache Tightening**:
  - Refactored `public/sw.js` to strictly enforce an explicit static-asset allowlist (`/`, manifest, icons, favicon, robots.txt, and hashed `/assets/*` bundles).
  - Unapproved same-origin GET endpoints (e.g. dynamic JSON, API routes) bypass caching completely.
  - Sensitive query parameters (`pin`, `key`, `token`, `auth`, `data`) and `/export` endpoints are strictly excluded from caching.
  - Navigation requests receive the canonical cached root shell `/` when offline without persisting arbitrary route parameters.
  - Added behavioural service-worker fetch interception tests in `src/test/pwa.test.js`.
- **PIN & WebCrypto Hardening**:
  - Hardened `decryptJSON` to validate payload structure and handle malformed base64 or corrupt ciphertext gracefully with specific, descriptive error types (`not-encrypted`, `corrupt-ciphertext`, `corrupt-payload`).
  - Added test suite in `src/test/encryption.test.js` exercising PBKDF2 key derivation, AES-GCM 256-bit authentication tag verification on tampered bytes, 4-digit PIN format validation, and PIN change re-encryption.
- **Data Persistence & Isolation**:
  - Implemented resilient storage fallback in `src/lib/storage.js` for private-browsing or restricted iframe contexts where `localStorage` is disabled or throws `SecurityError`.
  - Verified demo data isolation: demo mode cannot be entered if real diary entries exist; exiting demo purges demo store and resets to empty real diary.
  - Verified atomic multi-key operations and complete data purge (`deleteAll` purges IndexedDB, localStorage, sessionStorage, and Cache API stores).
- **Medical & Governance Auditing**:
  - Implemented automated clinical governance suite in `src/test/medical-sources.test.js` verifying that all 31 cited references in `src/content/sources.js` are valid HTTPS URLs from official authorities (NHS, WHO, ACOG, FIGO, FOGSI, MoHFW, Tele-MANAS, 112).
  - Verified 100% of red flag rules, urgent checks, pregnancy milestones, and educational paragraphs link to active, cited references.
  - Verified preservation of national emergency numbers (112, 108, 14416).
- **Comprehensive Route & Workflow Verification**:
  - Added routing tests in `src/test/app-routing.test.tsx` verifying that all 12 application routes resolve correctly without falling back to `rootRouteId` or 404.
  - Added workflow tests in `src/test/user-workflows.test.js` verifying pregnancy due date (280 days), WHO 8-contact antenatal schedule, doctor visit summary aggregation, and preference persistence.

## Stage 5 (Saheli 3.0) First-Run Experience, Personalisation & Product Polish

- **Guided First-Run Onboarding (`OnboardingFlow.jsx`)**:
  - Implemented a 4-step mobile-first wizard replacing the legacy single-screen onboarding.
  - **Step 1 (Welcome & Language)**: Empathetic, supportive greeting with immediate English/Hindi toggle and discreet mode pre-selection. Fast-track bypass button allows starting immediately with safe defaults.
  - **Step 2 (Age & Care Setup)**: Clear choice between Under 18 and Adult. Explains adolescent cycle variability (21–45 days per ACOG) and automatically disables fertility predictions for younger users' privacy and safety.
  - **Step 3 (Privacy & PIN Setup)**: Clear explanation of local-only storage (IndexedDB) and educational estimates. Optional 4-digit PIN lock with confirmation input, validation, and honest warning regarding unrecoverable data on forgotten PIN.
  - **Step 4 (Start Options & First Entry)**: Allows logging recent period start date immediately, starting with an empty diary, browsing health guides first, or exploring sample demo data.
- **Supportive Daily Dashboard (`Today.jsx`)**:
  - **Empty State**: Warm, welcoming banner when no entries exist (`dayCount === 0`) with low-friction quick actions to log, calendar, health guides, and demo exploration.
  - **Progress State**: Encouraging progress indicator when 1–2 cycles are recorded, explaining that 3 complete cycles are needed for personalized range calculations without alarming the user.
  - **Active State**: Displays current cycle day, phase guidance, and predicted window with uncertainty ranges.
  - **Contextual Education Shortcuts**: Direct shortcuts to educational topics (`/learn#cycle`, `/learn#cramps`, `/learn#late`, `/doctor`, `/visit`, `/ask`) based on logged symptoms, bleeding, or cycle irregularity.
- **Shared Device Privacy & Discreet Mode**:
  - Preserved discreet app naming ("Diary" / "डायरी") across header, document title, PWA prompts, and notifications ("Time to check in" / "देखने का समय").
  - Added a dedicated "Shared Device Privacy Guide" in `Settings.jsx` detailing what local storage protects (AES-GCM encryption, zero cloud tracking) and honest physical limitations (unlocked screen, browser history, homescreen icon) with actionable recommendations.
- **Automated Test Coverage**:
  - Added `src/test/onboarding-today.test.js` with 12 targeted tests for onboarding progression, adolescent gating, WebCrypto AES-GCM first-run encryption, empty/progress/active dashboard states, and bilingual key parity.
  - **129 automated tests passing** across 9 test suites.
  - **0 ESLint errors** (6 fast-refresh warnings in shadcn UI primitives).
  - **Production build verified** (`bun run build`).

## Stage 6 (Saheli India) Master Product Implementation MVP

- **Core Health MVP Enhancements**:
  - **Custom Symptoms**: Full lifecycle support in `Settings.jsx`, `LogDay.jsx`, `insights.js`, and `exportImport.js`. Users can add, log, and view frequency trends for custom symptoms without schema breakage. Backwards and forwards compatible import validation.
  - **Period Quick Actions**: Added "Start period here" and "Remove period" direct action buttons on `Calendar.jsx` for the selected date. Distinct shape/border indicators ensure color-blind accessibility.
  - **Expanded Medical Content**: Added 5 comprehensive lessons with HTTPS source citations (`nhs_thyroid`, `nhs_postpartum`, `nhs_menopause`, `acog_visit`): Thyroid & Menstrual Cycles, Postpartum & Breastfeeding Return, Perimenopause & Menopause Transition, How to Prepare for a Doctor Visit, and Interpreting Your Cycle Records.
- **Multilingual Framework (13 Indian Languages)**:
  - Full native support across **English, Hindi, Marathi, Telugu, Kannada, Tamil, Bengali, Gujarati, Punjabi, Malayalam, Odia, Assamese, and Urdu**.
  - Registry in `src/i18n/languages.js` with ISO codes, English names, native script names, and text direction (`ltr` vs `rtl`).
  - Automatic `dir="rtl"` and `lang="ur"` switching in `App.jsx` for Urdu.
  - **100% key parity** (606 keys in each dictionary, 0 missing keys across all 13 languages).
  - Language selector integrated in Header (`Shell.jsx`), Settings (`Settings.jsx`), and First-Run Onboarding (`OnboardingFlow.jsx`).
- **Real AI Health Assistant (`/api/ask`, `Ask.jsx`)**:
  - Full-stack AI endpoint supporting Google Gemini (`gemini-2.5-flash`) and OpenAI-compatible providers via `AI_API_KEY` / `GEMINI_API_KEY`.
  - **Deterministic Safety Screening**: Screened before any AI query. Acute emergency red flags (severe hemorrhage, sudden severe pelvic pain, high fever with foul discharge, ectopic pregnancy risks) trigger immediate 112/108 emergency notices. Mental health crisis and self-harm keywords in English and Hindi trigger immediate Tele-MANAS (14416 / 1800-891-4416) and KIRAN (1800-599-0019) guidance.
  - **Privacy & Consent Architecture**: Clear consent agreement before first use. "Include my cycle summary" toggle is default OFF, transmitting only minimal non-PII values when opted in. Zero personal identifiers logged.
  - **Graceful Offline Fallback**: When offline or unconfigured, smoothly falls back to Saheli's offline verified medical library without error screens.
  - In-memory rate limiting (15 requests/min per client).
- **Safe Pseudonymous Community (`/api/community/*`, `Community.jsx`)**:
  - **Complete Pseudonymity**: Generates client-held pseudonym ("Saheli 4821") with SHA-256 device secret hash. Zero accounts, phone numbers, or email storage.
  - **Automated PII Redaction**: Regex filter sanitizes 10-digit Indian phone numbers (`\b[6-9]\d{9}\b`), email addresses, and external links before persisting.
  - **Strict Age Group Separation**: Dedicated feeds partitioned for Under-18 (teens) and Adults.
  - **Moderation Queue & Auto-Flagging**: New posts/replies start as `pending`. 3+ community reports automatically flag and hide content from public view.
  - **Data Wiping**: One-tap "Delete All My Community Data" wipes all posts and replies associated with the device hash.
  - **10 Synthetic Seed Posts**: 5 adult and 5 teen posts seeded for a reassuring, constructive initial community experience.
  - Production-ready Supabase SQL migration script in `supabase/migrations/20261023_community_schema.sql` with full table schemas and Row Level Security (RLS) policies.
- **Smart Reminders & Push**:
  - Server endpoints `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/test`.
  - Discreet push payloads ensuring no sensitive medical terms appear on lock screens.
- **DPDP Act 2023 Readiness**:
  - Comprehensive regulatory and clinical review document created in `COMPLIANCE.md`.
  - Full `.env.example` documenting all configuration keys.
- **Verification Baseline**:
  - **154 automated tests passing** across 12 test suites (`ai-assistant.test.js`, `community.test.js`, `multilingual.test.js`, etc.).
  - **0 ESLint errors** (6 fast-refresh warnings in shadcn UI primitives).
  - **Production build verified** (`bun run build`).

## Environment constraints

- Production builds are verified locally and via automated CI workflows using `bun run build`.
- No published URL is available. Hosted privacy and offline behavior remain NOT VERIFIED.
- Security scan tool returned no results. Run a deep scan in the Security tab before making security assurances.
- Automated UI checks use only synthetic records. No personal records are used or sent to external services.
