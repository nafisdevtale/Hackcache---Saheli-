import { Link } from "@tanstack/react-router";
import {
  Calendar,
  AlertCircle,
  Clock,
  Activity,
  FileText,
  ChevronRight,
  Info,
  ShieldAlert,
  Heart,
  Droplets,
  Stethoscope,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Chip } from "@/components/common/ui.jsx";
import { BarChart } from "@/components/insights/BarChart.jsx";
import { patternText } from "@/components/insights/patternText.js";
import { computeCycleInsights } from "@/lib/insights.js";
import { CONFIG, EMERGENCY } from "@/config.js";

export default function Insights() {
  const { t, fmt, fmtRange, analysis: a, record, prefs, today } = useApp();

  const insights = computeCycleInsights({
    record,
    analysis: a,
    today,
  });

  const { limits } = insights;
  const spread = insights.cycleSpread;

  return (
    <div className="space-y-4">
      <PageTitle>{prefs.discreet ? t("app.discreetName") : t("ins.title")}</PageTitle>

      {/* Empty state: No complete cycles yet */}
      {insights.totalCyclesCount === 0 ? (
        <Card className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="mt-1 h-6 w-6 text-primary shrink-0" aria-hidden />
            <div>
              <h2 className="text-lg font-bold">{t("ins.title")}</h2>
              <p className="mt-1 text-muted-foreground">{t("ins.noData")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("ins.insufficientSubtitle")}</p>
            </div>
          </div>
          <Link
            to="/log"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-primary-foreground hover:bg-primary/90"
          >
            {t("cal.addEntry")}
          </Link>
        </Card>
      ) : (
        <>
          {/* Section 1: Overview Summary Cards */}
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("ins.medianCycle")}</p>
                <p className="font-display text-3xl font-bold">
                  {insights.medianCycle ? t("common.days", { n: insights.medianCycle }) : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ins.range")}: {insights.minCycle}–{insights.maxCycle} d
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("ins.medianPeriod")}</p>
                <p className="font-display text-3xl font-bold">
                  {insights.medianPeriod ? t("common.days", { n: insights.medianPeriod }) : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ins.range")}: {insights.minPeriod}–{insights.maxPeriod} d
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                {t("ins.basedOnCycles", { n: insights.recentCycles.length })}
              </p>
              <p className="mt-1 text-sm font-medium">
                {insights.recentCycles.length < CONFIG.minCyclesForPrediction
                  ? t("reg.insufficient")
                  : insights.isIrregular
                    ? insights.irregularReason === "range"
                      ? t("reg.outside", { min: limits.minLen, max: limits.maxLen })
                      : t("reg.irregular", { spread })
                    : t("reg.regular", { spread })}
              </p>
              {a.currentCycleDay && !insights.isPaused && (
                <p className="mt-2 text-xs font-semibold text-primary">
                  {t("ins.currentCycle", { day: a.currentCycleDay })}
                </p>
              )}
            </div>
          </Card>

          {/* Section 2: Future Estimate & Uncertainty Representation */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold">{t("ins.nextWindow")}</h2>
            </div>

            {insights.isEstimateAvailable ? (
              <div className="space-y-2">
                <div className="rounded-xl bg-card p-3 border border-border">
                  <p className="font-display text-2xl font-bold text-primary">
                    {fmtRange(insights.estimateWindow.start, insights.estimateWindow.end)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("ins.nextWindowDesc", {
                      start: fmt(insights.estimateWindow.start, { month: "short", day: "numeric" }),
                      end: fmt(insights.estimateWindow.end, { month: "short", day: "numeric" }),
                      days: insights.estimateWindow.windowDays,
                    })}
                  </p>
                  {insights.estimateWindow.isWidened && (
                    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                      {t("ins.windowWidenedIrregular", {
                        extra: CONFIG.irregularExtraDays,
                        spread,
                      })}
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">{t("ins.historyVsEstimate")}</p>
                  <p>{t("ins.historyVsEstimateDesc")}</p>
                  <p className="font-bold text-destructive">{t("ins.notContraception")}</p>
                </div>
              </div>
            ) : insights.isPaused ? (
              <p className="text-sm text-muted-foreground">{t("today.paused")}</p>
            ) : (
              <div className="rounded-xl bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-semibold">
                  {t("ins.insufficientForEstimate", {
                    min: CONFIG.minCyclesForPrediction,
                    count: insights.recentCycles.length,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{t("ins.insufficientSubtitle")}</p>
              </div>
            )}
          </Card>

          {/* Section 3: Visual Charts */}
          <Card>
            <h2 className="text-lg font-bold">{t("ins.cycleChart")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {t("ins.chartSummaryCycle", {
                count: insights.recentCycles.length,
                min: limits.minLen,
                max: limits.maxLen,
              })}
            </p>
            <BarChart
              title={t("ins.cycleChart")}
              refLines={[{ value: limits.minLen }, { value: limits.maxLen }]}
              summary={t("ins.chartSummaryCycle", {
                count: insights.recentCycles.length,
                min: limits.minLen,
                max: limits.maxLen,
              })}
              data={insights.recentCycles.map((c) => ({
                label: fmt(c.start, { month: "short", day: "numeric" }),
                value: c.length,
                highlight: c.length > limits.maxLen || c.length < limits.minLen,
              }))}
            />
          </Card>

          <Card>
            <h2 className="text-lg font-bold">{t("ins.periodChart")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {t("ins.chartSummaryPeriod", {
                count: insights.recentPeriods.length,
                min: insights.minPeriod || 1,
                max: insights.maxPeriod || 7,
              })}
            </p>
            <BarChart
              title={t("ins.periodChart")}
              refLines={[{ value: CONFIG.longPeriodDays }]}
              summary={t("ins.chartSummaryPeriod", {
                count: insights.recentPeriods.length,
                min: insights.minPeriod || 1,
                max: insights.maxPeriod || 7,
              })}
              data={insights.recentPeriods.map((p) => ({
                label: fmt(p.start, { month: "short", day: "numeric" }),
                value: p.length,
                highlight: p.length > CONFIG.longPeriodDays,
              }))}
            />
          </Card>

          {/* Section 4: Detailed Cycle History Table */}
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("ins.history")}</h2>
              <span className="text-xs text-muted-foreground">
                {t("ins.basedOnCycles", { n: insights.cycles.length })}
              </span>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{t("ins.tableCycleCaption")}</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 font-semibold">{t("ins.started")}</th>
                    <th className="py-2 font-semibold">{t("ins.length")}</th>
                    <th className="py-2 font-semibold">{t("ins.periodLen")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...insights.cycleComparisons].reverse().map((c) => {
                    const diffText =
                      c.diffFromMedian === 0
                        ? t("ins.compareMedianSame")
                        : c.diffFromMedian > 0
                          ? t("ins.compareMedianLonger", { n: c.diffFromMedian })
                          : t("ins.compareMedianShorter", { n: Math.abs(c.diffFromMedian) });

                    return (
                      <tr key={c.start} className="border-b border-border/50">
                        <td className="py-2.5">
                          <p className="font-medium">
                            {fmt(c.start, { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td className="py-2.5">
                          <span className="font-semibold">{t("common.days", { n: c.length })}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {diffText}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span>{t("common.days", { n: c.periodLength })}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 5: Recorded Bleeding Patterns */}
          {insights.totalFlowDays > 0 && (
            <Card className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-lg font-bold">{t("ins.flowTitle")}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{t("ins.flowBreakdown")}</p>

              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                {["spotting", "light", "medium", "heavy"].map((fl) => {
                  const cnt = insights.flowCounts[fl] || 0;
                  const pct = insights.totalFlowDays
                    ? Math.round((cnt / insights.totalFlowDays) * 100)
                    : 0;
                  return (
                    <div key={fl} className="rounded-xl border border-border p-2 bg-card">
                      <p className="text-xs text-muted-foreground">{t(`flow.${fl}`)}</p>
                      <p className="font-bold text-lg">{cnt}</p>
                      <p className="text-[10px] text-muted-foreground">{pct}%</p>
                    </div>
                  );
                })}
              </div>

              {(insights.padHourlyDays > 0 || insights.bigClotsDays > 0) && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">{t("ins.supportHeavyTitle")}</p>
                  {insights.padHourlyDays > 0 && (
                    <p>
                      • {t("log.padHourly")} ({insights.padHourlyDays} d)
                    </p>
                  )}
                  {insights.bigClotsDays > 0 && (
                    <p>
                      • {t("log.bigClots")} ({insights.bigClotsDays} d)
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Section 6: Symptom Observations & Trends */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold">{t("ins.symptomsTitle")}</h2>
            </div>

            {/* Recurring Patterns across cycles */}
            <div>
              <h3 className="text-sm font-semibold">{t("ins.patterns")}</h3>
              {insights.patterns.length ? (
                <ul className="mt-1 space-y-1.5 text-sm list-disc pl-5">
                  {insights.patterns.map((p, i) => (
                    <li key={i}>{patternText(p, t)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{t("ins.noPatterns")}</p>
              )}
            </div>

            {/* Frequently logged symptoms */}
            {insights.frequentSymptoms.length > 0 && (
              <div className="border-t border-border pt-3">
                <h3 className="text-sm font-semibold">{t("ins.frequentSymptoms")}</h3>
                <div className="mt-2 space-y-2">
                  {insights.frequentSymptoms.slice(0, 5).map((s) => {
                    const phaseLabel =
                      s.dominantPhase === "premenstrual"
                        ? t("ins.phasePremenstrual")
                        : s.dominantPhase === "period"
                          ? t("ins.phasePeriod")
                          : t("ins.phaseOther");

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg bg-muted/40 p-2 text-sm"
                      >
                        <span className="font-medium">{s.custom ? s.label : t(`sym.${s.id}`)}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 sm:mt-0">
                          <span>{t("ins.loggedTimes", { n: s.count, pct: s.percentage })}</span>
                          <span>•</span>
                          <span className="text-primary font-medium">{phaseLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("ins.associationNotice")}</p>
              </div>
            )}

            {/* Pain & Well-being Trends */}
            <div className="border-t border-border pt-3 space-y-1.5">
              <h3 className="text-sm font-semibold">{t("ins.painOverview")}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-card border border-border p-2">
                  <p className="text-muted-foreground">{t("log.pain")}</p>
                  <p className="font-bold text-base">{insights.pain.avgPain}/10</p>
                  <p className="text-[10px] text-muted-foreground">
                    {insights.pain.daysWithPain} days logged
                  </p>
                </div>
                <div className="rounded-lg bg-card border border-border p-2">
                  <p className="text-muted-foreground">
                    {t("ins.disruptivePain", { count: "" }).replace(":", "")}
                  </p>
                  <p className="font-bold text-base">{insights.pain.disruptivePainDays}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("ins.highPainDays", { count: insights.pain.highPainDays })}
                  </p>
                </div>
              </div>

              {insights.sleep.loggedDays > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  {t("ins.sleepAvg", { hours: insights.sleep.avgSleep })}
                </p>
              )}
            </div>

            {/* Data Completeness & Cautionary Note */}
            <div className="border-t border-border pt-2 text-xs text-muted-foreground">
              <p>{t("ins.completenessNote", { logged: insights.totalLoggedDays })}</p>
              <p className="mt-1 font-medium">{t("ins.notDiagnosis")}</p>
            </div>
          </Card>

          {/* Section 7: Supportive Health Guidance & Next Steps */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold">{t("ins.supportTitle")}</h2>
            </div>

            {insights.supportiveCards.length > 0 ? (
              <div className="space-y-2">
                {insights.supportiveCards.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="font-bold text-sm">{t(c.titleKey)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(c.descKey)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {c.doctorLink && (
                        <Link
                          to={c.doctorLink}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          {t("ins.viewDoctorGuidance")} <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                      {c.learnId && (
                        <Link
                          to="/learn"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
                        >
                          {t("ins.learnArticle")} <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("doc.none")}</p>
            )}

            <div className="border-t border-border pt-3 flex flex-col sm:flex-row gap-2">
              <Link
                to="/doctor"
                className="inline-flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-border px-3 text-sm font-bold hover:bg-muted"
              >
                <Stethoscope className="h-4 w-4" aria-hidden /> {t("ins.viewDoctorGuidance")}
              </Link>
              <Link
                to="/visit"
                className="inline-flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <FileText className="h-4 w-4" aria-hidden /> {t("ins.visitSummary")}
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              National Emergency: {EMERGENCY.national} | Ambulance: {EMERGENCY.ambulance} | Mental
              Health (Tele-MANAS): {EMERGENCY.teleManas}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
