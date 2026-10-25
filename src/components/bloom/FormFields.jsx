import { forwardRef } from "react";
import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom TextField Primitive
 * Touch-friendly (min 44px), clear labels, error alerts and logical text start
 */
export const TextField = forwardRef(function TextField(
  {
    label,
    hint,
    error,
    id,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className,
    disabled,
    ...props
  },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-bold text-xs sm:text-sm text-foreground text-start"
        >
          {label}
        </label>
      )}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed text-start">{hint}</p>}
      <div className="relative flex items-center w-full">
        {LeftIcon && (
          <div className="absolute inset-inline-start-3 pointer-events-none text-muted-foreground">
            <LeftIcon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cx(
            "min-h-[46px] w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm text-foreground transition-all text-start",
            "placeholder:text-muted-foreground/70",
            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:outline-none",
            "disabled:opacity-50 disabled:bg-muted/40 disabled:cursor-not-allowed",
            LeftIcon && "ps-10",
            RightIcon && "pe-10",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            className,
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-inline-end-3 pointer-events-none text-muted-foreground">
            <RightIcon className="h-4 w-4 rtl-mirror" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive text-start">
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Saheli Bloom SelectField Primitive
 */
export const SelectField = forwardRef(function SelectField(
  { label, hint, error, id, options = [], className, children, ...props },
  ref,
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block font-bold text-xs sm:text-sm text-foreground text-start"
        >
          {label}
        </label>
      )}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed text-start">{hint}</p>}
      <select
        ref={ref}
        id={selectId}
        className={cx(
          "min-h-[46px] w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm text-foreground transition-all cursor-pointer text-start",
          "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:outline-none",
          error && "border-destructive",
          className,
        )}
        {...props}
      >
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive text-start">
          {error}
        </p>
      )}
    </div>
  );
});
