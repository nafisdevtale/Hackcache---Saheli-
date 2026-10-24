/**
 * Saheli 8.0 — DIVA Specialist Agent Registry
 *
 * Defines explicit typed contracts, capability matrices, and privacy boundaries
 * for Eeve (Health), FLASH (Essentials), and INSTINCT (Entertainment).
 */

export const AGENT_IDS = ["eeve", "flash", "instinct"];

export const AGENT_REGISTRY = {
  eeve: {
    id: "eeve",
    displayName: "Eeve",
    roleName: "Your Health AI Companion",
    get name() {
      return this.displayName;
    },
    get role() {
      return this.roleName;
    },
    category: "health",
    iconName: "Stethoscope",
    accentColor: "text-primary bg-primary/10 border-primary/20",
    badgeLabel: "Health Specialist",
    description:
      "Supportive menstrual-health education, symptom guidance, cycle explanation, and non-diagnostic medical questions.",
    capabilities: [
      "menstrual_health",
      "symptom_guidance",
      "cycle_education",
      "medical_faq",
      "emergency_screening",
      "menstrual_education",
    ],
    supportedIntents: [
      "health_question",
      "symptom_inquiry",
      "cycle_phase_advice",
      "hygiene_guidance",
      "emergency_triage",
    ],
    allowedTools: ["search_medical_faq", "consult_gemini_medical", "screen_emergency_redflags"],
    allowedInformation: ["sanitized_health_query", "user_locale", "opt_in_anonymous_cycle_timing"],
    restrictedInformation: [
      "diagnostic_confirmation",
      "prescription_recommendations",
      "shopping_preferences",
      "entertainment_preferences",
      "media_watchlist",
      "private_notes",
    ],
    get restrictedContext() {
      return this.restrictedInformation;
    },
    get allowedContext() {
      return this.allowedInformation;
    },
    maxExecutionsPerTurn: 1,
    fallback: "Deterministic verified offline FAQ matching (NHS, WHO, FOGSI).",
    timeoutMs: 7000,
    executionLimits: {
      maxTokens: 600,
      maxQueriesPerMinute: 20,
    },
  },

  flash: {
    id: "flash",
    displayName: "FLASH",
    roleName: "Personal Essentials Advisor",
    get name() {
      return this.displayName;
    },
    get role() {
      return this.roleName;
    },
    category: "essentials",
    iconName: "ShoppingBag",
    accentColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    badgeLabel: "Essentials Specialist",
    description:
      "Non-prescription menstrual-care and personal comfort product discovery, comparisons, and unit-cost calculations.",
    capabilities: [
      "product_recommendation",
      "unit_cost_comparison",
      "safe_alternatives",
      "budget_filtering",
      "material_analysis",
    ],
    supportedIntents: [
      "product_search",
      "cost_comparison",
      "reusable_alternatives",
      "essential_recommendation",
    ],
    allowedTools: ["query_market_catalogue", "rank_essentials_ml", "calculate_unit_costs"],
    allowedInformation: [
      "budget_range",
      "product_category",
      "material_preference",
      "anonymized_user_prefs",
    ],
    restrictedInformation: [
      "cycle_diary",
      "symptoms_history",
      "fertility_status",
      "diagnosed_medical_conditions",
      "period_history",
      "ovulation_observations",
      "private_notes",
      "health_chat_logs",
    ],
    get restrictedContext() {
      return this.restrictedInformation;
    },
    get allowedContext() {
      return this.allowedInformation;
    },
    maxExecutionsPerTurn: 1,
    fallback: "Verified on-device product catalogue (BIS, FDA, ISO verified items).",
    timeoutMs: 5000,
    executionLimits: {
      maxTokens: 500,
      maxQueriesPerMinute: 30,
    },
  },

  instinct: {
    id: "instinct",
    displayName: "INSTINCT",
    roleName: "Personal Entertainment Advisor",
    get name() {
      return this.displayName;
    },
    get role() {
      return this.roleName;
    },
    category: "entertainment",
    iconName: "Film",
    accentColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    badgeLabel: "Culture Specialist",
    description:
      "Movies, television series, K-dramas, music discovery, and mood-aligned culture recommendations.",
    capabilities: [
      "movie_recommendation",
      "media_recommendation",
      "tv_discovery",
      "kdrama_tracking",
      "music_soundscapes",
      "streaming_availability",
    ],
    supportedIntents: [
      "media_search",
      "mood_recommendation",
      "genre_discovery",
      "kdrama_inquiry",
      "music_preview",
    ],
    allowedTools: [
      "query_entertainment_catalogue",
      "rank_instinct_ml",
      "search_music_previews",
      "check_streaming_sources",
    ],
    allowedInformation: [
      "entertainment_taste_profile",
      "age_suitability_filter",
      "preferred_services",
      "preferred_genres",
    ],
    restrictedInformation: [
      "cycle_records",
      "medical_diary",
      "symptoms",
      "menstrual_history",
      "medical_conditions",
      "pregnancy_tracker",
      "health_chat_history",
      "shopping_preferences",
    ],
    get restrictedContext() {
      return this.restrictedInformation;
    },
    get allowedContext() {
      return this.allowedInformation;
    },
    maxExecutionsPerTurn: 1,
    fallback: "Verified on-device entertainment catalogue with streaming platforms.",
    timeoutMs: 5000,
    executionLimits: {
      maxTokens: 500,
      maxQueriesPerMinute: 30,
    },
  },
};

