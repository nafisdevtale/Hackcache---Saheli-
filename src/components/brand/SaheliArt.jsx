import React from "react";

/**
 * Saheli 5.0 Original Brand Artwork System
 * "The Living Rhythm" — Cohesive lightweight SVG illustrations.
 *
 * Palettes used:
 * Deep Plum (#352640), Saheli Violet (#7555A5), Soft Orchid (#B99ACA),
 * Warm Coral (#D77C86), Peach (#F3B69D), Sage Green (#9BB8A5).
 */

// 1. Saheli Brand Mark
export function SaheliBrandMark({ className = "h-8 w-8", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id="saheliGrad"
          x1="20"
          y1="20"
          x2="80"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7555A5" />
          <stop offset="60%" stopColor="#D77C86" />
          <stop offset="100%" stopColor="#F3B69D" />
        </linearGradient>
      </defs>
      {/* Outer subtle halo */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="3 4"
        opacity="0.25"
      />
      {/* Dual organic blooming petals / rhythm droplet */}
      <path
        d="M50 14 C62 30 78 46 78 64 C78 78 65 86 50 86 C35 86 22 78 22 64 C22 46 38 30 50 14 Z"
        fill="url(#saheliGrad)"
      />
      {/* Internal reflective rhythm curve */}
      <path
        d="M50 26 C57 37 66 49 66 61 C66 70 59 75 50 75"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Golden/peach core seed */}
      <circle cx="50" cy="62" r="5" fill="#FFF4ED" />
    </svg>
  );
}

// 2. Welcome Illustration
export function WelcomeArt({ className = "w-full max-w-sm h-auto", ...props }) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <radialGradient id="welcomeAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F3B69D" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#B99ACA" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FBF7F3" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="welcomeCurve"
          x1="0"
          y1="0"
          x2="320"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7555A5" />
          <stop offset="50%" stopColor="#D77C86" />
          <stop offset="100%" stopColor="#9BB8A5" />
        </linearGradient>
      </defs>
      {/* Ambient background aura */}
      <circle cx="160" cy="110" r="95" fill="url(#welcomeAura)" />
      {/* Orbiting dashed celestial rhythm track */}
      <circle
        cx="160"
        cy="110"
        r="75"
        stroke="#7555A5"
        strokeWidth="2"
        strokeDasharray="4 6"
        opacity="0.3"
      />
      <circle
        cx="160"
        cy="110"
        r="50"
        stroke="#D77C86"
        strokeWidth="1.5"
        strokeDasharray="2 5"
        opacity="0.4"
      />
      {/* Gentle crescent moon curve */}
      <path
        d="M130 60 C155 75 160 115 140 145 C158 135 168 110 162 85 C158 70 146 62 130 60 Z"
        fill="#7555A5"
        opacity="0.85"
      />
      {/* Golden solar warmth seed */}
      <circle cx="190" cy="85" r="9" fill="#F3B69D" />
      <circle
        cx="190"
        cy="85"
        r="14"
        stroke="#F3B69D"
        strokeWidth="1.5"
        strokeDasharray="2 3"
        opacity="0.7"
      />
      {/* Flowing lotus rhythm leaf base */}
      <path
        d="M110 150 C135 130 185 130 210 150 C185 170 135 170 110 150 Z"
        fill="#9BB8A5"
        opacity="0.75"
      />
      {/* Centerpiece droplet */}
      <path
        d="M160 90 C170 105 180 120 180 135 C180 146 171 154 160 154 C149 154 140 146 140 135 C140 120 150 105 160 90 Z"
        fill="url(#welcomeCurve)"
      />
      <circle cx="160" cy="136" r="4" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

// 3. Rhythm Background Motif
export function RhythmMotif({ className = "w-full h-full", ...props }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle
        cx="200"
        cy="200"
        r="170"
        stroke="#7555A5"
        strokeWidth="1.5"
        strokeDasharray="3 7"
        opacity="0.15"
      />
      <circle
        cx="200"
        cy="200"
        r="130"
        stroke="#D77C86"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.2"
      />
      <circle
        cx="200"
        cy="200"
        r="90"
        stroke="#9BB8A5"
        strokeWidth="1.5"
        strokeDasharray="2 5"
        opacity="0.15"
      />
      <circle cx="200" cy="30" r="6" fill="#D77C86" opacity="0.4" />
      <circle cx="340" cy="200" r="5" fill="#7555A5" opacity="0.4" />
      <circle cx="200" cy="370" r="5" fill="#9BB8A5" opacity="0.4" />
      <circle cx="60" cy="200" r="6" fill="#F3B69D" opacity="0.4" />
    </svg>
  );
}

