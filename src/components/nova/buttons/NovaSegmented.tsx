import React from "react";

export interface NovaSegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface NovaSegmentedProps<T extends string = string> {
  options: NovaSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function NovaSegmented<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: NovaSegmentedProps<T>) {
  const containerSize = size === "sm" ? "p-1 rounded-xl" : "p-1.5 rounded-2xl";
  const buttonSize =
    size === "sm"
      ? "py-1 px-2.5 text-xs rounded-lg min-h-[36px]"
      : "py-1.5 px-3.5 text-xs sm:text-sm rounded-xl min-h-[40px]";

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-muted/60 border border-border/80 backdrop-blur-sm ${containerSize} ${className}`.trim()}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${buttonSize} ${
              isSelected
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
