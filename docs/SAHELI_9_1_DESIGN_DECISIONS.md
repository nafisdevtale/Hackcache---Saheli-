# Saheli 9.1 — Design Decisions: Modern Wellness Intelligence

**Document:** Visual & Interactive Design System Decisions  
**Release:** Saheli 9.1  
**Aesthetic Theme:** Modern Wellness Intelligence (Warm, Calm, Contemporary, Youth-friendly, Accessible)

---

## 1. Design Direction: Modern Wellness Intelligence

The visual language of Saheli 9.1 shifts from a collection of flat cards to an intentional, high-craft editorial wellness platform.

### Core Visual Pillars:

1. **Warm Canvas Foundation (`#FCF9F6`):**
   - Soft off-white canvas that eliminates harsh LCD glare, creating an inviting, tranquil reading environment.
2. **Deep Plum Interactive Brand (`#744E83` / `#5A3668`):**
   - High-contrast, dignified brand anchor providing WCAG 2.2 AAA text contrast (> 7:1) on light surfaces.
3. **Rose & Sage Biological Accents (`#DA8997` & `#89A99C`):**
   - Rose signifies menstrual and active phase rhythm without clinical alarm.
   - Sage signifies fertile balance, recovery, calm, and soothing self-care.
4. **Dark Ink Typography (`#262536`):**
   - Rich, near-black ink avoiding pure digital `#000000` to prevent eye strain.
5. **Tactile & Ergonomic Surfaces:**
   - 20px–28px rounded contours (`rounded-2xl`, `rounded-3xl`) that feel soft and friendly on mobile touchscreens.
   - Micro-elevation shadows (`shadow-bloom-card`, `shadow-bloom-subtle`) that separate interactive surfaces without muddy borders.

---

## 2. Interaction & Component Standard

Every interactive component follows unified behavior:

### Buttons & Interactive CTAs:

- **Primary:** Plum gradient to Rose (`from-primary to-plum-600`), bold white text, subtle elevation, micro-scale press effect (`active:scale-[0.98]`).
- **Secondary:** Sage tint (`bg-secondary/40 border border-secondary`), muted foreground, soft hover.
- **Outline / Ghost:** Border with border-tokens (`border-border/80 hover:bg-muted/60`), transparent backgrounds.
- **Destructive:** Deep crimson (`bg-destructive/10 text-destructive border-destructive/20`).
- **Ergonomics:** Minimum height of 44px–48px across all touch surfaces with generous horizontal padding.

### Segmented Controls & Tabs:

- Capsule shape with pill selector (`rounded-full p-1 bg-muted/60`).
- Active segment renders in elevated card background (`bg-card text-foreground font-bold shadow-xs`).
- Smooth transitions on selection change.

### Cards & Layout Containers:

- **Standard Card (`bloom-card`):** Clean white surface, 1px border (`border-border/70`), 24px inner padding, `shadow-bloom-card`.
- **Hero Rhythm Card (`bloom-hero-card`):** Ambient linear gradient from Rose tint to Sage tint with dark ink text.
- **Interactive Action Card:** Active hover border shift (`hover:border-primary/40 hover:shadow-soft`).

---

## 3. Empty-Space & Density Engineering

### The Problem in Saheli 9.0:

- Arbitrary `grid-cols-2` with `items-start` produced vertical misalignment when cards had disparate text lengths.
- Fixed height containers left blank voids on smaller devices and awkward stretches on desktop.

### The Solution in Saheli 9.1:

1. **Content-Driven Proportions:**
   - Eliminate fixed vertical constraints; cards stretch to content height.
   - Use CSS Flex column wrapping and CSS Grid with `auto-rows-fr` or balanced dual-column masonry.
2. **Unified Spacing Scale:**
   - Inner card padding: `p-4 sm:p-5 lg:p-6`.
   - Grid gap: `gap-4 sm:gap-5 lg:gap-6`.
   - Vertical section cadence: `space-y-6 sm:space-y-8`.
3. **Meaningful Content Placement:**
   - Primary action (Log Today) and today's cycle status are always visible within the first 600px of the viewport.
   - Zero empty decorative placeholder boxes.
