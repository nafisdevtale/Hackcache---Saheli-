import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  BookOpen,
  Menu,
  NotebookPen,
  Volume2,
  X,
  Bell,
  WifiOff,
  Plus,
  Droplet,
  Sparkles,
  BarChart3,
  Users,
  MessageCircle,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  Stethoscope,
  Compass,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, speak, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin, isValidSecret } from "@/lib/encryption.js";
import { CONFIG } from "@/config.js";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow.jsx";
import { LANGUAGES } from "@/i18n/languages.js";
import { SaheliLogo, AmbientGlow } from "@/components/brand/SaheliLogo.jsx";
import { QuickLogSheet } from "@/components/logging/QuickLogSheet.jsx";
import { RhythmMotif } from "@/components/brand/SaheliArt.jsx";

let failCount = 0;

function LockScreen() {
  const { t, unlock, prefs, setPrefs } = useApp();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [usePassphraseMode, setUsePassphraseMode] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [usePassphraseMode]);

  async function submit(e) {
    if (e) e.preventDefault();
    if (!isValidSecret(pin)) return setErr({ key: "set.pinInvalid" });
    setBusy(true);
    setErr("");
    try {
      await unlock(pin);
      failCount = 0;
    } catch {
      failCount++;
      setPin("");
      if (failCount >= CONFIG.maxPinAttemptsBeforeDelay) {
        setErr({ key: "lock.wait", vars: { s: CONFIG.pinDelayMs / 1000 } });
        await new Promise((r) => setTimeout(r, CONFIG.pinDelayMs));
      } else setErr({ key: "lock.wrong" });
    }
    setBusy(false);
  }

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          submitPin(nextPin);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPin = async (submittedPin) => {
    if (!isValidSecret(submittedPin)) return setErr({ key: "set.pinInvalid" });
    setBusy(true);
    setErr("");
    try {
      await unlock(submittedPin);
      failCount = 0;
    } catch {
      failCount++;
      setPin("");
      if (failCount >= CONFIG.maxPinAttemptsBeforeDelay) {
        setErr({ key: "lock.wait", vars: { s: CONFIG.pinDelayMs / 1000 } });
        await new Promise((r) => setTimeout(r, CONFIG.pinDelayMs));
      } else setErr({ key: "lock.wrong" });
    }
    setBusy(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-primary/20">
      <AmbientGlow />

      <main
        id="main"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-8 shadow-2xl backdrop-blur-xl animate-fade-in"
      >
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15 overflow-hidden">
          <RhythmMotif className="w-[500px] h-[500px] scale-125" />
        </div>

        {/* Utilities: Discreet toggle & Language selector */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setPrefs({ discreet: !prefs.discreet })}
            className={cx(
              "flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
              prefs.discreet
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/80 bg-background/80 text-muted-foreground hover:bg-muted",
            )}
            aria-label="Toggle Discreet Mode"
          >
            {prefs.discreet ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="text-[11px] font-bold">
              {prefs.discreet ? "Discreet ON" : "Discreet"}
            </span>
          </button>

          <label htmlFor="lock-lang-select" className="sr-only">
            {t("nav.langToggleLabel")}
          </label>
          <select
            id="lock-lang-select"
            value={prefs.lang}
            onChange={(e) => setPrefs({ lang: e.target.value })}
            className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <SaheliLogo discreet={prefs.discreet} size={52} animated />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {prefs.discreet ? t("app.discreetName") : t("lock.title")}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {t("lock.prompt")}
          </p>
        </div>

        {usePassphraseMode ? (
          /* Passphrase Input Mode */
          <form onSubmit={submit} className="my-6 max-w-xs mx-auto space-y-4">
            <div>
              <label htmlFor="passphrase-input" className="sr-only">
                {t("lock.enterPassphrase")}
              </label>
              <input
                id="passphrase-input"
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t("lock.enterPassphrase")}
                className={cx(
                  inputCls,
                  "h-12 w-full rounded-2xl text-center text-base tracking-widest px-4 border-2 border-primary/40 focus:border-primary",
                )}
              />
            </div>
            <button
              type="submit"
              disabled={busy || !pin}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-98 disabled:opacity-50"
            >
              {busy ? t("set.working") : t("lock.unlock")}
            </button>
            <button
              type="button"
              onClick={() => {
                setUsePassphraseMode(false);
                setPin("");
              }}
              className="w-full text-center py-1 text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              {t("lock.switchToPin")}
            </button>
          </form>
        ) : (
          /* Tactile 4-Digit PIN Mode */
          <>
            <div
              className="my-6 flex justify-center gap-3 cursor-pointer"
              onClick={() => inputRef.current?.focus()}
            >
              {[0, 1, 2, 3].map((i) => {
                const hasDigit = pin.length > i;
                return (
                  <div
                    key={i}
                    className={cx(
                      "flex h-14 w-12 sm:w-14 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition-all",
                      hasDigit
                        ? "border-primary bg-primary/15 text-primary shadow-sm scale-105"
                        : pin.length === i
                          ? "border-primary/50 bg-background/60 animate-pulse"
                          : "border-border/60 bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {hasDigit ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {/* Hidden Accessible Input for physical keyboards */}
            <form onSubmit={submit} className="sr-only">
              <label htmlFor="pin-input">{t("lock.pin")}</label>
              <input
                id="pin-input"
                ref={inputRef}
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                pattern="\d{4}"
                type="password"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(val);
                  if (val.length === 4) submitPin(val);
                }}
              />
            </form>

            {/* On-Screen Tactile Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={busy}
                  onClick={() => handleDigit(String(digit))}
                  className="flex h-12 sm:h-13 items-center justify-center rounded-2xl border border-border/70 bg-card hover:bg-muted/70 active:scale-95 text-lg font-bold text-foreground transition-all shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                disabled={busy || pin.length === 0}
                onClick={() => setPin("")}
                className="flex h-12 sm:h-13 items-center justify-center rounded-2xl text-xs font-bold text-muted-foreground hover:bg-muted/50 active:scale-95 transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDigit("0")}
                className="flex h-12 sm:h-13 items-center justify-center rounded-2xl border border-border/70 bg-card hover:bg-muted/70 active:scale-95 text-lg font-bold text-foreground transition-all shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                disabled={busy || pin.length === 0}
                onClick={handleBackspace}
                aria-label="Backspace"
                className="flex h-12 sm:h-13 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 hover:bg-muted active:scale-95 text-sm font-bold text-foreground transition-all"
              >
                ⌫
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setUsePassphraseMode(true);
                setPin("");
              }}
              className="mt-4 block mx-auto text-xs text-primary hover:underline font-semibold"
            >
              {t("lock.switchToPassphrase")}
            </button>
          </>
        )}

        {err && (
          <div
            role="alert"
            className="mt-4 rounded-2xl bg-destructive/10 p-3 text-center text-xs font-semibold text-destructive animate-fade-in"
          >
            {t(err.key || err, err.vars)}
          </div>
        )}

        {/* Recovery Reassurance */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-1.5 text-foreground/80 font-semibold">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>{t("onb.privacyExplainTitle")}</span>
          </div>
          <p className="text-[11px] leading-relaxed max-w-xs mx-auto">{t("lock.forgot")}</p>
        </div>
      </main>
    </div>
  );
}

const DESKTOP_NAV = [
  { to: "/", key: "nav.today", icon: Home },
  { to: "/calendar", key: "nav.calendar", icon: CalendarDays },
  { to: "/log", key: "nav.log", icon: Droplet },
  { to: "/insights", key: "nav.insights", icon: BarChart3 },
  { to: "/selfcare", key: "nav.selfCare", icon: Sparkles },
  { to: "/companion", key: "nav.companion", icon: Heart },
  { to: "/discover", key: "nav.discover", icon: Compass },
  { to: "/flash", key: "nav.flash", icon: ShoppingBag },
  { to: "/learn", key: "nav.learn", icon: BookOpen },
  { to: "/community", key: "nav.community", icon: Users },
  { to: "/ask", key: "nav.ask", icon: MessageCircle },
  { to: "/more", key: "nav.more", icon: Menu },
  { to: "/settings", key: "nav.settings", icon: Settings },
];

export function Shell({ children }) {
  const app = useApp();
  const {
    t,
    prefs,
    setPrefs,
    status,
    isDemo,
    banners,
    dismissBanner,
    isOnline,
    updateWaiting,
    applyUpdate,
    dismissUpdate,
    today,
  } = app;

  const [speechFailed, setSpeechFailed] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center" role="status">
        <div className="flex flex-col items-center gap-3">
          <SaheliLogo size={44} animated />
          <p className="text-sm font-semibold text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );

  if (status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center" role="alert">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-card p-8 shadow-soft space-y-3">
          <p className="font-bold text-destructive">{t("set.failed")}</p>
        </div>
      </div>
    );

  if (status === "onboarding") return <OnboardingFlow />;
  if (status === "locked") return <LockScreen />;

  return (
    <div className="relative min-h-screen flex flex-col antialiased selection:bg-primary/20">
      <AmbientGlow />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-card focus:p-3 focus:shadow-xl focus:ring-2 focus:ring-primary"
      >
        {t("common.skipToContent")}
      </a>

      {/* Main Responsive Layout Wrapper: Left Rail on Desktop, Top Bar on Mobile */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* ========================================================================= */}
        {/* DESKTOP SIDEBAR / NAVIGATION RAIL (>= 1024px)                             */}
        {/* ========================================================================= */}
        <aside
          aria-label={t("nav.main")}
          className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col justify-between border-r border-border/60 bg-card/65 backdrop-blur-xl sticky top-0 h-screen p-5 z-30 select-none"
        >
          <div className="space-y-6">
            {/* Brand Header & Tagline */}
            <div className="space-y-2">
              <Link
                to="/"
                className="group flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-primary transition-transform active:scale-98"
              >
                <SaheliLogo discreet={prefs.discreet} size={36} animated />
                <span className="bg-gradient-to-r from-primary to-period bg-clip-text text-transparent">
                  {prefs.discreet ? t("app.discreetName") : t("app.name")}
                </span>
              </Link>
              <p className="text-[11px] font-medium text-muted-foreground leading-tight px-0.5">
                {prefs.discreet
                  ? t("common.discreetDesc") || "Discreet health journal"
                  : "Your cycle, your rhythm"}
              </p>
            </div>

            {/* Prominent Quick-Log CTA Button */}
            <button
              type="button"
              onClick={() => setQuickLogOpen(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all"
            >
              <Droplet className="h-4 w-4 fill-current" />
              <span>{t("today.logToday")}</span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="space-y-1">
              {DESKTOP_NAV.map(({ to, key, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all data-[status=active]:bg-primary/15 data-[status=active]:text-primary shadow-2xs"
                  activeProps={{ "aria-current": "page" }}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(key)}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Sidebar Utilities (Discreet Mode, Language, Privacy) */}
          <div className="space-y-3 pt-4 border-t border-border/50 text-xs">
            {/* Discreet Mode Quick Toggle */}
            <button
              type="button"
              onClick={() => setPrefs({ discreet: !prefs.discreet })}
              className={cx(
                "flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-1.5 font-semibold transition-all border",
                prefs.discreet
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                {prefs.discreet ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                <span className="text-[11px]">{t("set.discreet")}</span>
              </div>
              <span className="text-[10px] uppercase font-bold">
                {prefs.discreet ? "ON" : "OFF"}
              </span>
            </button>

            {/* Language Selection Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="desktop-lang-select" className="sr-only">
                {t("nav.langToggleLabel")}
              </label>
              <select
                id="desktop-lang-select"
                value={prefs.lang}
                onChange={(e) => setPrefs({ lang: e.target.value })}
                className="flex-1 h-9 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-all"
                aria-label={t("nav.langToggleLabel")}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>

              {prefs.readAloud && (
                <button
                  type="button"
                  aria-label={t("common.readPage")}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() =>
                    setSpeechFailed(
                      !speak(document.getElementById("main")?.innerText || "", prefs.lang),
                    )
                  }
                >
                  <Volume2 aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Offline & Encryption Status Pill */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="h-3 w-3 text-primary" />
                <span>{t("shell.localFirst")}</span>
              </span>
              {!isOnline ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <WifiOff className="h-3 w-3" /> {t("shell.offline")}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t("shell.ready")}
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN BODY AREA & RESPONSIVE CANVAS                                        */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Header (< 1024px) */}
          <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur-md transition-all print:hidden">
            <Link
              to="/"
              className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-primary"
            >
              <SaheliLogo discreet={prefs.discreet} size={28} animated />
              <span className="bg-gradient-to-r from-primary to-period bg-clip-text text-transparent">
                {prefs.discreet ? t("app.discreetName") : t("app.name")}
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <label htmlFor="mobile-lang-select" className="sr-only">
                {t("nav.langToggleLabel")}
              </label>
              <select
                id="mobile-lang-select"
                value={prefs.lang}
                onChange={(e) => setPrefs({ lang: e.target.value })}
                className="h-8 rounded-xl border border-border bg-card px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>

              {prefs.readAloud && (
                <button
                  type="button"
                  aria-label={t("common.readPage")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                  onClick={() =>
                    setSpeechFailed(
                      !speak(document.getElementById("main")?.innerText || "", prefs.lang),
                    )
                  }
                >
                  <Volume2 aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>
          </header>

          {/* System Notification Banners */}
          {!isOnline && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-center gap-2 border-b border-border bg-muted/80 px-4 py-1.5 text-center text-xs font-semibold text-muted-foreground print:hidden"
            >
              <WifiOff aria-hidden className="h-3.5 w-3.5" />
              <span>{prefs.discreet ? t("pwa.offlineDiscreet") : t("pwa.offline")}</span>
            </div>
          )}

          {updateWaiting && (
            <div
              role="alert"
              aria-live="polite"
              className="mx-auto my-3 w-full max-w-6xl px-4 print:hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent p-3.5 text-sm text-accent-foreground shadow-soft">
                <p className="font-semibold">
                  {prefs.discreet ? t("pwa.updateReadyDiscreet") : t("pwa.updateReady")}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Btn size="sm" onClick={applyUpdate}>
                    {t("pwa.updateNow")}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={dismissUpdate}>
                    {t("pwa.updateLater")}
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {isDemo && (
            <div className="bg-accent/40 border-b border-accent/60 px-4 py-1 text-center text-xs font-bold text-accent-foreground print:hidden">
              {t("common.demoBadge")}
            </div>
          )}

          {speechFailed && (
            <p
              role="status"
              className="mx-auto max-w-6xl px-4 py-1 text-xs text-muted-foreground print:hidden"
            >
              {t("common.ttsUnsupported")}
            </p>
          )}

          {/* Active User Banners */}
          <div
            aria-live="polite"
            className="mx-auto w-full max-w-6xl space-y-2 px-4 pt-3 print:hidden"
          >
            {banners.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-accent/80 p-3 text-sm text-accent-foreground shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Bell aria-hidden className="h-4 w-4 shrink-0" /> {b.text}
                </span>
                <button
                  type="button"
                  aria-label={t("rem.dismiss")}
                  onClick={() => dismissBanner(b.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background/40"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Core Viewport Canvas */}
          <main
            id="main"
            className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-32 lg:pb-12"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Floating Frosted Bottom Dock (< 1024px) */}
      <nav
        aria-label={t("nav.main")}
        className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-sm px-4 lg:hidden print:hidden"
      >
        <div className="flex items-center justify-around rounded-3xl border border-border/70 bg-card/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <Home aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.today")}</span>
          </Link>

          <Link
            to="/calendar"
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <CalendarDays aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.calendar")}</span>
          </Link>

          {/* Elevated Quick Log Action */}
          <div className="relative -top-3">
            <button
              type="button"
              onClick={() => setQuickLogOpen(true)}
              aria-label={t("log.title")}
              className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-period text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform hover:scale-105 active:scale-95"
            >
              <Droplet className="h-6 w-6 fill-current" />
            </button>
          </div>

          <Link
            to="/insights"
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <BarChart3 aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.insights")}</span>
          </Link>

          <Link
            to="/more"
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <Menu aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.more")}</span>
          </Link>
        </div>
      </nav>

      {/* Global Quick Log Sheet */}
      <QuickLogSheet
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        targetDate={today}
      />
    </div>
  );
}
