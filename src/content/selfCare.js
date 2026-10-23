/**
 * Saheli Self Care & Wellness Studio — Content & Evidence Registry
 *
 * Evidence-informed comfort routines, gentle movement, breathing guides,
 * and soothing soundscapes with verified medical references (WHO, NHS, ACOG, FOGSI, MoHFW).
 */

export const EVIDENCE_LEVELS = {
  evidence_informed: {
    id: "evidence_informed",
    labelKey: "selfcare.evidence.informed",
    descKey: "selfcare.evidence.informedDesc",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
  },
  wellbeing_practice: {
    id: "wellbeing_practice",
    labelKey: "selfcare.evidence.wellbeing",
    descKey: "selfcare.evidence.wellbeingDesc",
    badgeColor: "bg-secondary/20 text-secondary-strong border-secondary-strong/30",
  },
  personal_preference: {
    id: "personal_preference",
    labelKey: "selfcare.evidence.preference",
    descKey: "selfcare.evidence.preferenceDesc",
    badgeColor: "bg-muted text-muted-foreground border-border/60",
  },
};

export const SELF_CARE_CATEGORIES = [
  { id: "all", labelKey: "selfcare.cat.all" },
  { id: "comfort", labelKey: "selfcare.cat.comfort" },
  { id: "movement", labelKey: "selfcare.cat.movement" },
  { id: "breathing", labelKey: "selfcare.cat.breathing" },
  { id: "soundscapes", labelKey: "selfcare.cat.soundscapes" },
  { id: "hygiene", labelKey: "selfcare.cat.hygiene" },
  { id: "mycare", labelKey: "selfcare.cat.mycare" },
];

