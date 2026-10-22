import { createFileRoute } from "@tanstack/react-router";
import LogDay from "@/pages/LogDay.jsx";

export const Route = createFileRoute("/log")({
  validateSearch: (s) => ({ date: typeof s.date === "string" ? s.date : undefined }),
  head: () => ({
    meta: [
      { title: "Saheli · Log a day" },
      { name: "description", content: "Record flow, pain, symptoms, mood, sleep and medicines privately on your device." },
      { property: "og:title", content: "Saheli · Log a day" },
      { property: "og:description", content: "Record flow, pain, symptoms, mood, sleep and medicines privately on your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogDay,
});
