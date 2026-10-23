/**
 * Saheli 7.3 — Menstrual Phase Education & Clinical Governance
 *
 * Clinical & Scientific References:
 * - ACOG Clinical Consensus: Normal Menstrual Cycle and Cycle Variation
 * - NHS Health A to Z: Stages of the Menstrual Cycle
 * - FIGO Menstrual Disorders Working Group
 *
 * Key Evidence Rules:
 * 1. Follicular phase varies significantly between individuals and across cycles (typically 10-16 days).
 * 2. Luteal phase typically spans 11-17 days (mean 14 days in clinical benchmarks), but is not fixed to exactly 14 days.
 * 3. The universal "Day 14 ovulation" model is a clinical oversimplification and must never be presented as certainty.
 * 4. Phase estimates are educational only, never contraception advice or clinical diagnoses.
 * 5. Suppress personal day ranges for adolescents (<18) and irregular cycles (>7 days variation).
 */

export const CYCLE_PHASES = {
  follicular: {
    id: "follicular",
    titleKey: "phase.follicular.title",
    subtitleKey: "phase.follicular.subtitle",
    taglineKey: "phase.follicular.tagline",
    biologyKey: "phase.follicular.biology",
    hormoneSummaryKey: "phase.follicular.hormones",
    variationKey: "phase.follicular.variation",
    selfCareTips: [
      "phase.follicular.tip1",
      "phase.follicular.tip2",
      "phase.follicular.tip3",
      "phase.follicular.tip4",
    ],
    sources: [
      {
        id: "acog_cycle",
        name: "American College of Obstetricians and Gynecologists (ACOG)",
        topic: "Normal Menstrual Cycle & Ovulation Variations",
      },
      {
        id: "nhs_cycle",
        name: "National Health Service (NHS UK)",
        topic: "Stages of the Menstrual Cycle",
      },
    ],
  },
  luteal: {
    id: "luteal",
    titleKey: "phase.luteal.title",
    subtitleKey: "phase.luteal.subtitle",
    taglineKey: "phase.luteal.tagline",
    biologyKey: "phase.luteal.biology",
    hormoneSummaryKey: "phase.luteal.hormones",
    variationKey: "phase.luteal.variation",
    selfCareTips: [
      "phase.luteal.tip1",
      "phase.luteal.tip2",
      "phase.luteal.tip3",
      "phase.luteal.tip4",
    ],
    sources: [
      {
        id: "acog_pms",
        name: "ACOG Clinical Practice Bulletin",
        topic: "Premenstrual Syndrome and Luteal Phase Physiology",
      },
      {
        id: "nhs_cycle",
        name: "National Health Service (NHS UK)",
        topic: "Luteal Phase and Progesterone Action",
      },
    ],
  },
};
