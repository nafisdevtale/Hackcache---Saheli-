import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom Button Primitive
 * Accessible touch targets (min 44px for md/lg), keyboard focus, tactile press
 */
export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const variantStyles =
    {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] shadow-bloom-subtle border border-primary/20",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/85 active:scale-[0.98] border border-border/60",
      accent:
        "bg-accent text-accent-foreground hover:bg-accent/85 active:scale-[0.98] border border-accent-strong/20",
      outline:
        "border border-border bg-card text-foreground hover:bg-muted/60 active:scale-[0.98] shadow-2xs",
      ghost: "text-foreground hover:bg-muted/60 active:scale-[0.98] border border-transparent",
      danger:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-bloom-subtle border border-destructive/20",
    }[variant] || "";

  const sizeStyles =
    {
      sm: "min-h-[38px] px-3.5 py-1.5 text-xs rounded-xl gap-1.5",
      md: "min-h-[46px] px-5 py-2.5 text-sm rounded-2xl gap-2",
      lg: "min-h-[52px] px-6 py-3 text-base rounded-2xl gap-2.5",
      icon: "min-h-[44px] min-w-[44px] p-2.5 rounded-2xl justify-center",
    }[size] || "";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cx(
        "inline-flex items-center justify-center font-bold tracking-normal transition-all tactile-press cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-45 disabled:pointer-events-none disabled:cursor-not-allowed",
        variantStyles,
        sizeStyles,
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children && <span className="leading-tight">{children}</span>}
      {!isLoading && RightIcon && (
        <RightIcon className="h-4 w-4 shrink-0 rtl-mirror" aria-hidden="true" />
      )}
    </button>
  );
});
