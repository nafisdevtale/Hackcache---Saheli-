/**
 * Saheli 8.0 — DIVA Intelligent Routing Engine
 *
 * 4-Level Hybrid Intent Classification:
 * - Level 1: Deterministic regex/token classification (zero-cost, testable).
 * - Level 2: Context-aware follow-up resolution using limited session history.
 * - Level 3: Optional Gemini LLM classification for ambiguous natural language.
 * - Level 4: Clarification queries when user intent cannot be safely disambiguated.
 */

import { AGENT_REGISTRY, AGENT_IDS } from "./divaRegistry.js";

export const DIVA_INTENTS = {
  HEALTH_INQUIRY: "health_inquiry",
  PRODUCT_DISCOVERY: "product_discovery",
  ENTERTAINMENT: "entertainment",
  MULTI_AGENT: "multi_agent",
  CLARIFICATION: "clarification",
};

export const DIVA_MODES = {
  AUTO: "auto",
  MANUAL_EEVE: "eeve",
  MANUAL_FLASH: "flash",
  MANUAL_INSTINCT: "instinct",
};

// Taxonomy of Intent Tokens
const HEALTH_TOKENS = [
  "period",
  "periods",
  "bleeding",
  "bleed",
  "cramp",
  "cramps",
  "pain",
  "ovulation",
  "fertile",
  "fertility",
  "cycle",
  "late period",
  "early period",
  "discharge",
  "pcos",
  "endometriosis",
  "pregnancy",
  "pregnant",
  "contraception",
  "birth control",
  "pill",
  "hygiene",
  "menstrual cup usage",
  "tampon usage",
  "infection",
  "itching",
  "smell",
  "odor",
  "clots",
  "heavy flow",
  "spotting",
  "nausea",
  "headache",
  "pms",
  "mood swings",
  "doctor",
  "gynecologist",
  "follicular",
  "luteal",
  "cramping",
  "cramps naturally",
  "मासिक धर्म",
  "दर्द",
  "मासिक पाळी",
  "रक्तस्राव",
  "పీరియడ్స్",
  "மாதவிடாய்",
  "حیض",
];

const ESSENTIALS_TOKENS = [
  "pad",
  "pads",
  "sanitary pad",
  "tampon",
  "tampons",
  "menstrual cup",
  "cup",
  "reusable pad",
  "period underwear",
  "panty liner",
  "pantyliner",
  "heating pad",
  "hot water bag",
  "cramp roll on",
  "essential",
  "essentials",
  "price",
  "cost",
  "affordable",
  "cheap",
  "expensive",
  "unit cost",
  "budget",
  "buy",
  "purchase",
  "organic cotton",
  "biodegradable",
  "absorbency",
  "comfort accessory",
  "wipe",
  "wipes",
  "rash-free",
  "rash free",
  "heat patch",
  "cloth pad",
  "cloth pads",
];

const ENTERTAINMENT_TOKENS = [
  "movie",
  "movies",
  "film",
  "films",
  "cinema",
  "tv show",
  "tv series",
  "series",
  "k-drama",
  "kdrama",
  "korean drama",
  "actor",
  "actress",
  "director",
  "song",
  "songs",
  "music",
  "track",
  "album",
  "artist",
  "soundtrack",
  "ost",
  "netflix",
  "prime video",
  "hotstar",
  "spotify",
  "watch",
  "listen",
  "recommendation",
  "thriller",
  "romance",
  "comedy",
  "chill",
  "relaxing video",
  "cozy show",
  "anime",
  "play music",
  "playlist",
  "binge-watch",
  "binge watch",
  "crash landing on you",
];

/**
 * Score matches for a token list against query text
 */
function scoreTokens(text, tokens) {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lower)) {
      matches++;
    }
  }
  return matches;
}

/**
 * Level 1: Deterministic Rule-Based Classification
 */
