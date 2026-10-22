import { Link } from "@tanstack/react-router";
import { BarChart3, Stethoscope, MessageCircle, Bell, Baby, Settings } from "lucide-react";
import { useApp } from "@/App.jsx";
import { PageTitle } from "@/components/common/ui.jsx";

export default function More() {
  const { t, pregnancyVisible } = useApp();
  const items = [
    ["/insights", "nav.insights", BarChart3],
    ["/doctor", "nav.doctor", Stethoscope],
    ["/ask", "nav.ask", MessageCircle],
    ["/reminders", "nav.reminders", Bell],
    ...(pregnancyVisible ? [["/pregnancy", "nav.pregnancy", Baby]] : []),
    ["/settings", "nav.settings", Settings],
  ];
  return (
    <div>
      <PageTitle>{t("more.title")}</PageTitle>
      <ul className="space-y-2">
        {items.map(([to, k, Icon]) => (
          <li key={to}>
            <Link
              to={to}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card p-4 text-lg font-semibold hover:bg-muted"
            >
              <Icon aria-hidden className="h-6 w-6 text-primary" /> {t(k)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
