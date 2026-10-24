import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom Badge / Pill Primitive
 * Accessible color + text/icon indicators with high contrast
 */
export function Badge({
  tone = "neutral",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}) {
  const toneStyles =
    {
      neutral: "bg-muted text-muted-foreground border-border",
      primary: "bg-primary/10 text-primary border-primary/25",
      accent: "bg-accent text-accent-foreground border-accent-strong/30",
      success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
      warning: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
      danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
      info: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
    }[tone] || "bg-muted text-muted-foreground border-border";

  const sizeStyles =
    {
      sm: "px-2 py-0.5 text-[10px] gap-1 rounded-md",
      md: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
      pill: "px-3 py-1 text-xs gap-1.5 rounded-full font-bold",
    }[size] || "px-2.5 py-1 text-xs gap-1.5 rounded-lg";

  return (
    <span
      className={cx(
        "inline-flex items-center font-bold tracking-normal border leading-normal select-none",
        toneStyles,
        sizeStyles,
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