export function classifyDeterministic(query) {
  const q = (query || "").trim();
  if (!q) {
    return {
      target: "clarification",
      intent: DIVA_INTENTS.CLARIFICATION,
      agents: [],
      confidence: 0.0,
      reason: "Empty query",
      level: "level1_deterministic",
      needsClarification: true,
      clarificationOptions: [
        { id: "eeve", label: "Health Guidance (Eeve)" },
        { id: "flash", label: "Find Products (FLASH)" },
        { id: "instinct", label: "Entertainment & Vibe (INSTINCT)" },
      ],
    };
  }

  // Short greetings or vague keywords
  const qLower = q.toLowerCase();
  if (
    /^(hello|hi|hey|help|options|what can you do\??|menu)\b/i.test(qLower) &&
    q.split(/\s+/).length <= 4
  ) {
    return {
      target: "clarification",
      intent: DIVA_INTENTS.CLARIFICATION,
      agents: [],
      confidence: 0.5,
      reason: "Greeting or generic inquiry requiring user choice.",
      level: "level4_clarification",
      needsClarification: true,
      clarificationPrompt:
        "Would you like advice from Eeve (Health), FLASH (Essentials), or INSTINCT (Entertainment)?",
      clarificationOptions: [
        { id: "eeve", label: "Health Guidance (Eeve)" },
        { id: "flash", label: "Find Products (FLASH)" },
        { id: "instinct", label: "Entertainment & Vibe (INSTINCT)" },
      ],
    };
  }

  let healthScore = scoreTokens(q, HEALTH_TOKENS);
  const essentialsScore = scoreTokens(q, ESSENTIALS_TOKENS);
  const entertainmentScore = scoreTokens(q, ENTERTAINMENT_TOKENS);

  const hasMedicalInquiry =
    /(why|cause|treat|manage|pain|cramp|cramping|cramps|symptom|discharge|itch|smell|odor|infection|emergency|red flag|doctor|delay|late|ovulat|follicular|luteal)/i.test(
      q,
    );

  // If query mentions products and only mentions flow/period as product attributes, discount healthScore
  if (!hasMedicalInquiry && essentialsScore >= 1 && (healthScore === 1 || healthScore === 2)) {
    const isProductSpec =
      /(for heavy flow|for flow|period underwear|period panties|pads|tampons|cup)/i.test(q);
    if (isProductSpec) {
      healthScore = 0;
    }
  }

  // Check for Multi-Agent Combinations (max 2 agents)
  if (healthScore > 0 && essentialsScore > 0 && entertainmentScore === 0) {
    return {
      target: "multi_agent",
      intent: DIVA_INTENTS.MULTI_AGENT,
      agents: ["eeve", "flash"],
      confidence: 0.88,
      reason: "Detected health explanation and essentials discovery request.",
      level: "level1_deterministic",
    };
  }

  if (essentialsScore > 0 && entertainmentScore > 0 && healthScore === 0) {
    return {
      target: "multi_agent",
      intent: DIVA_INTENTS.MULTI_AGENT,
      agents: ["flash", "instinct"],
      confidence: 0.95,
      reason: "Detected comfort product request alongside entertainment discovery.",
      level: "level1_deterministic",
    };
  }

  if (healthScore > 0 && entertainmentScore > 0 && essentialsScore === 0) {
    return {
      target: "multi_agent",
      intent: DIVA_INTENTS.MULTI_AGENT,
      agents: ["eeve", "instinct"],
      confidence: 0.95,
      reason: "Detected health inquiry alongside relaxing entertainment request.",
      level: "level1_deterministic",
    };
  }

  if (essentialsScore > 0 && entertainmentScore > 0) {
    return {
      target: "multi_agent",
      intent: DIVA_INTENTS.MULTI_AGENT,
      agents: ["flash", "instinct"],
      confidence: 0.95,
      reason: "Detected comfort product request alongside entertainment discovery.",
      level: "level1_deterministic",
    };
  }

  // Single Agent Dominance
  if (healthScore >= 1 && healthScore > essentialsScore && healthScore > entertainmentScore) {
    return {
      target: "eeve",
      intent: DIVA_INTENTS.HEALTH_INQUIRY,
      agents: ["eeve"],
      confidence: 0.92,
      reason: "Deterministic health & menstrual keyword dominance.",
      level: "level1_deterministic",
    };
  }

  if (
    essentialsScore >= 1 &&
    essentialsScore > healthScore &&
    essentialsScore > entertainmentScore
  ) {
    return {
      target: "flash",
      intent: DIVA_INTENTS.PRODUCT_DISCOVERY,
      agents: ["flash"],
      confidence: 0.92,
      reason: "Deterministic product, price, or essentials keyword dominance.",
      level: "level1_deterministic",
    };
  }

  if (
    entertainmentScore >= 1 &&
    entertainmentScore > healthScore &&
    entertainmentScore > essentialsScore
  ) {
    return {
      target: "instinct",
      intent: DIVA_INTENTS.ENTERTAINMENT,
      agents: ["instinct"],
      confidence: 0.92,
      reason: "Deterministic movies, series, or music keyword dominance.",
      level: "level1_deterministic",
    };
  }

  // Ambiguous
  return {
    target: "ambiguous",
    intent: DIVA_INTENTS.CLARIFICATION,
    agents: [],
    confidence: 0.35,
    scores: { healthScore, essentialsScore, entertainmentScore },
    reason: "Query did not trigger a clear dominant category.",
    level: "level1_deterministic",
  };
}

