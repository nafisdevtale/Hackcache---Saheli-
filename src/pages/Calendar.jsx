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
import { CalendarEmptyArt } from "@/components/brand/SaheliArt.jsx";
import { PhaseCards } from "@/components/cycle/PhaseCards.jsx";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
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
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all active:scale-95"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{t("cal.today")}</span>
          </button>
        )}
      </div>

      {/* Responsive Layout: 2 Columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Grid & Navigation */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            {/* Month Switcher Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <button
                type="button"
                aria-label={t("cal.prevMonth")}
                onClick={() => move(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
              >
                <ChevronRight aria-hidden className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <MonthGrid year={ym[0]} month={ym[1]} selected={sel} onSelect={setSel} />
          </div>

          {/* Calendar Visual Legend */}
          <div className="bloom-card p-4 text-xs space-y-2.5">
            <h3 className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
              {t("cal.legend")}
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-3 py-1">
                <span
                  aria-hidden
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-period text-period-foreground"
                >
                  <Droplet className="h-2.5 w-2.5" fill="currentColor" />
                </span>
                <span className="font-medium text-foreground">{t("cal.logged")}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-3 py-1">
                <span
                  aria-hidden
                  className="predicted-pattern h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-primary"
                />
                <span className="font-medium text-foreground">{t("cal.predicted")}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-3 py-1">
                <span
                  aria-hidden
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-card"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                </span>
                <span className="font-medium text-foreground">{t("cal.symptom")}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-3 py-1">
                <span
                  aria-hidden
                  className="flex h-4 w-4 shrink-0 items-center justify-center font-bold text-primary underline decoration-2 underline-offset-2 text-xs"
                >
                  •
                </span>
                <span className="font-medium text-foreground">{t("cal.today")}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-3 py-1">
                <span
                  aria-hidden
                  className="flex h-4 w-4 shrink-0 items-center justify-center text-xs"
                >
                  ✨
                </span>
                <span className="font-medium text-foreground">{t("cal.obsDay")}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              {t("common.fertilityDisclaimer").split(".")[0]}.
            </p>
          </div>
        </div>

        {/* Right Column: Selected Day Inspector & Quick Logger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bloom-card p-5 sm:p-6 space-y-4">
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
              <div className="py-6 text-center text-muted-foreground space-y-2 flex flex-col items-center">
                <CalendarEmptyArt className="w-20 h-20 opacity-80" />
                <p className="text-xs font-semibold">{t("cal.noEntry")}</p>
              </div>
            )}

            {/* Ovulation Observation for Selected Date */}
            {record?.ovulationObservations?.[sel] && (
              <div className="rounded-2xl bg-secondary/10 border border-secondary/20 p-3 text-xs space-y-1">
                <span className="font-bold text-secondary-strong flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  ✨ {t("phase.ovulationCardTitle")}
                </span>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-0.5">
                  {record.ovulationObservations[sel].testResult !== "none" && (
                    <span className="font-semibold text-primary">
                      LH:{" "}
                      {t(
                        `phase.lh${record.ovulationObservations[sel].testResult.charAt(0).toUpperCase() + record.ovulationObservations[sel].testResult.slice(1)}`,
                      )}
                    </span>
                  )}
                  {record.ovulationObservations[sel].bbt != null && (
                    <span>
                      BBT: {record.ovulationObservations[sel].bbt} °
                      {record.ovulationObservations[sel].bbtUnit || "C"}
                    </span>
                  )}
                  {record.ovulationObservations[sel].cervicalFluid !== "none" && (
                    <span>
                      Fluid:{" "}
                      {t(
                        `phase.fluid${record.ovulationObservations[sel].cervicalFluid.charAt(0).toUpperCase() + record.ovulationObservations[sel].cervicalFluid.slice(1)}`,
                      )}
                    </span>
                  )}
                  {record.ovulationObservations[sel].notes && (
                    <span className="italic">"{record.ovulationObservations[sel].notes}"</span>
                  )}
                </div>
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

      {/* Menstrual Phase Education: Follicular & Luteal Cards */}
      <PhaseCards />

      {/* Quick Log Sheet for Selected Date */}
      <QuickLogSheet
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        targetDate={sel}
      />
    </div>
  );
}
