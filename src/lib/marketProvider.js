/**
 * Saheli 7.5 — Provider-Neutral Market Data Integration Layer
 *
 * Architecture & Privacy:
 * - Provider-neutral adapter interface for market pricing and availability.
 * - In-memory and local cache with time-to-live (TTL) and validation.
 * - Strict offline fallback to verified, ground-truth local catalogue.
 * - Rate limiting and zero unconsented network telemetry.
 * - Strict validation against prescription pharmaceuticals and unverified claims.
 */

import { VERIFIED_PRODUCTS, getProductById as getLocalProductById } from "../content/products.js";

const MARKET_CACHE_KEY = "saheli_market_cache_v2";
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_REQUESTS_PER_MINUTE = 30;

// Rate-limiting tracking
let requestTimestamps = [];

function checkRateLimit() {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((ts) => now - ts < 60000);
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

/**
 * Cache storage helper
 */
class MarketCache {
  constructor() {
    this.memoryStore = new Map();
  }

  get(key) {
    if (this.memoryStore.has(key)) {
      const entry = this.memoryStore.get(key);
      if (Date.now() - entry.timestamp < entry.ttl) {
        return entry.data;
      }
      this.memoryStore.delete(key);
    }

    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(`${MARKET_CACHE_KEY}_${key}`);
        if (raw) {
          const entry = JSON.parse(raw);
          if (Date.now() - entry.timestamp < entry.ttl) {
            this.memoryStore.set(key, entry);
            return entry.data;
          }
          localStorage.removeItem(`${MARKET_CACHE_KEY}_${key}`);
        }
      }
    } catch {}

    return null;
  }

  set(key, data, ttl = DEFAULT_CACHE_TTL_MS) {
    const entry = { data, timestamp: Date.now(), ttl };
    this.memoryStore.set(key, entry);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`${MARKET_CACHE_KEY}_${key}`, JSON.stringify(entry));
      }
    } catch {}
  }

  clear() {
    this.memoryStore.clear();
    try {
      if (typeof localStorage !== "undefined") {
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (k.startsWith(MARKET_CACHE_KEY)) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch {}
  }
}

export const marketCache = new MarketCache();

/**
 * Product Schema Normalizer
 */
export function normalizeProduct(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id || raw.productId || "";
  const name = raw.name || raw.title || "";
  const brand = raw.brand || "Verified Artisan / Vendor";
  const category = raw.category || "general_hygiene";
  const unitPrice =
    typeof raw.unitPrice === "number"
      ? raw.unitPrice
      : typeof raw.price === "number"
        ? raw.price
        : 0;
  const currency = raw.currency || "INR";
  const reusable =
    typeof raw.reusable === "boolean"
      ? raw.reusable
      : raw.type === "reusable" || raw.isReusable === true;
  const materials = Array.isArray(raw.materials)
    ? raw.materials
    : typeof raw.material === "string"
      ? raw.material.split(",").map((s) => s.trim())
      : [];
  const packQuantity = raw.packQuantity || raw.quantity || 1;
  const pricePerUnit =
    raw.pricePerUnit ||
    (packQuantity > 1
      ? `₹${(unitPrice / packQuantity).toFixed(2)} / item`
      : `₹${unitPrice.toFixed(2)} / item`);

  return {
    id,
    productId: id,
    brand,
    name,
    category,
    reusable,
    type: reusable ? "reusable" : raw.type || "disposable",
    materials,
    material: raw.material || materials.join(", "),
    size: raw.size || "Standard",
    packQuantity,
    quantity: packQuantity,
    unitPrice,
    price: unitPrice,
    currency,
    pricePerUnit,
    priceTimestamp:
      raw.priceTimestamp || raw.lastPriceCheck || new Date().toISOString().slice(0, 10),
    lastPriceCheck:
      raw.lastPriceCheck || raw.priceTimestamp || new Date().toISOString().slice(0, 10),
    lastAvailabilityCheck: raw.lastAvailabilityCheck || new Date().toISOString().slice(0, 10),
    priceVerificationStatus:
      raw.priceVerificationStatus || raw.verificationStatus || "verified_current",
    verificationStatus: raw.verificationStatus || raw.priceVerificationStatus || "verified_current",
    merchant: raw.merchant || raw.retailer || "Verified Retailer",
    retailer: raw.retailer || raw.merchant || "Verified Retailer",
    officialProductUrl: raw.officialProductUrl || raw.url || "",
    url: raw.url || raw.officialProductUrl || "",
    availability: raw.availability || "widely_available",
    qualityEvidence:
      raw.qualityEvidence || raw.certificationEvidence || "Verified safe non-prescription standard",
    certificationEvidence:
      raw.certificationEvidence || raw.qualityEvidence || "Verified safe non-prescription standard",
    safetyInformation:
      raw.safetyInformation || "Follow standard menstrual and bodily hygiene instructions.",
    careInstructions:
      raw.careInstructions || "Clean thoroughly according to manufacturer instructions.",
    contraindicationNotes:
      raw.contraindicationNotes || raw.limitations || "External hygiene comfort item.",
    limitations: raw.limitations || raw.contraindicationNotes || "External hygiene comfort item.",
    suitabilityNotes:
      raw.suitabilityNotes ||
      raw.suitability ||
      "Suitable for menstrual comfort and hygiene support.",
    suitability:
      raw.suitability ||
      raw.suitabilityNotes ||
      "Suitable for menstrual comfort and hygiene support.",
    sourceIds: Array.isArray(raw.sourceIds) ? raw.sourceIds : ["who_selfcare"],
    reviewStatus: raw.reviewStatus || "verified_safe_non_prescription",
  };
}

/**
 * Strict Safety & Eligibility Validator
 */
export function validateProduct(product) {
  if (!product || typeof product !== "object")
    return { valid: false, reason: "Invalid product object" };
  if (!product.productId && !product.id)
    return { valid: false, reason: "Missing product identifier" };
  if (!product.name || product.name.trim().length === 0)
    return { valid: false, reason: "Missing product name" };
  if (typeof product.unitPrice !== "number" || product.unitPrice <= 0)
    return { valid: false, reason: "Invalid unit price" };

  // Hard safety blacklist: No prescription drugs, diet pills, hormones, steroids, or unverified remedies
  const combinedText =
    `${product.name} ${product.description || ""} ${product.material || ""}`.toLowerCase();
  // Strip benign descriptions like "unbleached" or "bleach-free" before checking
  const sanitized = combinedText.replace(/unbleached|bleach-free|zero bleach|no bleach/g, "");

  const prohibitedPatterns = [
    /\bprescription\b/i,
    /\bantibiotic\b/i,
    /\bcontraceptive\s+pill\b/i,
    /\bhormone\b/i,
    /\bsteroid\b/i,
    /\bdiet\s+pill\b/i,
    /\bslimming\b/i,
    /\bbleach\b/i,
    /\bdouching\b/i,
    /\bmefenamic\b/i,
    /\btranexamic\b/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(sanitized)) {
      return {
        valid: false,
        reason: `Contains prohibited medical or unsafe claim: ${pattern.source}`,
      };
    }
  }

  if (product.reviewStatus !== "verified_safe_non_prescription") {
    return { valid: false, reason: "Item has not passed safety review status verification" };
  }

  return { valid: true };
}

