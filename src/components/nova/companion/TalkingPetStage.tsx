/**
 * Saheli 10.4 — Talking Companion Interactive Game Stage
 *
 * Full Interactive Virtual Pet Game Engine combining:
 * 1. Articulated 2D rigged character renderer (tilt, gaze, eyelid expressions, lip-sync mouth).
 * 2. On-device Web Audio voice repeat engine with species formant shaping & RMS lip-sync.
 * 3. Direct anatomical touch & gesture recognition (head tap, ear twitch, belly tickle, paw high-five, tail wag).
 * 4. Three playable mini-games (Catch the Ball, Follow the Toy, Find the Treat).
 * 5. Complete privacy, accessibility, and multilingual controls.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Sparkles,
  Mic,
  MicOff,
  Square,
  Lock,
  Gamepad2,
} from "lucide-react";
import {
  ArticulatedPetRenderer,
  type ArticulatedRigState,
  DEFAULT_RIG_STATE,
} from "./ArticulatedPetRenderer";
import { voiceRepeatEngine, type VoiceRepeatState } from "@/lib/companion/voiceRepeatEngine";
import { TouchGestureEngine, type TouchGestureEvent } from "@/lib/companion/touchGestureEngine";
import { PetMiniGameController, type MiniGameType } from "@/lib/companion/petMiniGames";
import { MiniGameOverlay } from "./MiniGameOverlay";
import { petSoundEngine } from "@/lib/companion/petSoundEngine";
import { getPetPersonality } from "@/lib/companion/petPersonality";
import { useApp } from "@/App.jsx";

export interface TalkingPetStageProps {
  speciesId: string;
  name: string;
  habitatTheme: {
    id: string;
    labelKey: string;
    bgColor: string;
    accentBorder: string;
  };
  growthStage: {
    stage: number;
    labelKey: string;
    scale: number;
  };
  accessory?: string;
  onCareAction?: (actionType: "feed" | "play" | "brush" | "rest" | "affection") => void;
  onCustomiseClick?: () => void;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  type: "heart" | "star" | "sparkle" | "zzz" | "laugh";
}

export const TalkingPetStage: React.FC<TalkingPetStageProps> = ({
  speciesId,
  name,
  habitatTheme,
  growthStage,
  accessory = "none",
  onCareAction,
}) => {
  const { t } = useApp();
  const personality = getPetPersonality(speciesId);

  // Stage container reference
  const stageRef = useRef<HTMLDivElement>(null);

  // Character Rigging State
  const [rig, setRig] = useState<ArticulatedRigState>(DEFAULT_RIG_STATE);
  const rigRef = useRef<ArticulatedRigState>(DEFAULT_RIG_STATE);
  rigRef.current = rig;

  // Voice Repeat Engine State
  const [voiceState, setVoiceState] = useState<VoiceRepeatState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Mini-Games State
  const [activeGame, setActiveGame] = useState<MiniGameType>("none");
  const miniGameControllerRef = useRef<PetMiniGameController | null>(null);
  if (!miniGameControllerRef.current) {
    miniGameControllerRef.current = new PetMiniGameController();
  }
  const gameController = miniGameControllerRef.current;

  // Touch Gesture Engine State
  const gestureEngineRef = useRef<TouchGestureEngine | null>(null);
  const [activeGestureToast, setActiveGestureToast] = useState<string | null>(null);

  // General Settings
  const [soundEnabled, setSoundEnabled] = useState(() => petSoundEngine.getSoundEnabled());
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return (
          localStorage.getItem("saheli_pet_reduced_motion") === "true" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
      }
    } catch {
      // Storage unavailable or disabled
    }
    return false;
  });

  // Pet Position & Mood
  const [petXPercent, setPetXPercent] = useState(50);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [petMoodState, setPetMoodState] = useState<
    "idle" | "listening" | "talking" | "tickled" | "petted" | "sleeping" | "playing"
  >("idle");
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [speechQuote, setSpeechQuote] = useState(() => personality.quotes[0]);

  // Helper to spawn floating particles
  const spawnParticle = useCallback(
    (type: "heart" | "star" | "sparkle" | "zzz" | "laugh", x = petXPercent, y = 45) => {
      const p: FloatingParticle = {
        id: Date.now() + Math.random(),
        x: Math.max(15, Math.min(85, x + (Math.random() - 0.5) * 16)),
        y: Math.max(20, Math.min(75, y + (Math.random() - 0.5) * 10)),
        type,
      };
      setParticles((prev) => [...prev.slice(-12), p]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((item) => item.id !== p.id));
      }, 1400);
    },
    [petXPercent],
  );

  // -------------------------------------------------------------
  // VOICE REPEAT ENGINE SUBSCRIPTION & LIP-SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    voiceRepeatEngine.setListener({
      onStateChange: (newState) => {
        setVoiceState(newState);
        if (newState === "listening") {
          setPetMoodState("listening");
          setRig((prev) => ({
            ...prev,
            headTilt: 8,
            eyeShape: "surprised",
            eyeOpenRatio: 1.1,
            mouthShape: "smile",
            mouthOpenY: 0,
            earLeftAngle: 8,
            earRightAngle: -8,
          }));
        } else if (newState === "speaking") {
          setPetMoodState("talking");
          setRig((prev) => ({
            ...prev,
            headTilt: 0,
            eyeShape: "happy",
            eyeOpenRatio: 0.9,
            mouthShape: "talking",
          }));
        } else if (newState === "idle") {
          if (petMoodState === "listening" || petMoodState === "talking") {
            setPetMoodState("idle");
          }
          setRig((prev) => ({
            ...prev,
            mouthOpenY: 0,
            mouthShape: "smile",
            eyeShape: "normal",
          }));
        }
      },
      onAmplitude: (amplitude) => {
        // Direct RMS amplitude driven lip-sync mouth opening (0 to 14px)
        const mouthY = Math.min(14, amplitude * 22);
        const headNod = Math.min(5, amplitude * 8);
        setRig((prev) => ({
          ...prev,
          mouthOpenY: mouthY,
          headNod: headNod,
        }));
      },
      onError: (err) => {
        setVoiceError(err);
        setTimeout(() => setVoiceError(null), 4000);
      },
    });

    return () => {
      voiceRepeatEngine.cancel();
    };
  }, [petMoodState]);

  // -------------------------------------------------------------
  // TOUCH GESTURE ENGINE INTEGRATION
  // -------------------------------------------------------------
  useEffect(() => {
    const handleGesture = (event: TouchGestureEvent) => {
      if (petMoodState === "sleeping") {
        setPetMoodState("idle");
        petSoundEngine.playWakeSound();
        spawnParticle("star");
        return;
      }

      switch (event.type) {
        case "head_tap":
          petSoundEngine.playSpeciesGreeting(speciesId);
          setActiveGestureToast(t("companion.gestureHeadTap", "Friendly pat!"));
          setRig((prev) => ({
            ...prev,
            headTilt: -10,
            eyeShape: "happy",
            mouthShape: "smile",
          }));
          spawnParticle("sparkle");
          setTimeout(() => {
            setRig((prev) => ({ ...prev, headTilt: 0, eyeShape: "normal" }));
            setActiveGestureToast(null);
          }, 800);
          break;

        case "ear_tap":
          petSoundEngine.playToySound();
          setActiveGestureToast(t("companion.gestureEarTwitch", "Ear twitch!"));
          setRig((prev) => ({
            ...prev,
            earLeftAngle: 18,
            earRightAngle: -18,
            headTilt: 12,
            eyeShape: "surprised",
          }));
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              earLeftAngle: 0,
              earRightAngle: 0,
              headTilt: 0,
              eyeShape: "normal",
            }));
            setActiveGestureToast(null);
          }, 700);
          break;

        case "belly_tickle":
          petSoundEngine.playTickleGiggle();
          setActiveGestureToast(t("companion.gestureTickle", "Teehee! Tickles!"));
          setPetMoodState("tickled");
          setRig((prev) => ({
            ...prev,
            bellySquish: 1.15,
            eyeShape: "laughing",
            mouthShape: "giggle",
            pawLeftY: -8,
            pawRightY: -8,
            headTilt: (Math.random() - 0.5) * 16,
          }));
          spawnParticle("laugh");
          onCareAction?.("affection");
          setTimeout(() => {
            setPetMoodState("idle");
            setRig((prev) => ({
              ...prev,
              bellySquish: 1.0,
              eyeShape: "normal",
              mouthShape: "smile",
              pawLeftY: 0,
              pawRightY: 0,
              headTilt: 0,
            }));
            setActiveGestureToast(null);
          }, 1100);
          break;

        case "paw_tap":
          petSoundEngine.playToySound();
          setActiveGestureToast(t("companion.gesturePawTap", "High five!"));
          setRig((prev) => ({
            ...prev,
            pawLeftY: -14,
            headNod: 6,
            eyeShape: "happy",
          }));
          spawnParticle("star");
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              pawLeftY: 0,
              headNod: 0,
              eyeShape: "normal",
            }));
            setActiveGestureToast(null);
          }, 800);
          break;

        case "tail_tap":
          petSoundEngine.playToySound();
          setActiveGestureToast(t("companion.gestureTailTap", "Tail wag!"));
          setRig((prev) => ({
            ...prev,
            tailAngle: 25,
            headTilt: 8,
            gazeX: -0.6,
          }));
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              tailAngle: -25,
            }));
            setTimeout(() => {
              setRig((prev) => ({
                ...prev,
                tailAngle: 0,
                headTilt: 0,
                gazeX: 0,
              }));
              setActiveGestureToast(null);
            }, 300);
          }, 300);
          break;

        case "petting_stroke":
          petSoundEngine.playPettingChime();
          setRig((prev) => ({
            ...prev,
            eyeOpenRatio: 0.3,
            eyeShape: "happy",
            headTilt: -6,
          }));
          spawnParticle("heart");
          onCareAction?.("affection");
          break;

        case "long_press":
          petSoundEngine.playPettingChime();
          setActiveGestureToast(t("companion.gestureContent", "So cozy..."));
          setRig((prev) => ({
            ...prev,
            eyeOpenRatio: 0.1,
            headTilt: 4,
            bellySquish: 1.08,
          }));
          spawnParticle("heart");
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              eyeOpenRatio: 1,
              headTilt: 0,
              bellySquish: 1,
            }));
            setActiveGestureToast(null);
          }, 1200);
          break;
      }
    };

    const engine = new TouchGestureEngine({
      onGesture: handleGesture,
      onGazeTarget: (normX, normY) => {
        if (activeGame === "none") {
          setRig((prev) => ({
            ...prev,
            gazeX: normX * 0.8,
            gazeY: normY * 0.8,
          }));
        }
      },
    });

    gestureEngineRef.current = engine;
    return () => {
      engine.destroy();
    };
  }, [speciesId, activeGame, petMoodState, spawnParticle, onCareAction, t]);

  // -------------------------------------------------------------
  // NATURAL IDLE BLINKING & AMBIENT WANDERING LOOP
  // -------------------------------------------------------------
  useEffect(() => {
    if (reducedMotion) return;

    let blinkTimeout: ReturnType<typeof setTimeout>;
    let isBlinking = false;

    const scheduleBlink = () => {
      const delay = Math.random() * 3200 + 2400; // 2.4 - 5.6s
      blinkTimeout = setTimeout(() => {
        if (petMoodState !== "sleeping" && !isBlinking) {
          isBlinking = true;
          setRig((prev) => ({ ...prev, eyeOpenRatio: 0.05 }));
          setTimeout(() => {
            setRig((prev) => ({ ...prev, eyeOpenRatio: 1.0 }));
            isBlinking = false;
            scheduleBlink();
          }, 140);
        } else {
          scheduleBlink();
        }
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, [reducedMotion, petMoodState]);

  // Gaze listener from mini-game controller
  useEffect(() => {
    gameController.setListener({
      onScoreUpdate: () => {
        spawnParticle("star");
        onCareAction?.("play");
      },
      onPetReaction: (reaction) => {
        if (reaction === "bat" || reaction === "pounce") {
          setRig((prev) => ({
            ...prev,
            pawRightY: -12,
            pawLeftY: -10,
            headNod: 8,
            eyeShape: "happy",
            mouthShape: "open",
          }));
          spawnParticle("sparkle");
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              pawRightY: 0,
              pawLeftY: 0,
              headNod: 0,
              mouthShape: "smile",
            }));
          }, 450);
        } else if (reaction === "eat") {
          setRig((prev) => ({
            ...prev,
            mouthShape: "eating",
            mouthOpenY: 8,
            eyeShape: "happy",
          }));
          spawnParticle("heart");
          onCareAction?.("feed");
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              mouthShape: "smile",
              mouthOpenY: 0,
            }));
          }, 1200);
        } else if (reaction === "cheer") {
          setRig((prev) => ({
            ...prev,
            eyeShape: "laughing",
            headTilt: -10,
            tailAngle: 20,
          }));
          spawnParticle("star");
          setTimeout(() => {
            setRig((prev) => ({
              ...prev,
              eyeShape: "normal",
              headTilt: 0,
              tailAngle: 0,
            }));
          }, 800);
        }
      },
      onGazeTarget: (normX, normY) => {
        setRig((prev) => ({
          ...prev,
          gazeX: normX,
          gazeY: normY,
          headTilt: normX * 8,
        }));
      },
    });
  }, [gameController, spawnParticle, onCareAction]);

  // Periodic idle speech quote rotation
  useEffect(() => {
    const timer = setInterval(() => {
      if (petMoodState === "idle" && activeGame === "none" && personality.quotes.length > 0) {
        const nextQuote = personality.quotes[Math.floor(Math.random() * personality.quotes.length)];
        setSpeechQuote(nextQuote);
      }
    }, 14000);
    return () => clearInterval(timer);
  }, [petMoodState, activeGame, personality.quotes]);

  // -------------------------------------------------------------
  // USER ACTIONS & CONTROLS
  // -------------------------------------------------------------
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    petSoundEngine.setSoundEnabled(next);
    if (next) {
      petSoundEngine.playSpeciesGreeting(speciesId);
    }
  };

  const toggleMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    try {
      localStorage.setItem("saheli_pet_reduced_motion", String(next));
    } catch {
      // Storage unavailable or disabled
    }
  };

  // Mic Button handler for Talking Companion
  const handleToggleMic = async () => {
    if (voiceState === "listening") {
      voiceRepeatEngine.stopAndPlayback(speciesId);
    } else if (voiceState === "speaking") {
      voiceRepeatEngine.cancel();
    } else {
      await voiceRepeatEngine.startListening();
    }
  };

  // Mini-game launcher
  const handleStartGame = (game: MiniGameType) => {
    setActiveGame(game);
    gameController.startGame(game);
  };

  const handleExitGame = () => {
    setActiveGame("none");
    gameController.stopCurrentGame();
    setRig(DEFAULT_RIG_STATE);
  };

  // Habitat anchor clicks
  const handleAnchorRest = () => {
    petSoundEngine.playSleepSound();
    setPetMoodState("sleeping");
    setPetXPercent(22);
    setFacing("right");
    setRig((prev) => ({
      ...prev,
      eyeOpenRatio: 0,
      eyeShape: "sleepy",
      mouthShape: "smile",
      headTilt: 4,
    }));
    spawnParticle("zzz", 22, 60);
    onCareAction?.("rest");
  };

  const handleAnchorPlay = () => {
    handleStartGame("catch_ball");
  };

  const handleAnchorFeed = () => {
    petSoundEngine.playEatSound();
    setPetXPercent(78);
    setFacing("left");
    setRig((prev) => ({
      ...prev,
      mouthShape: "eating",
      mouthOpenY: 9,
      eyeShape: "happy",
    }));
    spawnParticle("star", 78, 55);
    onCareAction?.("feed");
    setTimeout(() => {
      setRig((prev) => ({ ...prev, mouthShape: "smile", mouthOpenY: 0 }));
    }, 1200);
  };

  // Pointer forwarding to TouchGestureEngine
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeGame !== "none") return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    gestureEngineRef.current?.handlePointerDown(e.nativeEvent, rect);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeGame !== "none") return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    gestureEngineRef.current?.handlePointerMove(e.nativeEvent, rect);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeGame !== "none") return;
    gestureEngineRef.current?.handlePointerUp(e.nativeEvent);
  };

  const handleHitZonePointerDown = (zone: "head" | "ears" | "belly" | "paws" | "tail") => {
    gestureEngineRef.current?.handleHitZoneTap(zone);
  };

  return (
    <section
      ref={stageRef}
      aria-label={`${name} Sanctuary Habitat & Talking Game Stage`}
      className={`relative overflow-hidden rounded-3xl border shadow-lg flex flex-col justify-between transition-all bg-gradient-to-b min-h-[420px] sm:min-h-[460px] select-none ${habitatTheme.bgColor} ${habitatTheme.accentBorder}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      data-testid="talking-pet-stage"
    >
      {/* 1. TOP STATUS & CONTROLS BAR */}
      <div className="relative z-20 w-full flex items-center justify-between p-4 sm:p-5 pointer-events-auto">
        {/* Dynamic Speech / Voice Status Bubble */}
        <div
          role="status"
          aria-live="polite"
          className="max-w-[240px] sm:max-w-md rounded-2xl bg-card/90 backdrop-blur-md border border-border/70 px-3.5 py-2 shadow-sm text-xs text-foreground font-semibold flex items-center gap-2"
        >
          {voiceState === "listening" ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {t("companion.voiceListening", "Listening... speak now!")}
              </span>
            </>
          ) : voiceState === "processing" ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {t("companion.voiceProcessing", "Transforming pet voice...")}
              </span>
            </>
          ) : voiceState === "speaking" ? (
            <>
              <span className="text-base">📢</span>
              <span className="text-primary font-bold animate-pulse">
                {t("companion.voiceTalking", `${name} is talking back!`)}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm">💬</span>
              <span className="line-clamp-2">
                "{petMoodState === "sleeping" ? t("pet.act.restSub") : t(speechQuote)}"
              </span>
            </>
          )}
        </div>

        {/* Audio, Motion & Settings Controls */}
        <div className="flex items-center gap-1.5 bg-card/85 backdrop-blur-md border border-border/60 rounded-2xl p-1 shadow-xs">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute companion audio" : "Enable companion audio"}
            title={soundEnabled ? "Mute companion sounds" : "Enable companion sounds"}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* Pause/Resume Motion */}
          <button
            type="button"
            onClick={toggleMotion}
            aria-label={reducedMotion ? "Resume animations" : "Pause animations"}
            title={reducedMotion ? "Resume natural roaming" : "Pause animations (Reduced Motion)"}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            {reducedMotion ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Gesture Toast */}
      {activeGestureToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <span className="bg-white/95 dark:bg-zinc-900/95 text-primary font-bold text-xs px-3 py-1.5 rounded-full shadow-md border border-primary/20">
            {activeGestureToast}
          </span>
        </div>
      )}

      {/* 2. HABITAT STAGE FLOOR & LIVING COMPANION */}
      <div className="relative w-full h-[240px] sm:h-[280px] my-auto overflow-hidden">
        {/* Resting Nook (Left) */}
        <button
          type="button"
          onClick={handleAnchorRest}
          aria-label="Resting Nook"
          className="absolute bottom-4 left-[8%] sm:left-[12%] -translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95 z-10"
        >
          <div className="w-16 h-8 sm:w-20 sm:h-10 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 border border-indigo-400/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base">🛋️</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
            Nook
          </span>
        </button>

        {/* Play Area Anchor (Center) */}
        <button
          type="button"
          onClick={handleAnchorPlay}
          aria-label="Play Area"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95 z-10"
        >
          <div className="w-16 h-8 sm:w-20 sm:h-10 rounded-full bg-amber-500/20 dark:bg-amber-400/20 border border-amber-400/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base">{personality.toyEmoji}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
            Toys
          </span>
        </button>

        {/* Feeding Bowl Anchor (Right) */}
        <button
          type="button"
          onClick={handleAnchorFeed}
          aria-label="Feeding Bowl"
          className="absolute bottom-4 right-[8%] sm:right-[12%] translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95 z-10"
        >
          <div className="w-16 h-8 sm:w-20 sm:h-10 rounded-full bg-pink-500/20 dark:bg-pink-400/20 border border-pink-400/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base">{personality.treatEmoji}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
            Bowl
          </span>
        </button>

        {/* ARTICULATED 2D RIGGED CHARACTER ACTOR */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`${name}, ${t(personality.nameKey)}. Tap head, stroke body, or tickle belly.`}
          className="absolute bottom-6 sm:bottom-8 -translate-x-1/2 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 rounded-full select-none z-10"
          style={{
            left: `${petXPercent}%`,
            transform: `translateX(-50%) scale(${growthStage.scale * (facing === "left" ? -1 : 1)}, ${growthStage.scale})`,
            transition: reducedMotion ? "none" : "left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
            touchAction: "none",
          }}
        >
          <ArticulatedPetRenderer
            speciesId={speciesId}
            rig={rig}
            size={180}
            accessory={accessory}
            reducedMotion={reducedMotion}
            onHitZonePointerDown={handleHitZonePointerDown}
          />
        </div>

        {/* Floating Particle FX Layer */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none animate-float-particle font-bold z-20"
            style={{
              left: `${p.x}%`,
              bottom: `${p.y}%`,
            }}
          >
            {p.type === "heart" && "💖"}
            {p.type === "star" && "⭐"}
            {p.type === "laugh" && "😆"}
            {p.type === "sparkle" && "✨"}
            {p.type === "zzz" && "💤"}
          </div>
        ))}

        {/* MINI-GAMES INTERACTIVE OVERLAY */}
        {activeGame !== "none" && (
          <MiniGameOverlay
            controller={gameController}
            activeGame={activeGame}
            onExitGame={handleExitGame}
            t={t}
          />
        )}
      </div>

      {/* 3. TALKING CONTROLS & MINI-GAMES LAUNCHER BAR */}
      <div className="relative z-20 w-full flex flex-col gap-2 p-3 sm:p-4 border-t border-border/40 bg-card/65 backdrop-blur-md">
        {/* Voice Repeat & Game Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* PRIMARY FEATURE: TALK TO PET BUTTON */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={voiceState === "processing"}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                voiceState === "listening"
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-400/40"
                  : voiceState === "speaking"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/40"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
              aria-label={
                voiceState === "listening"
                  ? t("companion.voiceStop", "Stop Recording")
                  : voiceState === "speaking"
                    ? t("companion.voiceInterrupt", "Stop Pet Talking")
                    : t("companion.voiceTalkPrompt", "Talk to Pet")
              }
            >
              {voiceState === "listening" ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>{t("companion.voiceStopBtn", "Done / Listen")}</span>
                </>
              ) : voiceState === "speaking" ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>{t("companion.voiceStopTalking", "Stop")}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>{t("companion.voiceTalkBtn", "Talk to me!")}</span>
                </>
              )}
            </button>

            {/* Privacy Guarantee Badge */}
            <div
              className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xl border border-border/50"
              title={t(
                "companion.voicePrivacyTooltip",
                "100% on-device Web Audio. No audio is ever recorded or uploaded.",
              )}
            >
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>{t("companion.voicePrivacyTag", "On-Device Audio")}</span>
            </div>
          </div>

          {/* PLAYABLE MINI-GAMES BAR */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStartGame("catch_ball")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeGame === "catch_ball"
                  ? "bg-rose-500 text-white border-rose-400 shadow-xs"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
              title={t("companion.gameCatchBall", "Catch the Ball")}
            >
              <span>🎾</span>
              <span className="hidden md:inline">{t("companion.gameCatchBallShort", "Ball")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartGame("follow_toy")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeGame === "follow_toy"
                  ? "bg-rose-500 text-white border-rose-400 shadow-xs"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
              title={t("companion.gameFollowToy", "Follow the Toy")}
            >
              <span>🪶</span>
              <span className="hidden md:inline">{t("companion.gameFollowToyShort", "Toy")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartGame("find_treat")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeGame === "find_treat"
                  ? "bg-rose-500 text-white border-rose-400 shadow-xs"
                  : "bg-card hover:bg-muted text-foreground border-border/70"
              }`}
              title={t("companion.gameFindTreat", "Find the Treat")}
            >
              <span>🥣</span>
              <span className="hidden md:inline">{t("companion.gameFindTreatShort", "Treat")}</span>
            </button>
          </div>
        </div>

        {/* Error / Permission Denied Notification */}
        {voiceError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900">
            <MicOff className="w-3.5 h-3.5 shrink-0" />
            <span>{t(voiceError, "Microphone access is needed so your pet can hear you.")}</span>
          </div>
        )}
      </div>
    </section>
  );
};
