import { useState } from "react";
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
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Chip, cx } from "@/components/common/ui.jsx";
import { BarChart } from "@/components/insights/BarChart.jsx";
import { patternText } from "@/components/insights/patternText.js";
import { computeCycleInsights } from "@/lib/insights.js";
import { CONFIG, EMERGENCY } from "@/config.js";
import { InsightEmptyArt } from "@/components/brand/SaheliArt.jsx";
import { PhaseCards } from "@/components/cycle/PhaseCards.jsx";
import { QUESTIONNAIRE_CONDITIONS } from "@/content/conditions.js";

export default function Insights() {
  const { t, fmt, fmtRange, analysis: a, record, prefs, today } = useApp();
  const [cycleScope, setCycleScope] = useState("recent");
  const [inspectProvenance, setInspectProvenance] = useState(null);

  const insights = computeCycleInsights({
    record,
    analysis: a,
    today,
    scope: cycleScope,
  });

  const { limits } = insights;
  const spread = insights.cycleSpread;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {t("ins.title")}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {prefs.discreet ? t("app.discreetName") : t("ins.title")}
          </h1>
        </div>

        {/* Filter Toggle: Recent 6 Cycles vs All Cycles */}
        {insights.totalCyclesCount > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/70 border border-border/60 w-fit text-xs">
            <button
              type="button"
              onClick={() => setCycleScope("recent")}
              className={cx(
                "px-3 py-1.5 font-bold rounded-xl transition-all",
                cycleScope === "recent"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("ins.filterRecent", { n: CONFIG.historyWindow })}
            </button>
            <button
              type="button"
              onClick={() => setCycleScope("all")}
              className={cx(
                "px-3 py-1.5 font-bold rounded-xl transition-all",
                cycleScope === "all"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("ins.filterAll", { n: insights.totalCyclesCount })}
            </button>
          </div>
        )}
      </div>

      {/* Empty state: No complete cycles yet */}
      {insights.totalCyclesCount === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-primary/20 bg-hero p-8 text-center shadow-soft space-y-5">
          <div className="flex justify-center">
            <InsightEmptyArt className="w-36 h-36" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold text-foreground">{t("ins.title")}</h2>
            <p className="text-sm font-semibold text-primary">{t("ins.noData")}</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t("ins.insufficientSubtitle")}
            </p>
          </div>
          <Link
            to="/log"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-5 font-bold text-sm text-primary-foreground shadow-md hover:opacity-95 transition-all active:scale-98"
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
            <div className="bloom-card p-5 sm:p-6 space-y-4">
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
            <div className="bloom-card p-5 sm:p-6 space-y-3">
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
            <div className="bloom-card p-5 sm:p-6 space-y-3">
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
            <div className="bloom-card p-5 sm:p-6 space-y-3">
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

            <div className="bloom-card p-5 sm:p-6 space-y-3">
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
              <div className="bloom-card p-5 sm:p-6 space-y-3">
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
                    {insights.heavyBleedingProvenance && (
                      <button
                        type="button"
                        onClick={() =>
                          setInspectProvenance({
                            title: t("ins.supportHeavyTitle"),
                            provenance: insights.heavyBleedingProvenance,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:underline pt-1"
                      >
                        <Search className="h-3 w-3" />
                        <span>{t("ins.inspectEvidence")}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 6: Symptom Observations & Trends */}
            <div className="bloom-card p-5 sm:p-6 space-y-4">
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
                  <ul className="mt-1.5 space-y-1.5 text-xs text-foreground leading-relaxed">
                    {insights.patterns.map((p, i) => (
                      <li
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-border/30 last:border-none"
                      >
                        <span>• {patternText(p, t)}</span>
                        {p.provenance && (
                          <button
                            type="button"
                            onClick={() =>
                              setInspectProvenance({
                                title: patternText(p, t),
                                provenance: p.provenance,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
                          >
                            <Search className="h-3 w-3" />
                            <span>{t("ins.inspectEvidence")}</span>
                          </button>
                        )}
                      </li>
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs gap-2"
                        >
                          <span className="font-semibold text-foreground">
                            {s.custom ? s.label : t(`sym.${s.id}`)}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{t("ins.loggedTimes", { n: s.count, pct: s.percentage })}</span>
                            <span>•</span>
                            <span className="text-primary font-bold">{phaseLabel}</span>
                            {s.provenance && (
                              <button
                                type="button"
                                onClick={() =>
                                  setInspectProvenance({
                                    title: s.custom ? s.label : t(`sym.${s.id}`),
                                    provenance: s.provenance,
                                  })
                                }
                                className="ms-1 inline-flex items-center gap-0.5 font-bold text-primary hover:underline"
                              >
                                <Search className="h-3 w-3" />
                                <span>{t("ins.inspectEvidence")}</span>
                              </button>
                            )}
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("ins.painOverview")}
                  </h3>
                  {insights.pain.provenance && (
                    <button
                      type="button"
                      onClick={() =>
                        setInspectProvenance({
                          title: t("ins.painOverview"),
                          provenance: insights.pain.provenance,
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <Search className="h-3 w-3" />
                      <span>{t("ins.inspectEvidence")}</span>
                    </button>
                  )}
                </div>
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
            <div className="bloom-card p-5 sm:p-6 space-y-4">
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

      {/* Personalized Health Conditions Educational Overview */}
      {record?.healthConditions?.personalisationEnabled &&
        record?.healthConditions?.conditions?.length > 0 && (
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {t("cond.insights.badge")}
                </span>
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  {t("cond.insights.title")}
                </h3>
              </div>
              <Link
                to="/settings"
                className="text-xs font-bold text-primary hover:underline shrink-0"
              >
                {t("cond.insights.manageSettings")}
              </Link>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("cond.insights.desc")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {record.healthConditions.conditions.map((item) => {
                const info = QUESTIONNAIRE_CONDITIONS.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-border/70 bg-muted/30 text-xs space-y-1"
                  >
                    <div className="font-bold text-foreground flex items-center justify-between">
                      <span>{info ? t(info.labelKey) : item.id}</span>
                      <span className="text-[10px] font-semibold text-primary rounded-lg bg-primary/10 px-2 py-0.5">
                        {t(
                          `cond.status.${item.status === "confirmed_diagnosis" ? "confirmed" : item.status === "being_evaluated" ? "evaluating" : "seekingInfo"}`,
                        )}
                      </span>
                    </div>
                    {info && (
                      <p className="text-[11px] text-muted-foreground">{t(info.plainNameKey)}</p>
                    )}
                    {info?.learnTopic && (
                      <Link
                        to="/learn"
                        search={{ topic: info.learnTopic }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>{t("cond.insights.readGuide")}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              {t("cond.onboarding.privacyDesc")}
            </p>
          </div>
        )}

      {/* Section: Cycle Phase & Ovulation Insights */}
      <div className="bloom-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t("ins.phaseInsightsTitle")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("ins.basedOnCycles", { n: insights.activeCycles.length })}
          </span>
        </div>

        {/* Metrics Grid: Median, Variability, Observation Count */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-muted/40 p-3 space-y-1 border border-border/40">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              {t("ins.medianCycle")}
            </span>
            <p className="font-extrabold text-xl text-foreground">
              {insights.medianCycle ? `${insights.medianCycle} ${t("insights.days")}` : "N/A"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {insights.minCycle && insights.maxCycle
                ? `Range: ${insights.minCycle} – ${insights.maxCycle} d`
                : ""}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/40 p-3 space-y-1 border border-border/40">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              {t("ins.variability")}
            </span>
            <p className="font-extrabold text-xl text-foreground">
              ±{Math.round(spread / 2)} {t("insights.days")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {spread > 7 ? t("today.fertility.irregular") : t("ins.regularVariability")}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/40 p-3 space-y-1 border border-border/40">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              {t("ins.observationsLogged")}
            </span>
            <p className="font-extrabold text-xl text-foreground">
              {insights.scopedObservations ? insights.scopedObservations.length : 0}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("phase.ovulationCardSubtitle")}</p>
          </div>
        </div>

        {/* Cycle-Day Relative Symptom Frequency Patterns */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("ins.cycleDaySymptomTitle")}
          </h3>
          {insights.cycleDaySymptomPatterns?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {insights.cycleDaySymptomPatterns.slice(0, 6).map((pattern, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/40 p-2.5"
                >
                  <div>
                    <span className="font-semibold text-foreground">
                      {t(`sym.${pattern.symptom}`)}
                    </span>
                    <span className="text-[11px] text-muted-foreground ms-1.5">
                      ({t("phase.currentCycleDay", { day: pattern.cycleDay })})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setInspectProvenance({
                        title: `${t(`sym.${pattern.symptom}`)} (${t("phase.currentCycleDay", { day: pattern.cycleDay })})`,
                        provenance: {
                          type: "cycle_day_symptom",
                          sampleDates: pattern.dates,
                          totalOccurrences: pattern.count,
                          cycleScopeText: `${pattern.count} recorded cycles`,
                        },
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <span>{pattern.count} cycles</span>
                    <Search className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{t("ins.noCycleDayPatterns")}</p>
          )}
        </div>

        {/* Observation History Table in Active Scope */}
        {insights.scopedObservations?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("ins.observationHistory")}
            </h3>
            <div className="divide-y divide-border/40 rounded-2xl border border-border/60 overflow-hidden text-xs">
              {insights.scopedObservations.slice(0, 5).map((obs) => (
                <div key={obs.date} className="flex items-center justify-between p-2.5">
                  <div>
                    <span className="font-bold text-foreground">
                      {fmt(obs.date, { month: "short", day: "numeric" })}
                    </span>
                    {obs.cycleDay && (
                      <span className="text-muted-foreground ms-2 text-[11px]">
                        (Day {obs.cycleDay})
                      </span>
                    )}
                    <span className="text-primary font-semibold ms-2 text-[11px]">
                      {obs.testResult && obs.testResult !== "none"
                        ? `LH: ${obs.testResult}`
                        : obs.bbt != null
                          ? `BBT: ${obs.bbt} °${obs.bbtUnit || "C"}`
                          : obs.cervicalFluid && obs.cervicalFluid !== "none"
                            ? `Fluid: ${obs.cervicalFluid}`
                            : ""}
                    </span>
                  </div>
                  {obs.notes && (
                    <span className="text-[11px] text-muted-foreground italic truncate max-w-[120px]">
                      "{obs.notes}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t("ins.cycleRelativeNotice")}</p>
        </div>
      </div>

      {/* Menstrual Phase Education: Follicular & Luteal Deep Dive */}
      <PhaseCards showAll />

      {/* Provenance & Supporting Evidence Modal */}
      {inspectProvenance && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="provenance-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {t("ins.evidenceTitle")}
                </span>
                <h2
                  id="provenance-title"
                  className="text-base sm:text-lg font-bold text-foreground"
                >
                  {inspectProvenance.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectProvenance(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div>
                  <p className="font-semibold text-foreground">{t("ins.evidenceMethod")}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {inspectProvenance.provenance.methodology}
                  </p>
                </div>
                <span className="rounded-xl bg-primary/10 px-2.5 py-1 font-bold text-primary uppercase text-[10px] shrink-0">
                  {inspectProvenance.provenance.confidence} {t("ins.confidence")}
                </span>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">{t("ins.evidenceDates")}:</p>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {t("ins.evidenceTapToEdit")}
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {inspectProvenance.provenance.supportingDates?.length > 0 ? (
                    inspectProvenance.provenance.supportingDates.map((d) => (
                      <Link
                        key={d}
                        to="/log"
                        search={{ date: d }}
                        onClick={() => setInspectProvenance(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground font-mono text-xs font-semibold transition-all shadow-2xs"
                      >
                        <span>{fmt(d, { month: "short", day: "numeric", year: "numeric" })}</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </Link>
                    ))
                  ) : (
                    <span className="text-muted-foreground">{t("ins.noDatesRecorded")}</span>
                  )}
                </div>
              </div>

              {insights.totalDaysInSpan > 0 && (
                <div className="rounded-2xl bg-accent/40 border border-accent p-3 text-[11px] text-accent-foreground leading-relaxed">
                  {t("ins.evidenceUnloggedNote", {
                    total: insights.totalDaysInSpan,
                    unlogged: insights.unloggedDaysCount,
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectProvenance(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