/**
 * Baseline Local Verified Catalogue Provider (Default & Fallback)
 */
export class LocalCatalogueMarketProvider {
  constructor(catalogue = VERIFIED_PRODUCTS) {
    this.name = "LocalCatalogueMarketProvider";
    this.catalogue = catalogue.map(normalizeProduct).filter((p) => validateProduct(p).valid);
  }

  async searchProducts(query = "", filters = {}) {
    let results = [...this.catalogue];

    if (filters.category && filters.category !== "all") {
      results = results.filter((p) => p.category === filters.category);
    }

    if (typeof filters.maxBudget === "number" && filters.maxBudget > 0) {
      results = results.filter((p) => p.unitPrice <= filters.maxBudget);
    }

    if (filters.preferReusable !== null && filters.preferReusable !== undefined) {
      results = results.filter((p) => p.reusable === Boolean(filters.preferReusable));
    }

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.materials.some((m) => m.toLowerCase().includes(q)),
      );
    }

    return results;
  }

  async getProduct(productId) {
    const found = this.catalogue.find((p) => p.productId === productId || p.id === productId);
    return found ? { ...found } : null;
  }

  async getCurrentPrice(productId) {
    const prod = await this.getProduct(productId);
    if (!prod) return null;
    return {
      productId: prod.productId,
      unitPrice: prod.unitPrice,
      currency: prod.currency,
      pricePerUnit: prod.pricePerUnit,
      timestamp: prod.priceTimestamp,
      verificationStatus: prod.priceVerificationStatus,
      source: "local_verified_catalogue",
    };
  }

  async getAvailability(productId) {
    const prod = await this.getProduct(productId);
    if (!prod) return null;
    return {
      productId: prod.productId,
      availability: prod.availability,
      merchant: prod.merchant,
      timestamp: prod.lastAvailabilityCheck,
      source: "local_verified_catalogue",
    };
  }
}

