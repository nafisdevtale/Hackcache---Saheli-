import { Printer } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn } from "@/components/common/ui.jsx";
import { CONFIG } from "@/config.js";

export default function VisitSummary() {
  const { t, fmt, record, analysis: a, safety, isDemo, today } = useApp();
  const days = Object.values(record.days);
  const symCount = {};
  days.forEach((d) => (d.symptoms || []).forEach((s) => (symCount[s] = (symCount[s] || 0) + 1)));
  const maxPain = Math.max(0, ...days.map((d) => d.pain || 0));
  const stopped = days.filter((d) => d.painStoppedActivities).length;
  const meds = [...new Set(days.map((d) => d.medicines?.trim()).filter(Boolean))];
  const full = { day: "numeric", month: "short", year: "numeric" };
  return (
    <article className="print-page space-y-3 text-base">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Btn onClick={() => window.print()}><Printer aria-hidden className="h-5 w-5" /> {t("visit.print")}</Btn>
      </div>
      {isDemo && <p role="alert" className="rounded-lg border-4 border-urgent p-2 text-center font-extrabold">{t("visit.demoWarn")}</p>}
      <h1 className="font-display text-2xl font-bold">{t("visit.title")}</h1>
      <p className="text-sm">{t("visit.generated", { date: fmt(today, full) })} · {t("visit.ageGroup", { g: t(`age.${record.settings.ageGroup}`) })}</p>
      {a.periods.length === 0 ? <p>{t("visit.noData")}</p> : (
        <>
          <section>
            <h2 className="font-bold">{t("visit.cycles")}</h2>
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr className="border-b-2 border-foreground"><th>{t("ins.started")}</th><th>{t("ins.length")}</th><th>{t("ins.periodLen")}</th></tr></thead>
              <tbody>
                {a.cycles.slice(-CONFIG.historyWindow).map((c) => <tr key={c.start} className="border-b border-border"><td>{fmt(c.start, full)}</td><td>{t("common.days", { n: c.length })}</td><td>{t("common.days", { n: c.periodLength })}</td></tr>)}
                {a.lastPeriod && <tr><td>{fmt(a.lastPeriod.start, full)}</td><td>—</td><td>{t("common.days", { n: a.lastPeriod.length })}</td></tr>}
              </tbody>
            </table>
            {a.stats && <p className="mt-1 text-sm">{t("ins.avg")}: {a.stats.avg} · {t("ins.range")}: {a.stats.min}–{a.stats.max}. {t("visit.periodLen", { n: a.stats.avgPeriod })}</p>}
          </section>
          <section><h2 className="font-bold">{t("visit.symptoms")}</h2><p className="text-sm">{Object.entries(symCount).sort((x, y) => y[1] - x[1]).map(([s, n]) => `${t(`sym.${s}`)} (${n})`).join(", ") || t("visit.none")}</p></section>
          <section><h2 className="font-bold">{t("log.pain")}</h2><p className="text-sm">{t("visit.pain", { max: maxPain, n: stopped })}</p></section>
          <section><h2 className="font-bold">{t("visit.medicines")}</h2><p className="text-sm">{meds.join(", ") || t("visit.none")}</p></section>
          <section><h2 className="font-bold">{t("visit.guidance")}</h2><ul className="ml-5 list-disc text-sm">{[...safety.urgent.map((c) => t(`urgent.${c.id}.title`)), ...safety.cards.map((c) => t(`rf.${c.id}.title`, c.params))].map((x) => <li key={x}>{x}</li>)}{!safety.cards.length && !safety.urgent.length && <li>{t("visit.none")}</li>}</ul></section>
        </>
      )}
      <section><h2 className="font-bold">{t("visit.questions")}</h2><ol className="ml-5 list-decimal text-sm">{["q1", "q2", "q3", "q4"].map((q) => <li key={q}>{t(`visit.${q}`)}</li>)}</ol></section>
      <p className="text-xs">{t("common.disclaimer")}</p>
    </article>
  );
}
