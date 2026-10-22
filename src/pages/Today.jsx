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

  return (
    <div className="space-y-4">
      <PageTitle sub={fmt(today, { weekday: "long", day: "numeric", month: "long" })}>
        {t("today.title")}
      </PageTitle>

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
