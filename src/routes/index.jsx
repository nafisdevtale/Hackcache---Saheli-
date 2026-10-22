import { createFileRoute } from "@tanstack/react-router";
import Today from "@/pages/Today.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saheli · Today" },
      {
        name: "description",
        content: "See your cycle day, next-period estimate and a private daily check-in.",
      },
      { property: "og:title", content: "Saheli · Today" },
      {
        property: "og:description",
        content: "See your cycle day, next-period estimate and a private daily check-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Today,
});
