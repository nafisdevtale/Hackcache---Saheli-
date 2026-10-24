/**
 * Saheli 7.6 — INSTINCT Private Local Library & Preference Storage
 *
 * Privacy Guarantees:
 * - 100% On-Device Storage.
 * - Completely isolated from menstrual diary, health conditions, companion, and cycle logs.
 * - Zero remote tracking pixels or telemetry.
 * - Full JSON and CSV export/import portability.
 */

const INSTINCT_LIBRARY_KEY = "saheli_instinct_library_v1";
const INSTINCT_PROFILE_KEY = "saheli_instinct_profile_v1";

export const DEFAULT_INSTINCT_PROFILE = {
  onboardingCompleted: false,
  ageFilter: "all", // "all" | "family_friendly" | "teens_and_adults"
  preferredGenres: {
    movie: [],
    tv: [],
    kdrama: [],
    music: [],
  },
  preferredLanguages: ["en", "hi", "ko"],
  preferredServices: ["netflix", "prime", "spotify"],
  diversityLevel: 0.3, // Exploration ratio
  weights: {
    genreMatch: 2.8,
    languageMatch: 2.2,
    serviceMatch: 2.0,
    trendingFactor: 1.1,
    ratingFactor: 1.5,
  },
};

export const DEFAULT_INSTINCT_LIBRARY = {
  watchlist: [],
  currentlyWatching: {}, // { [id]: { season: number, episode: number, lastUpdated: string } }
  completed: [],
  wantToWatch: [],
  favourites: [],
  notInterested: [],
  savedMusic: [],
  favouriteArtists: [],
  ratings: {}, // { [id]: number } (1-10)
  likes: {}, // { [id]: boolean }
  dislikes: {}, // { [id]: boolean }
  recentlyExplored: [], // Array of ids, max 30
};

export function loadInstinctProfile() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(INSTINCT_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_INSTINCT_PROFILE,
          ...parsed,
          preferredGenres: {
            ...DEFAULT_INSTINCT_PROFILE.preferredGenres,
            ...(parsed.preferredGenres || {}),
          },
          weights: {
            ...DEFAULT_INSTINCT_PROFILE.weights,
            ...(parsed.weights || {}),
          },
        };
      }
    }
  } catch {}
  return { ...DEFAULT_INSTINCT_PROFILE };
}

export function saveInstinctProfile(profile) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(INSTINCT_PROFILE_KEY, JSON.stringify(profile));
    }
  } catch {}
}

export function loadInstinctLibrary() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(INSTINCT_LIBRARY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
          currentlyWatching:
            typeof parsed.currentlyWatching === "object" && parsed.currentlyWatching !== null
              ? parsed.currentlyWatching
              : {},
          completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          wantToWatch: Array.isArray(parsed.wantToWatch) ? parsed.wantToWatch : [],
          favourites: Array.isArray(parsed.favourites) ? parsed.favourites : [],
          notInterested: Array.isArray(parsed.notInterested) ? parsed.notInterested : [],
          savedMusic: Array.isArray(parsed.savedMusic) ? parsed.savedMusic : [],
          favouriteArtists: Array.isArray(parsed.favouriteArtists) ? parsed.favouriteArtists : [],
          ratings:
            typeof parsed.ratings === "object" && parsed.ratings !== null ? parsed.ratings : {},
          likes: typeof parsed.likes === "object" && parsed.likes !== null ? parsed.likes : {},
          dislikes:
            typeof parsed.dislikes === "object" && parsed.dislikes !== null ? parsed.dislikes : {},
          recentlyExplored: Array.isArray(parsed.recentlyExplored) ? parsed.recentlyExplored : [],
        };
      }
    }
  } catch {}
  return { ...DEFAULT_INSTINCT_LIBRARY };
}

export function saveInstinctLibrary(library) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(INSTINCT_LIBRARY_KEY, JSON.stringify(library));
    }
  } catch {}
}

/**
 * Universal toggle for library lists (watchlist, favourites, completed, savedMusic, etc.)
 */
export function toggleLibraryItem(listKey, id, currentLib = null) {
  const lib = currentLib ? JSON.parse(JSON.stringify(currentLib)) : loadInstinctLibrary();
  if (!Array.isArray(lib[listKey])) {
    lib[listKey] = [];
  }

  const idx = lib[listKey].indexOf(id);
  if (idx > -1) {
    lib[listKey].splice(idx, 1);
  } else {
    lib[listKey].push(id);
  }

  if (!currentLib) {
    saveInstinctLibrary(lib);
  }
  return lib;
}

