# Saheli Bloom Design System Specification

**Design System:** Saheli Bloom  
**Version:** 9.0.0  
**Release:** Saheli 9.0 — Bloom Frontend Renewal  
**Date:** October 2026  
**Status:** Canonical Design System for Saheli

---

## 1. Visual Philosophy & Design Principles

Saheli Bloom is a modern, culturally grounded, privacy-first healthcare design language tailored for diverse women and adolescents across India.

### Core Principles

1. **Calm & Non-Clinical:** Move away from harsh antiseptic whites, clinical alarms, or stereotypical bright pinks. Instead, Saheli Bloom employs a soothing palette of warm plum, rose, sage, and ivory canvas.
2. **Mobile-First & Touch-Native:** All interactive elements provide accessible touch targets of at least 44×44px (with 48px defaults for primary actions), comfortable thumb reaches, and resilient layouts on 320px screens.
3. **Multilingual by Design:** Typography, line heights, and layout spacing are calibrated for 11 distinct writing systems and 13 Indian languages, ensuring zero clipped diacritics or colliding conjuncts.
4. **Local-First & Discreet:** Visual cues reinforce user privacy, discreet mode obfuscation, client-side encryption, and offline autonomy.
5. **Universal Accessibility (WCAG 2.2 AA):** Strict color contrast validation across all light, dark, and high-contrast modes, with visible focus rings and non-color dependent state indicators.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Core Palette

| Token Name      | Hex Code  | Role                  | Description                                                              |
| --------------- | --------- | --------------------- | ------------------------------------------------------------------------ |
| **Warm Canvas** | `#FCF9F6` | Background            | Soft, non-glare warm ivory canvas that reduces visual fatigue.           |
| **Plum Brand**  | `#744E83` | Brand Primary         | Signature dignified plum brand interactive color.                        |
| **Rose Accent** | `#DA8997` | Brand Accent / Period | Warm rose tone for menstrual indicators and caring accents.              |
| **Sage Accent** | `#89A99C` | Supportive Secondary  | Calming herbal sage green for wellness, progress, and supportive cards.  |
| **Dark Ink**    | `#262536` | Text Primary          | Deep rich charcoal ink for optimal legibility without harsh black glare. |

### 2.2 Light Mode Semantic Tokens

| Variable                   | Value     | WCAG Contrast on Canvas   | Purpose                                             |
| -------------------------- | --------- | ------------------------- | --------------------------------------------------- |
| `--color-canvas`           | `#FCF9F6` | —                         | Root viewport background                            |
| `--color-surface`          | `#FFFFFF` | 1.05:1                    | Base card and container surface                     |
| `--color-surface-elevated` | `#FFFFFF` | —                         | Floating docks, modals, dropdowns (elevated shadow) |
| `--color-surface-subtle`   | `#F4EFEA` | —                         | Nested section containers, table headers            |
| `--color-text-primary`     | `#262536` | **13.8:1** (AAA)          | Headings, primary body text                         |
| `--color-text-secondary`   | `#5B566E` | **5.4:1** (AA)            | Subtitles, labels, hints                            |
| `--color-text-muted`       | `#7C768E` | **3.5:1** (Large text AA) | Timestamps, secondary metadata                      |
| `--color-brand-primary`    | `#744E83` | **6.35:1** (AA)           | Primary buttons, active tabs, brand icons           |
| `--color-brand-primary-fg` | `#FFFFFF` | **6.73:1** (AA)           | Text on primary brand buttons                       |
| `--color-brand-accent`     | `#DA8997` | —                         | Menstrual phase indicators, soft pill backgrounds   |
| `--color-brand-secondary`  | `#89A99C` | —                         | Self-care activities, follicular phase indicators   |
| `--color-border-subtle`    | `#EAE4DC` | —                         | Card borders, dividers                              |
| `--color-border-strong`    | `#D2C8BC` | —                         | Interactive input borders, button outlines          |
| `--color-focus-ring`       | `#744E83` | —                         | 2px solid keyboard focus indicator with 2px offset  |
| `--color-state-success`    | `#24734F` | **5.2:1** (AA)            | Recorded logs, completed milestones, online ready   |
| `--color-state-warning`    | `#965B00` | **5.1:1** (AA)            | Irregular cycle cautions, review dates              |
| `--color-state-danger`     | `#B8283E` | **5.5:1** (AA)            | Red-flag medical emergency alerts, destructive wipe |
| `--color-state-info`       | `#2A6496` | **5.3:1** (AA)            | Educational notes, informational banners            |

### 2.3 Dark Mode Semantic Tokens (`.dark`)

