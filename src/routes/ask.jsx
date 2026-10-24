import { createFileRoute } from "@tanstack/react-router";
import Ask from "@/pages/Ask.jsx";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Saheli · Eeve (Health AI Companion)" },
      {
        name: "description",
        content:
          "Eeve: Your Health AI Companion. Supportive, private menstrual health education and verified medical guidance.",
      },
      { property: "og:title", content: "Saheli · Eeve (Health AI Companion)" },
      {
        property: "og:description",
        content:
          "Eeve: Your Health AI Companion. Supportive, private menstrual health education and verified medical guidance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ask,
});
