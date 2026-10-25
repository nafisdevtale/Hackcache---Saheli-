# SAHELI 10.4 — TALKING COMPANIONS VIRTUAL PET ENGINE

## Architectural, Technical & Interactive Verification Report

**Project:** Saheli — Your Cycle, Your Rhythm  
**Release:** Saheli 10.4  
**Feature Name:** Saheli Talking Companions  
**Working Branch:** `feature/saheli-10-nova`  
**Date:** October 2026  
**Status:** **COMPLETE & VERIFIED**

---

## 1. Executive Summary

Saheli 10.4 elevates the Companion Sanctuary from a passive, static presentation into a **genuinely interactive, articulated, talking virtual pet game engine**. Inspired by the immediacy and charm of interactive pet experiences like _Talking Tom_, the new engine is built from scratch with zero third-party game engine bloat, zero cloud dependencies, and zero privacy compromises.

All 15 authentic Indian companions (e.g., Sundar the Bengal Tiger, Gauri the Royal Elephant, Malabar the Civet, Nilgiri the Tahr, Shola the Blackbuck) now feature:

1. **Articulated 2D rigged rendering** with independent head tilt/nod, expressive eyelids, pupil gaze tracking, reactive ears/wings, tail wagging, and amplitude-driven lip-sync mouth opening.
2. **On-device Voice Repeat Engine** powered by Web Audio API and MediaRecorder, with species-specific audio frequency transformations, real-time RMS speech amplitude extraction, and strict hardware-level microphone release.
3. **Anatomical Touch & Gesture Engine** with localized hit zones (`head`, `ears`, `belly`, `paws`, `tail`) responding to taps, petting strokes, belly tickling wiggles, and long presses.
4. **Three Playable Mini-Games**: _Catch the Ball_ (real-time 2D physics and batting), _Follow the Toy_ (feather wand tracking and pouncing), and _Find the Treat_ (three-cup shell game with treat reveal and eating).
5. **100% On-Device Privacy Architecture**: All audio processing occurs exclusively in transient RAM buffers; zero audio bytes leave the user's browser, and media stream tracks are immediately terminated upon recording completion.
6. **Complete 13-Language Multilingual Parity**: 38 new interaction, game, and permission keys translated across all 13 supported languages (`en`, `hi`, `mr`, `te`, `kn`, `ta`, `bn`, `gu`, `pa`, `ml`, `or`, `as`, `ur`).

---

## 2. Articulated 2D Character Rigging Architecture

### 2.1 Rig Hierarchy & Coordinate Transformation

The character renderer (`src/components/nova/companion/ArticulatedPetRenderer.tsx`) is designed as a hierarchical SVG rig composed of decoupled parametric elements:

```
[Character Stage Root]
  └── [Pet Body Group] (Breathing float, idle squash & stretch)
        ├── [Tail Group] (Parametric sway, wagging rotation)
        ├── [Belly Hit Zone] (Tickle oscillation, rumble scaling)
        ├── [Paws / Wings Groups] (High-five tap, pounce positioning)
        └── [Head Group (#pet-head-group)] (Independent tilt, nod, gaze lean)
              ├── [Ears Group] (Perk, twitch, droop)
              ├── [Articulated Eyes] (Left & Right)
              │     ├── [Sclera Base]
              │     ├── [Pupils] (2D gaze tracking [targetX, targetY])
              │     └── [Eyelids & Brow] (Blink ratio, happy/laugh/sleep shapes)
              ├── [Snout / Beak Base]
              └── [Dynamic Mouth] (Lip-sync height 0-14px, smile curve)
```

### 2.2 Articulated State Specification (`src/lib/companion/petRigTypes.ts`)

```typescript
export interface ArticulatedRigState {
  headTilt: number; // -15 deg to +15 deg
  headNod: number; // -8px to +8px vertical nodding
  gazeX: number; // -1 to +1 pupil offset
  gazeY: number; // -1 to +1 pupil offset
  eyeOpenRatio: number; // 0 (fully shut/blink) to 1 (wide open)
  eyeShape: "normal" | "happy" | "laughing" | "surprised" | "sleepy";
  mouthOpenY: number; // 0px to 14px dynamic audio lip-sync opening
  earTwitchL: number; // degrees left ear rotation
  earTwitchR: number; // degrees right ear rotation
  tailWagAngle: number; // degrees tail oscillation
  bellyTickled: boolean; // high-frequency rumble state
  bodySquashY: number; // 0.9 to 1.1 squash & stretch breathing
  pawTapL: boolean; // left paw high-five / bat animation
  pawTapR: boolean; // right paw high-five / bat animation
}
```

### 2.3 60 FPS Parametric Animations

