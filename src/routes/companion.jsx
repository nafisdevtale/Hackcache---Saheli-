import { createFileRoute } from "@tanstack/react-router";
import Companion from "@/pages/Companion.jsx";

export const Route = createFileRoute("/companion")({
  head: () => ({
    meta: [
      { title: "Saheli · My Saheli Companion" },
      {
        name: "description",
        content:
          "Choose and nurture your gentle, private virtual pet companion. No streak penalties, 100% on-device comfort.",
      },
    ],
  }),
  component: Companion,
});
