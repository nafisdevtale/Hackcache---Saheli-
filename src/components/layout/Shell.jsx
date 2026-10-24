import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  BookOpen,
  Menu,
  Volume2,
  X,
  Bell,
  WifiOff,
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
  Compass,
  ShoppingBag,
  Heart,
  Film,
  Bot,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, speak, cx } from "@/components/common/ui.jsx";
import { isValidSecret } from "@/lib/encryption.js";
import { CONFIG } from "@/config.js";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow.jsx";
import { LANGUAGES } from "@/i18n/languages.js";
import { SaheliLogo, AmbientGlow } from "@/components/brand/SaheliLogo.jsx";
import { QuickLogSheet } from "@/components/logging/QuickLogSheet.jsx";
import { RhythmMotif } from "@/components/brand/SaheliArt.jsx";
import { NovaSidebar, NovaTabletNav, NovaMobileDock } from "@/components/nova";

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

  async function submit(e) {
    if (e) e.preventDefault();
    await submitPin(pin);
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

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-primary/20">
      <AmbientGlow />

      <main
        id="main"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-bloom-modal backdrop-blur-xl animate-fade-in"
      >
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 overflow-hidden">
          <RhythmMotif className="w-[500px] h-[500px] scale-125" />
        </div>

        {/* Utilities: Discreet toggle & Language selector */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setPrefs({ discreet: !prefs.discreet })}
            className={cx(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              prefs.discreet
                ? "border-primary/40 bg-primary/10 text-primary font-bold"
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
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <SaheliLogo discreet={prefs.discreet} size={48} animated />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            {prefs.discreet ? t("app.discreetName") : t("app.name")}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {prefs.discreet ? t("common.discreetDesc") : t("lock.subtitle")}
          </p>
        </div>

        {usePassphraseMode ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="lock-passphrase" className="sr-only">
                {t("lock.enterPassphrase")}
              </label>
              <input
                ref={inputRef}
                id="lock-passphrase"
                type="password"
                placeholder={t("lock.enterPassphrase")}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={busy}
                className="min-h-12 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Btn type="submit" disabled={busy || !pin} className="w-full">
              {busy ? t("common.loading") : t("lock.unlock")}
            </Btn>
            <button
              type="button"
              onClick={() => {
                setUsePassphraseMode(false);
                setPin("");
              }}
              className="block mx-auto text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              {t("lock.switchToPin")}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-4 py-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cx(
                    "h-4 w-4 rounded-full border-2 transition-all duration-200",
                    pin.length > index
                      ? "border-primary bg-primary scale-110 shadow-sm"
                      : "border-border/80 bg-muted/40",
                  )}
                />
              ))}
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto select-none">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit.toString())}
                  disabled={busy}
                  className="flex h-14 w-full items-center justify-center rounded-2xl border border-border/60 bg-card text-lg font-bold text-foreground shadow-2xs hover:bg-muted/70 active:scale-95 transition-all cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigit("0")}
                disabled={busy}
                className="flex h-14 w-full items-center justify-center rounded-2xl border border-border/60 bg-card text-lg font-bold text-foreground shadow-2xs hover:bg-muted/70 active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={busy || pin.length === 0}
                aria-label={t("common.delete")}
                className="flex h-14 w-full items-center justify-center rounded-2xl border border-border/60 bg-card text-sm font-bold text-muted-foreground hover:text-foreground shadow-2xs hover:bg-muted/70 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
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
              className="mt-4 block mx-auto text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              {t("lock.switchToPassphrase")}
            </button>
          </div>
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

