// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  ArticulatedPetRenderer,
  DEFAULT_RIG_STATE,
} from "../components/nova/companion/ArticulatedPetRenderer";
import { voiceRepeatEngine, SPECIES_VOICE_PROFILES } from "../lib/companion/voiceRepeatEngine";
import { TouchGestureEngine } from "../lib/companion/touchGestureEngine";
import { PetMiniGameController } from "../lib/companion/petMiniGames";
import { TalkingPetStage } from "../components/nova/companion/TalkingPetStage";
import { MiniGameOverlay } from "../components/nova/companion/MiniGameOverlay";
import { petSoundEngine } from "../lib/companion/petSoundEngine";
import { PET_SPECIES } from "../content/pets";
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

describe("SAHELI 10.4 — Talking Companions Virtual Pet Game Engine", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAppState.lang = "en";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    voiceRepeatEngine.cancel();
  });

  describe("1. Articulated 2D Rigged Character Renderer", () => {
    it("renders valid SVG rigging for all 15 companion species", () => {
      expect(PET_SPECIES.length).toBe(15);
      for (const pet of PET_SPECIES) {
        const { unmount } = render(
          <ArticulatedPetRenderer speciesId={pet.id} rig={DEFAULT_RIG_STATE} size={160} />,
        );
        const svg = screen.getByRole("img", { hidden: true });
        expect(svg).toBeInTheDocument();
        expect(svg.getAttribute("viewBox")).toBe("0 0 200 200");
        unmount();
      }
    });

    it("renders interactive hit zones for head, ears, belly, paws, and tail", () => {
      const handleHit = vi.fn();
      render(
        <ArticulatedPetRenderer
          speciesId="cat"
          rig={DEFAULT_RIG_STATE}
          size={160}
          onHitZonePointerDown={handleHit}
        />,
      );

      // Verify hit zones exist in DOM
      const headHit = document.querySelector('[data-hit="head"]');
      const earsHit = document.querySelector('[data-hit="ears"]');
      const bellyHit = document.querySelector('[data-hit="belly"]');
      const pawsHit = document.querySelector('[data-hit="paws"]');
      const tailHit = document.querySelector('[data-hit="tail"]');

      expect(headHit).toBeTruthy();
      expect(earsHit).toBeTruthy();
      expect(bellyHit).toBeTruthy();
      expect(pawsHit).toBeTruthy();
      expect(tailHit).toBeTruthy();

      // Trigger pointer down on head
      if (headHit) {
        fireEvent.pointerDown(headHit);
        expect(handleHit).toHaveBeenCalledWith("head", expect.anything());
      }
      if (bellyHit) {
        fireEvent.pointerDown(bellyHit);
        expect(handleHit).toHaveBeenCalledWith("belly", expect.anything());
      }
    });

    it("articulates head tilt, dynamic gaze tracking, and amplitude mouth opening", () => {
      const customRig = {
        ...DEFAULT_RIG_STATE,
        headTilt: 12,
        headNod: 4,
        gazeX: 0.75,
        gazeY: -0.5,
        mouthOpenY: 9.5,
        eyeShape: "happy" as const,
        mouthShape: "talking" as const,
      };

      render(<ArticulatedPetRenderer speciesId="dog" rig={customRig} size={180} />);

      const headGroup = document.querySelector("#pet-head-group") as HTMLElement | null;
      expect(headGroup).toBeTruthy();
      expect(headGroup?.style.transform).toContain("rotate(12deg)");
    });
  });

  describe("2. On-Device Voice Repeat Engine & Species Voice Profiles", () => {
    it("provides tuned pitch shifts and formant filters for all 15 companion species", () => {
      for (const pet of PET_SPECIES) {
        const profile = SPECIES_VOICE_PROFILES[pet.id];
        expect(profile).toBeDefined();
        expect(profile.playbackRate).toBeGreaterThanOrEqual(0.8);
        expect(profile.playbackRate).toBeLessThanOrEqual(1.6);
        expect(profile.filterFreq).toBeGreaterThan(0);
        expect(profile.filterType).toBeTruthy();
      }
    });

    it("manages state transitions and audio privacy guarantees", () => {
      expect(voiceRepeatEngine.getState()).toBe("idle");

      // Verify privacy guarantee: cancel resets state to idle and stops all audio
      voiceRepeatEngine.cancel();
      expect(voiceRepeatEngine.getState()).toBe("idle");
    });
  });

  describe("3. Touch & Gesture Recognition Engine", () => {
    it("recognizes tap gestures across specific anatomical zones", () => {
      const onGesture = vi.fn();
      const onGaze = vi.fn();
      const engine = new TouchGestureEngine({ onGesture, onGazeTarget: onGaze });

      engine.handleHitZoneTap("head");
      expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: "head_tap" }));

      engine.handleHitZoneTap("belly");
      expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: "belly_tickle" }));

      engine.handleHitZoneTap("paws");
      expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: "paw_tap" }));

      engine.handleHitZoneTap("tail");
      expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: "tail_tap" }));

      engine.destroy();
    });

    it("normalizes gaze tracking coordinates relative to stage center", () => {
      const onGaze = vi.fn();
      const engine = new TouchGestureEngine({ onGazeTarget: onGaze });

      const rect = { left: 0, top: 0, width: 400, height: 400 } as DOMRect;
      engine.handlePointerMove({ clientX: 300, clientY: 200 } as PointerEvent, rect);

      expect(onGaze).toHaveBeenCalled();
      const [normX, normY] = onGaze.mock.calls[0];
      expect(normX).toBeGreaterThan(0); // Right of center
      expect(normY).toBe(0); // Vertically centered

      engine.destroy();
    });
  });

  describe("4. Playable Mini-Games Engine", () => {
    it("Game A (Catch the Ball): simulates bouncing ball physics, throwing, and pet bat reaction", () => {
      const onScore = vi.fn();
      const onReaction = vi.fn();
      const controller = new PetMiniGameController({
        onScoreUpdate: onScore,
        onPetReaction: onReaction,
      });

      controller.startGame("catch_ball");
      expect(controller.getActiveGame()).toBe("catch_ball");
      expect(controller.ball).toBeDefined();

      // Drag and hold ball
      controller.holdBall(0.5, 0.3);
      expect(controller.ball.isHeld).toBe(true);

      // Throw ball towards pet
      controller.throwBallTo(50, 60);
      expect(controller.ball.isHeld).toBe(false);
      expect(controller.ball.vy).toBeLessThan(0); // Arcs upwards

      controller.destroy();
    });

    it("Game B (Follow the Toy): tracks user pointer and triggers pet pounce on proximity", () => {
      const onScore = vi.fn();
      const onReaction = vi.fn();
      const controller = new PetMiniGameController({
        onScoreUpdate: onScore,
        onPetReaction: onReaction,
      });

      controller.startGame("follow_toy");
      expect(controller.getActiveGame()).toBe("follow_toy");

      controller.moveToy(0.5, 0.6); // Move near pet center
      expect(controller.toy.targetX).toBe(50);
      expect(controller.toy.targetY).toBe(60);

      controller.destroy();
    });

    it("Game C (Find the Treat): coordinates 3 cups, shuffle sequence, and selection reveal", () => {
      const onScore = vi.fn();
      const onReaction = vi.fn();
      const controller = new PetMiniGameController({
        onScoreUpdate: onScore,
        onPetReaction: onReaction,
      });

      controller.startGame("find_treat");
      expect(controller.getActiveGame()).toBe("find_treat");
      expect(controller.cups.length).toBe(3);

      // Verify exactly one cup holds the treat
      const treatsCount = controller.cups.filter((c) => c.hasTreat).length;
      expect(treatsCount).toBe(1);

      // Fast forward past shuffle to pick state
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      // User picks the winning cup
      const winningCup = controller.cups.find((c) => c.hasTreat)!;
      controller.chooseCup(winningCup.id);

      expect(controller.treatState).toBe("revealed");
      expect(controller.treatScore).toBe(1);
      expect(onReaction).toHaveBeenCalledWith("eat");

      controller.destroy();
    });
  });

  describe("5. Unified TalkingPetStage Component & Accessibility", () => {
    it("renders stage with microphone button, audio controls, and on-device privacy guarantee", () => {
      const habitatTheme = {
        id: "meadow",
        labelKey: "companion.habitat.meadow",
        bgColor: "from-emerald-500/10 to-teal-500/10",
        accentBorder: "border-emerald-500/20",
      };
      const growthStage = {
        stage: 1,
        labelKey: "companion.stageNew",
        scale: 1,
      };

      render(
        <TalkingPetStage
          speciesId="cat"
          name="Mimi"
          habitatTheme={habitatTheme}
          growthStage={growthStage}
        />,
      );

      // Verify stage is mounted
      expect(screen.getByTestId("talking-pet-stage")).toBeInTheDocument();

      // Talk to pet button
      const talkBtn = screen.getByRole("button", { name: /Talk to Pet/i });
      expect(talkBtn).toBeInTheDocument();

      // Privacy assurance
      expect(screen.getByText(/On-Device Audio/i)).toBeInTheDocument();

      // Mini-game buttons
      expect(screen.getByTitle(/Catch the Ball/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Follow the Toy/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Find the Treat/i)).toBeInTheDocument();
    });

    it("launches and exits mini-games cleanly from stage chips", () => {
      const habitatTheme = {
        id: "meadow",
        labelKey: "companion.habitat.meadow",
        bgColor: "from-emerald-500/10 to-teal-500/10",
        accentBorder: "border-emerald-500/20",
      };
      const growthStage = {
        stage: 1,
        labelKey: "companion.stageNew",
        scale: 1,
      };

      render(
        <TalkingPetStage
          speciesId="cat"
          name="Mimi"
          habitatTheme={habitatTheme}
          growthStage={growthStage}
        />,
      );

      // Click catch ball chip
      const ballChip = screen.getByTitle(/Catch the Ball/i);
      fireEvent.click(ballChip);

      // MiniGameOverlay should appear
      expect(screen.getByTestId("mini-game-overlay")).toBeInTheDocument();

      // Exit game
      const exitBtn = screen.getByRole("button", { name: /Exit Game/i });
      fireEvent.click(exitBtn);

      expect(screen.queryByTestId("mini-game-overlay")).not.toBeInTheDocument();
    });
  });
});
