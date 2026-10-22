import { Droplet } from "lucide-react";
import { useApp } from "@/App.jsx";
import { ymd, daysInMonth, weekdayOf, weekdayNames } from "@/lib/localDate.js";
import { cx } from "@/components/common/ui.jsx";

export function MonthGrid({ year, month, onSelect, selected }) {
  const { record, analysis, today, t, fmt, lang } = useApp();
  const first = ymd(year, month, 1);
  const lead = weekdayOf(first);
  const n = daysInMonth(year, month);
  const p = analysis.prediction;
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => ymd(year, month, i + 1))];
  const names = weekdayNames(lang);
  return (
    <div role="grid" aria-label={t("cal.title")}>
      <div role="row" className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground">
        {names.map((w) => <div role="columnheader" key={w} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const e = record.days[d];
          const logged = !!e?.period;
          const predicted = !logged && p && d >= p.start && d <= p.end && d > today;
          const sym = !!(e && (e.symptoms?.length || e.pain > 0 || e.mood));
          const parts = [fmt(d, { day: "numeric", month: "long" })];
          if (logged) parts.push(t("cal.periodDay"));
          if (predicted) parts.push(t("cal.estDay"));
          if (sym) parts.push(t("cal.symDay"));
          return (
            <button key={d} type="button" role="gridcell" aria-label={parts.join(", ")} aria-selected={selected === d} onClick={() => onSelect(d)}
              className={cx("relative flex aspect-square min-h-12 flex-col items-center justify-center rounded-full text-base font-semibold",
                logged && "bg-period text-period-foreground",
                predicted && "predicted-pattern border-2 border-dashed border-primary text-foreground",
                !logged && !predicted && "hover:bg-muted",
                selected === d && "ring-4 ring-ring",
                d === today && "underline decoration-2 underline-offset-4")}>
              <span>{Number(d.slice(8))}</span>
              {logged && <Droplet aria-hidden className="h-3 w-3" fill="currentColor" />}
              {sym && <span aria-hidden className={cx("absolute bottom-0.5 right-1 h-2 w-2 rounded-full", logged ? "bg-period-foreground" : "bg-foreground")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
