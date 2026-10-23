import { useState, useRef } from "react";
import {
  Flower2,
  NotebookPen,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Upload,
  Sparkles,
  Calendar,
  Activity,
  BookOpen,
  FileText,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin } from "@/lib/encryption.js";
import { isValidDate } from "@/lib/localDate.js";
import { LANGUAGES } from "@/i18n/languages.js";
import { parseImport } from "@/lib/exportImport.js";

export function OnboardingFlow() {
  const { t, prefs, setPrefs, completeOnboarding, restoreFromBackup, today } = useApp();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("under18");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [selectedGoals, setSelectedGoals] = useState(["cycle", "symptoms", "learn"]);
  const [startChoice, setStartChoice] = useState("empty"); // "empty" | "firstPeriod" | "demo" | "learn"
  const [firstPeriodDate, setFirstPeriodDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const totalSteps = 7;

  const toggleGoal = (goal) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

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
        ageGroup: age || "under18",
        discreet: prefs.discreet,
        lang: prefs.lang,
      });
    } catch {
      setErrorMsg(t("set.failed"));
      setBusy(false);
    }
  };

  const handleBackupUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      await restoreFromBackup(parsed.rec);
    } catch {
      setErrorMsg(t("imp.wrongFormat"));
      setBusy(false);
    }
  };

  const AppIcon = prefs.discreet ? NotebookPen : Flower2;

  return (
    <main id="main" className="mx-auto max-w-md space-y-5 px-4 py-6">
      {/* Header with App Identity & Language/Skip Actions */}
      <header className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <AppIcon aria-hidden className="h-6 w-6" />
          <span>{prefs.discreet ? t("app.discreetName") : t("app.name")}</span>
        </div>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={handleQuickStart}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("onb.skip")}
            </button>
          )}
          <button
            type="button"
            aria-label={t("nav.langToggleLabel")}
            onClick={() => setPrefs({ lang: prefs.lang === "en" ? "hi" : "en" })}
            className="min-h-9 rounded-lg border border-border px-2.5 text-xs font-semibold hover:bg-muted"
          >
            {t("nav.langToggle")}
          </button>
        </div>
      </header>

      {/* Step Progress Indicator (Steps 2-7) */}
      {step > 1 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{t("onb.step", { current: step, total: totalSteps })}</span>
          </div>
          <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-muted">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
      )}

      {/* Screen 1: Welcome & Brand Identity */}
      {step === 1 && (
        <section aria-label={t("onb.title")} className="space-y-6 pt-2 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-soft">
            <AppIcon aria-hidden className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              {t("app.name")}
            </h1>
            <p className="text-base font-medium text-primary">{t("onb.tagline")}</p>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">{t("onb.intro")}</p>
          </div>

          <div className="space-y-3 pt-2 text-left">
            {/* Primary Action: Start Privately */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="group flex w-full min-h-[56px] items-center justify-between rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-md transition-all hover:opacity-95"
            >
              <div className="flex items-center gap-3">
                <Sparkles aria-hidden className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-bold">{t("onb.startPrivately")}</div>
                  <div className="text-xs opacity-90">{t("onb.freshDesc")}</div>
                </div>
              </div>
              <ArrowRight
                aria-hidden
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </button>

            {/* Secondary Action: Restore Backup */}
            <input
              type="file"
              ref={fileInputRef}
              accept="application/json,.json"
              onChange={handleBackupUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full min-h-[48px] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"
            >
              <Upload aria-hidden className="h-4 w-4 text-muted-foreground" />
              <span>{t("onb.restoreBackup")}</span>
            </button>

            {/* Quick Demo Option */}
            <button
              type="button"
              onClick={() => {
                setStartChoice("demo");
                setStep(6);
              }}
              className="flex w-full min-h-[44px] items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("onb.startDemo")}
            </button>
          </div>
        </section>
      )}

      {/* Screen 2: Language Selection */}
      {step === 2 && (
        <section aria-label={t("onb.step1Title")} className="space-y-4">
          <div className="text-left space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step1Title")}</h1>
            <p className="text-xs text-muted-foreground">{t("onb.step1Desc")}</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="font-semibold text-sm">{t("onb.lang")}</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={prefs.lang === lang.code}
                  onClick={() => setPrefs({ lang: lang.code })}
                  className={cx(
                    "flex min-h-12 items-center justify-between gap-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors",
                    prefs.lang === lang.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className="truncate">{lang.nativeName}</span>
                  {prefs.lang === lang.code && (
                    <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-primary" />
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
                <span className="font-semibold text-sm">{t("onb.discreetTitle")}</span>
                <p className="text-xs text-muted-foreground">{t("onb.discreetDesc")}</p>
              </div>
            </label>
          </Card>

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

      {/* Screen 3: Privacy Explanation & Optional PIN */}
      {step === 3 && (
        <section aria-label={t("onb.step3Title")} className="space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step3Title")}</h1>
            <p className="text-xs text-muted-foreground">{t("onb.privacyExplainTitle")}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-secondary-strong" />
              <div className="text-xs leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">{t("onb.privacyStorage")}</strong>
                <p className="mt-1">{t("onb.privacyExplainDesc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <BookOpen aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-info" />
              <div className="text-xs leading-relaxed text-muted-foreground">
                <p>{t("onb.privacyNotDiagnosis")}</p>
              </div>
            </div>
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
                <span className="font-semibold text-sm">{t("onb.pinOptional")}</span>
                <p className="text-xs text-muted-foreground">{t("onb.pinDesc")}</p>
              </div>
            </label>

            {pinEnabled && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-xs text-destructive">{t("onb.pinWarning")}</p>
                <div className="space-y-1">
                  <label htmlFor="onb-pin" className="block text-xs font-semibold">
                    {t("onb.pinEnter")}
                  </label>
                  <input
                    id="onb-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className={inputCls}
                    placeholder="••••"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="onb-pin-confirm" className="block text-xs font-semibold">
                    {t("onb.pinConfirm")}
                  </label>
                  <input
                    id="onb-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    className={inputCls}
                    placeholder="••••"
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

      {/* Screen 4: Age Band & Menstrual History */}
      {step === 4 && (
        <section aria-label={t("onb.step2Title")} className="space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step2Title")}</h1>
            <p className="text-xs text-muted-foreground">{t("onb.ageQ")}</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="sr-only">{t("onb.ageQ")}</legend>
            <label
              className={cx(
                "block cursor-pointer rounded-2xl border-2 p-3.5 transition-colors",
                age === "under18"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="ageGroup"
                  value="under18"
                  checked={age === "under18"}
                  onChange={() => setAge("under18")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <span className="font-bold text-sm">{t("age.under18")}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{t("onb.under18Desc")}</p>
                </div>
              </div>
            </label>

            <label
              className={cx(
                "block cursor-pointer rounded-2xl border-2 p-3.5 transition-colors",
                age === "adult"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="ageGroup"
                  value="adult"
                  checked={age === "adult"}
                  onChange={() => setAge("adult")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <span className="font-bold text-sm">{t("age.adult")}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{t("onb.adultDesc")}</p>
                </div>
              </div>
            </label>
          </fieldset>

          {/* Optional Menstrual History: Recent Period Start */}
          <Card className="space-y-2">
            <label htmlFor="first-period-date" className="block text-xs font-semibold">
              {t("onb.firstPeriodDateLabel")} ({t("common.optional") || "optional"})
            </label>
            <input
              id="first-period-date"
              type="date"
              max={today}
              value={firstPeriodDate}
              onChange={(e) => setFirstPeriodDate(e.target.value)}
              className={inputCls}
            />
          </Card>

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

      {/* Screen 5: Tracking Priorities & Goals */}
      {step === 5 && (
        <section aria-label={t("onb.goalsTitle")} className="space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.goalsTitle")}</h1>
            <p className="text-xs text-muted-foreground">{t("onb.goalsDesc")}</p>
          </div>

          <div className="space-y-2">
            {[
              {
                id: "cycle",
                icon: Calendar,
                title: t("onb.goalCycle"),
              },
              {
                id: "symptoms",
                icon: Activity,
                title: t("onb.goalSymptoms"),
              },
              {
                id: "learn",
                icon: BookOpen,
                title: t("onb.goalLearn"),
              },
              {
                id: "doctor",
                icon: FileText,
                title: t("onb.goalDoctor"),
              },
            ].map((goal) => {
              const active = selectedGoals.includes(goal.id);
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleGoal(goal.id)}
                  className={cx(
                    "flex w-full min-h-[52px] items-center justify-between rounded-2xl border-2 p-3.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      aria-hidden
                      className={cx("h-5 w-5", active ? "text-primary" : "text-muted-foreground")}
                    />
                    <span className="text-sm font-semibold">{goal.title}</span>
                  </div>
                  {active && <CheckCircle2 aria-hidden className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

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

      {/* Screen 6: Start Experience Options */}
      {step === 6 && (
        <section aria-label={t("onb.step4Title")} className="space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{t("onb.step4Title")}</h1>
          </div>

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
                  <span className="font-bold text-sm">{t("onb.startEmpty")}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.startEmptyDesc")}</p>
                </div>
              </div>
            </label>

            {/* Option 2: Explore with Demo Data */}
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
                  <span className="font-bold text-sm">{t("onb.startDemo")}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.startDemoDesc")}</p>
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
                  <span className="font-bold text-sm">{t("onb.startLearn")}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.startLearnDesc")}</p>
                </div>
              </div>
            </label>
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

      {/* Screen 7: Personalised Introduction to Today */}
      {step === 7 && (
        <section aria-label={t("onb.welcomeTodayTitle")} className="space-y-6 pt-2 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/20 text-secondary-strong shadow-soft">
            <Sparkles aria-hidden className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("onb.welcomeTodayTitle")}
            </h1>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              {t("onb.welcomeTodayDesc")}
            </p>
          </div>

          <Card className="space-y-2 text-left text-xs text-muted-foreground">
            <div className="flex justify-between py-1 border-b border-border">
              <span>{t("set.age")}:</span>
              <strong className="text-foreground">{t(`age.${age}`)}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span>{t("onb.step3Title")}:</span>
              <strong className="text-foreground">
                {pinEnabled ? t("set.pinOn") : t("onb.privacyStorage").split(":")[0]}
              </strong>
            </div>
            <div className="flex justify-between py-1">
              <span>{t("onb.step4Title")}:</span>
              <strong className="text-foreground">
                {startChoice === "demo" ? t("onb.startDemo") : t("onb.startEmpty")}
              </strong>
            </div>
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
