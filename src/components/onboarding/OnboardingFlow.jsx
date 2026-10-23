import { useState } from "react";
import {
  Flower2,
  NotebookPen,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin } from "@/lib/encryption.js";
import { isValidDate } from "@/lib/localDate.js";
import { LANGUAGES } from "@/i18n/languages.js";

export function OnboardingFlow() {
  const { t, prefs, setPrefs, completeOnboarding, today } = useApp();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("under18");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [startChoice, setStartChoice] = useState("empty"); // "empty" | "firstPeriod" | "demo" | "learn"
  const [firstPeriodDate, setFirstPeriodDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalSteps = 4;

  const handleNext = () => {
    setErrorMsg("");
    if (step === 3 && pinEnabled) {
      if (!isValidPin(pin)) {
        setErrorMsg(t("onb.pinInvalid"));
        return;
      }
      if (pin !== pinConfirm) {
        setErrorMsg(t("onb.pinMismatch"));
        return;
      }
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handlePrev = () => {
    setErrorMsg("");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      if (startChoice === "demo") {
        await completeOnboarding({
          mode: "demo",
          ageGroup: age,
          discreet: prefs.discreet,
          lang: prefs.lang,
        });
        return;
      }

      let dateToSave = null;
      if (startChoice === "firstPeriod" && firstPeriodDate && isValidDate(firstPeriodDate)) {
        dateToSave = firstPeriodDate;
      }

      await completeOnboarding({
        mode: "real",
        ageGroup: age,
        pin: pinEnabled && isValidPin(pin) ? pin : null,
        firstPeriodDate: dateToSave,
        discreet: prefs.discreet,
        lang: prefs.lang,
      });

      if (startChoice === "learn") {
        window.location.hash = "#/learn";
      }
    } catch {
      setErrorMsg(t("set.failed"));
      setBusy(false);
    }
  };

  const handleQuickStart = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      await completeOnboarding({
        mode: "real",
        ageGroup: "under18",
        discreet: prefs.discreet,
        lang: prefs.lang,
      });
    } catch {
      setErrorMsg(t("set.failed"));
      setBusy(false);
    }
  };

  const AppIcon = prefs.discreet ? NotebookPen : Flower2;

  return (
    <main id="main" className="mx-auto max-w-md space-y-5 px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <AppIcon aria-hidden className="h-6 w-6" />
          <span>{prefs.discreet ? t("app.discreetName") : t("app.name")}</span>
        </div>
        <button
          type="button"
          aria-label={t("nav.langToggleLabel")}
          onClick={() => setPrefs({ lang: prefs.lang === "en" ? "hi" : "en" })}
          className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-muted"
        >
          {t("nav.langToggle")}
        </button>
      </div>

      {/* Step Indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{t("onb.step", { current: step, total: totalSteps })}</span>
          <span className="sr-only">
            {step === 1 && t("onb.step1Title")}
            {step === 2 && t("onb.step2Title")}
            {step === 3 && t("onb.step3Title")}
            {step === 4 && t("onb.step4Title")}
          </span>
        </div>
        <div className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-muted">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cx(
                "h-full flex-1 transition-all duration-200",
                s <= step ? "bg-primary" : "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Language & Welcome */}
      {step === 1 && (
        <section aria-label={t("onb.step1Title")} className="space-y-4">
          <div className="text-center">
            <AppIcon aria-hidden className="mx-auto h-12 w-12 text-primary" />
            <h1 className="font-display mt-2 text-2xl font-bold">{t("onb.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("onb.step1Desc")}</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="font-semibold">{t("onb.lang")}</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={prefs.lang === lang.code}
                  onClick={() => setPrefs({ lang: lang.code })}
                  className={cx(
                    "flex min-h-12 items-center justify-between gap-1 rounded-xl border-2 px-2.5 py-1 text-sm font-semibold transition-colors",
                    prefs.lang === lang.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className="truncate">{lang.nativeName}</span>
                  {prefs.lang === lang.code && (
                    <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          <Card className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={prefs.discreet}
                onChange={(e) => setPrefs({ discreet: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-border accent-primary"
              />
              <div className="space-y-0.5">
                <span className="font-semibold">{t("onb.discreetTitle")}</span>
                <p className="text-xs text-muted-foreground">{t("onb.discreetDesc")}</p>
              </div>
            </label>
          </Card>

          <div className="pt-2">
            <Btn
              className="flex min-h-12 w-full items-center justify-center gap-2"
              onClick={handleNext}
            >
              <span>{t("onb.next")}</span>
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Btn>
          </div>

          <div className="text-center">
            <button
              type="button"
              disabled={busy}
              onClick={handleQuickStart}
              className="text-xs font-semibold text-muted-foreground underline hover:text-foreground"
            >
              {t("onb.quickStart")}
            </button>
          </div>
        </section>
      )}

      {/* Step 2: Age & Care Setup */}
      {step === 2 && (
        <section aria-label={t("onb.step2Title")} className="space-y-4">
          <header className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step2Title")}</h1>
            <p className="text-sm text-muted-foreground">{t("onb.ageQ")}</p>
          </header>

          <fieldset className="space-y-3">
            <legend className="sr-only">{t("onb.ageQ")}</legend>

            <button
              type="button"
              aria-pressed={age === "under18"}
              onClick={() => setAge("under18")}
              className={cx(
                "block w-full rounded-2xl border-2 p-4 text-left transition-colors",
                age === "under18"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{t("age.under18")}</span>
                {age === "under18" && <CheckCircle2 aria-hidden className="h-5 w-5 text-primary" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("onb.under18Desc")}</p>
            </button>

            <button
              type="button"
              aria-pressed={age === "adult"}
              onClick={() => setAge("adult")}
              className={cx(
                "block w-full rounded-2xl border-2 p-4 text-left transition-colors",
                age === "adult"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{t("age.adult")}</span>
                {age === "adult" && <CheckCircle2 aria-hidden className="h-5 w-5 text-primary" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("onb.adultDesc")}</p>
            </button>
          </fieldset>

          <div className="flex gap-2 pt-2">
            <Btn
              variant="outline"
              className="flex min-h-12 flex-1 items-center justify-center gap-1"
              onClick={handlePrev}
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              <span>{t("onb.prev")}</span>
            </Btn>
            <Btn
              className="flex min-h-12 flex-1 items-center justify-center gap-1"
              onClick={handleNext}
            >
              <span>{t("onb.next")}</span>
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Btn>
          </div>
        </section>
      )}

      {/* Step 3: Privacy & PIN Setup */}
      {step === 3 && (
        <section aria-label={t("onb.step3Title")} className="space-y-4">
          <header className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step3Title")}</h1>
            <p className="text-sm text-muted-foreground">{t("onb.privacy")}</p>
          </header>

          <div className="space-y-2 rounded-xl bg-secondary/80 p-3 text-xs text-secondary-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck aria-hidden className="h-4 w-4 shrink-0 text-primary" />
              <span>{t("onb.privacyStorage")}</span>
            </p>
            <p className="border-t border-border/40 pt-1 text-muted-foreground">
              {t("onb.privacyNotDiagnosis")}
            </p>
          </div>

          <Card className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => {
                  setPinEnabled(e.target.checked);
                  setErrorMsg("");
                }}
                className="mt-1 h-5 w-5 rounded border-border accent-primary"
              />
              <div className="space-y-0.5">
                <span className="font-semibold">{t("onb.pinOptional")}</span>
                <p className="text-xs text-muted-foreground">{t("onb.pinDesc")}</p>
              </div>
            </label>

            {pinEnabled && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="rounded-lg bg-accent/60 p-2 text-xs text-accent-foreground">
                  {t("onb.pinWarning")}
                </p>

                <div className="space-y-2">
                  <label htmlFor="onb-pin" className="block text-xs font-semibold">
                    {t("onb.pinEnter")}
                  </label>
                  <input
                    id="onb-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ""));
                      setErrorMsg("");
                    }}
                    placeholder="••••"
                    className={cx(inputCls, "text-center text-lg tracking-widest")}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="onb-pin-confirm" className="block text-xs font-semibold">
                    {t("onb.pinConfirm")}
                  </label>
                  <input
                    id="onb-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                    value={pinConfirm}
                    onChange={(e) => {
                      setPinConfirm(e.target.value.replace(/\D/g, ""));
                      setErrorMsg("");
                    }}
                    placeholder="••••"
                    className={cx(inputCls, "text-center text-lg tracking-widest")}
                  />
                </div>
              </div>
            )}
          </Card>

          {errorMsg && (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 p-2 text-center text-xs text-destructive"
            >
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Btn
              variant="outline"
              className="flex min-h-12 flex-1 items-center justify-center gap-1"
              onClick={handlePrev}
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              <span>{t("onb.prev")}</span>
            </Btn>
            <Btn
              className="flex min-h-12 flex-1 items-center justify-center gap-1"
              onClick={handleNext}
            >
              <span>{t("onb.next")}</span>
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Btn>
          </div>
        </section>
      )}

      {/* Step 4: First Entry or Start Options */}
      {step === 4 && (
        <section aria-label={t("onb.step4Title")} className="space-y-4">
          <header className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step4Title")}</h1>
          </header>

          <fieldset className="space-y-2">
            <legend className="sr-only">{t("onb.step4Title")}</legend>

            {/* Option 1: Empty Diary */}
            <label
              className={cx(
                "block cursor-pointer rounded-2xl border-2 p-3.5 transition-colors",
                startChoice === "empty"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="startOption"
                  checked={startChoice === "empty"}
                  onChange={() => setStartChoice("empty")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <span className="font-bold">{t("onb.startEmpty")}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.startEmptyDesc")}</p>
                </div>
              </div>
            </label>

            {/* Option 2: First Period Date */}
            <label
              className={cx(
                "block cursor-pointer rounded-2xl border-2 p-3.5 transition-colors",
                startChoice === "firstPeriod"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="startOption"
                  checked={startChoice === "firstPeriod"}
                  onChange={() => setStartChoice("firstPeriod")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div className="w-full">
                  <span className="font-bold">{t("onb.firstPeriodOption")}</span>
                  {startChoice === "firstPeriod" && (
                    <div className="mt-2 space-y-1">
                      <label htmlFor="first-period-date" className="block text-xs font-semibold">
                        {t("onb.firstPeriodDateLabel")}
                      </label>
                      <input
                        id="first-period-date"
                        type="date"
                        max={today}
                        value={firstPeriodDate}
                        onChange={(e) => setFirstPeriodDate(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              </div>
            </label>

            {/* Option 3: Health Guides */}
            <label
              className={cx(
                "block cursor-pointer rounded-2xl border-2 p-3.5 transition-colors",
                startChoice === "learn"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="startOption"
                  checked={startChoice === "learn"}
                  onChange={() => setStartChoice("learn")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <span className="font-bold">{t("onb.startLearn")}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.startLearnDesc")}</p>
                </div>
              </div>
            </label>

            {/* Option 4: Demo Data */}
            <label
              className={cx(
                "block cursor-pointer rounded-2xl border-2 p-3.5 transition-colors",
                startChoice === "demo"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="startOption"
                  checked={startChoice === "demo"}
                  onChange={() => setStartChoice("demo")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <span className="font-bold">{t("onb.startDemo")}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.startDemoDesc")}</p>
                </div>
              </div>
            </label>
          </fieldset>

          {errorMsg && (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 p-2 text-center text-xs text-destructive"
            >
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Btn
              variant="outline"
              className="flex min-h-12 flex-1 items-center justify-center gap-1"
              disabled={busy}
              onClick={handlePrev}
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              <span>{t("onb.prev")}</span>
            </Btn>
            <Btn
              className="flex min-h-12 flex-1 items-center justify-center gap-1"
              disabled={busy}
              onClick={handleFinish}
            >
              <span>{busy ? t("set.working") : t("onb.finish")}</span>
            </Btn>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground">{t("common.disclaimer")}</p>
    </main>
  );
}
