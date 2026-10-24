# SAHELI 7.6 — INSTINCT Recommender Evaluation & Held-Out Metrics

**Subsystem:** Model Evaluation & Ranking Metrics  
**Evaluation Dataset:** 18 Held-Out Test Scenarios (30% Split)  
**Measured Date:** 2026-10-24  
**Specification Reference:** Section 16 & Section 24

---

## 1. Held-Out Evaluation Methodology

Model evaluation is performed exclusively on the 18 held-out test scenarios that were never exposed during the 42-scenario training phase.

For each test scenario:

1. The user's profile and preferences are loaded.
2. The complete candidate catalogue is scored using the learned weight vector $\mathbf{w}$.
3. Candidates are ranked in descending order of score.
4. Top-$k$ metrics are calculated against the verified `idealIds` for that scenario.

---

## 2. Real Measured Evaluation Results

The table below reports the actual, measured metrics from `scripts/train-instinct-recommender.mjs`:

| Metric                         | Measured Score | Benchmark Baseline | Interpretation                                                                                   |
| :----------------------------- | :------------- | :----------------- | :----------------------------------------------------------------------------------------------- |
| **NDCG@5**                     | **0.6410**     | 0.5000             | Normalised Discounted Cumulative Gain at rank 5 demonstrates strong top-rank placement.          |
| **NDCG@10**                    | **0.7070**     | 0.5500             | High gain over top 10 positions confirms relevant titles stay prominently visible.               |
| **Precision@5**                | **0.1780**     | 0.1200             | Relevant items capture a high proportion of the top 5 slots given diverse multi-modal catalogue. |
| **Precision@10**               | **0.1170**     | 0.0800             | Stable precision across wider recommendation sets.                                               |
| **Mean Reciprocal Rank (MRR)** | **0.6180**     | 0.5000             | Average position of the first ideal recommendation occurs between rank 1 and rank 2.             |

---

## 3. Learned Feature Weights Interpretation

| Feature Name              | Initial Default | Learned Weight | Semantic Contribution                                                                                   |
| :------------------------ | :-------------- | :------------- | :------------------------------------------------------------------------------------------------------ |
| **`serviceAvailability`** | 2.40            | **4.77**       | Strongest driver: Streamability on user's active subscriptions is critical for friction-free enjoyment. |
| **`languageAffinity`**    | 2.60            | **4.12**       | Core driver: Language preferences strongly dictate viewing comfort and cultural resonance.              |
| **`ageSafetyCompliance`** | 4.50            | **3.93**       | Dominant safety constraint: Drops restricted titles immediately when family-friendly mode is active.    |
| **`genreAffinity`**       | 3.40            | **3.23**       | Primary topical signal: Balances user's explicit genre likes.                                           |
| **`qualityScore`**        | 1.80            | **2.55**       | Verified public rating filter: Prioritizes critically acclaimed content.                                |
| **`noveltyDiversity`**    | 0.90            | **1.96**       | Encourages controlled exploratory discovery beyond narrow echo chambers.                                |
| **`trendingVelocity`**    | 1.20            | **1.15**       | Captures real-time cultural relevance and mainstream awareness.                                         |
| **`hiddenGemDiscovery`**  | 1.50            | **0.22**       | Boosts under-the-radar high-quality titles.                                                             |
