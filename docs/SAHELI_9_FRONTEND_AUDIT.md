# Saheli 9.0 — Comprehensive Frontend Architecture & Design Audit

**Release:** Saheli 9.0 — Bloom Frontend Renewal  
**Date:** October 2026  
**Auditor:** Antigravity AI & Saheli Engineering Team  
**Repository:** `https://github.com/nafisdevtale/remix-of-saheli-cycle-companion`  
**Target Branch:** `feature/saheli-9-bloom` (baseline commit: `d8243fa` on `main`)

---

## 1. Executive Summary

This comprehensive audit inspects the frontend presentation layer, CSS architecture, typography system, responsive behavior, component primitives, and translation infrastructure across the entire Saheli repository.

While Saheli's medical safety rules, cycle calculations, local-first IndexedDB storage, and AI agents (Eeve, FLASH, INSTINCT, Diva) are functionally proven with 442 passing Vitest tests, the frontend has suffered from systemic presentation defects:

1. **Font & Typography Deficits:** Reliance on non-guaranteed local system fonts, lack of script-specific line-height compensation (particularly for Urdu Nastaliq and complex Indic conjuncts), uppercase transforms applied to Indic scripts, and letter-spacing applied indiscriminately across non-Latin scripts.
2. **Legacy Design Token Fragmentation:** Mix of legacy Saheli 5.0 tokens (`oklch(...)`), ad-hoc hex colors, Tailwind utility overrides, and hardcoded gradients.
3. **Responsive Spacing Inconsistencies:** Rigid touch targets vs. flex basis collisions on viewports under 375px; horizontal overflow risks on desktop sidebar navigation; inconsistent modal padding.
4. **Component Copy-Paste Duplication:** Navigation headers, buttons, cards, dialogs, and status badges were implemented with diverging classes across `src/pages/` rather than leveraging shared, typed design-system primitives.

The **Saheli 9.0 Bloom Renewal** eliminates these defects with a cohesive, accessible design system, a verified multilingual font stack, typed component primitives, and rigorous responsive layouts.

---

## 2. Technical Stack & Build Pipeline Inspection

### 2.1 Dependencies & Runtime Environment

- **Runtime & Package Manager:** Bun 1.4+
- **Frontend Framework:** React 19.2 (`react`, `react-dom`)
- **Routing & SSR Architecture:** `@tanstack/react-router` (v1.170.41), `@tanstack/react-start` (v1.168.60), Nitro (v3.0.260603-beta)
- **State & Data Fetching:** `@tanstack/react-query` (v5.101.4)
- **Styling Engine:** Tailwind CSS v4 (`tailwindcss` ^4.2.1, `@tailwindcss/vite` ^4.2.1, `tw-animate-css` ^1.3.4)
- **Type Checking:** TypeScript 5.8+ (`tsconfig.json`)
- **Iconography:** `lucide-react` (v0.575.0)
- **Quality Gates:** ESLint 9 (`eslint.config.js`), Prettier 3.7+ (`.prettierrc`), Vitest 4.1 (`vitest.config.ts`)

### 2.2 Build Pipeline & Aliases

`vite.config.ts` configures:

- `@` pointing to `./src`
- `@tailwindcss/vite` plugin (Tailwind CSS v4 direct CSS import `@import "tailwindcss"`)
- `tsConfigPaths`
- `tanstackStart` with SSR server entry `server`
- `nitro` with `cloudflare-module` preset for production builds
- React deduping (`react`, `react-dom`, `@tanstack/react-query`)

---

## 3. Detailed Architectural Audit

### 3.1 CSS Architecture & Token Implementation

