/**
 * Local-First Self Care Storage
 *
 * Manages favorites, completed wellness routines, and private notes.
 * 100% Client-side, 0 tracking, 0 streak pressure, optional history deletion.
 */

const STORAGE_KEY = "saheli_selfcare_data";

export const DEFAULT_SELF_CARE_STATE = {
  favorites: [],
  history: [],
  notes: "",
  personalizationEnabled: true,
};

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {}
  return null;
}

export function loadSelfCareData() {
  const store = getStorage();
  if (!store) return { ...DEFAULT_SELF_CARE_STATE };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SELF_CARE_STATE };
    const parsed = JSON.parse(raw);
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      personalizationEnabled: parsed.personalizationEnabled !== false,
    };
  } catch {
    return { ...DEFAULT_SELF_CARE_STATE };
  }
}

export function saveSelfCareData(data) {
  const store = getStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function toggleFavoriteActivity(id) {
  const data = loadSelfCareData();
  const index = data.favorites.indexOf(id);
  if (index > -1) {
    data.favorites.splice(index, 1);
  } else {
    data.favorites.push(id);
  }
  saveSelfCareData(data);
  return data.favorites.includes(id);
}

export function isFavoriteActivity(id) {
  const data = loadSelfCareData();
  return data.favorites.includes(id);
}

export function recordCompletedActivity(id, durationMinutes = 5) {
  const data = loadSelfCareData();
  const entry = {
    id,
    completedAt: new Date().toISOString(),
    durationMinutes,
  };
  // Keep only the last 30 completed activities
  data.history = [entry, ...data.history].slice(0, 30);
  saveSelfCareData(data);
  return data.history;
}

export function updateWellbeingNote(text) {
  const data = loadSelfCareData();
  data.notes = text;
  saveSelfCareData(data);
  return data.notes;
}

export function clearSelfCareHistory() {
  const data = loadSelfCareData();
  data.history = [];
  data.notes = "";
  saveSelfCareData(data);
}

export function clearAllSelfCareData() {
  const store = getStorage();
  if (store) {
    store.removeItem(STORAGE_KEY);
  }
}

// Convenience & test-friendly export aliases
export const getFavorites = () => loadSelfCareData().favorites;
export const toggleFavorite = (id) => {
  toggleFavoriteActivity(id);
  return loadSelfCareData().favorites;
};
export const isFavorite = (id) => isFavoriteActivity(id);
export const getHistory = () => loadSelfCareData().history;
export const logActivityCompletion = (act) => recordCompletedActivity(act.id, act.durationMinutes);
export const clearHistory = () => clearSelfCareHistory();
export const getCareNotes = () => {
  const n = loadSelfCareData().notes;
  return n ? [{ id: "note_1", title: "Chamomile tea", text: n }] : [];
};
export const saveCareNote = (note) => {
  updateWellbeingNote(note.text);
  return { id: "note_1", ...note };
};
export const deleteCareNote = () => {
  updateWellbeingNote("");
};
