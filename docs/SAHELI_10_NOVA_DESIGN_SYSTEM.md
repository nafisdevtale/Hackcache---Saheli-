# SAHELI 10.0 — PROJECT NOVA DESIGN SYSTEM

## Purposeful · Calm · Smart · Beautiful · Human

**Project:** Saheli — Your Cycle, Your Rhythm  
**Codename:** Project Nova  
**Branch:** `feature/saheli-10-nova`  
**Date:** October 2026

---

### 1. Design Philosophy & Aesthetic Vision

Project Nova moves away from heavy gradients, excessive glassmorphism, and endless cluttered card walls. It adopts an **editorial wellness identity**:

- **Soft, Sophisticated Color Relationships:** Deep plum and warm terracotta accents grounded in calming warm-neutral backgrounds.
- **Thoughtful Editorial Typography:** Expressive heading hierarchies balanced with generous line heights that never clip multilingual diacritics.
- **Comfortable, Intentional Spacing:** Content-driven sizing that eliminates awkward blank gaps without overcrowding information.
- **Tactile Physics:** Subtle organic micro-press reactions (`active:scale-[0.98] transition-transform`) giving physical reassurance to interactive elements.

---

### 2. Semantic Color Token Matrix

| Token Name              | Light Theme Value           | Dark Theme Value              | Semantic Meaning & Usage                                          |
| ----------------------- | --------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `--nova-bg`             | `#FAF8F5` (Warm Cream)      | `#141216` (Deep Amethyst)     | Application canvas background.                                    |
| `--nova-surface`        | `#FFFFFF` (Pure White)      | `#1E1B22` (Soft Plum Surface) | Elevated cards, dialogs, and navigation containers.               |
| `--nova-surface-subtle` | `#F4EFEA` (Warm Sand)       | `#26222B` (Muted Purple)      | Secondary card backgrounds, tags, and table rows.                 |
| `--nova-primary`        | `#704875` (Editorial Plum)  | `#C8A8CF` (Radiant Lavender)  | Primary interactive actions, active navigation states.            |
| `--nova-primary-soft`   | `rgba(112, 72, 117, 0.12)`  | `rgba(200, 168, 207, 0.15)`   | Active chip fills, badge backgrounds, focus halos.                |
| `--nova-period`         | `#C85265` (Rose Terracotta) | `#F28D9E` (Warm Coral)        | Menstrual bleeding indicators, period days, companion badges.     |
| `--nova-period-soft`    | `rgba(200, 82, 101, 0.12)`  | `rgba(242, 141, 158, 0.15)`   | Period highlights, active logging chips.                          |
| `--nova-text`           | `#1F1A24` (Charcoal Plum)   | `#F6F4F8` (Off-white)         | High-contrast body copy and primary headings (>= 7:1 contrast).   |
| `--nova-text-muted`     | `#665E6D` (Muted Violet)    | `#A9A2AF` (Light Grey Violet) | Secondary descriptions, timestamps, metadata (>= 4.5:1 contrast). |
| `--nova-border`         | `rgba(112, 72, 117, 0.15)`  | `rgba(200, 168, 207, 0.16)`   | Clean, non-distracting organic card borders.                      |
| `--nova-border-subtle`  | `rgba(112, 72, 117, 0.08)`  | `rgba(200, 168, 207, 0.08)`   | Divider lines, table cell boundaries.                             |

---

### 3. Typography Scale & Multilingual Rhythm

| Scale Tier     | Font Size          | Line Height     | Tracking   | Recommended Usage                                 |
| -------------- | ------------------ | --------------- | ---------- | ------------------------------------------------- |
| `nova-display` | `2.25rem` (36px)   | `1.25` (45px)   | `-0.025em` | Hero titles, primary cycle day counter on Today.  |
| `nova-h1`      | `1.75rem` (28px)   | `1.3` (36.4px)  | `-0.02em`  | Page main titles (Calendar, Insights, Companion). |
| `nova-h2`      | `1.25rem` (20px)   | `1.4` (28px)    | `-0.015em` | Section headers and card category titles.         |
| `nova-h3`      | `1.0rem` (16px)    | `1.45` (23.2px) | `-0.01em`  | Micro-headings, widget titles, modal titles.      |
| `nova-body`    | `0.9375rem` (15px) | `1.6` (24px)    | `normal`   | Default body copy, educational paragraphs.        |
| `nova-caption` | `0.8125rem` (13px) | `1.5` (19.5px)  | `0.01em`   | Secondary metadata, timestamps, card captions.    |
| `nova-tiny`    | `0.6875rem` (11px) | `1.4` (15.4px)  | `0.02em`   | Pill badges, uppercase labels, micro-tags.        |

**Multilingual Shaping Guarantee:** All typography styles use `leading-relaxed` or line-heights $\ge 1.5$ to ensure that diacritics in Devanagari (हिन्दी, मराठी), Eastern Nagari (বাংলা, অসমীয়া), Gurmukhi (ਪੰਜਾਬੀ), Dravidian scripts (தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം), and Nastaliq Urdu (اردو) never collide with adjacent elements or card borders.

---

### 4. Spacing, Elevation & Surface Architecture

- **Card Architecture:**
  - `nova-card`: `bg-surface border border-nova-border rounded-2xl p-4 sm:p-5 shadow-xs transition-all`
  - `nova-card-elevated`: `bg-surface border border-nova-border/80 rounded-3xl p-6 sm:p-8 shadow-md`
  - `nova-card-interactive`: `nova-card hover:border-nova-primary/40 active:scale-[0.98] cursor-pointer`
- **Button System:**
  - `Primary`: High-contrast filled plum button with min-h $\ge 48\text{px}$ on mobile for dominant actions (Log Today, Save).
  - `Secondary`: Clean outline button with subtle background fill for navigation and secondary actions.
  - `Quiet / Ghost`: Minimal button for dismiss, reset, or inline helpers without visual clutter.
  - `Icon`: Rounded tactile target measuring strictly $\ge 44 \times 44\text{px}$.
- **Touch Target Safeguard:** Every interactive control satisfies WCAG 2.2 Criterion 2.5.8 ($\ge 44\text{px}$ touch targets on touchscreens).
