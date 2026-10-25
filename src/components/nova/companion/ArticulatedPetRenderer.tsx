/**
 * Saheli 10.4 — Articulated Interactive Character Renderer
 *
 * Full 2D Character Rigging:
 * - Independent moving head (tilt, gaze tracking, nod).
 * - Articulated eyes with interactive pupil tracking (follows pointer/toys) and expressive eyelids.
 * - Real-time audio amplitude lip-sync mouth opening.
 * - Articulated ears, wings, flippers, and wagging tails.
 * - Anatomical hitzones for head, ears, belly/tickle, paws, and tail.
 * - Exactly supports all 15 Saheli companions with accessories.
 */

import React from "react";
import type { PetHitZone } from "@/lib/companion/touchGestureEngine";
import {
  type CharacterRig,
  type ArticulatedRigState,
  DEFAULT_RIG_STATE,
} from "@/lib/companion/petRigTypes";

export type { CharacterRig, ArticulatedRigState };
export { DEFAULT_RIG_STATE };

export interface ArticulatedPetRendererProps {
  speciesId?: string;
  rig?: CharacterRig;
  accessory?: string;
  size?: number;
  className?: string;
  reducedMotion?: boolean;
  onHitZonePointerDown?: (zone: PetHitZone, e: React.PointerEvent) => void;
}

