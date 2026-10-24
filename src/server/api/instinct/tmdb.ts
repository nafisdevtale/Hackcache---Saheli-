/**
 * Saheli 7.6 — INSTINCT TMDB Provider Adapter
 *
 * Safe proxy to TMDB API for verified movie and television metadata.
 * Uses TMDB Read Access Token or API Key if configured in environment.
 * Gracefully falls back to local verified catalogue when unconfigured or offline.
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const cache = new Map<
  string,
  { data: Record<string, unknown> | Array<Record<string, unknown>>; expiry: number }
>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getApiKey(): string | null {
  return (
    process.env.TMDB_API_KEY || process.env.TMDB_API_TOKEN || process.env.VITE_TMDB_API_KEY || null
  );
}

export async function fetchTmdbDetails(
  tmdbId: string | number,
  type: "movie" | "tv" = "movie",
): Promise<Record<string, unknown> | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const cacheKey = `tmdb_${type}_${tmdbId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as Record<string, unknown>;
  }

  try {
    const isBearer = apiKey.length > 40;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    let url = `${TMDB_BASE_URL}/${type}/${tmdbId}?append_to_response=credits,videos,watch/providers`;
    if (isBearer) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      url += `&api_key=${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return null;
  }
}

export async function searchTmdb(
  query: string,
  type: "movie" | "tv" | "multi" = "multi",
): Promise<Array<Record<string, unknown>> | null> {
  const apiKey = getApiKey();
  if (!apiKey || !query.trim()) return null;

  const cacheKey = `tmdb_search_${type}_${query.trim().toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as Array<Record<string, unknown>>;
  }

  try {
    const isBearer = apiKey.length > 40;
    const headers: Record<string, string> = { Accept: "application/json" };
    let url = `${TMDB_BASE_URL}/search/${type}?query=${encodeURIComponent(query.trim())}&include_adult=false`;
    if (isBearer) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      url += `&api_key=${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
    const results = data.results || [];
    cache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });
    return results;
  } catch {
    return null;
  }
}
