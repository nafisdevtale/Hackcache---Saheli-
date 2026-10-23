/**
 * Saheli AI Health Assistant API Handler
 *
 * Safety-First Architecture:
 * 1. Deterministic screening for emergency red flags (immediate 112/108 guidance).
 * 2. Deterministic screening for mental health crisis/self-harm (immediate Tele-MANAS 14416 / KIRAN guidance).
 * 3. Rate limiting (in-memory per client).
 * 4. Input validation (consent check, length limits, sanitization).
 * 5. Provider abstraction (Google Gemini default, generic OpenAI-compatible fallback).
 * 6. Graceful offline/missing key fallback to local FAQ.
 * 7. Privacy: No PII logged, minimal cycle context only when user opts in.
 */

export interface Helpline {
  name: string;
  number: string;
  description?: string;
}

export interface AskSafetyResult {
  isRedFlag: boolean;
  type?: "urgent" | "crisis";
  message?: string;
  helplines?: Helpline[];
}

export const URGENT_RED_FLAGS = [
  // Heavy bleeding
  "soaking through two or more pads",
  "soaking 2 pads an hour",
  "soaking through pads every hour",
  "blood clots larger than a quarter",
  "huge blood clots",
  "bleeding heavily with dizziness",
  "bleeding and passed out",
  "fainted from bleeding",
  "खून बहुत ज़्यादा बह रहा",
  "चक्कर आकर गिर पड़ी",
  "बहुत बड़े खून के थक्के",
  // Severe sudden pain
  "sudden severe pelvic pain",
  "sudden severe abdominal pain",
  "unbearable sharp stomach pain",
  "doubled over in pain",
  "अचानक असहनीय पेट दर्द",
  "तेज़ चुभने वाला दर्द",
  // High fever + foul discharge or pain
  "high fever and foul smelling discharge",
  "fever with bad smelling discharge",
  "fever with pelvic pain",
  "बुखार और बदबूदार पानी",
  "बुखार और पेट के निचले हिस्से में दर्द",
  // Ectopic pregnancy risk
  "pregnant and heavy bleeding",
  "pregnant and severe pain",
  "positive pregnancy test and bleeding",
  "गर्भवती और खून बह रहा",
];

export const CRISIS_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "hurt myself",
  "self-harm",
  "self harm",
  "cutting myself",
  "आत्महत्या",
  "खुद को मारना",
  "ख़ुद को नुकसान",
  "मरना चाहती",
  "मरना चाहता",
  "जान दे दूंगी",
  "जीना नहीं चाहती",
];

const DISCLAIMER =
  "Saheli is an educational health information companion, not a doctor. This guidance does not constitute a medical diagnosis or treatment plan. Always consult a qualified medical professional for health concerns.";

// Rate limiter storage: IP/identifier -> timestamps array
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(clientId: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);
  if (validTimestamps.length >= limit) {
    rateLimitMap.set(clientId, validTimestamps);
    return false;
  }
  validTimestamps.push(now);
  rateLimitMap.set(clientId, validTimestamps);
  return true;
}