// 4. Calendar Empty State Artwork
export function CalendarEmptyArt({ className = "w-32 h-32", ...props }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect
        x="20"
        y="24"
        width="80"
        height="76"
        rx="16"
        fill="currentColor"
        fillOpacity="0.04"
        stroke="#7555A5"
        strokeWidth="2.5"
      />
      <path d="M20 44 H100" stroke="#7555A5" strokeWidth="2" opacity="0.5" />
      {/* Calendar pegs */}
      <rect x="36" y="16" width="6" height="14" rx="3" fill="#7555A5" />
      <rect x="78" y="16" width="6" height="14" rx="3" fill="#7555A5" />
      {/* Central petal marker */}
      <circle
        cx="60"
        cy="68"
        r="14"
        fill="#D77C86"
        fillOpacity="0.2"
        stroke="#D77C86"
        strokeWidth="2"
        strokeDasharray="2 3"
      />
      <circle cx="60" cy="68" r="4" fill="#D77C86" />
    </svg>
  );
}

// 5. Daily Journal Motif
export function DailyJournalMotif({ className = "w-12 h-12", ...props }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect
        x="18"
        y="14"
        width="46"
        height="54"
        rx="8"
        fill="#FBF7F3"
        stroke="#7555A5"
        strokeWidth="2.5"
      />
      {/* Spine loops */}
      <circle cx="18" cy="24" r="3" fill="#D77C86" />
      <circle cx="18" cy="38" r="3" fill="#D77C86" />
      <circle cx="18" cy="52" r="3" fill="#D77C86" />
      {/* Lines */}
      <path d="M28 26 H54" stroke="#352640" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M28 36 H48" stroke="#352640" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M28 46 H52" stroke="#352640" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Blooming sprout bookmark */}
      <path d="M52 10 C52 10 58 14 56 22 C52 20 52 10 52 10 Z" fill="#9BB8A5" />
    </svg>
  );
}