- **Current File:** `src/styles.css` (337 lines)
- **Findings:**
  - Defined under `@theme inline` using OKLCH color notations with `--radius: 1rem`.
  - Palette carries legacy Saheli 5.0 tokens: `--plum: oklch(0.28 0.05 315)`, `--violet`, `--orchid`, `--coral`, `--peach`, `--ivory`, `--sage`.
  - Dark mode (`.dark`) and High Contrast (`.hc`) overrides exist, but certain pages bypass these variables with hardcoded Tailwind color classes (`bg-amber-600`, `text-emerald-400`, `bg-rose-50`).
  - Lacks dedicated semantic tokens for elevated surfaces, subtle borders, interactive states, and consistent focus rings.

### 3.2 Typography & Multilingual Font Stacks

- **Current Font Declaration:**
  ```css
  --font-display:
    "Noto Serif Devanagari", "Rozha One", "Noto Nastaliq Urdu", "Noto Serif Bengali",
    "Noto Serif Tamil", "Noto Serif Telugu", Georgia, serif;
  --font-body:
    system-ui, -apple-system, "Noto Sans Devanagari", "Kohinoor Devanagari", "Mukta", ...;
  ```
- **Defects Identified:**
  1. **No Web Font Embedding:** Fonts are specified purely by font-family names without web font declarations, leading to glyph substitution on devices lacking Indian language packs.
  2. **Diacritic Clipping in Indic & Urdu Scripts:** Standard Latin line-height (`1.25` or `1.375`) clips Urdu nuqtas, Bengali vowel signs (kar-s), and Devanagari matras (e.g., reph, u-kar).
  3. **Uppercase & Tracking Collisions:** Classes such as `uppercase` and `tracking-wider` on headings and badges produce broken rendering when localized to Hindi, Bengali, Tamil, etc., because Indic scripts do not have letter case and lose conjunct binding when letter-spaced.
  4. **Urdu RTL Baseline Alignment:** `[dir="rtl"]` overrides were applied at the document level, but several flex containers lacked logical CSS properties (`margin-inline-start`, `inset-inline-start`), causing asymmetric margins on mobile.

### 3.3 Layout & Shell Navigation

- **Current Component:** `src/components/layout/Shell.jsx` (736 lines)
- **Defects Identified:**
  1. **Large Monolith:** Contains `LockScreen`, `Shell`, desktop sidebar, mobile header, notification banners, update prompts, and floating mobile dock in a single file.
  2. **Desktop Sidebar Scroll Truncation:** Sidebar lists 15 navigation items vertically (`DESKTOP_NAV`). On 768px–900px vertical heights, the bottom items (Settings, Discreet toggle, Language selector) can be pushed off-screen or require awkward scrollbars.
  3. **Mobile Floating Dock:** Fixed bottom dock (`max-w-sm`) floats over content with `pb-32` padding in `main`. On small viewports (320px–360px), dock icons and text can experience touch target collisions if text scaling is set to `lg` or `xl`.
  4. **Intermediate Tablet Gap:** 768px–1023px screens collapse the sidebar and show mobile top/bottom bars, which wastes horizontal tablet real estate.

### 3.4 Shared UI Primitives (`src/components/common/ui.jsx`)

- **Current Exports:** `Btn`, `Card`, `PageTitle`, `Toggle`, `Chip`, `Sources`, `ListenButton`, `Field`, `inputCls`, `Status`.
- **Defects Identified:**
  1. `Btn` handles variants via a plain string lookup and hardcodes `rounded-2xl` and `min-h-12`.
  2. Lacks standardized sizes (`sm`, `md`, `lg`) and loading states (spinner/skeleton).
  3. No dedicated `StatCard`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `SegmentedTabs`, `Badge`, or `ResponsiveDialog` primitives. Pages implement custom ad-hoc cards and modals.

### 3.5 Page-by-Page Audit

