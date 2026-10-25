import { useState, useEffect } from "react";

export type AudioState = "idle" | "speaking" | "paused";

export interface SpeechOptions {
  onEnd?: () => void;
  onError?: (err: any) => void;
  onStart?: () => void;
  pitch?: number;
  rate?: number;
}

const LOCALE_MAP: Record<string, string> = {
  hi: "hi-IN",
  mr: "mr-IN",
  te: "te-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  ml: "ml-IN",
  or: "or-IN",
  as: "as-IN",
  ur: "ur-PK",
  en: "en-IN",
};

export function resolveVoiceLocale(lang: string = "en"): string {
  return LOCALE_MAP[lang] || "en-IN";
}

class SpeechController {
  private state: AudioState = "idle";
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentText: string | null = null;
  private currentLang: string = "en";
  private subscribers: Set<(state: AudioState, text: string | null) => void> = new Set();

  getState(): AudioState {
    return this.state;
  }

  getCurrentText(): string | null {
    return this.currentText;
  }

  isSpeaking(): boolean {
    return this.state === "speaking";
  }

  isPaused(): boolean {
    return this.state === "paused";
  }

  subscribe(callback: (state: AudioState, text: string | null) => void): () => void {
    this.subscribers.add(callback);
    callback(this.state, this.currentText);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.state, this.currentText));
  }

  private setState(next: AudioState, text: string | null = this.currentText) {
    this.state = next;
    this.currentText = next === "idle" ? null : text;
    this.notify();
  }

  speak(text: string, lang: string = "en", options: SpeechOptions = {}): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    if (!text || !text.trim()) {
      this.stop();
      return false;
    }

    // Cancel existing speech immediately to prevent overlaps
    this.stopInternal();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = resolveVoiceLocale(lang);
    if (options.pitch != null) u.pitch = options.pitch;
    if (options.rate != null) u.rate = options.rate;

    this.currentUtterance = u;
    this.currentLang = lang;
    this.setState("speaking", text);

    u.onstart = () => {
      this.setState("speaking", text);
      options.onStart?.();
    };

    u.onend = () => {
      this.currentUtterance = null;
      this.setState("idle", null);
      options.onEnd?.();
    };

    u.onerror = (e) => {
      this.currentUtterance = null;
      this.setState("idle", null);
      options.onError?.(e);
    };

    try {
      window.speechSynthesis.speak(u);
      return true;
    } catch {
      this.currentUtterance = null;
      this.setState("idle", null);
      return false;
    }
  }

  pause(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (this.state === "speaking") {
      window.speechSynthesis.pause();
      this.setState("paused");
    }
  }

  resume(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (this.state === "paused") {
      window.speechSynthesis.resume();
      this.setState("speaking");
    }
  }

  stop(): void {
    this.stopInternal();
    this.setState("idle", null);
  }

  private stopInternal(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    this.currentUtterance = null;
  }

  toggle(text: string, lang: string = "en", options: SpeechOptions = {}): boolean {
    if (this.state === "speaking") {
      if (this.currentText === text) {
        this.stop();
        return false;
      }
      // If speaking different text, start new text
      return this.speak(text, lang, options);
    } else if (this.state === "paused" && this.currentText === text) {
      this.resume();
      return true;
    } else {
      return this.speak(text, lang, options);
    }
  }
}

export const speechController = new SpeechController();

/**
 * React Hook for consuming speech synthesis state and controls
 */
export function useSpeechController(text?: string) {
  const [state, setState] = useState<AudioState>(() => speechController.getState());
  const [currentText, setCurrentText] = useState<string | null>(() =>
    speechController.getCurrentText(),
  );

  useEffect(() => {
    return speechController.subscribe((s, t) => {
      setState(s);
      setCurrentText(t);
    });
  }, []);

  const isCurrentItem = text ? currentText === text : true;
  const isSpeaking = state === "speaking" && isCurrentItem;
  const isPaused = state === "paused" && isCurrentItem;
  const isIdle = !isSpeaking && !isPaused;

  return {
    state,
    isSpeaking,
    isPaused,
    isIdle,
    currentText,
    speak: (t: string, lang?: string, opts?: SpeechOptions) =>
      speechController.speak(t, lang, opts),
    stop: () => speechController.stop(),
    pause: () => speechController.pause(),
    resume: () => speechController.resume(),
    toggle: (t: string, lang?: string, opts?: SpeechOptions) =>
      speechController.toggle(t, lang, opts),
  };
}
