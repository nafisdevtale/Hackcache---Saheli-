import { createFileRoute } from "@tanstack/react-router";
import { PartnerConnectPage } from "@/pages/PartnerConnect.jsx";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Saheli · Partner Connect" },
      {
        name: "description",
        content: "End-to-end encrypted companion view for trusted partners.",
      },
      { property: "og:title", content: "Saheli · Partner Connect" },
      {
        property: "og:description",
        content: "End-to-end encrypted companion view for trusted partners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerConnectPage,
});
