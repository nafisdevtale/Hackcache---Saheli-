import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SELF_CARE_PROGRAMMES,
  SOUNDSCAPES,
  QUICK_SHORTCUTS,
  getPersonalizedSelfCare,
} from "@/content/selfCare.js";
import { SOURCES } from "@/content/sources.js";
import {
  getSoundscapeState,
  toggleSoundscape,
  setSoundVolume,
  setMasterVolume,
  toggleMute,
  setSleepTimer,
  stopAllSoundscapes,
  subscribeSoundscapes,
} from "@/lib/soundscapes.js";
import {
  getFavorites,
  toggleFavorite,
  isFavorite,
  getHistory,
  logActivityCompletion,
  clearHistory,
  getCareNotes,
  saveCareNote,
  deleteCareNote,
} from "@/lib/selfCareStorage.js";
import { DICTS } from "@/i18n/index.js";
import { LANGUAGES } from "@/i18n/languages.js";

// Setup browser mock environment for headless testing
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("Saheli 7.1 — Self Care & Wellness Studio", () => {
  beforeEach(() => {
    localStorage.clear();
    stopAllSoundscapes();
  });

  afterEach(() => {
    stopAllSoundscapes();
    localStorage.clear();
  });

  describe("Module 1: Content & Evidence Governance", () => {
    it("all 9 structured self care programmes exist with complete metadata", () => {
      expect(SELF_CARE_PROGRAMMES.length).toBe(9);

      const validEvidenceLevels = [
        "evidence_informed",
        "wellbeing_practice",
        "personal_preference",
      ];

      for (const prog of SELF_CARE_PROGRAMMES) {
        expect(prog.id).toBeTruthy();
        expect(prog.titleKey).toMatch(/^selfcare\.prog\./);
        expect(prog.descKey).toMatch(/^selfcare\.prog\./);
        expect(prog.category).toMatch(/^(comfort|movement|relaxation|hygiene|breathing)$/);
        expect(prog.suggestedDuration).toBeGreaterThan(0);
        expect(prog.steps).toBeInstanceOf(Array);
        expect(prog.steps.length).toBeGreaterThanOrEqual(3);
        expect(validEvidenceLevels).toContain(prog.evidenceLevel);
        expect(prog.sourceIds).toBeInstanceOf(Array);
        expect(prog.sourceIds.length).toBeGreaterThan(0);

        // All cited sources must exist in SOURCES
        for (const srcId of prog.sourceIds) {
          expect(
            SOURCES[srcId],
            `Source ${srcId} cited in ${prog.id} must exist in SOURCES`,
          ).toBeDefined();
        }

        // Each step has titleKey and textKey
        for (const step of prog.steps) {
          expect(step.step).toBeGreaterThan(0);
          expect(step.titleKey).toBeTruthy();
          expect(step.textKey).toBeTruthy();
        }
      }
    });

    it("all 10 soundscapes have complete metadata and valid icons", () => {
      expect(SOUNDSCAPES.length).toBe(10);
      for (const sound of SOUNDSCAPES) {
        expect(sound.id).toBeTruthy();
        expect(sound.titleKey).toMatch(/^selfcare\.sound\./);
        expect(sound.descKey).toMatch(/^selfcare\.sound\./);
        expect(sound.iconName).toBeDefined();
      }
    });

    it("all 7 quick shortcuts exist and point to valid target programmes", () => {
      expect(QUICK_SHORTCUTS.length).toBe(7);
      for (const sc of QUICK_SHORTCUTS) {
        expect(sc.id).toBeTruthy();
        expect(sc.titleKey).toMatch(/^selfcare\.quick\./);
        expect(sc.targetProgrammeId).toBeTruthy();
        expect(sc.iconName).toBeDefined();
        // Target programme must exist in SELF_CARE_PROGRAMMES
        const target = SELF_CARE_PROGRAMMES.find((p) => p.id === sc.targetProgrammeId);
        expect(target, `Target programme ${sc.targetProgrammeId} not found`).toBeDefined();
      }
    });
  });

  describe("Module 2: Procedural Web Audio Engine", () => {
    it("manages playback state, master volume, and individual volumes", () => {
      setMasterVolume(0.6);
      let state = getSoundscapeState();
      expect(state.isPlaying).toBe(false);
      expect(state.masterVolume).toBe(0.6);
      expect(state.isMuted).toBe(false);
      expect(state.timerRemaining).toBe(0);

      // Set master volume
      setMasterVolume(0.5);
      state = getSoundscapeState();
      expect(state.masterVolume).toBe(0.5);

      // Clamp master volume
      setMasterVolume(1.5);
      expect(getSoundscapeState().masterVolume).toBe(1.0);
      setMasterVolume(-0.2);
      expect(getSoundscapeState().masterVolume).toBe(0.0);

      // Set individual volume
      setSoundVolume("rain", 0.8);
      expect(getSoundscapeState().soundVolumes.rain).toBe(0.8);

      // Toggle mute
      toggleMute();
      expect(getSoundscapeState().isMuted).toBe(true);
      toggleMute();
      expect(getSoundscapeState().isMuted).toBe(false);

      // Sleep timer setting
      setSleepTimer(15);
      expect(getSoundscapeState().timerRemaining).toBe(15 * 60);
      setSleepTimer(null);
      expect(getSoundscapeState().timerRemaining).toBe(0);
    });

    it("supports state subscription callbacks", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeSoundscapes(listener);

      setMasterVolume(0.6);
      expect(listener).toHaveBeenCalled();

      unsubscribe();
      const callCount = listener.mock.calls.length;
      setMasterVolume(0.4);
      expect(listener.mock.calls.length).toBe(callCount);
    });

    it("supports toggle and stop of soundscapes without remote network", () => {
      toggleSoundscape("rain");
      let state = getSoundscapeState();
      expect(state.activeSounds).toContain("rain");

      stopAllSoundscapes();
      state = getSoundscapeState();
      expect(state.activeSounds.length).toBe(0);
      expect(state.isPlaying).toBe(false);
    });
  });

  describe("Module 3: Storage & Local Privacy", () => {
    it("toggles and checks favorites in local storage without network", () => {
      expect(getFavorites()).toEqual([]);
      expect(isFavorite("routine_gentle_warmth")).toBe(false);

      const favs = toggleFavorite("routine_gentle_warmth");
      expect(favs).toContain("routine_gentle_warmth");
      expect(isFavorite("routine_gentle_warmth")).toBe(true);

      const unfavs = toggleFavorite("routine_gentle_warmth");
      expect(unfavs).not.toContain("routine_gentle_warmth");
      expect(isFavorite("routine_gentle_warmth")).toBe(false);
    });

    it("logs activity completion and provides clear history", () => {
      expect(getHistory()).toEqual([]);

      logActivityCompletion({
        id: "routine_gentle_warmth",
        title: "Gentle Warmth & Rest",
        category: "comfort",
        durationMinutes: 10,
      });

      const history = getHistory();
      expect(history.length).toBe(1);
      expect(history[0].id).toBe("routine_gentle_warmth");
      expect(history[0].durationMinutes).toBe(10);
      expect(history[0].completedAt).toBeTruthy();

      // Clear history
      clearHistory();
      expect(getHistory()).toEqual([]);
    });

    it("stores and manages private care notes locally", () => {
      expect(getCareNotes()).toEqual([]);

      const note = saveCareNote({
        title: "Chamomile tea",
        text: "Warm tea and heat pack helped relieve evening cramps.",
      });

      expect(note.id).toBeTruthy();
      expect(note.title).toBe("Chamomile tea");

      const notes = getCareNotes();
      expect(notes.length).toBe(1);

      deleteCareNote(note.id);
      expect(getCareNotes()).toEqual([]);
    });
  });

  describe("Module 4: Conservative Personalisation & Clinical Safeguards", () => {
    it("recommends heat/comfort when cramps or pain are present", () => {
      const record = {
        days: {
          "2026-10-23": {
            period: true,
            pain: 3,
            symptoms: ["cramps"],
          },
        },
      };

      const res = getPersonalizedSelfCare({
        record,
        today: "2026-10-23",
        safety: { urgentRedFlag: null },
      });

      expect(res.isSafetyAlert).toBe(false);
      expect(res.targetProgrammeId).toBe("routine_gentle_warmth");
      expect(res.titleKey).toBe("selfcare.today.crampsTitle");
    });

    it("recommends gentle rest when fatigue / low energy is reported", () => {
      const record = {
        days: {
          "2026-10-23": {
            energy: "low",
            symptoms: ["tiredness"],
          },
        },
      };

      const res = getPersonalizedSelfCare({
        record,
        today: "2026-10-23",
        safety: { urgentRedFlag: null },
      });

      expect(res.isSafetyAlert).toBe(false);
      expect(res.targetProgrammeId).toBe("routine_rest_recharge");
      expect(res.titleKey).toBe("selfcare.today.energyTitle");
    });

    it("recommends calm breathing when anxiety or stress is present", () => {
      const record = {
        days: {
          "2026-10-23": {
            mood: "anxious",
            symptoms: ["mood"],
          },
        },
      };

      const res = getPersonalizedSelfCare({
        record,
        today: "2026-10-23",
        safety: { urgentRedFlag: null },
      });

      expect(res.isSafetyAlert).toBe(false);
      expect(res.targetProgrammeId).toBe("relax_calm_breathing");
      expect(res.titleKey).toBe("selfcare.today.moodTitle");
    });

    it("SAFETY OVERRIDE: red flags immediately suppress self-care and urge doctor consultation", () => {
      const record = {
        days: {
          "2026-10-23": {
            pain: 5,
            symptoms: ["cramps"],
          },
        },
      };

      const res = getPersonalizedSelfCare({
        record,
        today: "2026-10-23",
        safety: {
          urgentRedFlag: {
            title: "Severe sudden abdominal pain",
            action: "Seek immediate medical attention",
          },
        },
      });

      expect(res.isSafetyAlert).toBe(true);
      expect(res.titleKey).toBe("selfcare.today.urgentTitle");
      expect(res.descKey).toBe("selfcare.today.urgentDesc");
      expect(res.targetProgrammeId).toBeNull();
      expect(res.linkToDoctor).toBe(true);
    });
  });

  describe("Module 5: 13-Language Internationalisation & RTL Support", () => {
    it("all 13 language dictionaries contain identical key parity for all self care keys", () => {
      const enKeys = Object.keys(DICTS.en).filter((k) => k.startsWith("selfcare."));
      expect(enKeys.length).toBeGreaterThan(150);

      for (const lang of LANGUAGES) {
        const dict = DICTS[lang.code];
        expect(dict, `Language dictionary for ${lang.code} must exist`).toBeDefined();

        for (const k of enKeys) {
          expect(
            dict[k],
            `Key "${k}" missing in language ${lang.code} (${lang.nativeName})`,
          ).toBeDefined();
          expect(typeof dict[k], `Key "${k}" in ${lang.code} must be a string`).toBe("string");
          expect(
            dict[k].trim().length,
            `Key "${k}" in ${lang.code} must not be empty`,
          ).toBeGreaterThan(0);
        }
      }
    });

    it("verifies Urdu (RTL) has valid translation and right-to-left language config", () => {
      const urduLang = LANGUAGES.find((l) => l.code === "ur");
      expect(urduLang).toBeDefined();
      expect(urduLang.dir).toBe("rtl");

      const urduDict = DICTS.ur;
      expect(urduDict["selfcare.title"]).toContain("سیلف کیئر");
      expect(urduDict["nav.selfCare"]).toBe("سیلف کیئر");
    });
  });
});
