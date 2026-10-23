# Saheli 7.2 — FLASH Essentials Recommender Architecture

**Personal Menstrual & Self-Care Essentials Advisor**

---

## 1. Executive Summary & Design Mission

FLASH is Saheli's transparent, privacy-first recommender system for menstrual and self-care essentials. Unlike commercial e-commerce platforms and ad-driven health trackers that rank products based on affiliate commissions, sponsored bids, or user tracking cookies, FLASH operates under a strict **Ethical and Clinical Charter**:

1. **Zero Commercial Sponsorship**: Product ranking is 100% deterministic and driven solely by user needs, budget constraints, and clinical safety.
2. **Zero Prescription Drugs or Diet Pills**: The catalogue strictly contains verified, non-prescription hygiene and self-care essentials. Prescription analgesics, hormonal drugs, and unverified weight-loss supplements are strictly excluded.
3. **100% On-Device Execution**: FLASH computes all recommendation scores and rationale locally in the browser or WebView. Personal menstrual dates, cycle logs, and user searches are never sent to external servers or ad networks.
4. **Transparent Explainability**: Every recommendation discloses matched criteria ("Why recommended?") alongside honest considerations and trade-offs ("Considerations & Trade-offs").

---

## 2. Multi-Criteria Scoring Model

The recommendation engine employs a deterministic weighted scoring model yielding a composite score out of 100 points:

$$\text{FLASH Score} = S_{\text{cat}} + S_{\text{budget}} + S_{\text{type}} + S_{\text{sens}} + S_{\text{fresh}}$$

```
+-------------------------------------------------------------------------+
|                  FLASH Scoring Architecture (100 Points)                 |
+------------------------------------+------------------------------------+
| Factor                             | Max Weight                         |
+------------------------------------+------------------------------------+
| 1. Category Matching               | 30 Points                          |
| 2. Budget Compatibility            | 25 Points                          |
| 3. Reusable / Disposable Match     | 20 Points                          |
| 4. Material Sensitivity Match      | 15 Points                          |
| 5. Verification Freshness          | 10 Points                          |
+------------------------------------+------------------------------------+
```

### Component Formulations

#### 1. Category Matching ($S_{\text{cat}}$, max 30 pts)

- If user filter is `"all"`: All verified products receive 30 pts.
- If user explicitly filters by category (e.g. `menstrual_cups`, `disposable_pads`, `warm_compress`):
  - Matching products: 30 pts + reason token `flash.reason.catMatch`.
  - Non-matching products: excluded from the active query view.

#### 2. Budget Compatibility ($S_{\text{budget}}$, max 25 pts)

- **Within budget** ($\text{unitPrice} \le \text{maxBudget}$): 25 pts + reason token `flash.reason.budgetFit`.
- **Slightly over budget** ($\text{maxBudget} < \text{unitPrice} \le 1.25 \times \text{maxBudget}$): 10 pts + trade-off token `flash.tradeoff.slightlyOverBudget`.
- **Substantially over budget** ($\text{unitPrice} > 1.25 \times \text{maxBudget}$): 0 pts + trade-off token `flash.tradeoff.overBudget`.

#### 3. Reusable vs Disposable Preference ($S_{\text{type}}$, max 20 pts)

- **Neutral** (`preferReusable === null`): 10 pts.
- **Match** (`preferReusable === prod.reusable`): 20 pts + reason token (`flash.reason.reusableMatch` or `flash.reason.disposableMatch`).
- **Mismatch**: 0 pts + trade-off token (`flash.tradeoff.isReusableCare` or `flash.tradeoff.isDisposableWaste`).
- All reusable goods automatically receive the maintenance disclosure `flash.tradeoff.reusableMaintenance`.

#### 4. Material & Skin Sensitivity Matching ($S_{\text{sens}}$, max 15 pts)

- When `sensitiveSkin === true`:
  - Products composed of hypoallergenic, fragrance-free, chlorine-free materials (100% organic cotton, bamboo charcoal, food/medical-grade silicone, wheat bag): 15 pts + reason token `flash.reason.sensitiveFriendly`.
  - Other materials: 0 pts + trade-off token `flash.tradeoff.checkMaterials`.
- When `sensitiveSkin === false`: Baseline neutral 10 pts.

#### 5. Price Verification Freshness ($S_{\text{fresh}}$, max 10 pts)

- Recently verified current market price: 10 pts + reason token `flash.reason.priceVerified`.
- Archival catalog price: 5 pts + trade-off token `flash.tradeoff.olderPrice`.

---

## 3. Explainability Engine

FLASH avoids "black-box" AI recommendations. Every rendered product card presents:

1. **Why FLASH Recommended This**:
   - `✓ Verified safe non-prescription essential`
   - `✓ Matches your requested category`
   - `✓ Within your specified budget limit`
   - `✓ Hypoallergenic and free from synthetic fragrances or chlorine`

2. **Honest Considerations & Trade-offs**:
   - `⚠️ Requires clean water and thorough drying between cycles`
   - `⚠️ Generates recurring monthly cost and disposal waste`
   - `⚠️ Requires boiling sterilization before first use each cycle`

---

## 4. Side-by-Side Product Comparison

Users can select up to 2 items for comparison via `compareProducts(prodA, prodB)`:

- **Financial Matrix**: Absolute price difference, unit cost, longevity (e.g. ₹1.00/pad disposable vs ₹299 reusable cup lasting 5–10 years).
- **Physical Specifications**: Reusability classification, pack quantity, key materials.
- **Maintenance & Safety**: Cleaning instructions, contraindications, and clinical source citations.

---

## 5. Privacy & Storage Isolation

All user interactions with FLASH (saved items, budget preferences, category selections) reside in `localStorage` under `saheli_flash_data`. They are strictly isolated from the menstrual record diary and can be cleared instantly via "Clear Bag" or "Reset Settings" without altering cycle history.
