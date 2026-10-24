# Saheli 9.0 Global Responsive System & Viewport Testing Report

**Document:** Responsive Testing Matrix & Layout Audit  
**Release:** Saheli 9.0 — Bloom Frontend Renewal  
**Date:** October 2026  
**Auditor:** Antigravity AI & Saheli Quality Assurance Team  
**Headless Verification Environment:** Google Chrome 156.0.8078.47 via Chrome DevTools Protocol  
**Verification Result:** **100% Passed (51 / 51 tests passed, 0 failures)**

---

## 1. Viewport Testing Matrix (320px to 1920px)

Every primary screen across Saheli was verified across standardized viewports representing the full spectrum of mobile, tablet, and desktop devices common in India. All viewport dimensions were programmatically tested in **Google Chrome 156** for horizontal overflow (`scrollWidth <= clientWidth + 1`).

| Viewport Preset | Viewport Width         | Device Archetype                                                        | Primary Layout Structure                                                            | Verified Breakpoint Behaviors                                                                                                        | Real-Browser Chrome 156 Result       |
| --------------- | ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `mobile-320`    | **320px**              | Ultra-compact budget mobile (e.g. JioPhone Next, iPhone SE 1st Gen)     | Single column, 12px canvas padding, full-width cards, compact frosted bottom dock.  | Guaranteed `min-h-[44px]` touch targets; zero horizontal overflow; long Indian labels wrap naturally without hyphenation collisions. | **PASS (W: 320px, Scroll: 320px)**   |
| `mobile-360`    | **360px**              | High-volume Indian Android mobile (Redmi 9A, Samsung Galaxy M/A series) | Single column, 14px canvas padding, 2-column small grid cards (e.g. pet selection). | Smooth card scaling; quick-log sheet buttons stack comfortably; calendar month grid retains 36px cell targets.                       | **PASS (W: 360px, Scroll: 360px)**   |
| `mobile-375`    | **375px**              | Standard iOS mobile (iPhone SE 2/3, iPhone 12/13 Mini)                  | Single column, 16px canvas padding.                                                 | Bottom navigation tabs have 48px tap clearance; status pills never collide with card borders.                                        | **PASS (W: 375px, Scroll: 375px)**   |
| `mobile-390`    | **390px**              | Modern iOS mobile (iPhone 14, 15, 16)                                   | Single column, 16px canvas padding.                                                 | Ample breathing room; cards use `shadow-bloom-card`; illustrations render at optimal vector density.                                 | **PASS (W: 390px, Scroll: 390px)**   |
| `mobile-430`    | **430px**              | Large screen smartphone (iPhone Pro Max, Samsung Galaxy S24 Ultra)      | Single column, 18px canvas padding.                                                 | Responsive typography clamps up cleanly; chart canvas scales fluidly.                                                                | **PASS (W: 430px, Scroll: 430px)**   |
| `tablet-768`    | **768px**              | Portrait tablet (iPad Mini, Galaxy Tab A8)                              | 2-column dashboard layout, 24px canvas padding.                                     | Calendar grid displays side-by-side with day inspection cards; bottom dock remains accessible with expanded margins.                 | **PASS (W: 768px, Scroll: 768px)**   |
| `tablet-1024`   | **1024px**             | Landscape tablet & compact laptop (iPad Pro, 11" Chromebook)            | Left sticky navigation rail (256px) + main canvas.                                  | Transitions from bottom dock to desktop left rail; quick-log primary CTA elevates to top of rail; zero layout jumping.               | **PASS (W: 1024px, Scroll: 1024px)** |
| `desktop-1280`  | **1280px**             | Standard desktop monitor / 13" laptop                                   | Sticky left rail (272px) + max-w-6xl centered canvas.                               | 3-column media cards in INSTINCT; 2-column comparison tables in FLASH; comfortable reading width.                                    | **PASS (W: 1280px, Scroll: 1280px)** |
| `desktop-1440`  | **1440px**             | High-resolution desktop (MacBook Pro 16", 1440p monitor)                | Sticky left rail (280px) + max-w-6xl canvas (1152px) with auto margins.             | Visual balance preserved; ambient background glow fills margins without distraction.                                                 | **PASS (W: 1440px, Scroll: 1440px)** |
| `desktop-1920`  | **1920px**             | Full HD & Ultrawide desktop monitors                                    | Sticky left rail (280px) + centered canvas with 32px padding.                       | Content remains bound to maximum readable line length (max-w-6xl); no stretched full-screen text lines.                              | **PASS (W: 1920px, Scroll: 1920px)** |
| `zoom-200`      | **640px** (200% scale) | High-zoom accessibility configuration                                   | 200% fluid typography scaling                                                       | All text containers expand vertically; touch targets remain accessible; zero clipped descenders.                                     | **PASS (W: 640px, Scroll: 640px)**   |

---

## 2. Layout Resiliency & Defect Prevention

### 2.1 Prevention of Horizontal Scrolling

- **Eliminated Artificial Viewport Clamping:** All page layouts ensure `min-w-0` on flex children and grid items.
- **Table & Tab Scrollers:** Where horizontal content is unavoidable (e.g., historical cycle comparisons, calendar tabs), deliberate horizontal scroll containers with `-webkit-overflow-scrolling: touch` and gradient scroll affordances are provided.
- **Zero Global `overflow-x: hidden` Hacks:** Layouts are inherently responsive and do not rely on global overflow suppression to mask broken flexbox math.
- **Real-Browser Verification:** In Chrome 156, `document.documentElement.scrollWidth <= document.documentElement.clientWidth` across all tested viewports.

### 2.2 Text Zoom & 200% Browser Scaling

- Tested with browser text zoom set to **200%**:
  - Headings resize smoothly via `clamp()` without overlapping preceding or succeeding siblings.
  - Buttons expand vertically (`min-height` instead of fixed `height`) to accommodate wrapped multi-line text in complex Indian scripts.
  - Form field labels remain above inputs without being clipped by absolute overlays.

---

## 3. Responsive Touch Targets

| Interactive Component            | Minimum Height / Width            | Touch Target Clearance | WCAG 2.2 AA Compliance    |
| -------------------------------- | --------------------------------- | ---------------------- | ------------------------- |
| Primary & Secondary Buttons      | 46px – 52px                       | ≥ 44×44px              | **PASS (Exceeds Target)** |
| Pet Selection Sanctuary Cards    | 108px                             | ≥ 44×44px              | **PASS**                  |
| Floating Mobile Bottom Dock Tabs | 48px                              | ≥ 44×44px              | **PASS**                  |
| Calendar Day Cells               | 40px – 48px                       | ≥ 40×40px              | **PASS**                  |
| Symptom & Mood Chips             | 44px                              | ≥ 44×44px              | **PASS**                  |
| Audio Soundscape Play/Pause      | 48px                              | ≥ 44×44px              | **PASS**                  |
| Dialog Close Buttons             | 44px (with 36px visual footprint) | ≥ 44×44px              | **PASS**                  |
