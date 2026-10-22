import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PenLine, Stethoscope, Sparkles } from "lucide-react";
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
  const patterns = symptomPatterns(record.days, a);
  const insight = patterns[0]
    ? patternText(patterns[0], t)
    : a.stats && a.stats.count >= 2
      ? t("today.insightStats", a.stats)
      : null;

  return (
    <div className="space-y-4">
      <PageTitle sub={fmt(today, { weekday: "long", day: "numeric", month: "long" })}>
        {t("today.title")}
      </PageTitle>

      {safety.urgent.map((c) => (
        <UrgentCard key={c.id} card={c} />
      ))}

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

      <Card>
        <h2 className="text-xl font-bold">{t("today.next")}</h2>
        {a.status === "paused" && <p className="mt-1">{t("today.paused")}</p>}
        {a.status === "insufficient" && (
          <>
            <p className="mt-1 text-lg font-semibold">{t("today.insufficient")}</p>
            <p className="text-muted-foreground">
              {t("today.insufficientCount", { n: a.cycles.length })}
            </p>
          </>
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

      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles aria-hidden className="h-5 w-5" /> {t("today.insight")}
        </h2>
        <p className="mt-1">{insight || t("today.noInsight")}</p>
      </Card>

      <p className="text-sm text-muted-foreground">{t("common.disclaimer")}</p>
    </div>
  );
}
