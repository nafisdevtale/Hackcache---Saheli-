# Saheli 7.3 — Virtual Companion System Implementation

## Executive Summary

The **My Saheli Companion** module introduces a gentle, non-gamified virtual pet companion designed specifically to provide supportive emotional presence, cycle comfort, and non-judgmental accompaniment. It strictly rejects dark patterns, streak anxieties, punitive death/illness mechanics, and intrusive notifications.

---

## 1. Core Architecture & Privacy Decoupling

- **Storage Key**: `saheli_companion_data` in browser `localStorage`.
- **Decoupling Guarantee**: The companion's state is 100% decoupled from the clinical menstrual record in IndexedDB (`saheli_cycle_diary`).
  - No medical predictions are ever inferred from companion interaction.
  - Logging periods or symptoms does not penalize or reward companion growth.
  - If a user deletes or clears their diary, companion data remains undisturbed (and vice-versa).
  - Resetting the companion (`resetCompanion()`) removes only `saheli_companion_data`.

---

## 2. The 15 Bespoke Companions

Every companion is rendered using pure, responsive inline SVG elements styled in Saheli's warm brand palette (`#641B44`, `#F8F3F1`, `#F3B2C7`, `#FDE9ED`, `#904D6E`, `#7BA488`).

| ID                | English Name | Species / Theme       | Description                                                               |
| ----------------- | ------------ | --------------------- | ------------------------------------------------------------------------- |
| `neel_peacock`    | Neel         | Indian Peacock        | Vibrant, graceful peacock with iridescent blue and teal accents.          |
| `gori_cow`        | Gori         | Sacred Desi Cow       | Serene white desi cow with gentle eyes, golden bell, and floral garlands. |
| `champa_cat`      | Champa       | Marigold Calico       | Warm calico cat curled up with golden floral patches.                     |
| `sheru_pup`       | Sheru        | Faithful Indie Dog    | Playful indie puppy with perky ears and wagging tail.                     |
| `moti_elephant`   | Moti         | Baby Elephant         | Affectionate calf with curled trunk and ornate cloth.                     |
| `rani_sparrow`    | Rani         | House Sparrow         | Cheerful courtyard sparrow chirping morning melodies.                     |
| `mitthu_parrot`   | Mitthu       | Rose-ringed Parakeet  | Bright green Indian parrot with sweet expression.                         |
| `koyal_cuckoo`    | Koyal        | Asian Koel            | Deep charcoal bird with shining crimson eye and songful posture.          |
| `badal_squirrel`  | Badal        | Palm Squirrel         | Three-striped Indian palm squirrel holding an acorn with fluffy tail.     |
| `suraj_deer`      | Suraj        | Chital Fawn           | Delicate spotted chital deer resting gracefully under trees.              |
| `titli_butterfly` | Titli        | Swallowtail Butterfly | Fluttering swallowtail butterfly with pastel floral patterns.             |
| `sona_bunny`      | Sona         | Meadow Rabbit         | Fluffy cream-white rabbit with soft pink ears and cozy demeanor.          |
| `jugnu_firefly`   | Jugnu        | Glowing Firefly       | Soothing lantern-carrying firefly radiating warm yellow light.            |
| `amrit_swan`      | Amrit        | Sacred Lotus Swan     | Pure white swan gliding smoothly with soft reflections.                   |
| `anar_redpanda`   | Anar         | Himalayan Red Panda   | Cuddly russet red panda curled with a bushy ringed tail.                  |

---

## 3. Habitats & Accessories

### Habitats (4)

1. **Courtyard Garden (`courtyard`)**: Sunlit veranda with potted tulsi, terracotta tiles, and marigold strings.
2. **Cozy Bedroom (`bedroom`)**: Quilted cushions, warm reading lamp, embroidered shawls, and wooden nightstand.
3. **Misty Mango Grove (`grove`)**: Shaded green orchard with ancient mango branches and dappled sunlight.
4. **Starlight Terrace (`starlight`)**: Open rooftop bathed in soft moonlight and twinkling night stars.

### Accessories (6)

1. **Flower Garland (`garland`)**: Fresh marigold and jasmine mala.
2. **Silk Ribbon (`ribbon`)**: Dusty rose silk bow.
3. **Pendant (`pendant`)**: Silver bell necklace with soft gentle chime.
4. **Flower Crown (`crown`)**: Handwoven wild blossom wreath.
5. **Kajal Charm (`kajal_dot`)**: Small traditional beauty mark for blessing.
6. **Warm Scarf (`scarf`)**: Hand-knitted soft wool cowl.

---

## 4. Growth & Care Interactions

### Care Activities

- **Feed (`feed`)**: Offering gentle nourishment (kheer, warm tea, fresh berries).
- **Comfort (`pet`)**: Warm pats and reassurance to soothe cramps and emotional fatigue.
- **Play (`play`)**: Gentle, quiet games without overstimulation.
- **Rest (`rest`)**: Soft nap together under a warm blanket.

### Growth Progression

- Stages: `newborn` (0-2 care interactions) ➔ `young` (3-6) ➔ `growing` (7-11) ➔ `companion` (12+).
- **Zero Streak Penalties**: If a user is away for weeks or months, the pet remains at its exact growth stage, welcoming the user back with warmth.
- **Zero Illness / Death**: The pet cannot fall sick, starve, or expire.

---

## 5. Unicode Name Sanitization

All pet names are sanitized via `sanitizePetName()`:

- Maximum length: 24 characters.
- Supports full Unicode (Devanagari, Bengali, Tamil, Telugu, Kannada, Gujarati, Gurmukhi, Malayalam, Odia, Urdu, etc.).
- Strips control characters, non-printable characters, and HTML tags to prevent XSS.
