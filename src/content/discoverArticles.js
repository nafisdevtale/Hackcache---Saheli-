/**
 * Saheli 7.2 — Saheli Discover: Articles, Awareness & Health Education
 *
 * Evidence & Safety Standards:
 * - Accredited sources: WHO, NHS UK, ACOG, FOGSI, UNICEF, MoHFW India.
 * - ZERO unverified folk remedies, zero commercial endorsement.
 * - Dedicated evidence-informed guidance for "When Supplies Are Unavailable"
 *   emphasising emergency dignity, school/health worker support, and strictly prohibiting
 *   unsafe internal improvisation or unhygienic materials.
 */

export const DISCOVER_CATEGORIES = [
  { id: "all", labelKey: "discover.cat.all", iconName: "Sparkles" },
  { id: "menstrual_awareness", labelKey: "discover.cat.awareness", iconName: "BookOpen" },
  { id: "supplies_unavailable", labelKey: "discover.cat.unavailable", iconName: "AlertCircle" },
  { id: "essentials", labelKey: "discover.cat.essentials", iconName: "ShoppingBag" },
  { id: "self_care", labelKey: "discover.cat.selfCare", iconName: "Heart" },
  { id: "encouragement", labelKey: "discover.cat.encouragement", iconName: "Sun" },
];