export function screenSafety(text: string): AskSafetyResult {
  const normalized = ` ${text
    .toLowerCase()
    .replace(/[?.!,।]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

  // 1. Crisis / Self-Harm
  for (const kw of CRISIS_KEYWORDS) {
    if (normalized.includes(kw.toLowerCase())) {
      return {
        isRedFlag: true,
        type: "crisis",
        message:
          "You are valued and not alone. If you are experiencing overwhelming feelings or thoughts of self-harm, please reach out right now to compassionate, confidential support.",
        helplines: [
          {
            name: "Tele-MANAS (Mental Health, Govt of India)",
            number: "14416",
            description: "24/7, Toll-free in all Indian languages",
          },
          { name: "Tele-MANAS Alternate", number: "1800-891-4416" },
          { name: "KIRAN Mental Health Helpline", number: "1800-599-0019" },
          { name: "National Emergency Service", number: "112" },
        ],
      };
    }
  }

  // 2. Urgent Medical Red Flags
  const contains = (words: string[]) => words.some((w) => normalized.includes(w));
  const hasBleeding = contains(["bleeding", "blood", "खून", "रक्तस्राव"]);
  const hasHeavy = contains([
    "heavy",
    "soak",
    "soaking",
    "pads an hour",
    "clots",
    "ज़्यादा",
    "ज्यादा",
    "थक्के",
  ]);
  const hasFaint = contains([
    "faint",
    "fainted",
    "dizzy",
    "dizziness",
    "passed out",
    "बेहोश",
    "चक्कर",
  ]);
  const hasSeverePain = contains([
    "severe pain",
    "sudden pain",
    "unbearable",
    "sharp pain",
    "तेज़ दर्द",
    "अचानक दर्द",
    "असहनीय दर्द",
  ]);
  const hasFever = contains(["fever", "chills", "बुखार", "कंपकंपी"]);
  const hasFoulDischarge = contains(["foul", "bad smell", "smelling", "बदबूदार", "दुर्गंध"]);
  const hasPregnant = contains(["pregnant", "pregnancy", "positive test", "गर्भवती", "गर्भ"]);

  let isUrgent = false;
  for (const flag of URGENT_RED_FLAGS) {
    if (normalized.includes(flag.toLowerCase())) {
      isUrgent = true;
      break;
    }
  }

  if (
    isUrgent ||
    (hasBleeding && hasHeavy && hasFaint) ||
    (hasPregnant && (hasBleeding || hasSeverePain)) ||
    (hasFever && (hasFoulDischarge || hasSeverePain)) ||
    (hasBleeding && hasSeverePain && hasFaint)
  ) {
    return {
      isRedFlag: true,
      type: "urgent",
      message:
        "EMERGENCY MEDICAL WARNING: These symptoms may indicate an acute medical complication (such as severe hemorrhage, ectopic pregnancy, pelvic infection, or internal complications). Please seek immediate in-person emergency medical care.",
      helplines: [
        { name: "National Emergency Number (Police/Medical)", number: "112" },
        { name: "National Ambulance Service", number: "108" },
        { name: "Women's Helpline", number: "1091" },
      ],
    };
  }

  return { isRedFlag: false };
}

export async function handleAskRequest(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate Limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local-client";
  if (!checkRateLimit(clientIp, 15, 60000)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Rate limit exceeded. Please wait a moment before asking another question.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { question, context, consent } = (body || {}) as {
    question?: string;
    context?: Record<string, unknown>;
    consent?: boolean;
  };

  // Consent validation
  if (!consent) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Consent required. You must accept that Saheli AI provides educational information only, not medical diagnosis.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Input validation
  if (!question || typeof question !== "string" || !question.trim()) {
    return new Response(JSON.stringify({ ok: false, error: "Question cannot be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (question.length > 500) {
    return new Response(
      JSON.stringify({ ok: false, error: "Question is too long (maximum 500 characters)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Step 1: Deterministic safety screening (executed BEFORE any AI call)
  const safety = screenSafety(question);
  if (safety.isRedFlag) {
    return new Response(
      JSON.stringify({
        ok: true,
        type: safety.type,
        red_flag: true,
        answer: safety.message,
        helplines: safety.helplines,
        disclaimer: DISCLAIMER,
        source: "deterministic_safety",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Step 2: Check AI Provider credentials
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const model =
    process.env.AI_MODEL || (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        fallback: true,
        error:
          "AI provider is not configured. Falling back to Saheli offline verified FAQ library.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Step 3: Prepare system instructions & non-PII context
  let contextSnippet = "";
  if (context && typeof context === "object") {
    const parts = [];
    if (context.cycleLength)
      parts.push(`Typical cycle length: ~${Number(context.cycleLength)} days`);
    if (context.periodLength)
      parts.push(`Typical bleeding length: ~${Number(context.periodLength)} days`);
    if (context.lastPeriodDaysAgo !== undefined)
      parts.push(`Last period started ~${Number(context.lastPeriodDaysAgo)} days ago`);
    if (context.currentPhase) parts.push(`Estimated phase: ${String(context.currentPhase)}`);
    if (parts.length > 0) {
      contextSnippet = `\n\n[User's Optional Cycle Summary: ${parts.join(", ")}]`;
    }
  }

  const systemInstruction = `You are Saheli Health Assistant, an empathetic, evidence-based menstrual-health educational assistant serving users across India.
CRITICAL SAFETY & CLINICAL RULES:
1. Provide educational health information ONLY. NEVER provide medical diagnosis, treatment prescriptions, or definitive medical verdicts.
2. Recommend consulting a qualified healthcare professional (gynaecologist or primary care doctor) for diagnosis, persistent symptoms, or severe pain.
3. Keep answers clear, accessible, culturally sensitive, non-judgmental, and practical.
4. If the question is in Hindi or another Indian language, respond naturally in that language (using native script or clear Hinglish if requested).
5. Address the user's cycle context respectfully if provided, but clarify that estimates are calculated predictions rather than biological certainty.
6. Maximum answer length: 3 concise paragraphs.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    let answerText = "";

    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemInstruction}\n\nUser Question: ${question}${contextSnippet}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      };

      const aiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!aiRes.ok) {
        return new Response(
          JSON.stringify({
            ok: false,
            fallback: true,
            error: `AI provider error (${aiRes.status}). Falling back to local library.`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const data = await aiRes.json();
      answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else {
      // OpenAI-compatible provider
      const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const aiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: `${question}${contextSnippet}` },
          ],
          max_tokens: 600,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!aiRes.ok) {
        return new Response(
          JSON.stringify({
            ok: false,
            fallback: true,
            error: `AI provider error (${aiRes.status}). Falling back to local library.`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const data = await aiRes.json();
      answerText = data?.choices?.[0]?.message?.content?.trim() || "";
    }

    if (!answerText) {
      return new Response(
        JSON.stringify({
          ok: false,
          fallback: true,
          error: "Empty response from AI provider. Falling back to local library.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        answer: answerText,
        disclaimer: DISCLAIMER,
        source: "ai_assistant",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    return new Response(
      JSON.stringify({
        ok: false,
        fallback: true,
        error:
          errorName === "AbortError"
            ? "AI request timed out. Falling back to local library."
            : "Network error contacting AI service.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
}
