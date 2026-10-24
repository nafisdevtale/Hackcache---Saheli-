/**
 * Saheli 10.3 — Living Companion Animation State Machine
 *
 * Implements deterministic state transitions, timer-based autonomous behaviors,
 * roaming coordinates across the habitat stage, and reduced-motion safety.
 */

export type CompanionAnimState =
  | "idle"
  | "curious"
  | "happy"
  | "walking"
  | "playing"
  | "being_petted"
  | "eating"
  | "sleeping"
  | "waking"
  | "celebrating";

export interface StageCoordinates {
  xPercent: number; // 15% to 85%
  facing: "left" | "right";
}

export interface ParticleEffect {
  id: string;
  type: "heart" | "star" | "crumb" | "zzz" | "sparkle";
  x: number; // percentage
  y: number; // percentage
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  duration: number;
}

export const HABITAT_ANCHORS = {
  nook: { xPercent: 22, label: "Resting Nook" },
  center: { xPercent: 50, label: "Play Area" },
  bowl: { xPercent: 78, label: "Feeding Bowl" },
};

export class PetAnimationMachine {
  private currentState: CompanionAnimState = "idle";
  private currentX: number = HABITAT_ANCHORS.center.xPercent;
  private targetX: number = HABITAT_ANCHORS.center.xPercent;
  private facing: "left" | "right" = "right";
  private isBlinking: boolean = false;
  private headTiltDeg: number = 0;
  private reducedMotion: boolean = false;

  private stateTimer: ReturnType<typeof setTimeout> | null = null;
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private wanderTimer: ReturnType<typeof setTimeout> | null = null;

  private onStateChange?: (state: CompanionAnimState) => void;
  private onPositionChange?: (coords: StageCoordinates) => void;
  private onBlinkChange?: (isBlinking: boolean) => void;
  private onHeadTiltChange?: (deg: number) => void;
  private onEmitParticle?: (particle: ParticleEffect) => void;

  constructor(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
  }

