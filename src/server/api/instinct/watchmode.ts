/**
 * Saheli 7.6 — INSTINCT Watchmode Provider Adapter
 *
 * Checks authenticated streaming sources in India (IN) region.
 * Gracefully falls back when API key is missing.
 */

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";
const cache = new Map<string, { data: Array<Record<string, unknown>>; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function getApiKey(): string | null {
  return process.env.WATCHMODE_API_KEY || process.env.VITE_WATCHMODE_API_KEY || null;
}

export async function fetchWatchmodeSources(
  titleId: number | string,
  region: string = "IN",
): Promise<Array<Record<string, unknown>> | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const cacheKey = `watchmode_src_${titleId}_${region}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const url = `${WATCHMODE_BASE_URL}/title/${titleId}/sources/?apiKey=${apiKey}&regions=${region}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as Array<Record<string, unknown>>;
    const sources = Array.isArray(data) ? data : [];
    cache.set(cacheKey, { data: sources, expiry: Date.now() + CACHE_TTL_MS });
    return sources;
  } catch {
    return null;
  }
}