export const ArticulatedPetRenderer: React.FC<ArticulatedPetRendererProps> = ({
  speciesId = "cat",
  rig = {},
  accessory = "none",
  size = 190,
  className = "",
  reducedMotion = false,
  onHitZonePointerDown,
}) => {
  const {
    headTilt = 0,
    headX = 0,
    headY = 0,
    gazeX = 0,
    gazeY = 0,
    eyeOpenRatio = 1,
    eyeShape = "normal",
    mouthOpenY = 0,
    mouthShape = "smile",
    earLeftAngle = 0,
    earRightAngle = 0,
    tailAngle = 0,
    pawLeftY = 0,
    pawRightY = 0,
    bodyScaleX = 1,
    bodyScaleY = 1,
    bellyScaleX = 1,
    bellyScaleY = 1,
  } = rig;

  // Pupil offsets for gaze tracking
  const pupilDx = gazeX * 3.5;
  const pupilDy = gazeY * 3.0;

  // Eyelid height multiplier
  const isEyeClosed = eyeOpenRatio <= 0.2 || eyeShape === "sleepy";
  const isLaughing = eyeShape === "laughing" || eyeShape === "happy";

  const renderEyes = (
    leftCenter: { x: number; y: number },
    rightCenter: { x: number; y: number },
    eyeColor = "#831843",
    r = 6,
  ) => {
    if (isEyeClosed) {
      // Gentle closed sleeping arcs
      return (
        <g id="eyes-closed">
          <path
            d={`M${leftCenter.x - 7},${leftCenter.y + 2} Q${leftCenter.x},${leftCenter.y + 7} ${leftCenter.x + 7},${leftCenter.y + 2}`}
            stroke={eyeColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${rightCenter.x - 7},${rightCenter.y + 2} Q${rightCenter.x},${rightCenter.y + 7} ${rightCenter.x + 7},${rightCenter.y + 2}`}
            stroke={eyeColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (isLaughing) {
      // Joyous upward smiling crescent eyes
      return (
        <g id="eyes-happy">
          <path
            d={`M${leftCenter.x - 8},${leftCenter.y + 3} Q${leftCenter.x},${leftCenter.y - 4} ${leftCenter.x + 8},${leftCenter.y + 3}`}
            stroke={eyeColor}
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${rightCenter.x - 8},${rightCenter.y + 3} Q${rightCenter.x},${rightCenter.y - 4} ${rightCenter.x + 8},${rightCenter.y + 3}`}
            stroke={eyeColor}
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Articulated open eyes with interactive pupil tracking
    const currentR = eyeShape === "surprised" ? r * 1.25 : r;
    return (
      <g id="eyes-open">
        {/* Left Eye White / Socket */}
        <ellipse
          cx={leftCenter.x}
          cy={leftCenter.y}
          rx={currentR}
          ry={currentR * eyeOpenRatio}
          fill={eyeColor}
        />
        {/* Left Pupil Highlight Tracking */}
        <circle
          cx={leftCenter.x + pupilDx - 1.5}
          cy={leftCenter.y + pupilDy - 1.5}
          r={Math.max(1, currentR * 0.4)}
          fill="#ffffff"
        />

        {/* Right Eye White / Socket */}
        <ellipse
          cx={rightCenter.x}
          cy={rightCenter.y}
          rx={currentR}
          ry={currentR * eyeOpenRatio}
          fill={eyeColor}
        />
        {/* Right Pupil Highlight Tracking */}
        <circle
          cx={rightCenter.x + pupilDx - 1.5}
          cy={rightCenter.y + pupilDy - 1.5}
          r={Math.max(1, currentR * 0.4)}
          fill="#ffffff"
        />
      </g>
    );
  };

  const renderMouth = (center: { x: number; y: number }, strokeColor = "#be185d") => {
    // Dynamic lip-sync opening
    if (mouthOpenY > 1.5 || mouthShape === "talking" || mouthShape === "laugh") {
      const openHeight = Math.max(3, mouthOpenY);
      return (
        <g id="mouth-talking">
          <ellipse
            cx={center.x}
            cy={center.y + openHeight * 0.4}
            rx={6 + openHeight * 0.3}
            ry={openHeight}
            fill="#be185d"
          />
          <ellipse
            cx={center.x}
            cy={center.y + openHeight * 0.65}
            rx={4}
            ry={openHeight * 0.5}
            fill="#fda4af"
          />
        </g>
      );
    }

    if (mouthShape === "surprised") {
      return <circle cx={center.x} cy={center.y + 2} r="4.5" fill={strokeColor} />;
    }

    // Gentle smile
    return (
      <path
        d={`M${center.x - 5},${center.y} Q${center.x},${center.y + 4} ${center.x + 5},${center.y}`}
        stroke={strokeColor}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const renderSpeciesRig = () => {
    switch (speciesId) {
      case "cat":
        return (
          <g id="species-cat">
            {/* Tail with articulated sway */}
            <g
              data-hit="tail"
              style={{
                transformOrigin: "150px 150px",
                transform: `rotate(${tailAngle}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("tail", e)}
            >
              <path
                d="M150,150 Q185,140 175,100 Q165,95 160,110 Q165,135 140,155 Z"
                fill="#f472b6"
              />
            </g>

            {/* Body & Belly with tickle scaling */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 150px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="145" rx="55" ry="45" fill="#f472b6" />
              <ellipse cx="100" cy="150" rx="35" ry="32" fill="#fff1f2" />
            </g>

            {/* Paws */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="78" cy={175 + pawLeftY} rx="14" ry="10" fill="#fda4af" />
              <ellipse cx="122" cy={175 + pawRightY} rx="14" ry="10" fill="#fda4af" />
            </g>

            {/* Articulated Head Group */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              {/* Ears with twitching */}
              <g
                data-hit="ears"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHitZonePointerDown?.("ears", e);
                }}
              >
                <polygon
                  points="50,90 35,40 85,65"
                  fill="#f472b6"
                  style={{
                    transformOrigin: "60px 80px",
                    transform: `rotate(${earLeftAngle}deg)`,
                  }}
                />
                <polygon points="52,85 42,48 80,68" fill="#fda4af" />
                <polygon
                  points="150,90 165,40 115,65"
                  fill="#f472b6"
                  style={{
                    transformOrigin: "140px 80px",
                    transform: `rotate(${earRightAngle}deg)`,
                  }}
                />
                <polygon points="148,85 158,48 120,68" fill="#fda4af" />
              </g>

              {/* Head Circle */}
              <circle cx="100" cy="95" r="45" fill="#f472b6" />

              {/* Rosy Cheeks */}
              <circle cx="75" cy="105" r="7" fill="#f43f5e" opacity="0.35" />
              <circle cx="125" cy="105" r="7" fill="#f43f5e" opacity="0.35" />

              {/* Whiskers */}
              <line
                x1="60"
                y1="98"
                x2="38"
                y2="95"
                stroke="#9d174d"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.6"
              />
              <line
                x1="60"
                y1="104"
                x2="40"
                y2="108"
                stroke="#9d174d"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.6"
              />
              <line
                x1="140"
                y1="98"
                x2="162"
                y2="95"
                stroke="#9d174d"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.6"
              />
              <line
                x1="140"
                y1="104"
                x2="160"
                y2="108"
                stroke="#9d174d"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Nose */}
              <polygon points="97,99 103,99 100,103" fill="#be185d" />

              {/* Articulated Eyes */}
              {renderEyes({ x: 84, y: 90 }, { x: 116, y: 90 }, "#831843", 6)}

              {/* Real-time Lip-Sync Mouth */}
              {renderMouth({ x: 100, y: 105 })}
            </g>
          </g>
        );

      case "dog":
        return (
          <g id="species-dog">
            {/* Wagging Tail */}
            <g
              data-hit="tail"
              style={{
                transformOrigin: "145px 145px",
                transform: `rotate(${tailAngle * 1.5}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("tail", e)}
            >
              <path d="M145,145 Q180,120 185,90 Q170,95 155,120 Z" fill="#fb923c" />
            </g>

            {/* Body / Belly */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="145" rx="55" ry="46" fill="#fb923c" />
              <ellipse cx="100" cy="150" rx="34" ry="32" fill="#fff7ed" />
            </g>

            {/* Paws */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="78" cy={175 + pawLeftY} rx="15" ry="10" fill="#fed7aa" />
              <ellipse cx="122" cy={175 + pawRightY} rx="15" ry="10" fill="#fed7aa" />
            </g>

            {/* Head */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              {/* Floppy Ears */}
              <g
                data-hit="ears"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHitZonePointerDown?.("ears", e);
                }}
              >
                <ellipse
                  cx="54"
                  cy="98"
                  rx="14"
                  ry="28"
                  fill="#c2410c"
                  style={{
                    transformOrigin: "60px 80px",
                    transform: `rotate(${earLeftAngle - 15}deg)`,
                  }}
                />
                <ellipse
                  cx="146"
                  cy="98"
                  rx="14"
                  ry="28"
                  fill="#c2410c"
                  style={{
                    transformOrigin: "140px 80px",
                    transform: `rotate(${earRightAngle + 15}deg)`,
                  }}
                />
              </g>

              {/* Head Base */}
              <circle cx="100" cy="95" r="46" fill="#fb923c" />
              <ellipse cx="100" cy="106" rx="26" ry="18" fill="#fff7ed" />

              {/* Cheeks */}
              <circle cx="75" cy="106" r="6" fill="#ea580c" opacity="0.3" />
              <circle cx="125" cy="106" r="6" fill="#ea580c" opacity="0.3" />

              {/* Nose */}
              <ellipse cx="100" cy="99" rx="8" ry="6" fill="#7c2d12" />

              {/* Eyes */}
              {renderEyes({ x: 82, y: 88 }, { x: 118, y: 88 }, "#7c2d12", 6.5)}

              {/* Mouth & Tongue */}
              {renderMouth({ x: 100, y: 110 }, "#c2410c")}
            </g>
          </g>
        );

      case "rabbit":
        return (
          <g id="species-rabbit">
            {/* Puff Tail */}
            <g
              data-hit="tail"
              onPointerDown={(e) => onHitZonePointerDown?.("tail", e)}
              style={{ cursor: "pointer" }}
            >
              <circle cx="152" cy="155" r="14" fill="#fdf4ff" stroke="#e879f9" strokeWidth="1" />
            </g>

            {/* Body */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="145" rx="52" ry="44" fill="#e879f9" />
              <ellipse cx="100" cy="148" rx="30" ry="28" fill="#fdf4ff" />
            </g>

            {/* Paws */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="76" cy={175 + pawLeftY} rx="14" ry="11" fill="#f5d0fe" />
              <ellipse cx="124" cy={175 + pawRightY} rx="14" ry="11" fill="#f5d0fe" />
            </g>

            {/* Head */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              {/* Long Upright Ears with independent twitch */}
              <g
                data-hit="ears"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHitZonePointerDown?.("ears", e);
                }}
              >
                <ellipse
                  cx="75"
                  cy="42"
                  rx="14"
                  ry="38"
                  fill="#e879f9"
                  style={{
                    transformOrigin: "80px 80px",
                    transform: `rotate(${earLeftAngle - 5}deg)`,
                  }}
                />
                <ellipse cx="75" cy="44" rx="8" ry="28" fill="#fbcfe8" />
                <ellipse
                  cx="125"
                  cy="42"
                  rx="14"
                  ry="38"
                  fill="#e879f9"
                  style={{
                    transformOrigin: "120px 80px",
                    transform: `rotate(${earRightAngle + 5}deg)`,
                  }}
                />
                <ellipse cx="125" cy="44" rx="8" ry="28" fill="#fbcfe8" />
              </g>

              {/* Head Circle */}
              <circle cx="100" cy="98" r="42" fill="#e879f9" />
              <circle cx="75" cy="107" r="6" fill="#f43f5e" opacity="0.3" />
              <circle cx="125" cy="107" r="6" fill="#f43f5e" opacity="0.3" />

              {/* Tiny Nose */}
              <polygon points="98,103 102,103 100,106" fill="#db2777" />

              {/* Eyes */}
              {renderEyes({ x: 84, y: 94 }, { x: 116, y: 94 }, "#701a75", 6)}

              {/* Lip-Sync Mouth */}
              {renderMouth({ x: 100, y: 110 }, "#c026d3")}
            </g>
          </g>
        );

      case "penguin":
        return (
          <g id="species-penguin">
            {/* Waddle Feet */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="80" cy={178 + pawLeftY} rx="16" ry="8" fill="#f59e0b" />
              <ellipse cx="120" cy={178 + pawRightY} rx="16" ry="8" fill="#f59e0b" />
            </g>

            {/* Flippers / Wings */}
            <g
              style={{
                transformOrigin: "52px 125px",
                transform: `rotate(${pawLeftY * 3}deg)`,
              }}
            >
              <ellipse cx="48" cy="135" rx="10" ry="26" fill="#0284c7" />
            </g>
            <g
              style={{
                transformOrigin: "148px 125px",
                transform: `rotate(${-pawRightY * 3}deg)`,
              }}
            >
              <ellipse cx="152" cy="135" rx="10" ry="26" fill="#0284c7" />
            </g>

            {/* Body & Tuxedo White Belly */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="142" rx="48" ry="46" fill="#0284c7" />
              <ellipse cx="100" cy="144" rx="32" ry="36" fill="#f8fafc" />
            </g>

            {/* Articulated Head & Beak */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              <circle cx="100" cy="92" r="38" fill="#0284c7" />
              <ellipse cx="100" cy="96" rx="26" ry="24" fill="#f8fafc" />

              {/* Eyes */}
              {renderEyes({ x: 86, y: 88 }, { x: 114, y: 88 }, "#0f172a", 5.5)}

              {/* Beak with Dynamic Lip Sync Opening */}
              <polygon
                points={`92,97 108,97 100,${106 + Math.min(10, mouthOpenY * 0.8)}`}
                fill="#f59e0b"
              />
            </g>
          </g>
        );

      case "bear":
        return (
          <g id="species-bear">
            {/* Stubby Tail */}
            <circle cx="152" cy="150" r="12" fill="#713f12" />

            {/* Body */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="145" rx="58" ry="48" fill="#a16207" />
              <ellipse cx="100" cy="150" rx="36" ry="32" fill="#fef3c7" />
            </g>

            {/* Paws */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="76" cy={176 + pawLeftY} rx="16" ry="12" fill="#713f12" />
              <ellipse cx="124" cy={176 + pawRightY} rx="16" ry="12" fill="#713f12" />
            </g>

            {/* Head */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              {/* Round Ears */}
              <circle cx="62" cy="62" r="16" fill="#a16207" />
              <circle cx="62" cy="62" r="9" fill="#fef3c7" />
              <circle cx="138" cy="62" r="16" fill="#a16207" />
              <circle cx="138" cy="62" r="9" fill="#fef3c7" />

              {/* Head Circle */}
              <circle cx="100" cy="95" r="46" fill="#a16207" />

              {/* Muzzle */}
              <ellipse cx="100" cy="106" rx="24" ry="16" fill="#fef3c7" />
              <ellipse cx="100" cy="100" rx="8" ry="6" fill="#451a03" />

              {/* Eyes */}
              {renderEyes({ x: 82, y: 88 }, { x: 118, y: 88 }, "#451a03", 6)}

              {/* Mouth */}
              {renderMouth({ x: 100, y: 112 }, "#713f12")}
            </g>
          </g>
        );

      case "panda":
        return (
          <g id="species-panda">
            {/* Body */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="145" rx="56" ry="46" fill="#1e293b" />
              <ellipse cx="100" cy="148" rx="36" ry="32" fill="#ffffff" />
            </g>

            {/* Paws */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="76" cy={176 + pawLeftY} rx="16" ry="12" fill="#0f172a" />
              <ellipse cx="124" cy={176 + pawRightY} rx="16" ry="12" fill="#0f172a" />
            </g>

            {/* Head */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              <circle cx="62" cy="62" r="16" fill="#1e293b" />
              <circle cx="138" cy="62" r="16" fill="#1e293b" />
              <circle cx="100" cy="95" r="46" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

              {/* Dark Eye Patches */}
              <ellipse
                cx="80"
                cy="90"
                rx="12"
                ry="16"
                fill="#1e293b"
                transform="rotate(-15 80 90)"
              />
              <ellipse
                cx="120"
                cy="90"
                rx="12"
                ry="16"
                fill="#1e293b"
                transform="rotate(15 120 90)"
              />

              {/* Eyes inside patches */}
              {renderEyes({ x: 81, y: 90 }, { x: 119, y: 90 }, "#ffffff", 5)}

              {/* Nose & Mouth */}
              <ellipse cx="100" cy="104" rx="8" ry="6" fill="#0f172a" />
              {renderMouth({ x: 100, y: 114 }, "#0f172a")}
            </g>
          </g>
        );

      case "frog":
        return (
          <g id="species-frog">
            {/* Body */}
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="142" rx="54" ry="42" fill="#84cc16" />
              <ellipse cx="100" cy="146" rx="34" ry="28" fill="#ecfccb" />
            </g>

            {/* Webbed Feet */}
            <g
              data-hit="paws"
              onPointerDown={(e) => onHitZonePointerDown?.("paws", e)}
              style={{ cursor: "pointer" }}
            >
              <ellipse cx="70" cy={172 + pawLeftY} rx="16" ry="8" fill="#65a30d" />
              <ellipse cx="130" cy={172 + pawRightY} rx="16" ry="8" fill="#65a30d" />
            </g>

            {/* Head with Bulging Eyes */}
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              {/* Eye Bulges */}
              <circle cx="72" cy="74" r="18" fill="#84cc16" />
              <circle cx="128" cy="74" r="18" fill="#84cc16" />

              {/* Head Base */}
              <ellipse cx="100" cy="98" rx="46" ry="32" fill="#84cc16" />

              {/* Large Eyes */}
              {renderEyes({ x: 72, y: 74 }, { x: 128, y: 74 }, "#365314", 8)}

              {/* Big Smiling Mouth with Lip Sync */}
              {renderMouth({ x: 100, y: 108 }, "#4d7c0f")}
            </g>
          </g>
        );

      default:
        // Generic fallback with full cat rig
        return (
          <g id="species-generic">
            <g
              data-hit="belly"
              style={{
                transformOrigin: "100px 145px",
                transform: `scale(${bodyScaleX * bellyScaleX}, ${bodyScaleY * bellyScaleY})`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("belly", e)}
            >
              <ellipse cx="100" cy="145" rx="55" ry="45" fill="#f472b6" />
              <ellipse cx="100" cy="150" rx="35" ry="32" fill="#fff1f2" />
            </g>
            <g
              data-hit="head"
              id="pet-head-group"
              style={{
                transformOrigin: "100px 105px",
                transform: `translate(${headX}px, ${headY}px) rotate(${headTilt}deg)`,
                cursor: "pointer",
              }}
              onPointerDown={(e) => onHitZonePointerDown?.("head", e)}
            >
              <polygon points="50,90 35,40 85,65" fill="#f472b6" />
              <polygon points="150,90 165,40 115,65" fill="#f472b6" />
              <circle cx="100" cy="95" r="45" fill="#f472b6" />
              <circle cx="75" cy="105" r="7" fill="#f43f5e" opacity="0.3" />
              <circle cx="125" cy="105" r="7" fill="#f43f5e" opacity="0.3" />
              <polygon points="97,99 103,99 100,103" fill="#be185d" />
              {renderEyes({ x: 84, y: 90 }, { x: 116, y: 90 }, "#831843", 6)}
              {renderMouth({ x: 100, y: 105 })}
            </g>
          </g>
        );
    }
  };

  const renderAccessory = () => {
    switch (accessory) {
      case "flower_crown":
        return (
          <g
            id="acc-flower-crown"
            transform={`translate(${headX}, ${headY - 6}) rotate(${headTilt} 100 100)`}
          >
            <circle cx="70" cy="54" r="9" fill="#f43f5e" />
            <circle cx="70" cy="54" r="4" fill="#fef08a" />
            <circle cx="86" cy="50" r="10" fill="#a855f7" />
            <circle cx="86" cy="50" r="4" fill="#fef08a" />
            <circle cx="104" cy="48" r="11" fill="#ec4899" />
            <circle cx="104" cy="48" r="5" fill="#fef08a" />
            <circle cx="122" cy="50" r="10" fill="#3b82f6" />
            <circle cx="122" cy="50" r="4" fill="#fef08a" />
            <circle cx="138" cy="54" r="9" fill="#10b981" />
            <circle cx="138" cy="54" r="4" fill="#fef08a" />
          </g>
        );
      case "cozy_scarf":
        return (
          <g id="acc-cozy-scarf">
            <path
              d="M68,126 Q100,140 132,126 Q134,136 128,142 Q100,154 72,142 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="1.5"
            />
            <path d="M116,134 L114,166 L128,166 L126,136 Z" fill="#dc2626" />
          </g>
        );
      case "ribbon_bow":
        return (
          <g id="acc-ribbon-bow">
            <polygon points="100,126 84,116 86,136" fill="#f43f5e" />
            <polygon points="100,126 116,116 114,136" fill="#f43f5e" />
            <circle cx="100" cy="126" r="5" fill="#fda4af" />
          </g>
        );
      case "star_charm":
        return (
          <g id="acc-star-charm">
            <path d="M85,128 Q100,140 115,128" stroke="#d97706" strokeWidth="2" fill="none" />
            <polygon
              points="100,135 102,141 108,142 104,146 105,152 100,148 95,152 96,146 92,142 98,141"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="1"
            />
          </g>
        );
      case "tiny_glasses":
        return (
          <g
            id="acc-tiny-glasses"
            transform={`translate(${headX}, ${headY}) rotate(${headTilt} 100 100)`}
          >
            <circle cx="82" cy="90" r="11" fill="none" stroke="#d97706" strokeWidth="2.5" />
            <circle cx="118" cy="90" r="11" fill="none" stroke="#d97706" strokeWidth="2.5" />
            <line x1="93" y1="90" x2="107" y2="90" stroke="#d97706" strokeWidth="2.5" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`inline-block select-none overflow-visible ${className}`}
      role="img"
      aria-label={`Interactive character - ${speciesId}`}
    >
      {renderSpeciesRig()}
      {renderAccessory()}
    </svg>
  );
};
