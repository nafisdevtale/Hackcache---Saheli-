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
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Btn } from "@/components/common/ui.jsx";
import { UrgentCard, MoodSupport } from "@/components/common/GuidanceCard.jsx";
import { phaseKey, symptomPatterns } from "@/lib/cycle.js";
import { diffDays } from "@/lib/localDate.js";
import { patternText } from "@/components/insights/patternText.js";
import { RhythmRing } from "@/components/cycle/RhythmRing.jsx";
import { QuickLogSheet } from "@/components/logging/QuickLogSheet.jsx";

export default function Today() {
  const app = useApp();
  const { t, fmt, fmtRange, analysis: a, safety, record, today, fertilityVisible } = app;
  const [missedAnswered, setMissedAnswered] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [quickLogTarget, setQuickLogTarget] = useState(null);

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
        </div>
      </div>

      {/* Urgent Clinical Red Flags */}
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
        /* Reconstructed Responsive Layout: 2 Columns on Desktop */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Hero Section): Interactive Rhythm Ring Centerpiece */}
          <div className="lg:col-span-6 space-y-6">
            {/* The Rhythm Canvas Container */}
            <div className="rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/90 to-background/50 p-6 shadow-soft transition-all">
              <RhythmRing
                analysis={a}
                record={record}
                onOpenLogger={(date) => setQuickLogTarget(date)}
              />
            </div>

            {/* Today's Logged Summary Pill Area */}
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

            {/* Upcoming Active Reminders */}
            {activeReminders.length > 0 && (
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
            )}
          </div>

          {/* Right Column: Cycle Status, Next Window, Safety Guidance, and Insights */}
          <div className="lg:col-span-6 space-y-6">
            {/* Next Period & Cycle Progress Card */}
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

            {/* Fertility Window (Adult & Regular Only) */}
            {fertilityVisible && a.status === "ok" && (
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs text-xs space-y-2">
                {a.fertility ? (
                  <>
                    <p>
                      <strong>{t("today.fertileWindow")}:</strong>{" "}
                      {fmtRange(a.fertility.fertile.start, a.fertility.fertile.end)}
                    </p>
                    <p>
                      <strong>{t("today.ovulation")}:</strong>{" "}
                      {fmtRange(a.fertility.ovulation.start, a.fertility.ovulation.end)}
                    </p>
                    <p className="mt-2 rounded-xl bg-muted/70 p-2.5 text-[11px] font-semibold text-muted-foreground leading-snug">
                      {t("common.fertilityDisclaimer")}
                    </p>
                  </>
                ) : (
                  <p>{t("today.fertilityIrregular")}</p>
                )}
              </div>
            )}

            {/* Mood Support / Emotional Wellness */}
            <MoodSupport mood={safety.mood} />

            {/* Doctor Consultation Guide Link */}
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

            {/* Personalized Cycle Insights */}
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

            {/* Health & Doctor Care Shortcuts */}
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