export const SELF_CARE_PROGRAMMES = [
  // 1. Gentle Warmth & Rest
  {
    id: "routine_gentle_warmth",
    titleKey: "selfcare.prog.warmth.title",
    descKey: "selfcare.prog.warmth.desc",
    category: "comfort",
    activityType: "routine",
    suggestedDuration: 10,
    difficulty: "gentle",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["nhs_pain", "acog_dysmenorrhea"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "Evidence-informed peer-reviewed comfort measure",
    precautionsKey: "selfcare.prog.warmth.precautions",
    stopConditionsKey: "selfcare.prog.warmth.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.warmth.s1.title",
        textKey: "selfcare.prog.warmth.s1.text",
        duration: 3,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.warmth.s2.title",
        textKey: "selfcare.prog.warmth.s2.text",
        duration: 4,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.warmth.s3.title",
        textKey: "selfcare.prog.warmth.s3.text",
        duration: 3,
      },
    ],
  },

  // 2. Rest & Recharge
  {
    id: "routine_rest_recharge",
    titleKey: "selfcare.prog.rest.title",
    descKey: "selfcare.prog.rest.desc",
    category: "comfort",
    activityType: "routine",
    suggestedDuration: 15,
    difficulty: "all",
    ageSuitability: "all",
    evidenceLevel: "wellbeing_practice",
    sourceIds: ["who_selfcare"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "General wellbeing practice",
    precautionsKey: "selfcare.prog.rest.precautions",
    stopConditionsKey: "selfcare.prog.rest.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.rest.s1.title",
        textKey: "selfcare.prog.rest.s1.text",
        duration: 5,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.rest.s2.title",
        textKey: "selfcare.prog.rest.s2.text",
        duration: 5,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.rest.s3.title",
        textKey: "selfcare.prog.rest.s3.text",
        duration: 5,
      },
    ],
  },

  // 3. Period Care Essentials
  {
    id: "routine_period_hygiene",
    titleKey: "selfcare.prog.hygiene.title",
    descKey: "selfcare.prog.hygiene.desc",
    category: "hygiene",
    activityType: "education",
    suggestedDuration: 5,
    difficulty: "all",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["mohfw_mhs", "fogsi_adolescent_faq"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "National adolescent health guideline",
    precautionsKey: "selfcare.prog.hygiene.precautions",
    stopConditionsKey: "selfcare.prog.hygiene.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.hygiene.s1.title",
        textKey: "selfcare.prog.hygiene.s1.text",
        duration: 2,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.hygiene.s2.title",
        textKey: "selfcare.prog.hygiene.s2.text",
        duration: 2,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.hygiene.s3.title",
        textKey: "selfcare.prog.hygiene.s3.text",
        duration: 1,
      },
    ],
  },

  // 4. Comfortable Pelvic & Lower Back Stretch
  {
    id: "exercise_gentle_stretch",
    titleKey: "selfcare.prog.stretch.title",
    descKey: "selfcare.prog.stretch.desc",
    category: "movement",
    activityType: "exercise",
    suggestedDuration: 8,
    difficulty: "beginner",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["who_physical_activity", "nhs_pain"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "Evidence-informed low-impact movement",
    precautionsKey: "selfcare.prog.stretch.precautions",
    stopConditionsKey: "selfcare.prog.stretch.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.stretch.s1.title",
        textKey: "selfcare.prog.stretch.s1.text",
        duration: 2,
        illustration: "childs_pose",
      },
      {
        step: 2,
        titleKey: "selfcare.prog.stretch.s2.title",
        textKey: "selfcare.prog.stretch.s2.text",
        duration: 3,
        illustration: "cat_cow",
      },
      {
        step: 3,
        titleKey: "selfcare.prog.stretch.s3.title",
        textKey: "selfcare.prog.stretch.s3.text",
        duration: 3,
        illustration: "supine_twist",
      },
    ],
  },

  // 5. Easy Walking & Posture Break
  {
    id: "exercise_easy_walk",
    titleKey: "selfcare.prog.walk.title",
    descKey: "selfcare.prog.walk.desc",
    category: "movement",
    activityType: "exercise",
    suggestedDuration: 10,
    difficulty: "gentle",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["who_physical_activity"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "WHO aerobic physical activity guideline",
    precautionsKey: "selfcare.prog.walk.precautions",
    stopConditionsKey: "selfcare.prog.walk.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.walk.s1.title",
        textKey: "selfcare.prog.walk.s1.text",
        duration: 3,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.walk.s2.title",
        textKey: "selfcare.prog.walk.s2.text",
        duration: 4,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.walk.s3.title",
        textKey: "selfcare.prog.walk.s3.text",
        duration: 3,
      },
    ],
  },

  // 6. Pelvic Floor Education & Relaxation (Conservative, not prescribed to everyone)
  {
    id: "edu_pelvic_floor",
    titleKey: "selfcare.prog.pelvic.title",
    descKey: "selfcare.prog.pelvic.desc",
    category: "movement",
    activityType: "education",
    suggestedDuration: 6,
    difficulty: "all",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["acog_visit", "nhs_pain"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "Educational pelvic health guidance",
    precautionsKey: "selfcare.prog.pelvic.precautions",
    stopConditionsKey: "selfcare.prog.pelvic.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.pelvic.s1.title",
        textKey: "selfcare.prog.pelvic.s1.text",
        duration: 2,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.pelvic.s2.title",
        textKey: "selfcare.prog.pelvic.s2.text",
        duration: 2,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.pelvic.s3.title",
        textKey: "selfcare.prog.pelvic.s3.text",
        duration: 2,
      },
    ],
  },

  // 7. NHS Calm Breathing (4-4 Pace)
  {
    id: "relax_calm_breathing",
    titleKey: "selfcare.prog.breathing.title",
    descKey: "selfcare.prog.breathing.desc",
    category: "breathing",
    activityType: "breathing",
    suggestedDuration: 5,
    difficulty: "all",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["nhs_breathing", "who_psychological_selfhelp"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "NHS diaphragmatic breathing guidance",
    precautionsKey: "selfcare.prog.breathing.precautions",
    stopConditionsKey: "selfcare.prog.breathing.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.breathing.s1.title",
        textKey: "selfcare.prog.breathing.s1.text",
        duration: 1,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.breathing.s2.title",
        textKey: "selfcare.prog.breathing.s2.text",
        duration: 3,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.breathing.s3.title",
        textKey: "selfcare.prog.breathing.s3.text",
        duration: 1,
      },
    ],
  },

  // 8. 5-4-3-2-1 Sensory Grounding
  {
    id: "relax_grounding_54321",
    titleKey: "selfcare.prog.grounding.title",
    descKey: "selfcare.prog.grounding.desc",
    category: "breathing",
    activityType: "routine",
    suggestedDuration: 5,
    difficulty: "all",
    ageSuitability: "all",
    evidenceLevel: "evidence_informed",
    sourceIds: ["who_psychological_selfhelp"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "WHO psychological first-aid self-help",
    precautionsKey: "selfcare.prog.grounding.precautions",
    stopConditionsKey: "selfcare.prog.grounding.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.grounding.s1.title",
        textKey: "selfcare.prog.grounding.s1.text",
        duration: 1,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.grounding.s2.title",
        textKey: "selfcare.prog.grounding.s2.text",
        duration: 2,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.grounding.s3.title",
        textKey: "selfcare.prog.grounding.s3.text",
        duration: 2,
      },
    ],
  },

  // 9. Bedtime Relaxation & Sleep Prep
  {
    id: "relax_bedtime_winddown",
    titleKey: "selfcare.prog.sleep.title",
    descKey: "selfcare.prog.sleep.desc",
    category: "comfort",
    activityType: "routine",
    suggestedDuration: 15,
    difficulty: "all",
    ageSuitability: "all",
    evidenceLevel: "wellbeing_practice",
    sourceIds: ["who_selfcare"],
    lastVerified: "October 2026",
    clinicalReviewStatus: "General sleep hygiene practice",
    precautionsKey: "selfcare.prog.sleep.precautions",
    stopConditionsKey: "selfcare.prog.sleep.stop",
    steps: [
      {
        step: 1,
        titleKey: "selfcare.prog.sleep.s1.title",
        textKey: "selfcare.prog.sleep.s1.text",
        duration: 5,
      },
      {
        step: 2,
        titleKey: "selfcare.prog.sleep.s2.title",
        textKey: "selfcare.prog.sleep.s2.text",
        duration: 5,
      },
      {
        step: 3,
        titleKey: "selfcare.prog.sleep.s3.title",
        textKey: "selfcare.prog.sleep.s3.text",
        duration: 5,
      },
    ],
  },
];