/**
 * Level 2: Context-Aware Follow-Up Routing
 */
export function classifyWithContext(query, history = []) {
  // First attempt deterministic
  const direct = classifyDeterministic(query);
  if (direct.target !== "ambiguous" && direct.confidence >= 0.85) {
    return direct;
  }

  // If ambiguous or follow-up style query ("something shorter", "any cheaper?", "why?")
  const lastTurn = history.length > 0 ? history[history.length - 1] : null;
  const previousSpecialist = lastTurn?.agentId || lastTurn?.specialist;

  if (previousSpecialist && AGENT_IDS.includes(previousSpecialist)) {
    const qLower = query.toLowerCase();
    const isShortFollowUp =
      query.split(/\s+/).length <= 10 ||
      /^(why|how come|something|any|more|cheaper|shorter|longer|lighter|better|another|can you show|show me)\b/i.test(
        qLower,
      );

    if (isShortFollowUp) {
      const intentMap = {
        eeve: DIVA_INTENTS.HEALTH_INQUIRY,
        flash: DIVA_INTENTS.PRODUCT_DISCOVERY,
        instinct: DIVA_INTENTS.ENTERTAINMENT,
      };

      return {
        target: previousSpecialist,
        intent: intentMap[previousSpecialist] || DIVA_INTENTS.HEALTH_INQUIRY,
        agents: [previousSpecialist],
        confidence: 0.85,
        reason: `Context follow-up to previous specialist: ${previousSpecialist}`,
        level: "level2_context",
        isFollowUp: true,
      };
    }
  }

  return direct;
}

/**
 * Level 3: Optional Gemini Router Proxy
 */
export async function classifyWithGemini(query, history = []) {
  try {
    const res = await fetch("/api/diva/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, history: history.slice(-4) }),
    });

    if (res.ok) {
      const data = await res.json();
      if (
        data &&
        ["eeve", "flash", "instinct", "multi_agent", "clarification", "unsupported"].includes(
          data.target,
        )
      ) {
        // Enforce valid agent list
        const validAgents = (data.agents || []).filter((a) => AGENT_IDS.includes(a));
        const intentMap = {
          eeve: DIVA_INTENTS.HEALTH_INQUIRY,
          flash: DIVA_INTENTS.PRODUCT_DISCOVERY,
          instinct: DIVA_INTENTS.ENTERTAINMENT,
          multi_agent: DIVA_INTENTS.MULTI_AGENT,
          clarification: DIVA_INTENTS.CLARIFICATION,
        };

        return {
          target: data.target,
          intent: intentMap[data.target] || DIVA_INTENTS.CLARIFICATION,
          agents: validAgents.slice(0, 2), // strictly limit concurrency to 2
          confidence: data.confidence || 0.85,
          reason: data.reason || "Classified via Gemini natural language orchestrator.",
          level: "level3_gemini",
        };
      }
    }
  } catch {
    // fallback to local clarification
  }

  return {
    target: "clarification",
    intent: DIVA_INTENTS.CLARIFICATION,
    agents: [],
    confidence: 0.5,
    reason: "Fallback to clarification.",
    level: "level4_clarification",
  };
}

