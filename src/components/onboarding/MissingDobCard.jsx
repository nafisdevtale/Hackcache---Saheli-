import { useState, useMemo } from "react";
import { Calendar, ShieldAlert, Sparkles, X, Check } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidDob, calculateAge, isLeapYear } from "@/lib/agePolicy.ts";

export function MissingDobCard() {
  const { t, record, updateDateOfBirth, today } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [dobYear, setDobYear] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");

  const hasDob = !!record?.settings?.dob;

  // Generate Year options (1920 to current year)
  const currentYear = Number(today.split("-")[0]) || new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1920; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Generate days in month
  const daysInMonth = useMemo(() => {
    const m = Number(dobMonth);
    const y = Number(dobYear);
    if (!m) return 31;
    if (m === 2) {
      if (y && isLeapYear(y)) return 29;
      return 28;
    }
    if ([4, 6, 9, 11].includes(m)) return 30;
    return 31;
  }, [dobMonth, dobYear]);

  const constructedDob = useMemo(() => {
    if (!dobYear || !dobMonth || !dobDay) return "";
    const m = dobMonth.padStart(2, "0");
    const d = dobDay.padStart(2, "0");
    return `${dobYear}-${m}-${d}`;
  }, [dobYear, dobMonth, dobDay]);

  const ageCalculation = useMemo(() => {
    if (!constructedDob || !isValidDob(constructedDob, today)) return null;
    return calculateAge(constructedDob, today);
  }, [constructedDob, today]);

  if (hasDob || dismissed) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!constructedDob || !isValidDob(constructedDob, today)) {
      setErrorMsg(t("onb.dobInvalid") || "Please enter a valid date of birth.");
      return;
    }

    setBusy(true);
    setErrorMsg("");
    try {
      await updateDateOfBirth(constructedDob);
      setModalOpen(false);
    } catch {
      setErrorMsg(t("onb.dobInvalid") || "Failed to update date of birth.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        data-testid="missing-dob-card"
        className="mx-auto my-3 w-full max-w-6xl px-4 print:hidden animate-fade-in"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-accent/20 p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="rounded-2xl bg-primary/20 p-2.5 text-primary shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-sm sm:text-base font-bold text-foreground">
                {t("onb.missingDobTitle") || "Add your Date of Birth for Personalized Care"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {t("onb.missingDobDesc") ||
                  "Saheli customizes clinical thresholds, cycle predictions, and health education to your exact age group. Your records stay encrypted on this device."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <Btn
              size="sm"
              onClick={() => setModalOpen(true)}
              className="flex-1 sm:flex-initial rounded-2xl font-bold px-4 text-xs"
            >
              {t("onb.addDob") || "Add Date of Birth"}
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("adult.transitionNotNow") || "Not Now"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Date of Birth Selection Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="missing-dob-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              aria-label={t("common.close") || "Close"}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Calendar className="h-4 w-4" />
                <span>{t("onb.dobTitle") || "Date of Birth"}</span>
              </div>
              <h2
                id="missing-dob-modal-title"
                className="font-display text-lg sm:text-xl font-extrabold text-foreground"
              >
                {t("onb.dobTitle") || "What is your date of birth?"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("onb.dobSubtitle") ||
                  "Used solely on-device to personalize cycle parameters and safeguards."}
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {/* Day */}
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                    {t("onb.dobDay") || "Day"}
                  </label>
                  <select
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    className={cx(inputCls, "bg-background text-sm")}
                    required
                  >
                    <option value="">--</option>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                    {t("onb.dobMonth") || "Month"}
                  </label>
                  <select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    className={cx(inputCls, "bg-background text-sm")}
                    required
                  >
                    <option value="">--</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m)}>
                        {t(`month.${m}`) || m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                    {t("onb.dobYear") || "Year"}
                  </label>
                  <select
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    className={cx(inputCls, "bg-background text-sm")}
                    required
                  >
                    <option value="">----</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {ageCalculation && (
                <div className="rounded-2xl bg-muted/50 p-3 text-xs space-y-1 border border-border/60">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>
                      {t("onb.dobAgeNotice", { age: ageCalculation.years }) ||
                        `Age: ${ageCalculation.years} years`}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {ageCalculation.isUnder18
                      ? t("onb.under18Desc") || "Configuring adolescent safeguarding mode."
                      : t("onb.adultDesc") || "Configuring adult mode with full insights."}
                  </p>
                </div>
              )}

              {errorMsg && (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Btn
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                >
                  {t("common.cancel") || "Cancel"}
                </Btn>
                <Btn
                  type="submit"
                  size="sm"
                  disabled={busy || !constructedDob}
                  className="rounded-2xl font-bold px-5"
                >
                  {busy ? t("common.loading") || "Saving..." : t("common.save") || "Save"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