// 6. Education Topic Art (Cohesive 6 categories)
export function EducationTopicArt({ category, className = "h-14 w-14", ...props }) {
  const strokeColor = "#7555A5";
  const coralColor = "#D77C86";
  const sageColor = "#9BB8A5";
  const peachColor = "#F3B69D";

  switch (category) {
    case "biology":
      return (
        <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...props}>
          <circle
            cx="30"
            cy="30"
            r="22"
            stroke={strokeColor}
            strokeWidth="3"
            strokeDasharray="5 3"
          />
          <path
            d="M30 16 C34 22 38 27 38 32 C38 36 34 39 30 39 C26 39 22 36 22 32 C22 27 26 22 30 16 Z"
            fill={coralColor}
          />
          <circle cx="30" cy="44" r="3" fill={sageColor} />
        </svg>
      );
    case "symptoms":
      return (
        <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...props}>
          <rect
            x="14"
            y="16"
            width="32"
            height="30"
            rx="8"
            fill={peachColor}
            fillOpacity="0.3"
            stroke={coralColor}
            strokeWidth="2.5"
          />
          <path
            d="M24 10 Q30 14 30 16 M36 10 Q30 14 30 16"
            stroke={coralColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M24 31 H36 M30 25 V37"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "conditions":
      return (
        <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...props}>
          <circle
            cx="20"
            cy="32"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={sageColor}
            fillOpacity="0.25"
          />
          <circle
            cx="40"
            cy="32"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={sageColor}
            fillOpacity="0.25"
          />
          <path d="M28 26 Q30 14 32 26" stroke={coralColor} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "hygiene":
      return (
        <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...props}>
          <rect
            x="12"
            y="22"
            width="36"
            height="18"
            rx="9"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={peachColor}
            fillOpacity="0.3"
          />
          <path
            d="M22 22 C22 17 26 14 30 14 C34 14 38 17 38 22"
            stroke={sageColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M22 40 C22 45 26 48 30 48 C34 48 38 45 38 40"
            stroke={sageColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "lifeStages":
      return (
        <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...props}>
          <circle
            cx="30"
            cy="30"
            r="22"
            stroke={strokeColor}
            strokeWidth="2"
            strokeDasharray="3 4"
            opacity="0.5"
          />
          <path
            d="M30 14 C38 14 44 20 44 28 C44 38 30 46 30 46 C30 46 16 38 16 28 C16 20 22 14 30 14 Z"
            fill={coralColor}
            opacity="0.8"
          />
          <circle cx="30" cy="27" r="4" fill="#FFFFFF" />
        </svg>
      );
    case "guidance":
    default:
      return (
        <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true" {...props}>
          <rect
            x="16"
            y="12"
            width="28"
            height="36"
            rx="6"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={sageColor}
            fillOpacity="0.2"
          />
          <path
            d="M23 28 L28 33 L38 22"
            stroke={coralColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

// 7. Ask Saheli Assistant Identity Art
export function AskAssistantArt({ className = "w-16 h-16", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="#7555A5"
        fillOpacity="0.1"
        stroke="#7555A5"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
      {/* Central caring sparkle & leaf aura */}
      <path
        d="M50 20 C54 36 64 46 80 50 C64 54 54 64 50 80 C46 64 36 54 20 50 C36 46 46 36 50 20 Z"
        fill="#7555A5"
      />
      <circle cx="50" cy="50" r="7" fill="#F3B69D" />
      {/* Supporting healing dots */}
      <circle cx="68" cy="30" r="3.5" fill="#D77C86" />
      <circle cx="32" cy="70" r="3.5" fill="#9BB8A5" />
    </svg>
  );
}

// 8. Privacy & Encryption Art
export function PrivacyArt({ className = "w-24 h-24", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Shield silhouette */}
      <path
        d="M50 16 L76 26 C76 56 62 76 50 84 C38 76 24 56 24 26 L50 16 Z"
        fill="#9BB8A5"
        fillOpacity="0.25"
        stroke="#7555A5"
        strokeWidth="2.5"
      />
      {/* Lock mechanism */}
      <rect x="38" y="44" width="24" height="20" rx="5" fill="#7555A5" />
      <path
        d="M43 44 V36 C43 32 46 29 50 29 C54 29 57 32 57 36 V44"
        stroke="#7555A5"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="53" r="2.5" fill="#FFFFFF" />
      {/* Botanical vine */}
      <path d="M26 62 Q36 68 44 60" stroke="#9BB8A5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="62" r="2" fill="#9BB8A5" />
    </svg>
  );
}

// 9. Insight Empty State Art (Concentric Timeline Rings)
export function InsightEmptyArt({ className = "w-36 h-36", ...props }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle
        cx="70"
        cy="70"
        r="60"
        stroke="#7555A5"
        strokeWidth="2"
        strokeDasharray="4 6"
        opacity="0.3"
      />
      <circle
        cx="70"
        cy="70"
        r="44"
        stroke="#D77C86"
        strokeWidth="2"
        strokeDasharray="3 5"
        opacity="0.4"
      />
      <circle
        cx="70"
        cy="70"
        r="28"
        stroke="#9BB8A5"
        strokeWidth="2"
        strokeDasharray="2 4"
        opacity="0.4"
      />
      <circle cx="70" cy="10" r="5" fill="#D77C86" />
      <circle cx="114" cy="70" r="4" fill="#7555A5" />
      <circle
        cx="70"
        cy="70"
        r="10"
        fill="#F3B69D"
        fillOpacity="0.5"
        stroke="#7555A5"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// 10. Doctor Visit Preparation Artwork
export function DoctorPrepArt({ className = "w-28 h-28", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect
        x="24"
        y="20"
        width="52"
        height="64"
        rx="10"
        fill="#FBF7F3"
        stroke="#7555A5"
        strokeWidth="2.5"
      />
      <rect x="38" y="14" width="24" height="10" rx="3" fill="#7555A5" />
      {/* Heart rate / rhythm wave */}
      <path
        d="M34 46 H42 L46 38 L52 56 L56 46 H66"
        stroke="#D77C86"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checklist items */}
      <circle cx="36" cy="62" r="3" fill="#9BB8A5" />
      <path d="M44 62 H64" stroke="#352640" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <circle cx="36" cy="72" r="3" fill="#9BB8A5" />
      <path d="M44 72 H58" stroke="#352640" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
