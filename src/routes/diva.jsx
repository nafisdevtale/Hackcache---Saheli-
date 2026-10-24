import { createFileRoute } from "@tanstack/react-router";
import Diva from "@/pages/Diva.jsx";

export const Route = createFileRoute("/diva")({
  head: () => ({
    meta: [
      { title: "Saheli · Diva (AI Coordinator)" },
      {
        name: "description",
        content:
          "Diva — Your Saheli AI Coordinator. One conversation connecting Eeve (Health), FLASH (Essentials), and INSTINCT (Entertainment).",
      },
      { property: "og:title", content: "Saheli · Diva (AI Coordinator)" },
      {
        property: "og:description",
        content:
          "One conversation connecting Eeve (Health), FLASH (Essentials), and INSTINCT (Entertainment).",
      },
    ],
  }),
  component: Diva,
});
