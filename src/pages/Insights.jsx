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
  TrendingUp,
  Sparkles,
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
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {t("ins.title")}
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {prefs.discreet ? t("app.discreetName") : t("ins.title")}
        </h1>
      </div>

      {/* Empty state: No complete cycles yet */}
      {insights.totalCyclesCount === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border-2 border-primary/20 bg-hero p-6 sm:p-8 text-center shadow-soft space-y-4">
          <Calendar className="mx-auto h-12 w-12 text-primary" aria-hidden />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{t("ins.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("ins.noData")}</p>
            <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
              {t("ins.insufficientSubtitle")}
            </p>
          </div>
          <Link
            to="/log"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-98"
          >
            {t("cal.addEntry")}
          </Link>
        </div>
      ) : (
        /* Reconstructed Responsive Layout: 2 Columns on Desktop */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Key Stats, Next Window & Cycle History */}
          <div className="lg:col-span-6 space-y-4">
            {/* Section 1: Overview Summary Cards */}
            <div className="rounded-3xl border border-border/70 bg-hero p-5 shadow-soft space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("ins.medianCycle")}
                  </p>
                  <p className="font-display text-3xl font-extrabold text-foreground mt-1">
                    {insights.medianCycle ? t("common.days", { n: insights.medianCycle }) : "—"}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {t("ins.range")}: {insights.minCycle}–{insights.maxCycle} d
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("ins.medianPeriod")}
                  </p>
                  <p className="font-display text-3xl font-extrabold text-period mt-1">
                    {insights.medianPeriod ? t("common.days", { n: insights.medianPeriod }) : "—"}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {t("ins.range")}: {insights.minPeriod}–{insights.maxPeriod} d
                  </p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  {t("ins.basedOnCycles", { n: insights.recentCycles.length })}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {insights.recentCycles.length < CONFIG.minCyclesForPrediction
                    ? t("reg.insufficient")
                    : insights.isIrregular
                      ? insights.irregularReason === "range"
                        ? t("reg.outside", { min: limits.minLen, max: limits.maxLen })
                        : t("reg.irregular", { spread })
                      : t("reg.regular", { spread })}
                </p>
                {a.currentCycleDay && !insights.isPaused && (
                  <p className="mt-2 text-xs font-bold text-primary">
                    {t("ins.currentCycle", { day: a.currentCycleDay })}
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Future Estimate & Uncertainty Representation */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-base font-bold text-foreground">{t("ins.nextWindow")}</h2>
              </div>

              {insights.isEstimateAvailable ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-muted/30 p-4 border border-border/70">
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
                      {fmtRange(insights.estimateWindow.start, insights.estimateWindow.end)}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {t("ins.nextWindowDesc", {
                        start: fmt(insights.estimateWindow.start, {
                          month: "short",
                          day: "numeric",
                        }),
                        end: fmt(insights.estimateWindow.end, { month: "short", day: "numeric" }),
                        days: insights.estimateWindow.windowDays,
                      })}
                    </p>
                    {insights.estimateWindow.isWidened && (
                      <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {t("ins.windowWidenedIrregular", {
                          extra: CONFIG.irregularExtraDays,
                          spread,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-muted/50 p-3.5 text-xs text-muted-foreground space-y-1">
                    <p className="font-bold text-foreground">{t("ins.historyVsEstimate")}</p>
                    <p>{t("ins.historyVsEstimateDesc")}</p>
                    <p className="font-bold text-destructive">{t("ins.notContraception")}</p>
                  </div>
                </div>
              ) : insights.isPaused ? (
                <p className="text-sm text-muted-foreground">{t("today.paused")}</p>
              ) : (
                <div className="rounded-2xl bg-muted/40 p-4 text-sm space-y-1">
                  <p className="font-semibold text-foreground">
                    {t("ins.insufficientForEstimate", {
                      min: CONFIG.minCyclesForPrediction,
                      count: insights.recentCycles.length,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("ins.insufficientSubtitle")}</p>
                </div>
              )}
            </div>

            {/* Section 4: Detailed Cycle History Table */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-base font-bold text-foreground">{t("ins.history")}</h2>
                <span className="text-xs text-muted-foreground">
                  {t("ins.basedOnCycles", { n: insights.cycles.length })}
                </span>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t("ins.tableCycleCaption")}</caption>
                  <thead>
                    <tr className="border-b border-border/70 text-xs text-muted-foreground">
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
                        <tr key={c.start} className="border-b border-border/40 last:border-none">
                          <td className="py-2.5">
                            <p className="font-semibold text-foreground text-xs sm:text-sm">
                              {fmt(c.start, { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </td>
                          <td className="py-2.5">
                            <span className="font-bold text-foreground text-xs sm:text-sm">
                              {t("common.days", { n: c.length })}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {diffText}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="text-xs sm:text-sm text-foreground">
                              {t("common.days", { n: c.periodLength })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Charts, Flow Breakdown & Symptoms */}
          <div className="lg:col-span-6 space-y-4">
            {/* Section 3: Visual Charts */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-2">
              <h2 className="text-base font-bold text-foreground">{t("ins.cycleChart")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("ins.chartSummaryCycle", {
                  count: insights.recentCycles.length,
                  min: limits.minLen,
                  max: limits.maxLen,
                })}
              </p>
              <div className="pt-2">
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
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-2">
              <h2 className="text-base font-bold text-foreground">{t("ins.periodChart")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("ins.chartSummaryPeriod", {
                  count: insights.recentPeriods.length,
                  min: insights.minPeriod || 1,
                  max: insights.maxPeriod || 7,
                })}
              </p>
              <div className="pt-2">
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
              </div>
            </div>

            {/* Section 5: Recorded Bleeding Patterns */}
            {insights.totalFlowDays > 0 && (
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-period" aria-hidden />
                  <h2 className="text-base font-bold text-foreground">{t("ins.flowTitle")}</h2>
                </div>
                <p className="text-xs text-muted-foreground">{t("ins.flowBreakdown")}</p>

                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  {["spotting", "light", "medium", "heavy"].map((fl) => {
                    const cnt = insights.flowCounts[fl] || 0;
                    const pct = insights.totalFlowDays
                      ? Math.round((cnt / insights.totalFlowDays) * 100)
                      : 0;
                    return (
                      <div
                        key={fl}
                        className="rounded-2xl border border-border/70 p-2.5 bg-card shadow-xs"
                      >
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          {t(`flow.${fl}`)}
                        </p>
                        <p className="font-extrabold text-xl text-foreground mt-0.5">{cnt}</p>
                        <p className="text-[10px] text-muted-foreground">{pct}%</p>
                      </div>
                    );
                  })}
                </div>

                {(insights.padHourlyDays > 0 || insights.bigClotsDays > 0) && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
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
              </div>
            )}

            {/* Section 6: Symptom Observations & Trends */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-base font-bold text-foreground">{t("ins.symptomsTitle")}</h2>
              </div>

              {/* Recurring Patterns across cycles */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("ins.patterns")}
                </h3>
                {insights.patterns.length ? (
                  <ul className="mt-1.5 space-y-1.5 text-xs list-disc pl-5 text-foreground leading-relaxed">
                    {insights.patterns.map((p, i) => (
                      <li key={i}>{patternText(p, t)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{t("ins.noPatterns")}</p>
                )}
              </div>

              {/* Frequently logged symptoms */}
              {insights.frequentSymptoms.length > 0 && (
                <div className="border-t border-border/60 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("ins.frequentSymptoms")}
                  </h3>
                  <div className="mt-2 space-y-1.5">
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs"
                        >
                          <span className="font-semibold text-foreground">
                            {s.custom ? s.label : t(`sym.${s.id}`)}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 sm:mt-0">
                            <span>{t("ins.loggedTimes", { n: s.count, pct: s.percentage })}</span>
                            <span>•</span>
                            <span className="text-primary font-bold">{phaseLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("ins.associationNotice")}
                  </p>
                </div>
              )}

              {/* Pain & Well-being Trends */}
              <div className="border-t border-border/60 pt-3 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("ins.painOverview")}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-card border border-border/70 p-2.5">
                    <p className="text-muted-foreground">{t("log.pain")}</p>
                    <p className="font-extrabold text-lg text-foreground">
                      {insights.pain.avgPain}/10
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {insights.pain.daysWithPain} days logged
                    </p>
                  </div>
                  <div className="rounded-xl bg-card border border-border/70 p-2.5">
                    <p className="text-muted-foreground">
                      {t("ins.disruptivePain", { count: "" }).replace(":", "")}
                    </p>
                    <p className="font-extrabold text-lg text-foreground">
                      {insights.pain.disruptivePainDays}
                    </p>
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
              <div className="border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                <p>{t("ins.completenessNote", { logged: insights.totalLoggedDays })}</p>
                <p className="mt-1 font-semibold">{t("ins.notDiagnosis")}</p>
              </div>
            </div>

            {/* Section 7: Supportive Health Guidance & Next Steps */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-base font-bold text-foreground">{t("ins.supportTitle")}</h2>
              </div>

              {insights.supportiveCards.length > 0 ? (
                <div className="space-y-2">
                  {insights.supportiveCards.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-foreground">
                            {t(c.titleKey)}
                          </p>
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
                <p className="text-xs text-muted-foreground">{t("doc.none")}</p>
              )}

              <div className="border-t border-border/60 pt-3 flex flex-col sm:flex-row gap-2">
                <Link
                  to="/doctor"
                  className="inline-flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-border px-3 text-xs font-bold hover:bg-muted text-foreground transition-all"
                >
                  <Stethoscope className="h-4 w-4 text-primary" aria-hidden />{" "}
                  {t("ins.viewDoctorGuidance")}
                </Link>
                <Link
                  to="/visit"
                  className="inline-flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <FileText className="h-4 w-4" aria-hidden /> {t("ins.visitSummary")}
                </Link>
              </div>

              <p className="text-[10px] text-muted-foreground/80 pt-1">
                National Emergency: {EMERGENCY.national} | Ambulance: {EMERGENCY.ambulance} | Mental
                Health (Tele-MANAS): {EMERGENCY.teleManas}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
