/**
 * Saheli 7.3 — My Saheli Companion Storage & State Manager
 *
 * Privacy & Ethical Charter:
 * - 100% on-device storage in `saheli_companion_data`.
 * - Completely isolated from menstrual records, symptom diaries, and medical history.
 * - Gentle growth driven purely by optional care actions and elapsed time.
 * - STRICTLY NO streak penalties: pets never get sick, die, disappear, or show distress.
 * - Zero remote data transmission.
 */

import { PET_SPECIES, GROWTH_STAGES } from "@/content/pets.js";

const COMPANION_STORAGE_KEY = "saheli_companion_data";

export const DEFAULT_COMPANION_STATE = {
  isAdopted: false,
  speciesId: "cat",
  name: "Mimi",
  growthStage: 1, // 1: New, 2: Growing, 3: Established, 4: Mature
  interactionsCount: 0,
  habitat: "meadow",
  accessory: "none",
  currentMood: "happy",
  lastInteractedAt: null,
  createdAt: null,
  hasCelebratedStage: 1,
  favoriteToy: "yarnBall",
};

/**
 * Sanitize custom pet names while preserving international Unicode scripts
 * (Hindi, Bengali, Urdu, Tamil, Telugu, Marathi, etc.)
 */
export function sanitizePetName(name, fallback = "Saheli Companion") {
  if (typeof name !== "string") return fallback;
  const trimmed = name.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  if (!trimmed) return fallback;
  return trimmed.substring(0, 30);
}

export function loadCompanionState() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(COMPANION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const speciesValid = PET_SPECIES.some((p) => p.id === parsed.speciesId);

        return {
          ...DEFAULT_COMPANION_STATE,
          ...parsed,
          speciesId: speciesValid ? parsed.speciesId : "cat",
          name: sanitizePetName(parsed.name, "Mimi"),
          growthStage: Math.max(1, Math.min(4, Number(parsed.growthStage) || 1)),
          interactionsCount: Math.max(0, Number(parsed.interactionsCount) || 0),
          isAdopted: !!parsed.isAdopted,
        };
      }
    }
  } catch {}
  return { ...DEFAULT_COMPANION_STATE };
}

export function saveCompanionState(state) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}

export function calculateGrowthStage(interactionsCount) {
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (interactionsCount >= GROWTH_STAGES[i].minInteractions) {
      return GROWTH_STAGES[i].stage;
    }
  }
  return 1;
}

export function adoptPet(speciesId, customName, habitat = "meadow", accessory = "none") {
  const species = PET_SPECIES.find((p) => p.id === speciesId) || PET_SPECIES[0];
  const name = sanitizePetName(customName, species.defaultName);
  const now = new Date().toISOString();

  const newState = {
    ...DEFAULT_COMPANION_STATE,
    isAdopted: true,
    speciesId: species.id,
    name,
    habitat,
    accessory,
    growthStage: 1,
    interactionsCount: 0,
    currentMood: "happy",
    lastInteractedAt: now,
    createdAt: now,
    hasCelebratedStage: 1,
  };

  saveCompanionState(newState);
  return newState;
}

export function updatePetDetails({ name, habitat, accessory, speciesId }) {
  const state = loadCompanionState();
  if (name !== undefined) state.name = sanitizePetName(name, state.name);
  if (habitat !== undefined) state.habitat = habitat;
  if (accessory !== undefined) state.accessory = accessory;
  if (speciesId !== undefined && PET_SPECIES.some((p) => p.id === speciesId)) {
    state.speciesId = speciesId;
  }
  saveCompanionState(state);
  return state;
}

export function performCareActivity(activityType) {
  const state = loadCompanionState();
  if (!state.isAdopted) return state;

  state.interactionsCount += 1;
  const newStage = calculateGrowthStage(state.interactionsCount);
  const stageUp = newStage > state.growthStage;
  state.growthStage = newStage;
  state.lastInteractedAt = new Date().toISOString();

  // Mood transitions purely based on gameplay
  switch (activityType) {
    case "feed":
      state.currentMood = "happy";
      break;
    case "play":
    case "toy":
      state.currentMood = "playful";
      break;
    case "rest":
      state.currentMood = "sleepy";
      break;
    case "brush":
    case "groom":
      state.currentMood = "calm";
      break;
    case "affection":
      state.currentMood = "happy";
      break;
    case "curious":
      state.currentMood = "curious";
      break;
    default:
      state.currentMood = "happy";
  }

  saveCompanionState(state);
  return { state, stageUp };
}

export function dispatchCareAction(stateOrType, optionalType) {
  if (typeof stateOrType === "string") {
    const res = performCareActivity(stateOrType);
    return { newState: res.state, stageChanged: res.stageUp };
  }
  const state = { ...stateOrType };
  state.interactionsCount += 1;
  const newStage = calculateGrowthStage(state.interactionsCount);
  const stageChanged = newStage > state.growthStage;
  state.growthStage = newStage;
  state.lastInteractedAt = new Date().toISOString();
  saveCompanionState(state);
  return { newState: state, stageChanged };
}

export function dismissGrowthCelebration() {
  const state = loadCompanionState();
  state.hasCelebratedStage = state.growthStage;
  saveCompanionState(state);
  return state;
}

export function resetCompanion() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(COMPANION_STORAGE_KEY);
    }
  } catch {}
  return { ...DEFAULT_COMPANION_STATE };
}
