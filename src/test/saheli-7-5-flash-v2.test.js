import { describe, it, expect, beforeEach } from "vitest";
import { VERIFIED_PRODUCTS, PRODUCT_CATEGORIES, getProductById } from "@/content/products.js";
import {
  normalizeProduct,
  validateProduct,
  LocalCatalogueMarketProvider,
  MarketService,
  marketCache,
} from "@/lib/marketProvider.js";
import {
  extractFeatures,
  predictRelevance,
  trainAndEvaluateModel,
  SYNTHETIC_SCENARIOS,
  TRAINED_MODEL_WEIGHTS,
} from "@/lib/flashML.js";
import {
  getFlashRecommendations,
  compareProducts,
  recordRecommendationFeedback,
  loadFlashState,
  clearFlashData,
  exportSavedBagSummary,
} from "@/lib/flashRecommender.js";

describe("Saheli 7.5 — FLASH 2.0 Personal Essentials Ecosystem", () => {
  beforeEach(() => {
    clearFlashData();
    marketCache.clear();
  });

  describe("1. Expanded Product Catalogue V2 Integrity", () => {
    it("contains at least 22 verified non-prescription products across categories", () => {
      expect(VERIFIED_PRODUCTS.length).toBeGreaterThanOrEqual(22);

      const activeCategories = new Set(VERIFIED_PRODUCTS.map((p) => p.category));
      expect(activeCategories.has("disposable_pads")).toBe(true);
      expect(activeCategories.has("reusable_pads")).toBe(true);
      expect(activeCategories.has("menstrual_cups")).toBe(true);
      expect(activeCategories.has("period_underwear")).toBe(true);
      expect(activeCategories.has("warm_compress")).toBe(true);
      expect(activeCategories.has("pouches_storage")).toBe(true);
      expect(activeCategories.has("water_bottles")).toBe(true);
      expect(activeCategories.has("exercise_mats")).toBe(true);
      expect(activeCategories.has("general_hygiene")).toBe(true);
    });

    it("every product fulfills mandatory schema fields and safety rules", () => {
      for (const prod of VERIFIED_PRODUCTS) {
        expect(prod.productId).toBeDefined();
        expect(prod.id).toBeDefined();
        expect(prod.name).toBeDefined();
        expect(prod.brand).toBeDefined();
        expect(prod.category).toBeDefined();
        expect(typeof prod.unitPrice).toBe("number");
        expect(prod.unitPrice).toBeGreaterThan(0);
        expect(prod.currency).toBe("INR");
        expect(typeof prod.reusable).toBe("boolean");
        expect(prod.safetyInformation).toBeDefined();
        expect(prod.careInstructions).toBeDefined();
        expect(prod.qualityEvidence || prod.certificationEvidence).toBeDefined();
        expect(prod.contraindicationNotes || prod.limitations).toBeDefined();
        expect(prod.priceTimestamp || prod.lastPriceCheck).toBeDefined();
        expect(prod.reviewStatus).toBe("verified_safe_non_prescription");

        // Ethical safeguard: zero prescription pharmaceuticals
        const combined =
          `${prod.name} ${prod.description || ""} ${prod.materials?.join(" ")}`.toLowerCase();
        expect(combined).not.toContain("steroid");
        expect(combined).not.toContain("contraceptive pill");
        expect(combined).not.toContain("antibiotic");
        expect(combined).not.toContain("tranexamic");
      }
    });

    it("retrieves products correctly by productId or id alias", () => {
      const p1 = getProductById("suvidha_oxobio_pads");
      expect(p1).toBeDefined();
      expect(p1.unitPrice).toBe(4.0);

      const p2 = getProductById("healthfab_gopadfree_underwear");
      expect(p2).toBeDefined();
      expect(p2.reusable).toBe(true);

      expect(getProductById("unknown_fake_id")).toBeUndefined();
    });
  });

  describe("2. Market Provider Adapter Layer & Safety Validation", () => {
    it("normalizes product objects with complete fallback defaults", () => {
      const raw = {
        id: "test_pouch",
        name: "Test Cotton Pouch",
        price: 150,
        reusable: true,
        material: "Organic cotton",
      };
      const normalized = normalizeProduct(raw);
      expect(normalized.productId).toBe("test_pouch");
      expect(normalized.unitPrice).toBe(150);
      expect(normalized.currency).toBe("INR");
      expect(normalized.reusable).toBe(true);
      expect(normalized.pricePerUnit).toBe("₹150.00 / item");
      expect(normalized.verificationStatus).toBe("verified_current");
    });

    it("validateProduct accepts valid non-prescription items and rejects unsafe entries", () => {
      const safeProduct = VERIFIED_PRODUCTS[0];
      expect(validateProduct(safeProduct).valid).toBe(true);

      const unsafeProduct1 = {
        productId: "bad_pill",
        name: "Emergency Contraceptive Pill",
        unitPrice: 100,
        reviewStatus: "verified_safe_non_prescription",
      };
      expect(validateProduct(unsafeProduct1).valid).toBe(false);

      const unsafeProduct2 = {
        productId: "bad_steroid",
        name: "Hydrocortisone Steroid Cream",
        unitPrice: 120,
        reviewStatus: "verified_safe_non_prescription",
      };
      expect(validateProduct(unsafeProduct2).valid).toBe(false);
    });

    it("MarketService falls back gracefully to local verified catalogue in offline mode", async () => {
      const service = new MarketService();
      service.setOfflineMode(true);

      const results = await service.searchProducts("pads", { category: "disposable_pads" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((p) => p.category === "disposable_pads")).toBe(true);

      const price = await service.getCurrentPrice("suvidha_oxobio_pads");
      expect(price).toBeDefined();
      expect(price.unitPrice).toBe(4.0);
      expect(price.source).toBe("local_verified_catalogue");
    });
  });

  describe("3. Machine Learning Training & Evaluation Pipeline", () => {
    it("extractFeatures returns normalized 7-dimensional feature vectors", () => {
      const product = VERIFIED_PRODUCTS.find((p) => p.productId === "suvidha_oxobio_pads");
      const criteria = {
        category: "disposable_pads",
        maxBudget: 50,
        preferReusable: false,
        sensitiveSkin: false,
      };
      const feats = extractFeatures(product, criteria);

      expect(feats.categoryMatch).toBe(1.0);
      expect(feats.budgetAffordability).toBe(1.0);
      expect(feats.reusableAlignment).toBe(1.0);
      expect(typeof feats.materialGentleness).toBe("number");
      expect(typeof feats.longevityEcoScore).toBe("number");
      expect(feats.verificationFreshness).toBe(1.0);
    });

    it("predictRelevance computes bounded continuous relevance scores (0 to 100)", () => {
      const feats = {
        categoryMatch: 1.0,
        budgetAffordability: 1.0,
        reusableAlignment: 1.0,
        materialGentleness: 0.9,
        conveniencePortability: 0.8,
        longevityEcoScore: 0.5,
        verificationFreshness: 1.0,
      };
      const score = predictRelevance(feats, TRAINED_MODEL_WEIGHTS);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("trainAndEvaluateModel runs full supervised ranking pipeline and measures held-out metrics", () => {
      expect(SYNTHETIC_SCENARIOS.length).toBe(60);
      const evalResult = trainAndEvaluateModel(
        VERIFIED_PRODUCTS,
        SYNTHETIC_SCENARIOS,
        0.7,
        40,
        0.05,
      );

      expect(evalResult.metrics.trainScenarioCount).toBe(42);
      expect(evalResult.metrics.testScenarioCount).toBe(18);

      // Verifying actual held-out test benchmarks
      expect(evalResult.metrics.ndcgAt3).toBeGreaterThan(0.65);
      expect(evalResult.metrics.ndcgAt5).toBeGreaterThan(0.7);
      expect(evalResult.metrics.precisionAt1).toBeGreaterThan(0.5);
      expect(evalResult.metrics.meanReciprocalRank).toBeGreaterThan(0.6);
    });
  });

  describe("4. 6-Stage FLASH 2.0 Recommender & Multi-Criteria Sorting", () => {
    it("produces transparent explanation reasons, trade-offs, and scores", () => {
      const criteria = {
        category: "warm_compress",
        maxBudget: 350,
        preferReusable: true,
      };
      const recs = getFlashRecommendations(criteria, VERIFIED_PRODUCTS);

      expect(recs.length).toBeGreaterThan(0);
      const top = recs[0];
      expect(top.score).toBeGreaterThan(0);
      expect(top.reasons).toContain("flash.reason.catMatch");
      expect(top.reasons).toContain("flash.reason.budgetFit");
      expect(top.reasons).toContain("flash.reason.reusableMatch");
      expect(top.product.category).toBe("warm_compress");
    });

    it("sorts recommendations by price: low to high when requested", () => {
      const criteria = { category: "all", maxBudget: 1000 };
      const recs = getFlashRecommendations(criteria, VERIFIED_PRODUCTS, {
        sortBy: "price_low_high",
      });

      expect(recs.length).toBeGreaterThan(1);
      for (let i = 0; i < recs.length - 1; i++) {
        expect(recs[i].product.unitPrice).toBeLessThanOrEqual(recs[i + 1].product.unitPrice);
      }
    });

    it("sorts recommendations by price: high to low when requested", () => {
      const criteria = { category: "all", maxBudget: 1000 };
      const recs = getFlashRecommendations(criteria, VERIFIED_PRODUCTS, {
        sortBy: "price_high_low",
      });

      expect(recs.length).toBeGreaterThan(1);
      for (let i = 0; i < recs.length - 1; i++) {
        expect(recs[i].product.unitPrice).toBeGreaterThanOrEqual(recs[i + 1].product.unitPrice);
      }
    });

    it("Anonymous / General Safe mode works with zero personalization", () => {
      const recs = getFlashRecommendations({ personalisationEnabled: false }, VERIFIED_PRODUCTS, {
        sortBy: "relevance",
      });

      expect(recs.length).toBe(VERIFIED_PRODUCTS.length);
      expect(recs[0].reasons).toContain("flash.reason.generalSafe");
    });
  });

  describe("5. Side-by-Side Comparison & Bag Portability", () => {
    it("compares two products accurately across all essential attributes", () => {
      const prodA = getProductById("suvidha_oxobio_pads");
      const prodB = getProductById("ecofemme_day_pad");

      const comparison = compareProducts(prodA, prodB);
      expect(comparison).toBeDefined();
      expect(comparison.cheaperId).toBe("suvidha_oxobio_pads");
      expect(comparison.priceDifference).toBe(281.0);
      expect(comparison.attributes.length).toBeGreaterThanOrEqual(6);
    });

    it("records local private user feedback without remote transmission", () => {
      const feedback = recordRecommendationFeedback("suvidha_oxobio_pads", true, "Great value");
      expect(feedback.helpful).toBe(true);
      expect(feedback.timestamp).toBeDefined();

      const state = loadFlashState();
      expect(state.feedback["suvidha_oxobio_pads"]?.helpful).toBe(true);
    });

    it("exports saved bag items into formatted shareable text summary", () => {
      const summary = exportSavedBagSummary(
        ["suvidha_oxobio_pads", "boondh_cup_regular"],
        VERIFIED_PRODUCTS,
      );

      expect(summary).toContain("SAHELI FLASH 2.0");
      expect(summary).toContain("Suvidha");
      expect(summary).toContain("Boondh");
      expect(summary).toContain("Total Estimated Initial Outlay: ₹379.00");
    });
  });
});
