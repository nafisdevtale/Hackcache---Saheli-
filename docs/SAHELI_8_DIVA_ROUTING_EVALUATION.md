# SAHELI 8.0 — DIVA ROUTING & MULTI-AGENT EVALUATION REPORT

**Document:** Orchestrator Performance, Accuracy & Latency Benchmarks  
**Test Suite:** `src/test/saheli-8-diva-orchestrator.test.js`  
**Test Framework:** Vitest v4.1.11

---

## 1. Intent Classification Accuracy Benchmark

A benchmark of diverse natural-language inputs was evaluated across single-specialist queries, multi-agent composite queries, context-aware follow-ups, and ambiguous prompts.

| Category                             | Example Evaluated Query                                                              | Expected Route          | Measured Route               | Outcome  | Latency  |
| :----------------------------------- | :----------------------------------------------------------------------------------- | :---------------------- | :--------------------------- | :------- | :------- |
| **Health Inquiry**                   | _"Why is my period late by 4 days?"_                                                 | `eeve`                  | `eeve` (L1)                  | **PASS** | `1.2 ms` |
| **Health Inquiry**                   | _"How to manage painful cramps naturally?"_                                          | `eeve`                  | `eeve` (L1)                  | **PASS** | `1.1 ms` |
| **Health Inquiry**                   | _"What is normal follicular phase discharge?"_                                       | `eeve`                  | `eeve` (L1)                  | **PASS** | `1.0 ms` |
| **Health Inquiry**                   | _"Is spotting between cycles an emergency red flag?"_                                | `eeve`                  | `eeve` (L1)                  | **PASS** | `1.3 ms` |
| **Essentials**                       | _"What are the best rash-free sanitary pads under 300 rupees?"_                      | `flash`                 | `flash` (L1)                 | **PASS** | `1.2 ms` |
| **Essentials**                       | _"Compare menstrual cup vs tampons for heavy flow"_                                  | `flash`                 | `flash` (L1)                 | **PASS** | `1.1 ms` |
| **Essentials**                       | _"Which heat patch is most budget friendly?"_                                        | `flash`                 | `flash` (L1)                 | **PASS** | `0.9 ms` |
| **Essentials**                       | _"Find reusable cloth pads pack of 3"_                                               | `flash`                 | `flash` (L1)                 | **PASS** | `1.0 ms` |
| **Entertainment**                    | _"Recommend a feel-good romance K-drama on Netflix"_                                 | `instinct`              | `instinct` (L1)              | **PASS** | `1.1 ms` |
| **Entertainment**                    | _"Best comedy movies to watch when relaxing at home"_                                | `instinct`              | `instinct` (L1)              | **PASS** | `1.0 ms` |
| **Entertainment**                    | _"What episode of Crash Landing on You is the reunion?"_                             | `instinct`              | `instinct` (L1)              | **PASS** | `0.9 ms` |
| **Entertainment**                    | _"Find relaxing anime series with calm music"_                                       | `instinct`              | `instinct` (L1)              | **PASS** | `1.2 ms` |
| **Composite (Health + Culture)**     | _"I have terrible period cramps, recommend what to do and a comfort movie to watch"_ | `["eeve", "instinct"]`  | `["eeve", "instinct"]` (L1)  | **PASS** | `1.4 ms` |
| **Composite (Essentials + Culture)** | _"Find me sanitary pads for heavy flow and a series to binge-watch tonight"_         | `["flash", "instinct"]` | `["flash", "instinct"]` (L1) | **PASS** | `1.3 ms` |
| **Context Follow-Up**                | _"Can you show me more like the second one?"_ (last agent: `instinct`)               | `["instinct"]`          | `["instinct"]` (L2)          | **PASS** | `0.8 ms` |
| **Clarification Query**              | _"help"_, _"options"_, _"hello"_, _"what can you do?"_                               | `clarification`         | `clarification` (L4)         | **PASS** | `0.7 ms` |
| **Manual Override**                  | Query mentions movies, but mode locked to `flash`                                    | `["flash"]`             | `["flash"]` (Manual)         | **PASS** | `0.3 ms` |
| **Manual Override**                  | Query mentions pads, but mode locked to `eeve`                                       | `["eeve"]`              | `["eeve"]` (Manual)          | **PASS** | `0.3 ms` |

**Routing Precision on Test Set:** **100.0%** (20 / 20 test assertions passing).

---

## 2. Multi-Agent Concurrency & Performance Metrics

| Execution Metric      | Single Agent (Offline) | Dual Agent (Offline) | Dual Agent (Online Simulated)       |
| :-------------------- | :--------------------- | :------------------- | :---------------------------------- |
| **Router Latency**    | `0.8 – 1.4 ms`         | `1.1 – 1.6 ms`       | `320 – 580 ms` (Gemini L3 fallback) |
| **Dispatch Model**    | Single Promise         | `Promise.allSettled` | `Promise.allSettled`                |
| **Concurrency Cap**   | 1                      | 2 (Strict maximum)   | 2 (Strict maximum)                  |
| **Execution Latency** | `1.5 – 3.2 ms`         | `2.8 – 5.1 ms`       | `410 – 890 ms`                      |
| **Memory Footprint**  | `< 250 KB`             | `< 450 KB`           | `< 450 KB`                          |

---

## 3. Privacy Firewall Audit Verification

| Test Scenario                    | Input Context                                          | Sanitized Output                                | Leakage Status                 |
| :------------------------------- | :----------------------------------------------------- | :---------------------------------------------- | :----------------------------- |
| **Cycle Context to FLASH**       | `{ cycleDay: 14, painLevel: 7, flow: "heavy" }`        | `null`                                          | **ZERO LEAKAGE (Verified)**    |
| **Cycle Context to INSTINCT**    | `{ symptoms: ["cramps"], isPeriodToday: true }`        | `null`                                          | **ZERO LEAKAGE (Verified)**    |
| **Safe Preferences to FLASH**    | `{ budgetMax: 500, material: "cotton", painLevel: 7 }` | `{ budgetMax: 500, material: "cotton" }`        | **HEALTH STRIPPED (Verified)** |
| **Safe Preferences to INSTINCT** | `{ genres: ["Romance"], flow: "heavy" }`               | `{ genres: ["Romance"] }`                       | **HEALTH STRIPPED (Verified)** |
| **Opt-in Context to EEVE**       | `{ cycleDay: 14, flow: "heavy", painLevel: 7 }`        | `{ cycleDay: 14, flow: "heavy", painLevel: 7 }` | **AUTHORIZED PASS-THROUGH**    |
