# Saheli 5.1 — Multilingual System Audit Report

Generated: 2026-10-23T04:54:45.081Z

### Summary

- **Total Supported Languages**: 13
- **Master Dictionary Keys**: 699 keys
- **Key Parity Across All Languages**: 100.0%
- **Verbatim Hindi Contamination in Regional Languages**: 0 keys
- **RTL Support**: Urdu (`ur`) registered and styled with `dir="rtl"` and Nastaliq typography

### Language Matrix

| Code | Language  | Native Name | Script                  | Direction | Total Keys | Parity % | Contaminated |   Status    |
| :--: | :-------- | :---------- | :---------------------- | :-------: | :--------: | :------: | :----------: | :---------: |
| `en` | English   | English     | Latin                   |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `hi` | Hindi     | हिन्दी      | Hindi                   |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `mr` | Marathi   | मराठी       | Marathi                 |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `te` | Telugu    | తెలుగు      | Telugu                  |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `kn` | Kannada   | ಕನ್ನಡ       | Kannada                 |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `ta` | Tamil     | தமிழ்       | Tamil                   |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `bn` | Bengali   | বাংলা       | Bengali                 |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `gu` | Gujarati  | ગુજરાતી     | Gujarati                |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `pa` | Punjabi   | ਪੰਜਾਬੀ      | Punjabi                 |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `ml` | Malayalam | മലയാളം      | Malayalam               |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `or` | Odia      | ଓଡ଼ିଆ       | Odia                    |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `as` | Assamese  | অসমীয়া     | Assamese                |    LTR    |    699     |  100.0%  |      0       | ✅ Verified |
| `ur` | Urdu      | اردو        | Nastaliq / Perso-Arabic |    RTL    |    699     |  100.0%  |      0       | ✅ Verified |

### Medical Content Coverage

- **Clinical Lessons (`src/content/lessons.js`)**: 12 lessons localized across all 13 languages
- **PCOS Guide (`src/content/conditions.js`)**: 5 paragraphs localized across all 13 languages
- **First Period Guide (`src/content/firstPeriod.js`)**: 5 paragraphs localized across all 13 languages
- **Pregnancy Stages (`src/content/pregnancyWeeks.js`)**: 6 developmental milestones localized across all 13 languages
- **Medical FAQ Library (`src/content/faq.js`)**: 32 FAQs with questions, answers, and emergency keywords in all 13 languages
