import { createFileRoute } from "@tanstack/react-router";
import More from "@/pages/More.jsx";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "Saheli · More" },
      { name: "description", content: "All Saheli sections." },
      { property: "og:title", content: "Saheli · More" },
      { property: "og:description", content: "All Saheli sections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: More,
});
