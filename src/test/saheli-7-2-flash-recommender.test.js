import { describe, it, expect } from "vitest";
import { VERIFIED_PRODUCTS, PRODUCT_CATEGORIES, getProductById } from "@/content/products.js";
import { getFlashRecommendations, compareProducts } from "@/lib/flashRecommender.js";

describe("Saheli 7.2 — FLASH Essentials Recommender Engine", () => {
  describe("Catalogue Integrity & Safety Governance", () => {
    it("catalogue contains verified non-prescription essentials only", () => {
      expect(VERIFIED_PRODUCTS.length).toBeGreaterThanOrEqual(10);

      // Verify strict non-prescription, non-medicalization boundary
      for (const prod of VERIFIED_PRODUCTS) {
        expect(prod.productId).toBeDefined();
        expect(prod.name).toBeDefined();
        expect(prod.category).toBeDefined();
        expect(typeof prod.unitPrice).toBe("number");
        expect(prod.unitPrice).toBeGreaterThan(0);
        expect(prod.currency).toBe("INR");
        expect(typeof prod.reusable).toBe("boolean");
        expect(prod.safetyInformation).toBeDefined();
        expect(prod.sourceIds.length).toBeGreaterThan(0);
        expect(prod.reviewStatus).toBe("verified_safe_non_prescription");

        // Ethical safeguard: No prescription drugs, diet pills, or hormone blockers
        const lowerName = prod.name.toLowerCase();
        const lowerDesc = prod.description.toLowerCase();
        expect(lowerName).not.toContain("pill");
        expect(lowerName).not.toContain("antibiotic");
        expect(lowerName).not.toContain("hormone");
        expect(lowerName).not.toContain("steroid");
        expect(lowerDesc).not.toContain("prescription");
      }
    });

    it("all defined product categories are represented in the catalogue", () => {
      const activeCategories = new Set(VERIFIED_PRODUCTS.map((p) => p.category));
      // Exclude 'all' meta-category
      const nonAllCategories = PRODUCT_CATEGORIES.filter((c) => c.id !== "all");
      for (const cat of nonAllCategories) {
        expect(activeCategories.has(cat.id)).toBe(true);
      }
    });

    it("retrieves products by id correctly", () => {
      const pad = getProductById("suvidha_oxobio_pads");
      expect(pad).toBeDefined();
      expect(pad.reusable).toBe(false);

      const cup = getProductById("boondh_cup_regular");
      expect(cup).toBeDefined();
      expect(cup.reusable).toBe(true);
      expect(cup.category).toBe("menstrual_cups");

      expect(getProductById("non_existent_id")).toBeUndefined();
    });
  });

  describe("Deterministic Scoring & Preferences", () => {
    it("produces identical recommendation ranks for identical inputs (deterministic)", () => {
      const userPrefs = {
        maxBudget: 300,
        preferReusable: null,
        category: "all",
        sensitiveSkin: true,
      };

      const run1 = getFlashRecommendations(userPrefs);
      const run2 = getFlashRecommendations(userPrefs);

      expect(run1.map((p) => p.product.productId)).toEqual(run2.map((p) => p.product.productId));
      expect(run1.map((p) => p.score)).toEqual(run2.map((p) => p.score));
    });

    it("respects category filtering by returning matching products", () => {
      const recs = getFlashRecommendations({
        category: "menstrual_cups",
        maxBudget: 500,
      });

      expect(recs.length).toBeGreaterThan(0);
      for (const r of recs) {
        expect(r.product.category).toBe("menstrual_cups");
        expect(r.reasons).toContain("flash.reason.catMatch");
      }
    });

    it("recommends reusable products higher when preferReusable is true", () => {
      const recs = getFlashRecommendations({
        preferReusable: true,
        category: "all",
      });

      // Top recommendations should be reusable
      expect(recs[0].product.reusable).toBe(true);
      expect(recs[0].reasons).toContain("flash.reason.reusableMatch");
    });

    it("recommends disposable products higher when preferReusable is false", () => {
      const recs = getFlashRecommendations({
        preferReusable: false,
        category: "all",
      });

      expect(recs[0].product.reusable).toBe(false);
      expect(recs[0].reasons).toContain("flash.reason.disposableMatch");
    });

    it("penalizes products exceeding target budget and discloses budget trade-off", () => {
      const lowBudget = 10;
      const recs = getFlashRecommendations({
        maxBudget: lowBudget,
      });

      const expensiveItem = recs.find((r) => r.product.unitPrice > lowBudget);
      expect(expensiveItem).toBeDefined();
      expect(expensiveItem.tradeOffs).toContain("flash.tradeoff.overBudget");
    });

    it("elevates sensitive-skin friendly products when sensitiveSkin is true", () => {
      const recs = getFlashRecommendations({
        sensitiveSkin: true,
      });

      const topItem = recs[0];
      expect(topItem.reasons).toContain("flash.reason.sensitiveFriendly");
    });
  });

  describe("Explainability & Trade-offs", () => {
    it("generates honest, balanced trade-offs for reusable items", () => {
      const recs = getFlashRecommendations();
      const reusable = recs.find((r) => r.product.reusable);
      expect(reusable.tradeOffs).toContain("flash.tradeoff.reusableMaintenance");
    });

    it("generates clear reasons for recommendations", () => {
      const recs = getFlashRecommendations({
        category: "reusable_pads",
        maxBudget: 400,
        preferReusable: true,
      });

      const top = recs[0];
      expect(top.reasons.length).toBeGreaterThanOrEqual(2);
      expect(top.reasons).toContain("flash.reason.catMatch");
      expect(top.reasons).toContain("flash.reason.budgetFit");
    });
  });

  describe("Side-by-Side Comparison Engine", () => {
    it("compares two products cleanly across dimensions", () => {
      const pad = getProductById("suvidha_oxobio_pads");
      const cup = getProductById("boondh_cup_regular");

      const comparison = compareProducts(pad, cup);
      expect(comparison).toBeDefined();
      expect(comparison.prodA.productId).toBe(pad.productId);
      expect(comparison.prodB.productId).toBe(cup.productId);
      expect(comparison.cheaperId).toBe(pad.productId);
      expect(comparison.priceDifference).toBe(Math.abs(pad.unitPrice - cup.unitPrice));

      expect(comparison.attributes.length).toBeGreaterThanOrEqual(5);
    });

    it("handles missing product comparison safely", () => {
      expect(compareProducts(null, null)).toBeNull();
      const pad = getProductById("suvidha_oxobio_pads");
      expect(compareProducts(pad, null)).toBeNull();
    });
  });
});
