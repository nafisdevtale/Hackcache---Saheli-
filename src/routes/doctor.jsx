import { createFileRoute } from "@tanstack/react-router";
import DoctorGuidance from "@/pages/DoctorGuidance.jsx";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Saheli · When to see a doctor" },
      {
        name: "description",
        content: "Clear, sourced guidance on period signs that are worth a doctor's check-up.",
      },
      { property: "og:title", content: "Saheli · When to see a doctor" },
      {
        property: "og:description",
        content: "Clear, sourced guidance on period signs that are worth a doctor's check-up.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DoctorGuidance,
});
