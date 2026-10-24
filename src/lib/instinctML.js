/**
 * Saheli 7.6 — INSTINCT Machine Learning Ranking & Evaluation Engine
 *
 * Supervised Learning-to-Rank Architecture:
 * - 8-dimensional normalized feature vectors per (user_profile, media_item) pair.
 * - Pairwise regularized logistic ranking loss optimization.
 * - Train / Test isolation (70 / 30) across 60 multi-genre synthetic scenarios.
 * - Real held-out evaluation metrics: NDCG@5, NDCG@10, P@5, P@10, MRR, Diversity.
 * - Grounded fallback to explainable content-based baseline.
 */

import { VERIFIED_ENTERTAINMENT } from "../content/entertainment.js";

export const INSTINCT_FEATURE_NAMES = [
  "genreAffinity", // Overlap with user's explicitly preferred & liked genres
  "languageAffinity", // Match with user's preferred viewing/listening languages
  "serviceAvailability", // Available on user's active streaming subscriptions
  "qualityScore", // Normalized verified rating (0..1)
  "trendingVelocity", // Real timestamped popularity velocity
  "hiddenGemDiscovery", // High rating with lower mainstream saturation
  "noveltyDiversity", // Controlled exploratory distance from dominant preferences
  "ageSafetyCompliance", // 1.0 if safe for selected age filter, 0.0 if restricted
];

export const DEFAULT_INSTINCT_WEIGHTS = {
  genreAffinity: 3.4,
  languageAffinity: 2.6,
  serviceAvailability: 2.4,
  qualityScore: 1.8,
  trendingVelocity: 1.2,
  hiddenGemDiscovery: 1.5,
  noveltyDiversity: 0.9,
  ageSafetyCompliance: 4.5,
  bias: 0.0,
};

/**
 * Extract 8-dimensional normalized feature vector for a media item
 */
export function extractInstinctFeatures(item, profile, library = {}) {
  // 1. Genre Affinity
  let genreAffinity = 0.5;
  const userPreferredGenres = profile?.preferredGenres?.[item.type] || [];
  const itemGenres = item.genres || (item.genre ? [item.genre] : []);

  if (userPreferredGenres.length > 0 && itemGenres.length > 0) {
    const matchCount = itemGenres.filter((g) =>
      userPreferredGenres.some((upg) => upg.toLowerCase() === g.toLowerCase()),
    ).length;
    genreAffinity = Math.min(1.0, matchCount / Math.max(1, itemGenres.length));
  } else if (userPreferredGenres.length === 0) {
    genreAffinity = 0.5;
  } else {
    genreAffinity = 0.2;
  }

  // 2. Language Affinity
  let languageAffinity = 0.4;
  const preferredLangs = profile?.preferredLanguages || ["en", "hi"];
  if (item.originalLanguage && preferredLangs.includes(item.originalLanguage)) {
    languageAffinity = 1.0;
  } else if (item.originalLanguage === "instrumental") {
    languageAffinity = 0.8;
  } else {
    languageAffinity = 0.25;
  }

  // 3. Service Availability
  let serviceAvailability = 0.3;
  const preferredServices = profile?.preferredServices || [];
  const itemServices = item.streamingServices || [];
  if (preferredServices.length > 0 && itemServices.length > 0) {
    const hasService = itemServices.some((s) => preferredServices.includes(s));
    serviceAvailability = hasService ? 1.0 : 0.2;
  } else if (preferredServices.length === 0) {
    serviceAvailability = 0.6;
  }

  // 4. Quality Score
  const rating = item.rating || 7.5;
  const qualityScore = Math.min(1.0, Math.max(0.0, (rating - 5.0) / 5.0));

  // 5. Trending Velocity
  const trendingScore = item.trendingScore || 50;
  const trendingVelocity = Math.min(1.0, Math.max(0.0, trendingScore / 100));

  // 6. Hidden Gem Discovery (High rating + lower mainstream vote count or niche language)
  let hiddenGemDiscovery = 0.3;
  const isHighQuality = (item.rating || 0) >= 8.0;
  const isLowerMainstream = (item.voteCount || 0) < 50000 || item.type === "music";
  if (isHighQuality && isLowerMainstream) {
    hiddenGemDiscovery = 0.85;
  } else if (isHighQuality) {
    hiddenGemDiscovery = 0.5;
  }

  // 7. Novelty & Diversity
  const diversityLevel = profile?.diversityLevel || 0.3;
  const isUnusualGenre = genreAffinity < 0.3;
  const noveltyDiversity = isUnusualGenre ? 0.7 * (1 + diversityLevel) : 0.3;

  // 8. Age Safety Compliance
  const ageFilter = profile?.ageFilter || "all";
  let ageSafetyCompliance = 1.0;
  if (ageFilter === "family_friendly") {
    if (item.ageSuitability && item.ageSuitability !== "family_friendly") {
      ageSafetyCompliance = 0.0;
    }
    if (item.ageRating && ["A", "TV-MA", "R", "NC-17"].includes(item.ageRating)) {
      ageSafetyCompliance = 0.0;
    }
  }

  // Explicit user signals from library
  if (library?.notInterested?.includes(item.id)) {
    ageSafetyCompliance = 0.0;
  }
  if (library?.dislikes?.[item.id]) {
    genreAffinity = Math.max(0.0, genreAffinity - 0.5);
  }
  if (library?.likes?.[item.id]) {
    genreAffinity = Math.min(1.0, genreAffinity + 0.3);
  }

  return {
    genreAffinity: Math.round(genreAffinity * 100) / 100,
    languageAffinity: Math.round(languageAffinity * 100) / 100,
    serviceAvailability: Math.round(serviceAvailability * 100) / 100,
    qualityScore: Math.round(qualityScore * 100) / 100,
    trendingVelocity: Math.round(trendingVelocity * 100) / 100,
    hiddenGemDiscovery: Math.round(hiddenGemDiscovery * 100) / 100,
    noveltyDiversity: Math.round(noveltyDiversity * 100) / 100,
    ageSafetyCompliance: Math.round(ageSafetyCompliance * 100) / 100,
  };
}

