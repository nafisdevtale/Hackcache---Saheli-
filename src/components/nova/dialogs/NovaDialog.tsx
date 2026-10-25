import React, { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useApp } from "@/App.jsx";

export interface NovaDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
  testId?: string;
}

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export const NovaDialog: React.FC<NovaDialogProps> = ({
  isOpen,
  open,
  onClose,
  title,
  subtitle,
  description,
  children,
  footer,
  maxWidth = "md",
  className = "",
  testId,
}) => {
  let t = (k: string, fallback?: string) => fallback || k;
  try {
    const app = useApp();
    if (app?.t) t = app.t;
  } catch (_err) {
    // Standalone render without AppProvider
  }
  const visible = Boolean(isOpen ?? open);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  const maxWidthClass = MAX_WIDTHS[maxWidth];
  const subContent = subtitle || description;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid={testId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="fixed inset-0" aria-hidden="true" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxWidthClass} rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 ${className}`.trim()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
          <div>
            {title && <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>}
            {subContent && <p className="text-xs text-muted-foreground mt-0.5">{subContent}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
            aria-label={t("aria.close") || "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">{children}</div>

        {footer && <div className="pt-3 border-t border-border/40">{footer}</div>}
      </div>
    </div>
  );
};
