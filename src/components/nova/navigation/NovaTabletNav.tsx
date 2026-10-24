import React from "react";
import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, Droplet, BarChart3, Sparkles, Heart, Bot, Menu } from "lucide-react";

export interface NovaTabletNavProps {
  t: (key: string) => string;
  onQuickLog: () => void;
}

export const NovaTabletNav: React.FC<NovaTabletNavProps> = ({ t, onQuickLog }) => {
  const routes = [
    { to: "/", key: "nav.today", icon: Home, exact: true },
    { to: "/calendar", key: "nav.calendar", icon: CalendarDays },
    { to: "/log", key: "nav.log", icon: Droplet },
    { to: "/insights", key: "nav.insights", icon: BarChart3 },
    { to: "/selfcare", key: "nav.selfCare", icon: Sparkles },
    { to: "/companion", key: "nav.companion", icon: Heart },
    { to: "/diva", key: "nav.diva", icon: Bot },
    { to: "/more", key: "nav.more", icon: Menu },
  ];

  return (
    <nav
      aria-label="Tablet navigation"
      className="hidden md:flex lg:hidden items-center justify-between gap-3 overflow-x-auto border-b border-border bg-card/85 px-4 py-2 backdrop-blur-md select-none print:hidden"
    >
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {routes.map(({ to, key, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: Boolean(exact) }}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
            activeProps={{ "aria-current": "page" }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t(key)}</span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={onQuickLog}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-period text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-2xs hover:opacity-95 active:scale-[0.98] cursor-pointer transition-all"
      >
        <Droplet className="h-3.5 w-3.5 fill-current" />
        <span>{t("today.logToday")}</span>
      </button>
    </nav>
  );
};
