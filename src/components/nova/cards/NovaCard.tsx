import React, { type HTMLAttributes, type ReactNode } from "react";

export interface NovaCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "standard" | "elevated" | "subtle" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const PADDING_STYLES = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

export const NovaCard: React.FC<NovaCardProps> = ({
  children,
  variant = "standard",
  padding = "md",
  className = "",
  onClick,
  ...props
}) => {
  const isInteractive = variant === "interactive" || Boolean(onClick);
  const pad = PADDING_STYLES[padding];

  let variantStyle = "bg-card text-card-foreground border border-border rounded-2xl shadow-2xs";

  if (variant === "elevated") {
    variantStyle = "bg-card text-card-foreground border border-border/80 rounded-3xl shadow-md";
  } else if (variant === "subtle") {
    variantStyle = "bg-muted/40 text-foreground border border-border/60 rounded-2xl";
  } else if (isInteractive) {
    variantStyle =
      "bg-card text-card-foreground border border-border hover:border-primary/40 rounded-2xl shadow-2xs hover:shadow-sm active:scale-[0.985] cursor-pointer transition-all";
  }

  return (
    <div
      className={`${variantStyle} ${pad} ${className}`.trim()}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
};
