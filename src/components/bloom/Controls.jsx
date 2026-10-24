import { forwardRef } from "react";
import { ChevronRight, Sparkles, Bot, Stethoscope, ShoppingBag, Film } from "lucide-react";
import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom Segmented Control Primitive
 * Ergonomic capsule switch with accessible radio/tab semantics
 */
export function SegmentedControl({
  options = [],
  value,
  onChange,
  className,
  size = "md",
  ariaLabel = "Options",
}) {
  const sizeCls =
    {
      sm: "p-0.5 text-xs min-h-[36px]",
      md: "p-1 text-xs sm:text-sm min-h-[44px]",
      lg: "p-1.5 text-sm min-h-[50px]",
    }[size] || "p-1 min-h-[44px]";

  const itemCls =
    {
      sm: "px-3 py-1 rounded-xl font-semibold",
      md: "px-4 py-1.5 rounded-xl font-bold",
      lg: "px-5 py-2 rounded-2xl font-bold",
    }[size] || "px-4 py-1.5 rounded-xl font-bold";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(
        "inline-flex items-center gap-1 rounded-2xl border border-border/80 bg-muted/60 shadow-inner select-none",
        sizeCls,
        className,
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={cx(
              "flex flex-1 items-center justify-center gap-2 transition-all cursor-pointer select-none tactile-press",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              itemCls,
              isSelected
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40",
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="whitespace-nowrap">{opt.label}</span>
            {opt.badge != null && (
              <span
                className={cx(
                  "ms-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Saheli Bloom Stat Card Primitive
 * Compact summary metric card with label, value, and optional badge/trend
 */
export function StatCard({
  label,
  value,
  subvalue,
  icon: Icon,
  badge,
  badgeTone = "default",
  trend,
  className,
  onClick,
}) {
  const isClickable = typeof onClick === "function";
  const badgeColors =
    {
      default: "bg-muted text-muted-foreground border-border",
      primary: "bg-primary/10 text-primary border-primary/20",
      accent: "bg-period/15 text-period border-period/30",
      secondary: "bg-secondary text-secondary-foreground border-secondary-strong/30",
      urgent: "bg-destructive/10 text-destructive border-destructive/20",
    }[badgeTone] || "bg-muted text-muted-foreground border-border";

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cx(
        "rounded-2xl border border-border/80 bg-card p-4 shadow-bloom-card transition-all",
        isClickable &&
          "cursor-pointer hover:border-primary/40 hover:shadow-soft active:scale-[0.99] tactile-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
          {label}
        </span>
        {Icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none">
          {value}
        </p>
        {subvalue && <span className="text-xs text-muted-foreground">{subvalue}</span>}
      </div>

      {(badge || trend) && (
        <div className="mt-2.5 flex items-center gap-2">
          {badge && (
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                badgeColors,
              )}
            >
              {badge}
            </span>
          )}
          {trend && <span className="text-[11px] text-muted-foreground font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Saheli Bloom Action Card Primitive
 * Leading icon, structured title/subtitle, trailing badge or action chevron
 */
export function ActionCard({
  title,
  subtitle,
  icon: Icon,
  iconTone = "primary",
  badge,
  actionLabel,
  href,
  onClick,
  className,
  children,
}) {
  const iconTones =
    {
      primary: "bg-primary/15 text-primary border-primary/20",
      period: "bg-period/15 text-period border-period/30",
      secondary: "bg-secondary text-secondary-strong border-secondary-strong/20",
      accent: "bg-accent text-accent-strong border-accent-strong/20",
      muted: "bg-muted text-muted-foreground border-border",
    }[iconTone] || "bg-primary/15 text-primary border-primary/20";

  return (
    <div
      onClick={onClick}
      className={cx(
        "group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-bloom-card transition-all",
        onClick &&
          "cursor-pointer hover:border-primary/40 hover:shadow-soft active:scale-[0.99] tactile-press",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div
              className={cx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-2xs transition-transform group-hover:scale-105",
                iconTones,
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="space-y-0.5">
            <h3 className="font-display text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {badge && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
            {badge}
          </span>
        )}
      </div>

      {children && <div className="mt-3.5">{children}</div>}

      {actionLabel && (
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs font-bold text-primary">
          <span>{actionLabel}</span>
          <ChevronRight className="h-4 w-4 rtl-mirror transition-transform group-hover:translate-x-1" />
        </div>
      )}
    </div>
  );
}

/**
 * Saheli Bloom AI Specialist Badge
 * Standardized pill badge for Eeve, FLASH, INSTINCT, Diva
 */
export function AiBadge({ agent = "diva", status, className }) {
  const meta = {
    diva: {
      label: "DIVA Orchestrator",
      icon: Bot,
      color: "bg-primary/15 text-primary border-primary/25",
    },
    eeve: {
      label: "EEVE Health",
      icon: Stethoscope,
      color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    },
    flash: {
      label: "FLASH Essentials",
      icon: ShoppingBag,
      color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    },
    instinct: {
      label: "INSTINCT Entertainment",
      icon: Film,
      color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/25",
    },
  }[agent] || {
    label: "Saheli AI",
    icon: Sparkles,
    color: "bg-primary/15 text-primary border-primary/25",
  };

  const Icon = meta.icon;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide",
        meta.color,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{meta.label}</span>
      {status && (
        <span className="ms-1 flex h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-pulse" />
      )}
    </span>
  );
}
