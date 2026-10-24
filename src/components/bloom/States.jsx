import { AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/bloom/Button.jsx";
import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom EmptyState Primitive
 */
export function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border/80 bg-muted/20",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      {title && (
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground mb-1.5">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
          {description}
        </p>
      )}
      {children}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Saheli Bloom ErrorState Primitive
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className,
}) {
  return (
    <div
      role="alert"
      className={cx(
        "p-6 rounded-2xl border border-destructive/25 bg-destructive/10 text-foreground space-y-3",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 text-destructive font-bold text-sm">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{title}</span>
      </div>
      {message && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{message}</p>
      )}
      {onRetry && (
        <div className="pt-2">
          <Button variant="danger" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Saheli Bloom LoadingSkeleton Primitive
 */
export function LoadingSkeleton({ className, count = 1 }) {
  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cx("animate-pulse rounded-2xl bg-muted/70", className || "h-12 w-full")}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
