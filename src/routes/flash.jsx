import { createFileRoute } from "@tanstack/react-router";
import FlashEssentials from "@/pages/FlashEssentials.jsx";

export const Route = createFileRoute("/flash")({
  head: () => ({
    meta: [
      { title: "Saheli · FLASH Personal Essentials Advisor" },
      {
        name: "description",
        content:
          "Discover verified, affordable menstrual and self-care essentials, compare unit costs, and explore practical alternatives without commercial pressure.",
      },
    ],
  }),
  component: FlashEssentials,
});
