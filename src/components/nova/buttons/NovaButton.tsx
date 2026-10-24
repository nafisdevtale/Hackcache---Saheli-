import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

export type NovaButtonVariant =
  "primary" | "secondary" | "quiet" | "period" | "urgent" | "icon" | "outline" | "ghost" | "danger";
export type NovaButtonSize = "sm" | "md" | "lg";

export interface NovaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NovaButtonVariant;
  size?: NovaButtonSize;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<NovaButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent font-bold",
  secondary: "bg-card hover:bg-muted text-foreground border border-border shadow-2xs font-semibold",
  outline:
    "bg-card hover:bg-muted text-foreground border border-border/80 shadow-2xs font-semibold",
  quiet:
    "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent font-medium",
  ghost:
    "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent font-medium",
  period:
    "bg-period text-primary-foreground hover:opacity-90 shadow-sm border border-transparent font-bold",
  urgent:
    "bg-urgent text-urgent-foreground hover:bg-urgent/90 shadow-sm border border-transparent font-bold",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent font-bold",
  icon: "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-full p-2.5 shadow-2xs",
};

const SIZE_STYLES: Record<NovaButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 min-h-[36px] rounded-xl gap-1.5",
  md: "text-sm px-4 py-2.5 min-h-[44px] rounded-2xl gap-2",
  lg: "text-base px-6 py-3 min-h-[48px] rounded-2xl gap-2.5",
};

export const NovaButton: React.FC<NovaButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  leftIcon,
  rightIcon,
  ...props
}) => {
  const isIcon = variant === "icon";
  const sizeStyle = isIcon
    ? "min-h-[44px] min-w-[44px] flex items-center justify-center"
    : SIZE_STYLES[size];
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all cursor-pointer select-none tactile-press disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${variantStyle} ${sizeStyle} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};
