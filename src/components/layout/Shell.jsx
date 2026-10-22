import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  PenLine,
  CalendarDays,
  BookOpen,
  Menu,
  NotebookPen,
  Flower2,
  Volume2,
  X,
  Bell,
  WifiOff,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, speak, cx, inputCls } from "@/components/common/ui.jsx";
import { isValidPin } from "@/lib/encryption.js";
import { CONFIG } from "@/config.js";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow.jsx";

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
      <NotebookPen aria-hidden className="mx-auto h-12 w-12 text-primary" />
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

const NAV = [
  { to: "/", key: "nav.today", icon: Home },
  { to: "/log", key: "nav.log", icon: PenLine },
  { to: "/calendar", key: "nav.calendar", icon: CalendarDays },
  { to: "/learn", key: "nav.learn", icon: BookOpen },
  { to: "/more", key: "nav.more", icon: Menu },
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
  } = app;
  const [speechFailed, setSpeechFailed] = useState(false);
  if (status === "loading")
    return (
      <p className="p-8 text-center" role="status">
        {t("common.loading")}
      </p>
    );
  if (status === "error")
    return (
      <p className="p-8 text-center" role="alert">
        {t("set.failed")}
      </p>
    );
  if (status === "onboarding") return <OnboardingFlow />;
  if (status === "locked") return <LockScreen />;
  const AppIcon = prefs.discreet ? NotebookPen : Flower2;
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2"
      >
        {t("common.skipToContent")}
      </a>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur print:hidden">
        <Link
          to="/"
          className="flex min-h-12 items-center gap-2 font-display text-xl font-bold text-primary"
        >
          <AppIcon aria-hidden className="h-7 w-7" />{" "}
          {prefs.discreet ? t("app.discreetName") : t("app.name")}
        </Link>
        <div className="flex items-center gap-1">
          {prefs.readAloud && (
            <button
              type="button"
              aria-label={t("common.readPage")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl hover:bg-muted"
              onClick={() =>
                setSpeechFailed(
                  !speak(document.getElementById("main")?.innerText || "", prefs.lang),
                )
              }
            >
              <Volume2 aria-hidden className="h-6 w-6" />
            </button>
          )}
          <button
            type="button"
            aria-label={t("nav.langToggleLabel")}
            onClick={() => setPrefs({ lang: prefs.lang === "en" ? "hi" : "en" })}
            className="min-h-12 rounded-xl border-2 border-border px-3 font-semibold hover:bg-muted"
          >
            {t("nav.langToggle")}
          </button>
        </div>
      </header>
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-1.5 text-center text-xs font-semibold text-muted-foreground print:hidden"
        >
          <WifiOff aria-hidden className="h-3.5 w-3.5" />
          <span>{prefs.discreet ? t("pwa.offlineDiscreet") : t("pwa.offline")}</span>
        </div>
      )}
      {updateWaiting && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-4 my-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent p-3 text-sm text-accent-foreground shadow-soft print:hidden"
        >
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
      )}
      {isDemo && (
        <p className="bg-accent px-4 py-1 text-center text-sm font-semibold text-accent-foreground print:hidden">
          {t("common.demoBadge")}
        </p>
      )}
      {speechFailed && (
        <p role="status" className="px-4 print:hidden">
          {t("common.ttsUnsupported")}
        </p>
      )}
      <div aria-live="polite" className="space-y-2 px-4 pt-2 print:hidden">
        {banners.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-accent p-3 text-accent-foreground"
          >
            <span className="flex items-center gap-2">
              <Bell aria-hidden className="h-5 w-5" /> {b.text}
            </span>
            <button
              type="button"
              aria-label={t("rem.dismiss")}
              onClick={() => dismissBanner(b.id)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-lg hover:bg-background/40"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <main id="main" className="flex-1 px-4 pb-28 pt-4">
        {children}
      </main>
      <nav
        aria-label={t("nav.main")}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card print:hidden"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {NAV.map(({ to, key, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-1 text-center text-xs font-semibold text-muted-foreground data-[status=active]:text-primary"
                activeProps={{ "aria-current": "page", className: "nav-active" }}
              >
                <Icon aria-hidden className="h-6 w-6" />
                <span className="leading-tight">{t(key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
