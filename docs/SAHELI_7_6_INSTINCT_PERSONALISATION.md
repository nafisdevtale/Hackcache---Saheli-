# SAHELI 7.6 — INSTINCT Personalisation & Preference Learning Engine

**Subsystem:** Preference Engine & Content Learning  
**Core Files:** `src/lib/instinctML.js`, `src/lib/instinctRecommender.js`  
**Specification Reference:** Sections 14, 15, and 18

---

## 1. Multi-Dimensional Taste Profiles

INSTINCT models user taste across four media modalities simultaneously:

- Movies
- TV & Web Series
- K-Dramas (Korean Television)
- Music & Soundscapes

The user's taste profile is initialized during cold-start onboarding (`TasteOnboardingModal`) and updated continuously as the user interacts with titles, rates items, tracks episodes, and saves media.

### Profile Structure:

```typescript
interface InstinctProfile {
  onboardingCompleted: boolean;
  ageFilter: "all" | "family_friendly" | "teens_and_adults";
  preferredGenres: {
    movie: string[];
    tv: string[];
    kdrama: string[];
    music: string[];
  };
  preferredLanguages: string[]; // e.g. ["hi", "en", "ko", "ta", "mr"]
  preferredServices: string[]; // e.g. ["netflix", "prime", "hotstar", "spotify"]
  diversityLevel: number; // 0.0 to 1.0 (exploratory novelty factor)
  weights: Record<string, number>;
}
```

---

## 2. 8-Dimensional Normalized Feature Extraction

For every candidate item in the catalogue, INSTINCT computes an 8-dimensional normalized feature vector:

1. **`genreAffinity` (0.0 to 1.0):** Overlap ratio between candidate item genres and user's explicitly preferred and liked genres.
2. **`languageAffinity` (0.25 to 1.0):** Exact match with user's preferred viewing/listening languages.
3. **`serviceAvailability` (0.2 to 1.0):** Immediate streamability on the user's active streaming subscriptions.
4. **`qualityScore` (0.0 to 1.0):** Normalized verified public rating `(rating - 5.0) / 5.0`.
5. **`trendingVelocity` (0.0 to 1.0):** Verified trending discovery velocity `trendingScore / 100`.
6. **`hiddenGemDiscovery` (0.3 to 0.85):** Identifies critically acclaimed titles with niche saturation or regional indie origin.
7. **`noveltyDiversity` (0.3 to 1.0):** Controlled exploratory distance from user's dominant genres based on `profile.diversityLevel`.
8. **`ageSafetyCompliance` (0.0 or 1.0):** Binary mask ensuring titles strictly comply with user's selected age suitability filter.

---

## 3. Grounded, Explainable Recommendations

INSTINCT never presents a recommendation as an opaque mystery. Every item in the detail modal surfaces human-readable, grounded explanations (`explainRecommendation()`):

- **Genre Alignment:** _"Matches your taste for Romantic Comedy and Slice of Life"_
- **Item Grounding:** _"Because you enjoyed 'Crash Landing on You'"_
- **Platform Availability:** _"Available to stream on your active service (Netflix, Amazon Prime Video)"_
- **Critical Acclaim:** _"Critically acclaimed with a verified 8.7/10 community rating"_
- **Trending:** _"Trending with rising audience discovery right now"_
- **Hidden Gem:** _"Hidden Gem: High audience appreciation and unique storytelling"_
