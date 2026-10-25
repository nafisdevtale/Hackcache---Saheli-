import React, { type ElementType, type ReactNode } from "react";

export type NovaTextVariant = "body" | "caption" | "tiny";
export type NovaTextColor = "default" | "muted" | "primary" | "period" | "urgent" | "success";

export interface NovaTextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: NovaTextVariant;
  color?: NovaTextColor;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const VARIANT_STYLES: Record<NovaTextVariant, string> = {
  body: "text-sm sm:text-base leading-relaxed",
  caption: "text-xs sm:text-sm leading-relaxed",
  tiny: "text-[11px] sm:text-xs leading-normal",
};

const COLOR_STYLES: Record<NovaTextColor, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary font-semibold",
  period: "text-period font-semibold",
  urgent: "text-urgent font-semibold",
  success: "text-emerald-600 dark:text-emerald-400 font-semibold",
};

const WEIGHT_STYLES = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const NovaText: React.FC<NovaTextProps> = ({
  variant = "body",
  color = "default",
  as: Component = "p",
  children,
  className = "",
  weight,
  ...props
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const colorStyle = COLOR_STYLES[color];
  const weightStyle = weight ? WEIGHT_STYLES[weight] : "";

  return (
    <Component
      className={`${variantStyle} ${colorStyle} ${weightStyle} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};
