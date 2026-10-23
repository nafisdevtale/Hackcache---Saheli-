# SAHELI Design System Specifications

## 1. Design Philosophy & Product Personality

Saheli is designed as a calm, dignified, culturally respectful, and private companion for Indian women and teenagers.

- **Personality:** Supportive, Intelligent, Calm, Warm, Private, Premium, Accessible.
- **Visual Tone:** Organic, grounding, non-clinical yet scientifically dependable. No garish saturated neons, childish cartoons, or generic SaaS gradients.

---

## 2. Color Palette & Semantic Tokens

### Core Palette

- **Iris Purple (`#7658A8` / `oklch(0.52 0.14 300)`):** Primary brand accent, focused states, and key navigational highlights.
- **Dusty Rose (`#D78388` / `oklch(0.68 0.11 18)`):** Period flow indicator, cycle markers, and warm feminine accents.
- **Soft Peach (`#F1B9A4` / `oklch(0.82 0.08 45)`):** Secondary containers, soft highlights, and greeting surfaces.
- **Sage Green (`#94B7A3` / `oklch(0.74 0.06 150)`):** Wellness states, safe symptoms, positive health feedback.
- **Warm Ivory (`#FCF8F4` / `oklch(0.98 0.01 65)`):** Canvas background in light mode; gentle on eyes in dim light.
- **Deep Ink (`#292338` / `oklch(0.24 0.04 290)`):** Primary typography in light mode; background surface in dark mode.

### Semantic Tokens (Light & Dark Mode)

| Semantic Role            | Light Mode Value                      | Dark Mode Value                        | Usage Description                         |
| ------------------------ | ------------------------------------- | -------------------------------------- | ----------------------------------------- |
| `--background`           | `oklch(0.98 0.01 65)` (Warm Ivory)    | `oklch(0.18 0.03 290)` (Deep Night)    | Page body background                      |
| `--foreground`           | `oklch(0.24 0.04 290)` (Deep Ink)     | `oklch(0.96 0.01 65)` (Soft Cream)     | Default text color                        |
| `--card`                 | `oklch(0.995 0.005 65)` (Pure Canvas) | `oklch(0.23 0.03 290)` (Muted Surface) | Elevated cards, modals, sheets            |
| `--card-foreground`      | `oklch(0.24 0.04 290)`                | `oklch(0.96 0.01 65)`                  | Card body text                            |
| `--primary`              | `oklch(0.50 0.14 300)` (Iris Purple)  | `oklch(0.72 0.12 300)` (Luminous Iris) | Primary action buttons, active navigation |
| `--primary-foreground`   | `oklch(0.99 0 0)` (White)             | `oklch(0.18 0.03 290)`                 | Text inside primary buttons               |
| `--secondary`            | `oklch(0.93 0.04 150)` (Soft Sage)    | `oklch(0.28 0.04 150)` (Dark Sage)     | Secondary buttons, pills                  |
| `--secondary-foreground` | `oklch(0.28 0.06 150)`                | `oklch(0.90 0.04 150)`                 | Text inside secondary components          |
| `--period`               | `oklch(0.62 0.13 18)` (Dusty Rose)    | `oklch(0.70 0.13 18)` (Vibrant Rose)   | Actual period days                        |
| `--period-foreground`    | `oklch(0.99 0 0)`                     | `oklch(0.15 0.04 18)`                  | Text inside period markers                |
| `--urgent`               | `oklch(0.48 0.20 27)` (Crimson Red)   | `oklch(0.65 0.22 27)`                  | Emergency red flags, 112/108 alerts       |
| `--urgent-soft`          | `oklch(0.96 0.03 27)`                 | `oklch(0.26 0.06 27)`                  | Urgent banner backgrounds                 |
| `--border`               | `oklch(0.89 0.015 65)`                | `oklch(0.30 0.02 290)`                 | Card borders, dividers                    |
| `--input`                | `oklch(0.85 0.02 65)`                 | `oklch(0.32 0.02 290)`                 | Form controls, input borders              |
| `--ring`                 | `oklch(0.50 0.14 300)`                | `oklch(0.72 0.12 300)`                 | Focus indicators (3px outline)            |

---

## 3. Typography & Dual-Script Harmony

- **Body Font Stack:**
  `system-ui, -apple-system, "Noto Sans Devanagari", "Nirmala UI", "Mukta", sans-serif`
  Optimized for seamless rendering across Latin (English) and Devanagari (Hindi, Marathi) scripts, with clean legibility on low-end Android mobile displays.
- **Display / Editorial Font Stack:**
  `"Noto Serif Devanagari", "Rozha One", Georgia, serif`
  Used sparingly for warm, welcoming headlines, book-like guidance cards, and editorial health insights.
- **Scale:**
  - Base: 16px (1rem) with 1.55 line-height.
  - Large Text Mode: 112.5% (18px base).
  - Extra Large Text Mode: 131% (21px base).

---

## 4. Accessibility & Non-Color Cues

- **Period Distinction:** Never rely on color alone.
  - Logged Period: Solid color + teardrop/blood icon or "Period Day X" text tag.
  - Predicted Period: Diagonal striped hatching pattern (`.predicted-pattern`) + dotted border + "Estimated" label.
  - Emergency / Red Flag: Warning triangle icon + `.urgent-pattern` border + plain-text alert badge.
- **Touch Targets:** Minimum 44×44px on all interactive buttons, calendar cells, and navigation tabs.
- **Contrast Ratios:** Minimum 4.5:1 for body copy; 3:1 for large display headlines against their respective card surfaces. High-Contrast mode (`.hc`) forces 7:1+ contrast.
