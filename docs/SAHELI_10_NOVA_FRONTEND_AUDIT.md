# SAHELI 10.0 — PROJECT NOVA FRONTEND AUDIT

## Comprehensive Systematic Audit of Previous Frontend Limitations & Architectural Debt

**Project:** Saheli — Your Cycle, Your Rhythm  
**Codename:** Project Nova  
**Branch:** `feature/saheli-10-nova`  
**Date:** October 2026  
**Auditor:** Antigravity AI (Pair Programming Assistant)

---

### 1. Executive Summary & Context

Previous frontend iterations (Bloom 9.0/9.1) made foundational improvements to color tokens, typography leading, and component extraction, but they suffered from inherent architectural limitations:

1. **The "Card Wall" Syndrome:** Pages were constructed as endless vertical stacks of independent cards with competing visual weights, borders, and margins.
2. **Multiple Competing CTAs:** The Today dashboard presented multiple primary-style buttons simultaneously (Log Today, Quick Log, Customize, Explore Demo, Pet care actions), creating decision fatigue.
3. **Information Redundancy:** Cycle status, cycle day number, and predictions were repeated across the Rhythm Ring, the Hero status banner, the Today Log card, and the Calendar progress card.
4. **Fragmented Navigation Hierarchy:** Secondary destinations were scattered without clear cognitive grouping, forcing tablet and desktop users to interact with expanded docks rather than intentional workspace rails.
5. **Runtime Fragility:** Deeply nested component hierarchies and ad-hoc property access (such as `phaseKey(a.phase)`) created runtime vulnerabilities when local data states varied.

Project Nova represents a full architectural and UX clean slate. It replaces the legacy card-heavy layout with an intentional, calm, purposeful, editorial design system built with TypeScript, semantic HTML, and human-centric information architecture.

---

### 2. Route-by-Route Structural Audit

| Route        | View Name            | Legacy Failure Mode (Bloom / Pre-Nova)                                                                                     | Nova Architectural Remedy                                                                                                                                                                                                                 |
| ------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | Today Dashboard      | Overcrowded 5-tier vertical stack with 8+ cards, competing CTAs, duplicate cycle day counters, and oversized hero banners. | **The "One Glance, One Action" Paradigm:** Single visual focal point (unified cycle rhythm badge & status message), one prominent primary CTA ("Log Today"), compact secondary gateways (Calendar, Insights), and grouped wellness cards. |
| `/calendar`  | Calendar             | Calendar grid squeezed alongside redundant legend cards; day inspection forced to the bottom of the viewport.              | Clean, expansive monthly layout with integrated inline day details, accessible dot glyphs, and responsive month controls.                                                                                                                 |
| `/log`       | Log Day              | Monolithic form requiring excessive scrolling; microscopic sliders; separate cancel/save buttons with distant layout.      | Modular, intuitive stepped or tabbed logging flow with clear Save/Cancel sticky anchors and touch-friendly (≥44px) chips.                                                                                                                 |
| `/insights`  | Insights & Analytics | 12+ fragmented statistic widgets with inconsistent chart aspect ratios and buried medical explanations.                    | Purposeful analytical overview: high-level cycle predictability score, clean SVG trendlines, and progressive disclosure for clinical red flags.                                                                                           |
| `/companion` | Sanctuary Companion  | Unadopted: large grid of 15 pets causing excessive scroll. Adopted: disparate meters with cluttered action controls.       | Unadopted: focused gallery with interactive carousel and instant live preview. Adopted: cohesive habitat scene with organic mood/growth indicators and tactile care bar.                                                                  |
| `/selfcare`  | Self Care            | Static reading cards disguised as tools; audio player detached from activities.                                            | Interactive wellness sanctuary: integrated soothing audio dock, breathing pacing visualizer, and phase-tailored comfort sessions.                                                                                                         |
| `/discover`  | Discover             | Unfiltered card stream with mismatched thumbnail aspect ratios.                                                            | Editorial wellness journal: categorized knowledge modules, search filter, and verified clinical citations.                                                                                                                                |
| `/learn`     | Learn Academy        | Generic lesson list without learning path or completion tracking.                                                          | Interactive curriculum: structured progression tree, bite-sized lesson cards, and instant completion toggles.                                                                                                                             |
| `/ask`       | Eeve Health AI       | Basic chat box mimicking generic LLMs without clinical grounding clarity.                                                  | Dedicated health consultation space: structured bubble stream, citation chips, medical disclaimer banner, and suggested clinical topics.                                                                                                  |
| `/flash`     | FLASH Advisor        | Flat catalog view with rigid card structures and non-interactive comparison drawer.                                        | Modern essentials advisor: interactive multi-attribute filtering, price comparison matrix, and transparent recommendation rationales.                                                                                                     |
| `/instinct`  | INSTINCT Media       | Cluttered cards with non-standard poster ratios and raw streaming badges.                                                  | Cinematic entertainment portal: uniform 2:3 aspect ratio posters, streaming availability chips, and mood-driven recommendation shelves.                                                                                                   |
| `/diva`      | Diva Orchestrator    | Plain conversation window with obscure routing semantics between specialists.                                              | Central AI Command Hub: explicit multi-agent coordination banner, transparent specialist routing, and unified response action cards.                                                                                                      |
| `/settings`  | Settings & Privacy   | Long accordion list with ambiguous distinction between local and global data settings.                                     | Grouped 4-pillar settings portal: Display & Localisation, Reproductive Health, Vault Privacy & Pin, and Local Backup/Restore.                                                                                                             |
| `/more`      | More Hub             | Disorganized link list with disparate icon containers.                                                                     | Structured ecosystem directory grouped by user intention: My Health, My Space, AI Specialists, and Account & Preferences.                                                                                                                 |

---

### 3. Typography & Multilingual Audit

- **13 Supported Languages:** English (`en`), Hindi (`hi`), Marathi (`mr`), Telugu (`te`), Kannada (`kn`), Tamil (`ta`), Bengali (`bn`), Gujarati (`gu`), Punjabi (`pa`), Malayalam (`ml`), Odia (`or`), Assamese (`as`), Urdu (`ur` RTL).
- **Previous Typography Issues:**
  - Hardcoded line heights clipped Indic vowel diacritics (matras) and sub-script conjuncts in Bengali, Tamil, and Telugu.
  - Urdu required manual RTL flipping hacks that caused misaligned icons and padding inversions.
- **Nova Remedy:**
  - Robust multilingual font stack utilizing Noto Sans variants and system fallbacks.
  - Generous default line height (`leading-relaxed` / 1.625) across all headings and body copy.
  - Native CSS logical properties (`margin-inline-start`, `inset-inline-end`) replacing directional physical classes (`ml-`, `mr-`, `left-`, `right-`).

---

### 4. Technical Stack & Codebase Debt

- **Legacy Dependencies:** Over-reliance on loosely typed plain JavaScript JSX files with unvalidated prop contracts.
- **Styling Inconsistencies:** Multiple overlapping custom CSS classes (`bloom-card`, `saheli-card`, `shadow-bloom-*`, `bg-hero`, `bg-card`) resulting in styling conflicts.
- **Nova Tech Solution:**
  - Component migration to TypeScript (`.tsx`) with strictly typed interfaces.
  - Creation of a clean, cohesive design system under `src/components/nova/`.
  - Single Tailwind semantic token configuration adhering to WCAG 2.2 Level AA contrast requirements.
