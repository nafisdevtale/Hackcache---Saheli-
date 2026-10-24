# Saheli Bloom Component Architecture Specification

**Document:** Component Architecture & Design Primitives  
**Release:** Saheli 9.0 — Bloom Frontend Renewal  
**Date:** October 2026  
**Namespace:** `@/components/bloom/*` & `@/components/common/ui.jsx`

---

## 1. Architectural Principles

1. **Composition Over Duplication:** Rather than duplicating raw Tailwind class strings across 18+ routes, components compose standardized primitives.
2. **Accessible by Default:** All interactive components include explicit ARIA roles, states (`aria-pressed`, `aria-expanded`, `aria-selected`), focus rings, and touch targets ≥ 44×44px.
3. **Responsive & Script-Safe:** Flexible layouts utilize `min-w-0`, `min-h-[...]`, and logical spacing (`padding-inline`, `margin-inline`) to support 320px–1920px viewports and Urdu RTL.
4. **Seamless Backwards Compatibility:** `src/components/common/ui.jsx` re-exports or adapts the new Bloom primitives so existing page routes remain 100% operational during the phased renewal.

---

## 2. Component Catalog & API Contracts

### 2.1 Buttons (`Button.jsx` / `Btn`)

- **Variants:**
  - `primary`: Solid Plum brand background (`bg-primary text-primary-foreground hover:bg-primary/95 shadow-bloom-subtle`)
  - `secondary`: Sage tint (`bg-secondary text-secondary-foreground hover:bg-secondary/80`)
  - `accent`: Rose accent (`bg-accent text-accent-foreground hover:bg-accent/80`)
  - `outline`: Bordered surface (`border border-border bg-card text-foreground hover:bg-muted/60 shadow-bloom-subtle`)
  - `ghost`: Transparent interactive (`text-foreground hover:bg-muted/60`)
  - `danger`: Red-flag emergency / destructive action (`bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm`)
- **Sizes:**
  - `sm`: Min height 38px, text-xs, px-3 py-1.5, rounded-xl
  - `md`: Min height 44px, text-sm, px-4 py-2.5, rounded-2xl (default)
  - `lg`: Min height 50px, text-base, px-6 py-3, rounded-2xl
- **Props:** `variant`, `size`, `isLoading`, `leftIcon`, `rightIcon`, `className`, `disabled`, `children`.

### 2.2 Cards (`Card.jsx` / `AppCard`)

- **Variants:**
  - `default`: Base white/dark-card surface with subtle border and 1.25rem radius (`bloom-card`).
  - `elevated`: Floating card with soft ambient drop shadow (`bloom-card-elevated`).
  - `glass`: Translucent frosted glass card with 16px backdrop blur (`bloom-glass`).
  - `subtle`: Flat muted background container (`bg-muted/50 border border-border/60`).
  - `interactive`: Focusable and hoverable card with tactile press animation and border transition.
- **Props:** `variant`, `padding` (`none`, `sm`, `md`, `lg`), `className`, `children`, `as` (`section`, `article`, `div`).

### 2.3 Status Badges (`StatusBadge.jsx`)

- **Tones:**
  - `success`: Sage/emerald tint with check icon (`bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20`)
  - `warning`: Warm amber tint with alert triangle (`bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20`)
  - `danger`: Crimson/urgent tint with alert circle (`bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20`)
  - `info`: Calm blue tint with info icon (`bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20`)
  - `neutral`: Slate/muted tint (`bg-muted text-muted-foreground border-border`)
- **Props:** `tone`, `icon`, `size`, `label`, `children`, `className`.

### 2.4 Headers (`PageHeader.jsx`, `SectionHeader.jsx`)

- **PageHeader:**
  - Semantic `<header>` containing optional pill tag, responsive fluid heading (`font-display font-extrabold tracking-tight`), optional subtitle, and optional header action slot.
  - Script-safe line heights (`leading-normal` to `leading-snug` preventing ascender truncation).
- **SectionHeader:**
  - Compact section divider with title, count badge, and optional action link.

### 2.5 Form Fields (`TextField.jsx`, `SelectField.jsx`)

- Standardized labels, helper descriptions, error alerts with `role="alert"`, logical `text-start` alignment, and touch-friendly min-h-12 inputs.

### 2.6 States & Feedback (`EmptyState.jsx`, `ErrorState.jsx`, `LoadingSkeleton.jsx`)

- **EmptyState:** Calming icon/art container, title, supportive description, and primary CTA.
- **ErrorState:** Inline or card alert with error message and retry button.
- **LoadingSkeleton:** Shimmer pulse placeholder for asynchronous routes and images.

### 2.7 Modals & Dialogs (`ResponsiveDialog.jsx`, `ConfirmationDialog.jsx`)

- Accessible dialog container with backdrop blur, focus trapping, Escape key listener, and mobile bottom-sheet fallback.