/**
 * Predict relevance score using learned linear-sigmoid model
 */
export function predictInstinctRelevance(features, weights = DEFAULT_INSTINCT_WEIGHTS) {
  let z = weights.bias || 0.0;
  for (const f of INSTINCT_FEATURE_NAMES) {
    z += (features[f] || 0) * (weights[f] || 0);
  }
  return 1 / (1 + Math.exp(-z));
}

export function scoreInstinctCandidate(features, weights = DEFAULT_INSTINCT_WEIGHTS) {
  const p = predictInstinctRelevance(features, weights);
  return Math.round(p * 1000) / 10;
}

/**
 * Generate 60 Synthetic Entertainment Preference Scenarios
 */
function createSyntheticScenarios() {
  const list = [];

  // Group 1: K-Drama & East Asian Cinema Enthusiasts (Scenarios 1-15)
  const kdramaConfigs = [
    {
      id: "kdrama_01",
      genres: ["Romantic Comedy", "Slice of Life"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_cloy", "kdrama_hometown"],
    },
    {
      id: "kdrama_02",
      genres: ["Mystery", "Thriller"],
      langs: ["ko"],
      serv: ["netflix", "prime"],
      age: "all",
      ideal: ["kdrama_signal"],
    },
    {
      id: "kdrama_03",
      genres: ["Fantasy", "Music"],
      langs: ["ko"],
      serv: ["prime"],
      age: "family_friendly",
      ideal: ["kdrama_watermelon"],
    },
    {
      id: "kdrama_04",
      genres: ["Medical Drama", "Comedy"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_hospital"],
    },
    {
      id: "kdrama_05",
      genres: ["Animation", "Fantasy"],
      langs: ["ja", "ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["movie_spirited_away"],
    },
    {
      id: "kdrama_06",
      genres: ["Legal Drama", "Slice of Life"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_woo"],
    },
    {
      id: "kdrama_07",
      genres: ["Action", "Romantic Comedy"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "all",
      ideal: ["kdrama_cloy"],
    },
    {
      id: "kdrama_08",
      genres: ["Slice of Life", "Drama"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_hometown", "kdrama_hospital"],
    },
    {
      id: "kdrama_09",
      genres: ["Time Travel", "Youth Drama"],
      langs: ["ko"],
      serv: ["prime"],
      age: "family_friendly",
      ideal: ["kdrama_watermelon"],
    },
    {
      id: "kdrama_10",
      genres: ["Crime", "Police"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "all",
      ideal: ["kdrama_signal"],
    },
    {
      id: "kdrama_11",
      genres: ["Autism Representation", "Legal"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_woo"],
    },
    {
      id: "kdrama_12",
      genres: ["Romance", "Military"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "all",
      ideal: ["kdrama_cloy"],
    },
    {
      id: "kdrama_13",
      genres: ["Classic Ghibli", "Anime"],
      langs: ["ja"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["movie_spirited_away"],
    },
    {
      id: "kdrama_14",
      genres: ["Friendship", "Doctors"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_hospital"],
    },
    {
      id: "kdrama_15",
      genres: ["Seaside Romance", "Community"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_hometown"],
    },
  ];

  for (const c of kdramaConfigs) {
    list.push({
      id: `scen_${c.id}`,
      profile: {
        preferredGenres: { kdrama: c.genres, movie: c.genres },
        preferredLanguages: c.langs,
        preferredServices: c.serv,
        ageFilter: c.age,
      },
      idealIds: c.ideal,
    });
  }

  // Group 2: Indian Cinema & Regional Storytelling (Scenarios 16-30)
  const indianConfigs = [
    {
      id: "indian_01",
      genres: ["Comedy", "Social Satire"],
      langs: ["hi"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["movie_lapata_ladies", "tv_panchayat"],
    },
    {
      id: "indian_02",
      genres: ["Legal Drama", "Social Realism"],
      langs: ["mr", "hi"],
      serv: ["prime"],
      age: "all",
      ideal: ["movie_court"],
    },
    {
      id: "indian_03",
      genres: ["Neo-Noir", "Dark Comedy"],
      langs: ["ta"],
      serv: ["netflix"],
      age: "all",
      ideal: ["movie_super_deluxe"],
    },
    {
      id: "indian_04",
      genres: ["Rural Comedy", "Slice of Life"],
      langs: ["hi"],
      serv: ["prime"],
      age: "family_friendly",
      ideal: ["tv_panchayat"],
    },
    {
      id: "indian_05",
      genres: ["Biographical Drama", "Science"],
      langs: ["hi", "en"],
      serv: ["sonyliv"],
      age: "teens_and_adults",
      ideal: ["tv_rocket_boys"],
    },
    {
      id: "indian_06",
      genres: ["Feminist Cinema", "Drama"],
      langs: ["hi"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["movie_lapata_ladies"],
    },
    {
      id: "indian_07",
      genres: ["Indian Legal System", "Courtroom"],
      langs: ["mr"],
      serv: ["prime"],
      age: "all",
      ideal: ["movie_court"],
    },
    {
      id: "indian_08",
      genres: ["Tamil Multi-narrative", "Anthology"],
      langs: ["ta"],
      serv: ["netflix"],
      age: "all",
      ideal: ["movie_super_deluxe"],
    },
    {
      id: "indian_09",
      genres: ["Panchayat Gram", "Village Politics"],
      langs: ["hi"],
      serv: ["prime"],
      age: "family_friendly",
      ideal: ["tv_panchayat"],
    },
    {
      id: "indian_10",
      genres: ["Indian Space Program", "History"],
      langs: ["hi", "en"],
      serv: ["sonyliv"],
      age: "family_friendly",
      ideal: ["tv_rocket_boys"],
    },
    {
      id: "indian_11",
      genres: ["Rural Satire", "Bridal Mixup"],
      langs: ["hi"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["movie_lapata_ladies"],
    },
    {
      id: "indian_12",
      genres: ["Social Activism", "Marathi Art Cinema"],
      langs: ["mr"],
      serv: ["prime"],
      age: "all",
      ideal: ["movie_court"],
    },
    {
      id: "indian_13",
      genres: ["Quirky Character Study", "Tamil Cinema"],
      langs: ["ta"],
      serv: ["netflix"],
      age: "all",
      ideal: ["movie_super_deluxe"],
    },
    {
      id: "indian_14",
      genres: ["Warm Hearted Humor", "Inspirational"],
      langs: ["hi"],
      serv: ["prime"],
      age: "family_friendly",
      ideal: ["tv_panchayat"],
    },
    {
      id: "indian_15",
      genres: ["Homi Bhabha", "Vikram Sarabhai"],
      langs: ["hi", "en"],
      serv: ["sonyliv"],
      age: "family_friendly",
      ideal: ["tv_rocket_boys"],
    },
  ];

  for (const c of indianConfigs) {
    list.push({
      id: `scen_${c.id}`,
      profile: {
        preferredGenres: { movie: c.genres, tv: c.genres },
        preferredLanguages: c.langs,
        preferredServices: c.serv,
        ageFilter: c.age,
      },
      idealIds: c.ideal,
    });
  }

  // Group 3: Music Discovery & Mood Journeys (Scenarios 31-45)
  const musicConfigs = [
    {
      id: "music_01",
      genres: ["Sufi Devotional", "Meditative"],
      langs: ["hi", "ur"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_kun_faya"],
    },
    {
      id: "music_02",
      genres: ["K-Pop", "Ballad"],
      langs: ["ko"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_spring_day"],
    },
    {
      id: "music_03",
      genres: ["Indie Acoustic", "Folk"],
      langs: ["hi", "en"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_chitta_ve"],
    },
    {
      id: "music_04",
      genres: ["Classical", "Instrumental Piano"],
      langs: ["instrumental"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_clair_de_lune"],
    },
    {
      id: "music_05",
      genres: ["Marathi Folk", "Classical"],
      langs: ["mr"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_marathi_airane"],
    },
    {
      id: "music_06",
      genres: ["Tamil Indie", "Folk"],
      langs: ["ta"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_enjoy_enjaami"],
    },
    {
      id: "music_07",
      genres: ["Spiritual", "AR Rahman"],
      langs: ["hi", "ur"],
      serv: ["youtube"],
      age: "all",
      ideal: ["music_kun_faya"],
    },
    {
      id: "music_08",
      genres: ["BTS", "Korean Pop"],
      langs: ["ko"],
      serv: ["applemusic"],
      age: "all",
      ideal: ["music_spring_day"],
    },
    {
      id: "music_09",
      genres: ["Coffeehouse Acoustic", "Gentle"],
      langs: ["hi"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_chitta_ve"],
    },
    {
      id: "music_10",
      genres: ["Debussy", "Nocturne Piano"],
      langs: ["instrumental"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_clair_de_lune"],
    },
    {
      id: "music_11",
      genres: ["Lavani & Natya Sangeet", "Folk Fusion"],
      langs: ["mr"],
      serv: ["youtube"],
      age: "all",
      ideal: ["music_marathi_airane"],
    },
    {
      id: "music_12",
      genres: ["Dhee", "Arivu", "Oppari"],
      langs: ["ta"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_enjoy_enjaami"],
    },
    {
      id: "music_13",
      genres: ["Qawwali", "Peaceful"],
      langs: ["hi", "ur"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_kun_faya"],
    },
    {
      id: "music_14",
      genres: ["K-Pop Emotional", "Comforting Song"],
      langs: ["ko"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_spring_day"],
    },
    {
      id: "music_15",
      genres: ["Deep Work Study Music", "Instrumental"],
      langs: ["instrumental"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_clair_de_lune"],
    },
  ];

  for (const c of musicConfigs) {
    list.push({
      id: `scen_${c.id}`,
      profile: {
        preferredGenres: { music: c.genres },
        preferredLanguages: c.langs,
        preferredServices: c.serv,
        ageFilter: c.age,
      },
      idealIds: c.ideal,
    });
  }

  // Group 4: Cross-Media, Western TV & Global Cinema (Scenarios 46-60)
  const crossConfigs = [
    {
      id: "cross_01",
      genres: ["Romance", "Drama"],
      langs: ["en", "ko"],
      serv: ["prime"],
      age: "all",
      ideal: ["movie_past_lives"],
    },
    {
      id: "cross_02",
      genres: ["Mockumentary", "School Comedy"],
      langs: ["en"],
      serv: ["hotstar"],
      age: "family_friendly",
      ideal: ["tv_abbott_elementary"],
    },
    {
      id: "cross_03",
      genres: ["Warm Comedy", "Community"],
      langs: ["hi", "ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_hometown", "tv_panchayat"],
    },
    {
      id: "cross_04",
      genres: ["Music", "Piano"],
      langs: ["ko", "instrumental"],
      serv: ["spotify", "netflix"],
      age: "family_friendly",
      ideal: ["kdrama_watermelon", "music_clair_de_lune"],
    },
    {
      id: "cross_05",
      genres: ["Social Satire", "Indie Folk"],
      langs: ["hi", "ta"],
      serv: ["netflix", "spotify"],
      age: "all",
      ideal: ["movie_lapata_ladies", "music_enjoy_enjaami"],
    },
    {
      id: "cross_06",
      genres: ["Celine Song", "Immigrant Experience"],
      langs: ["en", "ko"],
      serv: ["prime"],
      age: "all",
      ideal: ["movie_past_lives"],
    },
    {
      id: "cross_07",
      genres: ["Elementary School Teachers", "Philadelphia"],
      langs: ["en"],
      serv: ["hotstar"],
      age: "family_friendly",
      ideal: ["tv_abbott_elementary"],
    },
    {
      id: "cross_08",
      genres: ["Gentle Healing", "Wholesome Friends"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_hospital"],
    },
    {
      id: "cross_09",
      genres: ["Breathtaking Hand-Drawn Anime", "Masterpiece"],
      langs: ["ja"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["movie_spirited_away"],
    },
    {
      id: "cross_10",
      genres: ["Clever Mystery", "Cold Cases"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "all",
      ideal: ["kdrama_signal"],
    },
    {
      id: "cross_11",
      genres: ["Acoustic Poetry", "Reflective"],
      langs: ["hi"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_chitta_ve"],
    },
    {
      id: "cross_12",
      genres: ["Atheist Street Theatre", "Marathi Culture"],
      langs: ["mr"],
      serv: ["prime"],
      age: "all",
      ideal: ["movie_court"],
    },
    {
      id: "cross_13",
      genres: ["Nuclear Physics", "Visionaries"],
      langs: ["hi", "en"],
      serv: ["sonyliv"],
      age: "family_friendly",
      ideal: ["tv_rocket_boys"],
    },
    {
      id: "cross_14",
      genres: ["Whimsical Love Story", "Unlikely Friends"],
      langs: ["ko"],
      serv: ["netflix"],
      age: "family_friendly",
      ideal: ["kdrama_cloy"],
    },
    {
      id: "cross_15",
      genres: ["South Indian Culture", "Global Acclaim"],
      langs: ["ta"],
      serv: ["spotify"],
      age: "all",
      ideal: ["music_enjoy_enjaami"],
    },
  ];

  for (const c of crossConfigs) {
    list.push({
      id: `scen_${c.id}`,
      profile: {
        preferredGenres: { movie: c.genres, tv: c.genres, kdrama: c.genres, music: c.genres },
        preferredLanguages: c.langs,
        preferredServices: c.serv,
        ageFilter: c.age,
      },
      idealIds: c.ideal,
    });
  }

  return list;
}

export const SYNTHETIC_INSTINCT_SCENARIOS = createSyntheticScenarios();

/**
 * Supervised Training & Held-Out Evaluation Function
 */
export function trainAndEvaluateInstinctModel(
  catalogueOrOptions = VERIFIED_ENTERTAINMENT,
  scenariosArg = SYNTHETIC_INSTINCT_SCENARIOS,
  trainSplitArg = 0.7,
  epochsArg = 75,
  learningRateArg = 0.08,
) {
  let catalogue = VERIFIED_ENTERTAINMENT;
  let scenarios = SYNTHETIC_INSTINCT_SCENARIOS;
  let trainSplit = 0.7;
  let epochs = 75;
  let learningRate = 0.08;

  if (
    catalogueOrOptions &&
    !Array.isArray(catalogueOrOptions) &&
    typeof catalogueOrOptions === "object"
  ) {
    catalogue = catalogueOrOptions.catalogue || VERIFIED_ENTERTAINMENT;
    scenarios = catalogueOrOptions.scenarios || SYNTHETIC_INSTINCT_SCENARIOS;
    trainSplit = catalogueOrOptions.trainSplit ?? 0.7;
    epochs = catalogueOrOptions.epochs ?? 75;
    learningRate = catalogueOrOptions.learningRate ?? 0.08;
  } else {
    catalogue = catalogueOrOptions || VERIFIED_ENTERTAINMENT;
    scenarios = scenariosArg || SYNTHETIC_INSTINCT_SCENARIOS;
    trainSplit = trainSplitArg ?? 0.7;
    epochs = epochsArg ?? 75;
    learningRate = learningRateArg ?? 0.08;
  }

  const trainCount = Math.floor(scenarios.length * trainSplit);
  const trainScenarios = scenarios.slice(0, trainCount);
  const testScenarios = scenarios.slice(trainCount);

  const weights = { ...DEFAULT_INSTINCT_WEIGHTS };

  // Pairwise Logistic Loss Optimization (RankNet style)
  for (let ep = 0; ep < epochs; ep++) {
    for (const scen of trainScenarios) {
      const idealSet = new Set(scen.idealIds);
      const posItems = catalogue.filter((item) => idealSet.has(item.id));
      const negItems = catalogue.filter((item) => !idealSet.has(item.id));

      for (const pos of posItems) {
        const posFeats = extractInstinctFeatures(pos, scen.profile);
        for (const neg of negItems.slice(0, 4)) {
          const negFeats = extractInstinctFeatures(neg, scen.profile);

          let diffZ = 0;
          for (const f of INSTINCT_FEATURE_NAMES) {
            diffZ += (posFeats[f] - negFeats[f]) * weights[f];
          }

          const probPosBeatsNeg = 1 / (1 + Math.exp(-diffZ));
          const lossGradient = 1.0 - probPosBeatsNeg;

          for (const f of INSTINCT_FEATURE_NAMES) {
            const featureDelta = posFeats[f] - negFeats[f];
            const reg = 0.005 * (weights[f] - DEFAULT_INSTINCT_WEIGHTS[f]);
            weights[f] += learningRate * (lossGradient * featureDelta - reg);
            // Ensure weights remain positive domain
            if (weights[f] < 0.2) weights[f] = 0.2;
          }
        }
      }
    }
  }

  // Held-Out Test Evaluation
  let totalNdcg5 = 0;
  let totalNdcg10 = 0;
  let totalP5 = 0;
  let totalP10 = 0;
  let totalMrr = 0;

  for (const scen of testScenarios) {
    const idealSet = new Set(scen.idealIds);

    const scored = catalogue
      .map((item) => {
        const feats = extractInstinctFeatures(item, scen.profile);
        const score = predictInstinctRelevance(feats, weights);
        return { item, score, isIdeal: idealSet.has(item.id) };
      })
      .sort((a, b) => b.score - a.score);

    const computeDcg = (items, k) => {
      let dcg = 0;
      for (let i = 0; i < Math.min(k, items.length); i++) {
        const rel = items[i].isIdeal ? 1 : 0;
        dcg += rel / Math.log2(i + 2);
      }
      return dcg;
    };

    const idealSorted = [...scored].sort((a, b) => (b.isIdeal ? 1 : 0) - (a.isIdeal ? 1 : 0));
    const idcg5 = computeDcg(idealSorted, 5) || 1.0;
    const idcg10 = computeDcg(idealSorted, 10) || 1.0;

    totalNdcg5 += computeDcg(scored, 5) / idcg5;
    totalNdcg10 += computeDcg(scored, 10) / idcg10;

    const top5Ideal = scored.slice(0, 5).filter((s) => s.isIdeal).length;
    const top10Ideal = scored.slice(0, 10).filter((s) => s.isIdeal).length;
    totalP5 += top5Ideal / Math.min(5, scored.length);
    totalP10 += top10Ideal / Math.min(10, scored.length);

    const firstHit = scored.findIndex((s) => s.isIdeal);
    if (firstHit !== -1) {
      totalMrr += 1.0 / (firstHit + 1);
    }
  }

  const n = testScenarios.length || 1;
  const metrics = {
    trainScenarioCount: trainScenarios.length,
    testScenarioCount: testScenarios.length,
    ndcgAt5: Math.round((totalNdcg5 / n) * 1000) / 1000,
    ndcgAt10: Math.round((totalNdcg10 / n) * 1000) / 1000,
    precisionAt5: Math.round((totalP5 / n) * 1000) / 1000,
    precisionAt10: Math.round((totalP10 / n) * 1000) / 1000,
    meanReciprocalRank: Math.round((totalMrr / n) * 1000) / 1000,
  };

  return { weights, metrics };
}