/**
 * Privacy Firewall Sanitizer
 */
export function sanitizeDivaContext(agentId, context = {}) {
  if (!context || typeof context !== "object") return null;

  const restrictedKeys = [
    "cycleDay",
    "cycle_diary",
    "symptoms_history",
    "fertility_status",
    "cycle_records",
    "medical_diary",
    "symptoms",
    "painLevel",
    "flow",
    "isPeriodToday",
    "lastPeriodDate",
    "notes",
    "period_history",
    "ovulation_observations",
    "private_notes",
    "health_chat_logs",
    "diagnosed_medical_conditions",
    "menstrual_history",
    "medical_conditions",
    "pregnancy_tracker",
    "health_chat_history",
    "diagnostic_confirmation",
    "prescription_recommendations",
  ];

  if (agentId === "eeve") {
    return context;
  }

  const sanitized = {};
  let retainedKeys = 0;
  for (const [key, value] of Object.entries(context)) {
    if (!restrictedKeys.includes(key)) {
      sanitized[key] = value;
      retainedKeys++;
    }
  }

  if (retainedKeys === 0) return null;
  return sanitized;
}

/**
 * Master Hybrid Routing Pipeline
 */
export async function routeDivaQuery(query, historyOrOptions = [], manualAgent = "auto") {
  let history = [];
  let effectiveMode = manualAgent;

  if (Array.isArray(historyOrOptions)) {
    history = historyOrOptions;
  } else if (historyOrOptions && typeof historyOrOptions === "object") {
    if (historyOrOptions.mode) effectiveMode = historyOrOptions.mode;
    if (Array.isArray(historyOrOptions.messages)) history = [...historyOrOptions.messages];
    if (historyOrOptions.lastAgent) {
      history.push({ agentId: historyOrOptions.lastAgent });
    }
  }

  // Manual Override
  if (effectiveMode && effectiveMode !== "auto" && AGENT_IDS.includes(effectiveMode)) {
    const intentMap = {
      eeve: DIVA_INTENTS.HEALTH_INQUIRY,
      flash: DIVA_INTENTS.PRODUCT_DISCOVERY,
      instinct: DIVA_INTENTS.ENTERTAINMENT,
    };
    return {
      target: effectiveMode,
      intent: intentMap[effectiveMode] || DIVA_INTENTS.HEALTH_INQUIRY,
      agents: [effectiveMode],
      confidence: 1.0,
      reason: `User explicitly selected specialist: ${effectiveMode}`,
      level: "manual_override",
    };
  }

  // Level 1 & Level 2: Deterministic & Context
  const contextResult = classifyWithContext(query, history);
  if (contextResult.target !== "ambiguous") {
    return contextResult;
  }

  // Level 3: Optional Gemini classification
  if (typeof window !== "undefined" && navigator.onLine) {
    const geminiResult = await classifyWithGemini(query, history);
    if (geminiResult.target !== "clarification") {
      return geminiResult;
    }
  }

  // Level 4: Clarification fallback
  return {
    target: "clarification",
    intent: DIVA_INTENTS.CLARIFICATION,
    agents: [],
    confidence: 0.4,
    reason: "Ambiguous query requiring user clarification.",
    level: "level4_clarification",
    needsClarification: true,
    clarificationPrompt:
      "Would you like advice from Eeve (Health), FLASH (Essentials), or INSTINCT (Entertainment)?",
    clarificationOptions: [
      { id: "eeve", label: "Health Guidance (Eeve)" },
      { id: "flash", label: "Find Products (FLASH)" },
      { id: "instinct", label: "Entertainment & Vibe (INSTINCT)" },
    ],
    options: [
      { id: "eeve", label: "Health Guidance (Eeve)" },
      { id: "flash", label: "Find Products (FLASH)" },
      { id: "instinct", label: "Entertainment & Vibe (INSTINCT)" },
    ],
  };
}
