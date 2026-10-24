# Saheli 9.0 Multilingual Typography & Font Engineering Specification

**Document:** Multilingual Typography Architecture  
**Release:** Saheli 9.0 — Bloom Frontend Renewal  
**Date:** October 2026  
**Languages Supported:** 13 Official Indian Languages across 11 Writing Systems

---

## 1. Multilingual Font Strategy & Script Support

India's rich linguistic diversity encompasses 11 distinct writing systems across the 13 languages supported in Saheli. Because rendering characteristics differ drastically between Latin and complex Brahmic/Arabic scripts, Saheli Bloom implements a script-specific typographic hierarchy.

### 1.1 Script Mapping Matrix

| Language               | ISO Code | Writing Script            | Text Direction | Recommended Font Family Cascade                                                                                 |
| ---------------------- | -------- | ------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| **English**            | `en`     | Latin                     | LTR            | system-ui, -apple-system, "Inter", "Segoe UI", Roboto, sans-serif                                               |
| **Hindi**              | `hi`     | Devanagari                | LTR            | "Noto Sans Devanagari", "Kohinoor Devanagari", "Mukta", sans-serif                                              |
| **Marathi**            | `mr`     | Devanagari                | LTR            | "Noto Sans Devanagari", "Kohinoor Devanagari", "Mukta", sans-serif                                              |
| **Bengali**            | `bn`     | Eastern Nagari (Bengali)  | LTR            | "Noto Sans Bengali", "Kohinoor Bangla", "Shonar Bangla", sans-serif                                             |
| **Assamese**           | `as`     | Eastern Nagari (Assamese) | LTR            | "Noto Sans Bengali", "Kohinoor Bangla", sans-serif                                                              |
| **Gujarati**           | `gu`     | Gujarati                  | LTR            | "Noto Sans Gujarati", "Kohinoor Gujarati", "Shruti", sans-serif                                                 |
| **Gurmukhi (Punjabi)** | `pa`     | Gurmukhi                  | LTR            | "Noto Sans Gurmukhi", "Gurmukhi MN", "Raavi", sans-serif                                                        |
| **Kannada**            | `kn`     | Kannada                   | LTR            | "Noto Sans Kannada", "Kannada Sangam MN", "Tunga", sans-serif                                                   |
| **Malayalam**          | `ml`     | Malayalam                 | LTR            | "Noto Sans Malayalam", "Malayalam Sangam MN", "Kartika", sans-serif                                             |
| **Odia**               | `or`     | Odia                      | LTR            | "Noto Sans Oriya", "Kalinga", "Utkal", sans-serif                                                               |
| **Tamil**              | `ta`     | Tamil                     | LTR            | "Noto Sans Tamil", "Tamil Sangam MN", "Latha", sans-serif                                                       |
| **Telugu**             | `te`     | Telugu                    | LTR            | "Noto Sans Telugu", "Kohinoor Telugu", "Gautami", sans-serif                                                    |
| **Urdu**               | `ur`     | Arabic (Nastaliq / Naskh) | **RTL**        | "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Noto Sans Arabic", "Geeza Pro", "Urdu Typesetting", sans-serif |

---

## 2. Typographic Rules for Complex Scripts

### 2.1 Line-Height Calibration (Diacritic & Conjunct Safety)

Latin typography typically uses a tight line-height of `1.2` to `1.4`. However, when applied to Indic scripts or Urdu Nastaliq:

- **Devanagari / Bengali / Gurmukhi:** Reph, anusvara, and upper matras collide with the baseline above; u-kar and halant descenders are clipped by fixed-height containers.
- **Urdu Nastaliq:** Sloping baseline and stacked ligatures require generous vertical clearance. Tight line-height completely lops off upper nuqtas and lower diacritics.

**Saheli Bloom Line-Height Rules:**

- Latin text: `line-height: 1.5`
- Indic scripts (Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Odia, Gurmukhi): **`line-height: 1.6` – `1.7`**
- Urdu (Nastaliq): **`line-height: 1.85` – `2.1`** with `padding-block: 4px` on interactive controls.

### 2.2 Suppression of Letter-Spacing & Uppercase Transforms

- **Letter-Spacing (`tracking`):** In Devanagari, Bengali, and Gurmukhi, words share a continuous top headline (_shirorekha_ / _matra_ line). Adding positive `letter-spacing` breaks this continuous line, fragmenting words into illegible glyphs. In Urdu, cursive joining is broken.
  - **Rule:** `letter-spacing: normal !important;` is enforced on all non-Latin languages.
- **Case Transformation (`uppercase`):** Indic scripts and Arabic/Urdu scripts are unicase (they have no capital/lowercase distinction). Applying `text-transform: uppercase` produces no glyph change on Indian scripts, but can create styling inconsistencies or corrupt localized mixed strings.
  - **Rule:** `text-transform: none` is enforced on all non-Latin languages.

### 2.3 Urdu RTL Architecture & Logical Layouts

- **Document Level:** When `lang === "ur"`, `dir="rtl"` is set on `<html>`.
- **CSS Logical Properties:**
  - Instead of `left-4`, use `inset-inline-start: 1rem;`
  - Instead of `right-4`, use `inset-inline-end: 1rem;`
  - Instead of `pl-4 pr-2`, use `ps-4 pe-2` (`padding-inline-start`, `padding-inline-end`)
  - Instead of `ml-auto`, use `ms-auto`
- **Direction-Aware Mirroring:** Directional indicators (e.g. `ChevronRight`, arrow icons) are mirrored via `.rtl-mirror` (`transform: scaleX(-1)`).
- **Text Alignment:** Form inputs, summaries, and text blocks default to logical inline start (`text-start`), ensuring proper right-alignment in Urdu and left-alignment in LTR languages.

---

## 3. Responsive Typography & Zoom Resiliency

### 3.1 Fluid Type Scale

Saheli Bloom employs a responsive typographic scale defined with fluid clamps and sensible maximums:

- `text-display`: `clamp(1.75rem, 4vw, 2.5rem)` (Page titles, hero stats)
- `text-h1`: `clamp(1.5rem, 3vw, 2rem)` (Section headers)
- `text-h2`: `clamp(1.25rem, 2.5vw, 1.5rem)` (Card titles)
- `text-h3`: `clamp(1.1rem, 2vw, 1.25rem)` (Sub-card headers)
- `text-body`: `clamp(0.875rem, 1.5vw, 1rem)` (Primary body text)
- `text-caption`: `clamp(0.75rem, 1.2vw, 0.875rem)` (Metadata, hints, badge text)

### 3.2 200% Zoom & Large Text Sizing

- All container boxes utilize `min-height` rather than fixed `height`.
- Text containers utilize `min-width: 0` inside flex and grid parents to prevent overflow.
- No `overflow: hidden` on text containers containing essential medical information.
- Layout tested and verified at 200% browser text zoom with zero horizontal scrolling.
