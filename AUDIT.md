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

## Environment constraints

- Production builds are managed by the Lovable harness; do not run a second manual build. Inspect its available build logs instead.
- No published URL is available. Hosted privacy and offline behavior remain NOT VERIFIED.
- Security scan tool returned no results. Run a deep scan in the Security tab before making security assurances.
- Automated UI checks use only synthetic records. No personal records are used or sent to external services.