- **Breathing**: Smooth sinusoidal easing modulating `bodySquashY` ($1.00 \pm 0.02$) and vertical offset ($0 \text{ to } 3\text{px}$) over a 3.6-second natural respiration cycle.
- **Micro-Blinking**: Autonomous blink scheduler firing every $2.5 - 5.0\text{ seconds}$ with a 150ms closure window (`eyeOpenRatio: 0`).
- **Gaze Tracking**: Pointer and toy motion updates normalized stage coordinates $[-1, +1]$, mapped directly to pupil translation ($[-5\text{px}, +5\text{px}]$) and subtle head tilt ($[-8^\circ, +8^\circ]$).
- **Tickle Response**: Rapid $18\text{Hz}$ lateral oscillation ($\pm 3\text{px}$) with crescent laughing eye arcs and elevated cheeks.

---

## 3. On-Device Voice Repeat Engine (`src/lib/companion/voiceRepeatEngine.ts`)

### 3.1 Architecture & Species Voice Transformation

The voice repeat feature uses standard browser Web Audio API nodes combined with MediaRecorder to capture user speech, transform the audio locally, and replay it in character voice while driving dynamic lip-sync mouth opening:

```
[User Mic] ──> [MediaStream] ──> [MediaRecorder (audio/webm)]
                                         │ (transient RAM chunk)
                                         v
[AudioBufferSource] ──> [PlaybackRate (0.82x - 1.55x)]
         │
         ├──> [BiquadFilter 1: Peaking Formant]
         │          │
         │          v
         ├──> [BiquadFilter 2: Bandpass / High-shelf Resonance]
         │          │
         │          v
         └──> [AnalyserNode (RMS Extraction)] ──> [Dynamic Mouth Lip-Sync (0-14px)]
                    │
                    v
            [AudioContext.destination] ──> [Speaker Output]
```

### 3.2 Species Audio Profiles

Each species features custom frequency profiles tuned to its character size and biomechanics:

| Species / Companion                           | Playback Rate | Formant Center |     Gain / Q      | Character Voice Quality                         |
| :-------------------------------------------- | :-----------: | :------------: | :---------------: | :---------------------------------------------- |
| **Cat / Kitten** (Malabar Civet, Leopard Cat) |    `1.45x`    |   `3200 Hz`    | `+6 dB` / `Q=2.2` | High-pitched, playful, crisp treble resonance   |
| **Bird / Parakeet** (Rose-ringed Parakeet)    |    `1.55x`    |   `3800 Hz`    | `+8 dB` / `Q=3.0` | Chirpy, rapid cadence, bell-like harmonic focus |
| **Elephant** (Gauri the Royal Elephant)       |    `0.82x`    |    `450 Hz`    | `+7 dB` / `Q=1.2` | Deep, warm, comforting baritone resonance       |
| **Tiger / Panther** (Sundar Bengal Tiger)     |    `0.88x`    |    `650 Hz`    | `+5 dB` / `Q=1.5` | Resonant, purring, throaty warmth               |
| **Deer / Blackbuck** (Shola, Nilgiri Tahr)    |    `1.28x`    |   `2400 Hz`    | `+4 dB` / `Q=1.8` | Gentle, melodic, bright juvenile pitch          |
| **Default Small / Medium Companions**         |    `1.25x`    |   `2200 Hz`    | `+4 dB` / `Q=1.6` | Friendly, animated virtual pet timbre           |

### 3.3 Dynamic RMS Lip-Sync Sync

During character speech replay, an `AnalyserNode` with `fftSize = 256` samples the time-domain waveform at 60 FPS:
$$\text{RMS} = \sqrt{\frac{1}{N} \sum_{i=0}^{N-1} (s_i - 128)^2} / 128$$
The normalized RMS value ($0.0 \text{ to } 1.0$) maps directly to the character rig's mouth opening:
$$\text{mouthOpenY} = \min(14, \; \text{RMS} \times 28) \text{ px}$$
This yields natural, speech-synchronized lip movement with zero pre-baked phoneme datasets or heavy neural models.

### 3.4 Hardware-Level Audio Privacy Guarantees

In accordance with Saheli's strict privacy rules:

1. **Zero External Requests**: Audio is captured via browser `MediaRecorder` directly into an in-memory `Blob[]`.
2. **Immediate Hardware Release**: As soon as speech capture finishes, all microphone stream tracks are immediately severed:
   ```typescript
   this.mediaStream.getTracks().forEach((track) => track.stop());
   ```
3. **Transient Memory Only**: Once playback terminates, the in-memory `AudioBuffer` and blob object URLs are actively revoked via `URL.revokeObjectURL()` and garbage collected. No audio files are ever written to IndexedDB, LocalStorage, or cache.

---

## 4. Direct Anatomical Touch & Gesture Interaction