| Page / Route                                     | Primary Role                                            | Identified Presentation & Layout Defects                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Today (`Today.jsx`)**                          | Core dashboard, cycle ring, phase status, quick logging | Heavy card nesting; greeting banner layout shifts on smaller screens; widget customizer modal lacks keyboard focus trapping. |
| **Calendar (`Calendar.jsx`)**                    | 35-day grid, cycle phase visualizer, day details        | Date cells can collide on 320px width; legend labels wrap unevenly across non-Latin scripts.                                 |
| **Log (`LogDay.jsx`)**                           | Daily symptom, flow, observation entries                | Deep scrolling form; chip selection buttons wrap onto multiple uneven rows; save feedback lacks tactile confirmation.        |
| **Insights (`Insights.jsx`)**                    | Cycle statistics, symptom patterns, BarChart            | SVG bar chart lacks responsive SVG viewBox scaling on narrow screens; legend pills wrap tightly.                             |
| **Companion (`Companion.jsx`)**                  | 15-pet virtual sanctuary, adoption, care controls       | Repaired in 8.1, but needs consolidation into Saheli Bloom design tokens, cards, and buttons.                                |
| **Self Care (`SelfCare.jsx`)**                   | Studio, soundscapes, audio player, breathing exercises  | Soundscape tiles use fixed heights; audio player controls lack unified Bloom pill styling.                                   |
| **Discover (`Discover.jsx`)**                    | Educational articles, evidence registry                 | Article cards have uneven heights; filter chips overflow horizontally without smooth scroll indicators.                      |
| **Learn (`Learn.jsx`)**                          | First period, puberty, conditions lessons               | FAQ accordion headers need script-safe line heights and unified card styling.                                                |
| **Eeve (`Ask.jsx`)**                             | Menstrual health AI companion                           | Chat bubbles have asymmetric spacing; suggested question pills can overflow horizontally.                                    |
| **FLASH (`FlashEssentials.jsx`)**                | Essentials discovery & recommendation engine            | Product recommendation cards have varied image heights; comparison drawer needs responsive stacking.                         |
| **INSTINCT (`Instinct.jsx`)**                    | Entertainment advisor & recommendations                 | Media poster grid can produce uneven text alignment on localized titles; streaming badge wrapping.                           |
| **Diva (`Diva.jsx`)**                            | Multi-agent orchestrator interface                      | Specialist cards (Eeve, FLASH, INSTINCT) need clear visual hierarchy and distinct Bloom badge accents.                       |
| **Community (`Community.jsx`)**                  | Safe anonymous peer discussion forum                    | Post cards need uniform Bloom card elevation and clear moderation badge distinction.                                         |
| **Settings & More (`Settings.jsx`, `More.jsx`)** | Preferences, backup/restore, privacy controls           | Long lists of action buttons lack visual categorization; danger zone needs clear semantic distinction.                       |

---

## 4. Remediation Plan & Architecture Blueprint

1. **Design System:** Implement **Saheli Bloom** tokens in `src/styles.css` with semantic variables:
   - Palette: `#FCF9F6` canvas, `#744E83` plum brand, `#DA8997` rose accent, `#89A99C` sage accent, `#262536` dark ink.
   - Comprehensive dark mode & high-contrast mode tokens.
   - Contrast validation: All normal text ≥ 4.5:1, large text ≥ 3.0:1 (WCAG AA).
2. **Typography Engine:**
   - Web font fallback cascade with script-specific font families for 11 distinct writing systems.
   - Universal script-safe line-height scaling (`line-height: 1.6` for Indic, `line-height: 1.8 - 2.0` for Urdu).
   - Script-aware uppercase/tracking suppression via CSS `:lang()` and `[dir="rtl"]`.
3. **Component Architecture:**
   - Create typed, accessible component library under `src/components/bloom/`: `Button`, `Card`, `Badge`, `Tabs`, `Input`, `Select`, `Dialog`, `EmptyState`, `Skeleton`, `Header`.
4. **Shell & Navigation:**
   - Refactor `Shell.jsx` into modular layout components with desktop rail, tablet navigation bar, and responsive mobile bottom dock.
5. **Screen Migration & Testing:**
   - Incrementally migrate all screens to Saheli Bloom primitives.
   - Add visual regression and layout verification tests covering 320px–1920px viewports and all 13 languages.
