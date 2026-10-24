/**
 * Saheli 7.6 — INSTINCT AI Discovery & Verification Test Suite
 *
 * Requirements:
 * - Vitest runner (NEVER bun:test)
 * - Catalogue integrity & verified streaming sources
 * - Privacy isolation (zero cycle or medical diary leakage)
 * - ML ranking engine, feature extraction & held-out evaluation
 * - K-Drama episode tracking & Library mutations
 * - "Ask INSTINCT" conversational boundary & medical refusal
 * - JSON and CSV data portability
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  VERIFIED_ENTERTAINMENT,
  STREAMING_PLATFORMS,
  MEDIA_TYPES,
} from "../content/entertainment.js";
import {
  DEFAULT_INSTINCT_PROFILE,
  DEFAULT_INSTINCT_LIBRARY,
  loadInstinctProfile,
  saveInstinctProfile,
  loadInstinctLibrary,
  saveInstinctLibrary,
  updateWatchProgress,
  toggleLibraryItem,
  setMediaRating,
  setMediaPreference,
  exportLibraryAsJson,
  exportLibraryAsCsv,
  importLibraryFromJson,
  importLibraryFromCsv,
} from "../lib/instinctStorage.js";
import {
  extractInstinctFeatures,
  predictInstinctRelevance,
  trainAndEvaluateInstinctModel,
  DEFAULT_INSTINCT_WEIGHTS,
} from "../lib/instinctML.js";
import {
  getDashboardSections,
  getSimilarTitles,
  explainRecommendation,
  filterSuitability,
  searchCatalogue,
} from "../lib/instinctRecommender.js";
import { handleInstinctChat } from "../server/api/instinct/assistant.js";

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getStore: () => store,
  };
})();

if (typeof global.localStorage === "undefined") {
  global.localStorage = localStorageMock;
}

describe("Saheli 7.6 — INSTINCT Entertainment Catalogue Integrity", () => {
  it("contains verified media items across Movies, TV Series, K-Dramas, and Music", () => {
    expect(VERIFIED_ENTERTAINMENT.length).toBeGreaterThanOrEqual(15);

    const types = new Set(VERIFIED_ENTERTAINMENT.map((item) => item.type));
    expect(types.has("movie")).toBe(true);
    expect(types.has("tv")).toBe(true);
    expect(types.has("kdrama")).toBe(true);
    expect(types.has("music")).toBe(true);
  });

  it("ensures all items have valid identifiers, titles, and sources", () => {
    for (const item of VERIFIED_ENTERTAINMENT) {
      expect(item.id).toBeDefined();
      expect(typeof item.id).toBe("string");
      expect(item.title).toBeDefined();
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.sourceAttribution).toBeDefined();
      expect(item.posterUrl).toMatch(/^https?:\/\//);

      if (item.type !== "music") {
        expect(item.rating).toBeGreaterThanOrEqual(7.0);
        expect(item.rating).toBeLessThanOrEqual(10.0);
        expect(item.streamingServices).toBeDefined();
        expect(item.streamingServices.length).toBeGreaterThan(0);
      } else {
        expect(item.artist).toBeDefined();
        expect(item.previewAudioUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  it("verifies streaming platforms include Indian mainstream providers", () => {
    const platformIds = STREAMING_PLATFORMS.map((p) => p.id);
    expect(platformIds).toContain("netflix");
    expect(platformIds).toContain("prime");
    expect(platformIds).toContain("hotstar");
    expect(platformIds).toContain("spotify");
  });
});

describe("Saheli 7.6 — INSTINCT Privacy Isolation & Library Storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("loads default profile and isolated library without touching health data", () => {
    const profile = loadInstinctProfile();
    const library = loadInstinctLibrary();

    expect(profile.onboardingCompleted).toBe(false);
    expect(profile.ageFilter).toBe("all");
    expect(Array.isArray(library.watchlist)).toBe(true);
    expect(typeof library.currentlyWatching).toBe("object");

    const store = localStorageMock.getStore();
    expect(store["saheli_records"]).toBeUndefined();
    expect(store["saheli_companion"]).toBeUndefined();
    expect(store["saheli_health_conditions_v1"]).toBeUndefined();
  });

  it("updates and toggles library actions correctly", () => {
    let lib = loadInstinctLibrary();

    // Toggle Watchlist
    lib = toggleLibraryItem("watchlist", "kdrama_cloy", lib);
    expect(lib.watchlist).toContain("kdrama_cloy");

    lib = toggleLibraryItem("watchlist", "kdrama_cloy", lib);
    expect(lib.watchlist).not.toContain("kdrama_cloy");

    // Star Rating
    lib = setMediaRating("movie_lapata_ladies", 9, lib);
    expect(lib.ratings["movie_lapata_ladies"]).toBe(9);

    // Likes & Dislikes
    lib = setMediaPreference("tv_panchayat", "like", lib);
    expect(lib.likes["tv_panchayat"]).toBe(true);
    expect(lib.dislikes["tv_panchayat"]).toBe(false);

    lib = setMediaPreference("tv_panchayat", "dislike", lib);
    expect(lib.likes["tv_panchayat"]).toBe(false);
    expect(lib.dislikes["tv_panchayat"]).toBe(true);
  });

  it("tracks K-Drama watching progress (season and episode)", () => {
    let lib = loadInstinctLibrary();
    lib = updateWatchProgress("kdrama_hospital", 2, 5, lib);

    expect(lib.currentlyWatching["kdrama_hospital"]).toBeDefined();
    expect(lib.currentlyWatching["kdrama_hospital"].season).toBe(2);
    expect(lib.currentlyWatching["kdrama_hospital"].episode).toBe(5);
    expect(lib.currentlyWatching["kdrama_hospital"].lastUpdated).toBeDefined();
  });
});

describe("Saheli 7.6 — INSTINCT Feature Extractor & ML Ranking Engine", () => {
  it("extracts 8-dimensional normalized feature vectors", () => {
    const item = VERIFIED_ENTERTAINMENT[0];
    const profile = {
      preferredGenres: { kdrama: ["Romantic Comedy"] },
      preferredLanguages: ["ko"],
      preferredServices: ["netflix"],
      ageFilter: "family_friendly",
    };

    const features = extractInstinctFeatures(item, profile);

    expect(features.genreAffinity).toBeGreaterThanOrEqual(0.0);
    expect(features.genreAffinity).toBeLessThanOrEqual(1.0);
    expect(features.languageAffinity).toBe(1.0);
    expect(features.serviceAvailability).toBe(1.0);
    expect(features.qualityScore).toBeGreaterThanOrEqual(0.0);
    expect(features.ageSafetyCompliance).toBe(1.0);
  });

  it("restricts age-unsafe titles in family-friendly mode", () => {
    const matureItem = {
      id: "mature_test",
      type: "movie",
      ageRating: "A",
      ageSuitability: "adults_only",
      rating: 8.5,
    };

    const familyProfile = { ageFilter: "family_friendly" };
    const features = extractInstinctFeatures(matureItem, familyProfile);

    expect(features.ageSafetyCompliance).toBe(0.0);

    const suitable = filterSuitability([matureItem], familyProfile);
    expect(suitable).toHaveLength(0);
  });

  it("computes explainable recommendations with verified signals", () => {
    const item = VERIFIED_ENTERTAINMENT.find((i) => i.id === "kdrama_cloy");
    const profile = {
      preferredGenres: { kdrama: ["Romantic Comedy"] },
      preferredServices: ["netflix"],
    };

    const reasons = explainRecommendation(item, profile);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some((r) => r.key === "genre_match" || r.key === "critical_acclaim")).toBe(true);
  });
});

describe("Saheli 7.6 — INSTINCT Model Training & Evaluation Pipeline", () => {
  it("trains the model on 60 synthetic scenarios and reports held-out metrics", () => {
    const { weights, metrics } = trainAndEvaluateInstinctModel({
      epochs: 40,
      learningRate: 0.05,
    });

    expect(metrics.trainScenarioCount).toBe(42);
    expect(metrics.testScenarioCount).toBe(18);

    // Held-out test evaluation requirements
    expect(metrics.ndcgAt5).toBeGreaterThan(0.5);
    expect(metrics.ndcgAt10).toBeGreaterThan(0.5);
    expect(metrics.meanReciprocalRank).toBeGreaterThan(0.5);

    // Check weights positivity
    expect(weights.genreAffinity).toBeGreaterThan(0.2);
    expect(weights.languageAffinity).toBeGreaterThan(0.2);
    expect(weights.serviceAvailability).toBeGreaterThan(0.2);
    expect(weights.qualityScore).toBeGreaterThan(0.2);
  });
});

describe("Saheli 7.6 — Ask INSTINCT Conversational Assistant & Privacy Boundary", () => {
  it("provides helpful entertainment suggestions for genre or vibe queries", async () => {
    const res = await handleInstinctChat("Recommend a heartwarming family comedy");
    expect(res.text).toBeDefined();
    expect(res.text.length).toBeGreaterThan(20);
    expect(res.recommendations).toBeDefined();
  });

  it("strictly refuses medical and cycle inquiries and redirects to doctor/health AI", async () => {
    const medicalQueries = [
      "I am having severe period cramps and bleeding",
      "Can you help me calculate my ovulation?",
      "Is heavy menstrual discharge normal?",
      "Should I take a pregnancy contraceptive pill?",
    ];

    for (const query of medicalQueries) {
      const res = await handleInstinctChat(query);
      expect(res.text).toMatch(/I am INSTINCT, your entertainment/i);
      expect(res.text).toMatch(/health|cycle|doctor/i);
      expect(res.recommendations).toBeUndefined();
    }
  });
});

describe("Saheli 7.6 — INSTINCT JSON & CSV Data Portability", () => {
  it("exports and imports library data faithfully via JSON", () => {
    const originalLib = {
      ...DEFAULT_INSTINCT_LIBRARY,
      watchlist: ["kdrama_cloy", "movie_lapata_ladies"],
      favourites: ["music_kun_faya"],
      ratings: { kdrama_cloy: 10 },
      currentlyWatching: { kdrama_cloy: { season: 1, episode: 12 } },
    };

    const jsonExport = exportLibraryAsJson(originalLib);
    expect(typeof jsonExport).toBe("string");

    const reimported = importLibraryFromJson(jsonExport);
    expect(reimported.watchlist).toContain("kdrama_cloy");
    expect(reimported.watchlist).toContain("movie_lapata_ladies");
    expect(reimported.favourites).toContain("music_kun_faya");
    expect(reimported.ratings["kdrama_cloy"]).toBe(10);
    expect(reimported.currentlyWatching["kdrama_cloy"].episode).toBe(12);
  });

  it("exports and imports library data faithfully via CSV", () => {
    const originalLib = {
      ...DEFAULT_INSTINCT_LIBRARY,
      watchlist: ["kdrama_cloy"],
      favourites: ["music_kun_faya"],
      ratings: { kdrama_cloy: 9 },
      currentlyWatching: { kdrama_cloy: { season: 1, episode: 8 } },
    };

    const csvExport = exportLibraryAsCsv(originalLib);
    expect(csvExport).toContain("mediaId,inWatchlist,isFavourite");
    expect(csvExport).toContain("kdrama_cloy");

    const reimported = importLibraryFromCsv(csvExport);
    expect(reimported.watchlist).toContain("kdrama_cloy");
    expect(reimported.ratings["kdrama_cloy"]).toBe(9);
  });
});

describe("Saheli 7.6 — Dashboard Generation & Content Discovery", () => {
  it("generates structured recommendation sections for dashboard", () => {
    const profile = { ...DEFAULT_INSTINCT_PROFILE };
    const library = { ...DEFAULT_INSTINCT_LIBRARY };

    const sections = getDashboardSections(profile, library, VERIFIED_ENTERTAINMENT);

    expect(sections.recommendedForYou.length).toBeGreaterThan(0);
    expect(sections.trendingNow.length).toBeGreaterThan(0);
    expect(sections.exploreKdramas.length).toBeGreaterThan(0);
    expect(sections.musicForYou.length).toBeGreaterThan(0);
    expect(sections.hiddenGems.length).toBeGreaterThan(0);
  });

  it("finds similar titles based on genre, creators, and media type", () => {
    const similar = getSimilarTitles("kdrama_cloy", VERIFIED_ENTERTAINMENT, 3);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.some((s) => s.id === "kdrama_cloy")).toBe(false);
  });

  it("searches catalogue by title and genre keyword", () => {
    const results = searchCatalogue("ladies", "all", VERIFIED_ENTERTAINMENT);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("movie_lapata_ladies");
  });
});