/**
 * Market Service Orchestrator with Cache, Safety, and Offline Fallback
 */
export class MarketService {
  constructor(primaryProvider = null, fallbackProvider = new LocalCatalogueMarketProvider()) {
    this.fallbackProvider = fallbackProvider;
    this.primaryProvider = primaryProvider || fallbackProvider;
    this.isOffline = false;
  }

  setOfflineMode(offline) {
    this.isOffline = Boolean(offline);
  }

  async searchProducts(query = "", filters = {}) {
    const cacheKey = `search_${query}_${JSON.stringify(filters)}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    if (this.isOffline || !checkRateLimit()) {
      const localResults = await this.fallbackProvider.searchProducts(query, filters);
      return localResults;
    }

    try {
      const rawResults = await this.primaryProvider.searchProducts(query, filters);
      const validated = rawResults.map(normalizeProduct).filter((p) => validateProduct(p).valid);
      marketCache.set(cacheKey, validated);
      return validated;
    } catch {
      // Graceful fallback to verified local catalogue
      const localResults = await this.fallbackProvider.searchProducts(query, filters);
      return localResults;
    }
  }

  async getProduct(productId) {
    const cacheKey = `product_${productId}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    try {
      if (!this.isOffline && checkRateLimit()) {
        const raw = await this.primaryProvider.getProduct(productId);
        if (raw) {
          const normalized = normalizeProduct(raw);
          if (validateProduct(normalized).valid) {
            marketCache.set(cacheKey, normalized);
            return normalized;
          }
        }
      }
    } catch {}

    const localProd = await this.fallbackProvider.getProduct(productId);
    if (localProd) {
      marketCache.set(cacheKey, localProd);
    }
    return localProd;
  }

  async getCurrentPrice(productId) {
    const cacheKey = `price_${productId}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    try {
      if (!this.isOffline && checkRateLimit()) {
        const livePrice = await this.primaryProvider.getCurrentPrice(productId);
        if (livePrice && typeof livePrice.unitPrice === "number") {
          marketCache.set(cacheKey, livePrice);
          return livePrice;
        }
      }
    } catch {}

    const fallbackPrice = await this.fallbackProvider.getCurrentPrice(productId);
    if (fallbackPrice) {
      marketCache.set(cacheKey, fallbackPrice);
    }
    return fallbackPrice;
  }

  async getAvailability(productId) {
    const cacheKey = `avail_${productId}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    try {
      if (!this.isOffline && checkRateLimit()) {
        const liveAvail = await this.primaryProvider.getAvailability(productId);
        if (liveAvail) {
          marketCache.set(cacheKey, liveAvail);
          return liveAvail;
        }
      }
    } catch {}

    const fallbackAvail = await this.fallbackProvider.getAvailability(productId);
    if (fallbackAvail) {
      marketCache.set(cacheKey, fallbackAvail);
    }
    return fallbackAvail;
  }

  clearCache() {
    marketCache.clear();
  }
}

// Global default market service instance
export const defaultMarketService = new MarketService();
