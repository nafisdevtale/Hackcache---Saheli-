import { createFileRoute } from "@tanstack/react-router";
import Reminders from "@/pages/Reminders.jsx";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Saheli · Reminders" },
      { name: "description", content: "Optional, discreet check-in and medicine reminders." },
      { property: "og:title", content: "Saheli · Reminders" },
      { property: "og:description", content: "Optional, discreet check-in and medicine reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reminders,
});