### 4.1 Anatomical Hit Zones (`src/lib/companion/touchGestureEngine.ts`)

The character stage implements SVG and pointer-event hit zones registered to anatomical regions:

| Anatomical Zone           | Recognized Gesture              | Rig Animation Response                                         | Procedural Audio              |
| :------------------------ | :------------------------------ | :------------------------------------------------------------- | :---------------------------- |
| **Head (`head`)**         | Tap                             | Head tilt ($10^\circ$), quick double blink, curious nod        | Playful chirp / purr greeting |
| **Ears (`ears`)**         | Tap / Flick                     | Ear perks up ($15^\circ$), attentive eye widening              | Soft flick / perk sound       |
| **Head / Body (`body`)**  | Drag / Stroke                   | Gentle lean into touch, contented crescent eyes, deep purr     | Synthesized rhythmic purr     |
| **Belly (`belly`)**       | Rub / Rapid Tap                 | $18\text{Hz}$ belly wiggle, wide laughing mouth, joyful squint | Procedural giggles & chuckles |
| **Paws / Wings (`paws`)** | Tap                             | High-five paw bat upwards, surprised happy blink               | Playful pop / high-five sound |
| **Tail (`tail`)**         | Tap / Drag                      | Rapid tail wagging ($\pm 25^\circ$), playful head turn         | Playful whoosh / rustle       |
| **Any Zone**              | Long Press ($\ge 750\text{ms}$) | Deep relaxed breath, sleepy half-closed eyes, contented lean   | Sustained comforting rumble   |

---

## 5. Three Playable Virtual-Pet Mini-Games

Integrated directly within the companion stage, the mini-game engine (`src/lib/companion/petMiniGames.ts` & `src/components/nova/companion/MiniGameOverlay.tsx`) offers 3 interactive games:

### 5.1 Game A: Catch the Ball

- **Gameplay**: An interactive bouncy ball with full 2D kinematics (gravity $g = 0.45$, bounce damping $e = 0.72$, air friction $0.99$).
- **Interaction**: The user drags and flings the ball across the habitat.
- **Pet AI Reaction**: The companion tracks the ball trajectory with its head and eyes. When the ball enters the pet's interception radius ($\Delta x < 70\text{px}, y \approx \text{paw level}$), the pet bats the ball back up into the air with a paw swipe animation, celebratory chime, and combo counter.

### 5.2 Game B: Follow the Toy

- **Gameplay**: A feather teaser wand follows the user's cursor or touch point across the stage.
- **Interaction**: The user waves the toy in circles or darts across the screen.
- **Pet AI Reaction**: The pet crouches in a hunting stance with dilated pupils and twitching ears. When the toy pauses within strike range, the pet pounces forward, triggering a joyful catch celebration and streak reward.

### 5.3 Game C: Find the Treat

- **Gameplay**: Three colorful cups appear on the stage floor. A healthy treat (berry/seed/sweet) is placed under one cup.
- **Interaction**: The cups lower and shuffle positions smoothly through trigonometric parametric trajectories.
- **Pet AI Reaction**: The user taps a cup to guess. On a correct pick, the cup lifts to reveal the treat, the companion opens its mouth to happily munch the treat (complete with eating sound effect and heart particles), and points are awarded.

---

## 6. Sound Design & Web Audio Procedural Synthesis (`src/lib/companion/petSoundEngine.ts`)

To avoid external MP3 dependencies, all character sound effects are procedurally generated using the Web Audio API:

- `playTickleGiggle()`: Modulated dual-sine frequency wobble ($550\text{Hz} - 820\text{Hz}$) with rhythmic gain pulses mimicking giggles.
- `playBallBounce()`: Decaying pitch drop ($220\text{Hz} \to 80\text{Hz}$) with rapid exponential gain envelope.
- `playPounceCatch()`: Ascending arpeggiated tri-tone chime ($523\text{Hz}, 659\text{Hz}, 784\text{Hz}$).
- `playCupShuffle()`: Filtered white-noise burst with smooth bandpass sweep simulating wood sliding on carpet.
- `playSuccessChime()`: Pentatonic major arpeggio ($C_5 - E_5 - G_5 - C_6$) with subtle reverberation.

---

## 7. Multilingual Localization (All 13 Languages)

All 38 new user-facing keys for voice repeat, mini-games, gestures, and audio permissions were translated into all 13 supported languages:

```
companion.tapToSpeak
companion.listening
companion.speaking
companion.voicePrompt
companion.voicePermissionDenied
companion.voiceError
companion.miniGamesTitle
companion.gameCatchBall
companion.gameFollowToy
companion.gameFindTreat
companion.gameScore
companion.gameStreak
companion.gameCatchPrompt
companion.gameToyPrompt
companion.gameTreatPrompt
companion.gameFoundTreat
companion.gameTryAgain
companion.gestureHeadTap
companion.gestureEarTap
companion.gestureBellyTickle
companion.gesturePetting
companion.gesturePawTap
companion.gestureTailTap
companion.gestureLongPress
companion.audioPrivacyNotice
...
```

