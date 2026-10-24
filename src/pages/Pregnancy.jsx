import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Siren,
  Baby,
  Calendar,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Stethoscope,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, PageTitle, Sources, inputCls, Status } from "@/components/common/ui.jsx";
import { PREGNANCY_WEEKS, CHECKUP_WEEKS, PREGNANCY_WARNINGS } from "@/content/pregnancyWeeks.js";
import { addDays, diffDays, isValidDate } from "@/lib/localDate.js";
import { CONFIG, EMERGENCY } from "@/config.js";

export default function Pregnancy() {
  const { t, L, fmt, record, update, pregnancyVisible, analysis, today } = useApp();
  const preg = record.pregnancy;
  const [confirm, setConfirm] = useState(false);
  const [lmp, setLmp] = useState(analysis.lastStart || today);
  const [err, setErr] = useState("");
  const [askOff, setAskOff] = useState(false);

  if (!pregnancyVisible)
    return (
      <div className="space-y-4 max-w-xl mx-auto py-8">
        <PageTitle>{t("preg.title")}</PageTitle>
        <div className="bloom-card p-6 space-y-3">
          <p className="text-sm text-muted-foreground">{t("preg.hiddenUnder18")}</p>
          <Link
            to="/settings"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground"
          >
            {t("nav.settings")}
          </Link>
        </div>
      </div>
    );

  const turnOff = (resume) =>
    update((r) => ({
      ...r,
      pregnancy: { ...r.pregnancy, active: false },
      settings: { ...r.settings, trackingPaused: !resume },
    }));

  if (!preg.active)
    return (
      <div className="space-y-6 max-w-xl mx-auto py-4">
        <div className="border-b border-border/60 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Maternity Care
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("preg.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("preg.intro")}</p>
        </div>

        <div className="bloom-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Baby className="h-5 w-5" />
            <span>Enable Pregnancy Mode</span>
          </div>

          <label className="flex min-h-12 items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-border accent-primary shrink-0"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            <span className="text-xs text-foreground leading-relaxed">{t("preg.confirm")}</span>
          </label>

          <div className="space-y-1">
            <label
              htmlFor="preg-lmp-date"
              className="block font-bold text-xs uppercase tracking-wider text-muted-foreground"
            >
              {t("preg.lmp")}
            </label>
            <input
              id="preg-lmp-date"
              type="date"
              max={today}
              className={inputCls}
              value={lmp}
              onChange={(e) => setLmp(e.target.value)}
            />
          </div>

          <Status msg={err} tone="err" />

          <Btn
            className="w-full min-h-12 text-sm font-bold"
            disabled={!confirm}
            onClick={() => {
              if (!isValidDate(lmp) || lmp > today || diffDays(lmp, today) > 42 * 7)
                return setErr(t("preg.invalidLmp"));
              update((r) => ({
                ...r,
                pregnancy: { active: true, lmp },
                settings: { ...r.settings, trackingPaused: false },
              }));
            }}
          >
            {t("preg.start")}
          </Btn>
        </div>

        {record.settings.trackingPaused && (
          <div className="rounded-3xl border border-border/70 bg-hero p-5 shadow-soft space-y-2">
            <p className="text-xs text-muted-foreground">{t("set.tracking")}</p>
            <Btn
              variant="secondary"
              className="w-full text-xs font-bold min-h-11"
              onClick={() =>
                update((r) => ({ ...r, settings: { ...r.settings, trackingPaused: false } }))
              }
            >
              {t("set.resumeTracking")}
            </Btn>
          </div>
        )}
      </div>
    );

  const days = diffDays(preg.lmp, today);
  const w = Math.floor(days / 7),
    d = days % 7;
  const stage =
    PREGNANCY_WEEKS.find((s) => w >= s.from && w <= s.to) ||
    PREGNANCY_WEEKS[PREGNANCY_WEEKS.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Maternity Tracking
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("preg.title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Progress, Estimated Due Date, Milestones */}
        <div className="lg:col-span-6 space-y-4">
          {/* Week Counter Hero */}
          <div className="rounded-3xl border-2 border-primary/20 bg-hero p-6 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Baby className="h-4 w-4" />
              <span>Current Gestational Age</span>
            </div>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
              {t("preg.week", { w, d })}
            </p>
            <div className="pt-2 border-t border-border/60 space-y-0.5">
              <p className="text-sm font-bold text-foreground">
                {t("preg.due", {
                  date: fmt(addDays(preg.lmp, CONFIG.gestationDays), {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                })}
              </p>
              <p className="text-xs text-muted-foreground">{t("preg.dueNote")}</p>
            </div>
          </div>

          {/* This Week's Development Stage */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-3">
            <h2 className="font-display font-bold text-lg text-foreground">{t("preg.thisWeek")}</h2>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {L(stage)}
            </p>
            <div className="pt-2 border-t border-border/50">
              <Sources ids={[stage.src]} />
            </div>
          </div>

          {/* Exit / Turn off pregnancy mode */}
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
            {!askOff ? (
              <Btn
                variant="outline"
                className="w-full text-xs font-semibold min-h-11"
                onClick={() => setAskOff(true)}
              >
                {t("preg.off")}
              </Btn>
            ) : (
              <div role="dialog" aria-label={t("preg.offQ")} className="space-y-3">
                <p className="font-bold text-sm text-foreground">{t("preg.offQ")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Btn onClick={() => turnOff(true)} className="text-xs min-h-11">
                    {t("preg.offYes")}
                  </Btn>
                  <Btn
                    variant="outline"
                    onClick={() => turnOff(false)}
                    className="text-xs min-h-11"
                  >
                    {t("preg.offNo")}
                  </Btn>
                </div>
                <button
                  type="button"
                  onClick={() => setAskOff(false)}
                  className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground py-1 text-center"
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Red Flag Warnings & Checkup Schedule */}
        <div className="lg:col-span-6 space-y-4">
          {/* Urgent Warning Signs in Pregnancy */}
          <div className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 text-urgent font-bold text-lg">
              <Siren aria-hidden className="h-6 w-6" />
              <h2>{t("preg.warnings")}</h2>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              {PREGNANCY_WARNINGS.map((x) => (
                <li key={x.id} className="flex items-start gap-2">
                  <span className="text-urgent font-bold">•</span>
                  <span>{t(`preg.warn.${x.id}`)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`tel:${EMERGENCY.national}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-5 font-bold text-urgent-foreground shadow-sm hover:opacity-95"
              >
                <Phone className="h-4 w-4" /> {t("doc.call112")}
              </a>
              <a
                href={`tel:${EMERGENCY.ambulance}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-urgent px-5 font-bold text-urgent-foreground shadow-sm hover:opacity-95"
              >
                <Phone className="h-4 w-4" /> {t("doc.call108")}
              </a>
            </div>
            <Sources ids={PREGNANCY_WARNINGS.map((x) => x.src)} />
          </div>

          {/* Recommended Antenatal Checkups (WHO & PMSMA India) */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft space-y-3">
            <h2 className="font-display font-bold text-base text-foreground">
              {t("preg.checkups")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("preg.checkupText")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {CHECKUP_WEEKS.map((cw) => {
                const isCurrent = cw >= w && cw - w <= 4;
                return (
                  <div
                    key={cw}
                    className={`rounded-2xl p-3 text-xs border transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/5 font-bold text-primary shadow-xs"
                        : "border-border/60 bg-muted/30 text-foreground"
                    }`}
                  >
                    <p className="font-bold">
                      {t("preg.checkupItem", { w: cw })}
                      {isCurrent && " · Next"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {fmt(addDays(preg.lmp, cw * 7))}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              {t("preg.pmsma")}
            </p>
            <Sources ids={["who_anc", "mohfw_pmsma"]} />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed px-1">{t("preg.notDiag")}</p>
        </div>
      </div>
    </div>
  );
}
