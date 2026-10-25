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
  Search,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin } from "@/lib/encryption.js";
import { isValidDate } from "@/lib/localDate.js";
import { LANGUAGES } from "@/i18n/languages.js";
import { parseImport, defaultHealthConditions } from "@/lib/exportImport.js";
import { QUESTIONNAIRE_CONDITIONS, CONFIRMATION_STATUSES } from "@/content/conditions.js";
import {
  WelcomeArt,
  PrivacyArt,
  RhythmMotif,
  SaheliBrandMark,
} from "@/components/brand/SaheliArt.jsx";

export function OnboardingFlow() {
  const { t, prefs, setPrefs, completeOnboarding, restoreFromBackup, today, identity } = useApp();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState("under18");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [selectedGoals, setSelectedGoals] = useState(["cycle", "symptoms", "learn"]);
  const [startChoice, setStartChoice] = useState("empty"); // "empty" | "firstPeriod" | "demo" | "learn"
  const [firstPeriodDate, setFirstPeriodDate] = useState("");
  const [selectedConditions, setSelectedConditions] = useState([]); // [{ id, status }]
  const [conditionSearch, setConditionSearch] = useState("");
  const [otherConditionText, setOtherConditionText] = useState("");
  const [preferNotToSayConditions, setPreferNotToSayConditions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const totalSteps = 8;

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
        healthConditions: {
          conditions: preferNotToSayConditions ? [] : selectedConditions,
          otherText: otherConditionText.trim(),
          preferNotToSay: preferNotToSayConditions,
          personalisationEnabled: true,
          lastUpdated: today,
        },
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
    <main id="main" className="mx-auto max-w-xl space-y-6 px-4 py-8">
      {/* Header with App Identity & Language/Skip Actions */}
      <header className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5 font-display text-xl font-bold text-primary">
          <SaheliBrandMark className="h-7 w-7 text-primary" />
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
            className="min-h-9 rounded-xl border border-border px-3 text-xs font-semibold hover:bg-muted"
          >
            {t("nav.langToggle")}
          </button>
        </div>
      </header>

      {/* Step Progress Indicator (Steps 2-7) */}
      {step > 1 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>{t("onb.step", { current: step, total: totalSteps })}</span>
          </div>
          <div className="flex h-2 w-full gap-1.5 overflow-hidden rounded-full bg-muted">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={cx(
                  "h-full flex-1 rounded-full transition-all duration-300",
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
          <div className="mx-auto flex justify-center py-2">
            <WelcomeArt className="w-full max-w-xs h-auto" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t("app.name")}
            </h1>
            <p className="text-base font-semibold text-primary">{t("onb.tagline")}</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
              {t("onb.intro")}
            </p>
            {identity?.serialId && (
              <div className="pt-2 flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>{identity.serialId}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 text-left max-w-md mx-auto">
            {/* Primary Action: Start Privately */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="group flex w-full min-h-[58px] items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-period px-5 py-3.5 text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <Sparkles aria-hidden className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-bold text-base">{t("onb.startPrivately")}</div>
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
              className="flex w-full min-h-[50px] items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm font-bold text-foreground hover:bg-muted shadow-2xs transition-all"
            >
              <Upload aria-hidden className="h-4 w-4 text-primary" />
              <span>{t("onb.restoreBackup")}</span>
            </button>

            {/* Quick Demo Option */}
            <button
              type="button"
              onClick={() => {
                setStartChoice("demo");
                setStep(7);
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
          <div className="flex items-center gap-4">
            <PrivacyArt className="w-16 h-16 shrink-0" />
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {t("onb.step3Title")}
              </h1>
              <p className="text-xs text-muted-foreground">{t("onb.privacyExplainTitle")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
              <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-secondary-strong" />
              <div className="text-xs leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">{t("onb.privacyStorage")}</strong>
                <p className="mt-1">{t("onb.privacyExplainDesc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
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

      {/* Screen 6: Optional Health Conditions Questionnaire */}
      {step === 6 && (
        <section aria-label={t("cond.onboarding.title")} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5">
                {t("common.optional") || "Optional"}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold">{t("cond.onboarding.title")}</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("cond.onboarding.subtitle")}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={conditionSearch}
              onChange={(e) => setConditionSearch(e.target.value)}
              placeholder={t("cond.onboarding.searchPlaceholder")}
              className={cx(inputCls, "pl-10 h-11 rounded-2xl text-xs")}
            />
          </div>

          {/* Prefer Not to Say Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !preferNotToSayConditions;
              setPreferNotToSayConditions(nextVal);
              if (nextVal) {
                setSelectedConditions([]);
              }
            }}
            className={cx(
              "flex w-full items-center justify-between p-3 rounded-2xl border-2 text-xs font-semibold transition-all",
              preferNotToSayConditions
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50",
            )}
          >
            <span>{t("cond.onboarding.preferNotToSay")}</span>
            {preferNotToSayConditions && <CheckCircle2 className="h-4 w-4 text-primary" />}
          </button>

          {!preferNotToSayConditions && (
            <div className="space-y-2 max-h-72 overflow-y-auto p-1">
              {QUESTIONNAIRE_CONDITIONS.filter((c) => {
                if (!conditionSearch.trim()) return true;
                const query = conditionSearch.toLowerCase();
                const label = t(c.labelKey).toLowerCase();
                const plain = t(c.plainNameKey).toLowerCase();
                return label.includes(query) || plain.includes(query);
              }).map((c) => {
                const isSelected = selectedConditions.some((item) => item.id === c.id);
                const currentItem = selectedConditions.find((item) => item.id === c.id);

                return (
                  <div
                    key={c.id}
                    className={cx(
                      "rounded-2xl border-2 p-3 transition-all space-y-2.5",
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card hover:bg-muted/40",
                    )}
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer select-none"
                      onClick={() => {
                        setSelectedConditions((prev) =>
                          isSelected
                            ? prev.filter((item) => item.id !== c.id)
                            : [...prev, { id: c.id, status: "confirmed_diagnosis" }],
                        );
                      }}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{t(c.labelKey)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {t(c.plainNameKey)}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary accent-primary"
                      />
                    </div>

                    {/* Status Selection when selected */}
                    {isSelected && (
                      <div className="pt-2 border-t border-border/50 space-y-2 text-xs">
                        <span className="font-semibold text-muted-foreground block text-[11px]">
                          {t("cond.onboarding.statusLabel")}:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                          {CONFIRMATION_STATUSES.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSelectedConditions((prev) =>
                                  prev.map((item) =>
                                    item.id === c.id ? { ...item, status: st.id } : item,
                                  ),
                                );
                              }}
                              className={cx(
                                "rounded-xl px-2 py-1.5 text-[11px] font-semibold border text-center transition-all",
                                currentItem?.status === st.id
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/60 text-muted-foreground border-border hover:bg-muted",
                              )}
                            >
                              {t(st.labelKey)}
                            </button>
                          ))}
                        </div>

                        {c.allowsCustomText && (
                          <div className="pt-1">
                            <input
                              type="text"
                              value={otherConditionText}
                              onChange={(e) => setOtherConditionText(e.target.value)}
                              placeholder={t("cond.onboarding.otherPlaceholder")}
                              className={cx(inputCls, "h-9 text-xs rounded-xl")}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Privacy & Non-Diagnostic Guarantee */}
          <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1 border border-border/50">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t("cond.onboarding.privacyTitle")}</span>
            </p>
            <p className="leading-relaxed">{t("cond.onboarding.privacyDesc")}</p>
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
              <span>{selectedConditions.length > 0 ? t("onb.next") : t("onb.skip")}</span>
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Btn>
          </div>
        </section>
      )}

      {/* Screen 7: Start Experience Options */}
      {step === 7 && (
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

      {/* Screen 8: Personalised Introduction to Today */}
      {step === 8 && (
        <section aria-label={t("onb.welcomeTodayTitle")} className="space-y-6 pt-2 text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-soft overflow-hidden">
            <RhythmMotif className="absolute inset-0 opacity-40 scale-125" />
            <Sparkles aria-hidden className="relative z-10 h-10 w-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              {t("onb.welcomeTodayTitle")}
            </h1>
            <p className="mx-auto max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
            <div className="flex justify-between py-1 border-b border-border">
              <span>{t("onb.step4Title")}:</span>
              <strong className="text-foreground">
                {startChoice === "demo" ? t("onb.startDemo") : t("onb.startEmpty")}
              </strong>
            </div>
            {selectedConditions.length > 0 && (
              <div className="flex justify-between py-1">
                <span>{t("cond.onboarding.title")}:</span>
                <strong className="text-foreground">
                  {selectedConditions.length} {t("cond.selectedCount")}
                </strong>
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
