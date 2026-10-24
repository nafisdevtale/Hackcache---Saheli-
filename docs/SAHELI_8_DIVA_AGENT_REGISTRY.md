# SAHELI 8.0 — DIVA SPECIALIST AGENT REGISTRY & CONTRACTS

**Document:** Specialist Registry & Communication Protocol  
**Implementation:** `src/lib/divaRegistry.js`  
**Conformance:** Strict TypeScript-compliant contract interface

---

## 1. Specialist Contracts Matrix

| Attribute               | EEVE (Health AI)                                                                                   | FLASH (Essentials AI)                                                                                | INSTINCT (Entertainment AI)                                                                             |
| :---------------------- | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Agent ID**            | `eeve`                                                                                             | `flash`                                                                                              | `instinct`                                                                                              |
| **Role Name**           | Health AI Companion                                                                                | Personal Essentials Advisor                                                                          | Personal Entertainment Advisor                                                                          |
| **Category**            | Health & Clinical Guidance                                                                         | Personal Care & Essentials                                                                           | Media & Culture                                                                                         |
| **UI Color Theme**      | `text-primary bg-primary/10`                                                                       | `text-amber-500 bg-amber-500/10`                                                                     | `text-rose-500 bg-rose-500/10`                                                                          |
| **Icon**                | `Stethoscope`                                                                                      | `ShoppingBag`                                                                                        | `Film`                                                                                                  |
| **Capabilities**        | Menstrual education, symptom guidance, cycle education, medical FAQ, emergency triage              | Product recommendation, unit cost comparison, safe alternatives, budget filtering, material analysis | Movie discovery, TV series discovery, K-drama tracking, music preview, streaming availability           |
| **Supported Intents**   | `health_question`, `symptom_inquiry`, `cycle_phase_advice`, `hygiene_guidance`, `emergency_triage` | `product_search`, `cost_comparison`, `reusable_alternatives`, `essential_recommendation`             | `media_search`, `mood_recommendation`, `genre_discovery`, `kdrama_inquiry`, `music_preview`             |
| **Allowed Tools**       | `search_medical_faq`, `consult_gemini_medical`, `screen_emergency_redflags`                        | `query_market_catalogue`, `rank_essentials_ml`, `calculate_unit_costs`                               | `query_entertainment_catalogue`, `rank_instinct_ml`, `search_music_previews`, `check_streaming_sources` |
| **Timeout Limit**       | `7,000 ms`                                                                                         | `5,000 ms`                                                                                           | `5,000 ms`                                                                                              |
| **Max Turn Executions** | `1`                                                                                                | `1`                                                                                                  | `1`                                                                                                     |
| **Fallback Mechanism**  | Verified on-device FAQ (NHS, WHO, FOGSI)                                                           | Verified on-device product database (BIS, FDA, ISO)                                                  | Verified on-device entertainment database (TMDB, Watchmode)                                             |

---

## 2. Inviolable Context Boundaries

### EEVE (Health Companion)

- **Allowed Context:** Sanitized health query, user locale, opt-in cycle timing (cycle day, flow, pain score).
- **Restricted Context:** Shopping cart preferences, media watchlists, personal diary notes, diagnostic declarations, prescription instructions.

### FLASH (Essentials Advisor)

- **Allowed Context:** Sanitized product query, budget constraints, material preferences (e.g. organic cotton, biodegradable), product category.
- **Restricted Context:** Menstrual cycle history, period start/end dates, symptoms history, fertility window estimates, diagnosed medical conditions, health chat transcripts.

### INSTINCT (Entertainment Advisor)

- **Allowed Context:** Sanitized media query, taste preferences, streaming subscriptions, language preference, content maturity filters.
- **Restricted Context:** Menstrual history, medical records, symptom diary, pregnancy tracking, shopping preferences, health chat transcripts.

---

## 3. Communication Contracts

### Agent Request Schema (`createAgentRequest`)

```javascript
{
  requestId: string,          // e.g. "req_1729768000_abc12"
  agentId: "eeve" | "flash" | "instinct",
  intent: string,             // Validated intent identifier
  sanitizedQuery: string,     // Max 500 characters, whitespace-trimmed
  locale: string,             // BCP 47 language code (e.g. "en", "hi", "ta")
  allowedContext: object,     // Guaranteed clean of restricted keys
  timestamp: string           // ISO-8601 string
}
```

### Agent Result Schema (`createAgentResult`)

```javascript
{
  agentId: "eeve" | "flash" | "instinct",
  status: "success" | "partial" | "error",
  success: boolean,
  data: Array<object>,        // Typed product, media, or guideline records
  text: string,               // Human-readable specialist response
  cards: Array<object>,       // Renderable visual components
  sources: Array<string>,     // Verified clinical or market references
  warnings: Array<string>,    // Safeguards or operational notes
  attribution: string,        // e.g. "FLASH Essentials AI"
  latencyMs: number,
  errorCode: string | null,
  timestamp: string
}
```
