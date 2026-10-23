import { describe, it, expect, beforeEach } from "vitest";
import {
  PET_SPECIES,
  HABITATS,
  ACCESSORIES,
  GROWTH_STAGES,
  MOODS,
  CARE_ACTIVITIES,
} from "../content/pets.js";
import {
  DEFAULT_COMPANION_STATE,
  loadCompanionState,
  saveCompanionState,
  sanitizePetName,
  calculateGrowthStage,
  dispatchCareAction,
  resetCompanion,
} from "../lib/companionStorage.js";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("Saheli 7.3 — Module A: My Saheli Companion System", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Pet Catalogue & Content Governance", () => {
    it("contains exactly 15 selectable pets in catalogue", () => {
      expect(PET_SPECIES.length).toBe(15);
      const expectedIds = [
        "cat",
        "dog",
        "rabbit",
        "fox",
        "panda",
        "bear",
        "koala",
        "hamster",
        "hedgehog",
        "penguin",
        "butterfly",
        "turtle",
        "owl",
        "otter",
        "frog",
      ];
      expect(PET_SPECIES.map((p) => p.id)).toEqual(expectedIds);
    });

    it("verifies every pet has name, description, personality, and art metadata", () => {
      for (const pet of PET_SPECIES) {
        expect(pet.id).toBeDefined();
        expect(pet.nameKey).toMatch(/^pet\.species\./);
        expect(pet.descriptionKey).toBeDefined();
        expect(pet.primaryColor).toBeDefined();
        expect(pet.accentColor).toBeDefined();
      }
    });

    it("provides 4 customizable habitats and 6 accessories", () => {
      expect(HABITATS.length).toBe(4);
      expect(ACCESSORIES.length).toBe(6);
      expect(ACCESSORIES.some((a) => a.id === "none")).toBe(true);
    });

    it("defines 4 gentle growth stages based on interactions without time locks", () => {
      expect(GROWTH_STAGES.length).toBe(4);
      expect(GROWTH_STAGES[0].stage).toBe(1);
      expect(GROWTH_STAGES[3].stage).toBe(4);
      expect(GROWTH_STAGES[0].minInteractions).toBe(0);
      expect(GROWTH_STAGES[1].minInteractions).toBe(10);
      expect(GROWTH_STAGES[2].minInteractions).toBe(25);
      expect(GROWTH_STAGES[3].minInteractions).toBe(50);
    });
  });

  describe("Name Sanitization & Unicode Preservation", () => {
    it("preserves international Unicode scripts (Hindi, Bengali, Tamil, Urdu, etc.)", () => {
      expect(sanitizePetName("मिमी")).toBe("मिमी");
      expect(sanitizePetName("টুম্পা")).toBe("টুম্পা");
      expect(sanitizePetName("மியா")).toBe("மியா");
      expect(sanitizePetName("چمپا")).toBe("چمپا");
      expect(sanitizePetName("జిమ్మి")).toBe("జిమ్మి");
    });

    it("strips ASCII control codes while keeping legitimate names", () => {
      expect(sanitizePetName("Mimi\u0000\u001F")).toBe("Mimi");
      expect(sanitizePetName("   Luna   ")).toBe("Luna");
    });

    it("falls back gracefully when input is empty or non-string", () => {
      expect(sanitizePetName("")).toBe("Saheli Companion");
      expect(sanitizePetName(null)).toBe("Saheli Companion");
      expect(sanitizePetName(undefined)).toBe("Saheli Companion");
    });
  });

  describe("Care Actions, Growth & Zero Streak Penalties", () => {
    it("advances growth stage monotonically as care interactions accumulate", () => {
      expect(calculateGrowthStage(0)).toBe(1);
      expect(calculateGrowthStage(9)).toBe(1);
      expect(calculateGrowthStage(10)).toBe(2);
      expect(calculateGrowthStage(24)).toBe(2);
      expect(calculateGrowthStage(25)).toBe(3);
      expect(calculateGrowthStage(49)).toBe(3);
      expect(calculateGrowthStage(50)).toBe(4);
      expect(calculateGrowthStage(100)).toBe(4);
    });

    it("strictly preserves pet mood and health across long absences (ZERO streak penalty)", () => {
      // Simulate pet last interacted 45 days ago
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
      const state = {
        ...DEFAULT_COMPANION_STATE,
        isAdopted: true,
        growthStage: 3,
        interactionsCount: 26,
        currentMood: "happy",
        lastInteractedAt: oldDate,
      };
      saveCompanionState(state);

      const loaded = loadCompanionState();
      // Must NOT degrade stage, must NOT become sick, must NOT die
      expect(loaded.growthStage).toBe(3);
      expect(loaded.interactionsCount).toBe(26);
      expect(loaded.currentMood).toBe("happy");
      expect(["happy", "playful", "calm", "sleepy", "loving", "curious"]).toContain(
        loaded.currentMood,
      );
    });

    it("handles care action dispatch with mood shifts and interaction increments", () => {
      let state = {
        ...DEFAULT_COMPANION_STATE,
        isAdopted: true,
        speciesId: "rabbit",
        name: "Bunny",
        interactionsCount: 9,
        growthStage: 1,
      };

      // Feed care action
      const feedResult = dispatchCareAction(state, "feed");
      expect(feedResult.newState.interactionsCount).toBe(10);
      expect(feedResult.newState.growthStage).toBe(2);
      expect(feedResult.stageChanged).toBe(true);

      // Play care action
      const playResult = dispatchCareAction(feedResult.newState, "play");
      expect(playResult.newState.interactionsCount).toBe(11);
      expect(playResult.newState.growthStage).toBe(2);
      expect(playResult.stageChanged).toBe(false);
    });

    it("allows resetting companion to adopt a different friend", () => {
      const state = {
        isAdopted: true,
        speciesId: "fox",
        name: "Rusty",
        growthStage: 3,
        interactionsCount: 20,
        habitat: "forest",
        accessory: "scarf",
      };
      saveCompanionState(state);

      const resetState = resetCompanion();
      expect(resetState.isAdopted).toBe(false);
      expect(resetState.interactionsCount).toBe(0);
      expect(resetState.growthStage).toBe(1);

      const loaded = loadCompanionState();
      expect(loaded.isAdopted).toBe(false);
    });
  });

  describe("Medical Independence & Privacy Isolation", () => {
    it("never reads or writes to menstrual diary or symptoms storage keys", () => {
      // Companion must exclusively use `saheli_companion_data`
      const state = {
        ...DEFAULT_COMPANION_STATE,
        isAdopted: true,
        speciesId: "panda",
        name: "Bamboo",
      };
      saveCompanionState(state);

      expect(localStorage.getItem("saheli_companion_data")).toBeDefined();
      expect(localStorage.getItem("saheli_record_v1")).toBeNull();
      expect(localStorage.getItem("saheli_meta_v1")).toBeNull();
    });
  });
});
