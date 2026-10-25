# Saheli 9.1 — Full Application UI/UX Renovation Specification

**Release:** Saheli 9.1 — Full Application UI/UX Renovation  
**Design Direction:** Modern Wellness Intelligence  
**Baseline Branch:** `feature/saheli-9-bloom` (tracking `origin/feature/saheli-9-bloom`, PR #1)  
**Date:** October 2026  
**Auditor & Architect:** Antigravity AI Engineering Team

---

## 1. Executive Mission & Problem Diagnosis

While Saheli 9.0 established foundational design tokens, CSS logical properties, genuine web fonts, and automated real-browser testing, the application interface still suffered from systemic compositional and layout issues identified in the audit:

1. **Excessive Blank Space & Uneven Distribution:**
   - On desktop and tablet viewports, pages left large, unbalanced empty gaps.
   - Many widgets rendered at arbitrary heights, creating ragged columns and mismatched baselines.
2. **Information Overcrowding & Visual Clutter:**
   - Multiple cards competed for attention without a single dominant primary action.
   - Essential daily actions (e.g., Quick Log, Calendar jump) were buried below secondary educational widgets.
3. **Inconsistent Component Hierarchy & Button Language:**
   - Buttons across screens used varying heights, corner radii, borders, and contrast ratios.
   - Interactive elements lacked uniform pressed, focus, and disabled states.
4. **Mobile Compression vs. Desktop Emptiness:**
   - Mobile screens felt compressed with stacked cards, while desktop viewports left vast empty lateral margins.
   - Tablet viewports (768px–1023px) awkwardly defaulted to mobile layouts with a detached floating dock.
5. **Divergent AI Interfaces:**
   - Eeve, FLASH, INSTINCT, and Diva each felt like distinct, disjointed tools rather than an integrated AI companion suite.

Saheli 9.1 executes a **complete, page-by-page visual rebuild** centered around **Modern Wellness Intelligence**.

---

## 2. Before-State Page-by-Page Audit Inventory

| Screen               | Key Before-State Defects                                                                           | Redesign Prescription (Saheli 9.1)                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Shell & Nav**      | Desktop sidebar had loose utility links; mobile dock was crowded; tablet defaulted to phone dock.  | Grouped 4-pillar sidebar (Rhythm, Sanctuary, AI Advisors, System); dedicated tablet adaptive rail; refined 5-anchor mobile dock. |
| **Today**            | Generic 2-column widget dump; RhythmRing separated from status; mismatched heights.                | Cohesive 4-tier dashboard: Hero Rhythm Card + Primary Action Bar + Wellness Duo + AI Intelligence Hub.                           |
| **Companion**        | Large empty sanctuary area; adoption grid cramped; floating stat badges collided with pet artwork. | Modern interactive sanctuary with compact growth meters, tactile care actions, clean habitat switcher, and species carousel.     |
| **Calendar**         | Day detail card disconnected from month grid; repetitive buttons.                                  | High-clarity 2-column responsive layout with integrated day detail sheet and phase indicators.                                   |
| **Log Day**          | Long unstructured vertical form; inputs lacked grouped visual cadence.                             | Streamlined 4-tab card structure (Flow & Cramps, Mood & Energy, Ovulation/Vitals, Daily Journal) with fixed action bar.          |
| **Insights**         | Ragged chart alignment; overwhelming statistical density without clear takeaway.                   | Executive summary cards with clinical variance tags, smooth CSS chart bars, and FIGO AUB indicator badges.                       |
| **Eeve**             | Empty chat canvas with tiny message bubbles; weak prompt chips.                                    | Premium health companion chat with contextual welcome state, grounded medical source cards, and ergonomic composer.              |
| **FLASH**            | Generic product list with awkward price tags; unrefined filter toggles.                            | Modern wellness marketplace with filter chips, verified price badges, comparison drawer, and transparent ML metrics.             |
| **INSTINCT**         | Irregular media poster aspect ratios; giant hero banners stretching layouts.                       | Cohesive entertainment lounge with standard 2:3 poster ratios, streaming provider tags, and mood-driven recommendations.         |
| **Diva**             | Looked like a secondary chat screen rather than central orchestrator.                              | Central executive assistant with specialist agent switcher, unified multi-agent response grouping, and follow-up cards.          |
| **Self Care**        | Loose cards with generic icons; audio player occupied excess height.                               | Calming sanctuary studio with integrated soundscape player, breathing rhythm circle, and curated self-care rituals.              |
| **Discover & Learn** | Dense text blocks with low typographic contrast.                                                   | Curated editorial wellness feed with reading time pills, category filters, and verified medical source links.                    |
| **Community**        | Plain form lists lacking warmth and community presence.                                            | Safe anonymous circles with privacy badges, supportive reaction chips, and clear safety rules.                                   |
| **Settings**         | Repetitive toggle list without visual grouping.                                                    | Grouped card layout: Privacy & Lock, Localization, Medical & Health Conditions, Reminders, Data Backup.                          |
| **Onboarding**       | Text-heavy steps; crowded checkboxes.                                                              | Elegant 6-step flow with progress bar, warm illustrations, and explicit local-first privacy reassurances.                        |

---

## 3. Preserved Invariants

In strict adherence to project rules, Saheli 9.1 preserves:

- 100% deterministic menstrual cycle mathematics and uncertainty calculations (`src/lib/cycle.js`).
- Adolescent safeguards (`adolescent_safeguard` blocking fertility estimates for users under 18).
- FIGO AUB clinical thresholds and red-flag emergency triage.
- 100% local-first IndexedDB storage with optional WebCrypto AES-GCM encryption.
- Multi-agent AI engine routing and personalization models (Eeve, FLASH, INSTINCT, Diva).
- 100% translation parity across all 13 Indian languages with full Urdu RTL support.
