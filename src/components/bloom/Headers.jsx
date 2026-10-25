import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom PageHeader Primitive
 * Script-safe fluid headings, category badges and action slots
 */
export function PageHeader({ title, tag, subtitle, children, action, className }) {
  return (
    <header className={cx("mb-6 sm:mb-8 space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0 max-w-3xl">
          {tag && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-primary/10 text-primary border border-primary/20">
              {tag}
            </span>
          )}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-snug">
            {title || children}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}

/**
 * Saheli Bloom SectionHeader Primitive
 */
export function SectionHeader({ title, count, subtitle, action, className }) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border/50",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground leading-normal">
          {title}
        </h2>
        {count !== undefined && (
          <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action && <div className="shrink-0 text-xs">{action}</div>}
      {subtitle && (
        <p className="w-full text-xs text-muted-foreground leading-relaxed -mt-1">{subtitle}</p>
      )}
    </div>
  );
}
