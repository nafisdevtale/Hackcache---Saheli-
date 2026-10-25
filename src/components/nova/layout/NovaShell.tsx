import React, { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Volume2, Square } from "lucide-react";
// @ts-expect-error plain JS component
import { SaheliLogo } from "@/components/brand/SaheliLogo.jsx";
import { LANGUAGES } from "@/i18n/languages.js";
import { NovaSidebar } from "../navigation/NovaSidebar.js";
import { NovaTabletNav } from "../navigation/NovaTabletNav.js";
import { NovaMobileDock } from "../navigation/NovaMobileDock.js";

export interface NovaShellProps {
  children: ReactNode;
  t: (key: string) => string;
  prefs: {
    discreet: boolean;
    lang: string;
    readAloud?: boolean;
  };
  setPrefs: (update: Partial<{ discreet: boolean; lang: string }>) => void;
  isOnline: boolean;
  onQuickLog: () => void;
  onReadAloud?: () => void;
  isSpeaking?: boolean;
  banners?: ReactNode;
  systemAlerts?: ReactNode;
  userRole?: "owner" | "partner";
}

export const NovaShell: React.FC<NovaShellProps> = ({
  children,
  t,
  prefs,
  setPrefs,
  isOnline,
  onQuickLog,
  onReadAloud,
  isSpeaking = false,
  banners,
  systemAlerts,
  userRole = "owner",
}) => {
  return (
    <div
      data-testid="nova-shell"
      className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-body selection:bg-primary/20"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:inset-inline-start-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-card focus:p-3.5 focus:shadow-xl focus:ring-2 focus:ring-primary"
      >
        {t("common.skipToContent")}
      </a>

      {/* Desktop 4-Pillar Sidebar (>= 1024px) */}
      <NovaSidebar
        t={t}
        prefs={prefs}
        setPrefs={setPrefs}
        isOnline={isOnline}
        onQuickLog={onQuickLog}
        onReadAloud={onReadAloud}
        isSpeaking={isSpeaking}
        userRole={userRole}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (< 1024px) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-2.5 backdrop-blur-md select-none print:hidden">
          <Link to="/" className="flex items-center gap-2">
            <SaheliLogo discreet={prefs.discreet} size={28} animated />
            <span className="font-display text-base font-extrabold tracking-tight bg-gradient-to-r from-primary to-period bg-clip-text text-transparent">
              {prefs.discreet ? t("app.discreetName") : t("app.name")}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrefs({ discreet: !prefs.discreet })}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label={t("aria.discreetToggle") || "Toggle Discreet Mode"}
            >
              {prefs.discreet ? (
                <EyeOff className="h-4 w-4 text-primary" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

            <label htmlFor="nova-mobile-lang-select" className="sr-only">
              {t("nav.langToggleLabel")}
            </label>
            <select
              id="nova-mobile-lang-select"
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

            {prefs.readAloud && onReadAloud && (
              <button
                type="button"
                aria-label={isSpeaking ? t("common.stop") : t("common.readPage")}
                onClick={onReadAloud}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isSpeaking
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {isSpeaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </header>

        {/* Tablet Horizontal Strip (768px - 1023px) */}
        <NovaTabletNav t={t} onQuickLog={onQuickLog} />

        {/* System & Notification Alerts */}
        {systemAlerts}
        {banners}

        {/* Main Routed Content Area */}
        <main
          id="main"
          className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-32 lg:pb-12"
        >
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Dock (< 768px) */}
      <NovaMobileDock t={t} onQuickLog={onQuickLog} userRole={userRole} />
    </div>
  );
};
