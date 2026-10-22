import { createFileRoute } from "@tanstack/react-router";
import Pregnancy from "@/pages/Pregnancy.jsx";

export const Route = createFileRoute("/pregnancy")({
  head: () => ({
    meta: [
      { title: "Saheli · Pregnancy mode" },
      { name: "description", content: "Estimated pregnancy week, due date, check-ups and warning signs." },
      { property: "og:title", content: "Saheli · Pregnancy mode" },
      { property: "og:description", content: "Estimated pregnancy week, due date, check-ups and warning signs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pregnancy,
});
