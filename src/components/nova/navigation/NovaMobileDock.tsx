import React from "react";
import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, Droplet, Bot, Menu } from "lucide-react";

export interface NovaMobileDockProps {
  t: (key: string) => string;
  onQuickLog: () => void;
}

export const NovaMobileDock: React.FC<NovaMobileDockProps> = ({ t, onQuickLog }) => {
  return (
    <nav
      aria-label={t("nav.main")}
      data-testid="nova-mobile-dock"
      className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-sm px-4 md:hidden print:hidden pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center justify-around rounded-3xl border border-border/80 bg-card/90 px-3 py-1.5 shadow-xl backdrop-blur-xl">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
          activeProps={{ "aria-current": "page" }}
        >
          <Home aria-hidden className="h-5 w-5" />
          <span className="leading-none">{t("nav.today")}</span>
        </Link>

        <Link
          to="/calendar"
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
          activeProps={{ "aria-current": "page" }}
        >
          <CalendarDays aria-hidden className="h-5 w-5" />
          <span className="leading-none">{t("nav.calendar")}</span>
        </Link>

        {/* Center Prominent Log Action */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={onQuickLog}
            aria-label={t("log.title")}
            className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-period text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-background transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Droplet className="h-6 w-6 fill-current" />
          </button>
        </div>

        <Link
          to="/diva"
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
          activeProps={{ "aria-current": "page" }}
        >
          <Bot aria-hidden className="h-5 w-5" />
          <span className="leading-none">{t("nav.diva")}</span>
        </Link>

        <Link
          to="/more"
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 text-center text-[10px] font-bold text-muted-foreground transition-colors data-[status=active]:text-primary"
          activeProps={{ "aria-current": "page" }}
        >
          <Menu aria-hidden className="h-5 w-5" />
          <span className="leading-none">{t("nav.more")}</span>
        </Link>
      </div>
    </nav>
  );
};
