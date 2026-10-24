// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Shell } from "../components/layout/Shell.jsx";
import Today from "../pages/Today.jsx";
import { translate } from "../i18n/index.js";

// Polyfill localStorage if not present in jsdom
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage.clear) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const mockAppContext = {
  status: "ready",
  prefs: { lang: "en", discreet: false, readAloud: false },
  setPrefs: vi.fn(),
  t: (key, vars) => translate("en", key, vars),
  fmt: (d) => String(d),
  fmtRange: (a, b) => `${a} – ${b}`,
  isOnline: true,
  isDemo: false,
  banners: [],
  dismissBanner: vi.fn(),
  updateWaiting: false,
  applyUpdate: vi.fn(),
  dismissUpdate: vi.fn(),
  today: "2026-10-24",
  analysis: {
    status: "ok",
    currentCycleDay: 14,
    cycles: [{}],
    prediction: { start: "2026-11-10", end: "2026-11-15", basedOn: 3, halfWidth: 2 },
    fertility: { fertile: { start: "2026-10-20", end: "2026-10-26" } },
  },
  cycleState: {
    activePhase: "follicular",
    ovulationObservationStatus: { hasObservations: false, currentCycleObservations: [] },
  },
  safety: { urgent: [], cards: [] },
  record: {
    days: {
      "2026-10-24": { period: false, pain: 0, symptoms: [] },
    },
    settings: {},
  },
  fertilityVisible: true,
  ovulationObservationStatus: { hasObservations: false, observations: [] },
  update: vi.fn(),
  tryDemo: vi.fn(),
};

vi.mock("@/App.jsx", () => ({
  useApp: () => mockAppContext,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, activeOptions, activeProps, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: () => ({ location: { pathname: "/" } }),
}));

describe("Saheli 10.0 Nova Shell & Today Dashboard Mounting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mounts NovaShell and its navigation subcomponents in Shell", () => {
    render(
      <Shell>
        <div data-testid="child-content">Main Child Content</div>
      </Shell>,
    );

    // Verify NovaShell wrapper is in DOM
    const novaShell = screen.getByTestId("nova-shell");
    expect(novaShell).toBeInTheDocument();

    // Verify Nova navigation components are rendered
    expect(screen.getByTestId("nova-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("nova-tablet-nav")).toBeInTheDocument();
    expect(screen.getByTestId("nova-mobile-dock")).toBeInTheDocument();

    // Verify routed child is mounted
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("mounts the redesigned Today dashboard with NovaHeroCard and primary actions", () => {
    render(<Today />);

    // Verify Nova Today dashboard container
    const todayDashboard = screen.getByTestId("nova-today-dashboard");
    expect(todayDashboard).toBeInTheDocument();

    // Verify Today title rendered with NovaHeading
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      translate("en", "today.title"),
    );

    // Verify dominant Log Today CTA button is present
    const logButtons = screen.getAllByRole("button", {
      name: new RegExp(translate("en", "today.logToday"), "i"),
    });
    expect(logButtons.length).toBeGreaterThan(0);

    // Verify Cycle Day badge from NovaHeroCard is rendered
    expect(
      screen.getByText(new RegExp(translate("en", "today.cycleDay", { n: 14 }), "i")),
    ).toBeInTheDocument();
  });
});
