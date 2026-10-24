/**
 * Saheli 7.5 — FLASH 2.0 Personal Essentials Recommendation Engine
 *
 * 6-Stage Hybrid Architecture:
 * - Stage 1: Validation & Normalization
 * - Stage 2: Strict Non-Prescription Safety & Contraindication Exclusions
 * - Stage 3: Clinical & Preference Matching (Category, Budget, Reusable/Disposable, Sensitive Skin)
 * - Stage 4: Machine Learned Relevance Scoring (7-dimensional feature vectors & trained weights)
 * - Stage 5: Combined Ranking & Multi-Criteria Sorting
 * - Stage 6: Transparent Faithfulness Explanation Engine (reasons, trade-offs, clinical guidance)
 *
 * Local-First Privacy:
 * - 100% on-device scoring.
 * - Zero reading of menstrual logs, cycle predictions, or private health conditions.
 * - Optional Anonymous/General mode requiring zero preferences.
 */

import { VERIFIED_PRODUCTS } from "@/content/products.js";
import { normalizeProduct, validateProduct } from "@/lib/marketProvider.js";
import { extractFeatures, predictRelevance, TRAINED_MODEL_WEIGHTS } from "@/lib/flashML.js";

const FLASH_STORAGE_KEY = "saheli_flash_data_v2";

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
    sortBy: "relevance", // "relevance" | "price_low_high" | "price_high_low" | "freshness"
  },
  feedback: {}, // { [productId]: { helpful: boolean, timestamp: string, notes?: string } }
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
          feedback:
            typeof parsed.feedback === "object" && parsed.feedback !== null ? parsed.feedback : {},
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

export function recordRecommendationFeedback(productId, helpful, notes = "") {
  const state = loadFlashState();
  state.feedback[productId] = {
    helpful: Boolean(helpful),
    timestamp: new Date().toISOString(),
    notes: String(notes || ""),
  };
  saveFlashState(state);
  return state.feedback[productId];
}

export function clearFlashData() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(FLASH_STORAGE_KEY);
    }
  } catch {}
}

/**
 * 6-Stage FLASH 2.0 Hybrid Recommendation Engine
 */
export function getFlashRecommendations(
  criteria = {},
  catalogue = VERIFIED_PRODUCTS,
  options = {},
) {
  const {
    category = "all",
    maxBudget = 600,
    preferReusable = null,
    sensitiveSkin = false,
    personalisationEnabled = true,
  } = criteria;

  const sortBy = options.sortBy || criteria.sortBy || "relevance";

  // General Safe Anonymous Mode
  if (!personalisationEnabled) {
    const unpersonalized = catalogue
      .map(normalizeProduct)
      .filter((p) => validateProduct(p).valid)
      .map((prod) => ({
        product: prod,
        score: 50,
        relevanceScore: 50,
        reasons: ["flash.reason.generalSafe"],
        tradeOffs: [],
        features: extractFeatures(prod, { category: "all", maxBudget: 600 }),
      }));

    return sortRecommendations(unpersonalized, sortBy);
  }

  const scored = [];

  for (const rawProd of catalogue) {
    // Stage 1: Normalize
    const prod = normalizeProduct(rawProd);
    if (!prod) continue;

    // Stage 2: Hard Safety & Non-Prescription Validation
    const validation = validateProduct(prod);
    if (!validation.valid) continue;

    // Stage 3: Preference Matching
    let ruleScore = 0;
    const reasons = [];
    const tradeOffs = [];

    // Category matching (30 pts)
    if (category === "all" || prod.category === category) {
      ruleScore += 30;
      reasons.push("flash.reason.catMatch");
    } else {
      // Filter out if user selected a specific category
      continue;
    }

    // Budget matching (25 pts)
    if (prod.unitPrice <= maxBudget) {
      ruleScore += 25;
      reasons.push("flash.reason.budgetFit");
    } else if (prod.unitPrice <= maxBudget * 1.25) {
      ruleScore += 10;
      tradeOffs.push("flash.tradeoff.slightlyOverBudget");
    } else {
      tradeOffs.push("flash.tradeoff.overBudget");
    }

    // Reusable / Disposable Preference (20 pts)
    if (preferReusable === null) {
      ruleScore += 10; // Neutral bonus
    } else if (preferReusable === prod.reusable) {
      ruleScore += 20;
      reasons.push(prod.reusable ? "flash.reason.reusableMatch" : "flash.reason.disposableMatch");
    } else {
      tradeOffs.push(
        prod.reusable ? "flash.tradeoff.isReusableCare" : "flash.tradeoff.isDisposableWaste",
      );
    }

    if (prod.reusable) {
      tradeOffs.push("flash.tradeoff.reusableMaintenance");
    }

    // Material & Sensitivity Matching (15 pts)
    const isSensitiveFriendly =
      prod.materials.some((m) => /cotton|cornstarch|bamboo|medical-grade|silicone/i.test(m)) &&
      !/perfume|fragrance|chlorine/i.test(prod.description);

    if (sensitiveSkin) {
      if (isSensitiveFriendly) {
        ruleScore += 15;
        reasons.push("flash.reason.sensitiveFriendly");
      } else {
        tradeOffs.push("flash.tradeoff.checkMaterials");
      }
    } else {
      ruleScore += 10;
    }

    // Price Freshness & Certification (10 pts)
    if (prod.priceVerificationStatus === "verified_current") {
      ruleScore += 10;
      reasons.push("flash.reason.priceVerified");
    } else {
      ruleScore += 5;
      tradeOffs.push("flash.tradeoff.olderPrice");
    }

    // Stage 4: Machine Learned Relevance Scoring
    const features = extractFeatures(prod, criteria);
    const learnedRelevanceScore = predictRelevance(features, TRAINED_MODEL_WEIGHTS);

    // Stage 5: Combined Hybrid Score (0..100)
    // 55% rule match + 45% learned ranking score
    const combinedScore = Math.round(ruleScore * 0.55 + (learnedRelevanceScore / 100) * 45);

    // Stage 6: Faithfulness Explanation Assembly
    scored.push({
      product: prod,
      score: combinedScore,
      ruleScore,
      learnedRelevanceScore,
      relevanceScore: combinedScore,
      reasons,
      tradeOffs,
      features,
    });
  }

  return sortRecommendations(scored, sortBy);
}