| Variable                   | Value     | Contrast on Dark Canvas | Purpose                              |
| -------------------------- | --------- | ----------------------- | ------------------------------------ |
| `--color-canvas`           | `#16141D` | —                       | Dark viewport background             |
| `--color-surface`          | `#1E1B26` | —                       | Dark card surface                    |
| `--color-surface-elevated` | `#272332` | —                       | Elevated dark popovers & modals      |
| `--color-surface-subtle`   | `#231F2E` | —                       | Nested sections                      |
| `--color-text-primary`     | `#F7F5F9` | **15.2:1** (AAA)        | Dark mode headings and body          |
| `--color-text-secondary`   | `#ABA4B8` | **6.8:1** (AA)          | Dark mode subtitles & secondary text |
| `--color-text-muted`       | `#857D94` | **4.5:1** (AA)          | Dark mode captions and timestamps    |
| `--color-brand-primary`    | `#9F75B0` | **5.8:1** (AA)          | Interactive buttons in dark mode     |
| `--color-brand-primary-fg` | `#16141D` | **6.2:1** (AA)          | Text on primary buttons in dark mode |
| `--color-border-subtle`    | `#2D293A` | —                       | Dark mode dividers                   |
| `--color-border-strong`    | `#453E54` | —                       | Dark mode input borders              |
| `--color-state-success`    | `#4EAB80` | **6.4:1** (AA)          | Dark success indicators              |
| `--color-state-warning`    | `#E5A43B` | **7.1:1** (AA)          | Dark warning indicators              |
| `--color-state-danger`     | `#E6536C` | **5.9:1** (AA)          | Dark urgent / red-flag alerts        |
| `--color-state-info`       | `#6FA2D6` | **6.5:1** (AA)          | Dark info indicators                 |

---

## 3. Spacing, Radii & Elevation Scale

### 3.1 Spacing Scale

Saheli Bloom uses an 8pt-based rhythm with half-steps:

- `space-1`: 4px (tight badge padding)
- `space-2`: 8px (icon gaps, chip spacing)
- `space-3`: 12px (form input vertical padding, card inner gaps)
- `space-4`: 16px (standard component gutters, card padding on mobile)
- `space-5`: 20px (card padding on desktop)
- `space-6`: 24px (section margins)
- `space-8`: 32px (major layout blocks)
- `space-12`: 48px (page headers and terminal content clearance)

### 3.2 Border Radius Scale

- `radius-sm`: 8px (chips, compact badges)
- `radius-md`: 12px (inputs, dropdown selects, tooltips)
- `radius-lg`: 16px (standard buttons, secondary cards)
- `radius-xl`: 20px (primary cards, modal dialogs)
- `radius-2xl`: 28px (editorial feature cards, sanctuary cards)
- `radius-full`: 9999px (pills, floating action buttons, avatars)

### 3.3 Elevation & Shadows

- `shadow-bloom-subtle`: `0 2px 8px -1px rgba(38, 37, 54, 0.04), 0 1px 3px 0 rgba(38, 37, 54, 0.02)`
- `shadow-bloom-card`: `0 6px 20px -3px rgba(38, 37, 54, 0.06), 0 2px 6px -1px rgba(38, 37, 54, 0.03)`
- `shadow-bloom-elevated`: `0 12px 32px -4px rgba(38, 37, 54, 0.08), 0 4px 12px -2px rgba(38, 37, 54, 0.04)`
- `shadow-bloom-modal`: `0 24px 48px -8px rgba(38, 37, 54, 0.16), 0 8px 16px -4px rgba(38, 37, 54, 0.08)`

---

## 4. Layout Architecture & Breakpoints

| Breakpoint          | Width Range     | Layout Behavior                                                                   |
| ------------------- | --------------- | --------------------------------------------------------------------------------- |
| **Mobile Compact**  | 320px – 374px   | Single column, 12px page gutters, full-width cards, compact bottom dock.          |
| **Mobile Standard** | 375px – 430px   | Single column, 16px page gutters, 2-column small grid cards.                      |
| **Tablet**          | 768px – 1023px  | Dual column dashboards, 24px page gutters, compact top-header with category tabs. |
| **Desktop**         | 1024px – 1279px | Sticky left navigation rail (260px), 32px canvas padding, 2-3 column grids.       |
| **Desktop Wide**    | 1280px+         | Left navigation rail (280px), centered max-w-6xl canvas (1152px).                 |

---

## 5. Accessibility Compliance Checklist (WCAG 2.2 AA)

- [x] All normal text meets or exceeds 4.5:1 contrast against its background.
- [x] All large text (≥18pt or ≥14pt bold) meets or exceeds 3.0:1 contrast.
- [x] Visible focus rings (`ring-2 ring-primary ring-offset-2`) are active on all keyboard navigations.
- [x] Touch targets are minimum 44×44px with 48px defaults for high-frequency actions.
- [x] Status indicators utilize text labels and icons in addition to color.
- [x] Motion-sensitive animations respect `prefers-reduced-motion: reduce`.
- [x] Layout scales gracefully up to 200% browser text zoom without horizontal clipping.
