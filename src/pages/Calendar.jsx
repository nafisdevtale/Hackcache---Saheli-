import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Droplet } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle } from "@/components/common/ui.jsx";
import { MonthGrid } from "@/components/calendar/MonthGrid.jsx";
import { monthTitle } from "@/lib/localDate.js";

export default function Calendar() {
  const { t, today, lang, record, fmt } = useApp();
  const [ym, setYm] = useState(() => [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]);
  const [sel, setSel] = useState(today);
  const move = (n) =>
    setYm(([y, m]) => {
      const x = m + n;
      return [y + Math.floor(x / 12), ((x % 12) + 12) % 12];
    });
  const e = record.days[sel];
  return (
    <div className="space-y-4">
      <PageTitle>{t("cal.title")}</PageTitle>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label={t("cal.prevMonth")}
            onClick={() => move(-1)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border"
          >
            <ChevronLeft aria-hidden />
          </button>
          <h2 className="text-xl font-bold" aria-live="polite">
            {monthTitle(ym[0], ym[1], lang)}
          </h2>
          <button
            type="button"
            aria-label={t("cal.nextMonth")}
            onClick={() => move(1)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
        <MonthGrid year={ym[0]} month={ym[1]} selected={sel} onSelect={setSel} />
      </Card>

      <Card>
        <h2 className="text-lg font-bold">
          {fmt(sel, { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        {e ? (
          <ul className="mt-1 space-y-0.5">
            {e.period && (
              <li>
                {t("cal.periodDay")}: {t(`flow.${e.flow || "medium"}`)}
              </li>
            )}
            {e.pain > 0 && (
              <li>
                {t("log.pain")}: {e.pain}/10
              </li>
            )}
            {e.symptoms?.length > 0 && (
              <li>
                {t("log.symptoms")}: {e.symptoms.map((s) => t(`sym.${s}`)).join(", ")}
              </li>
            )}
            {e.mood && (
              <li>
                {t("log.mood")}: {t(`mood.${e.mood}`)}
              </li>
            )}
            {e.energy && (
              <li>
                {t("log.energy")}: {t(`energy.${e.energy}`)}
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-1 text-muted-foreground">{t("cal.noEntry")}</p>
        )}
        {sel <= today && (
          <Link
            to="/log"
            search={{ date: sel }}
            className="mt-3 inline-flex min-h-12 items-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground"
          >
            {e ? t("cal.editEntry") : t("cal.addEntry")}
          </Link>
        )}
      </Card>

      <Card>
        <h2 className="font-bold">{t("cal.legend")}</h2>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-period text-period-foreground"
            >
              <Droplet className="h-3 w-3" fill="currentColor" />
            </span>
            {t("cal.logged")}
          </li>
          <li className="flex items-center gap-3">
            <span
              aria-hidden
              className="predicted-pattern h-9 w-9 rounded-full border-2 border-dashed border-primary"
            />
            {t("cal.predicted")}
          </li>
          <li className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-end justify-end rounded-full border border-border p-1"
            >
              <span className="h-2 w-2 rounded-full bg-foreground" />
            </span>
            {t("cal.symptom")}
          </li>
          <li className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center font-semibold underline decoration-2 underline-offset-4"
            >
              1
            </span>
            {t("cal.today")}
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common.fertilityDisclaimer").split(".")[0]}.
        </p>
      </Card>
    </div>
  );
}
