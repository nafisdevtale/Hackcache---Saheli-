# Saheli 7.4 — Cycle Phase & Ovulation Tracking Architecture

**Document Version:** 1.0.0  
**Calculation Engine Version:** 7.4.0  
**Status:** Approved & Verified

---

## 1. Executive Summary

Saheli 7.4 upgrades the menstrual companion from static educational cycle-phase cards into an interactive, authoritative, data-driven cycle phase and ovulation tracking engine.

The engine addresses a fundamental clinical and user-experience need in menstrual health technology:

1. **Decoupled Architecture:** Users need to know their current cycle day, bleeding status, and biological context regardless of whether calendar fertility predictions can or should be generated.
2. **Deterministic Safeguards:** Adolescents (<18 years old) and users with highly variable cycle lengths (>7 days spread) must never be shown speculative calendar ovulation dates or fertile windows. However, they must not be excluded from understanding their cycle day, bleeding markers, or the biology of follicular and luteal phases.
3. **Multi-Source Synthesis:** Clear distinction between general educational concepts, mathematical calendar bounds, user-recorded body observations (LH test strips, BBT, cervical fluid), and indeterminate biological boundaries.

---

## 2. Core Architectural Components

### 2.1 The Authoritative Cycle State Model (`getAuthoritativeCycleState`)

Defined in [`src/lib/cycle.js`](file:///Users/nafisdevtale/Documents/remix-of-saheli-cycle-companion/src/lib/cycle.js), `getAuthoritativeCycleState(record, targetDate)` acts as the single source of truth across all views:

- **Today Dashboard:** Drives `<RhythmRing />`, the quick cycle header, and `<PhaseCards />`.
- **Calendar:** Renders phase indicators, uncertainty boundaries, and observation badges (`✨`).
- **Insights:** Powers cycle length variation analysis and cycle-day-relative symptom patterns.
- **LogDay Form:** Provides inline ovulation observation logging with temperature unit selection and calculation exclusion toggles.

### 2.2 Data Contract

The authoritative cycle state returns the following contract:

```typescript
interface AuthoritativeCycleState {
  cycleDay: number | null;
  isLongCycleGap: boolean;
  currentCycleStart: string | null;
  previousCycleStarts: string[];
  completedCycleCount: number;
  cycleLengthMedian: number | null;
  cycleLengthVariability: number | null;
  currentBleedingStatus: "bleeding" | "spotting" | "none";
  phaseStatus:
    "menstrual" | "follicular" | "luteal" | "overdue" | "paused" | "pregnancy" | "uncertain";
  phaseLabel: string;
  phaseEstimationMethod:
    "recorded_menstruation" | "calendar_bounded" | "educational_only" | "suppressed";
  phaseUncertainty: string;
  ovulationEstimateStatus:
    | "estimate_available"
    | "insufficient_history"
    | "irregular_cycles"
    | "adolescent_safeguard"
    | "disabled_by_user"
    | "pregnancy_mode";
  ovulationObservationStatus: {
    status: "none_recorded" | "positive_lh_recorded" | "observations_recorded";
    hasObservations: boolean;
    observationCount: number;
    positiveLh: OvulationObservation | null;
    bbtEntries: number;
    cervicalFluidEntries: number;
    latestObservation: OvulationObservation | null;
    currentCycleObservations: OvulationObservation[];
    disclaimer: string;
  };
  estimateExplanation: string;
  relevantSourceDates: {
    periodStart: string | null;
    periodEnd: string | null;
    predictedNextPeriodStart: string | null;
    predictedNextPeriodEnd: string | null;
    estimatedOvulationStart: string | null;
    estimatedOvulationEnd: string | null;
    observationDates: string[];
    estimatedFollicularRange: { startDay: number; endDay: number } | null;
    estimatedLutealRange: { startDay: number; endDay: number } | null;
  };
  lastCalculatedAt: string;
  calculationVersion: "7.4.0";
}
```

---

## 3. Storage and Portability

1. **IndexedDB Local-First Persistence:** Ovulation observations are persisted under `record.ovulationObservations` with AES-GCM encryption support when the security vault is active.
2. **Schema Sanitization:** Strict validation via `validateObservation` prevents malformed temperatures, out-of-range dates, or arbitrary keys.
3. **Backup Compatibility:** JSON exports preserve the complete observation record. CSV exports include `ovulationTest`, `bbt`, `cervicalFluid` columns for clinical interoperability. PDF summaries include a dedicated observation record table.
