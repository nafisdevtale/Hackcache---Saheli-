import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Stethoscope,
  MessageCircle,
  Users,
  Bell,
  Baby,
  Settings,
  ChevronRight,
  FileText,
  BookOpen,
  Sparkles,
  Compass,
  ShoppingBag,
  MessageSquareWarning,
  Heart,
  Film,
  Bot,
} from "lucide-react";
import { useApp } from "@/App.jsx";

export default function More() {
  const { t, pregnancyVisible, prefs } = useApp();

  const sections = [
    {
      title: t("ins.title"),
      items: [
        {
          to: "/discover",
          key: "nav.discover",
          icon: Compass,
          color: "text-primary bg-primary/10 border border-primary/20",
        },
        {
          to: "/flash",
          key: "nav.flash",
          icon: ShoppingBag,
          color: "text-primary bg-primary/10 border border-primary/20",
        },
        {
          to: "/instinct",
          key: "nav.instinct",
          icon: Film,
          color: "text-accent-foreground bg-accent border border-accent-strong/25",
        },
        {
          to: "/diva",
          key: "nav.diva",
          icon: Bot,
          color: "text-primary bg-primary/15 border border-primary/30",
        },
        {
          to: "/selfcare",
          key: "nav.selfCare",
          icon: Sparkles,
          color: "text-secondary-foreground bg-secondary border border-border/70",
        },
        {
          to: "/companion",
          key: "nav.companion",
          icon: Heart,
          color: "text-period bg-period/15 border border-period/30",
        },
        {
          to: "/learn",
          key: "nav.learn",
          icon: BookOpen,
          color: "text-primary bg-primary/10 border border-primary/20",
        },
        {
          to: "/insights",
          key: "nav.insights",
          icon: BarChart3,
          color: "text-secondary-foreground bg-secondary border border-border/70",
        },
        {
          to: "/doctor",
          key: "nav.doctor",
          icon: Stethoscope,
          color: "text-info bg-info/10 border border-info/25",
        },
        {
          to: "/visit",
          key: "today.linkVisitSummary",
          icon: FileText,
          color: "text-secondary-foreground bg-secondary border border-border/70",
        },
        {
          to: "/ask",
          key: "nav.ask",
          icon: MessageCircle,
          color: "text-primary bg-primary/10 border border-primary/20",
        },
      ],
    },
    {
      title: t("nav.community"),
      items: [
        {
          to: "/community",
          key: "nav.community",
          icon: Users,
          color: "text-period bg-period/15 border border-period/30",
        },
        {
          to: "/reminders",
          key: "nav.reminders",
          icon: Bell,
          color: "text-accent-foreground bg-accent border border-accent-strong/25",
        },
        ...(pregnancyVisible
          ? [
              {
                to: "/pregnancy",
                key: "nav.pregnancy",
                icon: Baby,
                color: "text-secondary-foreground bg-secondary border border-border/70",
              },
            ]
          : []),
      ],
    },
    {
      title: t("nav.settings"),
      items: [
        {
          to: "/settings",
          key: "nav.settings",
          icon: Settings,
          color: "text-foreground bg-muted border border-border/80",
        },
        {
          to: "/feedback",
          key: "feedback.navReport",
          icon: MessageSquareWarning,
          color: "text-primary bg-primary/10 border border-primary/20",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {prefs.discreet ? t("app.discreetName") : t("app.name")}
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("more.title")}
        </h1>
      </div>

      <div className="space-y-6">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              {sec.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sec.items.map(({ to, key, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex min-h-[60px] items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-bloom-subtle transition-all hover:bg-muted/40 hover:border-primary/40 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
                    >
                      <Icon aria-hidden className="h-5 w-5" />
                    </span>
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {t(key)}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform rtl-mirror shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
