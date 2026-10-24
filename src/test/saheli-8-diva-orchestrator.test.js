/**
 * Saheli 8.0 — DIVA Multi-Agent Orchestrator Test Suite
 *
 * Requirements:
 * - Vitest runner exclusively (NEVER bun:test)
 * - Agent Registry contracts & typed capabilities
 * - 4-Level hybrid routing engine (deterministic, context-aware, fallback, clarification)
 * - Strict Privacy Firewall (zero cross-agent leakage of cycle/health data to FLASH or INSTINCT)
 * - Multi-agent bounded orchestration (concurrency cap <= 2, timeout resilience, partial failure handling)
 * - Offline deterministic fallbacks
 * - Manual specialist override
 * - Eeve identity & backward compatibility
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  DIVA_AGENTS,
  hasAgentCapability,
  isIntentSupported,
  createAgentRequest,
  createAgentResult,
} from "../lib/divaRegistry.js";
import {
  routeDivaQuery,
  DIVA_INTENTS,
  DIVA_MODES,
  sanitizeDivaContext,
} from "../lib/divaRouter.js";
import {
  executeDivaRequest,
  executeEeveAgent,
  executeFlashAgent,
  executeInstinctAgent,
} from "../lib/divaOrchestrator.js";

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof window === "undefined") {
  global.localStorage = localStorageMock;
}

describe("Saheli 8.0 — DIVA Agent Registry & Contracts", () => {
  it("defines all three core specialists with required contract properties", () => {
    expect(DIVA_AGENTS.eeve).toBeDefined();
    expect(DIVA_AGENTS.flash).toBeDefined();
    expect(DIVA_AGENTS.instinct).toBeDefined();

    for (const id of ["eeve", "flash", "instinct"]) {
      const agent = DIVA_AGENTS[id];
      expect(agent.id).toBe(id);
      expect(agent.name).toBeTruthy();
      expect(agent.role).toBeTruthy();
      expect(agent.category).toBeTruthy();
      expect(agent.capabilities).toBeInstanceOf(Array);
      expect(agent.supportedIntents).toBeInstanceOf(Array);
      expect(agent.allowedContext).toBeInstanceOf(Array);
      expect(agent.restrictedContext).toBeInstanceOf(Array);
      expect(typeof agent.timeoutMs).toBe("number");
      expect(agent.timeoutMs).toBeGreaterThan(0);
      expect(agent.maxExecutionsPerTurn).toBe(1);
    }
  });

  it("enforces strict privacy restrictions in registry contracts", () => {
    // FLASH must not access health or diary records
    expect(DIVA_AGENTS.flash.restrictedContext).toContain("cycle_diary");
    expect(DIVA_AGENTS.flash.restrictedContext).toContain("symptoms_history");
    expect(DIVA_AGENTS.flash.restrictedContext).toContain("fertility_status");

    // INSTINCT must not access health or cycle records
    expect(DIVA_AGENTS.instinct.restrictedContext).toContain("cycle_records");
    expect(DIVA_AGENTS.instinct.restrictedContext).toContain("medical_diary");
    expect(DIVA_AGENTS.instinct.restrictedContext).toContain("symptoms");

    // EEVE must strictly refuse diagnosis or prescribing
    expect(DIVA_AGENTS.eeve.restrictedContext).toContain("diagnostic_confirmation");
    expect(DIVA_AGENTS.eeve.restrictedContext).toContain("prescription_recommendations");
  });

  it("validates capability and intent helper checks", () => {
    expect(hasAgentCapability("eeve", "menstrual_education")).toBe(true);
    expect(hasAgentCapability("flash", "product_recommendation")).toBe(true);
    expect(hasAgentCapability("instinct", "media_recommendation")).toBe(true);

    expect(hasAgentCapability("flash", "menstrual_education")).toBe(false);
    expect(hasAgentCapability("instinct", "product_pricing")).toBe(false);

    expect(isIntentSupported("eeve", DIVA_INTENTS.HEALTH_INQUIRY)).toBe(true);
    expect(isIntentSupported("flash", DIVA_INTENTS.PRODUCT_DISCOVERY)).toBe(true);
    expect(isIntentSupported("instinct", DIVA_INTENTS.ENTERTAINMENT)).toBe(true);
  });

  it("creates structured agent request and result objects", () => {
    const req = createAgentRequest({
      agentId: "flash",
      query: "biodegradable sanitary pads",
      conversationId: "test-conv-123",
      context: { budgetMax: 400 },
    });
    expect(req.agentId).toBe("flash");
    expect(req.query).toBe("biodegradable sanitary pads");
    expect(req.conversationId).toBe("test-conv-123");
    expect(req.context.budgetMax).toBe(400);

    const res = createAgentResult({
      agentId: "flash",
      success: true,
      data: [{ id: "prod-1", name: "Carmesi Organic Pads" }],
      attribution: "FLASH Essentials AI",
      latencyMs: 42,
    });
    expect(res.agentId).toBe("flash");
    expect(res.success).toBe(true);
    expect(res.attribution).toBe("FLASH Essentials AI");
    expect(res.latencyMs).toBe(42);
  });
});

describe("Saheli 8.0 — DIVA 4-Level Hybrid Routing Engine", () => {
  it("routes health inquiries deterministically to Eeve", async () => {
    const queries = [
      "Why is my period late by 4 days?",
      "How to manage painful cramps naturally?",
      "What is normal follicular phase discharge?",
      "Is spotting between cycles an emergency red flag?",
    ];

    for (const q of queries) {
      const decision = await routeDivaQuery(q);
      expect(decision.agents).toContain("eeve");
      expect(decision.intent).toBe(DIVA_INTENTS.HEALTH_INQUIRY);
      expect(decision.confidence).toBeGreaterThan(0.5);
    }
  });

  it("routes personal essentials and sanitary product queries deterministically to FLASH", async () => {
    const queries = [
      "What are the best rash-free sanitary pads under 300 rupees?",
      "Compare menstrual cup vs tampons for heavy flow",
      "Which heat patch is most budget friendly?",
      "Find reusable cloth pads pack of 3",
    ];

    for (const q of queries) {
      const decision = await routeDivaQuery(q);
      expect(decision.agents).toContain("flash");
      expect(decision.intent).toBe(DIVA_INTENTS.PRODUCT_DISCOVERY);
      expect(decision.confidence).toBeGreaterThan(0.5);
    }
  });

  it("routes movies, TV shows, and entertainment queries deterministically to INSTINCT", async () => {
    const queries = [
      "Recommend a feel-good romance K-drama on Netflix",
      "Best comedy movies to watch when relaxing at home",
      "What episode of Crash Landing on You is the reunion?",
      "Find relaxing anime series with calm music",
    ];

    for (const q of queries) {
      const decision = await routeDivaQuery(q);
      expect(decision.agents).toContain("instinct");
      expect(decision.intent).toBe(DIVA_INTENTS.ENTERTAINMENT);
      expect(decision.confidence).toBeGreaterThan(0.5);
    }
  });

  it("routes dual-agent composite requests without exceeding max 2 agents", async () => {
    // Health + Entertainment
    const q1 = "I have terrible period cramps, recommend what to do and a comfort movie to watch";
    const decision1 = await routeDivaQuery(q1);
    expect(decision1.intent).toBe(DIVA_INTENTS.MULTI_AGENT);
    expect(decision1.agents.length).toBeLessThanOrEqual(2);
    expect(decision1.agents).toContain("eeve");
    expect(decision1.agents).toContain("instinct");

    // Essentials + Entertainment
    const q2 = "Find me sanitary pads for heavy flow and a series to binge-watch tonight";
    const decision2 = await routeDivaQuery(q2);
    expect(decision2.intent).toBe(DIVA_INTENTS.MULTI_AGENT);
    expect(decision2.agents.length).toBeLessThanOrEqual(2);
    expect(decision2.agents).toContain("flash");
    expect(decision2.agents).toContain("instinct");
  });

  it("resolves context-aware follow-ups to the preceding agent", async () => {
    const followUp = "Can you show me more like the second one?";
    const decision = await routeDivaQuery(followUp, {
      lastAgent: "instinct",
      messages: [{ role: "user", text: "Recommend a romance drama" }],
    });

    expect(decision.agents).toEqual(["instinct"]);
    expect(decision.level).toBe("level2_context");
  });

  it("requests clarification for short or ambiguous inputs", async () => {
    const vagueQueries = ["help", "options", "hello", "what can you do?"];

    for (const q of vagueQueries) {
      const decision = await routeDivaQuery(q);
      expect(decision.needsClarification).toBe(true);
      expect(decision.intent).toBe(DIVA_INTENTS.CLARIFICATION);
      expect(decision.clarificationOptions).toBeInstanceOf(Array);
      expect(decision.clarificationOptions.length).toBe(3);
    }
  });

  it("respects manual specialist mode override", async () => {
    // A query mentioning movies, but user manually locked mode to FLASH
    const decision = await routeDivaQuery("movie", {
      mode: DIVA_MODES.MANUAL_FLASH,
    });
    expect(decision.agents).toEqual(["flash"]);
    expect(decision.level).toBe("manual_override");

    // A query mentioning pads, but user manually locked mode to EEVE
    const decisionEeve = await routeDivaQuery("sanitary pads", {
      mode: DIVA_MODES.MANUAL_EEVE,
    });
    expect(decisionEeve.agents).toEqual(["eeve"]);
    expect(decisionEeve.level).toBe("manual_override");
  });
});

describe("Saheli 8.0 — DIVA Privacy Firewall", () => {
  const sensitiveCycleContext = {
    cycleDay: 14,
    lastPeriodDate: "2026-10-10",
    isPeriodToday: true,
    symptoms: ["severe_cramps", "backache"],
    flow: "heavy",
    painLevel: 7,
    notes: "Private personal medical note",
  };

  it("sanitizes context for FLASH by stripping all cycle and medical data", () => {
    const sanitized = sanitizeDivaContext("flash", sensitiveCycleContext);
    expect(sanitized).toBeNull();
  });

  it("sanitizes context for INSTINCT by stripping all cycle and medical data", () => {
    const sanitized = sanitizeDivaContext("instinct", sensitiveCycleContext);
    expect(sanitized).toBeNull();
  });

  it("allows non-health user preferences to reach FLASH and INSTINCT safely", () => {
    const flashPreferences = {
      budgetMax: 500,
      materialPreference: "cotton",
      // attempted injection of medical data
      cycleDay: 14,
    };
    const sanitizedFlash = sanitizeDivaContext("flash", flashPreferences);
    expect(sanitizedFlash.budgetMax).toBe(500);
    expect(sanitizedFlash.materialPreference).toBe("cotton");
    expect(sanitizedFlash.cycleDay).toBeUndefined();

    const instinctPreferences = {
      preferredGenres: ["Romance", "Comedy"],
      streamingServices: ["Netflix"],
      // attempted injection of medical data
      painLevel: 5,
    };
    const sanitizedInstinct = sanitizeDivaContext("instinct", instinctPreferences);
    expect(sanitizedInstinct.preferredGenres).toContain("Romance");
    expect(sanitizedInstinct.streamingServices).toContain("Netflix");
    expect(sanitizedInstinct.painLevel).toBeUndefined();
  });

  it("passes opt-in cycle context to Eeve for health education", () => {
    const sanitized = sanitizeDivaContext("eeve", sensitiveCycleContext);
    expect(sanitized.cycleDay).toBe(14);
    expect(sanitized.flow).toBe("heavy");
    expect(sanitized.painLevel).toBe(7);
  });
});

describe("Saheli 8.0 — Multi-Agent Orchestrator Execution", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("executes single-agent request with Eeve fallback offline", async () => {
    const res = await executeEeveAgent("What causes cramps during menstruation?");
    expect(res.agentId).toBe("eeve");
    expect(res.success).toBe(true);
    expect(typeof res.text).toBe("string");
    expect(res.text.length).toBeGreaterThan(0);
    expect(res.attribution).toContain("Eeve");
  });

  it("executes single-agent request with FLASH recommendations offline", async () => {
    const res = await executeFlashAgent("organic cotton pads under 350");
    expect(res.agentId).toBe("flash");
    expect(res.success).toBe(true);
    expect(res.data).toBeInstanceOf(Array);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.attribution).toContain("FLASH");
  });

  it("executes single-agent request with INSTINCT recommendations offline", async () => {
    const res = await executeInstinctAgent("comfort movie comedy");
    expect(res.agentId).toBe("instinct");
    expect(res.success).toBe(true);
    expect(res.data).toBeInstanceOf(Array);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.attribution).toContain("INSTINCT");
  });

  it("orchestrates dual-agent composite request and combines results cleanly", async () => {
    const query = "I have period pain, tell me what to do and suggest a relaxing movie";
    const routeDecision = {
      intent: DIVA_INTENTS.MULTI_AGENT,
      agents: ["eeve", "instinct"],
      confidence: 0.95,
      level: "level1_deterministic",
    };

    const orchestratorResult = await executeDivaRequest({
      query,
      route: routeDecision,
    });

    expect(orchestratorResult.success).toBe(true);
    expect(orchestratorResult.agentResults.length).toBe(2);

    const eeveResult = orchestratorResult.agentResults.find((r) => r.agentId === "eeve");
    const instinctResult = orchestratorResult.agentResults.find((r) => r.agentId === "instinct");

    expect(eeveResult).toBeDefined();
    expect(eeveResult.success).toBe(true);
    expect(instinctResult).toBeDefined();
    expect(instinctResult.success).toBe(true);

    expect(orchestratorResult.compositeSummary).toContain("Eeve");
    expect(orchestratorResult.compositeSummary).toContain("INSTINCT");
  });

  it("enforces bounded execution limit of at most two agents", async () => {
    // Route maliciously configured with 3 agents
    const routeDecision = {
      intent: DIVA_INTENTS.MULTI_AGENT,
      agents: ["eeve", "flash", "instinct"],
      confidence: 0.99,
      level: "level1_deterministic",
    };

    const orchestratorResult = await executeDivaRequest({
      query: "test query with 3 agents",
      route: routeDecision,
    });

    // Orchestrator must slice to max 2
    expect(orchestratorResult.agentResults.length).toBeLessThanOrEqual(2);
  });
});
