import React from "react";
import { Bot, HeartPulse, ShoppingBag, Film } from "lucide-react";

export type NovaAgentId = "diva" | "eeve" | "flash" | "instinct";

export interface NovaAgentBadgeProps {
  agent: NovaAgentId;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  status?: "idle" | "thinking" | "active";
  className?: string;
}

const AGENT_CONFIG: Record<
  NovaAgentId,
  {
    name: string;
    role: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    border: string;
    text: string;
    ring: string;
  }
> = {
  diva: {
    name: "DIVA",
    role: "Orchestrator",
    icon: Bot,
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
    ring: "ring-primary/20",
  },
  eeve: {
    name: "EEVE",
    role: "Health Companion",
    icon: HeartPulse,
    bg: "bg-period/10",
    border: "border-period/30",
    text: "text-period",
    ring: "ring-period/20",
  },
  flash: {
    name: "FLASH",
    role: "Essentials Advisor",
    icon: ShoppingBag,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/20",
  },
  instinct: {
    name: "INSTINCT",
    role: "Entertainment Advisor",
    icon: Film,
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-700 dark:text-indigo-300",
    ring: "ring-indigo-500/20",
  },
};

export const NovaAgentBadge: React.FC<NovaAgentBadgeProps> = ({
  agent,
  size = "md",
  showLabel = true,
  status = "idle",
  className = "",
}) => {
  const config = AGENT_CONFIG[agent] || AGENT_CONFIG.diva;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded-lg",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-xl",
    lg: "px-3.5 py-1.5 text-sm gap-2 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight border shadow-2xs select-none ${config.bg} ${config.border} ${config.text} ${sizeClasses} ${className}`.trim()}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      {showLabel && <span>{config.name}</span>}
      {status === "thinking" && (
        <span className="flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
    </span>
  );
};
