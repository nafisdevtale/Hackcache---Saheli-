import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  ShoppingBag,
  Film,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { cx } from "@/components/common/ui.jsx";
import { NovaAgentBadge } from "@/components/nova";

const STORAGE_KEY = "saheli.ai_workspace_order";
export const DEFAULT_SPECIALISTS_ORDER = ["eeve", "flash", "instinct"];

export function getInitialOrder() {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_SPECIALISTS_ORDER;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SPECIALISTS_ORDER;
    const parsed = JSON.parse(saved);
    if (
      Array.isArray(parsed) &&
      DEFAULT_SPECIALISTS_ORDER.every((id) => parsed.includes(id)) &&
      parsed.length === DEFAULT_SPECIALISTS_ORDER.length
    ) {
      return parsed;
    }
  } catch {
    // Ignore JSON errors and fallback
  }
  return DEFAULT_SPECIALISTS_ORDER;
}

export function AiWorkspace({ t, onSelectSpecialist }) {
  const [order, setOrder] = useState(getInitialOrder);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      }
    } catch {
      // localStorage might fail in private/quota limits
    }
  }, [order]);

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
  };

  const handleReset = () => {
    setOrder(DEFAULT_SPECIALISTS_ORDER);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  };

  // Specialist definitions
  const specialistMeta = {
    eeve: {
      id: "eeve",
      name: t("agent.eeve.name") || "Eeve",
      role: t("diva.mode.eeve") || "Health AI Companion",
      desc: t("diva.specialistEeveSub") || "Clinical guidance & symptom screening",
      to: "/ask",
      icon: Stethoscope,
      badgeText: "Active • Clinical Guidance",
      theme: {
        border: "border-primary/30 hover:border-primary/60",
        badgeBg: "bg-primary/10 text-primary border-primary/20",
        iconBg: "bg-primary/10 text-primary",
        buttonCls: "bg-primary text-primary-foreground hover:opacity-95",
      },
    },
    flash: {
      id: "flash",
      name: t("agent.flash.name") || "FLASH",
      role: t("diva.mode.flash") || "Personal Essentials Advisor",
      desc: t("diva.specialistFlashSub") || "Menstrual cups, pads & comfort products",
      to: "/flash",
      icon: ShoppingBag,
      badgeText: "Active • Curated Comfort",
      theme: {
        border: "border-amber-500/30 hover:border-amber-500/60",
        badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        buttonCls: "bg-amber-600 hover:bg-amber-700 text-white",
      },
    },
    instinct: {
      id: "instinct",
      name: t("agent.instinct.name") || "INSTINCT",
      role: t("diva.mode.instinct") || "Personal Entertainment Advisor",
      desc: t("diva.specialistInstinctSub") || "Mood-lifting movies, books & audio relaxation",
      to: "/instinct",
      icon: Film,
      badgeText: "Active • Media & Relaxation",
      theme: {
        border: "border-rose-500/30 hover:border-rose-500/60",
        badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
        iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        buttonCls: "bg-rose-600 hover:bg-rose-700 text-white",
      },
    },
  };

  return (
    <section
      aria-label={t("diva.workspaceTitle")}
      data-testid="saheli-ai-workspace"
      className="space-y-4"
    >
      {/* Workspace Header with Reset Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold tracking-tight text-foreground">
              {t("diva.workspaceTitle")}
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Customizable
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t("diva.workspaceSubtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/60 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>{t("diva.resetOrder")}</span>
        </button>
      </div>

      {/* Rearrangeable Specialist Cards Grid */}
      <div
        role="list"
        aria-label="AI Specialist assistants list"
        data-testid="ai-workspace-cards"
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {order.map((agentId, index) => {
          const spec = specialistMeta[agentId];
          if (!spec) return null;
          const Icon = spec.icon;
          const isDragging = draggedId === agentId;
          const isDragOver = dragOverId === agentId;

          return (
            <div
              key={agentId}
              role="listitem"
              data-testid={`workspace-card-${agentId}`}
              draggable
              onDragStart={(e) => {
                if (e.dataTransfer) {
                  e.dataTransfer.setData("text/plain", agentId);
                }
                setDraggedId(agentId);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverId !== agentId) setDragOverId(agentId);
              }}
              onDragLeave={() => {
                if (dragOverId === agentId) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId =
                  (e.dataTransfer && e.dataTransfer.getData("text/plain")) || draggedId;
                if (sourceId && sourceId !== agentId) {
                  const sourceIndex = order.indexOf(sourceId);
                  const targetIndex = order.indexOf(agentId);
                  if (sourceIndex >= 0 && targetIndex >= 0) {
                    moveItem(sourceIndex, targetIndex);
                  }
                }
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              className={cx(
                "group relative flex flex-col justify-between rounded-2xl border bg-card p-4 transition-all duration-200 shadow-2xs",
                spec.theme.border,
                isDragging && "opacity-40 scale-95 border-dashed border-primary",
                isDragOver && "ring-2 ring-primary ring-offset-2 scale-[1.02]",
              )}
            >
              {/* Card Top: Drag Handle + Move Controls + Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label={`${t("diva.dragHandle")}: ${spec.name}`}
                    className="p-1 -ml-1 text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <span
                    className={cx(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      spec.theme.badgeBg,
                    )}
                  >
                    {spec.badgeText}
                  </span>
                </div>

                {/* Keyboard Reorder Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, index - 1)}
                    aria-label={`${t("diva.moveUp")}: ${spec.name}`}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => moveItem(index, index + 1)}
                    aria-label={`${t("diva.moveDown")}: ${spec.name}`}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body: Icon + Title + Role + Description */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold",
                      spec.theme.iconBg,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-sm font-bold text-foreground">
                        {spec.name} Specialist
                      </h3>
                      <NovaAgentBadge agent={spec.id} size="sm" showLabel={false} />
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">
                      {spec.role}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {spec.desc}
                </p>
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                {onSelectSpecialist && (
                  <button
                    type="button"
                    onClick={() => onSelectSpecialist(spec.id)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Route in Diva
                  </button>
                )}
                <a
                  href={spec.to}
                  className={cx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs ml-auto cursor-pointer",
                    spec.theme.buttonCls,
                  )}
                >
                  <span>{t("diva.openAssistant")}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
