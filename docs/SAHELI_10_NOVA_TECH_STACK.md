# SAHELI 10.0 — PROJECT NOVA TECH STACK & ARCHITECTURE

## Modern, Reliable, Typed Frontend Infrastructure

**Project:** Saheli — Your Cycle, Your Rhythm  
**Codename:** Project Nova  
**Branch:** `feature/saheli-10-nova`  
**Date:** October 2026

---

### 1. Technology Selection Overview

The technology selection for Project Nova strictly fulfills HackCache 2026 criteria: prioritizing **reliability, accessibility, technical clarity, and maintainability**. Rather than introducing unnecessary or unvetted external dependencies, Nova harnesses modern, cohesive web standards.

| Layer                         | Technology                                  | Version             | Architectural Purpose & Rationale                                                                                |
| ----------------------------- | ------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Runtime & Core UI**         | React                                       | `19.2.0`            | High-performance component rendering with concurrent features and server-side rendering (SSR) hydration support. |
| **Language**                  | TypeScript / TSX                            | `5.8.0`             | End-to-end type safety for all new Nova components, interfaces, view models, and route contracts.                |
| **Routing**                   | TanStack Router & TanStack Start            | `1.170.x`           | Type-safe, declarative file-based and context-aware client/server routing with code-splitting.                   |
| **Build & Dev Server**        | Vite + Nitro SSR                            | `8.1.5` / Nitro     | Instant Hot Module Replacement (HMR), tree-shaking, and lightweight zero-config SSR worker deployment.           |
| **Styling & Design Tokens**   | Tailwind CSS v4 + CSS Custom Properties     | `4.2.1`             | Unified semantic utility classes with CSS variables for dynamic dark/light/discreet theming.                     |
| **Iconography**               | Lucide React                                | `0.575.0`           | Accessible, tree-shakeable SVG icons with strict `aria-hidden` and `aria-label` conventions.                     |
| **State & Local Persistence** | IndexedDB (idb-keyval) + AES-GCM Encryption | Web Standards       | Local-first zero-telemetry storage model protecting user privacy on shared mobile devices.                       |
| **Testing Framework**         | Vitest + React Testing Library              | `4.1.11` / `16.0.0` | Blazing-fast unit and component DOM test runner with jsdom environment.                                          |
| **Visual QA Engine**          | Chrome DevTools Protocol (CDP)              | Chrome 156 Headless | Real browser automation for viewport responsiveness, multilingual reflow, and zero-error-boundary validation.    |

---

### 2. TypeScript Migration Strategy

Project Nova introduces a clean typed component architecture under `src/components/nova/`:

1. **Strict Component Props:** Every Nova component defines its props interface with explicit typing, optional markers, and docstrings.
2. **Typed View Models:** Complex UI states (e.g., `NovaCycleViewModel`, `NovaPetViewModel`, `NovaAiAgentCardProps`) are formally typed to prevent undefined property errors at runtime.
3. **Safe Interoperability:** Existing business logic files (`cycle.js`, `storage.js`, `encryption.js`) remain in plain JavaScript to guarantee zero regression in clinical algorithms while being cleanly consumed by TypeScript components.

---

### 3. Component Directory Structure

```
src/components/nova/
├── layout/
│   ├── NovaShell.tsx          # 3-tier responsive shell (Desktop Rail, Tablet Strip, Mobile Dock)
│   ├── NovaHeader.tsx         # Compact editorial greeting and language switch
│   └── NovaContainer.tsx      # Standardized width constraint container
├── navigation/
│   ├── NovaSidebar.tsx        # Desktop 4-pillar navigation rail
│   ├── NovaTabletNav.tsx      # Dedicated tablet horizontal quick-strip
│   ├── NovaMobileDock.tsx     # 5-anchor mobile bottom dock with 48px touch targets
│   └── NovaBreadcrumb.tsx     # Contextual navigation trail
├── typography/
│   ├── NovaHeading.tsx        # Semantic typography with balanced line-heights
│   └── NovaText.tsx           # Body, caption, and subtle label primitives
├── buttons/
│   ├── NovaButton.tsx         # Primary, secondary, quiet, destructive, and icon variants
│   └── NovaSegmented.tsx      # Micro-press tactile capsule switcher
├── cards/
│   ├── NovaCard.tsx           # Organic, layered card container with tactile hover/press
│   ├── NovaHeroCard.tsx       # Primary visual rhythm centerpiece for Today
│   └── NovaActionCard.tsx     # Interactive destination card with trailing affordance
├── forms/
│   ├── NovaInput.tsx          # Accessible text input with label and error state
│   ├── NovaSlider.tsx         # Tactile numerical scale slider (e.g. pain 0-10)
│   └── NovaChipGroup.tsx      # Multi-select symptom and tag chips
├── assistants/
│   ├── NovaAgentBadge.tsx     # Standardized branded badge for Diva, Eeve, FLASH, INSTINCT
│   └── NovaChatBubble.tsx     # Clean conversational message with source citations
└── index.ts                   # Central typed export barrel
```

---

### 4. Competition Compliance Statement

Project Nova strictly respects the HackCache 2026 guidelines:

- **No Unapproved External Cloud Requirements:** Remains 100% functional locally in offline mode without requiring mandatory external API keys or remote subscriptions.
- **Accessible & Open Standards:** Fully compliant with standard HTML5, CSS3, ES2024, and WCAG 2.2 Level AA.
- **Preserved Git History:** Operates on dedicated branch `feature/saheli-10-nova` without force-pushing or altering main history.
