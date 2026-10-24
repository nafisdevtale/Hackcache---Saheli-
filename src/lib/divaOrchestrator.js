/**
 * Saheli 8.0 — DIVA Multi-Agent Orchestrator
 *
 * Coordinates execution across:
 * - Eeve (Health AI Companion)
 * - FLASH (Personal Essentials Advisor)
 * - INSTINCT (Personal Entertainment Advisor)
 *
 * Enforces:
 * - Strict Privacy Firewall (zero cross-specialist sensitive data leakage).
 * - Bounded Concurrency (max 2 specialists per request).
 * - Per-agent timeouts & graceful partial-failure handling.
 * - Resilient Offline Fallback.
 */

import { AGENT_REGISTRY, createAgentRequest, createAgentResult } from "./divaRegistry.js";
import { routeDivaQuery } from "./divaRouter.js";
import { matchFaq } from "../content/faq.js";
import { VERIFIED_PRODUCTS } from "../content/products.js";
import { VERIFIED_ENTERTAINMENT } from "../content/entertainment.js";
import { searchCatalogue } from "./instinctRecommender.js";

/**
 * Execute Eeve (Health Specialist)
 */
export async function executeEeveAgent(query, options = {}) {
  const req = createAgentRequest({
    agentId: "eeve",
    intent: "health_question",
    sanitizedQuery: query,
    locale: options.locale || "en",
    allowedContext: options.allowedContext || {},
  });
  return executeEeve(req);
}

async function executeEeve(agentReq) {
  const query = agentReq.sanitizedQuery;
  const timeoutMs = AGENT_REGISTRY.eeve.timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;
    if (isOnline) {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          consent: true,
          context: agentReq.allowedContext?.optInCycleContext,
          lang: agentReq.locale || "en",
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        return createAgentResult({
          agentId: "eeve",
          status: "success",
          success: true,
          text: data.answer || data.message || "Here is supportive health information from Eeve.",
          data: data.sources || [],
          sources: data.sources || ["NHS & WHO Clinical Guidelines"],
          cards: data.helplines ? [{ type: "emergency_helplines", helplines: data.helplines }] : [],
          warnings: data.isRedFlag ? ["Immediate clinical attention recommended."] : [],
          attribution: "Eeve (Health AI Companion)",
        });
      }
    }
  } catch {
    // Offline or network error
  } finally {
    clearTimeout(timer);
  }

  // Deterministic Offline Fallback for Eeve
  const matched = matchFaq(query);
  if (matched?.item) {
    return createAgentResult({
      agentId: "eeve",
      status: "partial",
      success: true,
      text:
        matched.item.a?.en ||
        matched.item.a?.hi ||
        "Here is verified offline medical guidance from Eeve.",
      data: [matched.item],
      sources: ["Saheli Verified Offline Medical Library (NHS/WHO/FOGSI)"],
      warnings: ["Operating in offline mode."],
      attribution: "Eeve (Health AI Companion)",
    });
  }

  return createAgentResult({
    agentId: "eeve",
    status: "partial",
    success: true,
    text: "Eeve advises tracking symptoms in your journal and consulting a qualified healthcare professional or gynecologist if pain or bleeding is severe.",
    data: [],
    sources: ["NHS / FOGSI Clinical Standards"],
    attribution: "Eeve (Health AI Companion)",
  });
}

/**
 * Execute FLASH (Essentials Specialist)
 */
export async function executeFlashAgent(query, options = {}) {
  const req = createAgentRequest({
    agentId: "flash",
    intent: "product_search",
    sanitizedQuery: query,
    locale: options.locale || "en",
    allowedContext: options.allowedContext || {},
  });
  return executeFlash(req);
}

async function executeFlash(agentReq) {
  const query = agentReq.sanitizedQuery.toLowerCase();
  const qTerms = query.split(/\s+/).filter(Boolean);

  // Search verified product catalogue
  let matched = VERIFIED_PRODUCTS.filter((prod) => {
    const nameMatch = prod.name.toLowerCase().includes(query);
    const catMatch = prod.category?.toLowerCase().includes(query);
    const brandMatch = prod.brand?.toLowerCase().includes(query);
    const anyTerm = qTerms.some(
      (term) =>
        prod.name.toLowerCase().includes(term) ||
        prod.category?.toLowerCase().includes(term) ||
        (prod.tags || []).some((t) => t.toLowerCase().includes(term)),
    );
    return nameMatch || catMatch || brandMatch || anyTerm;
  });

  if (matched.length === 0) {
    // Default to top verified essentials
    matched = VERIFIED_PRODUCTS.slice(0, 3);
  } else {
    matched = matched.slice(0, 3);
  }

  const cards = matched.map((p) => ({
    type: "product_card",
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    unitCost: p.unitCost,
    unit: p.unit,
    rating: p.rating,
    tags: p.tags,
    sustainable: p.sustainable,
    certifications: p.certifications,
  }));

  const text = `FLASH found ${matched.length} verified essential options tailored to your request with transparent pricing and safety verification.`;

  return createAgentResult({
    agentId: "flash",
    status: "success",
    success: true,
    text,
    data: matched,
    cards,
    sources: ["FLASH Verified Essentials Registry (BIS, FDA, ISO compliant)"],
    attribution: "FLASH Essentials AI",
  });
}

/**
 * Execute INSTINCT (Entertainment Specialist)
 */
export async function executeInstinctAgent(query, options = {}) {
  const req = createAgentRequest({
    agentId: "instinct",
    intent: "media_search",
    sanitizedQuery: query,
    locale: options.locale || "en",
    allowedContext: options.allowedContext || {},
  });
  return executeInstinct(req);
}

