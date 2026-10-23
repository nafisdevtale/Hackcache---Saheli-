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
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Btn } from "@/components/common/ui.jsx";
import { UrgentCard, MoodSupport } from "@/components/common/GuidanceCard.jsx";
import { phaseKey, symptomPatterns } from "@/lib/cycle.js";
import { diffDays } from "@/lib/localDate.js";
import { patternText } from "@/components/insights/patternText.js";

export default function Today() {
  const app = useApp();
  const { t, fmt, fmtRange, analysis: a, safety, record, today, fertilityVisible } = app;
  const [missedAnswered, setMissedAnswered] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t(getGreetingKey())}
          </span>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("today.title")}</h1>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {fmt(today, { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </div>

      {safety.urgent.map((c) => (
        <UrgentCard key={c.id} card={c} />
      ))}

      {/* Fresh / Empty Diary Welcome State */}
      {dayCount === 0 ? (
        <Card className="border-2 border-primary/20 bg-hero p-5 text-center">
          <HeartHandshake aria-hidden className="mx-auto h-12 w-12 text-primary" />
          <h2 className="font-display mt-2 text-2xl font-bold text-foreground">
            {t("today.welcomeTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("today.welcomeSub")}</p>

          <div className="mt-5 space-y-2.5 text-left">
            <Link
              to="/log"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <PenLine aria-hidden className="h-5 w-5" />
              <span>{t("today.startActionLog")}</span>
            </Link>

            <Link
              to="/calendar"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-4 font-semibold hover:bg-muted"
            >
              <CalendarDays aria-hidden className="h-5 w-5 text-primary" />
              <span>{t("today.startActionPast")}</span>
            </Link>

            <Link
              to="/learn"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-4 font-semibold hover:bg-muted"
            >
              <BookOpen aria-hidden className="h-5 w-5 text-primary" />
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
              className="flex min-h-12 w-full items-center justify-center gap-2"
            >
              <Sparkles aria-hidden className="h-5 w-5 text-primary" />
              <span>{demoBusy ? t("set.working") : t("today.startActionDemo")}</span>
            </Btn>
          </div>
        </Card>
      ) : (
        <>
          {/* Main Hero Card */}
          <Card className="bg-hero">
            {a.currentCycleDay && a.status !== "paused" && (
              <p className="font-display text-4xl font-bold text-primary">
                {t("today.cycleDay", { n: a.currentCycleDay })}
              </p>
            )}
            <p className="mt-2 text-lg">{t(phaseKey(a, today))}</p>
            <Link
              to="/log"
              className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-lg font-bold text-primary-foreground hover:bg-primary/90"
            >
              <PenLine aria-hidden className="h-6 w-6" /> {t("today.logToday")}
            </Link>
          </Card>

          {/* Today's Logged Summary Card */}
          <Card className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">{t("today.loggedToday")}</h2>
              <Link to="/log" className="text-xs font-semibold text-primary hover:underline">
                {currentDayEntry ? t("log.editing") : t("today.logToday")}
              </Link>
            </div>
            {currentDayEntry ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  {currentDayEntry.period && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-period/15 px-2.5 py-1 font-bold text-period">
                      🩸 {t(`flow.${currentDayEntry.flow || "medium"}`)}
                    </span>
                  )}
                  {currentDayEntry.pain > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 px-2.5 py-1 font-semibold text-destructive">
                      ⚡ {t("today.painLevel", { n: currentDayEntry.pain })}
                    </span>
                  )}
                  {currentDayEntry.mood && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
                      ✨ {t(`mood.${currentDayEntry.mood}`)}
                    </span>
                  )}
                </div>
                {currentDayEntry.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentDayEntry.symptoms.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {t(`sym.${s}`)}
                      </span>
                    ))}
                  </div>
                )}
                {currentDayEntry.note && (
                  <p className="border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">
                    "{currentDayEntry.note}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("today.notLoggedToday")}</p>
            )}
          </Card>

          {/* Upcoming Active Reminders */}
          {activeReminders.length > 0 && (
            <Card className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("today.upcomingReminders")}
              </h2>
              <div className="space-y-1 text-xs">
                {activeReminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1">
                    <span className="font-medium text-foreground">{r.label}</span>
                    {r.time && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                        {r.time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Next Period & Cycle Progress Card */}
          <Card>
            <h2 className="text-xl font-bold">{t("today.next")}</h2>
            {a.status === "paused" && <p className="mt-1">{t("today.paused")}</p>}
            {a.status === "insufficient" && (
              <div className="mt-2 space-y-2">
                <p className="text-base font-semibold">{t("today.progressTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("today.progressDesc")}</p>

                <div className="mt-2 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-muted">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all ${
                        step <= a.cycles.length ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("today.insufficientCount", { n: a.cycles.length })}
                </p>
              </div>
            )}
            {a.prediction && (
              <>
                <p className="mt-1">
                  <span className="mr-2 rounded-full border-2 border-dashed border-primary px-2 py-0.5 text-sm font-bold uppercase text-primary">
                    {t("common.estimate")}
                  </span>
                </p>
                <p className="mt-2 font-display text-2xl font-bold">
                  {fmtRange(a.prediction.start, a.prediction.end)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("today.basedOn", { n: a.prediction.basedOn })}
                </p>
                {a.irregular && (
                  <p className="mt-2">
                    {t("today.irregularNote")}{" "}
                    <Link to="/doctor" className="font-semibold underline">
                      {t("today.whenDoctor")}
                    </Link>
                  </p>
                )}
              </>
            )}
            {a.possibleMissedLog && !missedAnswered && (
              <div className="mt-3 rounded-xl bg-accent p-3 text-accent-foreground">
                <p>{t("today.missed", { n: diffDays(a.lastStart, today) })}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    to="/calendar"
                    className="inline-flex min-h-12 items-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground"
                  >
                    {t("today.missedYes")}
                  </Link>
                  <Btn variant="outline" onClick={() => setMissedAnswered(true)}>
                    {t("today.missedNo")}
                  </Btn>
                </div>
              </div>
            )}
            {missedAnswered && (
              <p className="mt-2 rounded-xl bg-muted p-3">{t("today.missedNoNote")}</p>
            )}
          </Card>
        </>
      )}

      {fertilityVisible && a.status === "ok" && (
        <Card>
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
              <p className="mt-2 rounded-lg bg-muted p-2 font-semibold">
                {t("common.fertilityDisclaimer")}
              </p>
            </>
          ) : (
            <p>{t("today.fertilityIrregular")}</p>
          )}
        </Card>
      )}

      <MoodSupport mood={safety.mood} />

      {safety.cards.length > 0 && (
        <Link
          to="/doctor"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-info bg-card p-4 font-semibold"
        >
          <Stethoscope aria-hidden className="h-6 w-6 text-info-foreground" />{" "}
          {t("today.guidanceCount", { n: safety.cards.length })} →
        </Link>
      )}

      {/* Insights Card */}
      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles aria-hidden className="h-5 w-5" /> {t("today.insight")}
        </h2>
        <p className="mt-1">{insight || t("today.noInsight")}</p>
      </Card>

      {/* Helpful Educational Shortcuts */}
      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t("today.quickLinks")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(isPeriodToday || hasPain) && (
            <Link
              to="/learn"
              className="flex min-h-12 items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted"
            >
              <BookOpen aria-hidden className="h-4 w-4 text-primary" />
              <span>{t("today.linkPeriodCare")}</span>
            </Link>
          )}

          {a.irregular && (
            <Link
              to="/learn"
              className="flex min-h-12 items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted"
            >
              <BookOpen aria-hidden className="h-4 w-4 text-primary" />
              <span>{t("today.linkWhyLate")}</span>
            </Link>
          )}

          <Link
            to="/doctor"
            className="flex min-h-12 items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted"
          >
            <Stethoscope aria-hidden className="h-4 w-4 text-primary" />
            <span>{t("today.linkDoctorGuide")}</span>
          </Link>

          <Link
            to="/visit"
            className="flex min-h-12 items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted"
          >
            <FileText aria-hidden className="h-4 w-4 text-primary" />
            <span>{t("today.linkVisitSummary")}</span>
          </Link>

          <Link
            to="/ask"
            className="flex min-h-12 items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted"
          >
            <HelpCircle aria-hidden className="h-4 w-4 text-primary" />
            <span>{t("today.startActionAsk")}</span>
          </Link>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">{t("common.disclaimer")}</p>
    </div>
  );
}
