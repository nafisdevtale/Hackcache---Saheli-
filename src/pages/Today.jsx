import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  PenLine,
  Stethoscope,
  Sparkles,
  CalendarDays,
  BookOpen,
  HelpCircle,
  FileText,
  HeartHandshake,
  Clock,
  ChevronRight,
  Droplet,
  Info,
  Heart,
  TrendingUp,
  Activity,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Btn } from "@/components/common/ui.jsx";
import { UrgentCard, MoodSupport } from "@/components/common/GuidanceCard.jsx";
import { phaseKey, symptomPatterns, getFertilitySuppressionMessageKey } from "@/lib/cycle.js";
import { diffDays } from "@/lib/localDate.js";
import { patternText } from "@/components/insights/patternText.js";
import { RhythmRing } from "@/components/cycle/RhythmRing.jsx";
import { QuickLogSheet } from "@/components/logging/QuickLogSheet.jsx";
import { DEFAULT_DASHBOARD_WIDGETS } from "@/lib/exportImport.js";
import { loadCompanionState } from "@/lib/companionStorage.js";
import { PetArtwork } from "@/components/companion/PetArtwork.jsx";
import { PhaseCards } from "@/components/cycle/PhaseCards.jsx";

export default function Today() {
  const app = useApp();
  const { t, fmt, fmtRange, analysis: a, safety, record, today, fertilityVisible } = app;
  const [missedAnswered, setMissedAnswered] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [quickLogTarget, setQuickLogTarget] = useState(null);
  const [customizing, setCustomizing] = useState(false);
  const [workingWidgets, setWorkingWidgets] = useState([]);
  const [customizeBusy, setCustomizeBusy] = useState(false);
  const [companion] = useState(() => loadCompanionState());

  const dayCount = Object.keys(record?.days || {}).length;
  const patterns = symptomPatterns(record?.days || {}, a);
  const insight = patterns[0]
    ? patternText(patterns[0], t)
    : a.stats && a.stats.count >= 2
      ? t("today.insightStats", a.stats)
      : null;

  const currentDayEntry = record?.days?.[today];
  const isPeriodToday = currentDayEntry?.period || a.currentCycleDay <= 5;
  const hasPain = (currentDayEntry?.pain || 0) > 0 || currentDayEntry?.symptoms?.includes("cramps");

  const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "today.greetingMorning";
    if (hour >= 12 && hour < 17) return "today.greetingAfternoon";
    if (hour >= 17 && hour < 22) return "today.greetingEvening";
    return "today.greetingGeneral";
  };

  const activeReminders = [];
  if (record?.reminders?.daily?.on) {
    activeReminders.push({ id: "daily", label: t("rem.daily"), time: record.reminders.daily.time });
  }
  if (record?.reminders?.nextPeriod) {
    activeReminders.push({ id: "period", label: t("rem.nextPeriod") });
  }

  const openCustomizer = () => {
    const list = Array.isArray(record?.settings?.dashboardWidgets)
      ? record.settings.dashboardWidgets
      : DEFAULT_DASHBOARD_WIDGETS;
    setWorkingWidgets(list.map((w) => ({ ...w })));
    setCustomizing(true);
  };

  const moveWidget = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= workingWidgets.length) return;
    const next = [...workingWidgets];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setWorkingWidgets(next);
  };

  const toggleWidget = (id) => {
    setWorkingWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const saveWidgets = async () => {
    setCustomizeBusy(true);
    try {
      await app.update((r) => ({
        ...r,
        settings: { ...r.settings, dashboardWidgets: workingWidgets },
      }));
      setCustomizing(false);
    } finally {
      setCustomizeBusy(false);
    }
  };

  const resetWidgets = () => {
    setWorkingWidgets(DEFAULT_DASHBOARD_WIDGETS.map((w) => ({ ...w })));
  };

  const activeWidgets = Array.isArray(record?.settings?.dashboardWidgets)
    ? record.settings.dashboardWidgets
    : DEFAULT_DASHBOARD_WIDGETS;
  const visibleWidgets = activeWidgets.filter((w) => w.visible);

  const renderWidget = (id) => {
    switch (id) {
      case "rhythmRing":
        return (
          <div className="rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/90 to-background/50 p-6 shadow-soft transition-all">
            <RhythmRing
              analysis={a}
              record={record}
              onOpenLogger={(date) => setQuickLogTarget(date)}
            />
          </div>
        );

      case "phaseTracker":
        return <PhaseCards />;

      case "todayLog":
        return (
          <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {t("today.loggedToday")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setQuickLogTarget(today)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {currentDayEntry ? t("log.editing") : `+ ${t("today.logToday")}`}
              </button>
            </div>

            {currentDayEntry ? (
              <div className="space-y-3 pt-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {currentDayEntry.period && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-period/15 px-3 py-1 font-bold text-period shadow-2xs">
                      🩸 {t(`flow.${currentDayEntry.flow || "medium"}`)}
                    </span>
                  )}
                  {currentDayEntry.pain > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/15 px-3 py-1 font-semibold text-destructive shadow-2xs">
                      ⚡ {t("today.painLevel", { n: currentDayEntry.pain })}
                    </span>
                  )}
                  {currentDayEntry.mood && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1 font-semibold text-secondary-foreground shadow-2xs">
                      ✨ {t(`mood.${currentDayEntry.mood}`)}
                    </span>
                  )}
                </div>

                {currentDayEntry.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentDayEntry.symptoms.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {t(`sym.${s}`)}
                      </span>
                    ))}
                  </div>
                )}

                {currentDayEntry.note && (
                  <p className="border-l-2 border-primary/50 pl-3 py-0.5 text-xs italic text-muted-foreground">
                    "{currentDayEntry.note}"
                  </p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground">{t("today.notLoggedToday")}</p>
                <button
                  type="button"
                  onClick={() => setQuickLogTarget(today)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <span>{t("today.startActionLog")}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );

      case "reminders":
        if (activeReminders.length === 0) return null;
        return (
          <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{t("today.upcomingReminders")}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {activeReminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-none"
                >
                  <span className="font-semibold text-foreground">{r.label}</span>
                  {r.time && (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {r.time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "nextPeriod":
        return (
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("today.next")}
              </h2>
              {a.prediction && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>{t("common.estimate")}</span>
                </span>
              )}
            </div>

            {a.status === "paused" && (
              <p className="text-sm text-muted-foreground">{t("today.paused")}</p>
            )}

            {a.status === "insufficient" && (
              <div className="space-y-3 pt-1">
                <p className="text-base font-bold text-foreground">{t("today.progressTitle")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("today.progressDesc")}
                </p>

                <div className="flex h-2.5 w-full gap-1.5 overflow-hidden rounded-full bg-muted">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all ${
                        step <= a.cycles.length ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("today.insufficientCount", { n: a.cycles.length })}
                </p>
              </div>
            )}

            {a.prediction && (
              <div className="space-y-2 pt-1">
                <p className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  {fmtRange(a.prediction.start, a.prediction.end)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("today.basedOn", { n: a.prediction.basedOn })}
                </p>
                {a.irregular && (
                  <div className="mt-2 text-xs text-muted-foreground rounded-2xl bg-muted/60 p-3 leading-relaxed">
                    {t("today.irregularNote")}{" "}
                    <Link to="/doctor" className="font-bold underline text-primary">
                      {t("today.whenDoctor")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {a.possibleMissedLog && !missedAnswered && (
              <div className="mt-4 rounded-2xl bg-accent p-4 text-accent-foreground text-xs space-y-2.5">
                <p className="font-medium">
                  {t("today.missed", { n: diffDays(a.lastStart, today) })}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    to="/calendar"
                    className="inline-flex min-h-10 items-center rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
                  >
                    {t("today.missedYes")}
                  </Link>
                  <Btn size="sm" variant="outline" onClick={() => setMissedAnswered(true)}>
                    {t("today.missedNo")}
                  </Btn>
                </div>
              </div>
            )}

            {missedAnswered && (
              <p className="mt-3 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                {t("today.missedNoNote")}
              </p>
            )}
          </div>
        );

      case "fertility":
        return (
          <div className="space-y-4">
            {fertilityVisible && (
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs text-xs space-y-3">
                {a?.fertility ? (
                  <>
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {t("today.fertileWindow")}
                      </span>
                      <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold">
                        {t("common.estimate")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3 space-y-1">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                          {t("today.fertileWindow")}
                        </span>
                        <p className="text-xs font-bold text-foreground">
                          {fmtRange(a.fertility.fertile.start, a.fertility.fertile.end)}
                        </p>
                        <span className="text-[10px] text-muted-foreground block">
                          ±{a.prediction.halfWidth} {t("insights.days")} {t("common.uncertainty")}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-secondary/15 border border-secondary/30 p-3 space-y-1">
                        <span className="text-[11px] font-bold text-secondary-strong uppercase tracking-wider block">
                          {t("today.ovulation")}
                        </span>
                        <p className="text-xs font-bold text-foreground">
                          {fmtRange(a.fertility.ovulation.start, a.fertility.ovulation.end)}
                        </p>
                        <span className="text-[10px] text-muted-foreground block">
                          {t("today.basedOn", { n: a.prediction.basedOn })}
                        </span>
                      </div>
                    </div>

                    {/* Educational Context & Non-Contraceptive Limitation */}
                    <div className="mt-2 rounded-2xl bg-muted/70 p-3 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        {t("common.fertilityDisclaimer")}
                      </p>
                      <p>{t("today.fertility.eduNote")}</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground leading-relaxed">
                      {t(getFertilitySuppressionMessageKey(a?.fertilitySuppressionReason))}
                    </p>
                    {a?.fertilitySuppressionReason === "adolescent_safeguard" ? (
                      <div className="rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                          {t("today.fertility.adolescentTitle")}
                        </p>
                        <p className="font-medium text-foreground">
                          {t("today.fertility.adolescentEdu")}
                        </p>
                        <p>{t("today.fertility.adolescentEduDesc")}</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-muted/50 p-2.5 text-[11px] text-muted-foreground space-y-0.5">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {t("today.fertility.eduTitle")}
                        </p>
                        <p>{t("today.fertility.eduGeneral")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prominent My Phase Tracker */}
            <PhaseCards />

            {/* Developer Diagnostics View (Strictly Dev / Debug only) */}
            {typeof window !== "undefined" &&
              (window.__SAHELI_DEV_DIAGNOSTICS__ === true ||
                new URLSearchParams(window.location.search).get("debug") === "1" ||
                (typeof process !== "undefined" && process.env?.NODE_ENV === "development") ||
                !!import.meta.env?.DEV) &&
              a?.diagnosticInfo && (
                <div
                  data-testid="dev-fertility-diagnostics"
                  className="rounded-3xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 p-4 text-xs font-mono space-y-2 text-foreground"
                >
                  <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4" />
                      DEV DIAGNOSTICS: FERTILITY ENGINE
                    </span>
                    <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {a.diagnosticInfo.fertilityStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Calc version:</strong>{" "}
                      {a.diagnosticInfo.calculationVersion}
                    </div>
                    <div>
                      <strong className="text-foreground">Input validity:</strong>{" "}
                      {a.diagnosticInfo.inputValidity ? "Valid" : "Invalid"}
                    </div>
                    <div>
                      <strong className="text-foreground">Eligibility:</strong>{" "}
                      {a.diagnosticInfo.eligibilityStatus}
                    </div>
                    <div>
                      <strong className="text-foreground">Cycles considered:</strong>{" "}
                      {a.diagnosticInfo.cyclesConsidered}
                    </div>
                    <div>
                      <strong className="text-foreground">Cycle lengths:</strong> [
                      {a.diagnosticInfo.cycleLengths.join(", ") || "none"}]
                    </div>
                    <div>
                      <strong className="text-foreground">Variation (spread):</strong>{" "}
                      {a.diagnosticInfo.variationMeasure} days
                    </div>
                    <div>
                      <strong className="text-foreground">Active age band:</strong>{" "}
                      {a.diagnosticInfo.activeAgeBand}
                    </div>
                    <div>
                      <strong className="text-foreground">Estimation pref:</strong>{" "}
                      {a.diagnosticInfo.estimationPreference ? "Enabled" : "Disabled"}
                    </div>
                    <div>
                      <strong className="text-foreground">Pregnancy mode:</strong>{" "}
                      {a.diagnosticInfo.pregnancyMode ? "Active" : "Inactive"}
                    </div>
                    <div className="sm:col-span-2">
                      <strong className="text-foreground">Suppression reason:</strong>{" "}
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {a.diagnosticInfo.suppressionReason || "none (estimate available)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case "learning":
        return (
          <div className="space-y-4">
            <MoodSupport mood={safety.mood} />
            {safety.cards.length > 0 && (
              <Link
                to="/doctor"
                className="flex min-h-14 items-center justify-between gap-3 rounded-3xl border-2 border-info bg-card p-4 font-semibold text-xs shadow-xs hover:bg-info/5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope aria-hidden className="h-5 w-5 text-info-foreground" />
                  <span className="text-sm font-bold text-foreground">
                    {t("today.guidanceCount", { n: safety.cards.length })}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}

            <Link
              to="/selfcare"
              className="group flex items-center justify-between gap-3 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-secondary/15 p-4 text-xs shadow-xs hover:border-primary/40 hover:bg-muted/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    {t("selfcare.title")}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-1">
                    {t("selfcare.subtitle")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-xl bg-primary px-3 py-1.5 font-bold text-primary-foreground shadow-2xs group-hover:scale-102 transition-transform">
                {t("selfcare.exploreAll")}
              </span>
            </Link>

            {/* My Saheli Companion Card */}
            <Link
              to="/companion"
              className="group flex items-center justify-between gap-3 rounded-3xl border border-period/30 bg-gradient-to-r from-period/10 via-card to-primary/10 p-4 text-xs shadow-xs hover:border-period/50 hover:bg-muted/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card border border-border/80 shadow-2xs overflow-hidden">
                  <PetArtwork
                    speciesId={companion.speciesId || "cat"}
                    growthStage={companion.growthStage || 1}
                    accessory={companion.accessory || "none"}
                    mood={companion.currentMood || "happy"}
                    size={42}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-period fill-period" />
                    <span>
                      {companion.isAdopted ? companion.name : t("companion.dashboardMeetTitle")}
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-1">
                    {companion.isAdopted
                      ? `${t(`companion.species.${companion.speciesId}`)} • ${t(`companion.mood.${companion.currentMood}`)}`
                      : t("companion.dashboardMeetDesc")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-xl bg-period/15 text-period px-3 py-1.5 font-bold shadow-2xs group-hover:scale-102 transition-transform">
                {companion.isAdopted ? t("companion.dashboardVisit") : t("companion.adoptAction")}
              </span>
            </Link>
          </div>
        );

      case "insights":
        return (
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("today.insight")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {insight || t("today.noInsight")}
            </p>
          </div>
        );

      case "doctorShortcuts":
        return (
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("today.quickLinks")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(isPeriodToday || hasPain) && (
                <Link
                  to="/learn"
                  className="flex items-center gap-2.5 rounded-2xl border border-border p-3 text-xs font-semibold hover:bg-muted transition-all"
                >
                  <BookOpen aria-hidden className="h-4 w-4 text-primary shrink-0" />
                  <span>{t("today.linkPeriodCare")}</span>
                </Link>
              )}

              {a.irregular && (
                <Link
                  to="/learn"
                  className="flex items-center gap-2.5 rounded-2xl border border-border p-3 text-xs font-semibold hover:bg-muted transition-all"
                >
                  <BookOpen aria-hidden className="h-4 w-4 text-primary shrink-0" />
                  <span>{t("today.linkWhyLate")}</span>
                </Link>
              )}

              <Link
                to="/doctor"
                className="flex items-center gap-2.5 rounded-2xl border border-border p-3 text-xs font-semibold hover:bg-muted transition-all"
              >
                <Stethoscope aria-hidden className="h-4 w-4 text-primary shrink-0" />
                <span>{t("today.linkDoctorGuide")}</span>
              </Link>

              <Link
                to="/visit"
                className="flex items-center gap-2.5 rounded-2xl border border-border p-3 text-xs font-semibold hover:bg-muted transition-all"
              >
                <FileText aria-hidden className="h-4 w-4 text-primary shrink-0" />
                <span>{t("today.linkVisitSummary")}</span>
              </Link>

              <Link
                to="/ask"
                className="flex items-center gap-2.5 rounded-2xl border border-border p-3 text-xs font-semibold hover:bg-muted transition-all"
              >
                <HelpCircle aria-hidden className="h-4 w-4 text-primary shrink-0" />
                <span>{t("today.startActionAsk")}</span>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Editorial Page Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {t(getGreetingKey())}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {t("today.title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-card border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs">
            {fmt(today, { weekday: "long", day: "numeric", month: "short" })}
          </span>
          {dayCount > 0 && (
            <button
              type="button"
              onClick={openCustomizer}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all shadow-2xs"
              aria-label={t("today.customize")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>{t("today.customize")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Urgent Clinical Red Flags: Always pinned at the top */}
      {safety.urgent.map((c) => (
        <UrgentCard key={c.id} card={c} />
      ))}

      {/* Fresh / Empty Diary Welcome State */}
      {dayCount === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border-2 border-primary/20 bg-hero p-8 text-center shadow-soft space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <HeartHandshake aria-hidden className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("today.welcomeTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t("today.welcomeSub")}
            </p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto text-left">
            <button
              type="button"
              onClick={() => setQuickLogTarget(today)}
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-5 font-bold text-sm text-primary-foreground shadow-md hover:opacity-95 transition-all active:scale-98"
            >
              <PenLine aria-hidden className="h-4 w-4" />
              <span>{t("today.startActionLog")}</span>
            </button>

            <Link
              to="/calendar"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-4 font-semibold text-sm hover:bg-muted transition-all"
            >
              <CalendarDays aria-hidden className="h-4 w-4 text-primary" />
              <span>{t("today.startActionPast")}</span>
            </Link>

            <Link
              to="/learn"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-4 font-semibold text-sm hover:bg-muted transition-all"
            >
              <BookOpen aria-hidden className="h-4 w-4 text-primary" />
              <span>{t("today.startActionLearn")}</span>
            </Link>

            <Btn
              variant="outline"
              disabled={demoBusy}
              onClick={async () => {
                setDemoBusy(true);
                try {
                  await app.tryDemo();
                } catch {
                  setDemoBusy(false);
                }
              }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-xs font-semibold"
            >
              <Sparkles aria-hidden className="h-4 w-4 text-primary" />
              <span>{demoBusy ? t("set.working") : t("today.startActionDemo")}</span>
            </Btn>
          </div>
        </div>
      ) : (
        /* Reconstructed Responsive Layout: User-Customizable Dynamic Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {visibleWidgets.map((w) => {
            const content = renderWidget(w.id);
            if (!content) return null;
            return (
              <div key={w.id} data-widget={w.id} className="w-full">
                {content}
              </div>
            );
          })}
        </div>
      )}

      {/* Customize Dashboard Modal */}
      {customizing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-title"
          data-testid="dashboard-customize-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h2 id="customize-title" className="text-base sm:text-lg font-bold text-foreground">
                  {t("today.customize")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("today.customizeDesc")}</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizing(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto p-1">
              {workingWidgets.map((w, idx) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl border border-border/70 bg-muted/30 text-xs"
                >
                  <label className="flex items-center gap-2.5 font-semibold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={w.visible}
                      onChange={() => toggleWidget(w.id)}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    <span>{t(`today.widget.${w.id}`)}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveWidget(idx, idx - 1)}
                      aria-label={`${t("today.moveUp")} ${t(`today.widget.${w.id}`)}`}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === workingWidgets.length - 1}
                      onClick={() => moveWidget(idx, idx + 1)}
                      aria-label={`${t("today.moveDown")} ${t(`today.widget.${w.id}`)}`}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={resetWidgets}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t("today.resetDefaults")}</span>
              </button>

              <div className="flex gap-2">
                <Btn variant="outline" size="sm" onClick={() => setCustomizing(false)}>
                  {t("common.cancel")}
                </Btn>
                <Btn size="sm" disabled={customizeBusy} onClick={saveWidgets}>
                  {customizeBusy ? t("set.working") : t("common.save")}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Informational Disclaimer */}
      <p className="text-center text-[11px] text-muted-foreground/80 max-w-2xl mx-auto pt-4">
        {t("common.disclaimer")}
      </p>

      {/* Interactive Quick Log Sheet from Today */}
      <QuickLogSheet
        isOpen={!!quickLogTarget}
        onClose={() => setQuickLogTarget(null)}
        targetDate={quickLogTarget || today}
      />
    </div>
  );
}