export const SOUNDSCAPES = [
  {
    id: "rain",
    titleKey: "selfcare.sound.rain.title",
    descKey: "selfcare.sound.rain.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "CloudRain",
  },
  {
    id: "waves",
    titleKey: "selfcare.sound.waves.title",
    descKey: "selfcare.sound.waves.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Waves",
  },
  {
    id: "forest",
    titleKey: "selfcare.sound.forest.title",
    descKey: "selfcare.sound.forest.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Trees",
  },
  {
    id: "stream",
    titleKey: "selfcare.sound.stream.title",
    descKey: "selfcare.sound.stream.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Droplets",
  },
  {
    id: "wind",
    titleKey: "selfcare.sound.wind.title",
    descKey: "selfcare.sound.wind.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Wind",
  },
  {
    id: "night",
    titleKey: "selfcare.sound.night.title",
    descKey: "selfcare.sound.night.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Moon",
  },
  {
    id: "birds",
    titleKey: "selfcare.sound.birds.title",
    descKey: "selfcare.sound.birds.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Bird",
  },
  {
    id: "instrumental",
    titleKey: "selfcare.sound.instrumental.title",
    descKey: "selfcare.sound.instrumental.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Music",
  },
  {
    id: "whitenoise",
    titleKey: "selfcare.sound.whitenoise.title",
    descKey: "selfcare.sound.whitenoise.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Volume2",
  },
  {
    id: "breathing_audio",
    titleKey: "selfcare.sound.breathing.title",
    descKey: "selfcare.sound.breathing.desc",
    category: "soundscapes",
    evidenceLevel: "personal_preference",
    sourceIds: [],
    iconName: "Sparkles",
  },
];

