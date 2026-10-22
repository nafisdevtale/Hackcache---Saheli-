import { createFileRoute } from "@tanstack/react-router";
import Learn from "@/pages/Learn.jsx";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Saheli · Learn" },
      {
        name: "description",
        content: "Short bilingual lessons on periods, PCOS, cramps, hygiene and your first period.",
      },
      { property: "og:title", content: "Saheli · Learn" },
      {
        property: "og:description",
        content: "Short bilingual lessons on periods, PCOS, cramps, hygiene and your first period.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Learn,
});
