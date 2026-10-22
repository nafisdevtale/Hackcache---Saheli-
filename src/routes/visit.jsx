import { createFileRoute } from "@tanstack/react-router";
import VisitSummary from "@/pages/VisitSummary.jsx";

export const Route = createFileRoute("/visit")({
  head: () => ({
    meta: [
      { title: "Saheli · Doctor visit summary" },
      {
        name: "description",
        content: "A printable one-page summary of your cycles and symptoms for your doctor.",
      },
      { property: "og:title", content: "Saheli · Doctor visit summary" },
      {
        property: "og:description",
        content: "A printable one-page summary of your cycles and symptoms for your doctor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VisitSummary,
});
