import { createFileRoute } from "@tanstack/react-router";
import SelfCare from "@/pages/SelfCare.jsx";

export const Route = createFileRoute("/selfcare")({
  head: () => ({
    meta: [
      { title: "Saheli · Self Care & Wellness Studio" },
      {
        name: "description",
        content:
          "Evidence-informed comfort routines, gentle movement, breathing exercises, and calming soundscapes.",
      },
      { property: "og:title", content: "Saheli · Self Care & Wellness Studio" },
      {
        property: "og:description",
        content:
          "Evidence-informed comfort routines, gentle movement, breathing exercises, and calming soundscapes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SelfCare,
});
