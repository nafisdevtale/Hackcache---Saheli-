import { Siren, Stethoscope, Phone, HeartHandshake, AlertCircle, ExternalLink } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, Sources } from "./ui.jsx";
import { EMERGENCY } from "@/config.js";

export function EvidenceList({ evidence }) {
  const { t, fmt, fmtRange } = useApp();
  return (
    <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-5">
      {evidence.map((e, i) => (
        <li key={i} className="leading-relaxed">
          {e.kind === "period"
            ? t("ev.period", { range: fmtRange(e.start, e.end), n: e.n })
            : e.kind === "cycle"
              ? t("ev.cycle", { range: fmtRange(e.start, e.end), n: e.n })
              : e.n
                ? t("ev.noPeriod", { date: fmt(e.start), n: e.n })
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
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs space-y-4 transition-all hover:border-primary/40">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-info/10 text-info">
          <Stethoscope aria-hidden className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-info">
          {t("doc.guidanceLabel")}
        </span>
      </div>

      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
        {t(`rf.${card.id}.title`, p)}
      </h3>

      <div className="space-y-3 text-xs leading-relaxed">
        <div className="rounded-2xl bg-muted/40 p-3.5 space-y-1">
          <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
            {t("doc.evidence")}
          </span>
          <EvidenceList evidence={card.evidence} />
        </div>

        <div className="space-y-1">
          <span className="font-bold text-foreground block">{t("doc.why")}</span>
          <p className="text-muted-foreground leading-relaxed">{t(`rf.${card.id}.why`, p)}</p>
        </div>

        <div className="space-y-1 pt-1 border-t border-border/40">
          <span className="font-bold text-foreground block">{t("doc.next")}</span>
          <p className="text-muted-foreground leading-relaxed">{t(`rf.${card.id}.action`, p)}</p>
          <ul className="mt-2 space-y-1 text-muted-foreground list-disc pl-5">
            <li>{t("doc.optPhc")}</li>
            <li>
              <a
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                href="https://esanjeevani.mohfw.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{t("doc.optEsan")}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>{t("doc.optGyn")}</li>
          </ul>
        </div>
      </div>

      <div className="pt-2 border-t border-border/40">
        <Sources ids={card.sources} />
      </div>
    </div>
  );
}

export function UrgentCard({ card }) {
  const { t } = useApp();
  return (
    <section
      role="alert"
      className="rounded-3xl border-2 border-urgent/60 bg-urgent-soft/40 p-6 text-foreground shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2.5 text-urgent font-extrabold text-lg sm:text-xl">
        <Siren aria-hidden className="h-6 w-6 animate-pulse" />
        <span>{t("doc.urgentTitle")}</span>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-foreground">
          {t(`urgent.${card.id}.title`)}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
          {t(`urgent.${card.id}.why`)}
        </p>
      </div>

      <div className="rounded-2xl bg-background/60 p-3.5">
        <EvidenceList evidence={card.evidence} />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
        <a
          href={`tel:${EMERGENCY.national}`}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-urgent px-4 font-bold text-xs text-urgent-foreground shadow-sm hover:opacity-95 transition-all"
        >
          <Phone className="h-4 w-4" />
          <span>{t("doc.call112")} (112)</span>
        </a>
        <a
          href={`tel:${EMERGENCY.ambulance}`}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 border-urgent bg-background px-4 font-bold text-xs text-urgent hover:bg-urgent/10 transition-all"
        >
          <Phone className="h-4 w-4" />
          <span>{t("doc.call108")} (108)</span>
        </a>
      </div>
    </section>
  );
}

export function MoodSupport({ mood }) {
  const { t } = useApp();
  if (!mood || !mood.trigger) return null;
  return (
    <section
      role="region"
      aria-label={t("mood.supportTitle")}
      className="rounded-3xl border border-secondary-strong/40 bg-gradient-to-br from-secondary/30 to-background p-6 shadow-xs space-y-4"
    >
      <div className="flex items-center gap-2.5 text-secondary-strong font-bold">
        <HeartHandshake aria-hidden className="h-5 w-5" />
        <h2 className="font-display text-base font-bold text-foreground">
          {t("mood.supportTitle")}
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {t("mood.supportBody")}
      </p>

      <div className="pt-1">
        <a
          href={`tel:${EMERGENCY.teleManas}`}
          className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-secondary-strong px-5 font-bold text-xs text-secondary-foreground shadow-sm hover:opacity-95 transition-all"
        >
          <Phone className="h-4 w-4" />
          <span>{t("mood.callTeleManas")}</span>
        </a>
      </div>

      <div className="pt-2 border-t border-border/40">
        <Sources ids={["telemanas", "india_112"]} />
      </div>
    </section>
  );
}
