import { createFileRoute } from "@tanstack/react-router";
import Insights from "@/pages/Insights.jsx";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Saheli · Insights" },
      {
        name: "description",
        content: "Cycle history, charts and symptom patterns from your own records.",
      },
      { property: "og:title", content: "Saheli · Insights" },
      {
        property: "og:description",
        content: "Cycle history, charts and symptom patterns from your own records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Insights,
});
