import React, { type ReactNode } from "react";

export type NovaBadgeTone =
  "primary" | "period" | "success" | "urgent" | "muted" | "secondary" | "default" | "neutral";

export interface NovaBadgeProps {
  children: ReactNode;
  tone?: NovaBadgeTone;
  variant?: NovaBadgeTone;
  size?: "sm" | "md";
  className?: string;
  icon?: React.ComponentType<{ className?: string }> | ReactNode;
}

const TONE_STYLES: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  period: "bg-period/10 text-period border-period/25",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  urgent: "bg-urgent/10 text-urgent border-urgent/25 font-bold",
  muted: "bg-muted text-muted-foreground border-border/80",
  neutral: "bg-muted text-muted-foreground border-border/80",
  secondary: "bg-secondary text-secondary-foreground border-secondary-strong/20",
  default: "bg-card text-foreground border-border/80",
};

export const NovaBadge: React.FC<NovaBadgeProps> = ({
  children,
  tone,
  variant,
  size = "sm",
  className = "",
  icon,
}) => {
  const chosenTone = variant || tone || "primary";
  const toneStyle = TONE_STYLES[chosenTone] || TONE_STYLES.primary;
  const sizeStyle = size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="h-3 w-3 shrink-0" />;
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border shadow-2xs select-none ${toneStyle} ${sizeStyle} ${className}`.trim()}
    >
      {renderIcon()}
      <span>{children}</span>
    </span>
  );
};
