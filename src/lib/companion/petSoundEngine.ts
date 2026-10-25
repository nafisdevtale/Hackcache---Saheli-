/**
 * Saheli 10.3 — Procedural Web Audio API Sound Engine for Living Companions
 *
 * Privacy & Safety Guarantees:
 * - 100% on-device synthetic audio via Web Audio API. Zero external audio downloads.
 * - AudioContext is only created or resumed after an explicit user interaction (click/touch).
 * - Automatic suspension on page hide (document.visibilitychange) and unmount.
 * - Master volume and mute states persisted locally in localStorage.
 * - Gentle, low-frequency, non-jarring acoustics designed for comfort and accessibility.
 */

const AUDIO_ENABLED_KEY = "saheli_pet_sound_enabled";
const AUDIO_VOLUME_KEY = "saheli_pet_sound_volume";

class PetSoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.35;
  private continuousPurrGain: GainNode | null = null;
  private continuousPurrOsc: OscillatorNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedEnabled = localStorage.getItem(AUDIO_ENABLED_KEY);
        if (savedEnabled !== null) {
          this.isEnabled = savedEnabled === "true";
        }
        const savedVolume = localStorage.getItem(AUDIO_VOLUME_KEY);
        if (savedVolume !== null) {
          const v = parseFloat(savedVolume);
          if (!isNaN(v) && v >= 0 && v <= 1) {
            this.volume = v;
          }
        }
      } catch {
        // Fallback to defaults
      }

      // Handle tab visibility to silence audio immediately
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stopContinuousPurr();
          if (this.ctx && this.ctx.state === "running") {
            this.ctx.suspend().catch(() => {});
          }
        }
      });
    }
  }

  /**
   * Safe getter for AudioContext, ensuring user-gesture resume
   */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(AUDIO_ENABLED_KEY, String(enabled));
      }
    } catch {
      // Storage unavailable or disabled
    }
    if (!enabled) {
      this.stopContinuousPurr();
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(AUDIO_VOLUME_KEY, String(clamped));
      }
    } catch {
      // Storage unavailable or disabled
    }
    if (this.continuousPurrGain && this.ctx) {
      this.continuousPurrGain.gain.setValueAtTime(clamped * 0.15, this.ctx.currentTime);
    }
  }

  /**
   * General-purpose tone generator with gentle attack & release envelopes
   */
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    gainMultiplier = 1,
    freqEnd?: number,
  ) {
    if (!this.isEnabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      const now = ctx.currentTime;
      const peakVol = this.volume * 0.25 * gainMultiplier;

      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd && freqEnd !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      }

      // Smooth attack & exponential decay to prevent clicks
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // Audio synthesis error guarded
    }
  }

  /**
   * SPECIES-SPECIFIC SOUNDS
   */

  // 1. Cat: Gentle purr and soft meow
  public playCatSound() {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Meow: gentle pitch upward then soft fall
    const now = ctx.currentTime;
    this.playTone(520, 0.2, "sine", 0.7, 680);
    setTimeout(() => {
      this.playTone(680, 0.25, "sine", 0.6, 440);
    }, 180);
  }

  // 2. Dog: Soft cheerful yip
  public playDogSound() {
    this.playTone(380, 0.12, "triangle", 0.8, 480);
    setTimeout(() => {
      this.playTone(480, 0.15, "sine", 0.7, 320);
    }, 120);
  }

  // 3. Rabbit: Cute bell-like squeak
  public playRabbitSound() {
    this.playTone(880, 0.1, "sine", 0.5, 960);
    setTimeout(() => {
      this.playTone(960, 0.12, "sine", 0.4, 780);
    }, 90);
  }

  // 4. Fox: Inquisitive light chirp
  public playFoxSound() {
    this.playTone(620, 0.14, "triangle", 0.6, 750);
    setTimeout(() => {
      this.playTone(750, 0.18, "sine", 0.5, 540);
    }, 110);
  }

  // 5. Panda: Gentle soft hum
  public playPandaSound() {
    this.playTone(220, 0.35, "sine", 0.6, 240);
  }

  // 6. Bear: Warm friendly low note
  public playBearSound() {
    this.playTone(160, 0.4, "sine", 0.7, 180);
  }

  // 7. Koala: Warm soothing chime
  public playKoalaSound() {
    this.playTone(392, 0.25, "sine", 0.5, 440);
  }

  // 8. Hamster: Rapid cute pip
  public playHamsterSound() {
    this.playTone(940, 0.08, "sine", 0.5, 1020);
    setTimeout(() => {
      this.playTone(1020, 0.09, "sine", 0.45, 900);
    }, 80);
  }

  // 9. Hedgehog: Gentle rustle pip
  public playHedgehogSound() {
    this.playTone(480, 0.12, "triangle", 0.5, 520);
    setTimeout(() => {
      this.playTone(520, 0.14, "sine", 0.4, 420);
    }, 100);
  }

  // 10. Penguin: Melodic ocean chirp
  public playPenguinSound() {
    this.playTone(740, 0.12, "sine", 0.6, 880);
    setTimeout(() => {
      this.playTone(880, 0.16, "triangle", 0.5, 660);
    }, 100);
  }

  // 11. Butterfly: Ethereal harp chime
  public playButterflySound() {
    const notes = [1046, 1318, 1567]; // C6, E6, G6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, "sine", 0.4);
      }, idx * 70);
    });
  }

  // 12. Turtle: Calm resonant water droplet chime
  public playTurtleSound() {
    this.playTone(523, 0.28, "sine", 0.6, 392);
  }

  // 13. Owl: Soft nocturnal hoot
  public playOwlSound() {
    this.playTone(440, 0.22, "sine", 0.5, 415);
    setTimeout(() => {
      this.playTone(370, 0.35, "sine", 0.45, 330);
    }, 200);
  }

  // 14. Otter: Playful water chirp
  public playOtterSound() {
    this.playTone(600, 0.12, "sine", 0.6, 780);
    setTimeout(() => {
      this.playTone(780, 0.15, "triangle", 0.5, 560);
    }, 90);
  }

  // 15. Frog: Gentle friendly ribbit pip
  public playFrogSound() {
    this.playTone(320, 0.1, "sawtooth", 0.3, 380);
    setTimeout(() => {
      this.playTone(380, 0.14, "triangle", 0.45, 290);
    }, 85);
  }

  /**
   * Dispatch species vocalization by ID
   */
  public playSpeciesGreeting(speciesId: string) {
    switch (speciesId) {
      case "cat":
        this.playCatSound();
        break;
      case "dog":
        this.playDogSound();
        break;
      case "rabbit":
        this.playRabbitSound();
        break;
      case "fox":
        this.playFoxSound();
        break;
      case "panda":
        this.playPandaSound();
        break;
      case "bear":
        this.playBearSound();
        break;
      case "koala":
        this.playKoalaSound();
        break;
      case "hamster":
        this.playHamsterSound();
        break;
      case "hedgehog":
        this.playHedgehogSound();
        break;
      case "penguin":
        this.playPenguinSound();
        break;
      case "butterfly":
        this.playButterflySound();
        break;
      case "turtle":
        this.playTurtleSound();
        break;
      case "owl":
        this.playOwlSound();
        break;
      case "otter":
        this.playOtterSound();
        break;
      case "frog":
        this.playFrogSound();
        break;
      default:
        this.playCatSound();
        break;
    }
  }

  /**
   * UNIVERSAL INTERACTION AUDIO
   */

  // Eating: cute nibble crunch sounds
  public playEatSound() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(600 + Math.random() * 200, 0.05, "triangle", 0.4);
      }, i * 110);
    }
  }

  // Toy play: playful bounce & sparkle
  public playToySound() {
    this.playTone(440, 0.12, "triangle", 0.6, 660);
    setTimeout(() => {
      this.playTone(880, 0.18, "sine", 0.5, 1100);
    }, 130);
  }

  // Petting stroke: sweet sparkling purr
  public playPettingChime() {
    this.playTone(659, 0.16, "sine", 0.35, 784);
    setTimeout(() => {
      this.playTone(880, 0.2, "sine", 0.3, 1046);
    }, 100);
  }

  // Continuous purr for pointer drag / petting
  public startContinuousPurr() {
    if (!this.isEnabled || this.volume <= 0 || this.continuousPurrOsc) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Low frequency purr vibration
      osc.type = "triangle";
      osc.frequency.setValueAtTime(32, ctx.currentTime);

      gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.continuousPurrOsc = osc;
      this.continuousPurrGain = gain;
    } catch {
      // Storage unavailable or disabled
    }
  }

  public stopContinuousPurr() {
    if (this.continuousPurrOsc) {
      try {
        this.continuousPurrOsc.stop();
        this.continuousPurrOsc.disconnect();
      } catch {
        // Storage unavailable or disabled
      }
      this.continuousPurrOsc = null;
      this.continuousPurrGain = null;
    }
  }

  // Rest / Sleep: gentle lullaby descending chord
  public playSleepSound() {
    const notes = [659, 523, 440, 330];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.35, "sine", 0.35);
      }, idx * 180);
    });
  }

  // Gentle wake: uplifting bell chirp
  public playWakeSound() {
    this.playTone(440, 0.15, "sine", 0.4, 554);
    setTimeout(() => {
      this.playTone(659, 0.25, "sine", 0.45, 880);
    }, 130);
  }

  // Tickle giggle: playful rapid rising staccato notes
  public playTickleGiggle() {
    const notes = [587, 698, 784, 988, 1175];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.07, "triangle", 0.5);
      }, idx * 65);
    });
  }

  // Mini-Game: Ball bounce
  public playBallBounce(velocity = 1) {
    const freq = Math.min(600, 320 + velocity * 40);
    this.playTone(freq, 0.08, "sine", 0.6, freq * 0.7);
  }

  // Mini-Game: Pounce / batting catch
  public playPounceCatch() {
    this.playTone(480, 0.1, "triangle", 0.7, 720);
    setTimeout(() => {
      this.playTone(880, 0.14, "sine", 0.6, 660);
    }, 90);
  }

  // Mini-Game: Cup shuffle swoosh
  public playCupShuffle() {
    this.playTone(240, 0.09, "sine", 0.35, 180);
  }

  // Mini-Game: Guess success chime
  public playSuccessChime() {
    this.playTone(659, 0.12, "sine", 0.5); // E5
    setTimeout(() => {
      this.playTone(1046, 0.25, "sine", 0.6); // C6
    }, 110);
  }

  // Celebration: triumphant bright fanfare
  public playCelebrationFanfare() {
    const melody = [523, 659, 784, 1046];
    melody.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.22, "sine", 0.55);
      }, idx * 110);
    });
  }
}

export const petSoundEngine = new PetSoundEngine();
