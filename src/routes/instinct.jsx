import { createFileRoute } from "@tanstack/react-router";
import Instinct from "@/pages/Instinct.jsx";

function InstinctErrorComponent({ reset }) {
  return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-card rounded-3xl border border-border/80 shadow-sm">
      <h2 className="text-lg font-bold text-foreground">INSTINCT AI Discovery</h2>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Unable to initialize entertainment discovery right now. Your preferences and saved titles
        remain safe on your device.
      </p>
      <div className="flex justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/90 transition-all cursor-pointer"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-4 py-2 bg-muted text-foreground font-bold rounded-xl text-xs hover:bg-muted/80 transition-all"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}

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
  errorComponent: InstinctErrorComponent,
});
