# Saheli 7.2 — FLASH Recommender System Evaluation

**Empirical Verification Across Diverse User Personas & Clinical Safety Audits**

---

## 1. Evaluation Methodology

To evaluate the clinical integrity, algorithmic fairness, and usability of FLASH, the recommender engine was tested against four distinct, realistic user personas spanning diverse Indian socio-economic and geographical contexts.

---

## 2. Persona Test Scenarios

### Persona A: Low-Budget Student / Rural First-Timer

- **Context**: 17-year-old girl in rural Maharashtra with ₹50 monthly allowance, limited privacy at home, and seeking affordable disposable supplies.
- **Input Criteria**: `maxBudget: 50`, `preferReusable: false`, `category: "disposable_pads"`, `sensitiveSkin: false`.
- **Top Recommended Product**: _Jan Aushadhi Suvidha Oxo-Biodegradable Sanitary Napkins_ (₹4.00 for pack of 4; ₹1.00/pad).
- **Composite Score**: 95 / 100.
- **Generated Reasons**:
  - `flash.reason.catMatch` (Matches disposable pad request)
  - `flash.reason.budgetFit` (₹4 is well below ₹50 limit)
  - `flash.reason.disposableMatch` (Matches single-use preference)
  - `flash.reason.priceVerified` (Jan Aushadhi Kendras subsidized rate)
- **Clinical Safety Outcome**: Passes. Provides dignified, government-certified (BPPI) supplies without financial distress.

---

### Persona B: Eco-Conscious Urban Working Professional

- **Context**: 26-year-old professional in Bengaluru seeking to reduce menstrual plastic waste, willing to invest upfront for multi-year durability.
- **Input Criteria**: `maxBudget: 600`, `preferReusable: true`, `category: "all"`, `sensitiveSkin: true`.
- **Top Recommended Products**:
  1. _Boondh Medical-Grade Silicone Menstrual Cup_ (₹299, lasts 10 years, medical silicone).
  2. _EcoFemme Breathable Organic Cotton Cloth Pad Day-Pad_ (₹245, lasts 3–5 years, 100% GOTS organic cotton).
- **Composite Score**: 95 / 100.
- **Trade-off Disclosures Verified**:
  - `flash.tradeoff.reusableMaintenance` (Requires proper washing and drying).
  - `flash.tradeoff.isReusableCare` (Requires clean water and thorough drying between cycles).
- **Clinical Safety Outcome**: Passes. High transparency regarding anatomical familiarity and boiling sterilization.

---

### Persona C: Contact Dermatitis / Sensitive-Skin User

- **Context**: 22-year-old woman with a history of vulvar rashes and allergic reactions to synthetic plastic top-sheets and artificial fragrances.
- **Input Criteria**: `maxBudget: 500`, `preferReusable: null`, `category: "disposable_pads"`, `sensitiveSkin: true`.
- **Top Recommended Product**: _Carmesi 100% Organic Cotton Sensitive Skin Pads_ (₹299, bamboo fiber core, zero chlorine/fragrance).
- **Composite Score**: 90 / 100.
- **Generated Reasons**:
  - `flash.reason.sensitiveFriendly` (Hypoallergenic, no chlorine/fragrance).
  - `flash.reason.catMatch` (Disposable pads).
  - `flash.reason.budgetFit` (Within ₹500 budget).
- **Clinical Safety Outcome**: Passes. Fragrance-laced conventional pads are deprioritized.

---

### Persona D: Severe Cramp Management Without Medication

- **Context**: 19-year-old college student experiencing painful primary dysmenorrhea looking for non-pharmacological comfort essentials.
- **Input Criteria**: `maxBudget: 400`, `category: "warm_compress"`.
- **Top Recommended Product**: _Carewave Natural Heating Gel Pad / Warm Water Bottle_ (₹299, medical-grade natural rubber with velvet cover).
- **Composite Score**: 85 / 100.
- **Generated Reasons**:
  - `flash.reason.generalSafe`
  - `flash.reason.catMatch`
  - `flash.reason.budgetFit`
- **Clinical Safety Outcome**: Passes. Aligns with Cochrane / ACOG evidence that superficial heat therapy (~40°C) is as effective as oral analgesics for primary dysmenorrhea without drug side-effects.

---

## 3. Strict Safety Exclusion Audit

| Product Category Evaluated                            | System Action | Rationale                                                                            |
| :---------------------------------------------------- | :-----------: | :----------------------------------------------------------------------------------- |
| Prescription NSAIDs (Mefenamic Acid, Ibuprofen 400mg) | **REJECTED**  | Requires doctor prescription; risk of gastric ulceration and contraindications.      |
| Hormonal Contraceptive Pills                          | **REJECTED**  | Prescription-only; contraindications for minors, smokers, and thromboembolic risk.   |
| Unregulated "Herbal Period Delay" capsules            | **REJECTED**  | Unverified ingredients, potential toxicity, lacks DCGI/Ayush clinical approval.      |
| Weight-loss / "Debloating" detox teas                 | **REJECTED**  | Laxative abuse risk, promotes harmful body image standards.                          |
| Scented Vaginal Washes & Douches                      | **REJECTED**  | Disrupts natural lactobacillus flora; increases risk of Bacterial Vaginosis and PID. |

---

## 4. Conclusion

FLASH achieves its dual mission: providing verified, transparent access to dignified menstrual essentials while upholding strict medical non-interference.
