import { useState } from "react";
import { Sparkles, ShieldCheck, Heart, Users, CalendarCheck, X } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card } from "@/components/common/ui.jsx";

export function AdultTransitionCard() {
  const { t, isAdultTransitionEligible, updateAdultConsent, postponeAdultTransition } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isAdultTransitionEligible) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await updateAdultConsent();
      setModalOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handlePostpone = async () => {
    setBusy(true);
    try {
      await postponeAdultTransition();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        data-testid="adult-transition-card"
        className="mx-auto my-3 w-full max-w-6xl px-4 print:hidden animate-fade-in"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            <div className="rounded-2xl bg-primary/20 p-2.5 text-primary shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                {t("adult.transitionTitle") || "A New Chapter of Saheli"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {t("adult.transitionDesc") ||
                  "Happy 18th Birthday! You are now eligible to access adult health predictions, full community discussions, and unrestricted partner settings."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <Btn
              size="sm"
              onClick={() => setModalOpen(true)}
              className="flex-1 sm:flex-initial rounded-2xl font-bold px-4"
            >
              {t("adult.transitionUpdate") || "Update My Experience"}
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              onClick={handlePostpone}
              disabled={busy}
              className="rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("adult.transitionNotNow") || "Not Now"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Adult Transition Explanation & Consent Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adult-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              aria-label={t("common.close") || "Close"}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span>{t("onb.dobAdultBadge") || "Full Adult Mode (18+)"}</span>
              </div>
              <h2
                id="adult-modal-title"
                className="font-display text-xl sm:text-2xl font-extrabold text-foreground"
              >
                {t("adult.modalTitle") || "Unlock Adult Experience"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("adult.modalIntro") ||
                  "As an adult (18+), you can now enable additional capabilities:"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
                <CalendarCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-foreground">
                    {t("adult.modalPoint1") || "Ovulation and fertile window estimates"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {t("set.fertilityDesc") ||
                      "View estimated fertile windows, peak days, and clinical cycle projections."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-foreground">
                    {t("adult.modalPoint2") || "Saheli community peer discussions"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {t("comm.intro") ||
                      "A safe, pseudonymous peer-support space for women and girls across India."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
                <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-foreground">
                    {t("adult.modalPoint3") || "Full partner sharing controls"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {t("partner.subtitle") ||
                      "Optional end-to-end encrypted sharing of cycle milestones with a trusted partner."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">
                {t("onb.privacyExplainTitle") || "Complete Privacy Guarantee"}
              </p>
              {t("adult.modalPrivacy") ||
                "All your existing cycle logs, companion pets, and settings are preserved. Your date of birth remains private and encrypted on your device."}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <Btn
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto rounded-2xl"
              >
                {t("adult.modalCancel") || "Keep Current Settings"}
              </Btn>
              <Btn
                type="button"
                onClick={handleConfirm}
                disabled={busy}
                className="w-full sm:w-auto rounded-2xl font-bold"
              >
                {busy
                  ? t("common.loading") || "Updating…"
                  : t("adult.modalConfirm") || "Confirm Adult Experience"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