const NAV_SECTIONS = [
  {
    id: "rhythm",
    titleKey: "nav.rhythmSection",
    defaultTitle: "Daily Rhythm",
    items: [
      { to: "/", key: "nav.today", icon: Home },
      { to: "/calendar", key: "nav.calendar", icon: CalendarDays },
      { to: "/log", key: "nav.log", icon: Droplet },
      { to: "/insights", key: "nav.insights", icon: BarChart3 },
    ],
  },
  {
    id: "sanctuary",
    titleKey: "nav.sanctuarySection",
    defaultTitle: "Sanctuary",
    items: [
      { to: "/selfcare", key: "nav.selfCare", icon: Sparkles },
      { to: "/companion", key: "nav.companion", icon: Heart },
      { to: "/discover", key: "nav.discover", icon: Compass },
      { to: "/learn", key: "nav.learn", icon: BookOpen },
    ],
  },
  {
    id: "ai",
    titleKey: "nav.aiSection",
    defaultTitle: "AI Intelligence",
    items: [
      { to: "/diva", key: "nav.diva", icon: Bot, badge: "Hub" },
      { to: "/ask", key: "nav.ask", icon: MessageCircle },
      { to: "/flash", key: "nav.flash", icon: ShoppingBag },
      { to: "/instinct", key: "nav.instinct", icon: Film },
    ],
  },
  {
    id: "system",
    titleKey: "nav.systemSection",
    defaultTitle: "Account",
    items: [
      { to: "/community", key: "nav.community", icon: Users },
      { to: "/settings", key: "nav.settings", icon: Settings },
      { to: "/more", key: "nav.more", icon: Menu },
    ],
  },
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
          <SaheliLogo size={48} animated />
          <p className="text-sm font-semibold text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );

  if (status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center" role="alert">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-card p-8 shadow-bloom-card space-y-3">
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
        className="sr-only focus:not-sr-only focus:fixed focus:inset-inline-start-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-card focus:p-3.5 focus:shadow-xl focus:ring-2 focus:ring-primary"
      >
        {t("common.skipToContent")}
      </a>

      {/* Main Responsive Layout: Sticky Rail on Desktop, Top Bar on Mobile & Tablet */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* ========================================================================= */}
        {/* DESKTOP SIDEBAR / NAVIGATION RAIL (>= 1024px)                             */}
        {/* ========================================================================= */}
        <NovaSidebar
          t={t}
          prefs={prefs}
          setPrefs={setPrefs}
          isOnline={isOnline}
          onQuickLog={() => setQuickLogOpen(true)}
          onReadAloud={() =>
            setSpeechFailed(!speak(document.getElementById("main")?.innerText || "", prefs.lang))
          }
        />

        {/* ========================================================================= */}
        {/* MAIN BODY AREA & RESPONSIVE CANVAS                                        */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile & Tablet Header (< 1024px) */}
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-2.5 backdrop-blur-md transition-all print:hidden">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-primary"
            >
              <SaheliLogo discreet={prefs.discreet} size={30} animated />
              <span className="bg-gradient-to-r from-primary to-period bg-clip-text text-transparent">
                {prefs.discreet ? t("app.discreetName") : t("app.name")}
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrefs({ discreet: !prefs.discreet })}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Toggle Discreet Mode"
              >
                {prefs.discreet ? (
                  <EyeOff className="h-4 w-4 text-primary" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

              <label htmlFor="mobile-lang-select" className="sr-only">
                {t("nav.langToggleLabel")}
              </label>
              <select
                id="mobile-lang-select"
                value={prefs.lang}
                onChange={(e) => setPrefs({ lang: e.target.value })}
                className="h-8 rounded-xl border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
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

          {/* Tablet Dedicated Navigation Strip (768px to 1023px) */}
          <NovaTabletNav t={t} onQuickLog={() => setQuickLogOpen(true)} />

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
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent p-3.5 text-sm text-accent-foreground shadow-bloom-card">
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
                className="flex items-center justify-between gap-2 rounded-2xl bg-accent/80 p-3 text-sm text-accent-foreground shadow-2xs border border-accent-strong/20"
              >
                <span className="flex items-center gap-2">
                  <Bell aria-hidden className="h-4 w-4 shrink-0" /> {b.text}
                </span>
                <button
                  type="button"
                  aria-label={t("rem.dismiss")}
                  onClick={() => dismissBanner(b.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background/40 cursor-pointer"
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

      {/* Mobile Floating Frosted Bottom Dock (< 768px) */}
      <NovaMobileDock t={t} onQuickLog={() => setQuickLogOpen(true)} />

      {/* Global Quick Log Sheet */}
      <QuickLogSheet
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        targetDate={today}
      />
    </div>
  );
}