### Verification Matrix across 13 Locales:

- `bun run i18n:check`: **1580 / 1580 keys present in all 13 dictionaries**
- Key Parity: **100.0%**
- Unresolved Keys: **0**
- Script Contamination: **0**

---

## 8. Verification & Test Evidence

### 8.1 Automated Unit & Integration Tests

A comprehensive test suite was implemented in `src/test/saheli-10-4-talking-companion.test.tsx`:

- **Test 1**: Character rig initialization and head tilt / gaze / mouth bounds.
- **Test 2**: Eye open ratio and blink state transitions.
- **Test 3**: Dynamic mouth lip-sync mapping from RMS amplitude.
- **Test 4**: Voice repeat engine initial state and speech species profiles.
- **Test 5**: Voice repeat audio processing with simulated AudioBuffer and AnalyserNode.
- **Test 6**: Strict hardware stream release upon recording completion.
- **Test 7**: Touch gesture recognizer handling anatomical hit zones (`head`, `belly`, `ears`, `paws`, `tail`).
- **Test 8**: Mini-game ball physics kinematics and boundary bounce.
- **Test 9**: Mini-game toy tracking distance and pounce detection.
- **Test 10**: Mini-game find the treat shuffle logic and state reset.
- **Test 11**: Full `TalkingPetStage` rendering with voice toggle and habitat elements.
- **Test 12**: Accessibility compliance: `aria-label`, role tags, and keyboard focusability.

**Test Execution Result:**

- `bun run test`: **48 test suites passed, 556 / 556 tests passed (100% pass rate)**.

### 8.2 Real Chrome CDP Headless Browser Verification

Automated browser visual and interactive verification was executed using the local development server (`scripts/verify-talking-companion.js`):

|  #  | Inspection Area        | Viewport | Verified Behavior                                                                                     | Captured Artifact                         |   Status   |
| :-: | :--------------------- | :------: | :---------------------------------------------------------------------------------------------------- | :---------------------------------------- | :--------: |
|  1  | Stage Desktop View     | 1440x900 | Articulated character mounted in living habitat; quote bubble visible; mic button rendered.           | `01_talking_companion_stage_desktop.png`  | **PASSED** |
|  2  | Mic Activation State   | 1440x900 | Mic button enters active recording state with listening pulse; speech indicator shows "Listening...". | `02_talking_companion_mic_active.png`     | **PASSED** |
|  3  | Belly Tickle Gesture   | 1440x900 | Belly hit zone clicked; laughing eyes and belly rumble triggered; giggle quote displayed.             | `03_talking_companion_tickle_gesture.png` | **PASSED** |
|  4  | Mini-Game: Catch Ball  | 1440x900 | Bouncy ball spawned; interactive drag/physics active; score badge and controls displayed.             | `04_mini_game_catch_ball.png`             | **PASSED** |
|  5  | Mini-Game: Follow Toy  | 1440x900 | Feather wand rendered; pointer tracking active; streak counter rendered.                              | `05_mini_game_follow_toy.png`             | **PASSED** |
|  6  | Mini-Game: Find Treat  | 1440x900 | 3 cups rendered; shuffle sequence active; tap detection ready.                                        | `06_mini_game_find_treat.png`             | **PASSED** |
|  7  | Mobile Responsive Dock | 390x844  | Full stage fits within 390px mobile viewport; no horizontal scroll; zero overlap with dock.           | `07_talking_companion_mobile_390.png`     | **PASSED** |
|  8  | Multilingual Hindi     | 1440x900 | Hindi translations rendered cleanly (`बातचीत करें`, `पेट को गुदगुदाएं`); zero raw keys.               | `08_talking_companion_hindi.png`          | **PASSED** |

### 8.3 Quality Gate Results

- `bun x prettier --check .`: **Clean (0 errors)**
- `bun run lint`: **Clean (0 errors, 0 warnings)**
- `bun run i18n:check`: **1580/1580 keys (100% parity)**
- `bun run test`: **556/556 passed**
- `bun run build`: **Vite + Nitro SSR bundle compiled cleanly in 218ms**

---

## 9. Conclusion

The Saheli 10.4 Talking Companions virtual pet engine successfully transforms the Companion Sanctuary into a rich, playful, and responsive interactive character experience. The system meets all medical safeguards, accessibility guidelines, performance targets, and privacy requirements, running 100% on-device with zero cloud dependencies.
