import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadChimeSettings,
  saveChimeSettings,
  playSaheliChime,
  DEFAULT_CHIME_SETTINGS,
} from "@/lib/chime.js";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("Saheli 7.2 — Procedural Web Audio Chime Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Settings & Persistence", () => {
    it("loads standard defaults when uninitialized", () => {
      const settings = loadChimeSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.volume).toBe(0.6);
      expect(settings.silentMode).toBe(false);
      expect(settings.reducedSensory).toBe(false);
    });

    it("clamps volume safely between 0.0 and 1.0", () => {
      saveChimeSettings({ enabled: true, volume: 1.5, silentMode: false, reducedSensory: false });
      expect(loadChimeSettings().volume).toBe(1.0);

      saveChimeSettings({ enabled: true, volume: -0.2, silentMode: false, reducedSensory: false });
      expect(loadChimeSettings().volume).toBe(0.0);
    });

    it("persists and restores reduced sensory stimulation preferences", () => {
      saveChimeSettings({ enabled: true, volume: 0.4, silentMode: false, reducedSensory: true });
      const loaded = loadChimeSettings();
      expect(loaded.reducedSensory).toBe(true);
      expect(loaded.volume).toBe(0.4);
    });
  });

  describe("Privacy & Discreet Mode Muting", () => {
    it("strictly silences chime when discreet mode is active", async () => {
      const played = await playSaheliChime({ discreetMode: true });
      expect(played).toBe(false);
    });

    it("strictly silences chime when volume is zero or disabled", async () => {
      saveChimeSettings({ enabled: false, volume: 0.6, silentMode: false });
      const playedDisabled = await playSaheliChime();
      expect(playedDisabled).toBe(false);

      saveChimeSettings({ enabled: true, volume: 0, silentMode: false });
      const playedZeroVol = await playSaheliChime();
      expect(playedZeroVol).toBe(false);

      saveChimeSettings({ enabled: true, volume: 0.6, silentMode: true });
      const playedSilent = await playSaheliChime();
      expect(playedSilent).toBe(false);
    });
  });

  describe("Web Audio Triadic Synthesis", () => {
    it("instantiates Web Audio oscillators with E-major triadic frequencies and envelope", async () => {
      const createdOscillators = [];
      const createdGainNodes = [];

      class MockGainNode {
        constructor() {
          this.gain = {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          };
        }
        connect() {}
      }

      class MockOscillator {
        constructor() {
          this.type = "sine";
          this.frequency = {
            setValueAtTime: vi.fn(),
          };
          this.start = vi.fn();
          this.stop = vi.fn();
        }
        connect() {}
      }

      class MockAudioContext {
        constructor() {
          this.currentTime = 0;
          this.state = "running";
          this.destination = {};
        }
        createGain() {
          const g = new MockGainNode();
          createdGainNodes.push(g);
          return g;
        }
        createOscillator() {
          const osc = new MockOscillator();
          createdOscillators.push(osc);
          return osc;
        }
        close() {
          return Promise.resolve();
        }
      }

      globalThis.window = globalThis.window || {};
      globalThis.window.AudioContext = MockAudioContext;

      saveChimeSettings({ enabled: true, volume: 0.8, silentMode: false, reducedSensory: false });

      const played = await playSaheliChime();
      expect(played).toBe(true);

      // 4 bell tones: E5, G#5, B5, E6
      expect(createdOscillators.length).toBe(4);
      expect(createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0.0);
      expect(createdOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(830.61, 0.05);
      expect(createdOscillators[2].frequency.setValueAtTime).toHaveBeenCalledWith(987.77, 0.1);
      expect(createdOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(1318.51, 0.15);

      // Verify start calls
      expect(createdOscillators[0].start).toHaveBeenCalled();
    });

    it("uses softer acoustic attack when reduced sensory mode is enabled", async () => {
      const createdGainNodes = [];
      class MockGainNode {
        constructor() {
          this.gain = {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          };
        }
        connect() {}
      }
      class MockOscillator {
        constructor() {
          this.frequency = { setValueAtTime: vi.fn() };
          this.start = vi.fn();
          this.stop = vi.fn();
        }
        connect() {}
      }
      class MockAudioContext {
        constructor() {
          this.currentTime = 0;
          this.state = "running";
          this.destination = {};
        }
        createGain() {
          const g = new MockGainNode();
          createdGainNodes.push(g);
          return g;
        }
        createOscillator() {
          return new MockOscillator();
        }
        close() {
          return Promise.resolve();
        }
      }

      globalThis.window = globalThis.window || {};
      globalThis.window.AudioContext = MockAudioContext;

      // Play with reduced sensory mode
      const played = await playSaheliChime({ reducedSensory: true });
      expect(played).toBe(true);

      // First noteGain is createdGainNodes[1] (createdGainNodes[0] is master gain)
      const noteGain1 = createdGainNodes[1];
      // Attack for reduced sensory is 0.08s (ramp to peak value at 0 + 0.08)
      expect(noteGain1.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.5, 0.08);
    });
  });
});
