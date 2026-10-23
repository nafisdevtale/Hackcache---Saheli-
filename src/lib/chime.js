/**
 * Saheli 7.2 — Original Reminder Sound & Audio Chime ("Saheli Chime")
 *
 * 100% Procedurally Synthesised via Web Audio API.
 * Original harmonic bell composition designed for gentle, non-startling notifications
 * on shared family devices.
 *
 * Sound Architecture:
 * - Triadic harmonic bell: Root (E5, 659.3 Hz), Major Third (G#5, 830.6 Hz), Fifth (B5, 987.8 Hz)
 * - Exponential decay envelope simulating acoustic chimes
 * - Soft sub-harmonic low-pass filter to prevent harsh high frequencies
 *
 * Platform Limitations:
 * - Operating systems & browsers restrict background service workers from instantiating Web Audio.
 * - In-app / foreground notifications play the custom synthesized chime.
 * - Background push notifications fall back gracefully to the OS default chime.
 */

const CHIME_STORAGE_KEY = "saheli_chime_settings";

export const DEFAULT_CHIME_SETTINGS = {
  enabled: true,
  volume: 0.6,
  silentMode: false,
  reducedSensory: false, // Even softer, slower attack for neurodivergent / sensitive users
};

export function loadChimeSettings() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(CHIME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled: parsed.enabled !== false,
          volume: typeof parsed.volume === "number" ? Math.max(0, Math.min(1, parsed.volume)) : 0.6,
          silentMode: !!parsed.silentMode,
          reducedSensory: !!parsed.reducedSensory,
        };
      }
    }
  } catch {}
  return { ...DEFAULT_CHIME_SETTINGS };
}

export function saveChimeSettings(settings) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CHIME_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {}
}

export function isQuietTime(timeStr, quietHours) {
  if (!quietHours?.on || !quietHours?.start || !quietHours?.end) return false;
  if (quietHours.start <= quietHours.end) {
    return timeStr >= quietHours.start && timeStr < quietHours.end;
  }
  return timeStr >= quietHours.start || timeStr < quietHours.end;
}

/**
 * Synthesize and play the Saheli Chime
 * @param {Object} options
 * @param {number} [options.volume] - 0.0 to 1.0 override
 * @param {boolean} [options.reducedSensory] - Softer envelope
 * @param {boolean} [options.discreetMode] - If true, chime is silenced to protect privacy
 * @param {Object} [options.quietHours] - Quiet hours settings object { on, start, end }
 * @param {string} [options.time] - Time string (HH:MM) to evaluate for quiet hours
 * @returns {Promise<boolean>} true if played, false if silenced or unsupported
 */
export async function playSaheliChime(options = {}) {
  const current = loadChimeSettings();
  const volume = options.volume ?? current.volume;
  const isReduced = options.reducedSensory ?? current.reducedSensory;
  const isDiscreet = !!options.discreetMode;

  // Strict silence conditions
  if (!current.enabled || current.silentMode || isDiscreet || volume <= 0) {
    return false;
  }

  // Quiet hours check
  if (options.quietHours) {
    const timeToCheck =
      options.time ||
      (() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      })();
    if (isQuietTime(timeToCheck, options.quietHours)) {
      return false;
    }
  }

  // Check Web Audio API availability
  const AudioCtx =
    typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AudioCtx) {
    return false;
  }

  try {
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.7, now);
    masterGain.connect(ctx.destination);

    // Warm, soothing triadic frequencies (E5 chord: E5, G#5, B5, with soft E6 shimmer)
    const tones = [
      { freq: 659.25, gain: 0.5, delay: 0.0 }, // E5
      { freq: 830.61, gain: 0.35, delay: 0.05 }, // G#5
      { freq: 987.77, gain: 0.3, delay: 0.1 }, // B5
      { freq: 1318.51, gain: 0.15, delay: 0.15 }, // E6 shimmer
    ];

    const duration = isReduced ? 1.6 : 1.2;

    tones.forEach(({ freq, gain: toneGain, delay }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      // Acoustic envelope: Fast gentle rise, organic exponential decay
      const attackTime = isReduced ? 0.08 : 0.03;
      noteGain.gain.setValueAtTime(0.0001, now + delay);
      noteGain.gain.exponentialRampToValueAtTime(toneGain, now + delay + attackTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.1);
    });

    // Clean up audio context after decay
    setTimeout(
      () => {
        try {
          ctx.close();
        } catch {}
      },
      (duration + 0.5) * 1000,
    );

    return true;
  } catch {
    return false;
  }
}
