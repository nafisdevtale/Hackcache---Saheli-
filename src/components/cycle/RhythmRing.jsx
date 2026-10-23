import { useState, useId } from "react";
import { Link } from "@tanstack/react-router";
import { Droplet, Sparkles, ChevronRight, RotateCcw, Calendar, AlertCircle } from "lucide-react";
import { useApp } from "@/App.jsx";
import { cx } from "@/components/common/ui.jsx";
import { diffDays, addDays, todayStr } from "@/lib/localDate.js";
import { phaseKey } from "@/lib/cycle.js";

export function RhythmRing({ analysis, record, onOpenLogger, className }) {
  const { t, fmt, fmtRange, today } = useApp();
  const patternId = useId();

  const currentCycleDay = analysis?.currentCycleDay || 1;
  const isInsufficient = analysis?.status === "insufficient";
  const isPaused = analysis?.status === "paused";
  const hasPrediction = !!analysis?.prediction;

  // Total days to display on the ring: median length or standard 28
  const cycleLength = analysis?.stats?.median || analysis?.prediction?.median || 28;
  const totalDays = Math.max(28, Math.min(45, cycleLength));

  // Default inspected day is today's cycle day, or day 1 if no cycle
  const [selectedDayNum, setSelectedDayNum] = useState(currentCycleDay);

  const lastStart = analysis?.lastStart;
  const inspectedDate = lastStart ? addDays(lastStart, selectedDayNum - 1) : today;
  const isInspectingToday = selectedDayNum === currentCycleDay;

  // Center & Dimensions for SVG (responsive 340px canvas)
  const size = 340;
  const center = size / 2;
  const strokeWidth = 20;
  const radius = center - strokeWidth - 14; // ~136px
  const circumference = 2 * Math.PI * radius;

  // Determine period duration from records or default
  const avgPeriodLength = Math.round(analysis?.stats?.avgPeriod || 5);
  const periodDaysCount = Math.max(1, Math.min(8, avgPeriodLength));

  // Determine prediction window mapped onto cycle days
  let predStartDay = 0;
  let predEndDay = 0;
  if (hasPrediction && lastStart) {
    predStartDay = Math.max(1, diffDays(lastStart, analysis.prediction.start) + 1);
    predEndDay = Math.min(totalDays + 4, diffDays(lastStart, analysis.prediction.end) + 1);
  }

  // Segment coordinate helpers
  const getAngle = (dayIndex) => {
    // 0 index is 12 o'clock (-90 degrees)
    return ((dayIndex - 1) / totalDays) * 360 - 90;
  };

  const polarToCartesian = (cxCoord, cyCoord, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cxCoord + r * Math.cos(angleInRadians),
      y: cyCoord + r * Math.sin(angleInRadians),
    };
  };

  // Check inspected day's logged entry
  const inspectedEntry = record?.days?.[inspectedDate];
  const hasLoggedPeriod = selectedDayNum <= periodDaysCount || inspectedEntry?.period;
  const isEstimatedRange =
    hasPrediction && selectedDayNum >= predStartDay && selectedDayNum <= predEndDay;

  return (
    <div
      role="region"
      aria-label="Interactive cycle rhythm ring"
      className={cx("relative mx-auto flex flex-col items-center justify-center p-2", className)}
    >
      <div className="relative flex items-center justify-center w-full max-w-[340px] aspect-square">
        {/* SVG Ring Canvas */}
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full select-none overflow-visible">
          <defs>
            {/* Striped Hatching Pattern for Uncertainty Interval */}
            <pattern
              id={patternId}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke="var(--primary)"
                strokeWidth="3"
                opacity="0.6"
              />
            </pattern>

            {/* Glowing filter for Current Day Indicator */}
            <filter id="currentGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="5"
                floodColor="var(--period)"
                floodOpacity="0.8"
              />
            </filter>

            {/* Ambient Aura Gradient inside the circle */}
            <radialGradient id="ringAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
              <stop offset="70%" stopColor="var(--period)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Internal ambient aura */}
          <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="url(#ringAura)" />

          {/* Background Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--card)"
            strokeWidth={strokeWidth}
            className="stroke-border/45"
          />

          {/* Normal Mode / Full Cycles */}
          {!isInsufficient && !isPaused ? (
            <>
              {/* 1. Logged Period Arc (Solid Dusty Rose) */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--period)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${(periodDaysCount / totalDays) * circumference} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                className="opacity-95 transition-all duration-500"
              />

              {/* 2. Predicted Next Period Arc (Uncertainty Hatched Pattern) */}
              {hasPrediction && predStartDay > 0 && (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={`url(#${patternId})`}
                  strokeWidth={strokeWidth + 2}
                  strokeDasharray={`${((predEndDay - predStartDay + 1) / totalDays) * circumference} ${circumference}`}
                  strokeDashoffset={-(((predStartDay - 1) / totalDays) * circumference)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  className="transition-all duration-500"
                />
              )}
            </>
          ) : (
            /* Insufficient / Learning Mode Arc */
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${(Math.min(currentCycleDay, totalDays) / totalDays) * circumference} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className="opacity-80 transition-all duration-500"
            />
          )}

          {/* Day Notch Segments & Interactive Click Targets */}
          {Array.from({ length: totalDays }, (_, i) => {
            const dayNum = i + 1;
            const angle = getAngle(dayNum);
            const isSelected = selectedDayNum === dayNum;
            const isToday = currentCycleDay === dayNum && !isInsufficient;
            const isPeriod = dayNum <= periodDaysCount;

            const pos = polarToCartesian(center, center, radius, angle + 90);

            return (
              <g
                key={dayNum}
                onClick={() => setSelectedDayNum(dayNum)}
                className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`Cycle Day ${dayNum}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedDayNum(dayNum);
                  }
                }}
              >
                {/* Active / Selected Day Ring Highlight */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={strokeWidth / 2 + 5}
                    fill="none"
                    stroke="var(--ring)"
                    strokeWidth="3.5"
                    className="animate-pulse"
                  />
                )}

                {/* Day Marker Dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isToday ? 6.5 : isPeriod ? 4.5 : 3}
                  fill={
                    isToday
                      ? "var(--period)"
                      : isPeriod
                        ? "var(--period-foreground)"
                        : isSelected
                          ? "var(--primary)"
                          : "var(--muted-foreground)"
                  }
                  filter={isToday ? "url(#currentGlow)" : undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* Central Rhythm Hub */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-card/95 p-6 text-center shadow-soft backdrop-blur-md transition-all border border-border/70"
          style={{
            width: `${(radius - strokeWidth) * 2}px`,
            height: `${(radius - strokeWidth) * 2}px`,
          }}
        >
          {isInsufficient ? (
            <div className="space-y-1.5">
              <Sparkles className="mx-auto h-7 w-7 text-primary animate-pulse" />
              <p className="font-display text-xl font-extrabold text-foreground tracking-tight">
                {t("today.progressTitle")}
              </p>
              <p className="text-xs leading-snug text-muted-foreground px-2">
                {t("today.insufficientCount", { n: analysis?.cycles?.length || 0 })}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {isInspectingToday
                  ? t("today.title")
                  : fmt(inspectedDate, { weekday: "short", day: "numeric", month: "short" })}
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                {t("today.cycleDay", { n: selectedDayNum })}
              </h2>

              <p className="text-xs font-semibold text-muted-foreground px-2">
                {hasLoggedPeriod
                  ? `🩸 ${t("cal.periodDay")}`
                  : isEstimatedRange
                    ? `⏳ ${t("common.estimate")}`
                    : t(phaseKey(analysis, inspectedDate))}
              </p>

              {/* Reset to Today if looking at another day */}
              {!isInspectingToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDayNum(currentCycleDay)}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-muted/80 px-3 py-0.5 text-[11px] font-bold text-primary hover:bg-muted transition-all active:scale-95"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t("today.title")}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Contextual Action Beneath the Ring */}
      <div className="mt-5 flex w-full max-w-xs flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={() => (onOpenLogger ? onOpenLogger(inspectedDate) : null)}
          className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-6 font-extrabold text-sm text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-98"
        >
          <Droplet className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
          <span>
            {isInspectingToday
              ? t("today.logToday")
              : `${t("log.title")} (${fmt(inspectedDate, { day: "numeric", month: "short" })})`}
          </span>
        </button>

        {/* Uncertainty-Aware Prediction Strip if exists */}
        {hasPrediction && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-period/70" />
            <span>
              {t("today.next")}:{" "}
              <strong>{fmtRange(analysis.prediction.start, analysis.prediction.end)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Screen reader text-only accessible equivalent */}
      <div className="sr-only">
        <p>
          Cycle Day {currentCycleDay} of {totalDays}.
          {hasPrediction &&
            ` Next estimated period range is ${fmtRange(analysis.prediction.start, analysis.prediction.end)}.`}
          {hasLoggedPeriod ? " Menstruation active." : " Follicular or luteal phase."}
        </p>
      </div>
    </div>
  );
}