export function toggleWatchlist(mediaId) {
  const lib = toggleLibraryItem("watchlist", mediaId);
  return lib.watchlist.includes(mediaId);
}

export function toggleFavourite(mediaId) {
  const lib = toggleLibraryItem("favourites", mediaId);
  return lib.favourites.includes(mediaId);
}

export function toggleSavedMusic(songId) {
  const lib = toggleLibraryItem("savedMusic", songId);
  return lib.savedMusic.includes(songId);
}

export function toggleFavouriteArtist(artistName) {
  const lib = toggleLibraryItem("favouriteArtists", artistName);
  return lib.favouriteArtists.includes(artistName);
}

/**
 * Track or update watch progress (supports both stateful and pure passing)
 */
export function updateWatchProgress(mediaId, season = 1, episode = 1, libOrStatus = null) {
  let lib;
  let status = "watching";

  if (libOrStatus && typeof libOrStatus === "object") {
    lib = JSON.parse(JSON.stringify(libOrStatus));
  } else {
    lib = loadInstinctLibrary();
    if (typeof libOrStatus === "string") {
      status = libOrStatus;
    }
  }

  const now = new Date().toISOString();
  if (!lib.currentlyWatching) lib.currentlyWatching = {};

  lib.completed = (lib.completed || []).filter((id) => id !== mediaId);
  lib.wantToWatch = (lib.wantToWatch || []).filter((id) => id !== mediaId);

  if (status === "watching") {
    lib.currentlyWatching[mediaId] = { season, episode, lastUpdated: now };
  } else if (status === "completed") {
    delete lib.currentlyWatching[mediaId];
    if (!lib.completed.includes(mediaId)) lib.completed.push(mediaId);
  } else if (status === "want_to_watch") {
    delete lib.currentlyWatching[mediaId];
    if (!lib.wantToWatch.includes(mediaId)) lib.wantToWatch.push(mediaId);
  }

  if (!libOrStatus || typeof libOrStatus !== "object") {
    saveInstinctLibrary(lib);
  }
  return lib;
}

export function setMediaRating(mediaId, rating, currentLib = null) {
  const lib = currentLib ? JSON.parse(JSON.stringify(currentLib)) : loadInstinctLibrary();
  if (!lib.ratings) lib.ratings = {};

  if (typeof rating === "number" && rating >= 1 && rating <= 10) {
    lib.ratings[mediaId] = rating;
  } else {
    delete lib.ratings[mediaId];
  }

  if (!currentLib) {
    saveInstinctLibrary(lib);
  }
  return currentLib ? lib : lib.ratings[mediaId];
}

export function setMediaPreference(mediaId, type, currentLib = null) {
  const lib = currentLib ? JSON.parse(JSON.stringify(currentLib)) : loadInstinctLibrary();
  if (!lib.likes) lib.likes = {};
  if (!lib.dislikes) lib.dislikes = {};
  if (!lib.notInterested) lib.notInterested = [];

  if (type === "like") {
    lib.likes[mediaId] = true;
    lib.dislikes[mediaId] = false;
    lib.notInterested = lib.notInterested.filter((id) => id !== mediaId);
  } else if (type === "dislike") {
    lib.dislikes[mediaId] = true;
    lib.likes[mediaId] = false;
  } else if (type === "not_interested") {
    if (!lib.notInterested.includes(mediaId)) lib.notInterested.push(mediaId);
    lib.likes[mediaId] = false;
    lib.dislikes[mediaId] = false;
  } else if (type === "clear") {
    lib.likes[mediaId] = false;
    lib.dislikes[mediaId] = false;
    lib.notInterested = lib.notInterested.filter((id) => id !== mediaId);
  }

  if (!currentLib) {
    saveInstinctLibrary(lib);
  }
  return lib;
}

export function addRecentlyExplored(mediaId, currentLib = null) {
  const lib = currentLib ? JSON.parse(JSON.stringify(currentLib)) : loadInstinctLibrary();
  const existing = lib.recentlyExplored || [];
  lib.recentlyExplored = [mediaId, ...existing.filter((id) => id !== mediaId)].slice(0, 30);

  if (!currentLib) {
    saveInstinctLibrary(lib);
  }
  return lib;
}

export function clearInstinctData() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(INSTINCT_LIBRARY_KEY);
      localStorage.removeItem(INSTINCT_PROFILE_KEY);
    }
  } catch {}
}

/**
 * Data Portability: Structured JSON & CSV Export / Import
 */