function sortRecommendations(items, sortBy) {
  const sorted = [...items];
  switch (sortBy) {
    case "price_low_high":
      return sorted.sort((a, b) => a.product.unitPrice - b.product.unitPrice || b.score - a.score);
    case "price_high_low":
      return sorted.sort((a, b) => b.product.unitPrice - a.product.unitPrice || b.score - a.score);
    case "freshness":
      return sorted.sort(
        (a, b) =>
          new Date(b.product.priceTimestamp).getTime() -
            new Date(a.product.priceTimestamp).getTime() || b.score - a.score,
      );
    case "relevance":
    default:
      return sorted.sort((a, b) => b.score - a.score || a.product.unitPrice - b.product.unitPrice);
  }
}

/**
 * Side-by-Side Product Comparison Engine
 */
export function compareProducts(prodA, prodB) {
  if (!prodA || !prodB) return null;

  const normA = normalizeProduct(prodA);
  const normB = normalizeProduct(prodB);

  const priceDiff = Math.abs(normA.unitPrice - normB.unitPrice);
  const cheaper = normA.unitPrice < normB.unitPrice ? normA.productId : normB.productId;

  return {
    prodA: normA,
    prodB: normB,
    cheaperId: cheaper,
    priceDifference: priceDiff,
    attributes: [
      {
        labelKey: "flash.compare.reusable",
        valA: normA.reusable ? "Yes (Washable)" : "No (Disposable)",
        valB: normB.reusable ? "Yes (Washable)" : "No (Disposable)",
      },
      {
        labelKey: "flash.compare.pricePerUnit",
        valA: normA.pricePerUnit,
        valB: normB.pricePerUnit,
      },
      {
        labelKey: "flash.compare.quantity",
        valA: `${normA.packQuantity} units`,
        valB: `${normB.packQuantity} units`,
      },
      {
        labelKey: "flash.compare.materials",
        valA: normA.materials.join(", "),
        valB: normB.materials.join(", "),
      },
      {
        labelKey: "flash.compare.safety",
        valA: normA.safetyInformation,
        valB: normB.safetyInformation,
      },
      {
        labelKey: "flash.compare.care",
        valA: normA.careInstructions,
        valB: normB.careInstructions,
      },
      {
        labelKey: "flash.compare.limitations",
        valA: normA.contraindicationNotes,
        valB: normB.contraindicationNotes,
      },
    ],
  };
}

/**
 * Export Saved Bag items into shareable text summary
 */
export function exportSavedBagSummary(savedProductIds = [], catalogue = VERIFIED_PRODUCTS) {
  const savedItems = catalogue
    .filter((p) => savedProductIds.includes(p.productId || p.id))
    .map(normalizeProduct);

  if (savedItems.length === 0) {
    return "Saheli FLASH Essentials Bag is empty.";
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  let summary = `SAHELI FLASH 2.0 — PERSONAL ESSENTIALS SUMMARY (${dateStr})\n`;
  summary += `Non-commercial, verified menstrual and personal comfort essentials.\n\n`;

  let totalEstimatedCost = 0;
  savedItems.forEach((p, idx) => {
    summary += `${idx + 1}. ${p.brand} — ${p.name}\n`;
    summary += `   • Category: ${p.category} | Type: ${p.reusable ? "Reusable" : "Disposable"}\n`;
    summary += `   • Unit Price: ₹${p.unitPrice.toFixed(2)} (${p.pricePerUnit})\n`;
    summary += `   • Material: ${p.material}\n`;
    summary += `   • Care & Hygiene: ${p.careInstructions}\n`;
    summary += `   • Verified Merchant: ${p.merchant}\n\n`;
    totalEstimatedCost += p.unitPrice;
  });

  summary += `Total Estimated Initial Outlay: ₹${totalEstimatedCost.toFixed(2)}\n`;
  summary += `Exported from Saheli: Your Cycle, Your Rhythm (Local-First & Private)`;

  return summary;
}