export const DISCOVER_ARTICLES = [
  // 1. When Supplies Are Unavailable: Emergency Dignity & Safe Solutions
  {
    id: "when_supplies_unavailable",
    category: "supplies_unavailable",
    titleKey: "discover.art.emergencySupplies.title",
    summaryKey: "discover.art.emergencySupplies.summary",
    readTimeMinutes: 5,
    sourceIds: ["unicef_hygiene", "who_selfcare", "fogsi_adolescent_faq"],
    medicalReviewStatus:
      "Evidence-informed educational guideline synthesized from WHO, UNICEF & FOGSI public health guidance",
    lastVerified: "October 2026",
    gradient: "from-amber-500/20 via-card to-primary/10",
    relatedFlashCategory: "disposable_pads",
    relatedSelfCareRoutine: "routine_period_hygiene",
    sections: [
      {
        headingKey: "discover.art.emergencySupplies.h1",
        textKey: "discover.art.emergencySupplies.t1",
      },
      {
        headingKey: "discover.art.emergencySupplies.h2",
        textKey: "discover.art.emergencySupplies.t2",
      },
      {
        headingKey: "discover.art.emergencySupplies.h3",
        textKey: "discover.art.emergencySupplies.t3",
      },
      {
        headingKey: "discover.art.emergencySupplies.h4",
        textKey: "discover.art.emergencySupplies.t4",
      },
    ],
  },

  // 2. Disposable vs Reusable: Choosing What Fits Your Body and Life
  {
    id: "disposable_vs_reusable",
    category: "essentials",
    titleKey: "discover.art.padsVsCups.title",
    summaryKey: "discover.art.padsVsCups.summary",
    readTimeMinutes: 4,
    sourceIds: ["who_selfcare", "acog_dysmenorrhea"],
    medicalReviewStatus: "Evidence-based product comparison guidelines",
    lastVerified: "October 2026",
    gradient: "from-secondary-strong/20 via-card to-secondary/15",
    relatedFlashCategory: "menstrual_cups",
    relatedSelfCareRoutine: "routine_period_hygiene",
    sections: [
      {
        headingKey: "discover.art.padsVsCups.h1",
        textKey: "discover.art.padsVsCups.t1",
      },
      {
        headingKey: "discover.art.padsVsCups.h2",
        textKey: "discover.art.padsVsCups.t2",
      },
      {
        headingKey: "discover.art.padsVsCups.h3",
        textKey: "discover.art.padsVsCups.t3",
      },
    ],
  },

  // 3. Menstrual Hygiene: Five Rules Every Girl and Woman Should Know
  {
    id: "menstrual_hygiene_rules",
    category: "menstrual_awareness",
    titleKey: "discover.art.hygieneRules.title",
    summaryKey: "discover.art.hygieneRules.summary",
    readTimeMinutes: 4,
    sourceIds: ["unicef_hygiene", "who_selfcare"],
    medicalReviewStatus: "Reviewed against WHO and UNICEF Menstrual Health standards",
    lastVerified: "October 2026",
    gradient: "from-primary/20 via-card to-card",
    relatedFlashCategory: "general_hygiene",
    relatedSelfCareRoutine: "routine_period_hygiene",
    sections: [
      {
        headingKey: "discover.art.hygieneRules.h1",
        textKey: "discover.art.hygieneRules.t1",
      },
      {
        headingKey: "discover.art.hygieneRules.h2",
        textKey: "discover.art.hygieneRules.t2",
      },
      {
        headingKey: "discover.art.hygieneRules.h3",
        textKey: "discover.art.hygieneRules.t3",
      },
    ],
  },

  // 4. Period Myths vs Scientific Facts: Unlearning Taboos
  {
    id: "myths_vs_facts",
    category: "menstrual_awareness",
    titleKey: "discover.art.mythsFacts.title",
    summaryKey: "discover.art.mythsFacts.summary",
    readTimeMinutes: 5,
    sourceIds: ["fogsi_adolescent_faq", "acog_dysmenorrhea"],
    medicalReviewStatus:
      "Evidence-informed adolescent education synthesized from FOGSI & ACOG guidance",
    lastVerified: "October 2026",
    gradient: "from-purple-500/20 via-card to-hero",
    relatedFlashCategory: "all",
    relatedSelfCareRoutine: null,
    sections: [
      {
        headingKey: "discover.art.mythsFacts.h1",
        textKey: "discover.art.mythsFacts.t1",
      },
      {
        headingKey: "discover.art.mythsFacts.h2",
        textKey: "discover.art.mythsFacts.t2",
      },
      {
        headingKey: "discover.art.mythsFacts.h3",
        textKey: "discover.art.mythsFacts.t3",
      },
    ],
  },

  // 5. Managing Period Cramps Without Shame or Overmedication
  {
    id: "cramps_relief_science",
    category: "self_care",
    titleKey: "discover.art.crampsRelief.title",
    summaryKey: "discover.art.crampsRelief.summary",
    readTimeMinutes: 4,
    sourceIds: ["nhs_pain", "acog_dysmenorrhea"],
    medicalReviewStatus: "Evidence-informed dysmenorrhea lifestyle guidelines",
    lastVerified: "October 2026",
    gradient: "from-period/20 via-card to-primary/15",
    relatedFlashCategory: "warm_compress",
    relatedSelfCareRoutine: "routine_gentle_warmth",
    sections: [
      {
        headingKey: "discover.art.crampsRelief.h1",
        textKey: "discover.art.crampsRelief.t1",
      },
      {
        headingKey: "discover.art.crampsRelief.h2",
        textKey: "discover.art.crampsRelief.t2",
      },
      {
        headingKey: "discover.art.crampsRelief.h3",
        textKey: "discover.art.crampsRelief.t3",
      },
    ],
  },

  // 6. Menstrual Dignity: Your Body Is Not a Secret
  {
    id: "menstrual_dignity",
    category: "encouragement",
    titleKey: "discover.art.dignity.title",
    summaryKey: "discover.art.dignity.summary",
    readTimeMinutes: 3,
    sourceIds: ["who_psychological_selfhelp", "unicef_hygiene"],
    medicalReviewStatus: "Psychological wellbeing & positive health orientation",
    lastVerified: "October 2026",
    gradient: "from-yellow-500/20 via-card to-secondary/20",
    relatedFlashCategory: null,
    relatedSelfCareRoutine: "relax_grounding_54321",
    sections: [
      {
        headingKey: "discover.art.dignity.h1",
        textKey: "discover.art.dignity.t1",
      },
      {
        headingKey: "discover.art.dignity.h2",
        textKey: "discover.art.dignity.t2",
      },
    ],
  },
];

export function getArticleById(id) {
  return DISCOVER_ARTICLES.find((a) => a.id === id);
}
