import { createFileRoute } from "@tanstack/react-router";
import Discover from "@/pages/Discover.jsx";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Saheli · Discover Articles & Awareness" },
      {
        name: "description",
        content:
          "Evidence-based menstrual health articles, hygiene education, self-care routines, and emergency supplies guidance.",
      },
    ],
  }),
  component: Discover,
});
