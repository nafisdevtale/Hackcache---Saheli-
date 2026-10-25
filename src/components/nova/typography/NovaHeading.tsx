import React, { type ElementType, type ReactNode } from "react";

export type NovaHeadingLevel = "display" | "h1" | "h2" | "h3" | "h4" | 1 | 2 | 3 | 4;

export interface NovaHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: NovaHeadingLevel;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  discreet?: boolean;
}

const LEVEL_STYLES: Record<string, string> = {
  display:
    "font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.25] text-foreground",
  h1: "font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.3] text-foreground",
  h2: "font-display text-xl sm:text-2xl font-bold tracking-tight leading-[1.35] text-foreground",
  h3: "text-base sm:text-lg font-semibold tracking-tight leading-[1.4] text-foreground",
  h4: "text-sm sm:text-base font-semibold tracking-tight leading-[1.4] text-foreground",
};

const DEFAULT_TAG: Record<string, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "1": "h1",
  "2": "h2",
  "3": "h3",
  "4": "h4",
};

export const NovaHeading: React.FC<NovaHeadingProps> = ({
  level = "h2",
  as,
  children,
  className = "",
  discreet = false,
  ...props
}) => {
  const levelKey = String(level).startsWith("h")
    ? String(level)
    : level === "display"
      ? "display"
      : `h${level}`;
  const Component = as || DEFAULT_TAG[String(level)] || "h2";
  const levelStyle = LEVEL_STYLES[levelKey] || LEVEL_STYLES.h2;

  return (
    <Component
      className={`${levelStyle} ${discreet ? "tracking-normal" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};
