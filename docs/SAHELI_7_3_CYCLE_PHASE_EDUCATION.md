# Saheli 7.3 — Menstrual Phase Education & Engine

## Clinical Background & Scientific Rationales

Menstrual education frequently perpetuates the **"universal Day 14" myth**, assuming every woman ovulates on day 14 of a 28-day cycle. Real-world clinical research (Fehring et al., Lenton et al., Bull et al. 2019) demonstrates substantial biological variation:

- Follicular phase length varies considerably between individuals and cycles (ranging from 10 to 22+ days).
- Luteal phase length is more consistent (typically 11 to 16 days), but still exhibits normal individual variation.

Saheli 7.3 implements dedicated, evidence-based educational modules for both the **Follicular Phase** and **Luteal Phase**, providing physiological descriptions, hormonal changes, self-care guidance, and medical citations (ACOG, NHS, Endocrine Society).

---

## 1. Engine Diagnostics (`getCyclePhaseDiagnostics`)

The cycle engine in `src/lib/cycle.js` calculates a comprehensive phase diagnostic object:

```javascript
{
  eligible: boolean,
  reason: string, // 'eligible' | 'adolescent_safeguard' | 'irregular_cycles' | 'insufficient_history' | 'pregnancy_mode' | 'paused'
  follicular: {
    startDay: number,
    endDayMin: number,
    endDayMax: number,
    description: string,
  },
  luteal: {
    startDayMin: number,
    startDayMax: number,
    endDay: number,
    description: string,
  },
  disclaimer: string
}
```

---

## 2. Medical Safeguards & Strict Suppression

To prevent misleading estimations or inappropriate reliance, personal phase day calculations are **strictly suppressed** under any of the following clinical conditions:

1. **Adolescent Safeguard (`adolescent_safeguard`)**:
   - Suppressed for any user under 18 years old. Adolescent menstrual cycles exhibit physiological anovulation and hypothalamic-pituitary-ovarian axis immaturity.
2. **Irregular Cycles (`irregular_cycles`)**:
   - Suppressed if cycle length varies by more than 7 days across recorded cycles.
3. **Insufficient History (`insufficient_history`)**:
   - Suppressed if fewer than 3 completed historical cycles have been logged.
4. **Pregnancy Mode (`pregnancy_mode`)**:
   - Suppressed when pregnancy mode is enabled.
5. **Paused Tracking (`paused`)**:
   - Suppressed when menstrual tracking is paused.

When suppressed, users still receive full educational content explaining the physiology of the follicular and luteal phases, alongside a clear, compassionate explanation of why individualized day timelines are withheld.

---

## 3. UI Presentation

- **PhaseCards Component (`src/components/cycle/PhaseCards.jsx`)**:
  - Interactive tab switcher allowing seamless exploration between Follicular and Luteal phases.
  - Displays biological summary, key hormones (Estrogen, Progesterone, LH, FSH), normal cycle variation disclosure, self-care recommendations, and medical citations.
  - Integrated into **Today**, **Calendar**, and **Insights** pages.
