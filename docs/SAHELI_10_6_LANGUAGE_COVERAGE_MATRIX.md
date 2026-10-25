# SAHELI 10.6 — LANGUAGE COVERAGE & SCRIPT HEALTH MATRIX

**Total Supported Languages:** 13  
**Total Base Dictionary Keys:** 1,974  
**Audit Verification Tool:** `scripts/i18n-check.js` & `scripts/ast-localisation-audit.js`  
**Parity Score:** 100.0%  
**Cross-Script Contamination:** 0 Instances

---

## 1. Master Language Matrix

| Code | Language           | Script           | Direction |  Total Keys   | Coverage | Script Health |        Regional Purity        |
| :--: | :----------------- | :--------------- | :-------: | :-----------: | :------: | :-----------: | :---------------------------: |
| `en` | English            | Latin            |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |       Clean Latin Base        |
| `hi` | Hindi (हिन्दी)     | Devanagari       |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |        Pure Devanagari        |
| `mr` | Marathi (मराठी)    | Devanagari       |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |        Pure Devanagari        |
| `bn` | Bengali (বাংলা)    | Bengali          |    LTR    | 1,974 / 1,974 |  100.0%  |    99.0%*     | Zero Devanagari Contamination |
| `as` | Assamese (অসমীয়া) | Bengali/Assamese |    LTR    | 1,974 / 1,974 |  100.0%  |    99.0%*     | Zero Devanagari Contamination |
| `gu` | Gujarati (ગુજરાતી) | Gujarati         |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |         Pure Gujarati         |
| `pa` | Punjabi (ਪੰਜਾਬੀ)   | Gurmukhi         |    LTR    | 1,974 / 1,974 |  100.0%  |    99.0%*     |         Pure Gurmukhi         |
| `kn` | Kannada (ಕನ್ನಡ)    | Kannada          |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |         Pure Kannada          |
| `ml` | Malayalam (മലയാളം) | Malayalam        |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |        Pure Malayalam         |
| `or` | Odia (ଓଡ଼ିଆ)       | Odia             |    LTR    | 1,974 / 1,974 |  100.0%  |    99.1%*     |           Pure Odia           |
| `ta` | Tamil (தமிழ்)      | Tamil            |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |          Pure Tamil           |
| `te` | Telugu (తెలుగు)    | Telugu           |    LTR    | 1,974 / 1,974 |  100.0%  |    100.0%     |          Pure Telugu          |
| `ur` | Urdu (اردو)        | Arabic/Nastaliq  |    RTL    | 1,974 / 1,974 |  100.0%  |    100.0%     |      Pure Arabic Script       |

_\*Note: The ~1% non-native characters in regional scripts correspond strictly to standardized medical abbreviations (e.g. `LH`, `BBT`, `OPD`, `112`, `14416`), technical variable placeholders `{n}`, `{day}`, `{count}`, and international emergency short-codes._

---

## 2. Key Domain Coverage Breakdown

Every domain within Saheli has been audited to guarantee 100% string coverage across all 13 languages:

```
Domain Namespace                 Total Keys   Translation Status   Verification Tool
─────────────────────────────────────────────────────────────────────────────────
app.*, nav.*, common.*                184            100%             AST & Vitest
rhythm.*, phase.*, cycle.*            142            100%             AST & Vitest
log.*, quickLog.*, symptoms.*         218            100%             AST & Vitest
pet.*, companion.*                    276            100%             AST & Vitest
diva.*, agent.*                       165            100%             AST & Vitest
instinct.*, media.*                   184            100%             AST & Vitest
flash.*, catalogue.*                  156            100%             AST & Vitest
doc.*, uns.*, redflags.*              138            100%             AST & Vitest
preg.*, set.*                         114            100%             AST & Vitest
rem.*, quietHours.*                    78            100%             AST & Vitest
selfcare.*, sound.*                   122            100%             AST & Vitest
ask.*, faq.*, learn.*                 197            100%             AST & Vitest
─────────────────────────────────────────────────────────────────────────────────
TOTAL DICTIONARY KEYS                1,974           100%             Zero Missing
```

---

## 3. Linguistic Leakage & Cross-Contamination Prevention

A common bug in multilingual Indic applications is fallback pollution—where a missing regional string falls back to Hindi (Devanagari) instead of English or fails silently.

To prevent this:

1. `scripts/i18n-check.js` includes a strict Unicode block filter:
   - For any non-Devanagari language (Bengali, Tamil, Telugu, Gujarati, Gurmukhi, Kannada, Malayalam, Odia, Urdu), any string containing Unicode points in the Devanagari range (`[\u0900-\u097F]`) triggers a fatal build error.
2. Contamination Count: **0 / 1,974** across all non-Devanagari languages.
3. Every dictionary file is checked by Vitest on every CI build.
