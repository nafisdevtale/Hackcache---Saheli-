import { createFileRoute } from "@tanstack/react-router";
import Calendar from "@/pages/Calendar.jsx";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Saheli · Calendar" },
      {
        name: "description",
        content: "Month view of logged periods, estimated periods and symptoms.",
      },
      { property: "og:title", content: "Saheli · Calendar" },
      {
        property: "og:description",
        content: "Month view of logged periods, estimated periods and symptoms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calendar,
});
