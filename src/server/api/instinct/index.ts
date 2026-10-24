/**
 * Saheli 7.6 — INSTINCT API Router
 *
 * Exposes:
 * - GET /api/instinct/search?q=...&type=...
 * - GET /api/instinct/details?id=...
 * - GET /api/instinct/trending
 * - POST /api/instinct/chat
 */

import { VERIFIED_ENTERTAINMENT } from "../../../content/entertainment.js";
import { searchTmdb, fetchTmdbDetails } from "./tmdb";
import { fetchWatchmodeSources } from "./watchmode";
import { searchPublicMusic } from "./music";
import { handleInstinctChat } from "./assistant";

export async function handleInstinctRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. Search: GET /api/instinct/search?q=...&type=...
    if (path === "/api/instinct/search" && method === "GET") {
      const q = url.searchParams.get("q") || "";
      const type = url.searchParams.get("type") || "all";

      // First search local verified catalogue
      const qLower = q.toLowerCase();
      const localMatches = VERIFIED_ENTERTAINMENT.filter((item) => {
        if (type !== "all" && item.type !== type) return false;
        if (!qLower) return true;
        return (
          item.title.toLowerCase().includes(qLower) ||
          (item.synopsis && item.synopsis.toLowerCase().includes(qLower)) ||
          (item.artist && item.artist.toLowerCase().includes(qLower)) ||
          (item.genres && item.genres.some((g: string) => g.toLowerCase().includes(qLower)))
        );
      });

      // Augment with external music or TMDB search if query provided
      let externalResults: Array<Record<string, unknown>> = [];
      if (q.trim()) {
        if (type === "music" || type === "all") {
          const musicResults = await searchPublicMusic(q, 4);
          externalResults = externalResults.concat(musicResults);
        }
        if (type === "movie" || type === "tv" || type === "all") {
          const tmdbResults = await searchTmdb(q, type === "all" ? "multi" : type);
          if (tmdbResults && tmdbResults.length > 0) {
            const normalizedTmdb = tmdbResults.slice(0, 4).map((res) => ({
              id: `tmdb_${res.media_type || type}_${res.id}`,
              providerId: `tmdb_${res.id}`,
              type: res.media_type === "tv" ? "tv" : "movie",
              title: res.title || res.name,
              originalTitle: res.original_title || res.original_name,
              releaseYear: (res.release_date || res.first_air_date || "").split("-")[0] || null,
              synopsis: res.overview,
              rating: res.vote_average,
              voteCount: res.vote_count,
              posterUrl: res.poster_path
                ? `https://image.tmdb.org/t/p/w500${res.poster_path}`
                : null,
              streamingServices: ["netflix", "prime"],
              sourceAttribution: "TMDB Live Search",
            }));
            externalResults = externalResults.concat(normalizedTmdb);
          }
        }
      }

      const merged = [...localMatches, ...externalResults];
      return new Response(JSON.stringify({ results: merged }), {
        status: 200,
        headers,
      });
    }

    // 2. Details: GET /api/instinct/details?id=...
    if (path === "/api/instinct/details" && method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing id parameter" }), {
          status: 400,
          headers,
        });
      }

      // Check verified local catalogue first
      const item = VERIFIED_ENTERTAINMENT.find((c) => c.id === id);
      if (item) {
        return new Response(JSON.stringify({ item }), {
          status: 200,
          headers,
        });
      }

      // If id is tmdb_..., fetch live TMDB details
      if (id.startsWith("tmdb_")) {
        const parts = id.split("_");
        const type = parts[1] === "tv" ? "tv" : "movie";
        const tmdbId = parts[2];
        const details = await fetchTmdbDetails(tmdbId, type);
        if (details) {
          const sources = await fetchWatchmodeSources(tmdbId);
          return new Response(JSON.stringify({ item: { ...details, sources } }), {
            status: 200,
            headers,
          });
        }
      }

      return new Response(JSON.stringify({ error: "Media item not found" }), {
        status: 404,
        headers,
      });
    }

    // 3. Trending: GET /api/instinct/trending
    if (path === "/api/instinct/trending" && method === "GET") {
      const trending = [...VERIFIED_ENTERTAINMENT]
        .filter((item) => item.trendingScore != null)
        .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
        .slice(0, 10);

      return new Response(JSON.stringify({ results: trending }), {
        status: 200,
        headers,
      });
    }

    // 4. Chat: POST /api/instinct/chat
    if (path === "/api/instinct/chat" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const message = body.message || "";
      const history = body.history || [];
      const clientIp = req.headers.get("x-forwarded-for") || "local";

      const chatResponse = await handleInstinctChat(message, history, clientIp);
      return new Response(JSON.stringify(chatResponse), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
}
