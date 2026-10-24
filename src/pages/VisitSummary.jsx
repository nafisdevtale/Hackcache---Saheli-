import { useState } from "react";
import { Printer, Sliders, ShieldCheck } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, inputCls } from "@/components/common/ui.jsx";
import { CONFIG } from "@/config.js";

export default function VisitSummary() {
  const { t, fmt, record, analysis: a, safety, isDemo, today } = useApp();
  const [includeCycles, setIncludeCycles] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includePain, setIncludePain] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);
  const [includeGuidance, setIncludeGuidance] = useState(true);
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [customQuestions, setCustomQuestions] = useState("");

  const days = Object.values(record.days);
  const symCount = {};
  days.forEach((d) => (d.symptoms || []).forEach((s) => (symCount[s] = (symCount[s] || 0) + 1)));
  const maxPain = Math.max(0, ...days.map((d) => d.pain || 0));
  const stopped = days.filter((d) => d.painStoppedActivities).length;
  const meds = [...new Set(days.map((d) => d.medicines?.trim()).filter(Boolean))];
  const full = { day: "numeric", month: "short", year: "numeric" };

  return (
    <article className="print-page space-y-4 text-base">
      {/* Print & Customization Controls (Hidden in Print) */}
      <div className="space-y-3 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <Btn onClick={() => window.print()} className="gap-2">
            <Printer aria-hidden className="h-5 w-5" /> {t("visit.print")}
          </Btn>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-secondary-strong" />
            <span>{t("visit.localOnlyNotice")}</span>
          </div>
        </div>

        <Card className="space-y-3 bg-muted/40 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Sliders className="h-4 w-4 text-primary" /> {t("visit.customize")}
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCycles}
                onChange={(e) => setIncludeCycles(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span>{t("visit.includeCycles")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymptoms}
                onChange={(e) => setIncludeSymptoms(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span>{t("visit.includeSymptoms")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePain}
                onChange={(e) => setIncludePain(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span>{t("visit.includePain")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMeds}
                onChange={(e) => setIncludeMeds(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span>{t("visit.includeMeds")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGuidance}
                onChange={(e) => setIncludeGuidance(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span>{t("visit.includeGuidance")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuestions}
                onChange={(e) => setIncludeQuestions(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span>{t("visit.questions")}</span>
            </label>
          </div>

          <div className="space-y-1 pt-1">
            <label
              htmlFor="custom-questions"
              className="block text-xs font-semibold text-foreground"
            >
              {t("visit.questionsLabel")}
            </label>
            <textarea
              id="custom-questions"
              rows={2}
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
              placeholder={t("visit.questionsPlaceholder")}
              className={`${inputCls} text-xs`}
            />
          </div>
        </Card>
      </div>

      {isDemo && (
        <p
          role="alert"
          className="rounded-lg border-4 border-urgent p-2 text-center font-extrabold"
        >
          {t("visit.demoWarn")}
        </p>
      )}

      {/* Header */}
      <div className="border-b border-border pb-2">
        <h1 className="font-display text-2xl font-bold">{t("visit.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("visit.generated", { date: fmt(today, full) })} ·{" "}
          {t("visit.ageGroup", { g: t(`age.${record.settings.ageGroup}`) })}
        </p>
      </div>

      {a.periods.length === 0 ? (
        <p>{t("visit.noData")}</p>
      ) : (
        <>
          {includeCycles && (
            <section className="space-y-2">
              <h2 className="font-bold text-base">{t("visit.cycles")}</h2>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground">
                    <th className="py-1">{t("ins.started")}</th>
                    <th className="py-1">{t("ins.length")}</th>
                    <th className="py-1">{t("ins.periodLen")}</th>
                  </tr>
                </thead>
                <tbody>
                  {a.cycles.slice(-CONFIG.historyWindow).map((c) => (
                    <tr key={c.start} className="border-b border-border">
                      <td className="py-1">{fmt(c.start, full)}</td>
                      <td className="py-1">{t("common.days", { n: c.length })}</td>
                      <td className="py-1">{t("common.days", { n: c.periodLength })}</td>
                    </tr>
                  ))}
                  {a.lastPeriod && (
                    <tr>
                      <td className="py-1">{fmt(a.lastPeriod.start, full)}</td>
                      <td className="py-1">—</td>
                      <td className="py-1">{t("common.days", { n: a.lastPeriod.length })}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {a.stats && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("ins.avg")}: {a.stats.avg} · {t("ins.range")}: {a.stats.min}–{a.stats.max}.{" "}
                  {t("visit.periodLen", { n: a.stats.avgPeriod })}
                </p>
              )}
            </section>
          )}

          {includeSymptoms && (
            <section className="space-y-1">
              <h2 className="font-bold text-base">{t("visit.symptoms")}</h2>
              <p className="text-sm">
                {Object.entries(symCount)
                  .sort((x, y) => y[1] - x[1])
                  .map(([s, n]) => `${t(`sym.${s}`)} (${n})`)
                  .join(", ") || t("visit.none")}
              </p>
            </section>
          )}

          {includePain && (
            <section className="space-y-1">
              <h2 className="font-bold text-base">{t("log.pain")}</h2>
              <p className="text-sm">{t("visit.pain", { max: maxPain, n: stopped })}</p>
            </section>
          )}

          {includeMeds && (
            <section className="space-y-1">
              <h2 className="font-bold text-base">{t("visit.medicines")}</h2>
              <p className="text-sm">{meds.join(", ") || t("visit.none")}</p>
            </section>
          )}

          {includeGuidance && (
            <section className="space-y-1">
              <h2 className="font-bold text-base">{t("visit.guidance")}</h2>
              <ul className="ms-5 list-disc text-sm">
                {[
                  ...safety.urgent.map((c) => t(`urgent.${c.id}.title`)),
                  ...safety.cards.map((c) => t(`rf.${c.id}.title`, c.params)),
                ].map((x) => (
                  <li key={x}>{x}</li>
                ))}
                {!safety.cards.length && !safety.urgent.length && <li>{t("visit.none")}</li>}
              </ul>
            </section>
          )}
        </>
      )}

      {includeQuestions && (
        <section className="space-y-2">
          <h2 className="font-bold text-base">{t("visit.questions")}</h2>
          <ol className="ms-5 list-decimal text-sm space-y-1">
            {["q1", "q2", "q3", "q4"].map((q) => (
              <li key={q}>{t(`visit.${q}`)}</li>
            ))}
            {customQuestions && <li className="font-semibold text-primary">{customQuestions}</li>}
          </ol>
        </section>
      )}

      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
        {t("common.disclaimer")}
      </p>
    </article>
  );
}
