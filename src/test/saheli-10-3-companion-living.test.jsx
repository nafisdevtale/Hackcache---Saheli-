// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PetAnimationMachine } from "../lib/companion/petAnimationMachine";
import { petSoundEngine } from "../lib/companion/petSoundEngine";
import { PET_PERSONALITIES, getPetPersonality } from "../lib/companion/petPersonality";
import { PET_SPECIES } from "../content/pets";
import { InteractiveHabitat } from "../components/nova/companion/InteractiveHabitat";
import { PetActionBar } from "../components/nova/companion/PetActionBar";
import { translate } from "../i18n";

// Polyfill localStorage
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage.clear) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

// Polyfill window.matchMedia
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock App context
const mockAppState = {
  lang: "en",
  t: (key, vars) => translate(mockAppState.lang, key, vars),
};

vi.mock("@/App.jsx", () => ({
  useApp: () => ({
    t: (key, vars) => translate(mockAppState.lang, key, vars),
  }),
}));

describe("SAHELI 10.3 — Living Companion Engine & Procedural Animations", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAppState.lang = "en";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe("1. Pet Personality Catalogue & Completeness", () => {
    it("defines complete personality profiles for all 15 companion species", () => {
      expect(PET_SPECIES.length).toBe(15);
      for (const pet of PET_SPECIES) {
        const personality = getPetPersonality(pet.id);
        expect(personality).toBeDefined();
        expect(personality.id).toBe(pet.id);
        expect(personality.toyEmoji).toBeTruthy();
        expect(personality.treatEmoji).toBeTruthy();
        expect(personality.quotes.length).toBeGreaterThanOrEqual(1);
        expect(personality.curiosityRate).toBeGreaterThan(0);
        expect(personality.blinkIntervalSeconds).toBeGreaterThan(0);
      }
    });
  });

  describe("2. Pet Animation State Machine Transitions", () => {
    it("initializes in idle state and transitions through feeding cycle", () => {
      const machine = new PetAnimationMachine(true); // reduced motion for fast testing
      let state = machine.getState();
      expect(state).toBe("idle");

      const onStateChange = vi.fn((s) => {
        state = s;
      });

      machine.init({
        onStateChange,
        onPositionChange: vi.fn(),
        onBlinkChange: vi.fn(),
        onHeadTiltChange: vi.fn(),
        onEmitParticle: vi.fn(),
      });

      machine.triggerFeed();
      expect(state).toBe("eating");

      act(() => {
        vi.advanceTimersByTime(3100);
      });
      expect(state).toBe("happy");

      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(state).toBe("idle");

      machine.destroy();
    });

    it("handles sleep and wake transitions correctly", () => {
      const machine = new PetAnimationMachine(true);
      let state = machine.getState();

      machine.init({
        onStateChange: (s) => {
          state = s;
        },
        onPositionChange: vi.fn(),
        onBlinkChange: vi.fn(),
        onHeadTiltChange: vi.fn(),
        onEmitParticle: vi.fn(),
      });

      machine.triggerRest();
      expect(state).toBe("sleeping");

      machine.triggerWake();
      expect(state).toBe("waking");

      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(state).toBe("happy");

      act(() => {
        vi.advanceTimersByTime(1300);
      });
      expect(state).toBe("idle");

      machine.destroy();
    });

    it("handles tactile petting interaction lifecycle", () => {
      const machine = new PetAnimationMachine(true);
      let state = machine.getState();

      machine.init({
        onStateChange: (s) => {
          state = s;
        },
        onPositionChange: vi.fn(),
        onBlinkChange: vi.fn(),
        onHeadTiltChange: vi.fn(),
        onEmitParticle: vi.fn(),
      });

      machine.startPetting();
      expect(state).toBe("being_petted");

      machine.endPetting();
      expect(state).toBe("happy");

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(state).toBe("idle");

      machine.destroy();
    });
  });

  describe("3. Web Audio Synthesis Engine", () => {
    it("safely generates species sound effects for all 15 species without exceptions", () => {
      expect(() => {
        for (const pet of PET_SPECIES) {
          petSoundEngine.playSpeciesGreeting(pet.id);
        }
      }).not.toThrow();
    });

    it("safely generates interaction sounds (feed, play, sleep, wake, celebrate, purr)", () => {
      expect(() => {
        petSoundEngine.playEatSound();
        petSoundEngine.playToySound();
        petSoundEngine.playPettingChime();
        petSoundEngine.playSleepSound();
        petSoundEngine.playWakeSound();
        petSoundEngine.playCelebrationFanfare();
        petSoundEngine.startContinuousPurr();
        petSoundEngine.stopContinuousPurr();
      }).not.toThrow();
    });

    it("persists volume and mute settings in localStorage", () => {
      petSoundEngine.setSoundEnabled(false);
      expect(petSoundEngine.getSoundEnabled()).toBe(false);
      expect(localStorage.getItem("saheli_pet_sound_enabled")).toBe("false");

      petSoundEngine.setSoundEnabled(true);
      expect(petSoundEngine.getSoundEnabled()).toBe(true);

      petSoundEngine.setVolume(0.5);
      expect(petSoundEngine.getVolume()).toBe(0.5);
      expect(localStorage.getItem("saheli_pet_sound_volume")).toBe("0.5");
    });
  });

  describe("4. InteractiveHabitat & PetActionBar UI Component", () => {
    it("renders habitat with resting nook, play area, and feeding bowl", () => {
      const onCareAction = vi.fn();
      render(
        <InteractiveHabitat
          speciesId="cat"
          name="Mimi"
          habitatTheme={{
            id: "meadow",
            labelKey: "pet.habitat.meadow",
            bgColor: "from-emerald-50 to-teal-50",
            accentBorder: "border-emerald-200",
          }}
          growthStage={{
            stage: 1,
            labelKey: "pet.stage.new",
            scale: 0.9,
          }}
          onCareAction={onCareAction}
        />,
      );

      expect(screen.getByRole("region", { name: /Mimi Sanctuary Habitat/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Resting Nook" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play Area" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Feeding Bowl" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Mimi, Gentle Cat/i })).toBeInTheDocument();
    });

    it("triggers care actions when clicking habitat anchors", () => {
      const onCareAction = vi.fn();
      render(
        <InteractiveHabitat
          speciesId="dog"
          name="Moti"
          habitatTheme={{
            id: "meadow",
            labelKey: "pet.habitat.meadow",
            bgColor: "bg-amber-50",
            accentBorder: "border-amber-200",
          }}
          growthStage={{
            stage: 2,
            labelKey: "pet.stage.growing",
            scale: 1,
          }}
          onCareAction={onCareAction}
        />,
      );

      const nookBtn = screen.getByRole("button", { name: "Resting Nook" });
      fireEvent.click(nookBtn);

      const playBtn = screen.getByRole("button", { name: "Play Area" });
      fireEvent.click(playBtn);

      const bowlBtn = screen.getByRole("button", { name: "Feeding Bowl" });
      fireEvent.click(bowlBtn);
    });

    it("renders PetActionBar with 5 care actions and handles clicks", () => {
      const onAction = vi.fn();
      render(<PetActionBar speciesId="rabbit" onAction={onAction} />);

      expect(screen.getByText("Care & Mindful Moments")).toBeInTheDocument();
      expect(screen.getByText("Offer Treat")).toBeInTheDocument();
      expect(screen.getByText("Gentle Play")).toBeInTheDocument();
      expect(screen.getByText("Brush & Groom")).toBeInTheDocument();
      expect(screen.getByText("Cozy Rest")).toBeInTheDocument();
      expect(screen.getByText("Show Love")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Offer Treat"));
      expect(onAction).toHaveBeenCalledWith("feed");

      fireEvent.click(screen.getByText("Gentle Play"));
      expect(onAction).toHaveBeenCalledWith("play");
    });
  });
});
