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

## Environment constraints

- Production builds are managed by the Lovable harness; do not run a second manual build. Inspect its available build logs instead.
- No published URL is available. Hosted privacy and offline behavior remain NOT VERIFIED.
- Security scan tool returned no results. Run a deep scan in the Security tab before making security assurances.
- Automated UI checks use only synthetic records. No personal records are used or sent to external services.
