/**
 * Saheli 7.6 — INSTINCT Recommendation & Discovery Engine
 *
 * Section 14: Recommendation Dashboard Generation
 * Section 15: Explainable Preference Learning & Content-Based Similarity
 * Section 18: Content Suitability & Age Safety Filtering
 */

import { VERIFIED_ENTERTAINMENT } from "../content/entertainment.js";
import {
  extractInstinctFeatures,
  scoreInstinctCandidate,
  DEFAULT_INSTINCT_WEIGHTS,
} from "./instinctML.js";

/**
 * Filter items according to age filter and not-interested list
 */
export function filterSuitability(items, profile = {}, library = {}) {
  const notInterestedSet = new Set(library?.notInterested || []);
  const ageFilter = profile?.ageFilter || "all";

  return items.filter((item) => {
    // 1. Check user exclusion
    if (notInterestedSet.has(item.id)) return false;

    // 2. Age safety
    if (ageFilter === "family_friendly") {
      if (item.ageSuitability && item.ageSuitability !== "family_friendly") {
        return false;
      }
      if (item.ageRating && ["A", "TV-MA", "R", "NC-17"].includes(item.ageRating)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Score and rank a list of candidates using INSTINCT ML feature extractor and weights
 */
export function rankMediaCandidates(
  items,
  profile = {},
  library = {},
  weights = DEFAULT_INSTINCT_WEIGHTS,
) {
  const suitable = filterSuitability(items, profile, library);

  const scored = suitable.map((item) => {
    const features = extractInstinctFeatures(item, profile, library);
    const score = scoreInstinctCandidate(features, weights);
    return {
      item,
      score,
      features,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Provide human-readable, grounded explanation for why an item was recommended
 */
export function explainRecommendation(item, profile = {}, library = {}) {
  const features = extractInstinctFeatures(item, profile, library);
  const reasons = [];

  const itemGenres = item.genres || (item.genre ? [item.genre] : []);
  const userGenres = profile?.preferredGenres?.[item.type] || [];
  const matchedGenres = itemGenres.filter((g) =>
    userGenres.some((ug) => ug.toLowerCase() === g.toLowerCase()),
  );

  if (matchedGenres.length > 0) {
    reasons.push({
      key: "genre_match",
      text: `Matches your taste for ${matchedGenres.join(", ")}`,
      weight: features.genreAffinity,
    });
  }

  // Liked items reference
  const likedItems = Object.keys(library?.likes || {}).filter((k) => library.likes[k]);
  const userCompleted = library?.completed || [];
  const positiveIds = [...new Set([...likedItems, ...userCompleted])];

  const matchedLiked = VERIFIED_ENTERTAINMENT.filter(
    (other) =>
      positiveIds.includes(other.id) &&
      other.id !== item.id &&
      (other.genres || []).some((g) => itemGenres.includes(g)),
  );

  if (matchedLiked.length > 0) {
    reasons.push({
      key: "because_you_liked",
      text: `Because you enjoyed "${matchedLiked[0].title}"`,
      weight: 0.9,
    });
  }

  // Streaming availability
  const userServices = profile?.preferredServices || [];
  const availableServices = (item.streamingServices || []).filter((s) => userServices.includes(s));
  if (availableServices.length > 0) {
    const serviceNames = availableServices.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
    reasons.push({
      key: "service_match",
      text: `Available to stream on your active service (${serviceNames.join(", ")})`,
      weight: features.serviceAvailability,
    });
  }

  // Quality & acclaim
  if (item.rating && item.rating >= 8.5) {
    reasons.push({
      key: "critical_acclaim",
      text: `Critically acclaimed with a verified ${item.rating}/10 community rating`,
      weight: features.qualityScore,
    });
  }

  // Trending
  if (item.trendingScore && item.trendingScore >= 85) {
    reasons.push({
      key: "trending",
      text: "Trending with rising audience discovery right now",
      weight: features.trendingVelocity,
    });
  }

  // Hidden gem
  if (features.hiddenGemDiscovery > 0.75) {
    reasons.push({
      key: "hidden_gem",
      text: "Hidden Gem: High audience appreciation and unique storytelling",
      weight: features.hiddenGemDiscovery,
    });
  }

  // Fallback
  if (reasons.length === 0) {
    reasons.push({
      key: "discovery",
      text: "Recommended for fresh exploration based on popular appeal",
      weight: 0.5,
    });
  }

  return reasons;
}

/**
 * Find similar titles based on genre, creators, country, and type
 */
export function getSimilarTitles(mediaId, catalogue = VERIFIED_ENTERTAINMENT, limit = 4) {
  const target = catalogue.find((item) => item.id === mediaId);
  if (!target) return [];

  const targetGenres = new Set(target.genres || (target.genre ? [target.genre] : []));
  const targetCreators = new Set(target.creators || (target.artist ? [target.artist] : []));

  const candidates = catalogue.filter((item) => item.id !== mediaId);

  const scored = candidates.map((item) => {
    let score = 0;
    // Same type bonus
    if (item.type === target.type) score += 3.0;

    // Genre overlap
    const itemGenres = item.genres || (item.genre ? [item.genre] : []);
    const overlap = itemGenres.filter((g) => targetGenres.has(g)).length;
    score += overlap * 2.0;

    // Creator / Artist overlap
    const itemCreators = item.creators || (item.artist ? [item.artist] : []);
    if (itemCreators.some((c) => targetCreators.has(c))) {
      score += 4.0;
    }

    // Language / Country match
    if (item.originalLanguage === target.originalLanguage) score += 1.5;
    if (item.country === target.country) score += 1.0;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Filter catalogue by search query and category
 */
export function searchCatalogue(
  query = "",
  type = "all",
  catalogue = VERIFIED_ENTERTAINMENT,
  profile = {},
  library = {},
) {
  let items = filterSuitability(catalogue, profile, library);

  if (type && type !== "all") {
    items = items.filter((item) => item.type === type);
  }

  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter((item) => {
    const title = (item.title || "").toLowerCase();
    const origTitle = (item.originalTitle || "").toLowerCase();
    const synopsis = (item.synopsis || "").toLowerCase();
    const artist = (item.artist || "").toLowerCase();
    const cast = (item.cast || []).join(" ").toLowerCase();
    const creators = (item.creators || []).join(" ").toLowerCase();
    const genres = (item.genres || (item.genre ? [item.genre] : [])).join(" ").toLowerCase();

    return (
      title.includes(q) ||
      origTitle.includes(q) ||
      synopsis.includes(q) ||
      artist.includes(q) ||
      cast.includes(q) ||
      creators.includes(q) ||
      genres.includes(q)
    );
  });
}

/**
 * Generate complete Recommendation Dashboard sections
 */
export function getDashboardSections(
  profile = {},
  library = {},
  catalogue = VERIFIED_ENTERTAINMENT,
  weights = DEFAULT_INSTINCT_WEIGHTS,
) {
  const suitable = filterSuitability(catalogue, profile, library);
  const ranked = rankMediaCandidates(suitable, profile, library, weights);

  // 1. Recommended for You (Top items excluding already watched / completed)
  const completedSet = new Set(library.completed || []);
  const watchingIds = Object.keys(library.currentlyWatching || {});
  const watchingSet = new Set(watchingIds);

  const recommendedForYou = ranked
    .filter((r) => !completedSet.has(r.item.id) && !watchingSet.has(r.item.id))
    .slice(0, 10)
    .map((r) => r.item);

  // 2. Because You Liked...
  const likedKeys = Object.keys(library.likes || {}).filter((k) => library.likes[k]);
  const referenceId = likedKeys[0] || library.favourites?.[0] || completedSet.values().next().value;
  let becauseYouLiked = [];
  let referenceTitle = "";

  if (referenceId) {
    const refItem = catalogue.find((item) => item.id === referenceId);
    if (refItem) {
      referenceTitle = refItem.title;
      becauseYouLiked = getSimilarTitles(referenceId, suitable, 6).filter(
        (item) => !completedSet.has(item.id),
      );
    }
  }

  // 3. Continue Watching
  const continueWatching = [];
  for (const id of watchingIds) {
    const item = catalogue.find((c) => c.id === id);
    if (item) {
      continueWatching.push({
        item,
        progress: library.currentlyWatching[id],
      });
    }
  }

  // 4. Something Different (Exploratory diversity)
  const somethingDifferent = suitable
    .filter((item) => {
      const feat = extractInstinctFeatures(item, profile, library);
      return feat.noveltyDiversity > 0.65 && (item.rating || 0) >= 7.8;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  // 5. Hidden Gems (High rating, low mainstream saturation)
  const hiddenGems = suitable
    .filter((item) => {
      const feat = extractInstinctFeatures(item, profile, library);
      return feat.hiddenGemDiscovery > 0.65 && (item.rating || 0) >= 8.0;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  // 6. Trending Now
  const trendingNow = [...suitable]
    .filter((item) => item.trendingScore != null)
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 8);

  // 7. Recently Released
  const recentlyReleased = [...suitable]
    .filter((item) => item.releaseYear != null)
    .sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : a.releaseYear * 10000;
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : b.releaseYear * 10000;
      return dateB - dateA;
    })
    .slice(0, 8);

  // 8. Music for You
  const musicForYou = suitable
    .filter((item) => item.type === "music")
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  // 9. Explore K-Dramas
  const exploreKdramas = suitable
    .filter((item) => item.type === "kdrama")
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  return {
    recommendedForYou,
    becauseYouLiked: {
      title: referenceTitle,
      items: becauseYouLiked,
    },
    continueWatching,
    somethingDifferent,
    hiddenGems,
    trendingNow,
    recentlyReleased,
    musicForYou,
    exploreKdramas,
  };
}
