import { Link } from "@tanstack/react-router";
import {
  Printer,
  Info,
  Stethoscope,
  Phone,
  ShieldAlert,
  CalendarCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { PageTitle, Sources } from "@/components/common/ui.jsx";
import { GuidanceCard, UrgentCard, MoodSupport } from "@/components/common/GuidanceCard.jsx";
import { UNLOGGABLE_SIGNS } from "@/data/redflags.js";
import { DoctorPrepArt } from "@/components/brand/SaheliArt.jsx";

export default function DoctorGuidance() {
  const { t, safety } = useApp();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Clinical Guidance
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("doc.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("doc.intro")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Health Observations & Visit Summary CTA */}
        <div className="lg:col-span-7 space-y-4">
          {/* Urgent Flags from recorded logs */}
          {safety.urgent.map((c) => (
            <UrgentCard key={c.id} card={c} />
          ))}

          {/* Mood Support if needed */}
          <MoodSupport mood={safety.mood} />

          {/* Doctor Visit Summary Quick CTA */}
          <div className="bloom-card p-6 border-2 border-primary/20 flex flex-col sm:flex-row items-center gap-5">
            <DoctorPrepArt className="w-20 h-20 shrink-0" />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-bold">
                <Printer className="h-5 w-5 shrink-0" />
                <h2 className="font-display font-bold text-lg text-foreground">
                  {t("doc.prepare")}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate a printable, one-page clinical summary of your recorded cycle lengths,
                symptom frequencies, pain levels, and custom doctor questions to take to your
                appointment.
              </p>
              <div className="pt-1">
                <Link
                  to="/visit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-95 transition-all active:scale-98"
                >
                  <span>{t("doc.prepare")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Diary Clinical Observations */}
          <div className="space-y-3">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Diary Pattern Observations
            </h2>
            {safety.cards.length ? (
              safety.cards.map((c) => <GuidanceCard key={c.id} card={c} />)
            ) : (
              <div className="bloom-card p-6 space-y-2 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-secondary-strong" />
                <p className="text-sm font-bold text-foreground">{t("doc.none")}</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Continue logging your cycles and symptoms regularly. If unusual bleeding, severe
                  cramps, or prolonged delays occur, Saheli will surface relevant clinical guidance
                  here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Unloggable Red Flags & Helplines */}
        <div className="lg:col-span-5 space-y-4">
          {/* Healthcare Helplines */}
          <div className="bloom-card p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Direct Health Resources
            </h3>
            <div className="space-y-2">
              <a
                href="https://esanjeevani.mohfw.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-border p-3 hover:bg-muted transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">eSanjeevani OPD</p>
                    <p className="text-[10px] text-muted-foreground">
                      Free Govt of India Teleconsultation
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>

              <a
                href="tel:14416"
                className="flex items-center justify-between rounded-2xl border border-border p-3 hover:bg-muted transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="h-5 w-5 text-secondary-strong" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Tele-MANAS: 14416</p>
                    <p className="text-[10px] text-muted-foreground">
                      24/7 Mental Health Support (Toll-Free)
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>

              <a
                href="tel:112"
                className="flex items-center justify-between rounded-2xl border border-urgent/30 bg-urgent-soft/20 p-3 hover:bg-urgent-soft/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="h-5 w-5 text-urgent" />
                  <div>
                    <p className="text-xs font-bold text-urgent">Emergency Helpline: 112</p>
                    <p className="text-[10px] text-muted-foreground">National Emergency Number</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-urgent group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Unloggable Signs Box */}
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <span>{t("doc.cantTrack")}</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Certain symptoms cannot be managed through self-tracking and warrant immediate
              in-person clinical examination:
            </p>
            <ul className="space-y-2.5 text-xs">
              {UNLOGGABLE_SIGNS.map((s) => (
                <li key={s.id} className="rounded-xl bg-muted/40 p-2.5 border border-border/50">
                  <p className="font-bold text-foreground">{t(`uns.${s.id}.title`)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t(`uns.${s.id}.text`)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-border/50">
              <Sources ids={UNLOGGABLE_SIGNS.flatMap((s) => s.sources)} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            {t("common.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
