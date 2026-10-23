import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  Stethoscope,
  Activity,
  Calendar,
  Plus,
  Thermometer,
  Droplet,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { CYCLE_PHASES } from "@/content/cyclePhases.js";
import { getCyclePhaseDiagnostics, getAuthoritativeCycleState } from "@/lib/cycle.js";
import { defaultOvulationObservation } from "@/lib/exportImport.js";
import { Card, cx, Btn } from "@/components/common/ui.jsx";

export function PhaseCards({ showAll = true, allowObservationLog = true, className = "" }) {
  const {
    t,
    fmt,
    fmtRange,
    today,
    record,
    cycleState: appCycleState,
    saveOvulationObservation,
    deleteOvulationObservation,
  } = useApp();

  const cycleState = appCycleState || (record ? getAuthoritativeCycleState(record, today) : null);
  const diagnostics = cycleState?.phaseDiagnostics || { eligible: false, status: "suppressed" };

  const [expandedSection, setExpandedSection] = useState({
    follicular: true,
    luteal: true,
    ovulation: true,
  });

  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsForm, setObsForm] = useState(() => defaultOvulationObservation(today));
  const [obsSaving, setObsSaving] = useState(false);

  const toggleSection = (sec) => {
    setExpandedSection((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

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
    phaseStatus,
    phaseEstimationMethod,
    ovulationEstimateStatus,
    ovulationObservationStatus,
    estimateExplanation,
    relevantSourceDates,
  } = cycleState;

  // Extract symptoms logged in follicular vs luteal days in current cycle
  const currentDays = record?.days || {};
  const currentFollicularSymptoms = new Set();
  const currentLutealSymptoms = new Set();

  if (currentCycleStart) {
    Object.entries(currentDays).forEach(([d, dayEntry]) => {
      if (d >= currentCycleStart && d <= today && dayEntry.symptoms?.length) {
        const dNum = cycleState.cycleDay
          ? Math.max(1, (new Date(d) - new Date(currentCycleStart)) / 86400000 + 1)
          : null;
        if (dNum) {
          const isFoll = diagnostics.follicular && dNum <= (diagnostics.follicular.endDay || 14);
          dayEntry.symptoms.forEach((s) => {
            if (isFoll) currentFollicularSymptoms.add(s);
            else currentLutealSymptoms.add(s);
          });
        }
      }
    });
  }

  return (
    <section aria-label={t("phase.myCyclePhases")} className={cx("space-y-4", className)}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-foreground">{t("phase.myCyclePhases")}</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t("phase.myCyclePhasesSubtitle")}</p>
        </div>

        {allowObservationLog && (
          <button
            type="button"
            onClick={() => openLogObservation(today)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("phase.recordObservation")}</span>
          </button>
        )}
      </div>

      {/* Card 1: Cycle Day & Bleeding Status Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft space-y-4">
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
            <p className="font-display text-3xl font-extrabold text-foreground">
              {cycleDay ? t("phase.currentCycleDay", { day: cycleDay }) : t("phase.noCycleDay")}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/40 border border-border/50 p-3 text-xs space-y-1 sm:text-right">
            {currentCycleStart ? (
              <>
                <p className="font-semibold text-foreground">
                  {t("phase.startedOn", {
                    date: fmt(currentCycleStart, { month: "short", day: "numeric" }),
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {completedCycleCount > 0
                    ? `${completedCycleCount} ${t("today.basedOn", { n: completedCycleCount })} · Median ${cycleLengthMedian || 28} d`
                    : t("phase.noPeriodHistory")}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">{t("phase.noPeriodHistory")}</p>
            )}
          </div>
        </div>

        {/* Prediction Confidence & Uncertainty Banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("phase.confidenceTitle")}
            </span>
            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30">
              {phaseEstimationMethod === "calendar_bounded"
                ? t("phase.method.calendar")
                : phaseEstimationMethod === "recorded_menstruation"
                  ? t("phase.method.menstrual")
                  : t("phase.method.educational")}
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">{estimateExplanation}</p>
        </div>
      </div>

      {/* Grid of Follicular and Luteal Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 2: Follicular Phase Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-start justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-lg">
                🌱
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {t("phase.follicularTitle")}
                  </h3>
                  {diagnostics.eligible && diagnostics.activePhase === "follicular" && (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                      {t("phase.current")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("phase.follicularSubtitle")}
                </p>
              </div>
            </div>

            {diagnostics.eligible && diagnostics.follicular ? (
              <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-bold">
                {t("phase.daysRange", {
                  start: diagnostics.follicular.startDay,
                  end: diagnostics.follicular.endDay,
                })}
              </span>
            ) : (
              <span className="rounded-xl bg-muted/60 text-muted-foreground px-2 py-1 text-[10px] font-semibold">
                {t("phase.eduBadge")}
              </span>
            )}
          </div>

          {/* Biological Boundaries Notice */}
          <div className="rounded-2xl bg-muted/30 border border-border/40 p-3 text-[11px] text-muted-foreground space-y-1">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
              <Info className="h-3 w-3 text-primary" />
              {t("phase.boundaryNotice")}
            </span>
            <p className="leading-relaxed">{t("phase.follicularBoundary")}</p>
          </div>

          {/* Observed symptoms on follicular days */}
          <div className="text-xs space-y-1.5">
            <span className="font-semibold text-foreground text-[11px]">
              {t("phase.symptomPatternsTitle")}
            </span>
            {currentFollicularSymptoms.size > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.from(currentFollicularSymptoms).map((sym) => (
                  <span
                    key={sym}
                    className="rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium"
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
          </div>

          {/* Collapsible Self Care */}
          <div className="border-t border-border/40 pt-2">
            <button
              type="button"
              onClick={() => toggleSection("follicular")}
              className="flex w-full items-center justify-between text-xs font-semibold text-primary hover:underline py-1"
            >
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                {t("phase.selfCareHeader")}
              </span>
              {expandedSection.follicular ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {expandedSection.follicular && (
              <div className="mt-2 space-y-2 text-[11px] text-muted-foreground animate-fade-in">
                {CYCLE_PHASES.follicular.selfCareTips.slice(0, 3).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{t(tip)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Luteal Phase Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-start justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-lg">
                🌕
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {t("phase.lutealTitle")}
                  </h3>
                  {diagnostics.eligible && diagnostics.activePhase === "luteal" && (
                    <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5">
                      {t("phase.current")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {t("phase.lutealSubtitle")}
                </p>
              </div>
            </div>

            {diagnostics.eligible && diagnostics.luteal ? (
              <span className="rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 px-2.5 py-1 text-[11px] font-bold">
                {t("phase.daysRange", {
                  start: diagnostics.luteal.startDay,
                  end: diagnostics.luteal.endDay,
                })}
              </span>
            ) : (
              <span className="rounded-xl bg-muted/60 text-muted-foreground px-2 py-1 text-[10px] font-semibold">
                {t("phase.eduBadge")}
              </span>
            )}
          </div>

          {/* Biological Boundaries Notice */}
          <div className="rounded-2xl bg-muted/30 border border-border/40 p-3 text-[11px] text-muted-foreground space-y-1">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
              <Info className="h-3 w-3 text-primary" />
              {t("phase.boundaryNotice")}
            </span>
            <p className="leading-relaxed">{t("phase.lutealBoundary")}</p>
          </div>

          {/* Observed symptoms on luteal days */}
          <div className="text-xs space-y-1.5">
            <span className="font-semibold text-foreground text-[11px]">
              {t("phase.symptomPatternsTitle")}
            </span>
            {currentLutealSymptoms.size > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.from(currentLutealSymptoms).map((sym) => (
                  <span
                    key={sym}
                    className="rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[11px] font-medium"
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
          </div>

          {/* Collapsible Self Care */}
          <div className="border-t border-border/40 pt-2">
            <button
              type="button"
              onClick={() => toggleSection("luteal")}
              className="flex w-full items-center justify-between text-xs font-semibold text-primary hover:underline py-1"
            >
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                {t("phase.selfCareHeader")}
              </span>
              {expandedSection.luteal ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {expandedSection.luteal && (
              <div className="mt-2 space-y-2 text-[11px] text-muted-foreground animate-fade-in">
                {CYCLE_PHASES.luteal.selfCareTips.slice(0, 3).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{t(tip)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 4: Ovulation Observations & Tracking Card */}
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

        {/* Current Cycle Observations Display */}
        {ovulationObservationStatus.hasObservations ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-2xl bg-muted/40 p-3 space-y-1 border border-border/40">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {t("phase.lhTest")}
                </span>
                <p className="font-bold text-foreground">
                  {ovulationObservationStatus.positiveLh
                    ? `🟢 ${t("phase.lhPositive")} (${fmt(ovulationObservationStatus.positiveLh.date, { month: "short", day: "numeric" })})`
                    : ovulationObservationStatus.latestObservation?.testResult &&
                        ovulationObservationStatus.latestObservation.testResult !== "none"
                      ? t(
                          `phase.lh${ovulationObservationStatus.latestObservation.testResult.charAt(0).toUpperCase() + ovulationObservationStatus.latestObservation.testResult.slice(1)}`,
                        )
                      : t("phase.lhNone")}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3 space-y-1 border border-border/40">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {t("phase.bbt")}
                </span>
                <p className="font-bold text-foreground">
                  {ovulationObservationStatus.bbtEntries > 0
                    ? `${ovulationObservationStatus.bbtEntries} logged (Latest: ${ovulationObservationStatus.latestObservation?.bbt != null ? `${ovulationObservationStatus.latestObservation.bbt} °${ovulationObservationStatus.latestObservation.bbtUnit || "C"}` : "-"})`
                    : "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3 space-y-1 border border-border/40">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  {t("phase.cervicalFluid")}
                </span>
                <p className="font-bold text-foreground">
                  {ovulationObservationStatus.cervicalFluidEntries > 0
                    ? `${ovulationObservationStatus.cervicalFluidEntries} logged`
                    : "-"}
                </p>
              </div>
            </div>

            {/* List of recent observations in this cycle with delete/edit */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-foreground block">
                {t("ins.observationHistory")} (
                {ovulationObservationStatus.currentCycleObservations.length})
              </span>
              <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card overflow-hidden">
                {ovulationObservationStatus.currentCycleObservations.map((obs) => (
                  <div
                    key={obs.date}
                    className="flex items-center justify-between p-3 text-xs gap-2"
                  >
                    <div>
                      <span className="font-bold text-foreground">
                        {fmt(obs.date, { month: "short", day: "numeric" })}
                      </span>
                      {obs.cycleDay && (
                        <span className="text-muted-foreground ml-2 text-[11px]">
                          (Day {obs.cycleDay})
                        </span>
                      )}
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {obs.testResult && obs.testResult !== "none" && (
                          <span className="font-semibold text-primary">
                            LH:{" "}
                            {t(
                              `phase.lh${obs.testResult.charAt(0).toUpperCase() + obs.testResult.slice(1)}`,
                            )}
                          </span>
                        )}
                        {obs.bbt != null && (
                          <span>
                            BBT: {obs.bbt} °{obs.bbtUnit || "C"}
                          </span>
                        )}
                        {obs.cervicalFluid && obs.cervicalFluid !== "none" && (
                          <span>
                            Fluid:{" "}
                            {t(
                              `phase.fluid${obs.cervicalFluid.charAt(0).toUpperCase() + obs.cervicalFluid.slice(1)}`,
                            )}
                          </span>
                        )}
                        {obs.notes && <span className="italic">"{obs.notes}"</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openLogObservation(obs.date)}
                        className="text-[11px] font-bold text-primary hover:underline px-2 py-1"
                      >
                        {t("cal.editEntry")}
                      </button>
                      <button
                        type="button"
                        aria-label={t("phase.deleteObservation")}
                        onClick={() => handleDeleteObservation(obs.date)}
                        className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 text-center text-xs space-y-2">
            <p className="text-muted-foreground">{t("phase.noObservations")}</p>
            <button
              type="button"
              onClick={() => openLogObservation(today)}
              className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("phase.recordObservation")}</span>
            </button>
          </div>
        )}

        {/* Clinical Disclaimer */}
        <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2 border border-border/40">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t("phase.obsDisclaimer")}</p>
        </div>
      </div>

      {/* Observation Modal / Drawer */}
      {obsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("phase.recordObservation")}
              </h3>
              <button
                type="button"
                onClick={() => setObsModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-4 text-xs">
              {/* Date Input */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">{t("log.date")}</label>
                <input
                  type="date"
                  max={today}
                  value={obsForm.date}
                  onChange={(e) => setObsForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground font-semibold"
                />
              </div>

              {/* LH / OPK Test */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">{t("phase.lhTest")}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "none", label: t("phase.lhNone") },
                    { id: "negative", label: t("phase.lhNegative") },
                    { id: "faint", label: t("phase.lhFaint") },
                    { id: "positive", label: t("phase.lhPositive") },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setObsForm((f) => ({ ...f, testResult: opt.id }))}
                      className={cx(
                        "rounded-xl border p-2 text-center text-xs font-semibold transition-all",
                        obsForm.testResult === opt.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BBT Input */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">{t("phase.bbt")}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min={obsForm.bbtUnit === "F" ? 95 : 35}
                    max={obsForm.bbtUnit === "F" ? 104 : 41}
                    placeholder={obsForm.bbtUnit === "F" ? "97.8" : "36.6"}
                    value={obsForm.bbt != null ? obsForm.bbt : ""}
                    onChange={(e) =>
                      setObsForm((f) => ({
                        ...f,
                        bbt: e.target.value === "" ? null : parseFloat(e.target.value),
                      }))
                    }
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                  />
                  <div className="flex rounded-xl border border-border overflow-hidden bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setObsForm((f) => ({ ...f, bbtUnit: "C" }))}
                      className={cx(
                        "px-3 py-2 font-bold transition-colors",
                        obsForm.bbtUnit === "C"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground",
                      )}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => setObsForm((f) => ({ ...f, bbtUnit: "F" }))}
                      className={cx(
                        "px-3 py-2 font-bold transition-colors",
                        obsForm.bbtUnit === "F"
                          ? "bg-card text-foreground shadow-2xs"
                          : "text-muted-foreground",
                      )}
                    >
                      °F
                    </button>
                  </div>
                </div>
              </div>

              {/* Cervical Fluid */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  {t("phase.cervicalFluid")}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "none", label: t("phase.fluidDry") },
                    { id: "sticky", label: t("phase.fluidSticky") },
                    { id: "creamy", label: t("phase.fluidCreamy") },
                    { id: "eggwhite", label: t("phase.fluidEggwhite") },
                    { id: "watery", label: t("phase.fluidWatery") },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setObsForm((f) => ({ ...f, cervicalFluid: opt.id }))}
                      className={cx(
                        "rounded-xl border p-2 text-center text-xs font-semibold transition-all",
                        obsForm.cervicalFluid === opt.id
                          ? "bg-secondary text-secondary-foreground border-secondary shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">{t("log.notes")}</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={obsForm.notes}
                  onChange={(e) => setObsForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional observation notes..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-foreground text-xs"
                />
              </div>

              {/* Exclude Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={obsForm.excludedFromCalculations}
                  onChange={(e) =>
                    setObsForm((f) => ({ ...f, excludedFromCalculations: e.target.checked }))
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[11px] text-muted-foreground">
                  {t("phase.excludeFromCalc")}
                </span>
              </label>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                {record?.ovulationObservations?.[obsForm.date] ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteObservation(obsForm.date)}
                    className="rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-2 text-xs font-semibold"
                  >
                    {t("phase.deleteObservation")}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setObsModalOpen(false)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={obsSaving}
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-60"
                  >
                    {obsSaving ? t("common.saving") : t("common.save")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
