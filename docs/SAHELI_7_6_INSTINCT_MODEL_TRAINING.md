# SAHELI 7.6 — INSTINCT Recommender Model Training Architecture

**Subsystem:** Learning-to-Rank Machine Learning Pipeline  
**Core Runner:** `scripts/train-instinct-recommender.mjs`  
**Training Source:** `src/lib/instinctML.js`  
**Weights Artifact:** `src/data/instinct-model-weights.json`  
**Specification Reference:** Section 16

---

## 1. Machine Learning Ranking Formulation

INSTINCT utilizes a pairwise logistic ranking architecture (RankNet formulation). Rather than treating recommendation as an arbitrary rating prediction, the system directly optimizes ranking order between pairs of candidate items:

$$\mathcal{L}_{ij} = \log\left(1 + e^{-\sigma(z_i - z_j)}\right)$$

Where:

- $z_i = \mathbf{w}^T \mathbf{x}_i$ is the predicted linear relevance score for preferred item $i$.
- $z_j = \mathbf{w}^T \mathbf{x}_j$ is the predicted linear relevance score for candidate item $j$.
- $\mathbf{x}_i, \mathbf{x}_j \in [0, 1]^8$ are the normalized feature vectors.
- $\mathbf{w}$ is the weight vector subject to regularized gradient updates.

---

## 2. Dataset & Scenario Generation

The training pipeline constructs 60 diverse, realistic synthetic entertainment profiles representing cross-cultural discovery journeys:

- **Scenarios 1–15:** K-Drama and East Asian cinema enthusiasts (romance, thrillers, time-travel, medical).
- **Scenarios 16–30:** Indian cinema and regional storytelling (Hindi satire, Marathi social realism, Tamil neo-noir, rural comedies, space biographies).
- **Scenarios 31–45:** Music discovery and mood journeys (Sufi devotional, K-Pop ballads, acoustic folk, classical Debussy piano, regional Marathi & Tamil indie).
- **Scenarios 46–60:** Cross-media, school sitcoms, and global cinema lovers.

### Train / Test Isolation:

- **Train Split (70%):** 42 Scenarios
- **Held-Out Test Split (30%):** 18 Scenarios

---

## 3. Training Hyperparameters

- **Optimization Algorithm:** Stochastic Gradient Descent with Pairwise Logistic Loss
- **Epochs:** 75
- **Learning Rate:** 0.08
- **L2 Regularization Penalty:** 0.005
- **Weight Domain Constraint:** $w_k \ge 0.2$ (guarantees positive feature semantics)

---

## 4. Model Training Execution

The model training runner can be reproduced in any Node.js environment:

```bash
node scripts/train-instinct-recommender.mjs
```

### Resulting Output Artifact:

The script generates `src/data/instinct-model-weights.json` containing timestamped weights and held-out evaluation metrics.
