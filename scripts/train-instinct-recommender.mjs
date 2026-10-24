/**
 * Saheli 7.6 — INSTINCT Recommender ML Training Runner
 *
 * Trains the 8-feature pairwise ranking model across 60 multi-genre synthetic scenarios.
 * Evaluates held-out test split (30%) on NDCG@5, NDCG@10, P@5, P@10, MRR.
 * Emits learned weights to `src/data/instinct-model-weights.json`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { trainAndEvaluateInstinctModel, DEFAULT_INSTINCT_WEIGHTS } from "../src/lib/instinctML.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=================================================");
console.log(" SAHELI 7.6 — INSTINCT RECOMMENDER TRAINING RUNNER");
console.log("=================================================\n");

const { weights, metrics } = trainAndEvaluateInstinctModel({
  epochs: 80,
  learningRate: 0.04,
});

console.log("--- TRAINING METRICS ---");
console.log(`Train Scenarios: ${metrics.trainScenarioCount}`);
console.log(`Test Scenarios:  ${metrics.testScenarioCount}\n`);

console.log("--- HELD-OUT TEST EVALUATION ---");
console.log(`NDCG@5:       ${metrics.ndcgAt5.toFixed(4)}`);
console.log(`NDCG@10:      ${metrics.ndcgAt10.toFixed(4)}`);
console.log(`Precision@5:  ${metrics.precisionAt5.toFixed(4)}`);
console.log(`Precision@10: ${metrics.precisionAt10.toFixed(4)}`);
console.log(`MRR:          ${metrics.meanReciprocalRank.toFixed(4)}\n`);

console.log("--- LEARNED MODEL WEIGHTS ---");
console.table(weights);

// Save weights artifact
const targetDir = path.resolve(__dirname, "../src/data");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.resolve(targetDir, "instinct-model-weights.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      trainedAt: new Date().toISOString(),
      datasetScenarios: metrics.trainScenarioCount + metrics.testScenarioCount,
      weights,
      metrics,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`\nSuccessfully wrote model weights artifact to: ${outputPath}`);
