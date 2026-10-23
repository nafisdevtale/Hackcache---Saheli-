import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Heart,
  Stethoscope,
  Activity,
  Calendar,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { CYCLE_PHASES } from "@/content/cyclePhases.js";
import { getCyclePhaseDiagnostics } from "@/lib/cycle.js";
import { Card, cx } from "@/components/common/ui.jsx";

export function PhaseCards({ showAll = false, className = "" }) {
  const { t, fmtRange, analysis: a, record, today } = useApp();
  const [selectedPhase, setSelectedPhase] = useState("follicular");
  const [expandedPhase, setExpandedPhase] = useState(showAll ? "both" : "follicular");

  const diagnostics = getCyclePhaseDiagnostics(
    a,
    {
      ageGroup: record?.settings?.ageGroup,
      paused: record?.settings?.trackingPaused,
      pregnancyActive: record?.pregnancy?.active,
      pregnancyMode: record?.pregnancy?.active,
    },
    today,
  );

  const renderSinglePhaseCard = (phaseId) => {
    const phaseInfo = CYCLE_PHASES[phaseId];
    if (!phaseInfo) return null;

    const isFollicular = phaseId === "follicular";
    const phaseRange = isFollicular ? diagnostics.follicular : diagnostics.luteal;
    const isCurrent = diagnostics.eligible && diagnostics.activePhase === phaseId;
    const isExpanded = expandedPhase === "both" || expandedPhase === phaseId;

    const accentBg = isFollicular
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
      : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300";

    const badgeBorder = isFollicular
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300";

    return (
      <div
        key={phaseId}
        className={cx(
          "rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft transition-all space-y-4",
          isCurrent && "ring-2 ring-primary/40",
        )}
      >
        {/* Phase Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl",
                accentBg,
              )}
            >
              {isFollicular ? "🌱" : "🌕"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {t(phaseInfo.titleKey)}
                </h3>
                {isCurrent && (
                  <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                    {t("phase.current")}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {t(phaseInfo.subtitleKey)}
              </p>
            </div>
          </div>

          {/* Timeline Estimate Pill or Educational Safeguard Pill */}
          <div className="flex items-center gap-2">
            {diagnostics.eligible && phaseRange ? (
              <div
                className={cx(
                  "rounded-2xl border px-3 py-1.5 text-xs font-semibold space-y-0.5",
                  badgeBorder,
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {t("phase.daysRange", {
                      start: phaseRange.startDay,
                      end: phaseRange.endDay,
                    })}
                  </span>
                </div>
                <div className="text-[10px] opacity-80">
                  ±{phaseRange.uncertaintyDays} {t("insights.days")} {t("common.uncertainty")}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>{t("phase.eduBadge")}</span>
                </div>
                <div className="text-[10px] text-muted-foreground/80">
                  {t(diagnostics.uncertaintyNoteKey)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Biological and Hormonal Description */}
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p className="text-foreground/90 font-medium">{t(phaseInfo.taglineKey)}</p>
          <p>{t(phaseInfo.biologyKey)}</p>
          <div className="rounded-2xl bg-muted/50 p-3 text-xs space-y-1">
            <strong className="text-foreground font-semibold flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              {t("phase.hormoneTitle")}
            </strong>
            <p>{t(phaseInfo.hormoneSummaryKey)}</p>
          </div>
        </div>

        {/* Variation Note & Myth-Busting (Day 14 universal myth) */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{t("phase.variationTitle")}</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {t(phaseInfo.variationKey)}
          </p>
        </div>

        {/* Accordion / Expandable Self Care & Clinical Citations */}
        <div>
          <button
            type="button"
            onClick={() =>
              setExpandedPhase((prev) =>
                prev === "both"
                  ? isFollicular
                    ? "luteal"
                    : "follicular"
                  : prev === phaseId
                    ? null
                    : phaseId,
              )
            }
            className="flex w-full items-center justify-between text-xs font-semibold text-primary hover:underline py-1"
          >
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              {t("phase.selfCareHeader")}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-3 pt-2 border-t border-border/40 text-xs animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {phaseInfo.selfCareTips.map((tipKey, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>{t(tipKey)}</span>
                  </div>
                ))}
              </div>

              {/* Clinical Sources */}
              <div className="rounded-xl bg-muted/30 p-2.5 text-[10px] text-muted-foreground space-y-1 border border-border/40">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="h-3 w-3 text-secondary-strong" />
                  <span>{t("phase.clinicalSources")}</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {phaseInfo.sources.map((src, i) => (
                    <li key={i}>
                      {src.name} — {src.topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section aria-label={t("phase.sectionTitle")} className={cx("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{t("phase.sectionTitle")}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("phase.sectionSubtitle")}</p>
        </div>

        {/* Phase selector tabs on mobile/desktop if not showAll */}
        {!showAll && (
          <div className="flex items-center rounded-2xl border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setSelectedPhase("follicular")}
              className={cx(
                "rounded-xl px-3 py-1 text-xs font-bold transition-all",
                selectedPhase === "follicular"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("phase.follicular.tab")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhase("luteal")}
              className={cx(
                "rounded-xl px-3 py-1 text-xs font-bold transition-all",
                selectedPhase === "luteal"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("phase.luteal.tab")}
            </button>
          </div>
        )}
      </div>

      {showAll ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSinglePhaseCard("follicular")}
          {renderSinglePhaseCard("luteal")}
        </div>
      ) : (
        renderSinglePhaseCard(selectedPhase)
      )}

      {/* Non-Diagnostic Clinical Safety Footer */}
      <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2.5">
        <Stethoscope className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t("phase.disclaimer")}</p>
      </div>
    </section>
  );
}
