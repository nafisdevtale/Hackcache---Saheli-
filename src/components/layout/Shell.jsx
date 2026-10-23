import { useState } from "react";
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
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, speak, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin } from "@/lib/encryption.js";
import { CONFIG } from "@/config.js";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow.jsx";
import { LANGUAGES } from "@/i18n/languages.js";
import { SaheliLogo, AmbientGlow } from "@/components/brand/SaheliLogo.jsx";
import { QuickLogSheet } from "@/components/logging/QuickLogSheet.jsx";

let failCount = 0;
function LockScreen() {
  const { t, unlock, prefs } = useApp();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!isValidPin(pin)) return setErr({ key: "set.pinInvalid" });
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

  return (
    <main id="main" className="mx-auto max-w-sm space-y-4 px-4 py-12 text-center">
      <SaheliLogo discreet={prefs.discreet} size={48} className="mx-auto" />
      <h1 className="font-display text-2xl font-bold">
        {prefs.discreet ? t("app.discreetName") : t("lock.title")}
      </h1>
      <p>{t("lock.prompt")}</p>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="pin" className="sr-only">
          {t("lock.pin")}
        </label>
        <input
          id="pin"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          pattern="\d{4}"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className={cx(inputCls, "text-center text-2xl tracking-[0.5em]")}
          placeholder="••••"
        />
        <Btn type="submit" className="w-full" disabled={busy}>
          {busy ? t("set.working") : t("lock.unlock")}
        </Btn>
      </form>
      {err && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-2 text-destructive">
          {t(err.key, err.vars)}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{t("lock.forgot")}</p>
    </main>
  );
}

const DESKTOP_NAV = [
  { to: "/", key: "nav.today" },
  { to: "/calendar", key: "nav.calendar" },
  { to: "/learn", key: "nav.learn" },
  { to: "/insights", key: "nav.insights" },
  { to: "/community", key: "nav.community" },
  { to: "/ask", key: "nav.ask" },
  { to: "/more", key: "nav.more" },
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
          <SaheliLogo size={40} animated />
          <p className="text-sm font-medium text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );

  if (status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center" role="alert">
        <p className="rounded-2xl bg-destructive/10 p-6 font-semibold text-destructive">
          {t("set.failed")}
        </p>
      </div>
    );

  if (status === "onboarding") return <OnboardingFlow />;
  if (status === "locked") return <LockScreen />;

  return (
    <div className="relative min-h-screen flex flex-col antialiased selection:bg-primary/20">
      <AmbientGlow />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:p-3 focus:shadow-lg focus:ring-2 focus:ring-primary"
      >
        {t("common.skipToContent")}
      </a>

      {/* Primary Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur-md transition-all print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to="/"
            className="group flex min-h-11 items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-primary transition-transform active:scale-98"
          >
            <SaheliLogo discreet={prefs.discreet} size={32} animated />
            <span className="bg-gradient-to-r from-primary to-period bg-clip-text text-transparent">
              {prefs.discreet ? t("app.discreetName") : t("app.name")}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label={t("nav.main")} className="hidden md:flex items-center gap-1">
            {DESKTOP_NAV.map(({ to, key }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
                activeProps={{ "aria-current": "page" }}
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Right Header Controls (Desktop Quick Log, Read Aloud, Language Switcher) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuickLogOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <Droplet className="h-3.5 w-3.5 fill-current" />
              <span>{t("log.title")}</span>
            </button>

            {prefs.readAloud && (
              <button
                type="button"
                aria-label={t("common.readPage")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() =>
                  setSpeechFailed(
                    !speak(document.getElementById("main")?.innerText || "", prefs.lang),
                  )
                }
              >
                <Volume2 aria-hidden className="h-4 w-4" />
              </button>
            )}

            <label htmlFor="shell-lang-select" className="sr-only">
              {t("nav.langToggleLabel")}
            </label>
            <select
              id="shell-lang-select"
              value={prefs.lang}
              onChange={(e) => setPrefs({ lang: e.target.value })}
              className="h-9 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs hover:bg-muted cursor-pointer transition-all"
              aria-label={t("nav.langToggleLabel")}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Offline Status Pill */}
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

      {/* Update Waiting Banner */}
      {updateWaiting && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-auto my-2 w-full max-w-5xl px-4 print:hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent p-3.5 text-sm text-accent-foreground shadow-soft">
            <p className="font-medium">
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

      {/* Demo Badge */}
      {isDemo && (
        <div className="bg-accent/40 border-b border-accent/60 px-4 py-1 text-center text-xs font-bold text-accent-foreground print:hidden">
          {t("common.demoBadge")}
        </div>
      )}

      {speechFailed && (
        <p
          role="status"
          className="mx-auto max-w-5xl px-4 py-1 text-xs text-muted-foreground print:hidden"
        >
          {t("common.ttsUnsupported")}
        </p>
      )}

      {/* Active User Banners */}
      <div aria-live="polite" className="mx-auto w-full max-w-5xl space-y-2 px-4 pt-2 print:hidden">
        {banners.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-2 rounded-2xl bg-accent/80 p-3 text-sm text-accent-foreground shadow-sm"
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

      {/* Main Content Viewport */}
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 md:pb-12 md:pt-6">
        {children}
      </main>

      {/* Mobile Floating Frosted Bottom Dock */}
      <nav
        aria-label={t("nav.main")}
        className="fixed inset-x-0 bottom-3 z-40 mx-auto max-w-sm px-4 md:hidden print:hidden"
      >
        <div className="flex items-center justify-around rounded-3xl border border-border/70 bg-card/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
          {/* 1. Today */}
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <Home aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.today")}</span>
          </Link>

          {/* 2. Calendar */}
          <Link
            to="/calendar"
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <CalendarDays aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.calendar")}</span>
          </Link>

          {/* 3. Elevated Tactile Quick Log Action */}
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

          {/* 4. Learn */}
          <Link
            to="/learn"
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <BookOpen aria-hidden className="h-5 w-5" />
            <span className="leading-none">{t("nav.learn")}</span>
          </Link>

          {/* 5. More */}
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
