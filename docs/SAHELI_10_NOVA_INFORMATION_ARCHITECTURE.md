# SAHELI 10.0 — PROJECT NOVA INFORMATION ARCHITECTURE

## Purposeful, Calm, Human-Centric User Experience Specification

**Project:** Saheli — Your Cycle, Your Rhythm  
**Codename:** Project Nova  
**Branch:** `feature/saheli-10-nova`  
**Date:** October 2026

---

### 1. Architectural Philosophy

Project Nova is engineered around a core tenet: **"One Glance, One Primary Action, Everything Else Within Easy Reach."**

Users opening Saheli on a shared family mobile device in varying connectivity conditions should never be confronted by an overwhelming dashboard or ambiguous options. The interface presents clear visual hierarchy, calm editorial typography, content-driven layouts, and transparent medical uncertainty.

---

### 2. Global Navigation Framework

```
                          ┌────────────────────────────────┐
                          │     NOVA APPLICATION SHELL     │
                          └───────────────┬────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        ▼                                 ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│   DESKTOP RAIL   │            │   TABLET STRIP   │            │   MOBILE DOCK    │
│  (Width >= 1024) │            │ (768 <= W < 1024)│            │   (Width < 768)  │
│ 4 Unified Groups │            │ Horizontal Nav   │            │ 5 Anchor Actions │
└──────────────────┘            └──────────────────┘            └──────────────────┘
```

#### Primary Navigation Anchors

1. **Today (`/`):** The daily cycle rhythm pulse, current status, and primary "Log Today" action.
2. **Calendar (`/calendar`):** Monthly cycle visualization, retrospective logs, and cycle history.
3. **Log (`/log`):** Direct entry point to log bleeding, pain, symptoms, mood, and cervical observations.
4. **Diva AI (`/diva`):** Central AI supervisor orchestrating Eeve (Health), FLASH (Essentials), and INSTINCT (Entertainment).
5. **More Hub (`/more`):** The comprehensive gateway to My Health, My Space, AI Specialists, and Preferences.

#### Categorized Secondary Destinations (The 4 Pillars)

- **Pillar 1: My Health**
  - Insights & Analytics (`/insights`)
  - Phase Tracker (`/phase-tracker` or inline on `/calendar`)
  - Learn Academy (`/learn`)
  - Clinical Guidance & Red Flags (`/doctor`)
  - Visit Summary Generator (`/visit`)
  - Pregnancy Health Mode (`/pregnancy`)
- **Pillar 2: My Space (Sanctuary)**
  - Saheli Companion (`/companion`)
  - Self Care Studio (`/selfcare`)
  - Discover Knowledge (`/discover`)
  - Pseudonymous Community (`/community`)
- **Pillar 3: AI Intelligence Suite**
  - Diva Central Supervisor (`/diva`)
  - Eeve Health Companion (`/ask`)
  - FLASH Essentials Advisor (`/flash`)
  - INSTINCT Entertainment Advisor (`/instinct`)
- **Pillar 4: Account & Preferences**
  - Settings & Language (`/settings`)
  - Notification Reminders (`/reminders`)
  - Vault Privacy & PIN Protection (`/settings#privacy`)
  - Data Portability & Backup/Restore (`/settings#data`)
  - Feedback & Diagnostics (`/feedback`)

---

### 3. Route-by-Route Information Architecture Specification

#### 3.1 Today Dashboard (`/`)

- **Primary User Goal:** Understand where they are in their cycle today and record daily observations without cognitive friction.
- **Most Important Information:**
  - Cycle Day counter (e.g. "Day 14 of your cycle" or "Building cycle profile").
  - Bleeding status (Logged period, spotting, or none).
  - Estimated phase with honest uncertainty status (Follicular, Luteal, or Unestablished).
  - One concise contextual insight sentence.
- **Primary Action:** Prominent, accessible **"Log Today"** CTA button ($\ge 48\text{px}$ touch target, distinctive accent).
- **Secondary Actions:**
  - Quick calendar inspection link.
  - One-tap companion mood check-in.
  - "Ask Diva" conversational prompt.
- **Optional Advanced Details (Progressive Disclosure):**
  - Expandable Cycle History & Symptom Patterns panel.
  - Dashboard section customization dialog.
- **Responsive Layout:**
  - Mobile: Single-column vertical stream; hero status ring + primary CTA above the fold; compact wellness duo; Diva prompt.
  - Tablet: 2-column balanced grid with hero ring on left and action hubs on right.
  - Desktop: Centered comfortable 3-column max-w-6xl canvas flanked by navigation rail.
