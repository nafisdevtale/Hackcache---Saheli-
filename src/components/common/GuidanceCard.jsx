import { Siren, Stethoscope, Phone, HeartHandshake } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, Sources } from "./ui.jsx";
import { EMERGENCY } from "@/config.js";

export function EvidenceList({ evidence }) {
  const { t, fmt, fmtRange } = useApp();
  return (
    <ul className="ml-5 list-disc space-y-0.5">
      {evidence.map((e, i) => (
        <li key={i}>
          {e.kind === "period" ? t("ev.period", { range: fmtRange(e.start, e.end), n: e.n })
            : e.kind === "cycle" ? t("ev.cycle", { range: fmtRange(e.start, e.end), n: e.n })
            : e.n ? t("ev.noPeriod", { date: fmt(e.start), n: e.n })
            : fmt(e.start, { day: "numeric", month: "short", year: "numeric" })}
        </li>
      ))}
    </ul>
  );
}

export function GuidanceCard({ card }) {
  const { t } = useApp();
  const p = card.params || {};
  return (
    <Card className="border-l-8 border-l-info">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-info-foreground">
        <Stethoscope aria-hidden className="h-5 w-5" /> {t("doc.guidanceLabel")}
      </p>
      <h3 className="mt-1 text-xl font-bold">{t(`rf.${card.id}.title`, p)}</h3>
      <dl className="mt-2 space-y-2">
        <div><dt className="font-semibold">{t("doc.evidence")}</dt><dd><EvidenceList evidence={card.evidence} /></dd></div>
        <div><dt className="font-semibold">{t("doc.why")}</dt><dd>{t(`rf.${card.id}.why`, p)}</dd></div>
        <div>
          <dt className="font-semibold">{t("doc.next")}</dt>
          <dd>
            <p>{t(`rf.${card.id}.action`, p)}</p>
            <ul className="ml-5 mt-1 list-disc">
              <li>{t("doc.optPhc")}</li>
              <li><a className="underline" href="https://esanjeevani.mohfw.gov.in/" target="_blank" rel="noopener noreferrer">{t("doc.optEsan")}</a></li>
              <li>{t("doc.optGyn")}</li>
            </ul>
          </dd>
        </div>
      </dl>
      <Sources ids={card.sources} />
    </Card>
  );
}

export function UrgentCard({ card }) {
  const { t } = useApp();
  return (
    <section role="alert" className="urgent-pattern rounded-2xl border-4 border-urgent bg-urgent-soft p-4 text-foreground">
      <p className="flex items-center gap-2 text-2xl font-extrabold text-urgent"><Siren aria-hidden className="h-7 w-7" /> {t("doc.urgentTitle")}</p>
      <h3 className="mt-1 text-lg font-bold">{t(`urgent.${card.id}.title`)}</h3>
      <p>{t(`urgent.${card.id}.why`)}</p>
      <div className="mt-2"><EvidenceList evidence={card.evidence} /></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a href={`tel:${EMERGENCY.national}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-urgent px-4 font-bold text-urgent-foreground"><Phone aria-hidden className="h-5 w-5" /> {t("doc.call112")}</a>
        <a href={`tel:${EMERGENCY.ambulance}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-urgent px-4 font-bold text-urgent-foreground"><Phone aria-hidden className="h-5 w-5" /> {t("doc.call108")}</a>
      </div>
      <p className="mt-2 font-medium">{t("doc.urgentNotApp")}</p>
      <Sources ids={card.sources} />
    </section>
  );
}

export function MoodSupport({ mood }) {
  const { t, fmt } = useApp();
  if (!mood) return null;
  return (
    <Card className="border-l-8 border-l-secondary-strong">
      <h3 className="flex items-center gap-2 text-xl font-bold"><HeartHandshake aria-hidden className="h-6 w-6" /> {t("mood.supportTitle")}</h3>
      <p className="mt-1">{t("mood.supportText", { dates: mood.dates.map((d) => fmt(d)).join(", ") })}</p>
      <a href={`tel:${EMERGENCY.teleManas}`} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"><Phone aria-hidden className="h-5 w-5" /> {t("mood.call")}</a>
      <p className="mt-2 text-sm">{t("mood.emergency")}</p>
      <Sources ids={["telemanas"]} />
    </Card>
  );
}
