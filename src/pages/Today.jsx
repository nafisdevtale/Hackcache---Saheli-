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
  Bot,
  ShoppingBag,
  Film,
  MessageCircle,
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
import { StatCard, ActionCard, AiBadge } from "@/components/bloom/index.js";

export default function Today() {
  const app = useApp();
  const {
    t,
    fmt,
    fmtRange,
    analysis: a,
    cycleState,
    safety,
    record,
    today,
    fertilityVisible,
  } = app;
  const [missedAnswered, setMissedAnswered] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [quickLogTarget, setQuickLogTarget] = useState(null);
  const [customizing, setCustomizing] = useState(false);
  const [workingWidgets, setWorkingWidgets] = useState([]);
  const [customizeBusy, setCustomizeBusy] = useState(false);
  const [companion] = useState(() => loadCompanionState());

  const dayCount = Object.keys(record?.days || {}).length;
  const patterns = a?.periods ? symptomPatterns(record?.days || {}, a) : [];
  const insight = patterns[0]
    ? patternText(patterns[0], t)
    : a?.stats && a.stats.count >= 2
      ? t("today.insightStats", a.stats)
      : null;

  const currentDayEntry = record?.days?.[today];
  const isPeriodToday = currentDayEntry?.period || (a.currentCycleDay && a.currentCycleDay <= 5);
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. EDITORIAL HEADER & ACTION BAR                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {t(getGreetingKey())}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {fmt(today, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {t("today.title")}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {dayCount > 0 && (
            <button
              type="button"
              onClick={openCustomizer}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted/70 transition-all shadow-2xs cursor-pointer select-none tactile-press"
              aria-label={t("today.customize")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>{t("today.customize")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setQuickLogTarget(today)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-4 py-2 text-xs font-bold text-primary-foreground shadow-bloom-subtle hover:opacity-95 active:scale-98 transition-all cursor-pointer select-none"
          >
            <Droplet className="h-4 w-4 fill-current" />
            <span>{currentDayEntry ? t("log.editing") : t("today.logToday")}</span>
          </button>
        </div>
      </div>

      {/* Urgent Clinical Red Flags: Always pinned at the top */}
      {safety?.urgent?.map((c) => (
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
        <div className="space-y-6 sm:space-y-8">
          {/* ========================================================================= */}
          {/* TIER 1: HERO RHYTHM & CYCLE STATUS CARD                                  */}
          {/* ========================================================================= */}
          <section
            aria-label="Cycle Overview"
            className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-bloom-card"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              {/* Left Column: Rhythm Ring Visualizer */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-inline-end border-border/60 bg-gradient-to-b from-card via-card to-muted/20">
                <RhythmRing
                  analysis={a}
                  record={record}
                  onOpenLogger={(date) => setQuickLogTarget(date)}
                />
              </div>

              {/* Right Column: Cycle Status Details */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/15 text-primary border border-primary/25 px-3 py-1 text-xs font-bold">
                    {a?.currentCycleDay
                      ? t("today.cycleDay", { n: a.currentCycleDay })
                      : t("today.insufficient")}
                  </span>

                  {isPeriodToday && (
                    <span className="rounded-full bg-period/15 text-period border border-period/30 px-3 py-1 text-xs font-bold flex items-center gap-1">
                      🩸 {t("cal.periodDay")}
                    </span>
                  )}

                  <span className="rounded-full bg-secondary text-secondary-foreground border border-secondary-strong/20 px-3 py-1 text-xs font-semibold">
                    {cycleState?.activePhase === "follicular"
                      ? t("phase.follicular.title")
                      : cycleState?.activePhase === "luteal"
                        ? t("phase.luteal.title")
                        : t("phase.myPhaseTracker")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {a?.prediction
                      ? fmtRange(a.prediction.start, a.prediction.end)
                      : a?.status === "insufficient"
                        ? t("today.progressTitle")
                        : t("today.title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {a?.prediction
                      ? t("today.basedOn", { n: a.prediction.basedOn })
                      : a?.status === "insufficient"
                        ? t("today.progressDesc")
                        : t("today.welcomeSub")}
                  </p>
                </div>

                {/* Progress bar if insufficient cycles */}
                {a.status === "insufficient" && (
                  <div className="space-y-2 pt-1 max-w-md">
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
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {t("today.insufficientCount", { n: a.cycles.length })}
                    </p>
                  </div>
                )}

                {/* Fertility Estimate or Honest Suppression Disclosure */}
                {fertilityVisible && a.fertility && (
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("today.fertileWindow")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ±{a.prediction?.halfWidth} {t("insights.days")} {t("common.uncertainty")}
                      </span>
                    </div>
                    <p className="font-bold text-foreground text-xs sm:text-sm">
                      {fmtRange(a.fertility.fertile.start, a.fertility.fertile.end)}
                    </p>
                  </div>
                )}

                {/* Possible Missed Period Prompt */}
                {a.possibleMissedLog && !missedAnswered && (
                  <div className="rounded-2xl bg-accent p-3.5 text-accent-foreground text-xs space-y-2 border border-accent-strong/20">
                    <p className="font-semibold">
                      {t("today.missed", { n: diffDays(a.lastStart, today) })}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to="/calendar"
                        className="inline-flex min-h-9 items-center rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
                      >
                        {t("today.missedYes")}
                      </Link>
                      <Btn size="sm" variant="outline" onClick={() => setMissedAnswered(true)}>
                        {t("today.missedNo")}
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* TIER 2: PRIMARY ACTIONS TRIO (Today Log · Calendar Progress · Patterns)   */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 1. Today's Log Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-bloom-card transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-period/15 text-period">
                      <Droplet className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{t("today.loggedToday")}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickLogTarget(today)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {currentDayEntry ? t("log.editing") : `+ ${t("today.logToday")}`}
                  </button>
                </div>

                {currentDayEntry ? (
                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {currentDayEntry.period && (
                        <span className="rounded-lg bg-period/15 px-2 py-0.5 font-bold text-period">
                          🩸 {t(`flow.${currentDayEntry.flow || "medium"}`)}
                        </span>
                      )}
                      {currentDayEntry.pain > 0 && (
                        <span className="rounded-lg bg-destructive/15 px-2 py-0.5 font-bold text-destructive">
                          ⚡ {t("today.painLevel", { n: currentDayEntry.pain })}
                        </span>
                      )}
                      {currentDayEntry.mood && (
                        <span className="rounded-lg bg-secondary px-2 py-0.5 font-bold text-secondary-foreground">
                          ✨ {t(`mood.${currentDayEntry.mood}`)}
                        </span>
                      )}
                    </div>
                    {currentDayEntry.symptoms?.length > 0 && (
                      <p className="text-muted-foreground text-[11px] line-clamp-1">
                        {currentDayEntry.symptoms.map((s) => t(`sym.${s}`)).join(" • ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed py-2">
                    {t("today.notLoggedToday")}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border/40 mt-3">
                <button
                  type="button"
                  onClick={() => setQuickLogTarget(today)}
                  className="flex items-center justify-between w-full text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <span>{currentDayEntry ? t("log.editing") : t("today.startActionLog")}</span>
                  <ChevronRight className="h-4 w-4 rtl-mirror" />
                </button>
              </div>
            </div>

            {/* 2. Calendar Progress Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-bloom-card transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{t("cal.title")}</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {a?.stats?.median ? `${a.stats.median}d avg` : t("cal.title")}
                  </span>
                </div>

                <div className="space-y-1 py-1">
                  <p className="font-display text-xl font-bold text-foreground">
                    {a?.prediction
                      ? fmtRange(a.prediction.start, a.prediction.end)
                      : t("cal.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a?.lastStart
                      ? t("phase.startedOn", { date: fmt(a.lastStart) })
                      : t("today.noInsight")}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 mt-3">
                <Link
                  to="/calendar"
                  className="flex items-center justify-between w-full text-xs font-bold text-primary hover:underline"
                >
                  <span>{t("nav.calendar")}</span>
                  <ChevronRight className="h-4 w-4 rtl-mirror" />
                </Link>
              </div>
            </div>

            {/* 3. Symptom & Rhythm Insights Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-bloom-card transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-secondary-strong">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{t("today.insight")}</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {patterns[0] ? t("ins.patterns") : t("ins.title")}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 py-1">
                  {insight || t("today.noInsight")}
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 mt-3">
                <Link
                  to="/insights"
                  className="flex items-center justify-between w-full text-xs font-bold text-primary hover:underline"
                >
                  <span>{t("nav.insights")}</span>
                  <ChevronRight className="h-4 w-4 rtl-mirror" />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TIER 3: PERSONAL WELLNESS SANCTUARY DUO (Companion · Self Care)           */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Saheli Pet Companion Card */}
            <Link
              to="/companion"
              className="group flex flex-col justify-between rounded-3xl border border-period/30 bg-gradient-to-br from-card via-card to-period/10 p-5 shadow-bloom-card hover:border-period/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card border border-border/80 shadow-2xs overflow-hidden">
                  <PetArtwork
                    speciesId={companion.speciesId || "cat"}
                    growthStage={companion.growthStage || 1}
                    accessory={companion.accessory || "none"}
                    mood={companion.currentMood || "happy"}
                    size={52}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-period fill-period" />
                    <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {companion.isAdopted ? companion.name : t("companion.dashboardMeetTitle")}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {companion.isAdopted
                      ? `${t(`companion.species.${companion.speciesId}`)} • ${t(`companion.mood.${companion.currentMood}`)}`
                      : t("companion.dashboardMeetDesc")}
                  </p>
                  <span className="inline-block rounded-full bg-period/15 px-2.5 py-0.5 text-[10px] font-bold text-period">
                    {companion.isAdopted
                      ? `Level ${companion.growthStage || 1} Sanctuary`
                      : t("companion.adoptAction")}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs font-bold text-period">
                <span>
                  {companion.isAdopted ? t("companion.dashboardVisit") : t("companion.adoptAction")}
                </span>
                <ChevronRight className="h-4 w-4 rtl-mirror transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Self Care Sanctuary Card */}
            <Link
              to="/selfcare"
              className="group flex flex-col justify-between rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-secondary/20 p-5 shadow-bloom-card hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {t("selfcare.title")}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {t("selfcare.subtitle")}
                  </p>
                  <span className="inline-block rounded-full bg-secondary text-secondary-foreground border border-secondary-strong/20 px-2.5 py-0.5 text-[10px] font-bold">
                    Soundscapes • Breathing • Relief
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs font-bold text-primary">
                <span>{t("selfcare.exploreAll")}</span>
                <ChevronRight className="h-4 w-4 rtl-mirror transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* TIER 4: AI INTELLIGENCE SUITE (Diva Orchestrator + Specialists)           */}
          {/* ========================================================================= */}
          <section aria-label="AI Intelligence Suite" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("diva.title")} • Personal Intelligence
                </h2>
              </div>
              <Link to="/diva" className="text-xs font-bold text-primary hover:underline">
                {t("diva.exploreHub")}
              </Link>
            </div>

            {/* Central Diva Hero Card */}
            <Link
              to="/diva"
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-card to-accent/20 p-5 shadow-bloom-card hover:border-primary/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                      DIVA Central Assistant
                    </h3>
                    <span className="rounded-full bg-primary/15 text-primary px-2 py-0.2 text-[10px] font-extrabold uppercase">
                      Orchestrator
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    One conversation. Three specialists for Health, Essentials & Entertainment.
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-bloom-subtle group-hover:scale-102 transition-transform">
                {t("diva.openChat")}
              </span>
            </Link>

            {/* 3 Specialist Micro-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/ask"
                className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      EEVE
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{t("nav.ask")}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground rtl-mirror" />
              </Link>

              <Link
                to="/flash"
                className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400">
                      FLASH
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{t("nav.flash")}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground rtl-mirror" />
              </Link>

              <Link
                to="/instinct"
                className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                      INSTINCT
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{t("nav.instinct")}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground rtl-mirror" />
              </Link>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* TIER 5: CYCLE PHASE TRACKER & NOTICES                                      */}
          {/* ========================================================================= */}
          <section aria-label="Cycle Phase Tracking">
            <PhaseCards />
          </section>

          {/* Doctor Guidance Link if safety triggers exist */}
          {safety?.cards?.length > 0 && (
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
              <ChevronRight className="h-4 w-4 text-muted-foreground rtl-mirror" />
            </Link>
          )}

          {/* Active Upcoming Reminders List */}
          {activeReminders.length > 0 && (
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-2.5">
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMIZE DASHBOARD MODAL                                                 */}
      {/* ========================================================================= */}
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
      <p className="text-center text-[11px] text-muted-foreground/80 max-w-2xl mx-auto pt-2">
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