async function executeInstinct(agentReq) {
  const query = agentReq.sanitizedQuery;
  const timeoutMs = AGENT_REGISTRY.instinct.timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;
    if (isOnline) {
      const res = await fetch("/api/instinct/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const cards = (data.recommendations || []).map((rec) => ({
          type: "media_card",
          id: rec.id,
          title: rec.title,
          originalTitle: rec.originalTitle,
          releaseYear: rec.releaseYear,
          mediaType: rec.type,
          posterUrl: rec.posterUrl,
          rating: rec.rating,
          genres: rec.genres || [rec.genre],
          streamingServices: rec.streamingServices,
          previewAudioUrl: rec.previewAudioUrl,
        }));

        return createAgentResult({
          agentId: "instinct",
          status: "success",
          success: true,
          text: data.text || "Here are personalized entertainment recommendations from INSTINCT.",
          data: cards,
          cards,
          sources: ["TMDB & Watchmode Verified Registry"],
          attribution: "INSTINCT Entertainment AI",
        });
      }
    }
  } catch {
    // Fall through to local fallback
  } finally {
    clearTimeout(timer);
  }

  // Deterministic Local Fallback for INSTINCT
  const localMatches = searchCatalogue(query, "all", VERIFIED_ENTERTAINMENT);
  const items = (localMatches.length > 0 ? localMatches : VERIFIED_ENTERTAINMENT).slice(0, 3);

  const cards = items.map((m) => ({
    type: "media_card",
    id: m.id,
    title: m.title,
    originalTitle: m.originalTitle,
    releaseYear: m.releaseYear,
    mediaType: m.type,
    posterUrl: m.posterUrl,
    rating: m.rating,
    genres: m.genres || [m.genre],
    streamingServices: m.streamingServices,
    previewAudioUrl: m.previewAudioUrl,
  }));

  return createAgentResult({
    agentId: "instinct",
    status: "partial",
    success: true,
    text: `INSTINCT suggests these verified titles suited to your vibe and streaming availability in India:`,
    data: items,
    cards,
    sources: ["INSTINCT Verified Catalogue"],
    warnings: ["Displaying on-device catalogue recommendations."],
    attribution: "INSTINCT Entertainment AI",
  });
}

/**
 * Dispatch an individual agent request
 */
async function dispatchSpecialist(agentId, sanitizedQuery, locale, allowedContext) {
  const req = createAgentRequest({
    agentId,
    intent: `${agentId}_inquiry`,
    sanitizedQuery,
    locale,
    allowedContext,
  });

  if (agentId === "eeve") return executeEeve(req);
  if (agentId === "flash") return executeFlash(req);
  if (agentId === "instinct") return executeInstinct(req);

  throw new Error(`Unknown agent: ${agentId}`);
}

/**
 * Master Diva Orchestrator Function
 */
export async function executeDivaRequest({
  query,
  route: routeArg,
  history = [],
  manualAgent = "auto",
  locale = "en",
  allowedContext = {},
}) {
  const startTime = Date.now();
  const trimmed = (query || "").trim();

  // 1. Route Intent
  const route = routeArg || (await routeDivaQuery(trimmed, history, manualAgent));

  // 2. Handle Clarification
  if (route.target === "clarification" || !route.agents || route.agents.length === 0) {
    return {
      status: "clarification",
      success: true,
      route,
      agentsInvoked: [],
      agentResults: [],
      specialistResults: {},
      clarificationPrompt:
        route.clarificationPrompt ||
        "Would you like advice from Eeve (Health), FLASH (Essentials), or INSTINCT (Entertainment)?",
      options: route.options || [
        { id: "eeve", label: "Health Guidance (Eeve)" },
        { id: "flash", label: "Find Products (FLASH)" },
        { id: "instinct", label: "Entertainment & Vibe (INSTINCT)" },
      ],
      compositeSummary: "Clarification requested.",
      durationMs: Date.now() - startTime,
    };
  }

  // 3. Multi-Agent Bounded Concurrency (strictly max 2 agents)
  const targetAgents = route.agents.slice(0, 2);

  // Privacy Firewall: Sanitized Context Dispatch per Agent
  const dispatches = targetAgents.map((agentId) => {
    // Sanitized context: Eeve gets optInCycleContext; FLASH and INSTINCT get zero health data!
    const contextForAgent = {};
    if (agentId === "eeve" && allowedContext.optInCycleContext) {
      contextForAgent.optInCycleContext = allowedContext.optInCycleContext;
    }

    return dispatchSpecialist(agentId, trimmed, locale, contextForAgent);
  });

  const settled = await Promise.allSettled(dispatches);
  const specialistResults = {};
  const agentResults = [];
  let successCount = 0;

  settled.forEach((outcome, index) => {
    const agentId = targetAgents[index];
    if (outcome.status === "fulfilled") {
      specialistResults[agentId] = outcome.value;
      agentResults.push(outcome.value);
      successCount++;
    } else {
      const errResult = createAgentResult({
        agentId,
        status: "error",
        success: false,
        text: `Specialist ${AGENT_REGISTRY[agentId]?.displayName || agentId} was temporarily unavailable.`,
        errorCode: "AGENT_EXECUTION_FAILED",
      });
      specialistResults[agentId] = errResult;
      agentResults.push(errResult);
    }
  });

  const overallStatus =
    successCount === targetAgents.length ? "success" : successCount > 0 ? "partial" : "error";

  const compositeSummary = targetAgents
    .map((a) => AGENT_REGISTRY[a]?.displayName || a)
    .join(" and ");

  return {
    status: overallStatus,
    success: overallStatus === "success" || overallStatus === "partial",
    route,
    agentsInvoked: targetAgents,
    specialistResults,
    agentResults,
    compositeSummary: `Response coordinated by Diva across ${compositeSummary}.`,
    durationMs: Date.now() - startTime,
  };
}
