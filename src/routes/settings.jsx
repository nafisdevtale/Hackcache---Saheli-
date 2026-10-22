import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings.jsx";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Saheli · Settings" },
      {
        name: "description",
        content: "Language, text size, PIN lock, discreet mode, export and deletion.",
      },
      { property: "og:title", content: "Saheli · Settings" },
      {
        property: "og:description",
        content: "Language, text size, PIN lock, discreet mode, export and deletion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});
