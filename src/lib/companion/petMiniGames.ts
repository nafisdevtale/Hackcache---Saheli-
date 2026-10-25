/**
 * Saheli 10.4 — Living Pet Mini-Games Engine
 *
 * Provides real-time physics and game logic for 3 playable companion games:
 * 1. Catch the Ball: physics bounce, dragging, throwing, and pet interception.
 * 2. Follow the Toy: feather wand / yarn tracking, distance pounce detection.
 * 3. Find the Treat: shell game with 3 cups, animated shuffle, and reward eating.
 */

import { petSoundEngine } from "./petSoundEngine";

export type MiniGameType = "none" | "catch_ball" | "follow_toy" | "find_treat";

export interface BallState {
  x: number; // 0 to 100 stage percentage
  y: number; // 0 to 100 stage percentage
  vx: number;
  vy: number;
  radius: number;
  isHeld: boolean;
  bounces: number;
}

export interface ToyState {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  targetX: number;
  targetY: number;
  isPounced: boolean;
  pounceStreak: number;
}

export type TreatGameState = "intro" | "covering" | "shuffling" | "pick" | "revealed";

export interface TreatCup {
  id: number;
  positionIndex: number; // 0 (left), 1 (center), 2 (right)
  hasTreat: boolean;
  isLifted: boolean;
}

export interface MiniGameEventListener {
  onScoreUpdate?: (score: number, streak: number) => void;
  onPetReaction?: (reaction: "bat" | "catch" | "pounce" | "eat" | "cheer" | "curious") => void;
  onGazeTarget?: (normX: number, normY: number) => void;
}

export class PetMiniGameController {
  private activeGame: MiniGameType = "none";
  private listener: MiniGameEventListener | null = null;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Game 1: Catch the Ball
  public ball: BallState = {
    x: 50,
    y: 25,
    vx: 0,
    vy: 0,
    radius: 5,
    isHeld: false,
    bounces: 0,
  };
  private ballScore: number = 0;
  private ballStreak: number = 0;

  // Game 2: Follow the Toy
  public toy: ToyState = {
    x: 35,
    y: 50,
    targetX: 35,
    targetY: 50,
    isPounced: false,
    pounceStreak: 0,
  };
  private toyScore: number = 0;

  // Game 3: Find the Treat
  public treatState: TreatGameState = "intro";
  public cups: TreatCup[] = [
    { id: 0, positionIndex: 0, hasTreat: false, isLifted: false },
    { id: 1, positionIndex: 1, hasTreat: true, isLifted: false },
    { id: 2, positionIndex: 2, hasTreat: false, isLifted: false },
  ];
  public treatScore: number = 0;
  public treatStreak: number = 0;
  public selectedCupId: number | null = null;
  private shuffleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(listener?: MiniGameEventListener) {
    if (listener) this.listener = listener;
  }

  public setListener(listener: MiniGameEventListener) {
    this.listener = listener;
  }

  public getActiveGame(): MiniGameType {
    return this.activeGame;
  }

  public startGame(game: MiniGameType) {
    this.stopCurrentGame();
    this.activeGame = game;

    if (game === "catch_ball") {
      this.initCatchBall();
    } else if (game === "follow_toy") {
      this.initFollowToy();
    } else if (game === "find_treat") {
      this.initFindTreat();
    }

    if (game !== "none" && game !== "find_treat") {
      this.startLoop();
    }
  }

