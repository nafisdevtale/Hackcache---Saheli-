import { createFileRoute } from "@tanstack/react-router";
import Feedback from "@/pages/Feedback.jsx";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Saheli · Report a Problem & Feedback" },
      {
        name: "description",
        content:
          "Report bugs, crashes, calculation issues, or submit feedback with strict local-first privacy protection.",
      },
    ],
  }),
  component: Feedback,
});
