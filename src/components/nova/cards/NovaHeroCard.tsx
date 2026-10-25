import React, { type ReactNode } from "react";

export interface NovaHeroCardProps {
  children: ReactNode;
  badge?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const NovaHeroCard: React.FC<NovaHeroCardProps> = ({
  children,
  badge,
  title,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-6 sm:p-8 shadow-sm backdrop-blur-xs ${className}`.trim()}
    >
      {/* Decorative ambient subtle background aura */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-period/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6">
        {(badge || title || subtitle || action) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              {badge && <div className="mb-2">{badge}</div>}
              {title && (
                <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {title}
                </div>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};
