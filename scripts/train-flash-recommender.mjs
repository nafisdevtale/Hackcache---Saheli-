#!/usr/bin/env node
import { trainAndEvaluateModel, TRAINED_MODEL_WEIGHTS } from "../src/lib/flashML.js";
import { VERIFIED_PRODUCTS } from "../src/content/products.js";

console.log("=================================================================");
console.log(" SAHELI 7.5 — FLASH 2.0 MACHINE LEARNING EVALUATION PIPELINE");
console.log("=================================================================");

const result = trainAndEvaluateModel(VERIFIED_PRODUCTS);

console.log("\nTRAINING ARCHITECTURE & SPLIT:");
console.log(
  `- Total Clinical / Lifestyle Scenarios: ${result.metrics.trainScenarioCount + result.metrics.testScenarioCount}`,
);
console.log(`- Training Set Scenarios: ${result.metrics.trainScenarioCount} (70%)`);
console.log(`- Held-Out Evaluation Scenarios: ${result.metrics.testScenarioCount} (30%)`);
console.log(`- Product Catalogue Size: ${VERIFIED_PRODUCTS.length} verified products`);

console.log("\nHELD-OUT EVALUATION METRICS ON TEST SPLIT:");
console.log(`- NDCG@3:             ${result.metrics.ndcgAt3}`);
console.log(`- NDCG@5:             ${result.metrics.ndcgAt5}`);
console.log(`- Precision@1 (P@1):  ${result.metrics.precisionAt1}`);
console.log(`- Precision@3 (P@3):  ${result.metrics.precisionAt3}`);
console.log(`- Mean Reciprocal Rank (MRR): ${result.metrics.meanReciprocalRank}`);

console.log("\nLEARNED FEATURE WEIGHTS:");
console.log(JSON.stringify(result.weights, null, 2));
console.log("\n=================================================================");
