import { createFileRoute } from "@tanstack/react-router";
import Community from "@/pages/Community.jsx";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Saheli · Safe Community" },
      {
        name: "description",
        content: "A safe, pseudonymous peer-support space for menstrual health in India.",
      },
      { property: "og:title", content: "Saheli · Safe Community" },
      {
        property: "og:description",
        content: "A safe, pseudonymous peer-support space for menstrual health in India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Community,
});
