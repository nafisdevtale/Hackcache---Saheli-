# SAHELI 7.5 — Market Provider Adapter Architecture

**Date:** 2026-10-24  
**Module:** `src/lib/marketProvider.js`  
**Status:** Implemented & Verified

---

## 1. Overview & Architectural Philosophy

Saheli's FLASH essentials system requires accurate, current product information without violating commercial terms or leaking user privacy. The **Market Provider Adapter Layer** establishes a clean, provider-neutral abstraction between the recommendation engine, user interface, and market data sources.

### Core Architectural Principles

1. **Local-First Privacy & Zero Telemetry:** Product requests never include user cycle history, symptoms, age, or medical profiles. Queries are strictly anonymous product searches or ID lookups.
2. **Provider Agnosticism:** The application interacts with market data through a standard adapter interface (`searchProducts`, `getProduct`, `getCurrentPrice`, `getAvailability`).
3. **Deterministic Verification & Safety Guardrails:** Every raw product record passes through `normalizeProduct()` and `validateProduct()`. Items failing clinical non-prescription safety checks are unconditionally dropped before reaching ranking or UI layers.
4. **Resilient Offline Architecture:** If any remote or third-party endpoint encounters network unavailability, timeout, or rate-limiting, the system gracefully falls back to the local verified 22-item catalogue (`LocalCatalogueMarketProvider`) without UI disruption.

---

## 2. Component Structure

```
+-------------------------------------------------------------+
|                  FLASH UI (FlashEssentials)                 |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|       FLASH Recommender V2 (getFlashRecommendations)       |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|            MarketService (Orchestrator & Router)            |
|  - In-memory / localStorage Cache with TTL (24h default)   |
|  - Rate-Limiter (Max 30 req/min)                            |
|  - Offline Mode Detection & Auto-Fallback                  |
+-------------------------------------------------------------+
           |                                       |
    [Live Mode / API]                       [Offline / Fail]
           |                                       |
           v                                       v
+---------------------+                 +---------------------+
| HttpMarketProvider  |                 | LocalCatalogue-     |
| (Optional / Mock)   |                 | MarketProvider      |
+---------------------+                 | (Ground Truth 22)   |
           |                            +---------------------+
           |                                       |
           +-------------------+-------------------+
                               |
                               v
               +-------------------------------+
               |    normalizeProduct(raw)      |
               +-------------------------------+
                               |
                               v
               +-------------------------------+
               |    validateProduct(product)   |
               |  (Rejects steroids, hormones,  |
               |   unverified pharmaceuticals) |
               +-------------------------------+
```

---

## 3. Standard Adapter Interface

Any market provider implementation must adhere to the following contract:

```typescript
interface MarketProvider {
  name: string;
  searchProducts(query: string, filters: ProductFilters): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  getCurrentPrice(productId: string): Promise<PriceRecord | null>;
  getAvailability(productId: string): Promise<AvailabilityRecord | null>;
}
```

### Safety Blacklist

`validateProduct()` scans product name, description, and materials against prohibited terms:

- Prescription medicines (antibiotics, contraceptive pills, tranexamic acid, mefenamic acid).
- Hormonal agents and steroids.
- Unregulated diet pills or slimming claims.
- Harmful practices (vaginal douching, bleaching).

---

## 4. Cache & Rate-Limiting Policy

- **Storage:** Dual-tier caching (in-memory Map backed by browser `localStorage`).
- **TTL:** 24 hours (`1000 * 60 * 60 * 24` ms). Cache entries are refreshed when expired.
- **Rate Limit:** 30 requests per minute sliding window. Calls exceeding the threshold automatically serve cached or verified local records without network errors.
- **Zero Cost & Free Access:** Conforms to HackCache Problem Statement 5 — no subscription, no paywalls, no affiliate tracking.
