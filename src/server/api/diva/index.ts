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

export async function handleDivaRouteRequest(req: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method.toUpperCase() === "OPTIONS") {
    return new Response(null, { status: 204, headers });
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

    const geminiKey =
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
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
                target: parsed.target || "clarification",
                agents: validAgents.slice(0, 2),
                confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
                reason: parsed.reason || "Gemini route classification",
              }),
              { status: 200, headers },
            );
          }
        }
      } catch {
        // Fall through to clarification
      }
    }

    return new Response(
      JSON.stringify({
        target: "clarification",
        agents: [],
        confidence: 0.5,
        reason: "Offline / Fallback to clarification",
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