  public stopCurrentGame() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.shuffleTimer) {
      clearTimeout(this.shuffleTimer);
      this.shuffleTimer = null;
    }
    this.activeGame = "none";
  }

  // -------------------------------------------------------------
  // GAME 1: CATCH THE BALL
  // -------------------------------------------------------------
  private initCatchBall() {
    this.ball = {
      x: 50,
      y: 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0.5,
      radius: 5,
      isHeld: false,
      bounces: 0,
    };
    this.ballScore = 0;
    this.ballStreak = 0;
    this.listener?.onScoreUpdate?.(0, 0);
  }

  public holdBall(stageNormX: number, stageNormY: number) {
    if (this.activeGame !== "catch_ball") return;
    this.ball.isHeld = true;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.x = Math.max(10, Math.min(90, stageNormX * 100));
    this.ball.y = Math.max(10, Math.min(85, stageNormY * 100));
    this.updateGaze(this.ball.x, this.ball.y);
  }

  public moveHeldBall(stageNormX: number, stageNormY: number, deltaX: number, deltaY: number) {
    if (this.activeGame !== "catch_ball" || !this.ball.isHeld) return;
    this.ball.x = Math.max(10, Math.min(90, stageNormX * 100));
    this.ball.y = Math.max(10, Math.min(85, stageNormY * 100));
    this.ball.vx = deltaX * 1.2;
    this.ball.vy = deltaY * 1.2;
    this.updateGaze(this.ball.x, this.ball.y);
  }

  public releaseBall() {
    if (this.activeGame !== "catch_ball") return;
    this.ball.isHeld = false;
    // Cap launch velocities
    this.ball.vx = Math.max(-3.5, Math.min(3.5, this.ball.vx));
    this.ball.vy = Math.max(-4.5, Math.min(3.5, this.ball.vy));
  }

  public throwBallTo(targetX: number, targetY: number) {
    if (this.activeGame !== "catch_ball") return;
    this.ball.isHeld = false;
    const dx = targetX - this.ball.x;
    const dy = targetY - this.ball.y;
    this.ball.vx = dx * 0.08;
    this.ball.vy = dy * 0.08 - 2.5; // arc
  }

  private updateBallPhysics(dt: number) {
    if (this.ball.isHeld) return;

    const gravity = 0.12 * dt;
    this.ball.vy += gravity;

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Wall bounce left/right
    if (this.ball.x <= 12) {
      this.ball.x = 12;
      this.ball.vx = -this.ball.vx * 0.75;
      petSoundEngine.playBallBounce(Math.abs(this.ball.vx));
    } else if (this.ball.x >= 88) {
      this.ball.x = 88;
      this.ball.vx = -this.ball.vx * 0.75;
      petSoundEngine.playBallBounce(Math.abs(this.ball.vx));
    }

    // Floor bounce
    const floorY = 82;
    if (this.ball.y >= floorY) {
      this.ball.y = floorY;
      this.ball.vy = -this.ball.vy * 0.68;
      if (Math.abs(this.ball.vy) > 0.4) {
        petSoundEngine.playBallBounce(Math.abs(this.ball.vy));
      } else {
        this.ball.vy = 0;
      }
      this.ball.vx *= 0.94; // friction
    }

    // Ceiling bounce
    if (this.ball.y <= 12) {
      this.ball.y = 12;
      this.ball.vy = Math.abs(this.ball.vy) * 0.75;
    }

    // Pet interception zone (Pet centered around x=50, y=55-75)
    const petCenterX = 50;
    const petCenterY = 62;
    const distToPet = Math.hypot(this.ball.x - petCenterX, this.ball.y - petCenterY);

    if (distToPet < 18 && this.ball.y < floorY - 4) {
      // Pet bats the ball!
      const batBoostX = (this.ball.x - petCenterX) * 0.15 + (Math.random() - 0.5) * 1.5;
      this.ball.vx = batBoostX;
      this.ball.vy = -3.2 - Math.random() * 1.2; // Bounce upwards

      this.ballScore += 1;
      this.ballStreak += 1;
      this.listener?.onScoreUpdate?.(this.ballScore, this.ballStreak);
      this.listener?.onPetReaction?.("bat");
      petSoundEngine.playPounceCatch();
    }

    this.updateGaze(this.ball.x, this.ball.y);
  }

  // -------------------------------------------------------------
  // GAME 2: FOLLOW THE TOY
  // -------------------------------------------------------------
  private initFollowToy() {
    this.toy = {
      x: 35,
      y: 50,
      targetX: 35,
      targetY: 50,
      isPounced: false,
      pounceStreak: 0,
    };
    this.toyScore = 0;
    this.listener?.onScoreUpdate?.(0, 0);
  }

  public moveToy(stageNormX: number, stageNormY: number) {
    if (this.activeGame !== "follow_toy") return;
    this.toy.targetX = Math.max(12, Math.min(88, stageNormX * 100));
    this.toy.targetY = Math.max(15, Math.min(82, stageNormY * 100));
  }

  private updateToyMovement(dt: number) {
    // Smooth lerp to target pointer position
    const lerpSpeed = 0.15 * dt;
    this.toy.x += (this.toy.targetX - this.toy.x) * lerpSpeed;
    this.toy.y += (this.toy.targetY - this.toy.y) * lerpSpeed;

    this.updateGaze(this.toy.x, this.toy.y);

    // Distance to pet center
    const petCenterX = 50;
    const petCenterY = 60;
    const dist = Math.hypot(this.toy.x - petCenterX, this.toy.y - petCenterY);

    if (dist < 16 && !this.toy.isPounced) {
      this.toy.isPounced = true;
      this.toyScore += 1;
      this.toy.pounceStreak += 1;
      this.listener?.onScoreUpdate?.(this.toyScore, this.toy.pounceStreak);
      this.listener?.onPetReaction?.("pounce");
      petSoundEngine.playPounceCatch();

      setTimeout(() => {
        this.toy.isPounced = false;
      }, 700);
    }
  }

  // -------------------------------------------------------------
  // GAME 3: FIND THE TREAT (SHELL GAME)
  // -------------------------------------------------------------
  private initFindTreat() {
    this.treatScore = 0;
    this.treatStreak = 0;
    this.startTreatRound();
  }

  public startTreatRound() {
    this.treatState = "intro";
    this.selectedCupId = null;

    // Randomize treat placement
    const winningCupIndex = Math.floor(Math.random() * 3);
    this.cups = [
      { id: 0, positionIndex: 0, hasTreat: winningCupIndex === 0, isLifted: true },
      { id: 1, positionIndex: 1, hasTreat: winningCupIndex === 1, isLifted: true },
      { id: 2, positionIndex: 2, hasTreat: winningCupIndex === 2, isLifted: true },
    ];

    this.listener?.onPetReaction?.("curious");
    petSoundEngine.playToySound();

    // After 1.2s, cups cover the treat
    this.shuffleTimer = setTimeout(() => {
      this.treatState = "covering";
      this.cups = this.cups.map((c) => ({ ...c, isLifted: false }));

      // After 0.6s, start animated shuffling
      this.shuffleTimer = setTimeout(() => {
        this.runShuffleSequence(0, 4);
      }, 600);
    }, 1200);
  }

  private runShuffleSequence(currentStep: number, totalSteps: number) {
    if (currentStep >= totalSteps) {
      this.treatState = "pick";
      this.listener?.onPetReaction?.("cheer");
      return;
    }

    this.treatState = "shuffling";
    petSoundEngine.playCupShuffle();

    // Swap two random cups' positions
    const posA = Math.floor(Math.random() * 3);
    let posB = Math.floor(Math.random() * 3);
    while (posB === posA) {
      posB = Math.floor(Math.random() * 3);
    }

    const cupA = this.cups.find((c) => c.positionIndex === posA);
    const cupB = this.cups.find((c) => c.positionIndex === posB);

    if (cupA && cupB) {
      cupA.positionIndex = posB;
      cupB.positionIndex = posA;
      this.cups = [...this.cups];
    }

    this.shuffleTimer = setTimeout(() => {
      this.runShuffleSequence(currentStep + 1, totalSteps);
    }, 450);
  }

  public chooseCup(cupId: number) {
    if (this.treatState !== "pick") return;

    this.selectedCupId = cupId;
    this.treatState = "revealed";

    // Lift chosen cup and winning cup
    const chosenCup = this.cups.find((c) => c.id === cupId);
    this.cups = this.cups.map((c) => ({
      ...c,
      isLifted: c.id === cupId || c.hasTreat,
    }));

    if (chosenCup?.hasTreat) {
      this.treatScore += 1;
      this.treatStreak += 1;
      this.listener?.onScoreUpdate?.(this.treatScore, this.treatStreak);
      this.listener?.onPetReaction?.("eat");
      petSoundEngine.playSuccessChime();
      setTimeout(() => {
        petSoundEngine.playEatSound();
      }, 350);
    } else {
      this.treatStreak = 0;
      this.listener?.onScoreUpdate?.(this.treatScore, 0);
      this.listener?.onPetReaction?.("curious");
      petSoundEngine.playToySound();
    }
  }

  // -------------------------------------------------------------
  // ANIMATION LOOP & GAZE DISPATCH
  // -------------------------------------------------------------
  private startLoop() {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const deltaMs = Math.min(32, now - this.lastTime);
      this.lastTime = now;
      const dt = deltaMs / 16.66; // normalized 60 FPS delta

      if (this.activeGame === "catch_ball") {
        this.updateBallPhysics(dt);
      } else if (this.activeGame === "follow_toy") {
        this.updateToyMovement(dt);
      }

      if (this.activeGame !== "none") {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private updateGaze(stagePercentX: number, stagePercentY: number) {
    // Map stage 0-100% to gaze range -1 to +1 relative to pet center (50, 60)
    const normX = Math.max(-1, Math.min(1, (stagePercentX - 50) / 35));
    const normY = Math.max(-1, Math.min(1, (stagePercentY - 55) / 30));
    this.listener?.onGazeTarget?.(normX, normY);
  }

  public destroy() {
    this.stopCurrentGame();
    this.listener = null;
  }
}
