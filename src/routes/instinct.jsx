import { createFileRoute } from "@tanstack/react-router";
import Instinct from "@/pages/Instinct.jsx";

export const Route = createFileRoute("/instinct")({
  head: () => ({
    meta: [
      { title: "Saheli · INSTINCT AI Discovery" },
      {
        name: "description",
        content:
          "INSTINCT: Your Taste. Your Vibe. Your Next Favourite. Discover verified movies, TV shows, K-dramas, and music with privacy-first personalization.",
      },
    ],
  }),
  component: Instinct,
});
