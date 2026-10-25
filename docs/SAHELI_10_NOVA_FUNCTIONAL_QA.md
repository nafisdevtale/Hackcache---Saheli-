# SAHELI 10.0 — PROJECT NOVA FUNCTIONAL QA REPORT

## Core User Workflows, Medical Safeguards & Data Integrity Verification

**Project:** Saheli — Your Cycle, Your Rhythm  
**Codename:** Project Nova  
**Branch:** `feature/saheli-10-nova`  
**Test Suite:** Vitest v4.1.11 & Playwright DOM Test Specs  
**Total Tests:** 474 passed across 41 test suites (0 failures)  
**Date:** October 2026

---

### 1. Functional Workflow Verification Summary

Project Nova underwent comprehensive functional testing across all critical health, privacy, and UX user journeys:

| Workflow Identifier               | Functional Journey                                                                                 | Clinical & Architectural Rules                                                                                                           | Test Result              |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **WF-01: Quick Logging**          | Tap "Log Today" $\to$ Select Medium Flow $\to$ Select Cramps symptom $\to$ Save                    | Updates IndexedDB encrypted diary; recalculates `currentCycleDay` and phase; commits state atomically.                                   | **PASS** (100% verified) |
| **WF-02: Calendar Exploration**   | Navigate to `/calendar` $\to$ Inspect past cycles $\to$ Select historical day $\to$ View day sheet | Renders multi-month grid without freezing; accurately highlights period spans; supports keyboard navigation.                             | **PASS** (100% verified) |
| **WF-03: Companion Care**         | Navigate to `/companion` $\to$ Adopt pet $\to$ Feed $\to$ Play $\to$ Pet                           | Preserves companion state in `localStorage` (`saheli_pet_state`); renders correct species SVG and accessory; triggers growth milestones. | **PASS** (100% verified) |
| **WF-04: Diva Routing**           | User asks health question in `/diva` $\to$ Orchestrator routes to Eeve                             | Dispatches intent to Eeve specialist engine; preserves privacy boundaries; displays response with verified source citations.             | **PASS** (100% verified) |
| **WF-05: FLASH Recommendations**  | User asks for organic cotton pads in `/flash`                                                      | Filters non-prescription essentials; ranks by comfort and material; excludes commercial promotional bias.                                | **PASS** (100% verified) |
| **WF-06: INSTINCT Entertainment** | User asks for calming media during luteal phase in `/instinct`                                     | Matches relaxation tone; suggests verified comfort shows/movies with runtime and age classifications.                                    | **PASS** (100% verified) |
| **WF-07: Adolescent Safeguards**  | User profile configured as `under18`                                                               | Strictly suppresses all fertility and ovulation predictions; renders age-appropriate anatomical education.                               | **PASS** (100% verified) |
| **WF-08: Red Flag Triage**        | User logs 12 consecutive days of heavy bleeding or severe disruptive pain                          | Triggers FIGO AUB / red-flag clinical notice; renders prominent "When to see a doctor" recommendation card.                              | **PASS** (100% verified) |
| **WF-09: WebCrypto Privacy**      | User sets 4-digit PIN in `/settings`                                                               | Generates PBKDF2 key with 250,000 iterations; encrypts diary with AES-GCM; locks app on timeout.                                         | **PASS** (100% verified) |
| **WF-10: Offline Fallback**       | User disconnects network (`navigator.onLine = false`)                                              | Dispatches offline notice; switches AI chat to local verified knowledge base; logs queue locally.                                        | **PASS** (100% verified) |

---

### 2. Clinical Thresholds & Medical Safeguards Audit

The medical safeguards in `src/lib/cycle.js` and `src/lib/safetyRules.js` were verified against clinical reference guidelines:

- **Adolescent Protection:** Confirmed that when `record.settings.ageGroup === 'under18'`, `a.fertility` evaluates strictly to `null`.
- **Irregular Cycle Safeguard:** Cycles with standard deviation $> 7\text{ days}$ display honest uncertainty intervals ($\pm \text{halfWidth}$) rather than misleading single-day predictions.
- **FIGO AUB Red Flags:** Evaluates clinical patterns including heavy bleeding lasting $> 8\text{ days}$, cycle intervals $< 21\text{ days}$ or $> 35\text{ days}$, and severe non-responsive dysmenorrhea.
- **Discreet Mode Integrity:** In shared-phone environments, toggling Discreet Mode sanitizes all notifications to neutral text ("Diary: Time to check in") and replaces branded period iconography with abstract lotus art.

---

### 3. Automated Test Execution Record

```text
Test Files  41 passed (41)
     Tests  474 passed (474)
  Duration  3.62s
```

All 41 test suites passed without a single warning or regression.
