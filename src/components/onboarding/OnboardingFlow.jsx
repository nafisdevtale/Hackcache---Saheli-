import { useState, useRef, useMemo } from "react";
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
  HeartHandshake,
  Users,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  AlertCircle,
  Copy,
  ChevronRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin, isValidSecret } from "@/lib/encryption.js";
import { isValidDate, todayStr } from "@/lib/localDate.js";
import { calculateAge, isValidDob, isLeapYear } from "@/lib/agePolicy.ts";
import { LANGUAGES } from "@/i18n/languages.js";
import { parseImport, parseCSVImport, parsePDFImport } from "@/lib/exportImport.js";
import {
  WelcomeArt,
  PrivacyArt,
  RhythmMotif,
  SaheliBrandMark,
} from "@/components/brand/SaheliArt.jsx";

export function OnboardingFlow() {
  const {
    t,
    prefs,
    setPrefs,
    completeOnboarding,
    restoreFromBackup,
    today = todayStr(),
    identity,
  } = useApp();

  // 5-Step First Launch Architecture (SAHELI 11.3)
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Screen 2 State: Role ('owner' | 'partner')
  const [role, setRole] = useState("owner");

  // Screen 3 State: Date of Birth
  const [dob, setDob] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Screen 4 State: Lock & Security
  const [lockMethod, setLockMethod] = useState("none"); // "none" | "pin" | "passphrase"
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [firstPeriodDate, setFirstPeriodDate] = useState("");
  const [showFirstPeriodOption, setShowFirstPeriodOption] = useState(false);

  // Status & Feedback
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedSerial, setCopiedSerial] = useState(false);
  const fileInputRef = useRef(null);

  // Synchronize DOB dropdowns with DOB string
  const updateDobFromParts = (newDay, newMonth, newYear) => {
    if (newYear && newMonth && newDay) {
      const formatted = `${String(newYear).padStart(4, "0")}-${String(newMonth).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`;
      setDob(formatted);
    }
  };

  const handleDateInputChange = (e) => {
    const val = e.target.value;
    setDob(val);
    if (val && val.includes("-")) {
      const [y, m, d] = val.split("-");
      setYear(Number(y) || "");
      setMonth(Number(m) || "");
      setDay(Number(d) || "");
    }
  };

  // Evaluate Age Policy for entered DOB
  const dobAnalysis = useMemo(() => {
    if (!dob) return { valid: false, age: null, isUnder18: true, error: "" };
    if (!isValidDob(dob, today)) {
      if (dob > today) {
        return {
          valid: false,
          age: null,
          isUnder18: true,
          error: t("onb.dobFuture") || "Date of birth cannot be in the future.",
        };
      }
      return {
        valid: false,
        age: null,
        isUnder18: true,
        error: t("onb.dobInvalid") || "Please enter a valid past date of birth.",
      };
    }
    const calc = calculateAge(dob, today);
    return {
      valid: true,
      age: calc.age,
      isUnder18: calc.isUnder18,
      category: calc.category,
      error: "",
    };
  }, [dob, today, t]);

  const handleNext = () => {
    setErrorMsg("");

    // Screen 3 validation (DOB is mandatory)
    if (step === 3) {
      if (!dob || !dobAnalysis.valid) {
        setErrorMsg(
          dobAnalysis.error || t("onb.dobInvalid") || "Please enter a valid past date of birth.",
        );
        return;
      }
    }

    // Screen 4 validation (Lock validation if enabled)
    if (step === 4) {
      if (lockMethod === "pin") {
        if (!isValidPin(pin)) {
          setErrorMsg(t("onb.pinInvalid") || "PIN must be exactly 4 digits.");
          return;
        }
        if (pin !== pinConfirm) {
          setErrorMsg(t("onb.pinMismatch") || "PINs do not match. Please re-enter.");
          return;
        }
      } else if (lockMethod === "passphrase") {
        if (!passphrase || passphrase.length < 6) {
          setErrorMsg(t("set.passphraseInvalid") || "Passphrase must be at least 6 characters.");
          return;
        }
        if (passphrase !== passphraseConfirm) {
          setErrorMsg(t("onb.pinMismatch") || "Passphrases do not match.");
          return;
        }
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
      const secretToSave =
        lockMethod === "pin" ? pin : lockMethod === "passphrase" ? passphrase : null;

      let dateToSave = null;
      if (role === "owner" && firstPeriodDate && isValidDate(firstPeriodDate)) {
        dateToSave = firstPeriodDate;
      }

      await completeOnboarding({
        mode: "real",
        role,
        dob,
        ageGroup: dobAnalysis.isUnder18 ? "under18" : "adult",
        lockMethod,
        secret: secretToSave,
        pin: lockMethod === "pin" ? pin : null,
        firstPeriodDate: dateToSave,
        discreet: prefs.discreet,
        lang: prefs.lang,
      });
    } catch (err) {
      setErrorMsg(t("set.failed") || "Setup failed. Please try again.");
      setBusy(false);
    }
  };

  const handleDemoStart = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      await completeOnboarding({
        mode: "demo",
        role: "owner",
        ageGroup: "adult",
        discreet: prefs.discreet,
        lang: prefs.lang,
      });
    } catch {
      setErrorMsg(t("set.failed") || "Demo setup failed.");
      setBusy(false);
    }
  };

  const handleBackupUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setBusy(true);
    try {
      const lowerName = file.name.toLowerCase();
      let parsed;
      if (
        lowerName.endsWith(".pdf") ||
        lowerName.endsWith(".html") ||
        file.type === "application/pdf"
      ) {
        const buffer = await file.arrayBuffer();
        parsed = parsePDFImport(buffer);
      } else if (
        lowerName.endsWith(".csv") ||
        file.type === "text/csv" ||
        file.type === "application/vnd.ms-excel"
      ) {
        const text = await file.text();
        parsed = parseCSVImport(text);
      } else if (lowerName.endsWith(".json") || file.type === "application/json") {
        const text = await file.text();
        parsed = parseImport(text);
      } else {
        const text = await file.text();
        const trimmed = text.trim();
        if (
          trimmed.startsWith("%PDF-") ||
          trimmed.includes("SAHELI_RECORD_PAYLOAD_V1") ||
          text.includes("SAHELI_RECORD_PAYLOAD_V1")
        ) {
          const buffer = await file.arrayBuffer();
          parsed = parsePDFImport(buffer);
        } else if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          parsed = parseImport(text);
        } else {
          parsed = parseCSVImport(text);
          if (!parsed.ok && !trimmed.includes(",") && !trimmed.includes(";")) {
            parsed = parseImport(text);
          }
        }
      }

      if (!parsed || !parsed.ok) {
        setErrorMsg(
          t(parsed?.error) ||
            parsed?.explanation ||
            t("imp.wrongFormat") ||
            "Invalid backup file format.",
        );
        setBusy(false);
        return;
      }

      await restoreFromBackup(parsed.record || parsed.rec);
    } catch {
      setErrorMsg(t("imp.wrongFormat") || "Invalid backup file format.");
      setBusy(false);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const copySerialId = () => {
    if (identity?.serialId && navigator?.clipboard) {
      navigator.clipboard.writeText(identity.serialId).then(() => {
        setCopiedSerial(true);
        setTimeout(() => setCopiedSerial(false), 2000);
      });
    }
  };

  // Generate Year options (1920 to current year)
  const currentYear = Number(today.split("-")[0]) || new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1920; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Days in month calculator
  const daysInMonth = useMemo(() => {
    if (!month) return 31;
    const m = Number(month);
    if ([4, 6, 9, 11].includes(m)) return 30;
    if (m === 2) {
      return year && isLeapYear(Number(year)) ? 29 : 28;
    }
    return 31;
  }, [month, year]);

  return (
    <main id="main" className="mx-auto max-w-xl space-y-6 px-4 py-8">
      {/* Header with App Identity & Language Selection */}
      <header className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5 font-display text-xl font-bold text-primary">
          <SaheliBrandMark className="h-7 w-7 text-primary" />
          <span>{prefs.discreet ? t("app.discreetName") : t("app.name")}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={prefs.lang}
            onChange={(e) => setPrefs({ lang: e.target.value })}
            aria-label={t("onb.lang") || "Language"}
            className="min-h-9 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Step Progress Indicator (Steps 2-5) */}
      {step > 1 && (
        <div className="space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>{t("onb.step", { current: step, total: totalSteps })}</span>
            <span className="text-[11px] font-semibold text-primary">
              {step === 2 && (t("onb.roleTitle") || "Role")}
              {step === 3 && (t("onb.dobTitle") || "Age")}
              {step === 4 && (t("onb.setupTitle") || "Security")}
              {step === 5 && (t("onb.welcomeTodayTitle") || "Entry")}
            </span>
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

      {/* Error Message Toast */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive animate-shake"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SCREEN 1 — WELCOME TO SAHELI
          ========================================================================= */}
      {step === 1 && (
        <section
          aria-label={t("onb.title") || "Welcome"}
          className="space-y-6 pt-2 text-center animate-fade-in"
        >
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
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/60 p-4 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center justify-center gap-2 font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{t("onb.privacyExplainTitle") || "Complete Privacy Guarantee"}</span>
            </div>
            <p className="leading-relaxed">
              {t("onb.privacy") ||
                "No account. Your records stay on this device and are never sent to a server."}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Btn
              type="button"
              onClick={handleNext}
              className="w-full min-h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 cursor-pointer"
            >
              <span>{t("onb.startPrivately") || "Get Started"}</span>
              <ArrowRight className="h-5 w-5 ms-2" />
            </Btn>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-1 px-2"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{t("onb.restoreBackup") || "Restore backup"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.pdf,.html,.txt,text/csv,text/plain,application/json,application/pdf,application/vnd.ms-excel,application/octet-stream,text/*"
                className="hidden"
                onChange={handleBackupUpload}
              />

              <span className="hidden sm:inline text-muted-foreground/40">•</span>

              <button
                type="button"
                onClick={handleDemoStart}
                className="font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 py-1 px-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("onb.startDemo") || "Try demo data"}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 2 — CHOOSE YOUR EXPERIENCE (Owner vs Partner)
          ========================================================================= */}
      {step === 2 && (
        <section aria-labelledby="role-title" className="space-y-6 animate-fade-in">
          <div className="space-y-1.5 text-center">
            <h2 id="role-title" className="font-display text-2xl font-bold text-foreground">
              {t("onb.roleTitle") || "Choose Your Experience"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("onb.roleSubtitle") || "How would you like to use Saheli?"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card 1: Cycle Owner */}
            <div
              role="radio"
              aria-checked={role === "owner"}
              tabIndex={0}
              onClick={() => setRole("owner")}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setRole("owner");
              }}
              className={cx(
                "relative flex flex-col justify-between rounded-3xl border-2 p-5 text-start cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary",
                role === "owner"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cx(
                      "rounded-2xl p-3",
                      role === "owner"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Flower2 className="h-6 w-6" />
                  </div>
                  <div
                    className={cx(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      role === "owner"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {role === "owner" && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {t("onb.roleOwnerTitle") || "I'm a Cycle Owner"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("onb.roleOwnerDesc") ||
                      "Track your menstrual cycle, symptoms, and wellness with age-adapted guidance."}
                  </p>
                </div>

                <ul className="space-y-1.5 pt-2 text-xs text-muted-foreground border-t border-border/50">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{t("onb.roleOwnerPoint1") || "Track my own menstrual cycle"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{t("onb.roleOwnerPoint2") || "Log periods and symptoms"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {t("onb.roleOwnerPoint3") || "Access age-appropriate wellness guidance"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {t("onb.roleOwnerPoint4") || "Choose whether to share selected data later"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Partner */}
            <div
              role="radio"
              aria-checked={role === "partner"}
              tabIndex={0}
              onClick={() => setRole("partner")}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setRole("partner");
              }}
              className={cx(
                "relative flex flex-col justify-between rounded-3xl border-2 p-5 text-start cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary",
                role === "partner"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cx(
                      "rounded-2xl p-3",
                      role === "partner"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <div
                    className={cx(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                      role === "partner"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {role === "partner" && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {t("onb.rolePartnerTitle") || "I'm a Partner"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("onb.rolePartnerDesc") ||
                      "View cycle updates and support someone who explicitly shares them with you."}
                  </p>
                </div>

                <ul className="space-y-1.5 pt-2 text-xs text-muted-foreground border-t border-border/50">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {t("onb.rolePartnerPoint1") ||
                        "Access information someone explicitly shares with me"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{t("onb.rolePartnerPoint2") || "View only authorised records"}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {t("onb.rolePartnerPoint3") || "Cannot change the owner's information"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {t("onb.rolePartnerPoint4") || "Requires secure end-to-end partner pairing"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Btn type="button" variant="outline" onClick={handlePrev} className="rounded-2xl px-5">
              <ArrowLeft className="h-4 w-4 me-1.5" />
              <span>{t("onb.prev") || "Back"}</span>
            </Btn>
            <Btn type="button" onClick={handleNext} className="rounded-2xl px-6 font-bold">
              <span>{t("onb.next") || "Continue"}</span>
              <ArrowRight className="h-4 w-4 ms-1.5" />
            </Btn>
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 3 — DATE OF BIRTH (Calendar-Based Calculation & Age Policy)
          ========================================================================= */}
      {step === 3 && (
        <section aria-labelledby="dob-title" className="space-y-6 animate-fade-in">
          <div className="space-y-1.5 text-center">
            <h2 id="dob-title" className="font-display text-2xl font-bold text-foreground">
              {t("onb.dobTitle") || "Date of Birth"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t("onb.dobSubtitle") ||
                "Used solely to adapt health guidance, predictions, and community features to your age. Never leaves your phone."}
            </p>
          </div>

          {/* Privacy Callout */}
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                {t("onb.privacyExplainTitle") || "Local Date-of-Birth Privacy"}
              </p>
              <p>
                {t("onb.dobPrivacyNotice") ||
                  "No email, phone number, or online account required. Your date of birth is encrypted locally on your phone."}
              </p>
            </div>
          </div>

          {/* DOB Input Controls */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            {/* Native Date Picker */}
            <div className="space-y-1.5">
              <label htmlFor="dob-native-input" className="block text-xs font-bold text-foreground">
                {t("onb.dobTitle") || "Date of Birth"}
              </label>
              <input
                id="dob-native-input"
                type="date"
                max={today}
                value={dob}
                onChange={handleDateInputChange}
                className={cx(inputCls, "h-12 rounded-2xl text-sm font-semibold")}
              />
            </div>

            {/* Accessible Manual Dropdowns (Day / Month / Year) */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <span className="block text-xs font-semibold text-muted-foreground">
                {t("onb.dobDay")}, {t("onb.dobMonth")}, {t("onb.dobYear")}
              </span>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Day */}
                <div>
                  <label htmlFor="dob-day-select" className="sr-only">
                    {t("onb.dobDay") || "Day"}
                  </label>
                  <select
                    id="dob-day-select"
                    value={day}
                    onChange={(e) => {
                      const d = e.target.value;
                      setDay(d);
                      updateDobFromParts(d, month, year);
                    }}
                    className={cx(inputCls, "h-11 rounded-2xl text-xs font-semibold")}
                  >
                    <option value="">{t("onb.dobDay") || "Day"}</option>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label htmlFor="dob-month-select" className="sr-only">
                    {t("onb.dobMonth") || "Month"}
                  </label>
                  <select
                    id="dob-month-select"
                    value={month}
                    onChange={(e) => {
                      const m = e.target.value;
                      setMonth(m);
                      updateDobFromParts(day, m, year);
                    }}
                    className={cx(inputCls, "h-11 rounded-2xl text-xs font-semibold")}
                  >
                    <option value="">{t("onb.dobMonth") || "Month"}</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleString(prefs.lang || "en", {
                          month: "short",
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label htmlFor="dob-year-select" className="sr-only">
                    {t("onb.dobYear") || "Year"}
                  </label>
                  <select
                    id="dob-year-select"
                    value={year}
                    onChange={(e) => {
                      const y = e.target.value;
                      setYear(y);
                      updateDobFromParts(day, month, y);
                    }}
                    className={cx(inputCls, "h-11 rounded-2xl text-xs font-semibold")}
                  >
                    <option value="">{t("onb.dobYear") || "Year"}</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live Age Policy Assessment Card */}
            {dobAnalysis.valid && (
              <div
                data-testid="dob-status-preview"
                className={cx(
                  "rounded-2xl border p-4 space-y-2 transition-all animate-fade-in",
                  dobAnalysis.isUnder18
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {dobAnalysis.isUnder18 ? (
                      <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span>
                      {dobAnalysis.isUnder18
                        ? t("onb.dobUnder18Badge") || "Adolescent Safeguarded Mode (< 18)"
                        : t("onb.dobAdultBadge") || "Full Adult Mode (18+)"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-background/50 border border-current/20">
                    {t("onb.dobAgeNotice", { age: dobAnalysis.age }) ||
                      `Age: ${dobAnalysis.age} years`}
                  </span>
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  {dobAnalysis.isUnder18
                    ? t("onb.under18Desc") ||
                      "In accordance with clinical safeguards, ovulation and fertile window predictions are disabled. Puberty education, symptom tracking, and private diary features are fully enabled."
                    : t("onb.adultDesc") ||
                      "Full access to cycle predictions, community discussions, and unrestricted partner settings."}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Btn type="button" variant="outline" onClick={handlePrev} className="rounded-2xl px-5">
              <ArrowLeft className="h-4 w-4 me-1.5" />
              <span>{t("onb.prev") || "Back"}</span>
            </Btn>
            <Btn
              type="button"
              onClick={handleNext}
              disabled={!dobAnalysis.valid}
              className="rounded-2xl px-6 font-bold"
            >
              <span>{t("onb.next") || "Continue"}</span>
              <ArrowRight className="h-4 w-4 ms-1.5" />
            </Btn>
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 4 — AUTOMATIC SETUP & PROTECTION (Serial ID, Vault & Optional Lock)
          ========================================================================= */}
      {step === 4 && (
        <section aria-labelledby="setup-title" className="space-y-6 animate-fade-in">
          <div className="space-y-1.5 text-center">
            <h2 id="setup-title" className="font-display text-2xl font-bold text-foreground">
              {t("onb.setupTitle") || "Automatic Setup & Protection"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("onb.setupSubtitle") ||
                "Creating your unique Saheli Serial ID and encrypted local vault."}
            </p>
          </div>

          {/* Account-Free Identity & Vault Ready Badges */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>{t("onb.setupSerialId") || "Your Saheli Serial ID"}</span>
                <button
                  type="button"
                  onClick={copySerialId}
                  className="text-primary hover:underline flex items-center gap-1"
                  title="Copy Serial ID"
                >
                  {copiedSerial ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedSerial ? "✓" : "Copy"}</span>
                </button>
              </div>
              <p className="font-mono text-sm font-bold text-foreground tracking-wider select-all">
                {identity?.serialId || "SAH-PREPARING-ID"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("onb.setupVaultReady")}
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  {t("onb.setupVaultReady") || "Encrypted Local Vault Ready (AES-GCM-256)"}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Application Lock Selection */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>{t("onb.setupLockPrompt") || "Add an Application Lock (Optional)"}</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("onb.setupLockDesc") ||
                  "Locking wraps your local encryption keys. Without your PIN or passphrase, no one using this device can open your vault."}
              </p>
            </div>

            {/* Lock Method Options */}
            <div className="space-y-2">
              <label
                className={cx(
                  "flex items-center justify-between rounded-2xl border p-3.5 text-xs font-semibold cursor-pointer transition-all",
                  lockMethod === "none"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="lockMethod"
                    value="none"
                    checked={lockMethod === "none"}
                    onChange={() => setLockMethod("none")}
                    className="h-4 w-4 text-primary"
                  />
                  <span>{t("onb.setupLockNone") || "Continue without lock (Fast entry)"}</span>
                </div>
              </label>

              <label
                className={cx(
                  "flex items-center justify-between rounded-2xl border p-3.5 text-xs font-semibold cursor-pointer transition-all",
                  lockMethod === "pin"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="lockMethod"
                    value="pin"
                    checked={lockMethod === "pin"}
                    onChange={() => setLockMethod("pin")}
                    className="h-4 w-4 text-primary"
                  />
                  <span>{t("onb.setupLockPin") || "Protect with 4-digit PIN"}</span>
                </div>
              </label>

              <label
                className={cx(
                  "flex items-center justify-between rounded-2xl border p-3.5 text-xs font-semibold cursor-pointer transition-all",
                  lockMethod === "passphrase"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="lockMethod"
                    value="passphrase"
                    checked={lockMethod === "passphrase"}
                    onChange={() => setLockMethod("passphrase")}
                    className="h-4 w-4 text-primary"
                  />
                  <span>{t("onb.setupLockPassphrase") || "Protect with Passphrase"}</span>
                </div>
              </label>
            </div>

            {/* PIN Inputs (if PIN selected) */}
            {lockMethod === "pin" && (
              <div className="space-y-3 pt-2 border-t border-border/50 animate-fade-in">
                <div className="space-y-1">
                  <label
                    htmlFor="onb-pin-input"
                    className="block text-xs font-semibold text-foreground"
                  >
                    {t("onb.pinEnter") || "Enter 4-digit PIN"}
                  </label>
                  <input
                    id="onb-pin-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className={cx(inputCls, "h-11 rounded-2xl text-center text-lg tracking-widest")}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="onb-pin-confirm"
                    className="block text-xs font-semibold text-foreground"
                  >
                    {t("onb.pinConfirm") || "Confirm 4-digit PIN"}
                  </label>
                  <input
                    id="onb-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className={cx(inputCls, "h-11 rounded-2xl text-center text-lg tracking-widest")}
                  />
                </div>
              </div>
            )}

            {/* Passphrase Inputs (if Passphrase selected) */}
            {lockMethod === "passphrase" && (
              <div className="space-y-3 pt-2 border-t border-border/50 animate-fade-in">
                <div className="space-y-1">
                  <label
                    htmlFor="onb-passphrase-input"
                    className="block text-xs font-semibold text-foreground"
                  >
                    {t("set.passphraseNew") || "Enter Passphrase (min 6 characters)"}
                  </label>
                  <div className="relative">
                    <input
                      id="onb-passphrase-input"
                      type={showPassphrase ? "text" : "password"}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="••••••••"
                      className={cx(inputCls, "h-11 rounded-2xl pe-10 text-sm")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassphrase ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="onb-passphrase-confirm"
                    className="block text-xs font-semibold text-foreground"
                  >
                    {t("set.passphraseConfirm") || "Confirm Passphrase"}
                  </label>
                  <input
                    id="onb-passphrase-confirm"
                    type={showPassphrase ? "text" : "password"}
                    value={passphraseConfirm}
                    onChange={(e) => setPassphraseConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={cx(inputCls, "h-11 rounded-2xl text-sm")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional First Period Date Entry for Cycle Owner */}
          {role === "owner" && (
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {t("onb.firstPeriodOption") || "Log recent period start date (optional)"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowFirstPeriodOption(!showFirstPeriodOption)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {showFirstPeriodOption ? t("common.cancel") || "Hide" : t("common.add") || "Add"}
                </button>
              </div>

              {showFirstPeriodOption && (
                <div className="space-y-1.5 pt-2 border-t border-border/50 animate-fade-in">
                  <label htmlFor="onb-period-date" className="block text-xs text-muted-foreground">
                    {t("onb.firstPeriodDateLabel") || "When did your last period start?"}
                  </label>
                  <input
                    id="onb-period-date"
                    type="date"
                    max={today}
                    value={firstPeriodDate}
                    onChange={(e) => setFirstPeriodDate(e.target.value)}
                    className={cx(inputCls, "h-11 rounded-2xl text-xs")}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-4">
            <Btn type="button" variant="outline" onClick={handlePrev} className="rounded-2xl px-5">
              <ArrowLeft className="h-4 w-4 me-1.5" />
              <span>{t("onb.prev") || "Back"}</span>
            </Btn>
            <Btn type="button" onClick={handleNext} className="rounded-2xl px-6 font-bold">
              <span>{t("onb.next") || "Continue"}</span>
              <ArrowRight className="h-4 w-4 ms-1.5" />
            </Btn>
          </div>
        </section>
      )}

      {/* =========================================================================
          SCREEN 5 — PERSONALISED ENTRY (Owner Dashboard vs Partner Connect)
          ========================================================================= */}
      {step === 5 && (
        <section aria-labelledby="entry-title" className="space-y-6 text-center animate-fade-in">
          <div className="mx-auto flex justify-center py-2">
            <PrivacyArt className="w-full max-w-xs h-auto" />
          </div>

          {role === "owner" ? (
            /* Cycle Owner Personalised Entry */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <Flower2 className="h-4 w-4" />
                  <span>{t("set.roleOwner") || "Cycle Owner"}</span>
                </div>
                <h2
                  id="entry-title"
                  className="font-display text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  {t("onb.entryOwnerTitle") || "Welcome, Cycle Owner"}
                </h2>
                <p className="mx-auto max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("onb.entryOwnerDesc") ||
                    "Your private cycle diary is ready. All your records are securely stored on this device."}
                </p>
              </div>

              {/* Status Summary Card */}
              <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 text-start space-y-2.5 max-w-md mx-auto text-xs">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">
                    {t("set.roleTitle") || "Experience Mode"}:
                  </span>
                  <span className="font-bold text-foreground">
                    {t("set.roleOwner") || "Cycle Owner"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">
                    {t("set.dobTitle") || "Age Safeguards"}:
                  </span>
                  <span className="font-bold text-foreground">
                    {dobAnalysis.isUnder18
                      ? t("onb.dobUnder18Badge") || "Adolescent Safeguarded Mode (< 18)"
                      : t("onb.dobAdultBadge") || "Full Adult Mode (18+)"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("onb.setupLockPrompt")}:</span>
                  <span className="font-bold text-foreground">
                    {lockMethod === "none"
                      ? t("onb.setupLockNone")
                      : lockMethod === "pin"
                        ? t("set.secretTypePin")
                        : t("set.secretTypePassphrase")}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Btn
                  type="button"
                  onClick={handleFinish}
                  disabled={busy}
                  className="w-full min-h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 cursor-pointer"
                >
                  {busy
                    ? t("common.loading") || "Setting up…"
                    : t("onb.entryOwnerAction") || "Start Tracking"}
                  <ArrowRight className="h-5 w-5 ms-2" />
                </Btn>
              </div>
            </div>
          ) : (
            /* Partner Personalised Entry */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <HeartHandshake className="h-4 w-4" />
                  <span>{t("set.rolePartner") || "Partner"}</span>
                </div>
                <h2
                  id="entry-title"
                  className="font-display text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  {t("onb.entryPartnerTitle") || "Welcome, Partner"}
                </h2>
                <p className="mx-auto max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("onb.entryPartnerDesc") ||
                    "Partner Connect allows you to view cycle updates someone explicitly shares with you via end-to-end encryption."}
                </p>
              </div>

              {/* Partner Explanation Note */}
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:p-5 text-start space-y-2 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>{t("partner.title") || "Partner Connect Safeguards"}</span>
                </div>
                <p>
                  {t("onb.entryPartnerNote") ||
                    "You will need an invitation or pairing code from a cycle owner to view records. You cannot change the owner's information."}
                </p>
              </div>

              <div className="pt-2">
                <Btn
                  type="button"
                  onClick={handleFinish}
                  disabled={busy}
                  className="w-full min-h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 cursor-pointer"
                >
                  {busy
                    ? t("common.loading") || "Setting up…"
                    : t("onb.entryPartnerAction") || "Enter Partner Connect"}
                  <ArrowRight className="h-5 w-5 ms-2" />
                </Btn>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handlePrev}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("onb.prev") || "Back"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
