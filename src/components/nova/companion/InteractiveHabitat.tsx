/**
 * Saheli 10.3 — Interactive Habitat Stage for Living Companions
 *
 * Provides:
 * - Dynamic roaming stage with resting nook, play area, and feeding bowl.
 * - Tactile pointer drag (petting), tap reactions, and toy interactions.
 * - Procedural particle system (floating hearts, stars, crumbs, and Zzz bubbles).
 * - Full accessibility: keyboard controls, sound toggle, motion pause toggle.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Pause, Play, Sparkles } from "lucide-react";
import { PetArtwork } from "@/components/companion/PetArtwork.jsx";
import {
  PetAnimationMachine,
  type CompanionAnimState,
  type StageCoordinates,
  type ParticleEffect,
  HABITAT_ANCHORS,
} from "@/lib/companion/petAnimationMachine";
import { petSoundEngine } from "@/lib/companion/petSoundEngine";
import { getPetPersonality } from "@/lib/companion/petPersonality";
import { useApp } from "@/App.jsx";

export interface InteractiveHabitatProps {
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

export const InteractiveHabitat: React.FC<InteractiveHabitatProps> = ({
  speciesId,
  name,
  habitatTheme,
  growthStage,
  accessory = "none",
  onCareAction,
}) => {
  const { t } = useApp();
  const personality = getPetPersonality(speciesId);

  // Animation Machine State
  const animMachineRef = useRef<PetAnimationMachine | null>(null);
  const [animState, setAnimState] = useState<CompanionAnimState>("idle");
  const [coords, setCoords] = useState<StageCoordinates>({
    xPercent: HABITAT_ANCHORS.center.xPercent,
    facing: "right",
  });
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);

  // User Settings State
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

  // Petting pointer tracking
  const [isPetting, setIsPetting] = useState(false);
  const lastPetTimeRef = useRef<number>(0);

  // Speech quote
  const [activeQuote, setActiveQuote] = useState(() => personality.quotes[0]);

  // Setup Animation Machine
  useEffect(() => {
    const machine = new PetAnimationMachine(reducedMotion);
    animMachineRef.current = machine;

    machine.init({
      onStateChange: (state) => setAnimState(state),
      onPositionChange: (pos) => setCoords(pos),
      onBlinkChange: (blinking) => setIsBlinking(blinking),
      onHeadTiltChange: (deg) => setHeadTilt(deg),
      onEmitParticle: (p) => {
        setParticles((prev) => [...prev.slice(-15), p]);
        setTimeout(() => {
          setParticles((prev) => prev.filter((item) => item.id !== p.id));
        }, p.duration);
      },
    });

    return () => {
      machine.destroy();
      petSoundEngine.stopContinuousPurr();
    };
  }, [reducedMotion]);

  // Cycle idle quotes periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (animState === "idle" && personality.quotes.length > 0) {
        const nextQuote = personality.quotes[Math.floor(Math.random() * personality.quotes.length)];
        setActiveQuote(nextQuote);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [animState, personality.quotes]);

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
    animMachineRef.current?.setReducedMotion(next);
  };

  // Direct Interaction: Tap
  const handlePetTap = () => {
    if (animState === "sleeping") {
      animMachineRef.current?.triggerWake(() => {
        petSoundEngine.playWakeSound();
      });
      return;
    }
    petSoundEngine.playSpeciesGreeting(speciesId);
    animMachineRef.current?.triggerTapHop();
  };

  // Direct Interaction: Pointer Drag Petting
  const handlePointerDown = (e: React.PointerEvent) => {
    if (animState === "sleeping") return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsPetting(true);
    animMachineRef.current?.startPetting();
    petSoundEngine.startContinuousPurr();
  };

  const handlePointerMove = () => {
    if (!isPetting) return;
    const now = Date.now();
    if (now - lastPetTimeRef.current > 380) {
      lastPetTimeRef.current = now;
      petSoundEngine.playPettingChime();
      animMachineRef.current?.startPetting();
    }
  };

  const handlePointerUp = () => {
    if (isPetting) {
      setIsPetting(false);
      petSoundEngine.stopContinuousPurr();
      animMachineRef.current?.endPetting(() => {
        onCareAction?.("affection");
      });
    }
  };

  // Care Action triggers exposed to buttons
  const triggerCare = useCallback(
    (actionType: "feed" | "play" | "brush" | "rest" | "affection") => {
      if (!animMachineRef.current) return;

      if (actionType === "feed") {
        petSoundEngine.playEatSound();
        animMachineRef.current.triggerFeed(() => {
          onCareAction?.("feed");
        });
      } else if (actionType === "play") {
        petSoundEngine.playToySound();
        animMachineRef.current.triggerPlay(() => {
          onCareAction?.("play");
        });
      } else if (actionType === "rest") {
        petSoundEngine.playSleepSound();
        animMachineRef.current.triggerRest(() => {
          onCareAction?.("rest");
        });
      } else if (actionType === "affection" || actionType === "brush") {
        petSoundEngine.playPettingChime();
        animMachineRef.current.startPetting();
        setTimeout(() => {
          animMachineRef.current?.endPetting(() => {
            onCareAction?.(actionType);
          });
        }, 1200);
      }
    },
    [onCareAction],
  );

  // Expose triggerCare globally or via event for PetActionBar
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action: "feed" | "play" | "brush" | "rest" | "affection";
      }>;
      if (customEvent.detail?.action) {
        triggerCare(customEvent.detail.action);
      }
    };
    window.addEventListener("saheli:companion-care", handler);
    return () => window.removeEventListener("saheli:companion-care", handler);
  }, [triggerCare]);

  return (
    <section
      aria-label={`${name} Sanctuary Habitat`}
      className={`relative overflow-hidden rounded-3xl border shadow-lg flex flex-col justify-between transition-all bg-gradient-to-b min-h-[380px] sm:min-h-[440px] select-none ${habitatTheme.bgColor} ${habitatTheme.accentBorder}`}
    >
      {/* Top Floating Controls Bar */}
      <div className="relative z-20 w-full flex items-center justify-between p-4 sm:p-5">
        {/* Active Speech Bubble */}
        <div
          role="status"
          aria-live="polite"
          className="max-w-[240px] sm:max-w-md rounded-2xl bg-card/90 backdrop-blur-md border border-border/70 px-3.5 py-2 shadow-sm text-xs text-foreground font-semibold flex items-center gap-2"
        >
          <span className="text-sm">💬</span>
          <span className="line-clamp-2">
            "{animState === "sleeping" ? t("pet.act.restSub") : t(activeQuote)}"
          </span>
        </div>

        {/* Audio & Motion Controls */}
        <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl p-1 shadow-xs">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute companion audio" : "Enable companion audio"}
            title={soundEnabled ? "Mute Companion Sounds" : "Enable Companion Sounds"}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
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

      {/* Habitat Landscape Floor & Interactive Anchors */}
      <div className="relative w-full h-[230px] sm:h-[260px] my-auto overflow-hidden">
        {/* Anchor 1: Resting Nook (Left Cushion) */}
        <button
          type="button"
          onClick={() => triggerCare("rest")}
          aria-label="Resting Nook"
          className="absolute bottom-4 left-[8%] sm:left-[12%] -translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95"
        >
          <div className="w-16 h-8 sm:w-20 sm:h-10 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 border border-indigo-400/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base">🛋️</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
            Nook
          </span>
        </button>

        {/* Anchor 2: Play Area (Center) */}
        <button
          type="button"
          onClick={() => triggerCare("play")}
          aria-label="Play Area"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95"
        >
          <div className="w-16 h-8 sm:w-20 sm:h-10 rounded-full bg-amber-500/20 dark:bg-amber-400/20 border border-amber-400/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base">{personality.toyEmoji}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
            Toys
          </span>
        </button>

        {/* Anchor 3: Feeding Bowl (Right) */}
        <button
          type="button"
          onClick={() => triggerCare("feed")}
          aria-label="Feeding Bowl"
          className="absolute bottom-4 right-[8%] sm:right-[12%] translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-2 transition-transform active:scale-95"
        >
          <div className="w-16 h-8 sm:w-20 sm:h-10 rounded-full bg-pink-500/20 dark:bg-pink-400/20 border border-pink-400/40 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base">{personality.treatEmoji}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
            Bowl
          </span>
        </button>

        {/* THE LIVING COMPANION ACTOR */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`${name}, ${t(personality.nameKey)}. Current state: ${animState}. Tap to interact or drag to pet.`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePetTap();
            }
          }}
          onClick={handlePetTap}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute bottom-6 sm:bottom-8 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 rounded-full select-none"
          style={{
            left: `${coords.xPercent}%`,
            transform: `translateX(-50%) scale(${growthStage.scale * (coords.facing === "left" ? -1 : 1)}, ${growthStage.scale})`,
            transition: reducedMotion ? "none" : "left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
            touchAction: "none",
          }}
        >
          <PetArtwork
            speciesId={speciesId}
            mood={animState === "sleeping" ? "sleepy" : "happy"}
            accessory={accessory}
            size={170}
            animationState={animState}
            isBlinking={isBlinking}
            headTilt={headTilt}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Floating Particle FX Layer */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none animate-float-particle font-bold"
            style={{
              left: `${p.x}%`,
              bottom: `${100 - p.y}%`,
              fontSize: `${p.size}px`,
            }}
          >
            {p.type === "heart" && "💖"}
            {p.type === "star" && "⭐"}
            {p.type === "crumb" && "🍪"}
            {p.type === "zzz" && "💤"}
            {p.type === "sparkle" && "✨"}
          </div>
        ))}
      </div>

      {/* Stage Bottom Bar: Pet Identity & State Toast */}
      <div className="relative z-20 w-full flex items-center justify-between p-4 sm:p-5 border-t border-border/30 bg-card/40 backdrop-blur-xs">
        <div className="space-y-0.5 text-start">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
              {name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              {t(growthStage.labelKey)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {t(personality.nameKey)} · {t(habitatTheme.labelKey)}
          </p>
        </div>

        <div className="text-end">
          <span className="inline-flex items-center rounded-xl bg-card/90 border border-border/70 px-3 py-1 text-xs font-bold text-foreground shadow-xs">
            {animState === "sleeping"
              ? "💤 " + t("companion.actionRest")
              : animState === "eating"
                ? "🍓 " + t("companion.actionFeed")
                : animState === "playing"
                  ? "🎾 " + t("companion.actionPlay")
                  : animState === "being_petted"
                    ? "💖 " + t("companion.actionAffection")
                    : "✨ " + t(`pet.mood.happy`)}
          </span>
        </div>
      </div>
    </section>
  );
};
