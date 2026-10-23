# Saheli 7.4 — Ovulation Observations & Biomarker Logging

**Document Version:** 1.0.0  
**Status:** Approved & Implemented

---

## 1. Overview

Ovulation observations allow users to log physiological biomarkers and at-home tests in their personal local diary. These observations reflect hormonal activity or physiological changes, but cannot guarantee that ovulation has occurred or pinpoint an exact ovulation day.

---

## 2. Biomarker Data Schema

Each observation is keyed by `YYYY-MM-DD` and stored under `record.ovulationObservations[date]`.

```typescript
interface OvulationObservation {
  date: string; // ISO date string (YYYY-MM-DD)
  testResult: "none" | "negative" | "faint" | "positive"; // LH/OPK test strip result
  bbt: number | null; // Basal Body Temperature
  bbtUnit: "C" | "F"; // Celsius (30.0 - 45.0) or Fahrenheit (85.0 - 110.0)
  cervicalFluid: "none" | "dry" | "sticky" | "creamy" | "eggwhite" | "watery";
  notes: string; // Max 500 characters
  source: "manual" | "kit" | "temp";
  excludedFromCalculations: boolean; // Flag to exclude abnormal / fever days
}
```

---

## 3. Supported Biomarkers

### 3.1 Ovulation Test Strips (LH / OPK)

- **Positive:** Indicates an LH surge in urine, which typically precedes follicular rupture by 24–36 hours.
- **Negative / Faint:** Baseline LH levels.
- **Not Tested:** Default.

### 3.2 Basal Body Temperature (BBT)

- Supported in both Celsius (°C) and Fahrenheit (°F) with interactive unit toggling.
- Validation bounds enforce physiological limits (30.0°C–45.0°C / 85.0°F–110.0°F) to prevent corrupted user data.
- **Excluded Flag:** Allows users to mark feverish days, illness, or broken sleep so erratic measurements do not skew calculations.

### 3.3 Cervical Fluid

- Categorized according to clinical observation classifications:
  - `dry`: Little to no fluid sensation.
  - `sticky`: Tacky or pasty.
  - `creamy`: Lotion-like.
  - `watery`: Slippery, wet.
  - `eggwhite`: Stretchy, clear (peak fertile biological sign).

---

## 4. Privacy & Decoupling

1. **Zero AI Contamination:** Ovulation observations and biomarker logs are strictly excluded from AI prompts and FLASH recommendations.
2. **Local-First IndexedDB:** Stored solely on the user's device, encrypted in the IndexedDB AES-GCM vault when passcode security is enabled.
3. **No Commercial Targeting:** Ovulation test logs are never used to serve targeted advertisements or commercial pitches.
