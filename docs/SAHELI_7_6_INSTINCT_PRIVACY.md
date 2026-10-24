# SAHELI 7.6 — INSTINCT Privacy Isolation & Data Portability Specification

**Subsystem:** Privacy Architecture & Data Isolation  
**Specification Reference:** Sections 19 and 20  
**Storage Keys:** `saheli_instinct_library_v1`, `saheli_instinct_profile_v1`

---

## 1. Absolute Privacy Boundaries

Saheli operates under a strict **local-first privacy charter**. INSTINCT adheres to these non-negotiable boundaries:

1. **Zero Health Data Leakage:**
   - INSTINCT storage is physically isolated in separate localStorage keys.
   - It **never** reads, queries, or writes to `saheli_records` (menstrual logs, bleeding flow, ovulation), `saheli_user_prefs`, `saheli_companion`, or `saheli_health_conditions_v1`.
   - Menstrual dates, cycles, symptoms, and pregnancy status are completely invisible to INSTINCT's recommendation algorithms and conversational AI.

2. **No Remote Tracking or Analytics:**
   - INSTINCT contains no third-party analytics pixels, tracking beacons, or device fingerprinting libraries.
   - Provider searches occur through server-side caching proxies that strip client identifiers.

3. **Conversational Medical Redirection & Refusal:**
   - The "Ask INSTINCT" conversational interface actively inspects queries for clinical and menstrual keywords.
   - If a user inquires about bleeding, cramps, ovulation, pregnancy, or contraception, the model immediately and politely refuses:
     > _"I am INSTINCT, your entertainment discovery companion! For any health, period, or medical inquiries, please switch over to Saheli's Ask AI health guide or consult a healthcare professional."_

---

## 2. Data Portability: JSON & CSV Standards

Users retain full ownership of their entertainment libraries, watchlists, ratings, and viewing progress.

### Export Formats:

- **JSON Export (`exportLibraryAsJson`):** Produces a structured, versioned file containing profile preferences, watchlists, currently watching progress, completed items, ratings, and music library.
- **CSV Export (`exportLibraryAsCsv`):** Produces a standardized tabular comma-separated file suitable for spreadsheet viewing and migration.

### Import Validation:

- Safe schema validation prevents corrupted inputs from degrading app state.
- Duplicate IDs are deduplicated during merge operations.
- Malformed inputs are rejected with clear user-facing error notices without wiping existing records.