- **Empty State (First-run):** Gentle welcome message, "Start Privately" action, and "Explore Sample Records" button.
- **Accessibility:** Full WCAG 2.2 AA compliance, visible focus rings, announced status changes via `aria-live="polite"`.

#### 3.2 Calendar View (`/calendar`)

- **Primary User Goal:** Review past cycle timelines and explore future estimated period windows.
- **Most Important Information:** Monthly grid with discrete glyph badges for period bleeding (🩸), spotting (🔸), symptoms (•), and fertility estimates when eligible.
- **Primary Action:** Date tap/click to open Day Detail Inspector.
- **Secondary Actions:** Previous/Next month navigation, Jump to Today.
- **Responsive Layout:** Adaptive aspect-ratio calendar cells that scale from 320px screens up to 4K monitors without horizontal clipping.

#### 3.3 Log Day Entry (`/log`)

- **Primary User Goal:** Accurately record daily body signals (bleeding flow, pain severity, symptoms, mood, BBT, notes) in under 30 seconds.
- **Most Important Information:** Selected date, flow intensity picker (None, Light, Medium, Heavy, Spotting), and pain scale (0–10).
- **Primary Action:** Persistent sticky "Save Entry" button with tactile micro-press feedback.
- **Secondary Actions:** "Cancel" / "Return to Today".
- **Responsive Layout:** Grouped modular fieldsets with clear visual headings; collapsible advanced vitals (BBT, Cervical fluid).

#### 3.4 Insights & Analytics (`/insights`)

- **Primary User Goal:** Discover longitudinal health patterns and identify clinical red flags (FIGO AUB criteria).
- **Most Important Information:** Cycle length variability, period length distribution, and recurring symptom clusters.
- **Primary Action:** "Prepare Doctor Visit Summary" report generation.
- **Secondary Actions:** Cycle filtering (All vs. Recent 6 cycles), export chart evidence.
- **Responsive Layout:** Responsive SVG bar and distribution charts with accessible text data alternatives.

#### 3.5 Saheli Companion Sanctuary (`/companion`)

- **Primary User Goal:** Form a nurturing, non-judgmental bond with an illustrated wellness companion.
- **Most Important Information:**
  - Unadopted: Live preview of selected pet species, personality traits, and adoption button.
  - Adopted: Interactive sanctuary habitat, pet growth stage, happiness meter, and current mood dialogue bubble.
- **Primary Action:**
  - Unadopted: "Adopt This Companion" CTA.
  - Adopted: 5 tactile care actions (Feed healthy snack, Play mini-game, Brush coat, Cozy rest, Show affection).
- **Responsive Layout:** Centered stage with sticky live preview on desktop; horizontal species carousel on mobile.

#### 3.6 Self Care Studio (`/selfcare`)

- **Primary User Goal:** Find immediate somatic comfort, relief from menstrual cramps, or guided relaxation.
- **Most Important Information:** Phase-aligned recommendations (heat therapy, gentle yoga, hydration) and audio soundscape player.
- **Primary Action:** Play soundscape (Rain, Forest, Waves, White Noise) or start breathing exercise.
- **Secondary Actions:** Timer controls, volume adjustment.

#### 3.7 AI Intelligence Hubs (`/diva`, `/ask`, `/flash`, `/instinct`)

- **Primary User Goal:** Access private, specialized AI support without data leakage between domains.
- **Most Important Information:**
  - **Diva (`/diva`):** Unified orchestrator with specialist delegation chips (Eeve for Health, FLASH for Products, INSTINCT for Entertainment).
  - **Eeve (`/ask`):** Clinical reference citations and supportive menstrual guidance.
  - **FLASH (`/flash`):** Product catalog comparisons, verified price badges, and personalized material recommendations.
  - **INSTINCT (`/instinct`):** Unified 2:3 aspect-ratio media cards, streaming availability, and mood filters.
- **Primary Action:** Send message / Filter recommendations.
- **Secondary Actions:** Clear chat context, switch specialist, compare products, save to watchlist.

#### 3.8 Settings & Privacy (`/settings`)

- **Primary User Goal:** Manage language, PIN protection, local storage encryption, and backup archives with complete control.
- **Most Important Information:** Current language, discreet mode toggle, encryption status, and data storage size.
- **Primary Action:** "Save Settings" / "Export Backup JSON".
- **Secondary Actions:** Change PIN, Erase All Data (with double confirmation).
