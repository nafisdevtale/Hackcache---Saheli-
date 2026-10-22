import { createFileRoute } from "@tanstack/react-router";
import Ask from "@/pages/Ask.jsx";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Saheli · Ask" },
      { name: "description", content: "Search 30+ trusted answers about periods in English and Hindi, offline." },
      { property: "og:title", content: "Saheli · Ask" },
      { property: "og:description", content: "Search 30+ trusted answers about periods in English and Hindi, offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ask,
});