export const QUICK_SHORTCUTS = [
  {
    id: "calm_down",
    titleKey: "selfcare.quick.calm",
    targetProgrammeId: "relax_calm_breathing",
    iconName: "Sparkles",
    color: "from-secondary-strong/20 to-secondary/30 text-secondary-strong",
  },
  {
    id: "ease_discomfort",
    titleKey: "selfcare.quick.cramps",
    targetProgrammeId: "routine_gentle_warmth",
    iconName: "Heart",
    color: "from-period/20 to-primary/20 text-period",
  },
  {
    id: "relax_sleep",
    titleKey: "selfcare.quick.sleep",
    targetProgrammeId: "relax_bedtime_winddown",
    iconName: "Moon",
    color: "from-primary/20 to-primary/30 text-primary",
  },
  {
    id: "gentle_movement",
    titleKey: "selfcare.quick.move",
    targetProgrammeId: "exercise_gentle_stretch",
    iconName: "Activity",
    color: "from-secondary-strong/20 to-primary/20 text-secondary-strong",
  },
  {
    id: "quiet_break",
    titleKey: "selfcare.quick.quiet",
    targetProgrammeId: "routine_rest_recharge",
    iconName: "Coffee",
    color: "from-muted/40 to-muted/60 text-foreground",
  },
  {
    id: "period_hygiene",
    titleKey: "selfcare.quick.hygiene",
    targetProgrammeId: "routine_period_hygiene",
    iconName: "ShieldCheck",
    color: "from-primary/20 to-secondary/30 text-primary",
  },
  {
    id: "emotional_wellbeing",
    titleKey: "selfcare.quick.emotional",
    targetProgrammeId: "relax_grounding_54321",
    iconName: "Sun",
    color: "from-accent/40 to-accent/60 text-accent-foreground",
  },
];

/**
 * Evidence-informed Personalised Self Care Suggestion
 * Conservative, transparent, respects user privacy.
 */
export function getPersonalizedSelfCare({ record, today, safety }) {
  // If acute red flags are triggered in safety rules, never replace them with exercise
  if (safety?.urgentRedFlag) {
    return {
      isSafetyAlert: true,
      titleKey: "selfcare.today.urgentTitle",
      descKey: "selfcare.today.urgentDesc",
      targetProgrammeId: null,
      linkToDoctor: true,
    };
  }

  const todayLog = record?.days?.[today];
  const pain = todayLog?.pain ?? 0;
  const symptoms = todayLog?.symptoms ?? [];
  const mood = todayLog?.mood;
  const energy = todayLog?.energy;

  // 1. Cramps / Pelvic Pain logged
  if (pain > 0 || symptoms.includes("cramps")) {
    return {
      isSafetyAlert: false,
      reason: "cramps_logged",
      titleKey: "selfcare.today.crampsTitle",
      descKey: "selfcare.today.crampsDesc",
      targetProgrammeId: "routine_gentle_warmth",
    };
  }

  // 2. Low energy / Fatigue logged
  if (energy === "low" || symptoms.includes("tiredness")) {
    return {
      isSafetyAlert: false,
      reason: "low_energy",
      titleKey: "selfcare.today.energyTitle",
      descKey: "selfcare.today.energyDesc",
      targetProgrammeId: "routine_rest_recharge",
    };
  }

  // 3. Low mood or high stress logged
  if (mood === "sad" || mood === "anxious" || symptoms.includes("mood")) {
    return {
      isSafetyAlert: false,
      reason: "mood_logged",
      titleKey: "selfcare.today.moodTitle",
      descKey: "selfcare.today.moodDesc",
      targetProgrammeId: "relax_calm_breathing",
    };
  }

  // 4. Sleep disturbance logged
  if (todayLog?.sleep === "poor" || todayLog?.sleep === "very_poor") {
    return {
      isSafetyAlert: false,
      reason: "sleep_logged",
      titleKey: "selfcare.today.sleepTitle",
      descKey: "selfcare.today.sleepDesc",
      targetProgrammeId: "relax_bedtime_winddown",
    };
  }

  // 5. Default General Wellbeing (when no specific symptom logged or no data)
  return {
    isSafetyAlert: false,
    reason: "general_wellness",
    titleKey: "selfcare.today.generalTitle",
    descKey: "selfcare.today.generalDesc",
    targetProgrammeId: "exercise_gentle_stretch",
  };
}
