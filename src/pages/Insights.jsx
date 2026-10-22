import { useApp } from "@/App.jsx";
import { Card, PageTitle } from "@/components/common/ui.jsx";
import { BarChart } from "@/components/insights/BarChart.jsx";
import { patternText } from "@/components/insights/patternText.js";
import { symptomPatterns } from "@/lib/cycle.js";
import { CONFIG } from "@/config.js";

export default function Insights() {
  const { t, fmt, analysis: a, record } = useApp();
  const recent = a.cycles.slice(-CONFIG.historyWindow);
  const patterns = symptomPatterns(record.days, a);
  const limits = CONFIG.irregular[record.settings.ageGroup === "under18" ? "under18" : "adult"];
  const spread = a.stats ? a.stats.max - a.stats.min : 0;
  return (
    <div className="space-y-4">
      <PageTitle>{t("ins.title")}</PageTitle>
      {a.cycles.length === 0 ? <Card><p>{t("ins.noData")}</p></Card> : (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-sm text-muted-foreground">{t("ins.avg")}</p><p className="font-display text-3xl font-bold">{t("common.days", { n: a.stats.avg })}</p></div>
              <div><p className="text-sm text-muted-foreground">{t("ins.range")}</p><p className="font-display text-3xl font-bold">{a.stats.min}–{a.stats.max}</p></div>
            </div>
            <p className="mt-3">
              {a.cycles.length < CONFIG.minCyclesForPrediction ? t("reg.insufficient") : a.irregular ? t("reg.irregular", { spread }) : t("reg.regular", { spread })}
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">{t("ins.cycleChart")}</h2>
            <BarChart title={t("ins.cycleChart")} refLines={[{ value: limits.minLen }, { value: limits.maxLen }]}
              data={recent.map((c) => ({ label: fmt(c.start), value: c.length, highlight: c.length > limits.maxLen || c.length < limits.minLen }))} />
          </Card>
          <Card>
            <h2 className="text-lg font-bold">{t("ins.periodChart")}</h2>
            <BarChart title={t("ins.periodChart")} refLines={[{ value: CONFIG.longPeriodDays }]}
              data={a.periods.slice(-CONFIG.historyWindow).map((p) => ({ label: fmt(p.start), value: p.length, highlight: p.length > CONFIG.longPeriodDays }))} />
          </Card>
          <Card>
            <h2 className="text-lg font-bold">{t("ins.history")}</h2>
            <table className="mt-2 w-full text-left">
              <thead><tr className="border-b border-border"><th className="py-1">{t("ins.started")}</th><th>{t("ins.length")}</th><th>{t("ins.periodLen")}</th></tr></thead>
              <tbody>
                {[...a.cycles].reverse().map((c) => (
                  <tr key={c.start} className="border-b border-border/60"><td className="py-1">{fmt(c.start, { day: "numeric", month: "short", year: "numeric" })}</td><td>{t("common.days", { n: c.length })}</td><td>{t("common.days", { n: c.periodLength })}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      <Card>
        <h2 className="text-lg font-bold">{t("ins.patterns")}</h2>
        {patterns.length ? <ul className="ml-5 mt-1 list-disc space-y-1">{patterns.map((p, i) => <li key={i}>{patternText(p, t)}</li>)}</ul> : <p className="mt-1">{t("ins.noPatterns")}</p>}
        <p className="mt-2 text-sm text-muted-foreground">{t("ins.notDiagnosis")}</p>
      </Card>
    </div>
  );
}
