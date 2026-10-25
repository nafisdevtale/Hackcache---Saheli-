import React, { type ReactNode } from "react";
import { Check } from "lucide-react";

export interface NovaChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "period" | "secondary";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  badge?: ReactNode;
}

export const NovaChip: React.FC<NovaChipProps> = ({
  selected = false,
  onClick,
  children,
  icon: Icon,
  tone = "primary",
  size = "md",
  className = "",
  disabled = false,
  badge,
}) => {
  const sizeClass =
    size === "sm"
      ? "min-h-[36px] px-3 py-1.5 text-xs rounded-xl gap-1.5"
      : "min-h-[42px] px-3.5 py-2 text-xs sm:text-sm rounded-2xl gap-2";

  let selectedStyle =
    "bg-card text-muted-foreground border-border/80 hover:bg-muted/70 hover:text-foreground";

  if (selected) {
    if (tone === "period") {
      selectedStyle = "bg-period/15 text-period border-period/40 font-bold shadow-2xs";
    } else if (tone === "secondary") {
      selectedStyle =
        "bg-secondary text-secondary-foreground border-secondary-strong/30 font-bold shadow-2xs";
    } else {
      selectedStyle = "bg-primary/15 text-primary border-primary/40 font-bold shadow-2xs";
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium border transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${sizeClass} ${selectedStyle} ${className}`.trim()}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      ) : null}
      <span className="leading-snug">{children}</span>
      {badge && <span className="ml-1">{badge}</span>}
    </button>
  );
};
