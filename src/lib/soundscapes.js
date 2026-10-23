/**
 * Saheli Soundscape Audio Engine
 *
 * 100% Offline, Procedural Web Audio API Ambient Synthesizer.
 * Zero external audio downloads, zero licensing issues, perfectly loopable,
 * battery-efficient, and supports ambient mixing with sleep timers.
 */

class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.activeNodes = new Map(); // id -> { gain, stop }
    this.activeSounds = new Set();
    this.masterGain = null;
    this.volume = 0.6;
    this.soundVolumes = new Map(); // id -> volume (0..1)
    this.timerId = null;
    this.timerRemaining = 0; // seconds
    this.timerInterval = null;
    this.listeners = new Set();
    this.isMuted = false;
  }

  // Subscribe to state changes
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const state = this.getState();
    for (const fn of this.listeners) {
      try {
        fn(state);
      } catch {
        // ignore listener errors
      }
    }
  }

  getState() {
    return {
      isPlaying: this.activeSounds.size > 0,
      activeSounds: Array.from(this.activeSounds),
      masterVolume: this.volume,
      isMuted: this.isMuted,
      timerRemaining: this.timerRemaining,
      soundVolumes: Object.fromEntries(this.soundVolumes),
    };
  }

  initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Generate pink/white noise buffer
  createNoiseBuffer(type = "pink", duration = 4) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      // Pink noise using Paul Kellet's filtered method
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // Synthesize individual soundscapes
  startGenerator(id) {
    if (!this.initCtx()) return null;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const nodeGain = ctx.createGain();
    const indVol = this.soundVolumes.get(id) ?? 0.7;
    nodeGain.gain.setValueAtTime(indVol, now);
    nodeGain.connect(this.masterGain);

    const cleanupFns = [];

    switch (id) {
      case "rain": {
        // Continuous soft rain: pink noise + lowpass + gentle bandpass
        const noiseBuf = this.createNoiseBuffer("pink", 5);
        if (noiseBuf) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuf;
          src.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(800, now);

          src.connect(filter);
          filter.connect(nodeGain);
          src.start();
          cleanupFns.push(() => {
            try {
              src.stop();
              src.disconnect();
            } catch {}
          });
        }
        break;
      }

      case "waves": {
        // Ocean waves: filtered noise with slow rhythmic swelling LFO
        const noiseBuf = this.createNoiseBuffer("pink", 6);
        if (noiseBuf) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuf;
          src.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(350, now);
          filter.Q.setValueAtTime(1.2, now);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(0.12, now); // ~8s wave period
          lfoGain.gain.setValueAtTime(0.45, now);
          lfo.connect(lfoGain);

          const swellGain = ctx.createGain();
          swellGain.gain.setValueAtTime(0.5, now);
          lfoGain.connect(swellGain.gain);

          src.connect(filter);
          filter.connect(swellGain);
          swellGain.connect(nodeGain);

          src.start();
          lfo.start();
          cleanupFns.push(() => {
            try {
              src.stop();
              lfo.stop();
            } catch {}
          });
        }
        break;
      }

      case "stream": {
        // Babbling stream: highpassed/bandpassed water turbulence
        const noiseBuf = this.createNoiseBuffer("white", 4);
        if (noiseBuf) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuf;
          src.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(650, now);
          filter.Q.setValueAtTime(2.5, now);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.8, now);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(120, now);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          src.connect(filter);
          filter.connect(nodeGain);

          src.start();
          lfo.start();
          cleanupFns.push(() => {
            try {
              src.stop();
              lfo.stop();
            } catch {}
          });
        }
        break;
      }

      case "wind": {
        // Sweeping gentle wind
        const noiseBuf = this.createNoiseBuffer("pink", 5);
        if (noiseBuf) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuf;
          src.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(400, now);
          filter.Q.setValueAtTime(3.0, now);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.18, now);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(180, now);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          src.connect(filter);
          filter.connect(nodeGain);

          src.start();
          lfo.start();
          cleanupFns.push(() => {
            try {
              src.stop();
              lfo.stop();
            } catch {}
          });
        }
        break;
      }

      case "forest": {
        // Forest ambience: soft breeze base + periodic gentle high chirps
        const noiseBuf = this.createNoiseBuffer("pink", 6);
        if (noiseBuf) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuf;
          src.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(500, now);
          src.connect(filter);
          filter.connect(nodeGain);
          src.start();
          cleanupFns.push(() => {
            try {
              src.stop();
            } catch {}
          });
        }
        break;
      }

      case "night": {
        // Warm nighttime drone + rhythmic cricket harmonics
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(110, now); // Low A2 drone
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, now);
        osc.connect(oscGain);
        oscGain.connect(nodeGain);
        osc.start();

        // High shimmer
        const highOsc = ctx.createOscillator();
        highOsc.type = "sine";
        highOsc.frequency.setValueAtTime(4400, now);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(4.5, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.04, now);
        lfo.connect(lfoGain.gain);

        const highGain = ctx.createGain();
        highGain.gain.setValueAtTime(0.05, now);
        highOsc.connect(highGain);
        lfoGain.connect(highGain.gain);
        highGain.connect(nodeGain);

        highOsc.start();
        lfo.start();
        cleanupFns.push(() => {
          try {
            osc.stop();
            highOsc.stop();
            lfo.stop();
          } catch {}
        });
        break;
      }

      case "birds": {
        // Gentle periodic bird chimes
        let active = true;
        const playChirp = () => {
          if (!active || !this.ctx) return;
          try {
            const t = this.ctx.currentTime;
            const chirp = this.ctx.createOscillator();
            const chirpGain = this.ctx.createGain();
            chirp.type = "sine";
            const baseFreq = 2200 + Math.random() * 800;
            chirp.frequency.setValueAtTime(baseFreq, t);
            chirp.frequency.exponentialRampToValueAtTime(baseFreq + 600, t + 0.12);
            chirp.frequency.exponentialRampToValueAtTime(baseFreq - 200, t + 0.25);

            chirpGain.gain.setValueAtTime(0.12, t);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

            chirp.connect(chirpGain);
            chirpGain.connect(nodeGain);
            chirp.start(t);
            chirp.stop(t + 0.3);
          } catch {}
          if (active) {
            const nextDelay = 2500 + Math.random() * 4000;
            setTimeout(playChirp, nextDelay);
          }
        };
        playChirp();
        cleanupFns.push(() => {
          active = false;
        });
        break;
      }

      case "instrumental": {
        // Warm ambient pentatonic chord (C3, G3, C4, E4)
        const freqs = [130.81, 196.0, 261.63, 329.63];
        const oscs = freqs.map((f) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, now);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.08 / freqs.length, now);
          osc.connect(g);
          g.connect(nodeGain);
          osc.start();
          return osc;
        });
        cleanupFns.push(() => {
          oscs.forEach((o) => {
            try {
              o.stop();
            } catch {}
          });
        });
        break;
      }

      case "whitenoise": {
        // Smooth calibrated pink noise
        const noiseBuf = this.createNoiseBuffer("pink", 5);
        if (noiseBuf) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuf;
          src.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1200, now);
          src.connect(filter);
          filter.connect(nodeGain);
          src.start();
          cleanupFns.push(() => {
            try {
              src.stop();
            } catch {}
          });
        }
        break;
      }

      case "breathing_audio": {
        // Harmonic breath pacer: gentle 4-second swell in, 4-second swell out
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now); // A3

        const swell = ctx.createGain();
        swell.gain.setValueAtTime(0.05, now);

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.125, now); // 8 second cycle (4s in, 4s out)
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.15, now);
        lfo.connect(lfoGain);
        lfoGain.connect(swell.gain);

        osc.connect(swell);
        swell.connect(nodeGain);

        osc.start();
        lfo.start();
        cleanupFns.push(() => {
          try {
            osc.stop();
            lfo.stop();
          } catch {}
        });
        break;
      }

      default:
        break;
    }

    return {
      gain: nodeGain,
      stop: () => {
        cleanupFns.forEach((fn) => fn());
        try {
          nodeGain.disconnect();
        } catch {}
      },
    };
  }

  play(id) {
    this.initCtx();
    if (!this.activeNodes.has(id)) {
      const node = this.startGenerator(id);
      if (node || !this.ctx) {
        if (node) this.activeNodes.set(id, node);
        this.activeSounds.add(id);
        if (!this.soundVolumes.has(id)) {
          this.soundVolumes.set(id, 0.7);
        }
      }
    }
    this.notify();
  }

  stop(id) {
    if (this.activeNodes.has(id)) {
      const node = this.activeNodes.get(id);
      node.stop();
      this.activeNodes.delete(id);
    }
    this.activeSounds.delete(id);
    this.notify();
  }

  toggle(id) {
    if (this.activeSounds.has(id)) {
      this.stop(id);
    } else {
      this.play(id);
    }
  }

  stopAll() {
    for (const [id, node] of this.activeNodes.entries()) {
      node.stop();
    }
    this.activeNodes.clear();
    this.activeSounds.clear();
    this.clearTimer();
    this.notify();
  }

  setMasterVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  setSoundVolume(id, val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.soundVolumes.set(id, clamped);
    if (this.activeNodes.has(id) && this.ctx) {
      const node = this.activeNodes.get(id);
      node.gain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    this.notify();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  setTimer(minutes) {
    this.clearTimer();
    if (!minutes || minutes <= 0) {
      this.timerRemaining = 0;
      this.notify();
      return;
    }

    this.timerRemaining = minutes * 60;
    this.notify();

    this.timerInterval = setInterval(() => {
      this.timerRemaining--;
      if (this.timerRemaining <= 0) {
        this.stopAll();
      } else {
        this.notify();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerRemaining = 0;
  }
}

export const soundscapeEngine = new SoundscapeEngine();

export const getSoundscapeState = () => soundscapeEngine.getState();
export const toggleSoundscape = (id) => soundscapeEngine.toggle(id);
export const setSoundVolume = (id, val) => soundscapeEngine.setSoundVolume(id, val);
export const setMasterVolume = (val) => soundscapeEngine.setMasterVolume(val);
export const toggleMute = () => soundscapeEngine.toggleMute();
export const setSleepTimer = (minutes) => soundscapeEngine.setTimer(minutes);
export const stopAllSoundscapes = () => soundscapeEngine.stopAll();
export const subscribeSoundscapes = (fn) => soundscapeEngine.subscribe(fn);