export function exportLibraryAsJson(library = null) {
  const profile = loadInstinctProfile();
  const lib = library || loadInstinctLibrary();
  return JSON.stringify(
    {
      version: "7.6.0",
      type: "saheli_instinct_export",
      exportedAt: new Date().toISOString(),
      profile,
      library: lib,
    },
    null,
    2,
  );
}

export function exportInstinctJSON() {
  return exportLibraryAsJson();
}

export function exportLibraryAsCsv(library = null) {
  const lib = library || loadInstinctLibrary();
  const allIds = new Set([
    ...(lib.watchlist || []),
    ...(lib.completed || []),
    ...(lib.favourites || []),
    ...(lib.savedMusic || []),
    ...Object.keys(lib.currentlyWatching || {}),
  ]);

  const rows = ["mediaId,inWatchlist,isFavourite,isCompleted,rating,progress"];

  for (const id of allIds) {
    const inWatchlist = (lib.watchlist || []).includes(id) ? "1" : "0";
    const isFavourite = (lib.favourites || []).includes(id) ? "1" : "0";
    const isCompleted = (lib.completed || []).includes(id) ? "1" : "0";
    const rating = lib.ratings?.[id] || "";
    const progress = lib.currentlyWatching?.[id]
      ? `S${lib.currentlyWatching[id].season}E${lib.currentlyWatching[id].episode}`
      : "";

    rows.push(`"${id}",${inWatchlist},${isFavourite},${isCompleted},${rating},"${progress}"`);
  }

  return rows.join("\n");
}

export function exportInstinctCSV() {
  return exportLibraryAsCsv();
}

export function importLibraryFromJson(jsonStr, currentLib = null) {
  const parsed = JSON.parse(jsonStr);
  const base = currentLib || loadInstinctLibrary();
  const source = parsed.library || parsed;

  const merged = {
    watchlist: Array.from(new Set([...(base.watchlist || []), ...(source.watchlist || [])])),
    completed: Array.from(new Set([...(base.completed || []), ...(source.completed || [])])),
    wantToWatch: Array.from(new Set([...(base.wantToWatch || []), ...(source.wantToWatch || [])])),
    favourites: Array.from(new Set([...(base.favourites || []), ...(source.favourites || [])])),
    notInterested: Array.from(
      new Set([...(base.notInterested || []), ...(source.notInterested || [])]),
    ),
    savedMusic: Array.from(new Set([...(base.savedMusic || []), ...(source.savedMusic || [])])),
    favouriteArtists: Array.from(
      new Set([...(base.favouriteArtists || []), ...(source.favouriteArtists || [])]),
    ),
    currentlyWatching: { ...(base.currentlyWatching || {}), ...(source.currentlyWatching || {}) },
    ratings: { ...(base.ratings || {}), ...(source.ratings || {}) },
    likes: { ...(base.likes || {}), ...(source.likes || {}) },
    dislikes: { ...(base.dislikes || {}), ...(source.dislikes || {}) },
    recentlyExplored: Array.from(
      new Set([...(source.recentlyExplored || []), ...(base.recentlyExplored || [])]),
    ).slice(0, 30),
  };

  if (!currentLib) {
    saveInstinctLibrary(merged);
    if (parsed.profile) {
      saveInstinctProfile({ ...DEFAULT_INSTINCT_PROFILE, ...parsed.profile });
    }
  }

  return merged;
}

export function importLibraryFromCsv(csvStr, currentLib = null) {
  const base = currentLib ? JSON.parse(JSON.stringify(currentLib)) : loadInstinctLibrary();
  const lines = csvStr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    // skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.replace(/^"|"$/g, "").trim());
      if (parts.length >= 2) {
        const mediaId = parts[0];
        const inWatchlist = parts[1] === "1" || parts[1] === "true";
        const isFavourite = parts[2] === "1" || parts[2] === "true";
        const isCompleted = parts[3] === "1" || parts[3] === "true";
        const rating = parts[4] ? Number(parts[4]) : null;

        if (inWatchlist && !base.watchlist.includes(mediaId)) base.watchlist.push(mediaId);
        if (isFavourite && !base.favourites.includes(mediaId)) base.favourites.push(mediaId);
        if (isCompleted && !base.completed.includes(mediaId)) base.completed.push(mediaId);
        if (rating) base.ratings[mediaId] = rating;
      }
    }
  }

  if (!currentLib) {
    saveInstinctLibrary(base);
  }
  return base;
}

export function importInstinctJSON(jsonStr) {
  try {
    importLibraryFromJson(jsonStr);
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || "Failed" };
  }
}
