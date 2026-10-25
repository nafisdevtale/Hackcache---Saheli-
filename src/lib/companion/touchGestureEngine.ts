/**
 * Saheli 10.4 — Touch and Gesture Interaction Engine
 *
 * Dispatches anatomical touch interactions (head tap, petting stroke,
 * belly tickle, paw tap, tail tap, long press) and provides gaze tracking coordinates.
 */

export type PetHitZone = "head" | "belly" | "paws" | "tail" | "ears" | "body";

export type TouchGestureType =
  | "head_tap"
  | "ear_tap"
  | "petting_stroke"
  | "belly_tickle"
  | "paw_tap"
  | "tail_tap"
  | "long_press"
  | "stage_tap";

export interface TouchGestureEvent {
  type: TouchGestureType;
  zone: PetHitZone | null;
}

export interface GazeCoordinates {
  gazeX: number; // -1 to +1
  gazeY: number; // -1 to +1
}

export interface TouchGestureCallbacks {
  onGesture?: (event: TouchGestureEvent) => void;
  onGazeTarget?: (normX: number, normY: number) => void;
  onGazeChange?: (gaze: GazeCoordinates) => void;
}

export class TouchGestureEngine {
  private activePointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private lastMoveTime = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;
  private totalStrokeDistance = 0;
  private activeZone: PetHitZone | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private isTickling = false;
  private tickleCount = 0;

  private onGesture?: (event: TouchGestureEvent) => void;
  private onGazeTarget?: (normX: number, normY: number) => void;
  private onGazeChange?: (gaze: GazeCoordinates) => void;

  constructor(callbacks?: TouchGestureCallbacks) {
    if (callbacks) {
      this.init(callbacks);
    }
  }

  public init(callbacks: TouchGestureCallbacks) {
    this.onGesture = callbacks.onGesture;
    this.onGazeTarget = callbacks.onGazeTarget;
    this.onGazeChange = callbacks.onGazeChange;
  }

  public handleHitZoneTap(zone: PetHitZone) {
    let type: TouchGestureType = "stage_tap";
    if (zone === "head") type = "head_tap";
    else if (zone === "ears") type = "ear_tap";
    else if (zone === "belly") type = "belly_tickle";
    else if (zone === "paws") type = "paw_tap";
    else if (zone === "tail") type = "tail_tap";

    this.onGesture?.({ type, zone });
  }

  /**
   * Pointer down on pet body part or stage
   */
  public handlePointerDown(
    e: { clientX: number; clientY: number; pointerId?: number },
    zone: PetHitZone | null = null,
  ) {
    this.activePointerId = e.pointerId ?? 1;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startTime = Date.now();
    this.lastMoveX = e.clientX;
    this.lastMoveY = e.clientY;
    this.lastMoveTime = this.startTime;
    this.totalStrokeDistance = 0;
    this.activeZone = zone;
    this.isTickling = false;
    this.tickleCount = 0;

    // Start long-press timer (650ms)
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
    this.longPressTimer = setTimeout(() => {
      if (this.activePointerId !== null && this.totalStrokeDistance < 15) {
        this.onGesture?.({ type: "long_press", zone: this.activeZone });
      }
    }, 650);
  }

  /**
   * Pointer move across stage: updates gaze tracking & detects strokes / tickles
   */
  public handlePointerMove(
    e: { clientX: number; clientY: number; pointerId?: number },
    stageRect?: { left: number; top: number; width: number; height: number } | null,
  ) {
    // 1. Gaze Tracking
    if (stageRect && stageRect.width > 0 && stageRect.height > 0) {
      const centerX = stageRect.left + stageRect.width / 2;
      const centerY = stageRect.top + stageRect.height / 2;
      const rawGazeX = (e.clientX - centerX) / (stageRect.width / 2);
      const rawGazeY = (e.clientY - centerY) / (stageRect.height / 2);

      const gazeX = Math.max(-1, Math.min(1, rawGazeX));
      const gazeY = Math.max(-1, Math.min(1, rawGazeY));
      this.onGazeChange?.({ gazeX, gazeY });
      this.onGazeTarget?.(gazeX, gazeY);
    }

    const currentPointerId = e.pointerId ?? this.activePointerId;
    if (this.activePointerId === null || currentPointerId !== this.activePointerId) return;

    const dx = e.clientX - this.lastMoveX;
    const dy = e.clientY - this.lastMoveY;
    const dist = Math.hypot(dx, dy);
    this.totalStrokeDistance += dist;

    const now = Date.now();
    const dt = now - this.lastMoveTime;

    // Detect Rapid scrubbing on belly -> Tickle
    if (this.activeZone === "belly" && dist > 4 && dt < 80) {
      this.tickleCount++;
      if (this.tickleCount > 3 && !this.isTickling) {
        this.isTickling = true;
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.onGesture?.({ type: "belly_tickle", zone: "belly" });
      }
    } else if (this.totalStrokeDistance > 30) {
      // Petting Stroke across head/body
      if (this.longPressTimer) clearTimeout(this.longPressTimer);
      if (now - this.lastMoveTime > 180) {
        this.onGesture?.({
          type: "petting_stroke",
          zone: this.activeZone || "head",
        });
      }
    }

    this.lastMoveX = e.clientX;
    this.lastMoveY = e.clientY;
    this.lastMoveTime = now;
  }

  /**
   * Pointer release: determine tap vs stroke
   */
  public handlePointerUp(e?: { pointerId?: number }) {
    const currentPointerId = e?.pointerId ?? this.activePointerId;
    if (this.activePointerId === null || currentPointerId !== this.activePointerId) return;

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const duration = Date.now() - this.startTime;

    if (!this.isTickling && this.totalStrokeDistance < 18 && duration < 500) {
      // Tap on specific anatomical zone
      if (this.activeZone === "head") {
        this.onGesture?.({ type: "head_tap", zone: "head" });
      } else if (this.activeZone === "ears") {
        this.onGesture?.({ type: "ear_tap", zone: "ears" });
      } else if (this.activeZone === "belly") {
        this.onGesture?.({ type: "belly_tickle", zone: "belly" });
      } else if (this.activeZone === "paws") {
        this.onGesture?.({ type: "paw_tap", zone: "paws" });
      } else if (this.activeZone === "tail") {
        this.onGesture?.({ type: "tail_tap", zone: "tail" });
      } else {
        this.onGesture?.({ type: "stage_tap", zone: null });
      }
    }

    this.activePointerId = null;
    this.activeZone = null;
    this.isTickling = false;
    this.tickleCount = 0;
  }

  public resetGaze() {
    this.onGazeChange?.({ gazeX: 0, gazeY: 0 });
    this.onGazeTarget?.(0, 0);
  }

  public destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.activePointerId = null;
  }
}

export const touchGestureEngine = new TouchGestureEngine();
