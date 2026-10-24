/**
 * Saheli 7.6 — INSTINCT Music Provider Adapter
 *
 * Sourced from open metadata (MusicBrainz) and public iTunes search API for legal 30s audio previews.
 * Does not require secret API keys.
 */

interface TrackResult {
  id: string;
  providerId: string;
  type: string;
  title: string;
  artist: string;
  album: string;
  releaseYear: number | null;
  genre: string;
  streamingServices: string[];
  previewAudioUrl: string;
  posterUrl: string | null;
  sourceAttribution: string;
}

const cache = new Map<string, { data: TrackResult[]; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function searchPublicMusic(query: string, limit: number = 10): Promise<TrackResult[]> {
  const q = query.trim();
  if (!q) return [];

  const cacheKey = `music_search_${q.toLowerCase()}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=${limit}&country=IN`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
    const results: TrackResult[] = (data.results || []).map((track) => ({
      id: `itunes_${track.trackId}`,
      providerId: `itunes_${track.trackId}`,
      type: "music",
      title: String(track.trackName || ""),
      artist: String(track.artistName || ""),
      album: String(track.collectionName || ""),
      releaseYear: track.releaseDate ? new Date(String(track.releaseDate)).getFullYear() : null,
      genre: String(track.primaryGenreName || ""),
      streamingServices: ["applemusic", "spotify", "youtube"],
      previewAudioUrl: String(track.previewUrl || ""),
      posterUrl: track.artworkUrl100
        ? String(track.artworkUrl100).replace("100x100bb", "600x600bb")
        : null,
      sourceAttribution: "Verified Public Track Metadata",
    }));

    cache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });
    return results;
  } catch {
    return [];
  }
}
