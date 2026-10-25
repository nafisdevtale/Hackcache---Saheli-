/**
 * Saheli 8.0 — DIVA Server Router & Intent Classifier Endpoint
 *
 * Exposes:
 * - POST /api/diva/route
 * - POST /api/diva/orchestrate
 *
 * Handles optional Gemini structured classification and bounded server-side dispatch.
 */

import { AGENT_IDS } from "../../../lib/divaRegistry.js";
import { classifyDeterministic } from "../../../lib/divaRouter.js";

const GEMINI_SYSTEM_ROUTER_PROMPT = `You are DIVA, the central routing orchestrator for Saheli.
You must classify the user's intent to one of three specialist agents:
1. "eeve": Menstrual health, medical inquiries, pain, cramps, ovulation, cycles, hygiene, fertility.
2. "flash": Menstrual care and comfort products, sanitary pads, tampons, cups, prices, cost comparisons, reusables.
3. "instinct": Movies, TV series, K-dramas, music, songs, streaming platforms, mood-based relaxation.
4. "multi_agent": The request combines exactly two domains (e.g. cramps health advice + comfort product recommendation, or period product + movie recommendation).
5. "clarification": The user request is ambiguous, generic, or incomplete.
6. "unsupported": Completely outside health, self-care products, or entertainment.

Respond ONLY with valid JSON in this exact shape:
{
  "target": "eeve" | "flash" | "instinct" | "multi_agent" | "clarification" | "unsupported",
  "agents": ["eeve"] | ["flash"] | ["instinct"] | ["eeve", "flash"] | ["eeve", "instinct"] | ["flash", "instinct"] | [],
  "confidence": number between 0.0 and 1.0,
  "reason": "short explanation"
}`;

const divaRateLimitMap = new Map<string, number[]>();

function checkDivaRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (divaRateLimitMap.get(ip) || []).filter((t) => now - t < 60000);
  if (timestamps.length >= 25) return false;
  timestamps.push(now);
  divaRateLimitMap.set(ip, timestamps);
  return true;
}

export async function handleDivaRouteRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // 1. GET /api/diva/status
  if (path === "/api/diva/status" && method === "GET") {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gemini-2.5-flash";
    return new Response(
      JSON.stringify({
        ok: true,
        available: Boolean(geminiKey),
        provider: "gemini",
        model,
        offlineFallback: "active",
      }),
      { status: 200, headers },
    );
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for") || "local";
  if (!checkDivaRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Rate limit exceeded. Please wait a moment." }),
      { status: 429, headers },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      history?: Array<{ role: string; content: string }>;
      locale?: string;
      lang?: string;
    };
    const query = (body.query || "").trim();
    const locale = body.locale || body.lang || "en";

    if (!query) {
      return new Response(
        JSON.stringify({
          target: "clarification",
          agents: [],
          confidence: 0.0,
          reason: "Empty query",
        }),
        { status: 200, headers },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gemini-2.5-flash";

    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    locale && locale !== "en"
                      ? `${GEMINI_SYSTEM_ROUTER_PROMPT}\nInput language/locale is '${locale}'. Route queries accurately regardless of whether query is in English, Hindi, Bengali, Tamil, Telugu, Marathi, Urdu, etc.`
                      : GEMINI_SYSTEM_ROUTER_PROMPT,
                },
              ],
            },
            contents: [{ role: "user", parts: [{ text: query }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
              maxOutputTokens: 200,
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const validAgents = (parsed.agents || []).filter((a: string) => AGENT_IDS.includes(a));
            return new Response(
              JSON.stringify({
                ok: true,
                target: parsed.target || "clarification",
                agents: validAgents.slice(0, 2),
                confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
                reason: parsed.reason || "Gemini route classification",
                source: "gemini_model",
              }),
              { status: 200, headers },
            );
          }
        }
      } catch {
        // Fall through to offline classification
      }
    }

    // Offline / fallback router
    const offlineResult = classifyDeterministic(query);
    return new Response(
      JSON.stringify({
        ok: true,
        target: offlineResult.target || "clarification",
        agents: offlineResult.agents || [],
        confidence: offlineResult.confidence || 0.7,
        reason: offlineResult.reason || "Offline deterministic router fallback",
        source: "deterministic_fallback",
      }),
      { status: 200, headers },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
}
