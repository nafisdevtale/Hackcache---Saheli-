# Saheli 7.3 — Pre-Existing Health Conditions Module

## Purpose & Clinical Governance

The Pre-Existing Health Conditions module enables users to optionally record diagnosed or suspected chronic conditions that commonly interact with the menstrual cycle. It provides personalized educational context without diagnosing, prescribing, or leaking sensitive health records.

---

## 1. Verified Taxonomy (11 Categories)

All conditions are categorized in plain, culturally accessible language, cross-referenced with authoritative medical sources (NHS, ACOG, WHO):

1. **Polycystic Ovary Syndrome (PCOS / PCOD)** (`pcos`): Common hormonal condition causing irregular periods, elevated androgens, and ovarian cysts.
2. **Endometriosis** (`endometriosis`): Tissue similar to the uterine lining growing outside the uterus, causing pelvic pain and severe dysmenorrhea.
3. **Thyroid Conditions (Hypo / Hyperthyroidism)** (`thyroid_disorders`): Imbalances affecting metabolic rate, cycle regularity, and menstrual flow heaviness.
4. **Adenomyosis** (`adenomyosis`): Endometrial tissue growing into the muscular uterine wall, leading to painful, prolonged bleeding.
5. **Uterine Fibroids** (`uterine_fibroids`): Non-cancerous muscular tumors of the uterus causing pelvic pressure and heavy menstrual bleeding.
6. **Pelvic Inflammatory Disease (PID)** (`pelvic_inflammatory_disease`): Infection of female reproductive organs causing chronic pelvic discomfort.
7. **Iron-Deficiency Anemia** (`anemia`): Depleted hemoglobin often exacerbated by heavy menstrual flow, leading to chronic fatigue.
8. **Premenstrual Dysphoric Disorder (PMDD)** (`pmdd`): Severe luteal-phase affective disorder causing intense mood shifts, dysphoria, and irritability.
9. **Hyperprolactinemia** (`hyperprolactinemia`): Elevated prolactin levels potentially delaying ovulation and causing oligomenorrhea.
10. **Primary Ovarian Insufficiency (POI)** (`primary_ovarian_insufficiency`): Ovarian reserve reduction before age 40, causing infrequent cycles.
11. **Diabetes & Insulin Resistance** (`diabetes_metabolic`): Metabolic conditions directly influencing ovarian function and hormonal regularity.

### Explicit Exclusion of Unverified Entities

- **"PMOS" (Premenstrual Ovulation Syndrome)** is **strictly rejected**. It has no recognition in ICD-11, DSM-5-TR, ACOG, or NHS guidelines. Saheli maintains medical integrity by rejecting fictitious or unverified medical labels.

---

## 2. Status Qualification

Users may qualify each selected condition with one of three clinical statuses:

- `confirmed_diagnosis`: Formally diagnosed by a physician or specialist.
- `being_evaluated`: Currently undergoing investigations, blood tests, or ultrasound.
- `seeking_info`: Exploring symptoms or seeking information to discuss with a healthcare provider.

Additionally, users may select:

- `prefer_not_to_say`: Opts out of condition disclosure completely while completing onboarding.

---

## 3. Privacy, Encryption & Architectural Boundaries

- **Zero Remote Leakage**: Health condition data is stored solely inside the local record object in IndexedDB (`record.healthConditions`).
- **AES-GCM Local-First Encryption**: When passphrase or PIN encryption is enabled, `healthConditions` is encrypted inside the record ciphertext (`enc: 1`).
- **Zero AI / FLASH Leakage**: The AI Assistant and FLASH Product Recommender never receive the user's pre-existing health condition records.
  - FLASH recommendations depend purely on explicit user shopping preferences (e.g. skin sensitivity, reusability, budget).
  - AI queries process only user-submitted query text with strict red-flag triage.
- **Portability**: Included in JSON and PDF exports with explicit human-readable disclosures. Fully validated and sanitized during backup import.
