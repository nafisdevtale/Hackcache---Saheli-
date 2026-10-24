import React, { type ReactNode } from "react";
import { NovaHeading } from "./NovaHeading.js";
import { NovaText } from "./NovaText.js";

export interface NovaPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  tag?: ReactNode;
  badge?: ReactNode;
  badgeVariant?: string;
  action?: ReactNode;
  actions?: ReactNode;
  className?: string;
  level?: "display" | "h1" | "h2" | "h3";
}

export const NovaPageHeader: React.FC<NovaPageHeaderProps> = ({
  title,
  subtitle,
  tag,
  badge,
  action,
  actions,
  className = "",
  level = "h1",
}) => {
  const badgeContent = tag || badge;
  const actionContent = action || actions;

  return (
    <header className={`mb-6 sm:mb-8 space-y-2 border-b border-border/60 pb-4 ${className}`.trim()}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1.5 min-w-0 max-w-3xl">
          {badgeContent && (
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {badgeContent}
              </span>
            </div>
          )}
          <NovaHeading level={level}>{title}</NovaHeading>
          {subtitle && (
            <NovaText variant="caption" color="muted">
              {subtitle}
            </NovaText>
          )}
        </div>
        {actionContent && <div className="shrink-0 flex items-center gap-2.5">{actionContent}</div>}
      </div>
    </header>
  );
};

export interface NovaSectionHeaderProps {
  title: ReactNode;
  count?: number | string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const NovaSectionHeader: React.FC<NovaSectionHeaderProps> = ({
  title,
  count,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 pb-2 ${className}`.trim()}>
      <div>
        <div className="flex items-center gap-2">
          <NovaHeading level="h2">{title}</NovaHeading>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border/80">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <NovaText variant="caption" color="muted" className="mt-0.5">
            {subtitle}
          </NovaText>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
