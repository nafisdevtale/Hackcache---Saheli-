# Saheli 10.5 — Real-Browser QA & Visual Verification Report

## 1. Test Environment Specification

- **Browser**: Google Chrome / Chromium Headless (`1280x900` desktop & responsive mobile viewports)
- **Protocol**: Chrome DevTools Protocol (CDP) direct automation
- **Test Runner**: `scripts/verify-all-languages.js`
- **Application Server**: Vite Dev Server / TanStack Router on `http://127.0.0.1:5173`
- **Output Directory**: `docs/screenshots/saheli-10-5/`

---

## 2. Screenshot Evidence Log

Fourteen high-resolution screenshots were systematically captured in real browser sessions with live data seeding, verifying zero mixed language UI, correct DOM attributes, and full component rendering:

| # | Artifact Filename | Screen Tested | Target Language | DOM `<html lang>` | DOM `<html dir>` | Verification Notes |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 01 | `01_today_english.png` | Today Dashboard | English (`en`) | `en` | `ltr` | Baseline view; greeting, cycle day, navigation dock, quick actions |
| 02 | `02_today_hindi.png` | Today Dashboard | Hindi (`hi`) | `hi` | `ltr` | Full Hindi UI; "आज", "मासिक धर्म", zero English leak |
| 03 | `03_today_marathi.png` | Today Dashboard | Marathi (`mr`) | `mr` | `ltr` | Marathi cycle day, phase cards, quick actions |
| 04 | `04_today_bengali.png` | Today Dashboard | Bengali (`bn`) | `bn` | `ltr` | Bengali typography, Bangla numerals/Latin default toggle |
| 05 | `05_today_urdu_rtl.png` | Today Dashboard | Urdu (`ur`) | `ur` | `rtl` | Mirrored RTL dock, right-aligned cards, Nastaliq typography |
| 06 | `06_today_tamil.png` | Today Dashboard | Tamil (`ta`) | `ta` | `ltr` | Dravidian script rendering, navigation chips wrap cleanly |
| 07 | `07_today_telugu.png` | Today Dashboard | Telugu (`te`) | `te` | `ltr` | Telugu conjuncts, status cards, health metrics |
| 08 | `08_calendar_hindi.png` | Cycle Calendar | Hindi (`hi`) | `hi` | `ltr` | Month names, weekday headers, day inspector modal |
| 09 | `09_companion_bengali.png` | Companion Sanctuary | Bengali (`bn`) | `bn` | `ltr` | Talking pet stage, action bar (খাওয়ান, আদর করুন, কথা বলুন) |
| 10 | `10_diva_marathi.png` | Diva AI Coordinator | Marathi (`mr`) | `mr` | `ltr` | Multi-agent selector (ईव्ह, फ्लॅश, इन्स्टिंक्ट), prompt chips |
| 11 | `11_instinct_tamil.png` | INSTINCT Media | Tamil (`ta`) | `ta` | `ltr` | Entertainment feeds, mood filter buttons, data export modal |
| 12 | `12_settings_native_numerals_hindi.png` | Settings & Preferences | Hindi (`hi`) | `hi` | `ltr` | Native numerals toggle switch with live preview card |
| 13 | `13_urdu_rtl_navigation.png` | Navigation & Drawer | Urdu (`ur`) | `ur` | `rtl` | Full navigation layout flipped to right edge with Urdu labels |
| 14 | `14_community_teen_protection_hindi.png` | Community & Guidelines | Hindi (`hi`) | `hi` | `ltr` | DPDP teen compliance disclaimer, safe forum rules |

---

## 3. Real-Browser DOM Verification Points

1. **Document Element Attributes**:
   - For all LTR languages (`en`, `hi`, `mr`, `bn`, `as`, `gu`, `kn`, `ml`, `or`, `pa`, `ta`, `te`), `<html lang="{code}" dir="ltr">` is dynamically asserted.
   - For Urdu (`ur`), `<html lang="ur" dir="rtl">` is dynamically asserted.
2. **Title Synchronisation**:
   - `document.title` immediately updates to the translated application name or discreet mode title ("डायरी", "ডায়েরি", etc.).
3. **No Overflow or Collisions**:
   - Multi-word scripts (e.g. Malayalam, Tamil, Telugu) do not overlap adjacent navigation items.
   - Action buttons in `TalkingPetStage` wrap cleanly across mobile and desktop breakpoints.
4. **Numeral Formatting Toggle**:
   - In Settings, switching `prefs.nativeNumerals` dynamically updates cycle day indicators from Latin `Day 14 of 28` to Devanagari `दिन १४ / २८` in Hindi and Marathi, Bengali `দিন ১৪ / ২৮`, etc.
