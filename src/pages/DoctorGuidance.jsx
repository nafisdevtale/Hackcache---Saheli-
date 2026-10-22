import { Link } from "@tanstack/react-router";
import { Printer, Info } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Card, PageTitle, Sources } from "@/components/common/ui.jsx";
import { GuidanceCard, UrgentCard, MoodSupport } from "@/components/common/GuidanceCard.jsx";
import { UNLOGGABLE_SIGNS } from "@/data/redflags.js";

export default function DoctorGuidance() {
  const { t, safety } = useApp();
  return (
    <div className="space-y-4">
      <PageTitle sub={t("doc.intro")}>{t("doc.title")}</PageTitle>
      {safety.urgent.map((c) => (
        <UrgentCard key={c.id} card={c} />
      ))}
      <MoodSupport mood={safety.mood} />
      {safety.cards.length ? (
        safety.cards.map((c) => <GuidanceCard key={c.id} card={c} />)
      ) : (
        <Card>
          <p>{t("doc.none")}</p>
        </Card>
      )}
      <Link
        to="/visit"
        className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-lg font-bold text-primary-foreground"
      >
        <Printer aria-hidden className="h-6 w-6" /> {t("doc.prepare")}
      </Link>
      <Card>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Info aria-hidden className="h-5 w-5" /> {t("doc.cantTrack")}
        </h2>
        <ul className="mt-2 space-y-2">
          {UNLOGGABLE_SIGNS.map((s) => (
            <li key={s.id}>
              <strong>{t(`uns.${s.id}.title`)}.</strong> {t(`uns.${s.id}.text`)}
            </li>
          ))}
        </ul>
        <Sources ids={UNLOGGABLE_SIGNS.flatMap((s) => s.sources)} />
      </Card>
      <p className="text-sm text-muted-foreground">{t("common.disclaimer")}</p>
    </div>
  );
}
