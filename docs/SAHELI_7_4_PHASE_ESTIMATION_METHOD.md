# Saheli 7.4 — Menstrual Phase Estimation Methodology & Clinical Safeguards

**Document Version:** 1.0.0  
**Status:** Approved & Clinical Reference Document

---

## 1. Clinical Context & Biological Variation

Menstrual cycle phases are physiologically distinct intervals governed by hormonal dynamics:

- **Menstrual Phase:** Shedding of the functional endometrial layer triggered by progesterone withdrawal.
- **Follicular Phase:** Follicle maturation driven by Follicle-Stimulating Hormone (FSH) and rising estradiol.
- **Ovulation:** Release of a mature oocyte triggered by a surge in Luteinizing Hormone (LH).
- **Luteal Phase:** Progesterone production by the corpus luteum, preparing the endometrium for potential implantation.

### Biological Realities

1. **Follicular Phase Variability:** The follicular phase is the primary source of natural cycle length variation across human populations. The textbook assumption of "Day 14 ovulation" applies to only a fraction of individual cycles.
2. **Luteal Phase Constancy:** The luteal phase is relatively stable across individual humans, with clinical benchmark durations ranging from 11 to 17 days (mean: 14 days).

---

## 2. Phase Classification Rules

Saheli evaluates cycle phases using a deterministic priority hierarchy:

```
[Start Evaluation]
        │
        ├─► Is pregnancy active? ──► Phase = "pregnancy", Method = "suppressed"
        │
        ├─► Is tracking paused? ──► Phase = "paused", Method = "suppressed"
        │
        ├─► Bleeding or spotting logged today? ──► Phase = "menstrual", Method = "recorded_menstruation"
        │
        ├─► Regular adult (>=3 cycles, <=7d spread)?
        │         ├─► YES: Phase = Calendar Bounded (follicular/luteal/overdue)
        │         │        Method = "calendar_bounded"
        │         │        Uncertainty = ± halfWidth days
        │         │
        │         └─► NO (Adolescent, Irregular, or <3 cycles):
        │                  Phase = Educational (follicular/luteal based on cycle day)
        │                  Method = "educational_only"
        │                  Ovulation Predictions = SUPPRESSED
```

---

## 3. Clinical Safeguards Matrix

| Condition                    | Adolescent (<18)   | Irregular Cycle (>7d) | Insufficient History (<3) | Regular Adult (≥3 cycles)  |
| :--------------------------- | :----------------- | :-------------------- | :------------------------ | :------------------------- |
| **Cycle Day Display**        | Active (Day N)     | Active (Day N)        | Active (Day N)            | Active (Day N)             |
| **Menstrual Bleeding**       | Logged & Displayed | Logged & Displayed    | Logged & Displayed        | Logged & Displayed         |
| **Follicular Education**     | Available          | Available             | Available                 | Available                  |
| **Luteal Education**         | Available          | Available             | Available                 | Available                  |
| **Calendar Fertile Window**  | **WITHHELD**       | **WITHHELD**          | **WITHHELD**              | Displayed with Uncertainty |
| **Calendar Ovulation Range** | **WITHHELD**       | **WITHHELD**          | **WITHHELD**              | Displayed with Uncertainty |
| **LH / BBT Observation Log** | Optional Body Sign | Optional Body Sign    | Optional Body Sign        | Optional Body Sign         |
| **Contraception Warning**    | Mandatory Alert    | Mandatory Alert       | Mandatory Alert           | Mandatory Alert            |

---

## 4. Non-Contraceptive Limitation

**CRITICAL SAFEGUARD:** Saheli is strictly an educational companion and cycle diary. It is never a contraceptive device, Natural Family Planning (NFP) diagnostic method, or fertility control tool. All estimation methods clearly surface the non-contraceptive disclaimer in plain language in all 13 supported languages.
