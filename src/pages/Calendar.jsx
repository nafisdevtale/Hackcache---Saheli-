import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Droplet,
  Calendar as CalendarIcon,
  Sparkles,
  Edit3,
  Plus,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Btn } from "@/components/common/ui.jsx";
import { MonthGrid } from "@/components/calendar/MonthGrid.jsx";
import { monthTitle } from "@/lib/localDate.js";
import { blankDay } from "@/lib/exportImport.js";
import { QuickLogSheet } from "@/components/logging/QuickLogSheet.jsx";

export default function Calendar() {
  const { t, today, lang, record, fmt, saveDay } = useApp();
  const [ym, setYm] = useState(() => [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]);
  const [sel, setSel] = useState(today);
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const move = (n) =>
    setYm(([y, m]) => {
      const x = m + n;
      return [y + Math.floor(x / 12), ((x % 12) + 12) % 12];
    });

  const e = record.days[sel];
  const isSelectedToday = sel === today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {t("cal.title")}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {monthTitle(ym[0], ym[1], lang)}
          </h1>
        </div>

        {/* Quick Return to Today if navigated away */}
        {!isSelectedToday && (
          <button
            type="button"
            onClick={() => {
              setSel(today);
              setYm([Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]);
            }}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted transition-all"
          >
            {t("cal.today")}
          </button>
        )}
      </div>

      {/* Responsive Layout: 2 Columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Grid & Navigation */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
            {/* Month Switcher Controls */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                aria-label={t("cal.prevMonth")}
                onClick={() => move(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border hover:bg-muted text-foreground transition-all active:scale-95"
              >
                <ChevronLeft aria-hidden className="h-5 w-5" />
              </button>
              <h2 className="font-display text-lg font-bold text-foreground" aria-live="polite">
                {monthTitle(ym[0], ym[1], lang)}
              </h2>
              <button
                type="button"
                aria-label={t("cal.nextMonth")}
                onClick={() => move(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border hover:bg-muted text-foreground transition-all active:scale-95"
              >
                <ChevronRight aria-hidden className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <MonthGrid year={ym[0]} month={ym[1]} selected={sel} onSelect={setSel} />
          </div>

          {/* Calendar Visual Legend */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs text-xs">
            <h3 className="font-bold text-muted-foreground uppercase tracking-wider mb-2.5 text-[11px]">
              {t("cal.legend")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-period text-period-foreground"
                >
                  <Droplet className="h-3 w-3" fill="currentColor" />
                </span>
                <span className="font-medium">{t("cal.logged")}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="predicted-pattern h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-primary"
                />
                <span className="font-medium">{t("cal.predicted")}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                </span>
                <span className="font-medium">{t("cal.symptom")}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center font-bold underline decoration-2 underline-offset-2"
                >
                  1
                </span>
                <span className="font-medium">{t("cal.today")}</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {t("common.fertilityDisclaimer").split(".")[0]}.
            </p>
          </div>
        </div>

        {/* Right Column: Selected Day Inspector & Quick Logger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {isSelectedToday ? t("cal.today") : t("cal.title")}
                </span>
                <h2 className="font-display text-xl font-extrabold text-foreground">
                  {fmt(sel, { weekday: "long", day: "numeric", month: "short" })}
                </h2>
              </div>
              {sel <= today && (
                <button
                  type="button"
                  onClick={() => setQuickLogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{e ? t("cal.editEntry") : t("cal.addEntry")}</span>
                </button>
              )}
            </div>

            {/* Day Log Details */}
            {e ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {e.period && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-period/15 px-3 py-1 font-bold text-period">
                      🩸 {t("cal.periodDay")} ({t(`flow.${e.flow || "medium"}`)})
                    </span>
                  )}
                  {e.pain > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-destructive/15 px-3 py-1 font-semibold text-destructive">
                      ⚡ {t("log.pain")}: {e.pain}/10
                    </span>
                  )}
                  {e.mood && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
                      ✨ {t(`mood.${e.mood}`)}
                    </span>
                  )}
                  {e.energy && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-1 font-semibold text-accent-foreground">
                      ⚡ {t(`energy.${e.energy}`)}
                    </span>
                  )}
                </div>

                {e.symptoms?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                      {t("log.symptoms")}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {e.symptoms.map((s) => (
                        <span
                          key={s}
                          className="rounded-lg border border-border bg-muted/70 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {t(`sym.${s}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {e.note && (
                  <p className="border-l-2 border-primary/50 pl-2.5 text-xs italic text-muted-foreground">
                    "{e.note}"
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground space-y-2">
                <CalendarIcon className="mx-auto h-8 w-8 opacity-40" />
                <p className="text-xs font-medium">{t("cal.noEntry")}</p>
              </div>
            )}

            {/* Quick 1-Tap Period Toggle & Full Logger Link */}
            {sel <= today && (
              <div className="pt-2 border-t border-border/50 flex flex-wrap gap-2">
                {!e?.period ? (
                  <Btn
                    variant="outline"
                    className="flex-1 min-h-11 rounded-2xl text-xs font-bold"
                    onClick={() =>
                      saveDay({
                        ...blankDay(sel),
                        ...(e || {}),
                        period: true,
                        flow: e?.flow || "medium",
                      })
                    }
                  >
                    🩸 {t("cal.startPeriod")}
                  </Btn>
                ) : (
                  <Btn
                    variant="outline"
                    className="flex-1 min-h-11 rounded-2xl text-xs font-bold"
                    onClick={() =>
                      saveDay({
                        ...blankDay(sel),
                        ...(e || {}),
                        period: false,
                        flow: null,
                      })
                    }
                  >
                    {t("cal.endPeriod")}
                  </Btn>
                )}

                <Link
                  to="/log"
                  search={{ date: sel }}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border px-4 text-xs font-semibold hover:bg-muted text-foreground transition-all"
                >
                  {t("log.title")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Log Sheet for Selected Date */}
      <QuickLogSheet
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        targetDate={sel}
      />
    </div>
  );
}
