/**
 * Saheli 7.6 — INSTINCT Conversational Assistant API Handler
 *
 * "Ask INSTINCT: Your Taste. Your Vibe. Your Next Favourite."
 * - Conversational entertainment recommendations (Movies, TV, K-Dramas, Music).
 * - Strict Privacy Boundary: Absolute isolation from health and menstrual diary.
 * - Refusal & Redirection for medical questions.
 * - Gemini API with deterministic fallback to verified local catalogue matching.
 */

import { VERIFIED_ENTERTAINMENT } from "../../../content/entertainment.js";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count++;
  return true;
}

const MEDICAL_KEYWORDS = [
  "period",
  "bleeding",
  "cramp",
  "ovulation",
  "pregnancy",
  "pregnant",
  "menstrual",
  "vagina",
  "uterus",
  "pcos",
  "papi",
  "contraceptive",
  "pill",
  "doctor",
  "symptom",
  "pain",
  "discharge",
  "cycle",
  "clot",
];

function isMedicalQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDICAL_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(lower);
  });
}

const INSTINCT_SYSTEM_PROMPT = `You are INSTINCT, Saheli's dedicated entertainment and culture discovery companion.
Your tagline is: "Your Taste. Your Vibe. Your Next Favourite."

Your domain is strictly:
- Movies (Indian, Hollywood, World Cinema, Anime)
- Television Series & Web Series
- K-Dramas (Korean Dramas)
- Music (Indian regional, Bollywood, Classical, K-Pop, Indie, Ambient, Pop)

Rules:
1. Ground recommendations in real, verified titles with legitimate streaming platforms in India (Netflix, Prime Video, Disney+ Hotstar, SonyLIV, ZEE5, JioCinema, Spotify, YouTube).
2. NEVER invent fake movie titles, imaginary actors, or fictional releases.
3. Be friendly, culturally attuned, discerning, and empathetic to mood requests (e.g. "comforting cozy dramas", "uplifting upbeat workout songs", "thought-provoking legal thrillers").
4. If a user asks about periods, menstrual pain, pregnancy, birth control, or medical health, IMMEDIATELY refuse politely: "I am INSTINCT, your entertainment and music companion. For personal health or cycle questions, please consult Saheli's Ask AI doctor or a healthcare professional."
5. Keep responses concise, engaging, and format titles clearly.`;

export async function handleInstinctChat(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  clientIp: string = "anonymous",
): Promise<{ text: string; recommendations?: Array<Record<string, unknown>> }> {
  if (!checkRateLimit(clientIp)) {
    return {
      text: "You are exploring fast! Please wait a moment before asking INSTINCT again.",
    };
  }

  const query = (message || "").trim();
  if (!query) {
    return {
      text: "What kind of vibe, genre, or mood are you looking to watch or listen to today?",
    };
  }

  // Safety boundary check
  if (isMedicalQuery(query)) {
    return {
      text: "I am INSTINCT, your entertainment discovery companion! I can help you find amazing movies, K-dramas, series, and music to relax with. For any health, period, or medical inquiries, please switch over to Saheli's Ask AI health guide or consult a healthcare professional.",
    };
  }

  // Attempt Gemini API if key is present
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    try {
      const contents = [
        ...history.slice(-6).map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: query }] },
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: INSTINCT_SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (responseText) {
          // Identify any catalogue items mentioned
          const matched = VERIFIED_ENTERTAINMENT.filter((item) =>
            responseText.toLowerCase().includes(item.title.toLowerCase()),
          );
          return {
            text: responseText,
            recommendations: matched.slice(0, 3),
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  // Deterministic Local Fallback Matching
  const lowerQuery = query.toLowerCase();
  let matchedItems = VERIFIED_ENTERTAINMENT.filter((item) => {
    const titleMatch = lowerQuery.includes(item.title.toLowerCase());
    const genreMatch = (item.genres || [item.genre || ""]).some((g) =>
      lowerQuery.includes(g.toLowerCase()),
    );
    const typeMatch = lowerQuery.includes(item.type.toLowerCase());
    const kdramaMatch =
      (lowerQuery.includes("kdrama") ||
        lowerQuery.includes("k-drama") ||
        lowerQuery.includes("korean")) &&
      item.type === "kdrama";
    const musicMatch =
      (lowerQuery.includes("song") ||
        lowerQuery.includes("music") ||
        lowerQuery.includes("track")) &&
      item.type === "music";

    return (
      titleMatch || genreMatch || (typeMatch && item.rating >= 8.2) || kdramaMatch || musicMatch
    );
  });

  if (matchedItems.length === 0) {
    matchedItems = VERIFIED_ENTERTAINMENT.filter((item) => (item.rating || 0) >= 8.5);
  }

  const topItems = matchedItems.slice(0, 3);
  const titlesList = topItems
    .map(
      (item) =>
        `• **${item.title}** (${item.releaseYear || "Track"}) — ${item.genres?.join(", ") || item.genre || "Must-experience"}`,
    )
    .join("\n");

  const responseText = `Here are verified recommendations tailored to your vibe:\n\n${titlesList}\n\nAll of these feature verified ratings, verified Indian streaming availability, and rich storylines. Let me know if you want something lighter, more intense, or from a specific language!`;

  return {
    text: responseText,
    recommendations: topItems,
  };
}
