# Saheli 7.4 — My Phase Tracker Interface & Calculability Matrix

**Component:** `My Phase Tracker` (`src/components/cycle/PhaseCards.jsx`)  
**Architecture:** Decoupled Interactive Cycle-Phase Tracking  
**Version:** 7.4.1  
**Status:** Approved & Verified

---

## 1. Overview & Information Hierarchy

Saheli transforms the Follicular and Luteal Phase features from static educational article cards into an interactive, data-driven **My Phase Tracker**.

### Hierarchy:

1. **Primary (Tracking Status & Evidence):** Current cycle day, bleeding status, active phase, elapsed days, and calculable boundaries with uncertainty.
2. **Secondary (History & Interaction Controls):** Past cycle selector tabs, historical timelines, logged symptoms by cycle day, and observation management.
3. **Tertiary (Biological & Self-Care Context):** Short hormonal overview (estrogen/LH/progesterone) and evidence-informed comfort guidance in collapsible modals.

---

## 2. What Is Calculable vs What Is Not Calculable

| Dimension                       | Calculable (Displayed)                                                                                                 | Not Calculable (Safeguarded / Suppressed)                                                               | Clinical Rationale                                                                                                                                                          |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cycle Day**                   | **Calculable:** Days elapsed from recorded period start + 1.                                                           | N/A                                                                                                     | Deterministic date arithmetic from recorded diary entries.                                                                                                                  |
| **Menstrual Bleeding**          | **Calculable:** Logged flow (`heavy`, `medium`, `light`, `spotting`) or non-bleeding.                                  | N/A                                                                                                     | Direct diary observation from user logs.                                                                                                                                    |
| **Follicular Start**            | **Calculable:** Cycle Day 1.                                                                                           | N/A                                                                                                     | Menstruation marks the start of follicular recruitment.                                                                                                                     |
| **Follicular End & Progress**   | **Calculable (Eligible Only):** Estimated midpoint boundary (± half-width uncertainty) for regular adults (≥3 cycles). | **Not Calculable:** Fixed "Day 14" assumption; exact hour/day of ovulation without medical diagnostics. | Follicular phase length is the primary source of human cycle variability. For adolescents or irregular cycles, shows: _"Cycle Day X — phase boundary not yet established."_ |
| **Luteal Start**                | **Calculable (Eligible Only):** Estimated post-ovulation day for regular adults (≥3 cycles).                           | **Not Calculable:** Definitive luteal start from period dates alone.                                    | Luteal phase follows ovulation; timing cannot be confirmed without biomarkers or ultrasound.                                                                                |
| **Luteal Duration & Remaining** | **Calculable (Eligible Only):** Approximate remaining days (benchmark mean 14 days, range 11–17 days).                 | **Not Calculable:** Medically confirmed luteal length without hormone assays.                           | Progesterone surge can only be approximated via calendar models; never used as contraception.                                                                               |
| **Ovulation Biomarkers**        | **Calculable:** User-logged LH surge strips, BBT temperatures (°C/°F), and cervical fluid.                             | **Not Calculable:** Biological proof of successful ovulation.                                           | LH surge indicates hormonal trigger, but cannot confirm follicle rupture or egg viability.                                                                                  |

---

## 3. Interactive Features

1. **Cycle History Selector:**
   - Interactive horizontal scroll tabs: `[ Current Cycle (Day N) ]` and `[ Cycle {N}: {date} ({len}d) ]`.
   - Selecting past cycles reveals full duration, period bleeding days, symptoms by cycle day, and ovulation observations.
2. **Interactive Tap-to-Inspect Modals:**
   - Tapping either Follicular or Luteal card opens a detailed drawer/modal with tracking progress, symptom breakdown, clinical hormone dynamics, and self-care comfort tips.
3. **Reactive Updates:**
   - Any period log, historical edit, observation addition, or deletion immediately recalculates all states across Today, Calendar, Insights, and Rhythm Ring.
4. **Empty State:**
   - When no period is recorded, shows a clear call-to-action: _"Start Tracking: Log your period start date to activate cycle-day and phase tracking."_
