import { forwardRef } from "react";
import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom Card Primitive
 * Responsive surface container with rounded corners and calm elevation
 */
export const Card = forwardRef(function Card(
  { as: Component = "section", variant = "default", padding = "md", className, children, ...props },
  ref,
) {
  const variantStyles =
    {
      default: "bloom-card",
      elevated: "bloom-card-elevated",
      glass: "bloom-glass",
      subtle: "rounded-2xl border border-border/70 bg-muted/40 text-card-foreground",
      interactive:
        "bloom-card hover:border-primary/40 hover:shadow-md active:scale-[0.99] cursor-pointer tactile-press",
    }[variant] || "bloom-card";

  const paddingStyles =
    {
      none: "p-0",
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-6",
      lg: "p-6 sm:p-8",
    }[padding] || "p-4 sm:p-6";

  return (
    <Component ref={ref} className={cx(variantStyles, paddingStyles, className)} {...props}>
      {children}
    </Component>
  );
});
