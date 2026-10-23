import { cx } from "@/components/common/ui.jsx";

export function SaheliLogo({ className, size = 32, discreet = false, animated = false }) {
  if (discreet) {
    return (
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        aria-hidden="true"
        className={cx("shrink-0", className)}
      >
        <rect
          x="6"
          y="4"
          width="28"
          height="32"
          rx="5"
          className="fill-card stroke-border"
          strokeWidth="2"
        />
        <rect x="9" y="8" width="22" height="2" rx="1" className="fill-muted-foreground/40" />
        <rect x="9" y="14" width="16" height="2" rx="1" className="fill-muted-foreground/30" />
        <rect x="9" y="20" width="19" height="2" rx="1" className="fill-muted-foreground/30" />
        <rect x="6" y="4" width="4" height="32" rx="2" className="fill-primary/20" />
        <circle cx="28" cy="28" r="3" className="fill-primary/40" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={cx(
        "shrink-0 transition-transform duration-300",
        animated && "hover:rotate-12",
        className,
      )}
    >
      <defs>
        <linearGradient id="saheliGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="var(--period)" />
          <stop offset="100%" stopColor="var(--accent-strong, var(--primary))" />
        </linearGradient>
        <radialGradient id="saheliAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--period)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--period)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background soft glow */}
      <circle cx="32" cy="32" r="28" fill="url(#saheliAura)" />

      {/* Outer Rhythm Petals (Symbolizing cycle flow and renewal) */}
      <g fill="none" stroke="url(#saheliGradient)" strokeWidth="2.5" strokeLinecap="round">
        {/* Top Petal */}
        <path d="M32 10 C37 18 39 23 32 32 C25 23 27 18 32 10 Z" className="fill-period/15" />
        {/* Bottom Petal */}
        <path d="M32 54 C27 46 25 41 32 32 C39 41 37 46 32 54 Z" className="fill-period/15" />
        {/* Left Petal */}
        <path d="M10 32 C18 27 23 25 32 32 C23 39 18 37 10 32 Z" className="fill-primary/15" />
        {/* Right Petal */}
        <path d="M54 32 C46 37 41 39 32 32 C41 25 46 27 54 32 Z" className="fill-primary/15" />

        {/* Diagonal Soft Nodes */}
        <path
          d="M16 16 C24 20 28 24 32 32 C24 28 20 24 16 16 Z"
          className="fill-accent/20"
          strokeWidth="1.8"
        />
        <path
          d="M48 16 C40 20 36 24 32 32 C40 28 44 24 48 16 Z"
          className="fill-accent/20"
          strokeWidth="1.8"
        />
        <path
          d="M16 48 C24 44 28 40 32 32 C24 36 20 40 16 48 Z"
          className="fill-accent/20"
          strokeWidth="1.8"
        />
        <path
          d="M48 48 C40 44 36 40 32 32 C40 36 44 40 48 48 Z"
          className="fill-accent/20"
          strokeWidth="1.8"
        />
      </g>

      {/* Central Sacred Cycle Droplet */}
      <path
        d="M32 22 C37 28 40 33 40 37 A8 8 0 0 1 24 37 C24 33 27 28 32 22 Z"
        className="fill-period shadow-sm"
      />
      {/* Light Reflection */}
      <circle cx="30" cy="35" r="2" className="fill-white/80" />
    </svg>
  );
}

export function AmbientGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none opacity-60 dark:opacity-35"
    >
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute top-1/4 -right-32 h-80 w-80 rounded-full bg-period/15 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-secondary-strong/15 blur-3xl" />
    </div>
  );
}
