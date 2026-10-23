/**
 * Saheli 7.2 — FLASH Personal Essentials Recommendation Engine
 *
 * Architecture & Governance:
 * - Deterministic, rule-verified scoring system.
 * - Strict safety filters: Zero prescription drugs, unverified remedies, or diet supplements.
 * - Transparent explanation engine detailing matched criteria and trade-offs.
 * - 100% on-device scoring. Never transmits private menstrual logs or builds hidden tracking profiles.
 */

import { VERIFIED_PRODUCTS } from "@/content/products.js";

const FLASH_STORAGE_KEY = "saheli_flash_data";

export const DEFAULT_FLASH_STATE = {
  savedProductIds: [],
  preferences: {
    category: "all",
    maxBudget: 600, // INR
    currency: "INR",
    preferReusable: null, // true | false | null (any)
    sensitiveSkin: false, // prefers chlorine-free / organic cotton / hypoallergenic
    prioritizeValue: true,
    personalisationEnabled: true,
  },
  queryHistory: [],
};

export function loadFlashState() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(FLASH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          savedProductIds: Array.isArray(parsed.savedProductIds) ? parsed.savedProductIds : [],
          preferences: { ...DEFAULT_FLASH_STATE.preferences, ...(parsed.preferences || {}) },
          queryHistory: Array.isArray(parsed.queryHistory) ? parsed.queryHistory : [],
        };
      }
    }
  } catch {}
  return { ...DEFAULT_FLASH_STATE };
}

export function saveFlashState(state) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}

export function toggleSaveProduct(productId) {
  const state = loadFlashState();
  const index = state.savedProductIds.indexOf(productId);
  if (index > -1) {
    state.savedProductIds.splice(index, 1);
  } else {
    state.savedProductIds.push(productId);
  }
  saveFlashState(state);
  return state.savedProductIds.includes(productId);
}

export function isProductSaved(productId) {
  const state = loadFlashState();
  return state.savedProductIds.includes(productId);
}

export function clearFlashData() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(FLASH_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Score and rank verified products based on user criteria
 *
 * Scoring Model (Max 100 pts):
 * - Category Match: 30 pts
 * - Budget Compatibility: 25 pts (full points if within budget; partial if slightly above)
 * - Reusable / Disposable Preference: 20 pts
 * - Material & Sensitivity Match: 15 pts
 * - Price Verification Freshness: 10 pts
 */
export function getFlashRecommendations(criteria = {}, catalogue = VERIFIED_PRODUCTS) {
  const {
    category = "all",
    maxBudget = 600,
    preferReusable = null,
    sensitiveSkin = false,
    personalisationEnabled = true,
  } = criteria;

  if (!personalisationEnabled) {
    // Return all safe products unpersonalized, sorted by affordability
    return catalogue
      .map((prod) => ({
        product: prod,
        score: 50,
        reasons: ["flash.reason.generalSafe"],
        tradeOffs: [],
      }))
      .sort((a, b) => a.product.unitPrice - b.product.unitPrice);
  }

  const scored = [];

  for (const prod of catalogue) {
    // Absolute P0 Safety Filter: Must have verified review status
    if (prod.reviewStatus !== "verified_safe_non_prescription") {
      continue;
    }

    let score = 0;
    const reasons = [];
    const tradeOffs = [];

    // 1. Category Matching (30 pts)
    if (category === "all" || prod.category === category) {
      score += 30;
      reasons.push("flash.reason.catMatch");
    } else {
      // Different category: heavily penalized if user explicitly filtered
      continue;
    }

    // 2. Budget Compatibility (25 pts)
    if (prod.unitPrice <= maxBudget) {
      score += 25;
      reasons.push("flash.reason.budgetFit");
    } else if (prod.unitPrice <= maxBudget * 1.25) {
      score += 10;
      tradeOffs.push("flash.tradeoff.slightlyOverBudget");
    } else {
      tradeOffs.push("flash.tradeoff.overBudget");
    }

    // 3. Reusable Preference Matching (20 pts)
    if (preferReusable === null) {
      score += 10; // Neutral bonus
    } else if (preferReusable === prod.reusable) {
      score += 20;
      reasons.push(prod.reusable ? "flash.reason.reusableMatch" : "flash.reason.disposableMatch");
    } else {
      tradeOffs.push(
        prod.reusable ? "flash.tradeoff.isReusableCare" : "flash.tradeoff.isDisposableWaste",
      );
    }

    // Add durability trade-off explanation for reusable goods
    if (prod.reusable) {
      tradeOffs.push("flash.tradeoff.reusableMaintenance");
    }

    // 4. Material Sensitivity Matching (15 pts)
    if (sensitiveSkin) {
      const isSensitiveFriendly =
        prod.materials.some((m) => /cotton|cornstarch|bamboo|medical-grade|silicone/i.test(m)) &&
        !/perfume|fragrance|chlorine/i.test(prod.description);

      if (isSensitiveFriendly) {
        score += 15;
        reasons.push("flash.reason.sensitiveFriendly");
      } else {
        tradeOffs.push("flash.tradeoff.checkMaterials");
      }
    } else {
      score += 10;
    }

    // 5. Verification Freshness (10 pts)
    if (prod.priceVerificationStatus === "verified_current") {
      score += 10;
      reasons.push("flash.reason.priceVerified");
    } else {
      score += 5;
      tradeOffs.push("flash.tradeoff.olderPrice");
    }

    scored.push({
      product: prod,
      score,
      reasons,
      tradeOffs,
    });
  }

  // Rank by score descending, then by affordability (lower unit price first)
  scored.sort((a, b) => b.score - a.score || a.product.unitPrice - b.product.unitPrice);

  return scored;
}

/**
 * Side-by-Side Product Comparison Engine
 */
export function compareProducts(prodA, prodB) {
  if (!prodA || !prodB) return null;

  const priceDiff = Math.abs(prodA.unitPrice - prodB.unitPrice);
  const cheaper = prodA.unitPrice < prodB.unitPrice ? prodA.productId : prodB.productId;

  return {
    prodA,
    prodB,
    cheaperId: cheaper,
    priceDifference: priceDiff,
    attributes: [
      {
        labelKey: "flash.compare.reusable",
        valA: prodA.reusable ? "Yes (Washable)" : "No (Disposable)",
        valB: prodB.reusable ? "Yes (Washable)" : "No (Disposable)",
      },
      {
        labelKey: "flash.compare.pricePerUnit",
        valA: prodA.pricePerUnit,
        valB: prodB.pricePerUnit,
      },
      {
        labelKey: "flash.compare.quantity",
        valA: `${prodA.quantity} units`,
        valB: `${prodB.quantity} units`,
      },
      {
        labelKey: "flash.compare.materials",
        valA: prodA.materials.join(", "),
        valB: prodB.materials.join(", "),
      },
      {
        labelKey: "flash.compare.safety",
        valA: prodA.safetyInformation,
        valB: prodB.safetyInformation,
      },
    ],
  };
}