  public init(callbacks: {
    onStateChange: (state: CompanionAnimState) => void;
    onPositionChange: (coords: StageCoordinates) => void;
    onBlinkChange: (isBlinking: boolean) => void;
    onHeadTiltChange: (deg: number) => void;
    onEmitParticle: (particle: ParticleEffect) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onPositionChange = callbacks.onPositionChange;
    this.onBlinkChange = callbacks.onBlinkChange;
    this.onHeadTiltChange = callbacks.onHeadTiltChange;
    this.onEmitParticle = callbacks.onEmitParticle;

    this.startBlinkLoop();
    this.scheduleNextWander();
  }

  public setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    if (reduced) {
      if (this.wanderTimer) clearTimeout(this.wanderTimer);
      this.currentX = HABITAT_ANCHORS.center.xPercent;
      this.targetX = HABITAT_ANCHORS.center.xPercent;
      this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });
    } else {
      this.scheduleNextWander();
    }
  }

  public getState(): CompanionAnimState {
    return this.currentState;
  }

  public getCoordinates(): StageCoordinates {
    return { xPercent: this.currentX, facing: this.facing };
  }

  public isPetBlinking(): boolean {
    return this.isBlinking;
  }

  public getHeadTilt(): number {
    return this.headTiltDeg;
  }

  private setState(newState: CompanionAnimState) {
    this.currentState = newState;
    this.onStateChange?.(newState);
  }

  /**
   * Blink loop: natural periodic eye closure
   */
  private startBlinkLoop() {
    if (this.blinkTimer) clearTimeout(this.blinkTimer);

    const nextBlinkMs = 2800 + Math.random() * 3200;
    this.blinkTimer = setTimeout(() => {
      if (this.currentState !== "sleeping") {
        this.isBlinking = true;
        this.onBlinkChange?.(true);

        setTimeout(() => {
          this.isBlinking = false;
          this.onBlinkChange?.(false);

          // Double blink 20% of the time
          if (Math.random() < 0.25) {
            setTimeout(() => {
              this.isBlinking = true;
              this.onBlinkChange?.(true);
              setTimeout(() => {
                this.isBlinking = false;
                this.onBlinkChange?.(false);
              }, 140);
            }, 100);
          }
        }, 160);
      }
      this.startBlinkLoop();
    }, nextBlinkMs);
  }

  /**
   * Autonomous wandering when in idle state
   */
  private scheduleNextWander() {
    if (this.wanderTimer) clearTimeout(this.wanderTimer);
    if (this.reducedMotion) return;

    const delayMs = 6000 + Math.random() * 7000;
    this.wanderTimer = setTimeout(() => {
      if (this.currentState === "idle") {
        // 35% chance to do curious head tilt, 45% chance to wander, 20% relax
        const roll = Math.random();
        if (roll < 0.35) {
          this.triggerCuriousLook();
        } else if (roll < 0.8) {
          const destinations = [
            HABITAT_ANCHORS.nook.xPercent,
            HABITAT_ANCHORS.center.xPercent,
            HABITAT_ANCHORS.bowl.xPercent,
          ];
          const newTarget = destinations[Math.floor(Math.random() * destinations.length)];
          this.walkTo(newTarget, () => {
            this.setState("idle");
          });
        }
      }
      this.scheduleNextWander();
    }, delayMs);
  }

  /**
   * Walk pet to a specific X coordinate with gentle steps
   */
  public walkTo(targetPercent: number, onArrival?: () => void) {
    if (this.reducedMotion) {
      this.currentX = targetPercent;
      this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });
      onArrival?.();
      return;
    }

    if (this.stateTimer) clearTimeout(this.stateTimer);
    this.targetX = Math.max(16, Math.min(84, targetPercent));
    this.facing = this.targetX >= this.currentX ? "right" : "left";
    this.setState("walking");
    this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });

    const stepDuration = 40; // ms per frame
    const totalDistance = Math.abs(this.targetX - this.currentX);
    if (totalDistance < 2) {
      this.onPositionChange?.({ xPercent: this.targetX, facing: this.facing });
      onArrival?.();
      return;
    }

    const stepSize = (this.targetX - this.currentX) / (totalDistance * 1.8);

    const stepInterval = setInterval(() => {
      if (Math.abs(this.targetX - this.currentX) <= Math.abs(stepSize) * 1.5) {
        this.currentX = this.targetX;
        clearInterval(stepInterval);
        this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });
        onArrival?.();
      } else {
        this.currentX += stepSize;
        this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });
      }
    }, stepDuration);
  }

  /**
   * Curious look around
   */
  public triggerCuriousLook() {
    if (this.currentState !== "idle") return;
    this.setState("curious");
    this.headTiltDeg = Math.random() > 0.5 ? 9 : -9;
    this.onHeadTiltChange?.(this.headTiltDeg);

    setTimeout(() => {
      this.headTiltDeg = 0;
      this.onHeadTiltChange?.(0);
      if (this.currentState === "curious") {
        this.setState("idle");
      }
    }, 2200);
  }

  /**
   * Interactive Action: FEED
   */
  public triggerFeed(onComplete?: () => void) {
    this.walkTo(HABITAT_ANCHORS.bowl.xPercent, () => {
      this.facing = "right";
      this.setState("eating");
      this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });

      // Emit crumb particles
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          this.emitParticle("crumb", this.currentX + (Math.random() * 6 - 3), 72);
        }, i * 280);
      }

      this.stateTimer = setTimeout(() => {
        this.setState("happy");
        this.emitParticle("heart", this.currentX, 60);

        this.stateTimer = setTimeout(() => {
          this.setState("idle");
          onComplete?.();
          this.scheduleNextWander();
        }, 1500);
      }, 3000);
    });
  }

  /**
   * Interactive Action: PLAY WITH TOY
   */
  public triggerPlay(onComplete?: () => void) {
    this.walkTo(HABITAT_ANCHORS.center.xPercent, () => {
      this.setState("playing");
      this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });

      // Emit star sparkles
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          this.emitParticle("star", this.currentX + (Math.random() * 12 - 6), 55);
        }, i * 350);
      }

      this.stateTimer = setTimeout(() => {
        this.setState("happy");
        this.stateTimer = setTimeout(() => {
          this.setState("idle");
          onComplete?.();
          this.scheduleNextWander();
        }, 1400);
      }, 3200);
    });
  }

  /**
   * Interactive Action: REST / SLEEP
   */
  public triggerRest(onComplete?: () => void) {
    this.walkTo(HABITAT_ANCHORS.nook.xPercent, () => {
      this.facing = "left";
      this.setState("sleeping");
      this.headTiltDeg = 4;
      this.onHeadTiltChange?.(4);
      this.onPositionChange?.({ xPercent: this.currentX, facing: this.facing });

      // Periodic floating Zzz
      const emitZzz = () => {
        if (this.currentState === "sleeping") {
          this.emitParticle("zzz", this.currentX, 58);
          this.stateTimer = setTimeout(emitZzz, 2200);
        }
      };
      emitZzz();
      onComplete?.();
    });
  }

  /**
   * Interactive Action: WAKE UP
   */
  public triggerWake(onComplete?: () => void) {
    if (this.currentState !== "sleeping") return;
    if (this.stateTimer) clearTimeout(this.stateTimer);

    this.setState("waking");
    this.headTiltDeg = 0;
    this.onHeadTiltChange?.(0);

    setTimeout(() => {
      this.setState("happy");
      this.emitParticle("sparkle", this.currentX, 60);

      setTimeout(() => {
        this.setState("idle");
        onComplete?.();
        this.scheduleNextWander();
      }, 1200);
    }, 1000);
  }

  /**
   * Interactive Action: PETTING STROKE
   */
  public startPetting() {
    if (this.currentState === "sleeping") return;
    if (this.stateTimer) clearTimeout(this.stateTimer);
    this.setState("being_petted");
    this.headTiltDeg = 6;
    this.onHeadTiltChange?.(6);
    this.emitParticle("heart", this.currentX + (Math.random() * 8 - 4), 58);
  }

  public endPetting(onComplete?: () => void) {
    if (this.currentState !== "being_petted") return;
    this.setState("happy");
    this.headTiltDeg = 0;
    this.onHeadTiltChange?.(0);
    this.emitParticle("heart", this.currentX, 55);

    this.stateTimer = setTimeout(() => {
      this.setState("idle");
      onComplete?.();
      this.scheduleNextWander();
    }, 1400);
  }

  /**
   * Interactive Action: TAP HOP
   */
  public triggerTapHop() {
    if (this.currentState === "sleeping") {
      this.triggerWake();
      return;
    }
    if (this.currentState === "eating" || this.currentState === "playing") return;

    this.setState("happy");
    this.emitParticle("sparkle", this.currentX, 60);

    setTimeout(() => {
      if (this.currentState === "happy") {
        this.setState("idle");
      }
    }, 1200);
  }

  /**
   * CELEBRATION (Stage Growth / Milestones)
   */
  public triggerCelebration(onComplete?: () => void) {
    this.walkTo(HABITAT_ANCHORS.center.xPercent, () => {
      this.setState("celebrating");
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          this.emitParticle(
            Math.random() > 0.5 ? "star" : "heart",
            this.currentX + (Math.random() * 20 - 10),
            50 + Math.random() * 10,
          );
        }, i * 200);
      }

      this.stateTimer = setTimeout(() => {
        this.setState("idle");
        onComplete?.();
        this.scheduleNextWander();
      }, 4000);
    });
  }

  private emitParticle(type: ParticleEffect["type"], x: number, y: number) {
    const p: ParticleEffect = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      x,
      y,
      size: type === "crumb" ? 6 : type === "zzz" ? 18 : 16,
      opacity: 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: type === "crumb" ? 0.3 : -0.6,
      duration: type === "zzz" ? 2200 : 1500,
    };
    this.onEmitParticle?.(p);
  }

  public destroy() {
    if (this.stateTimer) clearTimeout(this.stateTimer);
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    if (this.wanderTimer) clearTimeout(this.wanderTimer);
  }
}
