/**
 * Saheli 10.4 — Articulated Character Rigging Types & Defaults
 */

import type { PetHitZone } from "./touchGestureEngine";

export interface CharacterRig {
  headTilt?: number; // degrees (-15 to +15)
  headX?: number; // px (-8 to +8)
  headY?: number; // px (-8 to +8)
  headNod?: number; // px (-5 to +8)
  gazeX?: number; // -1 to +1 (pupil tracking)
  gazeY?: number; // -1 to +1 (pupil tracking)
  eyeOpenRatio?: number; // 0 (closed) to 1.3 (surprised)
  eyeShape?: "normal" | "happy" | "laughing" | "surprised" | "sleepy" | "winking";
  mouthOpenY?: number; // 0 to 14 px (amplitude-driven lip-sync)
  mouthShape?: "smile" | "talking" | "laugh" | "surprised" | "pout" | "giggle" | "open" | "eating";
  earLeftAngle?: number;
  earRightAngle?: number;
  tailAngle?: number;
  pawLeftY?: number;
  pawRightY?: number;
  bodyScaleX?: number;
  bodyScaleY?: number;
  bellyScaleX?: number;
  bellyScaleY?: number;
  bellySquish?: number;
}

export type ArticulatedRigState = CharacterRig;

export const DEFAULT_RIG_STATE: CharacterRig = {
  headTilt: 0,
  headNod: 0,
  headX: 0,
  headY: 0,
  gazeX: 0,
  gazeY: 0,
  eyeOpenRatio: 1,
  eyeShape: "normal",
  mouthOpenY: 0,
  mouthShape: "smile",
  earLeftAngle: 0,
  earRightAngle: 0,
  tailAngle: 0,
  pawLeftY: 0,
  pawRightY: 0,
  bodyScaleX: 1,
  bodyScaleY: 1,
  bellyScaleX: 1,
  bellyScaleY: 1,
  bellySquish: 1,
};
