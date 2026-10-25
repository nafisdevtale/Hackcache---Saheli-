/**
 * Saheli 10.4 — Talking Companion Voice Repeat Engine
 *
 * Audio Privacy & Security Guarantees:
 * - 100% On-Device Web Audio API processing. Zero external network requests.
 * - Microphone recording ONLY occurs after direct explicit user activation.
 * - Temporary audio recorded in volatile RAM (AudioBuffer) and immediately discarded after playback.
 * - MediaStream tracks are immediately stopped and released when recording ends.
 * - Real-time audio amplitude analysis drives dynamic lip-sync mouth animations.
 */

export type VoiceEngineState =
  "idle" | "requesting_permission" | "permission_denied" | "listening" | "processing" | "talking";

export interface VoiceProfile {
  playbackRate: number;
  pitchSemiTones: number;
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  formantGain: number;
}

export const SPECIES_VOICE_PROFILES: Record<string, VoiceProfile> = {
  cat: {
    playbackRate: 1.3,
    pitchSemiTones: 5,
    filterType: "peaking",
    filterFreq: 1800,
    filterQ: 2.0,
    formantGain: 4,
  },
  dog: {
    playbackRate: 1.14,
    pitchSemiTones: 2.5,
    filterType: "peaking",
    filterFreq: 1200,
    filterQ: 1.8,
    formantGain: 3,
  },
  rabbit: {
    playbackRate: 1.48,
    pitchSemiTones: 7,
    filterType: "highpass",
    filterFreq: 800,
    filterQ: 1.5,
    formantGain: 3,
  },
  fox: {
    playbackRate: 1.25,
    pitchSemiTones: 4,
    filterType: "peaking",
    filterFreq: 1600,
    filterQ: 2.2,
    formantGain: 3.5,
  },
  panda: {
    playbackRate: 0.9,
    pitchSemiTones: -2,
    filterType: "lowshelf",
    filterFreq: 600,
    filterQ: 1.2,
    formantGain: 3,
  },
  bear: {
    playbackRate: 0.84,
    pitchSemiTones: -3.5,
    filterType: "lowpass",
    filterFreq: 1400,
    filterQ: 1.0,
    formantGain: 4,
  },
  koala: {
    playbackRate: 0.96,
    pitchSemiTones: -0.8,
    filterType: "peaking",
    filterFreq: 900,
    filterQ: 1.5,
    formantGain: 2.5,
  },
  hamster: {
    playbackRate: 1.52,
    pitchSemiTones: 8,
    filterType: "highpass",
    filterFreq: 950,
    filterQ: 1.8,
    formantGain: 4,
  },
  hedgehog: {
    playbackRate: 1.22,
    pitchSemiTones: 3.5,
    filterType: "peaking",
    filterFreq: 1400,
    filterQ: 1.6,
    formantGain: 3,
  },
  penguin: {
    playbackRate: 1.36,
    pitchSemiTones: 5.5,
    filterType: "bandpass",
    filterFreq: 1500,
    filterQ: 1.4,
    formantGain: 3.5,
  },
  butterfly: {
    playbackRate: 1.55,
    pitchSemiTones: 9,
    filterType: "highpass",
    filterFreq: 1100,
    filterQ: 2.0,
    formantGain: 4,
  },
  turtle: {
    playbackRate: 0.82,
    pitchSemiTones: -4,
    filterType: "lowpass",
    filterFreq: 1200,
    filterQ: 1.0,
    formantGain: 3,
  },
  owl: {
    playbackRate: 0.92,
    pitchSemiTones: -1.5,
    filterType: "peaking",
    filterFreq: 850,
    filterQ: 2.0,
    formantGain: 3,
  },
  otter: {
    playbackRate: 1.26,
    pitchSemiTones: 4.2,
    filterType: "peaking",
    filterFreq: 1650,
    filterQ: 1.7,
    formantGain: 3.5,
  },
  frog: {
    playbackRate: 1.16,
    pitchSemiTones: 3,
    filterType: "bandpass",
    filterFreq: 1100,
    filterQ: 2.5,
    formantGain: 4,
  },
};

export class VoiceRepeatEngine {
  private state: VoiceEngineState = "idle";
  private audioCtx: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private activeSourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private lipSyncRafId: number | null = null;
  private maxRecordTimeout: ReturnType<typeof setTimeout> | null = null;

  private onStateChange?: (state: VoiceEngineState) => void;
  private onAmplitude?: (amplitude: number) => void;
  private onError?: (errorMsgKey: string) => void;

