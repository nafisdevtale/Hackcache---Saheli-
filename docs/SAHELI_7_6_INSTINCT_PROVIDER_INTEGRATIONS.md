# SAHELI 7.6 — INSTINCT Provider Integrations Specification

**Subsystem:** Provider Adapters & External Content Federation  
**Scope:** TMDB, Watchmode, MusicBrainz/iTunes, and Gemini API  
**Directory:** `src/server/api/instinct/`

---

## 1. Architectural Strategy

INSTINCT integrates authorized third-party metadata providers to surface up-to-date entertainment, while preserving 100% offline autonomy and absolute user privacy.

All external communications occur server-side through dedicated adapters. The user's browser never connects directly to third-party ad networks, tracking scripts, or media telemetry endpoints.

### Key Operational Guarantees:

1. **Graceful Offline Fallback:** If internet access is unavailable or API tokens are unconfigured, the system seamlessly serves the verified on-device entertainment registry (`src/content/entertainment.js`).
2. **Deterministic In-Memory Caching:** Provider responses are cached in memory (30–60 minute TTL) to minimize latency, respect rate limits, and eliminate repeated network requests.
3. **Regional Prioritization:** All streaming availability checks default to the India (`IN`) region across Netflix, Amazon Prime Video, Disney+ Hotstar, JioCinema, SonyLIV, ZEE5, Spotify, and YouTube Music.

---

## 2. Adapter Specifications

### A. TMDB Adapter (`tmdb.ts`)

- **Base Endpoint:** `https://api.themoviedb.org/3`
- **Supported Operations:**
  - `fetchTmdbDetails(tmdbId, type)`: Fetches movie or television show metadata including runtime, cast, crew, trailers, and release dates.
  - `searchTmdb(query, type)`: Multi-search query covering movies and TV series with family-friendly `include_adult=false` safeguards.
- **Authentication:** Accepts either `TMDB_API_TOKEN` (v4 Read Access Token Bearer) or `TMDB_API_KEY` (v3 API key).
- **Cache TTL:** 30 minutes.

### B. Watchmode Adapter (`watchmode.ts`)

- **Base Endpoint:** `https://api.watchmode.com/v1`
- **Supported Operations:**
  - `fetchWatchmodeSources(titleId, region="IN")`: Queries legal subscription, rent, and buy options in India.
- **Authentication:** `WATCHMODE_API_KEY`.
- **Cache TTL:** 60 minutes.

### C. Music Provider Adapter (`music.ts`)

- **Endpoints:** Apple iTunes Search API & MusicBrainz OpenAPI.
- **Supported Operations:**
  - `searchPublicMusic(query, limit=10)`: Retrieves verified track releases, official album art, artist credits, and legal 30-second AAC/m4a audio preview URLs.
- **Authentication:** Zero API keys required (public open metadata standard).
- **Cache TTL:** 60 minutes.

### D. Gemini Conversational Assistant (`assistant.ts`)

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Authentication:** Reads `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`.
- **System Guardrails:**
  - Strict entertainment domain enforcement.
  - Immediate medical refusal: Queries regarding periods, pain, pregnancy, contraceptives, or health symptoms trigger polite refusal and redirection to Saheli's medical consultation features.
- **Fallback:** Deterministic keyword and semantic matching against `VERIFIED_ENTERTAINMENT`.

---

## 3. Server Endpoints & Routing

The unified router `src/server/api/router.ts` delegates requests starting with `/api/instinct` to `handleInstinctRequest`:

```
GET  /api/instinct/search?q={query}&type={movie|tv|kdrama|music|all}
GET  /api/instinct/details?id={mediaId}
GET  /api/instinct/trending
POST /api/instinct/chat  Body: { message: string, history: Array<{ role, content }> }
```
