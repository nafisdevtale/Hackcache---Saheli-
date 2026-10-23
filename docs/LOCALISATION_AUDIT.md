# SAHELI Localisation Audit & Quality Register

**Audit Date:** 2026-10-23  
**Target Languages for Saheli 2.0 MVP:**

1. **English (`en`)** — Base Reference
2. **Hindi (`hi`)** — हिन्दी (100% coverage, Devanagari script)
3. **Marathi (`mr`)** — मराठी (100% coverage, Devanagari script)

---

## 1. Key Parity & Untranslated Fallback Status

| Language Code | Language Name | Native Script         | Direction | Total Keys | Missing Keys | Verbatim English Fallbacks | Review Status                             |
| ------------- | ------------- | --------------------- | --------- | ---------- | ------------ | -------------------------- | ----------------------------------------- |
| `en`          | English       | Latin                 | LTR       | 606        | 0            | 0                          | Baseline Reference                        |
| `hi`          | Hindi         | Devanagari            | LTR       | 606        | 0            | 0                          | Authentic terms (Clinical review pending) |
| `mr`          | Marathi       | Devanagari            | LTR       | 606        | 0            | 0                          | Authentic terms (Clinical review pending) |
| `te`          | Telugu        | Telugu                | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `kn`          | Kannada       | Kannada               | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `ta`          | Tamil         | Tamil                 | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `bn`          | Bengali       | Bengali               | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `gu`          | Gujarati      | Gujarati              | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `pa`          | Punjabi       | Gurmukhi              | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `ml`          | Malayalam     | Malayalam             | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `or`          | Odia          | Odia                  | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `as`          | Assamese      | Assamese              | LTR       | 606        | 0            | 0                          | Initial native script coverage            |
| `ur`          | Urdu          | Nastaliq/Perso-Arabic | **RTL**   | 606        | 0            | 0                          | Initial native script coverage            |

---

## 2. Text Expansion & Small-Screen Hardening (320px / 360px)

- **Marathi / Hindi Expansion Factor:** Devanagari words are typically 20%–35% wider than their English counterparts (e.g., "Settings" -> "सेटिंग्ज" / "सेटिंग्स", "Symptoms" -> "लक्षणे" / "लक्षण").
- **Layout Mitigations:**
  - Navigation labels use flexible text wrapping or icon + short label layouts.
  - Buttons employ `min-h-[44px]` touch targets with wrap capability rather than fixed widths or clipping `overflow: hidden`.
  - Grid layouts collapse to single-column flex layouts on screens `< 380px` (`w-full` at small viewports).
  - No horizontal scrolling is introduced by any translated strings.

---

## 3. Pluralization & Locale-Aware Numbering

- Numbers in dates and counts format dynamically via `Intl.NumberFormat` and `Intl.DateTimeFormat` using the active language tag (`hi-IN`, `mr-IN`, `en-IN`).
- Interpolation placeholders (e.g. `{count}`, `{days}`, `{date}`) are strictly validated to prevent `undefined` or raw placeholder leakage.