  constructor() {
    // Visibility listener: silence immediately if tab switches
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.cancel();
        }
      });
    }
  }

  public init(callbacks: {
    onStateChange: (state: VoiceEngineState) => void;
    onAmplitude: (amplitude: number) => void;
    onError: (errorMsgKey: string) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onAmplitude = callbacks.onAmplitude;
    this.onError = callbacks.onError;
  }

  public setListener(callbacks: {
    onStateChange?: (state: VoiceEngineState) => void;
    onAmplitude?: (amplitude: number) => void;
    onError?: (errorMsgKey: string) => void;
  }) {
    if (callbacks.onStateChange) this.onStateChange = callbacks.onStateChange;
    if (callbacks.onAmplitude) this.onAmplitude = callbacks.onAmplitude;
    if (callbacks.onError) this.onError = callbacks.onError;
  }

  private setState(newState: VoiceEngineState) {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  public getState(): VoiceEngineState {
    return this.state;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Start User Voice Recording with permission check
   */
  public async startListening(speciesId = "cat"): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.setState("permission_denied");
      this.onError?.("companion.voiceNotSupported");
      return false;
    }

    this.cancel();
    this.setState("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.recordedChunks = [];

      // Determine supported MIME type
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4", ""];
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        for (const m of mimeTypes) {
          if (!m || MediaRecorder.isTypeSupported(m)) {
            mimeType = m;
            break;
          }
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Immediately stop all mic tracks to guarantee privacy
        this.stopMediaStream();

        if (this.recordedChunks.length === 0) {
          this.setState("idle");
          return;
        }

        const audioBlob = new Blob(this.recordedChunks, {
          type: mimeType || "audio/webm",
        });
        this.recordedChunks = [];
        await this.processAndRepeat(audioBlob, speciesId);
      };

      recorder.start(100);
      this.setState("listening");

      // Auto-stop after 8 seconds max to protect privacy & memory
      this.maxRecordTimeout = setTimeout(() => {
        if (this.state === "listening") {
          this.stopListening();
        }
      }, 8000);

      return true;
    } catch {
      this.stopMediaStream();
      this.setState("permission_denied");
      this.onError?.("companion.voicePermissionDenied");
      return false;
    }
  }

  /**
   * Stop Recording and trigger character voice repetition
   */
  public stopListening() {
    if (this.maxRecordTimeout) {
      clearTimeout(this.maxRecordTimeout);
      this.maxRecordTimeout = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.setState("processing");
      try {
        this.mediaRecorder.stop();
      } catch {
        this.cancel();
      }
    }
  }

  /**
   * Transform recorded voice and play back with synchronized lip-sync
   */
  private async processAndRepeat(blob: Blob, speciesId: string) {
    this.setState("processing");
    const ctx = this.getAudioContext();
    if (!ctx) {
      this.setState("idle");
      return;
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Setup audio nodes
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;

      const profile = SPECIES_VOICE_PROFILES[speciesId] || SPECIES_VOICE_PROFILES["cat"];

      // Pitch shift via playback rate
      source.playbackRate.setValueAtTime(profile.playbackRate, ctx.currentTime);

      // Character formant shaping filter
      const biquad = ctx.createBiquadFilter();
      biquad.type = profile.filterType;
      biquad.frequency.setValueAtTime(profile.filterFreq, ctx.currentTime);
      biquad.Q.setValueAtTime(profile.filterQ, ctx.currentTime);
      if (biquad.gain) {
        biquad.gain.setValueAtTime(profile.formantGain, ctx.currentTime);
      }

      // Analyser for real-time lip sync amplitude
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);

      // Chain: Source -> Filter -> Analyser -> Gain -> Destination
      source.connect(biquad);
      biquad.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      this.activeSourceNode = source;
      this.analyserNode = analyser;

      source.onended = () => {
        this.stopLipSyncLoop();
        this.activeSourceNode = null;
        this.analyserNode = null;
        this.onAmplitude?.(0);
        this.setState("idle");
      };

      this.setState("talking");
      source.start();
      this.startLipSyncLoop();
    } catch {
      this.cancel();
    }
  }

  /**
   * High-frequency animation frame loop measuring RMS amplitude
   */
  private startLipSyncLoop() {
    this.stopLipSyncLoop();
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (this.state !== "talking" || !this.analyserNode) {
        this.onAmplitude?.(0);
        return;
      }

      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate Root Mean Square energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      // Normalized amplitude (0.0 to 1.0) with noise threshold
      const amp = rms > 0.04 ? Math.min(1.0, rms * 2.8) : 0;
      this.onAmplitude?.(amp);

      this.lipSyncRafId = requestAnimationFrame(update);
    };

    this.lipSyncRafId = requestAnimationFrame(update);
  }

  private stopLipSyncLoop() {
    if (this.lipSyncRafId) {
      cancelAnimationFrame(this.lipSyncRafId);
      this.lipSyncRafId = null;
    }
    this.onAmplitude?.(0);
  }

  private stopMediaStream() {
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {
        // Track already stopped
      }
      this.mediaStream = null;
    }
  }

  /**
   * Cancel and clean up all active playback and recording
   */
  public cancel() {
    if (this.maxRecordTimeout) {
      clearTimeout(this.maxRecordTimeout);
      this.maxRecordTimeout = null;
    }
    this.stopMediaStream();
    this.stopLipSyncLoop();

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Media recorder already stopped
      }
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];

    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch {
        // Source node already finished or disconnected
      }
      this.activeSourceNode = null;
    }
    this.analyserNode = null;

    if (this.state !== "idle" && this.state !== "permission_denied") {
      this.setState("idle");
    }
  }

  public destroy() {
    this.cancel();
    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {
          // Context already closed
        });
      } catch {
        // Context close failed or already closed
      }
      this.audioCtx = null;
    }
  }
}

export const voiceRepeatEngine = new VoiceRepeatEngine();
