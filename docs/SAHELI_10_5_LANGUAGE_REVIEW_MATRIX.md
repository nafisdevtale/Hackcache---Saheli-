# Saheli 10.5 — Language Review Matrix & Parity Verification

## 1. Quality Tier Methodology

To ensure transparent reporting, Saheli distinguishes between **Technical Key Parity** (100% dictionary completeness, zero empty strings, zero raw keys, correct interpolation tokens) and **Linguistic Review Tier**:

- **Tier 1 (Complete Verification)**: Native speaker reviewed, clinically cross-checked with medical terms, thoroughly verified in browser UI.
- **Tier 2 (Advanced Validation)**: High script fidelity (>99%), verified in test fixtures, complete dictionary keys, UI layout verified under automated matrix.

---

## 2. 13-Language Verification Status

| Language      | Code | Family        | Script                | Total Keys | Key Parity | Script Fidelity |     Quality Tier     | Automated Test Status |
| :------------ | :--: | :------------ | :-------------------- | :--------: | :--------: | :-------------: | :------------------: | :-------------------: |
| **English**   | `en` | Indo-European | Latin                 |   1,805    |   100.0%   |     100.0%      |  Tier 1 (Baseline)   |         PASS          |
| **Hindi**     | `hi` | Indo-Aryan    | Devanagari            |   1,805    |   100.0%   |     100.0%      |   Tier 1 (Primary)   |         PASS          |
| **Marathi**   | `mr` | Indo-Aryan    | Devanagari            |   1,805    |   100.0%   |     100.0%      |   Tier 1 (Primary)   |         PASS          |
| **Bengali**   | `bn` | Indo-Aryan    | Bengali               |   1,805    |   100.0%   |      99.0%      |   Tier 1 (Primary)   |         PASS          |
| **Tamil**     | `ta` | Dravidian     | Tamil                 |   1,805    |   100.0%   |     100.0%      |   Tier 1 (Primary)   |         PASS          |
| **Telugu**    | `te` | Dravidian     | Telugu                |   1,805    |   100.0%   |     100.0%      |   Tier 1 (Primary)   |         PASS          |
| **Urdu**      | `ur` | Indo-Aryan    | Arabic/Nastaliq (RTL) |   1,805    |   100.0%   |     100.0%      | Tier 1 (RTL Primary) |         PASS          |
| **Gujarati**  | `gu` | Indo-Aryan    | Gujarati              |   1,805    |   100.0%   |     100.0%      |  Tier 2 (Validated)  |         PASS          |
| **Kannada**   | `kn` | Dravidian     | Kannada               |   1,805    |   100.0%   |     100.0%      |  Tier 2 (Validated)  |         PASS          |
| **Malayalam** | `ml` | Dravidian     | Malayalam             |   1,805    |   100.0%   |     100.0%      |  Tier 2 (Validated)  |         PASS          |
| **Punjabi**   | `pa` | Indo-Aryan    | Gurmukhi              |   1,805    |   100.0%   |      99.0%      |  Tier 2 (Validated)  |         PASS          |
| **Odia**      | `or` | Indo-Aryan    | Odia                  |   1,805    |   100.0%   |      99.1%      |  Tier 2 (Validated)  |         PASS          |
| **Assamese**  | `as` | Indo-Aryan    | Assamese              |   1,805    |   100.0%   |      99.0%      |  Tier 2 (Validated)  |         PASS          |

---

## 3. Visual & Typographic Integrity Checks

During the Saheli 10.5 audit, each writing system was verified for:

1. **Complex Script Shaping**:
   - Devanagari conjuncts (`क्रेम्प्स`, `मासिक पाळी`).
   - Bengali ligatures (`ঋতুস্রাব`, `ডিম্বস্ফোটন`).
   - Tamil vowel signs and pulli markers (`மாதவிடாய்`).
   - Telugu subjoined consonants (`రుతుక్రమం`).
   - Malayalam chillu letters and conjuncts (`ആർത്തവം`).
   - Gurmukhi tippis and addaks (`ਮਾਹਵਾਰੀ`).
2. **Text Expansion & Button Wrap**:
   - South Asian languages typically require 15–30% more horizontal space than English.
   - All buttons, navigation chips, and cards use flexible column wraps or auto-flowing layouts to prevent text truncation (`text-overflow: ellipsis`) on critical health labels.
3. **RTL Alignment & Directional Flipping**:
   - Urdu text flows strictly right-to-left.
   - Punctuation (commas, periods, questions marks `؟`) is correctly placed at sentence ends in RTL mode.
   - Numeric digits within Urdu sentences follow standard extended Arabic-Indic or Latin conventions without reversing digit significance.
