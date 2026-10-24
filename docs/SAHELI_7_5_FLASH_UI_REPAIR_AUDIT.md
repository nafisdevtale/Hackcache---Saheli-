# SAHELI 7.5 — FLASH UI Repair & Functional Audit

**Date:** 2026-10-24  
**Component:** `src/pages/FlashEssentials.jsx`, `src/lib/flashRecommender.js`, `src/content/products.js`  
**Auditor:** Antigravity Engineering

---

## 1. Executive Summary

A comprehensive functional and UI audit of FLASH was conducted against user requirements, accessibility standards, and the local-first privacy architecture. While the initial prototype established basic card layouts and deterministic scoring, several critical functional gaps and UI friction points were identified.

---

## 2. Identified Defects & Functional Gaps

| ID        | Component / Area              | Defect / Limitation                                                                                                                                                                                           | Impact                | Planned Resolution in 7.5                                                                                                                                                  |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI-01** | Personalisation Toggle        | `state.preferences.personalisationEnabled` existed in state but had no UI toggle control on the screen. Users could not switch to 100% Anonymous/General mode without manual state manipulation.              | Privacy & Autonomy    | Add prominent, accessible switch to toggle between "Personalised Essentials" and "General Safe Mode (Anonymous)".                                                          |
| **UI-02** | Budget Selection              | Budget was restricted to a static HTML dropdown with only 4 presets (100, 300, 600, 1500 INR).                                                                                                                | User Customization    | Provide an interactive continuous range slider (₹50 to ₹2,500) paired with quick preset chips for instant adjustment.                                                      |
| **UI-03** | Sort Controls                 | No sorting mechanism existed. Recommendations were locked to score descending, with no user override.                                                                                                         | Discovery & Usability | Implement explicit multi-criteria sorting: (1) AI Relevance / Learned Score, (2) Price: Low to High, (3) Price: High to Low, (4) Verification Freshness.                   |
| **UI-04** | Comparison Drawer             | The comparison button only appeared if 1+ items were checked, but was disabled at 1 item with no helper tooltip. Inside the modal, users could not remove an individual item, swap items, or compare 3 items. | Feature Usability     | Redesign comparison workflow with floating action pill, support for 2-3 items, visual attribute diff highlighting, and per-item remove controls.                           |
| **UI-05** | Product Detail & Transparency | Cards clamped descriptions to 2 lines and sliced materials to 3 items. Detailed contraindications, clinical limitations, and care instructions were inaccessible unless expanded in rationale.                | Safety & Education    | Add a dedicated "View Full Details" modal/sheet displaying full material composition, care instructions, quality certifications, contraindications, and price audit trail. |
| **UI-06** | Category Navigation           | Category filter buttons lacked product counts and active indicator clarity.                                                                                                                                   | Navigation            | Display dynamic product counts on each category chip based on current active filters.                                                                                      |
| **UI-07** | Saved Bag Portability         | Saved items tab ("My Bag") only allowed individual removal or clearing all; users could not copy a text summary of essentials or export the checklist.                                                        | Practical Utility     | Add "Copy Essentials List" and "Export Bag" actions to clipboard/text format for sharing or shopping offline.                                                              |
| **UI-08** | Offline / Market Indicator    | No indication was given whether prices were sourced from real-time market cache or verified offline baseline.                                                                                                 | Transparency          | Add a status indicator banner indicating "Live Market Cache" or "Offline Verified Baseline" with timestamp.                                                                |
| **UI-09** | Recommendation Feedback       | No feedback loop existed to capture user satisfaction with recommendations.                                                                                                                                   | Model Improvement     | Introduce local-only, zero-telemetry feedback ("Was this helpful? 👍 / 👎") recorded strictly in local storage.                                                            |
| **UI-10** | Search Usability              | Search query was sensitive to trailing whitespace and lacked instant query clearing keyboard shortcuts (Escape key).                                                                                          | Usability             | Add trimmed normalization, clear button, and accessible result count announcements.                                                                                        |

---

## 3. Verification & Acceptance Criteria

1. All interactive elements (toggles, sliders, buttons, dropdowns, modals) must respond within <50ms without layout shift.
2. Full keyboard accessibility (Tab, Enter, Space, Escape to dismiss modals).
3. 100% test coverage for recommender rules, market provider caching, and UI workflows.
4. Multilingual text availability across all 13 supported Indian languages.
