import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  Droplet,
  BarChart3,
  Sparkles,
  Heart,
  Compass,
  BookOpen,
  Bot,
  HeartPulse,
  ShoppingBag,
  Film,
  Settings,
  Users,
  Menu,
  Eye,
  EyeOff,
  Shield,
  WifiOff,
  Volume2,
} from "lucide-react";
// @ts-expect-error plain JS component
import { SaheliLogo } from "@/components/brand/SaheliLogo.jsx";
import { LANGUAGES } from "@/i18n/languages.js";

export interface NovaSidebarProps {
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
}

export const NovaSidebar: React.FC<NovaSidebarProps> = ({
  t,
  prefs,
  setPrefs,
  isOnline,
  onQuickLog,
  onReadAloud,
}) => {
  const pillars = [
    {
      title: t("today.title") ? `${t("today.title")} & Cycle` : "My Health",
      items: [
        { to: "/", key: "nav.today", icon: Home, exact: true },
        { to: "/calendar", key: "nav.calendar", icon: CalendarDays },
        { to: "/log", key: "nav.log", icon: Droplet },
        { to: "/insights", key: "nav.insights", icon: BarChart3 },
      ],
    },
    {
      title: t("nav.selfCare") || "My Space",
      items: [
        { to: "/selfcare", key: "nav.selfCare", icon: Sparkles },
        { to: "/companion", key: "nav.companion", icon: Heart },
        { to: "/discover", key: "nav.discover", icon: Compass },
        { to: "/learn", key: "nav.learn", icon: BookOpen },
      ],
    },
    {
      title: t("nav.ai") || "AI Specialists",
      items: [
        { to: "/diva", key: "nav.diva", icon: Bot },
        { to: "/ask", key: "nav.ask", icon: HeartPulse },
        { to: "/flash", key: "nav.flash", icon: ShoppingBag },
        { to: "/instinct", key: "nav.instinct", icon: Film },
      ],
    },
    {
      title: t("set.title") || "Preferences",
      items: [
        { to: "/community", key: "nav.community", icon: Users },
        { to: "/settings", key: "nav.settings", icon: Settings },
        { to: "/more", key: "nav.more", icon: Menu },
      ],
    },
  ];

  return (
    <aside
      aria-label={t("nav.main")}
      className="hidden lg:flex w-64 flex-col shrink-0 border-r border-border bg-card/85 backdrop-blur-md h-screen sticky top-0 z-30 select-none print:hidden"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/80">
        <Link to="/" className="flex items-center gap-2.5">
          <SaheliLogo discreet={prefs.discreet} size={32} animated />
          <span className="font-display text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary to-period bg-clip-text text-transparent">
            {prefs.discreet ? t("app.discreetName") : t("app.name")}
          </span>
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={onQuickLog}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-period px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 active:scale-[0.985] cursor-pointer transition-all"
        >
          <Droplet className="h-4 w-4 fill-current" />
          <span>{t("today.logToday")}</span>
        </button>
      </div>

      {/* 4 Pillars Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {pillar.title}
            </div>
            <div className="space-y-0.5">
              {pillar.items.map(({ to, key, icon: Icon, exact }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: Boolean(exact) }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all data-[status=active]:bg-primary/10 data-[status=active]:text-primary data-[status=active]:font-bold"
                  activeProps={{ "aria-current": "page" }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(key)}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Controls: Discreet, Language, Read-Aloud, Privacy status */}
      <div className="p-4 border-t border-border/80 space-y-3 bg-muted/20">
        <button
          type="button"
          onClick={() => setPrefs({ discreet: !prefs.discreet })}
          className="flex min-h-[38px] w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold border border-border/80 bg-card hover:bg-muted text-muted-foreground transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {prefs.discreet ? (
              <EyeOff className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            <span>{t("set.discreet")}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-primary">
            {prefs.discreet ? "ON" : "OFF"}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="nova-desktop-lang-select" className="sr-only">
            {t("nav.langToggleLabel")}
          </label>
          <select
            id="nova-desktop-lang-select"
            value={prefs.lang}
            onChange={(e) => setPrefs({ lang: e.target.value })}
            className="flex-1 h-9 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-all"
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
              aria-label={t("common.readPage")}
              onClick={onReadAloud}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 px-0.5">
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
  );
};
