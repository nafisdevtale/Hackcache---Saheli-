import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  Calendar,
  Plus,
  Thermometer,
  Droplet,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
  History,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { CYCLE_PHASES } from "@/content/cyclePhases.js";
import { getAuthoritativeCycleState } from "@/lib/cycle.js";
import { defaultOvulationObservation } from "@/lib/exportImport.js";
import { cx, Btn } from "@/components/common/ui.jsx";

export function PhaseCards({ showAll = true, allowObservationLog = true, className = "" }) {
  const {
    t,
    fmt,
    today,
    record,
    cycleState: appCycleState,
    saveOvulationObservation,
    deleteOvulationObservation,
  } = useApp();

  const cycleState = appCycleState || (record ? getAuthoritativeCycleState(record, today) : null);

  // Active view: "current" or cycleNumber from pastCycles
  const [selectedCycleTab, setSelectedCycleTab] = useState("current");
  const [activeDetailModal, setActiveDetailModal] = useState(null); // "follicular" | "luteal" | null

  // Observation Modal state
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsForm, setObsForm] = useState(() => defaultOvulationObservation(today));
  const [obsSaving, setObsSaving] = useState(false);

  const openLogObservation = (date = today) => {
    const existing = record?.ovulationObservations?.[date];
    if (existing) {
      setObsForm({ ...defaultOvulationObservation(date), ...existing, date });
    } else {
      setObsForm(defaultOvulationObservation(date));
    }
    setObsModalOpen(true);
  };

  const handleSaveObservation = async (e) => {
    if (e) e.preventDefault();
    setObsSaving(true);
    try {
      await saveOvulationObservation(obsForm.date, obsForm);
      setObsModalOpen(false);
    } finally {
      setObsSaving(false);
    }
  };

  const handleDeleteObservation = async (date) => {
    setObsSaving(true);
    try {
      await deleteOvulationObservation(date);
      if (obsModalOpen && obsForm.date === date) {
        setObsModalOpen(false);
      }
    } finally {
      setObsSaving(false);
    }
  };

  if (!cycleState) return null;

  const {
    cycleDay,
    currentBleedingStatus,
    currentCycleStart,
    completedCycleCount,
    cycleLengthMedian,
    cycleLengthVariability,
    ovulationObservationStatus,
    estimateExplanation,
    follicularTracker,
    lutealTracker,
    pastCycles = [],
  } = cycleState;

  // Selected cycle determination
  const isViewingCurrent = selectedCycleTab === "current";
  const selectedPastCycle = !isViewingCurrent
    ? pastCycles.find((c) => String(c.cycleNumber) === String(selectedCycleTab))
    : null;

  // Helper for evidence label
  const getEvidenceBadge = (evidence, uncertaintyDays) => {
    if (evidence === "supported_by_observations") {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold">
          <Sparkles className="h-3 w-3" />
          {t("phase.evidenceObserved")}
        </span>
      );
    }
    if (evidence === "calendar_estimate") {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold">
          <Calendar className="h-3 w-3" />
          {t("phase.evidenceEstimated")} {uncertaintyDays != null ? `(±${uncertaintyDays}d)` : ""}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-muted text-muted-foreground border border-border/40 px-2.5 py-0.5 text-[10px] font-medium">
        <Info className="h-3 w-3" />
        {t("phase.evidenceUnestablished")}
      </span>
    );
  };

  // Helper for status badge
  const getStatusBadge = (status) => {
    if (status === "current") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t("phase.statusCurrent")}
        </span>
      );
    }
    if (status === "upcoming") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 text-[10px] font-bold">
          <Clock className="h-3 w-3" />
          {t("phase.statusUpcoming")}
        </span>
      );
    }
    if (status === "past") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[10px] font-semibold">
          <Check className="h-3 w-3" />
          {t("phase.statusPast")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-[10px] font-bold">
        <AlertTriangle className="h-3 w-3" />
        {t("phase.statusUnknown")}
      </span>
    );
  };

  return (
    <section
      aria-label={t("phase.myPhaseTracker")}
      data-testid="my-phase-tracker-section"
      className={cx("space-y-4", className)}
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-2xs">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t("phase.myPhaseTracker")}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("phase.myPhaseTrackerSubtitle")}
          </p>
        </div>

        {allowObservationLog && (
          <button
            type="button"
            onClick={() => openLogObservation(today)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-soft self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("phase.recordObservation")}</span>
          </button>
        )}
      </div>

      {/* 2. Current Cycle Day Card or Empty State */}
      {!currentCycleStart ? (
        <div className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">{t("phase.noCycleDay")}</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {t("phase.noDataStartTracking")}
            </p>
          </div>
          <Link
            to="/log"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-all shadow-soft"
          >
            <span>+ {t("today.logToday")}</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("phase.cycleDayCard")}
                </span>
                {currentBleedingStatus === "bleeding" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-period/15 text-period px-2.5 py-0.5 text-[10px] font-bold">
                    🩸 {t("phase.bleeding")}
                  </span>
                ) : currentBleedingStatus === "spotting" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-[10px] font-bold">
                    🔸 {t("phase.spotting")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[10px] font-bold">
                    ✨ {t("phase.notBleeding")}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
                  {t("phase.currentCycleDay", { day: cycleDay || 1 })}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {t("phase.startedOn", { date: fmt(currentCycleStart) })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-xl bg-muted/60 border border-border/40 px-3 py-1 font-semibold text-foreground">
                {completedCycleCount > 0
                  ? t("today.basedOn", { n: completedCycleCount })
                  : t("phase.dayOnly")}
              </span>
              {cycleLengthMedian && (
                <span className="rounded-xl bg-muted/60 border border-border/40 px-3 py-1 text-muted-foreground">
                  {cycleLengthMedian} {t("insights.days")} {t("insights.median").toLowerCase()}
                  {cycleLengthVariability != null && ` (±${cycleLengthVariability}d)`}
                </span>
              )}
            </div>
          </div>

          {/* Explanation banner */}
          <div className="rounded-2xl bg-muted/30 border border-border/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">{estimateExplanation}</p>
          </div>
        </div>
      )}

      {/* 3. Cycle History Selector (Section 6) */}
      {pastCycles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              {t("phase.selectCycle")}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCycleTab("current")}
              className={cx(
                "rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 transition-all border",
                selectedCycleTab === "current"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card hover:bg-muted text-muted-foreground border-border/70",
              )}
            >
              {t("phase.currentCycleTab", { day: cycleDay || 1 })}
            </button>
            {pastCycles.map((c) => (
              <button
                key={c.cycleNumber}
                type="button"
                onClick={() => setSelectedCycleTab(String(c.cycleNumber))}
                className={cx(
                  "rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 transition-all border",
                  selectedCycleTab === String(c.cycleNumber)
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-muted text-muted-foreground border-border/70",
                )}
              >
                {t("phase.pastCycleTab", { n: c.cycleNumber, length: c.length })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Past Cycle Detail View (when historical cycle tab is selected) */}
      {!isViewingCurrent && selectedPastCycle && (
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4 animate-fade-in shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">
                  Historical Record
                </span>
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  Cycle #{selectedPastCycle.cycleNumber} ({selectedPastCycle.length} Days)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fmt(selectedPastCycle.start)} – {fmt(selectedPastCycle.end)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCycleTab("current")}
              className="text-xs font-bold text-primary hover:underline self-start sm:self-auto"
            >
              ← Back to Current Tracker
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-2xl bg-card/80 border border-border/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Total Duration
              </span>
              <span className="text-sm font-bold text-foreground">
                {selectedPastCycle.length} Days
              </span>
            </div>
            <div className="rounded-2xl bg-card/80 border border-border/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Period Duration
              </span>
              <span className="text-sm font-bold text-period">
                {selectedPastCycle.periodDuration} Days
              </span>
            </div>
            <div className="rounded-2xl bg-card/80 border border-border/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Symptoms Logged
              </span>
              <span className="text-sm font-bold text-foreground">
                {selectedPastCycle.symptomsCount} logs
              </span>
            </div>
            <div className="rounded-2xl bg-card/80 border border-border/60 p-3 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                Observations
              </span>
              <span className="text-sm font-bold text-foreground">
                {selectedPastCycle.observationsCount} entries
              </span>
            </div>
          </div>

          {/* Historical timeline bar */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              {t("phase.historicalTimeline")}
            </span>
            <div className="h-4 w-full rounded-full bg-muted/60 overflow-hidden flex text-[9px] font-bold text-white">
              <div
                style={{
                  width: `${Math.min(100, Math.round((selectedPastCycle.periodDuration / selectedPastCycle.length) * 100))}%`,
                }}
                className="bg-period h-full flex items-center justify-center"
                title={`Period: ${selectedPastCycle.periodDuration}d`}
              >
                Period
              </div>
              <div
                style={{
                  width: `${Math.max(10, Math.round(((selectedPastCycle.estimatedFollicularEnd - selectedPastCycle.periodDuration) / selectedPastCycle.length) * 100))}%`,
                }}
                className="bg-emerald-500/80 h-full flex items-center justify-center text-emerald-950"
                title="Follicular"
              >
                Foll.
              </div>
              <div
                className="bg-amber-500/80 h-full flex-1 flex items-center justify-center text-amber-950"
                title="Luteal"
              >
                Luteal
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
              <span>Day 1 ({fmt(selectedPastCycle.start)})</span>
              <span>
                Day {selectedPastCycle.length} ({fmt(selectedPastCycle.end)})
              </span>
            </div>
          </div>

          {/* Historical symptoms recorded */}
          {selectedPastCycle.symptoms.length > 0 && (
            <div className="space-y-1.5 border-t border-border/40 pt-3">
              <span className="text-xs font-bold text-foreground">
                Symptoms Recorded in Cycle #{selectedPastCycle.cycleNumber}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPastCycle.symptoms.map((sEntry, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-card border border-border/60 px-2 py-0.5 text-[11px] text-foreground font-medium"
                  >
                    Day {sEntry.cycleDay}: {sEntry.symptoms.map((s) => t(`sym.${s}`)).join(", ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historical observations recorded */}
          {selectedPastCycle.observations.length > 0 && (
            <div className="space-y-1.5 border-t border-border/40 pt-3">
              <span className="text-xs font-bold text-foreground">
                Ovulation Observations Recorded
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedPastCycle.observations.map((obs, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-card border border-primary/25 px-2.5 py-1 text-[11px] text-foreground font-medium flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    Day {obs.cycleDay} ({fmt(obs.date)}):{" "}
                    {obs.testResult && obs.testResult !== "none" ? `LH ${obs.testResult}` : ""}
                    {obs.bbt != null ? ` • ${obs.bbt}°${obs.bbtUnit || "C"}` : ""}
                    {obs.cervicalFluid && obs.cervicalFluid !== "none"
                      ? ` • Fluid ${obs.cervicalFluid}`
                      : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Two Functional Tracker Cards (Follicular & Luteal) */}
      {isViewingCurrent && follicularTracker && lutealTracker && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Follicular Phase Tracker */}
          <div
            onClick={() => setActiveDetailModal("follicular")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveDetailModal("follicular")}
            className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft space-y-4 hover:border-primary/40 transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-lg group-hover:scale-105 transition-transform">
                  🌱
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {t(follicularTracker.titleKey)}
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t("phase.follicularSubtitle")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(follicularTracker.status)}
                {getEvidenceBadge(follicularTracker.evidence, follicularTracker.uncertaintyDays)}
              </div>
            </div>

            {/* Elapsed Progress / Boundary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">{t("phase.phaseProgress")}</span>
                <span className="text-foreground">
                  {follicularTracker.progressPercent != null
                    ? `${follicularTracker.progressPercent}%`
                    : t("phase.statusUnknown")}
                </span>
              </div>

              {follicularTracker.progressPercent != null ? (
                <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    style={{ width: `${follicularTracker.progressPercent}%` }}
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="h-2.5 w-full rounded-full border border-dashed border-border/70 bg-muted/30 flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground font-mono">
                    boundary unestablished
                  </span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
                {follicularTracker.endDay != null
                  ? t("phase.elapsedOfEstimated", {
                      elapsed: follicularTracker.elapsedDays,
                      total: follicularTracker.endDay,
                    })
                  : t("phase.boundaryNotEstablishedDesc", { day: cycleDay || 1 })}
              </p>
            </div>

            {/* Observed Symptoms */}
            <div className="space-y-1.5 border-t border-border/40 pt-3 text-xs">
              <span className="font-semibold text-foreground text-[11px] block">
                {t("phase.symptomPatternsTitle")}
              </span>
              {follicularTracker.currentSymptoms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {follicularTracker.currentSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium"
                    >
                      • {t(`sym.${sym}`)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  {t("phase.noSymptomsRecorded")}
                </p>
              )}

              {follicularTracker.previousPatterns.length > 0 && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  {t("phase.previousCyclePatterns", {
                    patterns: follicularTracker.previousPatterns
                      .map((s) => t(`sym.${s}`))
                      .slice(0, 3)
                      .join(", "),
                  })}
                </p>
              )}
            </div>

            {/* Action hint */}
            <div className="flex items-center justify-between text-xs font-bold text-primary pt-1 border-t border-border/30">
              <span className="text-[11px]">{t("phase.tapToInspect")}</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card B: Luteal Phase Tracker */}
          <div
            onClick={() => setActiveDetailModal("luteal")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setActiveDetailModal("luteal")}
            className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft space-y-4 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-lg group-hover:scale-105 transition-transform">
                  🌕
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {t(lutealTracker.titleKey)}
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {t("phase.lutealSubtitle")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(lutealTracker.status)}
                {getEvidenceBadge(lutealTracker.evidence, lutealTracker.uncertaintyDays)}
              </div>
            </div>

            {/* Elapsed Progress / Boundary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">{t("phase.phaseProgress")}</span>
                <span className="text-foreground">
                  {lutealTracker.progressPercent != null
                    ? `${lutealTracker.progressPercent}%`
                    : t("phase.statusUnknown")}
                </span>
              </div>

              {lutealTracker.progressPercent != null ? (
                <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    style={{ width: `${lutealTracker.progressPercent}%` }}
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="h-2.5 w-full rounded-full border border-dashed border-border/70 bg-muted/30 flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground font-mono">
                    boundary unestablished
                  </span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
                {lutealTracker.startDay != null
                  ? `${t("phase.elapsedOfEstimated", {
                      elapsed: lutealTracker.elapsedDays,
                      total: lutealTracker.endDay - lutealTracker.startDay + 1,
                    })} (${t("phase.remainingDaysApprox", { days: lutealTracker.remainingDays })})`
                  : t("phase.lutealFollowsOvulation")}
              </p>
            </div>

            {/* Observed Symptoms */}
            <div className="space-y-1.5 border-t border-border/40 pt-3 text-xs">
              <span className="font-semibold text-foreground text-[11px] block">
                {t("phase.symptomPatternsTitle")}
              </span>
              {lutealTracker.currentSymptoms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {lutealTracker.currentSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium"
                    >
                      • {t(`sym.${sym}`)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  {t("phase.noSymptomsRecorded")}
                </p>
              )}

              {lutealTracker.previousPatterns.length > 0 && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  {t("phase.previousCyclePatterns", {
                    patterns: lutealTracker.previousPatterns
                      .map((s) => t(`sym.${s}`))
                      .slice(0, 3)
                      .join(", "),
                  })}
                </p>
              )}
            </div>

            {/* Action hint */}
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 pt-1 border-t border-border/30">
              <span className="text-[11px]">{t("phase.tapToInspect")}</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* 6. Observation History & Management Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary-strong text-lg">
              ✨
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                {t("phase.ovulationCardTitle")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("phase.ovulationCardSubtitle")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openLogObservation(today)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("phase.recordObservation")}</span>
          </button>
        </div>

        {/* Observations list */}
        {ovulationObservationStatus.hasObservations ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ovulationObservationStatus.currentCycleObservations.map((obs) => (
                <div
                  key={obs.date}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs flex items-center justify-between gap-2 hover:border-primary/30 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{fmt(obs.date)}</span>
                      {obs.cycleDay && (
                        <span className="rounded-md bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground font-mono">
                          Day {obs.cycleDay}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                      {obs.testResult && obs.testResult !== "none" && (
                        <span
                          className={cx(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                            obs.testResult === "positive"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          LH: {obs.testResult}
                        </span>
                      )}
                      {obs.bbt != null && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                          {obs.bbt}°{obs.bbtUnit || "C"}
                        </span>
                      )}
                      {obs.cervicalFluid && obs.cervicalFluid !== "none" && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
                          Fluid: {obs.cervicalFluid}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openLogObservation(obs.date)}
                      className="rounded-lg p-1 text-muted-foreground hover:text-primary transition-colors"
                      title={t("cal.editEntry")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteObservation(obs.date)}
                      className="rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title={t("phase.deleteObservation")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">{t("phase.noObservations")}</p>
        )}

        {/* Disclaimer */}
        <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t("phase.obsDisclaimer")}</p>
        </div>
      </div>

      {/* 7. Detailed Phase Tracking Modal (when Follicular or Luteal is tapped) */}
      {activeDetailModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeDetailModal === "follicular" ? "🌱" : "🌕"}</span>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {activeDetailModal === "follicular"
                      ? t(follicularTracker.titleKey)
                      : t(lutealTracker.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeDetailModal === "follicular"
                      ? t("phase.follicularSubtitle")
                      : t("phase.lutealSubtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailModal(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tracking Status Overview */}
            <div className="rounded-2xl bg-muted/30 border border-border/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Tracking Status</span>
                {getStatusBadge(
                  activeDetailModal === "follicular"
                    ? follicularTracker.status
                    : lutealTracker.status,
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeDetailModal === "follicular"
                  ? follicularTracker.endDay != null
                    ? `Currently on Day ${follicularTracker.elapsedDays} of this cycle. Estimated follicular boundary spans up to ~Day ${follicularTracker.endDay} (±${follicularTracker.uncertaintyDays}d).`
                    : t("phase.boundaryNotEstablishedDesc", { day: cycleDay || 1 })
                  : lutealTracker.startDay != null
                    ? `Elapsed: ${lutealTracker.elapsedDays} days. Remaining approximate window: ~${lutealTracker.remainingDays} days.`
                    : t("phase.lutealFollowsOvulation")}
              </p>
            </div>

            {/* Tertiary: Clinical Biology & Hormonal Overview */}
            <div className="space-y-2 border-t border-border/40 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {t("phase.hormoneTitle")}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeDetailModal === "follicular"
                  ? t("phase.follicular.hormones")
                  : t("phase.luteal.hormones")}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeDetailModal === "follicular"
                  ? t("phase.follicular.biology")
                  : t("phase.luteal.biology")}
              </p>
            </div>

            {/* Comfort & Self Care Tips */}
            <div className="space-y-2 border-t border-border/40 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-primary" />
                {t("phase.selfCareHeader")}
              </span>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {(activeDetailModal === "follicular"
                  ? CYCLE_PHASES.follicular.selfCareTips
                  : CYCLE_PHASES.luteal.selfCareTips
                )
                  .slice(0, 3)
                  .map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{t(tip)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <Link
                to="/learn"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>{t("phase.learnMoreAboutPhase")}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Btn onClick={() => setActiveDetailModal(null)} size="sm" variant="outline">
                {t("phase.closeDetail")}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* 8. Observation Logging Modal */}
      {obsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {t("phase.ovulationCardTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("phase.recordObservation")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setObsModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-3.5 text-xs">
              {/* Date */}
              <div>
                <label className="block font-bold text-foreground mb-1">{t("log.date")}</label>
                <input
                  type="date"
                  value={obsForm.date}
                  onChange={(e) => setObsForm({ ...obsForm, date: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground font-mono focus:border-primary focus:outline-none"
                  required
                />
              </div>

              {/* LH OPK Test Result */}
              <div>
                <label className="block font-bold text-foreground mb-1">{t("phase.lhTest")}</label>
                <select
                  value={obsForm.testResult || "none"}
                  onChange={(e) => setObsForm({ ...obsForm, testResult: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="none">{t("phase.lhNone")}</option>
                  <option value="negative">{t("phase.lhNegative")}</option>
                  <option value="faint">{t("phase.lhFaint")}</option>
                  <option value="positive">{t("phase.lhPositive")}</option>
                </select>
              </div>

              {/* Basal Body Temperature */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-foreground">{t("phase.bbt")}</label>
                  <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setObsForm({ ...obsForm, bbtUnit: "C" })}
                      className={cx(
                        "px-2 py-0.5",
                        obsForm.bbtUnit === "C"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => setObsForm({ ...obsForm, bbtUnit: "F" })}
                      className={cx(
                        "px-2 py-0.5",
                        obsForm.bbtUnit === "F"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      °F
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder={obsForm.bbtUnit === "F" ? "e.g. 97.80" : "e.g. 36.65"}
                  value={obsForm.bbt != null ? obsForm.bbt : ""}
                  onChange={(e) =>
                    setObsForm({
                      ...obsForm,
                      bbt: e.target.value === "" ? null : parseFloat(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>

              {/* Cervical Fluid */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  {t("phase.cervicalFluid")}
                </label>
                <select
                  value={obsForm.cervicalFluid || "none"}
                  onChange={(e) => setObsForm({ ...obsForm, cervicalFluid: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="none">{t("phase.lhNone")}</option>
                  <option value="dry">{t("phase.fluidDry")}</option>
                  <option value="sticky">{t("phase.fluidSticky")}</option>
                  <option value="creamy">{t("phase.fluidCreamy")}</option>
                  <option value="watery">{t("phase.fluidWatery")}</option>
                  <option value="eggwhite">{t("phase.fluidEggwhite")}</option>
                </select>
              </div>

              {/* Exclude from calculations toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exclude-calc-modal"
                  checked={!!obsForm.excludedFromCalculations}
                  onChange={(e) =>
                    setObsForm({ ...obsForm, excludedFromCalculations: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label
                  htmlFor="exclude-calc-modal"
                  className="text-xs text-muted-foreground font-medium select-none"
                >
                  {t("phase.excludeFromCalc")}
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-foreground mb-1">{t("log.notes")}</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={obsForm.notes || ""}
                  onChange={(e) => setObsForm({ ...obsForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Btn
                  type="button"
                  onClick={() => setObsModalOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  {t("common.cancel")}
                </Btn>
                <Btn type="submit" disabled={obsSaving} size="sm">
                  {obsSaving ? t("common.saving") : t("common.save")}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
