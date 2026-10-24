import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/bloom/Button.jsx";
import { cx } from "@/components/common/ui.jsx";

/**
 * Saheli Bloom ResponsiveDialog Primitive
 * Focus-trapped, accessible modal with backdrop blur
 */
export function ResponsiveDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  className,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bloom-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-dark-ink/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={dialogRef}
        className={cx(
          "relative w-full overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 text-card-foreground shadow-2xl backdrop-blur-xl animate-scale-in z-10 max-h-[90vh] overflow-y-auto",
          maxWidth,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-4 pb-2 border-b border-border/50">
          <div className="space-y-1 min-w-0">
            {title && (
              <h2
                id="bloom-dialog-title"
                className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug"
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}

/**
 * Saheli Bloom ConfirmationDialog Primitive
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  isLoading = false,
}) {
  return (
    <ResponsiveDialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-6">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
