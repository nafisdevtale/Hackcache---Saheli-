# SAHELI 8.0 — DIVA MULTI-AGENT ORCHESTRATOR ARCHITECTURE

## Dynamic Intelligent Virtual Assistant (Diva)

**Project:** Saheli — Your Cycle, Your Rhythm  
**Version:** Saheli 8.0  
**Tagline:** One conversation. Three specialists.  
**Baseline:** Saheli 7.6 (INSTINCT AI)

---

## 1. Executive Summary

Saheli 8.0 introduces **DIVA (Dynamic Intelligent Virtual Assistant)**, a centralized multi-agent orchestrator connecting three decoupled AI domain specialists:

- **EEVE — Saheli's Health AI Companion** (menstrual health education, symptom guidance, cycle explanation, red-flag triage).
- **FLASH — Personal Essentials Advisor** (non-prescription menstrual-care and personal comfort product discovery, comparisons, and unit costs).
- **INSTINCT — Personal Entertainment Advisor** (movies, television series, K-dramas, music discovery, and cultural entertainment recommendations).

Users interact with one unified, friendly interface at `/diva` without needing to jump between separate pages, while Diva transparently identifies intents, coordinates execution, and enforces an inviolable Privacy Firewall.

---

## 2. Architectural Blueprint

```
                      +-----------------------------+
                      |       User Interface        |
                      |   /diva (Diva Coordinator)   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    DIVA Intelligent Router  |
                      |  - L1: Deterministic Regex  |
                      |  - L2: Context Follow-Up    |
                      |  - L3: Gemini LLM Fallback  |
                      |  - L4: User Clarification   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |       Privacy Firewall      |
                      | Zero cross-specialist leaks |
                      | Strip all cycle/health data |
                      | from FLASH and INSTINCT req |
                      +--------------+--------------+
                                     |
                 +-------------------+-------------------+
                 | (Max 2 concurrent agents per turn)   |
                 v                   v                   v
        +-----------------+ +-----------------+ +-----------------+
        |      EEVE       | |      FLASH      | |    INSTINCT     |
        | Health AI       | | Essentials AI   | | Culture AI      |
        | - /api/ask      | | - Market DB     | | - /api/instinct |
        | - Offline FAQ   | | - Unit Costs    | | - Offline Cat   |
        +--------+--------+ +--------+--------+ +--------+--------+
                 |                   |                   |
                 +-------------------+-------------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Multi-Agent Collector    |
                      |  - Promise.allSettled       |
                      |  - Partial failure shield   |
                      |  - Attribution Badging      |
                      |  - Unified Response Stream  |
                      +-----------------------------+
```

---

## 3. Four-Level Hybrid Routing Engine

| Level       | Routing Mechanism               | Latency      | Network Needed? | Description                                                                                                                               |
| :---------- | :------------------------------ | :----------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Level 1** | **Deterministic Token Scoring** | `< 2 ms`     | No (Offline)    | Comprehensive regex and token dictionary matching across health, essentials, and entertainment. Includes dual-intent composite detection. |
| **Level 2** | **Context-Aware Follow-Up**     | `< 3 ms`     | No (Offline)    | Dispatches short conversational follow-ups (e.g. _"Can you show me more like the second one?"_) to the preceding specialist.              |
| **Level 3** | **Gemini Structured Router**    | `300–700 ms` | Yes (Online)    | Lightweight Gemini prompt at `POST /api/diva/route` classifying complex or ambiguous natural language queries.                            |
| **Level 4** | **Clarification Fallback**      | `< 2 ms`     | No (Offline)    | Prompts the user with one-click specialist buttons when intent cannot be safely disambiguated.                                            |

---

## 4. Multi-Agent Bounded Execution

To safeguard device performance, responsiveness, and battery life on shared family mobile phones:

1. **Strict Concurrency Cap:** At most **two** specialist agents may be invoked for a single user turn (`route.agents.slice(0, 2)`).
2. **Parallel Dispatch:** Dual-agent queries are fired simultaneously with `Promise.allSettled`.
3. **Independent Timeouts:** Eeve (7000ms), FLASH (5000ms), and INSTINCT (5000ms) operate with independent `AbortController` timers.
4. **Partial Failure Resilience:** If one agent times out or errors, the successful agent's response is presented with a non-blocking notification rather than failing the entire request.
5. **Attribution & Transparency:** Responses clearly identify which specialist produced each insight, recommendation, or card.

---

## 5. Offline Deterministic Fallbacks

When device connectivity is interrupted:

- **Eeve:** Matches queries against Saheli's embedded WHO/NHS/FOGSI-aligned medical FAQ catalogue.
- **FLASH:** Ranks products from the verified on-device BIS/FDA/ISO essentials registry.
- **INSTINCT:** Filters and serves titles from the verified on-device entertainment catalogue.
