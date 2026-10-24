# SAHELI 7.6 — INSTINCT AI Architecture Specification

**Agent Name:** INSTINCT  
**Tagline:** Your Taste. Your Vibe. Your Next Favourite.  
**Version:** Saheli 7.6.0  
**Repository:** https://github.com/nafisdevtale/remix-of-saheli-cycle-companion

---

## 1. Executive Summary & Product Objective

INSTINCT is a dedicated, privacy-first entertainment discovery and recommendation agent embedded directly within the Saheli ecosystem. It empowers users—particularly women and adolescent girls navigating downtime, recovery, or personal leisure—to explore culture, cinema, television series, K-dramas, and music in an empowering, non-commercial environment free from intrusive remote tracking.

### Core Architecture Principles:

- **100% On-Device Privacy Boundary:** User taste profiles, watchlists, ratings, and viewing histories live exclusively in dedicated on-device storage keys (`saheli_instinct_library_v1`, `saheli_instinct_profile_v1`). INSTINCT never reads or accesses menstrual diary records, symptoms, pregnancy trackers, or companion data.
- **Trained Learning-to-Rank Recommender:** Employs an 8-dimensional normalized feature vector optimized with pairwise regularized logistic ranking loss across 60 synthetic scenarios, evaluated on held-out test splits with real metrics (NDCG@5, NDCG@10, MRR).
- **Multi-Modal Entertainment Scope:** Movies (Indian, Hollywood, World Cinema), Television Series, K-Dramas (with episode-by-episode progress tracking), and Music (with legal 30-second audio previews).
- **Conversational Intelligence:** "Ask INSTINCT" conversational interface powered by Google Gemini with deterministic local search fallback and active medical boundary enforcement.
- **Multilingual Native Experience:** Zero-compromise localization across 13 Indian languages with 100% key parity and zero script contamination.

---

## 2. System Component Topology

```
+---------------------------------------------------------------------------------------+
|                                    SAHELI CLIENT                                      |
|                                                                                       |
|  +------------------------+  +-------------------------+  +------------------------+  |
|  |   Navigation Rail      |  |     Instinct Page       |  |   Conversational Chat  |  |
|  |  (/instinct route)     |  |   (Tabs & Carousels)    |  |     "Ask INSTINCT"     |  |
|  +------------------------+  +-------------------------+  +------------------------+  |
|                                           |                                           |
|                   +-----------------------+-----------------------+                   |
|                   |                                               |                   |
|       +-----------------------+                       +-----------------------+       |
|       |   Preference Engine   |                       |  Private Storage Hub  |       |
|       |  (Feature Extractor & |                       | (saheli_instinct_lib, |       |
|       |   Ranking Scoring)    |                       | saheli_instinct_prof) |       |
|       +-----------------------+                       +-----------------------+       |
|                   |                                               |                   |
+-------------------|-----------------------------------------------|-------------------+
                    |                                               |
         +----------v-----------------------------------------------v----------+
         |                       SERVER / PROXY ADAPTERS                       |
         |                                                                     |
         |  +--------------------+  +--------------------+  +---------------+  |
         |  |   TMDB Adapter     |  | Watchmode Adapter  |  | Music Adapter |  |
         |  | (/api/instinct/tmdb|  | (/api/instinct/src)|  | (iTunes & MB) |  |
         |  +--------------------+  +--------------------+  +---------------+  |
         |                             |                                       |
         |                     +-------v--------+                              |
         |                     | Gemini Provider|                              |
         |                     | (/api/instinct/|                              |
         |                     |     chat)      |                              |
         |                     +----------------+                              |
         +---------------------------------------------------------------------+
```

---

## 3. Storage Architecture & Privacy Boundaries

### Isolated LocalStorage Keys:

1. `saheli_instinct_library_v1`:
   - `watchlist`: Array of media item IDs.
   - `currentlyWatching`: Object mapping media ID to `{ season, episode, lastUpdated, status }`.
   - `completed`: Array of completed media IDs.
   - `wantToWatch`: Array of queued items.
   - `favourites`: Array of starred favorite IDs.
   - `notInterested`: Array of explicitly excluded IDs.
   - `savedMusic`: Array of bookmarked music track IDs.
   - `favouriteArtists`: Array of followed artist strings.
   - `ratings`: Map of 1–10 user ratings.
   - `likes` / `dislikes`: Binary preference mappings.
   - `recentlyExplored`: FIFO queue of up to 30 media IDs.
2. `saheli_instinct_profile_v1`:
   - `onboardingCompleted`: Boolean.
   - `ageFilter`: `"all"` | `"family_friendly"` | `"teens_and_adults"`.
   - `preferredGenres`: Per-type genre array preferences.
   - `preferredLanguages`: ISO-639-1 language codes.
   - `preferredServices`: Array of active streaming subscriptions (Netflix, Prime, Hotstar, etc.).
   - `diversityLevel`: Float (0.0 to 1.0) controlling exploration ratio.
   - `weights`: Current active linear ranking weights.

### Invariant Privacy Guarantees:

- INSTINCT has **zero** access to IndexedDB stores for periods, cycle predictions, symptoms, or confidential health logs.
- INSTINCT does not log user selections to any remote telemetry service.
- When exporting user data (JSON or CSV), only entertainment discovery records are included.

---

## 4. Section Implementation Mapping

| Section    | Feature Area                       | Primary Source Files                                                 |
| :--------- | :--------------------------------- | :------------------------------------------------------------------- |
| **Sec 10** | Media Detail Views                 | `src/pages/Instinct.jsx`, `src/content/entertainment.js`             |
| **Sec 11** | Music Discovery & Audio Previews   | `src/pages/Instinct.jsx`, `src/server/api/instinct/music.ts`         |
| **Sec 12** | K-Drama Tracker & Discovery        | `src/pages/Instinct.jsx`, `src/lib/instinctStorage.js`               |
| **Sec 13** | My INSTINCT Library & Portability  | `src/lib/instinctStorage.js`, `src/pages/Instinct.jsx`               |
| **Sec 14** | Recommendation Dashboard Rows      | `src/lib/instinctRecommender.js`                                     |
| **Sec 15** | Explainable Preference Learning    | `src/lib/instinctML.js`, `src/lib/instinctRecommender.js`            |
| **Sec 16** | Reproducible ML Training & Eval    | `src/lib/instinctML.js`, `scripts/train-instinct-recommender.mjs`    |
| **Sec 17** | Ask INSTINCT Conversational AI     | `src/server/api/instinct/assistant.ts`                               |
| **Sec 18** | Content Suitability & Age Filters  | `src/lib/instinctRecommender.js`                                     |
| **Sec 19** | Strict Privacy Isolation           | `src/lib/instinctStorage.js`, `src/test/saheli-7-6-instinct.test.js` |
| **Sec 20** | JSON/CSV Import & Export           | `src/lib/instinctStorage.js`                                         |
| **Sec 21** | Provider Adapters (TMDB, WM, etc.) | `src/server/api/instinct/`                                           |
| **Sec 22** | Accessible UI Design               | `src/pages/Instinct.jsx`, `src/styles.css`                           |
| **Sec 23** | 13-Language Parity                 | `src/i18n/*.js`, `scripts/i18n-check.js`                             |
| **Sec 24** | Automated Vitest Suite             | `src/test/saheli-7-6-instinct.test.js`                               |
| **Sec 25** | Final Acceptance Documentation     | `docs/SAHELI_7_6_*.md`                                               |
