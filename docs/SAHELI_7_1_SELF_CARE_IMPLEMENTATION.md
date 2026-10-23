# Saheli 7.1 — Self Care & Wellness Studio Implementation Report

## Executive Summary

Saheli 7.1 introduces the **Self Care & Wellness Studio** (`/selfcare`), an evidence-informed menstrual comfort, gentle movement, relaxation, and calming audio module designed specifically for girls and women. Operating under Saheli's strict privacy-first and zero-commercialization charter, the studio provides compassionate, restorative tools without paywalls, PRO subscriptions, user registration, external tracking, or third-party audio streaming.

---

## Architecture & System Overview

```
                      +------------------------------------------+
                      |        Today Dashboard & Navigation      |
                      |   (Desktop Rail / More Menu / Learning)  |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       /selfcare (Self Care Studio)       |
                      +--------------------+---------------------+
                                           |
         +-----------------+---------------+-----------------+-----------------+
         |                 |                                 |                 |
         v                 v                                 v                 v
+-----------------+ +--------------------+         +-----------------+ +---------------+
| Quick Shortcuts | | Structured Care    |         | Calming Sounds  | | My Care Space |
| (7 Direct Flows)| | Programmes (9)     |         | (10 Web Audio)  | | (Favs & Notes)|
+-----------------+ +--------------------+         +-----------------+ +---------------+
         |                 |                                 |                 |
         +--------+--------+                                 |                 |
                  |                                          v                 v
                  v                                +-----------------+ +---------------+
+------------------------------------+             | Web Audio Synth | | Local-First   |
| Interactive Programme Modal Player |             | Procedural PWA  | | IndexedDB /   |
| (Step Timer, Controls, Stop Alert) |             | Offline Engine  | | localStorage  |
+------------------------------------+             +-----------------+ +---------------+
```

---

## Core Technical Modules

### 1. Procedural Web Audio Engine (`src/lib/soundscapes.js`)

- **100% Offline & Procedural**: Synthesizes 10 soundscapes directly in the browser using the Web Audio API without downloading media files or streaming external bandwidth:
  - `rain`: Pink noise generated via Math.random buffer, processed through a low-pass biquad filter with gentle LFO modulation.
  - `waves`: Pink noise shaped with a resonant bandpass filter and slow sine LFO (0.12 Hz) simulating rhythmic tidal swell.
  - `forest`: White noise filtered through dual bandpass resonant stages simulating wind blowing through woodland canopies.
  - `stream`: High-pass filtered pink noise with fluctuating frequency modulation imitating bubbling fresh water.
  - `wind`: Low-frequency bandpass-filtered noise with slow oscillating center frequency.
  - `night`: High-pitched quiet bandpass bursts simulating nocturnal field ambiance and crickets.
  - `birds`: Intermittent frequency-swept sine chirp oscillators at musical intervals.
  - `instrumental`: Polyphonic warm harmonic drones with detuned low frequencies and soothing overtone resonance.
  - `whitenoise`: Clean full-spectrum white noise for steady sleep and focus isolation.
  - `breathing_audio`: Gentle 4-second sinusoidal swelling tone providing acoustic pacing for guided breathwork.
- **Mixer Controls**: Supports master gain, individual sound gain, mute toggle, and sleep timer auto-shutdown (5, 10, 15, 30 minutes, or continuous).
- **Reactive State Subscription**: Observer pattern allowing UI components to re-render in real time as audio tracks or timers update.

### 2. Local-First Client Storage (`src/lib/selfCareStorage.js`)

- **Client-Side Privacy**: Activity completions, favorite routine pins, and private wellness notes live strictly inside local storage.
- **No Streaks or Shame Mechanics**: No punitive gamification, streak counts, or pressure badges.
- **Instant Wiping**: One-click "Clear History" button deletes activity completion logs and notes immediately without server dependencies.

### 3. Structured Content & Evidence Governance (`src/content/selfCare.js`)

- **9 Evidence-Informed Programmes**:
  1. _Gentle Warmth & Rest_ (Heat therapy for dysmenorrhea, NHS/ACOG cited)
  2. _Period Hygiene & Freshness_ (Safe pad/cup cleaning and hygiene practices, UNICEF/WHO cited)
  3. _Hydration & Herbal Nurture_ (Fluid balance and soothing caffeine-free warmth, WHO/FOGSI cited)
  4. _Rest & Low-Energy Recharge_ (Supportive rest during luteal/menstrual energy drops, WHO cited)
  5. _Gentle Menstrual Stretching_ (Light child's pose and cat-cow pelvic movement, WHO cited)
  6. _Pelvic Floor Unwinding_ (Gentle relaxation of pelvic tension, ACOG cited)
  7. _Calm Breathing (NHS 4-4)_ (Equal-count autonomic parasympathetic pacing, NHS cited)
  8. _Bedtime Wind-Down_ (Progressive muscle tension release for menstrual insomnia, NHS cited)
  9. _5-4-3-2-1 Sensory Grounding_ (Tactile sensory orientation for anxiety and overwhelm, WHO cited)
- **Transparent Evidence Badges**: Every activity displays its explicit evidence level (`evidence_informed`, `wellbeing_practice`, or `personal_preference`) and links directly to verified institutional guidelines.
- **Mandatory Safety Precaution**: Each exercise includes precautions, contraindications, and explicit stop conditions (e.g. stop immediately if dizziness, sharp stabbing pain, or abnormal bleeding occurs).

### 4. Interactive Activity & Breathing Modals

- **Step-by-Step Programme Player**: Displays step numbers, timer countdowns, play/pause controls, step progress dots, and completion logging.
- **NHS Calm Breathing Visualizer**: Expanding and contracting animated orb guiding the 4-second inhalation and 4-second exhalation cycle, accompanied by acoustic chime and full reduced-motion accessibility support.

### 5. Multilingual Parity & Urdu RTL

- **100% Key Parity**: 191 `selfcare.*` keys added across all 13 supported languages (`en`, `hi`, `mr`, `te`, `kn`, `ta`, `bn`, `gu`, `pa`, `ml`, `or`, `as`, `ur`).
- **Urdu Right-to-Left (RTL)**: Full layout mirroring, inverted icon chevrons, and natural Nastaliq typography.

### 6. Clinical Safeguards & Red Flag Priority

- When deterministic red flags or urgent conditions are triggered (e.g., soaking pads, sudden acute pain, pregnancy warning signs), self-care suggestions are **strictly overridden** by emergency clinical referral guidance.
