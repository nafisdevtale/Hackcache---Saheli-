import React, { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface NovaActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
  iconBg?: string;
  iconColor?: string;
}

export const NovaActionCard: React.FC<NovaActionCardProps> = ({
  icon: Icon,
  title,
  description,
  badge,
  onClick,
  className = "",
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 hover:shadow-sm active:scale-[0.985] cursor-pointer transition-all ${className}`.trim()}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{title}</h3>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </div>
  );
};