export const DIVA_AGENTS = AGENT_REGISTRY;

/**
 * Capability Checking Helper
 */
export function hasAgentCapability(agentId, capability) {
  const agent = AGENT_REGISTRY[agentId];
  if (!agent) return false;
  return agent.capabilities.includes(capability);
}

/**
 * Intent Validation Helper
 */
export function isIntentSupported(agentId, intent) {
  const agent = AGENT_REGISTRY[agentId];
  if (!agent) return false;
  if (agent.supportedIntents.includes(intent)) return true;
  // Map common intent tokens
  const intentMap = {
    health_inquiry: ["health_question", "symptom_inquiry", "cycle_phase_advice"],
    product_discovery: ["product_search", "cost_comparison", "essential_recommendation"],
    entertainment: ["media_search", "mood_recommendation", "genre_discovery", "kdrama_inquiry"],
  };
  if (intentMap[intent]) {
    return intentMap[intent].some((i) => agent.supportedIntents.includes(i));
  }
  return false;
}

/**
 * Structured Communication Contracts
 */
export function createAgentRequest({
  agentId,
  intent,
  query,
  sanitizedQuery,
  conversationId,
  locale = "en",
  allowedContext = {},
  context = {},
}) {
  if (!AGENT_REGISTRY[agentId]) {
    throw new Error(`Unsupported agent identifier: ${agentId}`);
  }

  const effectiveQuery = (query || sanitizedQuery || "").trim().slice(0, 500);
  const effectiveContext = Object.keys(context).length > 0 ? context : allowedContext;

  // Filter restricted keys from context
  const restrictedKeys = AGENT_REGISTRY[agentId].restrictedInformation || [];
  const filteredContext = {};
  for (const [key, value] of Object.entries(effectiveContext)) {
    if (!restrictedKeys.includes(key)) {
      filteredContext[key] = value;
    }
  }

  return {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    agentId,
    intent,
    query: effectiveQuery,
    sanitizedQuery: effectiveQuery,
    conversationId,
    locale,
    context: filteredContext,
    allowedContext: filteredContext,
    timestamp: new Date().toISOString(),
  };
}

export function createAgentResult({
  agentId,
  status = "success",
  success = true,
  data = [],
  text = "",
  cards = [],
  sources = [],
  warnings = [],
  attribution = "",
  latencyMs = 0,
  errorCode = null,
}) {
  return {
    agentId,
    status: status || (success ? "success" : "error"),
    success: typeof success === "boolean" ? success : status === "success",
    data: Array.isArray(data) ? data : [],
    text,
    cards: Array.isArray(cards) ? cards : [],
    sources: Array.isArray(sources) ? sources : [],
    warnings: Array.isArray(warnings) ? warnings : [],
    attribution: attribution || AGENT_REGISTRY[agentId]?.displayName || agentId,
    latencyMs,
    errorCode,
    timestamp: new Date().toISOString(),
  };
}
