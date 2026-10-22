import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  const routes = [
    "/",
    "/calendar",
    "/log",
    "/insights",
    "/doctor",
    "/visit",
    "/learn",
    "/ask",
    "/reminders",
    "/pregnancy",
    "/settings",
    "/more",
  ];

  for (const path of routes) {
    it(`matches a registered route for ${path} instead of falling back to root/notFound`, () => {
      const matches = router.matchRoutes(path);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    });
  }
});
