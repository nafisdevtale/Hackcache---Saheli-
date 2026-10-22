import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, Sources, inputCls, Status } from "@/components/common/ui.jsx";
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

  if (!pregnancyVisible) return (
    <div><PageTitle>{t("preg.title")}</PageTitle><Card><p>{t("preg.hiddenUnder18")}</p><Link to="/settings" className="mt-2 inline-block font-semibold underline">{t("nav.settings")}</Link></Card></div>
  );

  const turnOff = (resume) => update((r) => ({ ...r, pregnancy: { ...r.pregnancy, active: false }, settings: { ...r.settings, trackingPaused: !resume } }));

  if (!preg.active) return (
    <div className="space-y-4">
      <PageTitle sub={t("preg.intro")}>{t("preg.title")}</PageTitle>
      <Card className="space-y-3">
        <label className="flex min-h-12 items-start gap-3"><input type="checkbox" className="mt-1 h-6 w-6 accent-primary" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /><span>{t("preg.confirm")}</span></label>
        <label className="block font-semibold">{t("preg.lmp")}<input type="date" max={today} className={inputCls} value={lmp} onChange={(e) => setLmp(e.target.value)} /></label>
        <Status msg={err} tone="err" />
        <Btn className="w-full" disabled={!confirm} onClick={() => {
          if (!isValidDate(lmp) || lmp > today || diffDays(lmp, today) > 42 * 7) return setErr(t("preg.invalidLmp"));
          update((r) => ({ ...r, pregnancy: { active: true, lmp }, settings: { ...r.settings, trackingPaused: false } }));
        }}>{t("preg.start")}</Btn>
      </Card>
      {record.settings.trackingPaused && (
        <Card><p>{t("set.tracking")}</p><Btn variant="secondary" className="mt-2" onClick={() => update((r) => ({ ...r, settings: { ...r.settings, trackingPaused: false } }))}>{t("set.resumeTracking")}</Btn></Card>
      )}
    </div>
  );

  const days = diffDays(preg.lmp, today);
  const w = Math.floor(days / 7), d = days % 7;
  const stage = PREGNANCY_WEEKS.find((s) => w >= s.from && w <= s.to) || PREGNANCY_WEEKS[PREGNANCY_WEEKS.length - 1];
  return (
    <div className="space-y-4">
      <PageTitle>{t("preg.title")}</PageTitle>
      <Card className="bg-hero">
        <p className="font-display text-3xl font-bold text-primary">{t("preg.week", { w, d })}</p>
        <p className="mt-1 text-lg font-semibold">{t("preg.due", { date: fmt(addDays(preg.lmp, CONFIG.gestationDays), { day: "numeric", month: "long", year: "numeric" }) })}</p>
        <p className="text-sm text-muted-foreground">{t("preg.dueNote")}</p>
      </Card>
      <section className="urgent-pattern rounded-2xl border-4 border-urgent bg-urgent-soft p-4">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-urgent"><Siren aria-hidden className="h-6 w-6" /> {t("preg.warnings")}</h2>
        <ul className="ml-5 mt-1 list-disc">{PREGNANCY_WARNINGS.map((x) => <li key={x.id}>{t(`preg.warn.${x.id}`)}</li>)}</ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={`tel:${EMERGENCY.national}`} className="inline-flex min-h-12 items-center rounded-xl bg-urgent px-4 font-bold text-urgent-foreground">{t("doc.call112")}</a>
          <a href={`tel:${EMERGENCY.ambulance}`} className="inline-flex min-h-12 items-center rounded-xl bg-urgent px-4 font-bold text-urgent-foreground">{t("doc.call108")}</a>
        </div>
        <Sources ids={PREGNANCY_WARNINGS.map((x) => x.src)} />
      </section>
      <Card><h2 className="text-lg font-bold">{t("preg.thisWeek")}</h2><p className="mt-1">{L(stage)}</p><Sources ids={[stage.src]} /></Card>
      <Card>
        <h2 className="text-lg font-bold">{t("preg.checkups")}</h2>
        <p>{t("preg.checkupText")}</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {CHECKUP_WEEKS.map((cw) => (
            <li key={cw} className={`rounded-lg border-2 p-2 ${cw >= w && cw - w <= 4 ? "border-primary font-bold" : "border-border"}`}>
              {t("preg.checkupItem", { w: cw })} · {fmt(addDays(preg.lmp, cw * 7))}{cw >= w && cw - w <= 4 ? " ←" : ""}
            </li>
          ))}
        </ul>
        <p className="mt-2">{t("preg.pmsma")}</p>
        <Sources ids={["who_anc", "mohfw_pmsma"]} />
      </Card>
      <p className="text-sm text-muted-foreground">{t("preg.notDiag")}</p>
      {!askOff ? <Btn variant="outline" className="w-full" onClick={() => setAskOff(true)}>{t("preg.off")}</Btn> : (
        <Card role="dialog" aria-label={t("preg.offQ")}>
          <p className="font-semibold">{t("preg.offQ")}</p>
          <div className="mt-2 grid gap-2">
            <Btn onClick={() => turnOff(true)}>{t("preg.offYes")}</Btn>
            <Btn variant="outline" onClick={() => turnOff(false)}>{t("preg.offNo")}</Btn>
            <Btn variant="ghost" onClick={() => setAskOff(false)}>{t("common.cancel")}</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
