// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { translate } from "../i18n/index.js";

// Page imports
import Today from "../pages/Today.jsx";
import Ask from "../pages/Ask.jsx";
import Calendar from "../pages/Calendar.jsx";
import Community from "../pages/Community.jsx";
import Companion from "../pages/Companion.jsx";
import Discover from "../pages/Discover.jsx";
import Diva from "../pages/Diva.jsx";
import DoctorGuidance from "../pages/DoctorGuidance.jsx";
import Feedback from "../pages/Feedback.jsx";
import FlashEssentials from "../pages/FlashEssentials.jsx";
import Insights from "../pages/Insights.jsx";
import Instinct from "../pages/Instinct.jsx";
import Learn from "../pages/Learn.jsx";
import LogDay from "../pages/LogDay.jsx";
import More from "../pages/More.jsx";
import Pregnancy from "../pages/Pregnancy.jsx";
import Reminders from "../pages/Reminders.jsx";
import SelfCare from "../pages/SelfCare.jsx";
import Settings from "../pages/Settings.jsx";
import VisitSummary from "../pages/VisitSummary.jsx";

// Polyfill localStorage if needed
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
  prefs: { lang: "en", discreet: false, readAloud: false, textSize: "md", theme: "system" },
  setPrefs: vi.fn(),
  t: (key, vars) => translate("en", key, vars),
  L: (o) => (o ? o.en || o.hi || "" : ""),
  fmt: (d) => String(d),
  fmtRange: (a, b) => `${a} – ${b}`,
  isOnline: true,
  isDemo: false,
  banners: [],
  dismissBanner: vi.fn(),
  today: "2026-10-25",
  analysis: {
    status: "ok",
    currentCycleDay: 14,
    cycles: [{}],
    prediction: { start: "2026-11-10", end: "2026-11-15", basedOn: 3, halfWidth: 2 },
    fertility: { fertile: { start: "2026-10-20", end: "2026-10-26" } },
  },
  cycleState: {
    activePhase: "follicular",
    dayOfCycle: 14,
    phase: "ovulatory",
    nextPeriodDays: 14,
    cycleLength: 28,
    periodLength: 5,
    phaseProgress: 50,
    regularity: "regular",
    variabilityDays: 1,
    ovulationObservationStatus: { hasObservations: false, currentCycleObservations: [] },
  },
  safety: { urgent: [], cards: [] },
  record: {
    days: {
      "2026-10-25": { period: false, pain: 0, symptoms: [] },
    },
    settings: {},
  },
  fertilityVisible: true,
  ovulationObservationStatus: { hasObservations: false, observations: [] },
  update: vi.fn(),
  tryDemo: vi.fn(),
  todayObservation: null,
};

vi.mock("@/App.jsx", () => ({
  useApp: () => mockAppContext,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: () => ({ location: { pathname: "/" } }),
  useRouter: () => ({
    navigate: vi.fn(),
    invalidate: vi.fn(),
    state: { location: { pathname: "/" } },
  }),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useParams: () => ({}),
}));

const routes = [
  { name: "Today (/)", Component: Today },
  { name: "Ask (/ask)", Component: Ask },
  { name: "Calendar (/calendar)", Component: Calendar },
  { name: "Community (/community)", Component: Community },
  { name: "Companion (/companion)", Component: Companion },
  { name: "Discover (/discover)", Component: Discover },
  { name: "Diva (/diva)", Component: Diva },
  { name: "DoctorGuidance (/doctor)", Component: DoctorGuidance },
  { name: "Feedback (/feedback)", Component: Feedback },
  { name: "FlashEssentials (/flash)", Component: FlashEssentials },
  { name: "Insights (/insights)", Component: Insights },
  { name: "Instinct (/instinct)", Component: Instinct },
  { name: "Learn (/learn)", Component: Learn },
  { name: "LogDay (/log)", Component: LogDay },
  { name: "More (/more)", Component: More },
  { name: "Pregnancy (/pregnancy)", Component: Pregnancy },
  { name: "Reminders (/reminders)", Component: Reminders },
  { name: "SelfCare (/selfcare)", Component: SelfCare },
  { name: "Settings (/settings)", Component: Settings },
  { name: "VisitSummary (/visit)", Component: VisitSummary },
];

describe("Saheli 10.2 — Complete Navigation & Route Render Audit", () => {
  for (const { name, Component } of routes) {
    it(`renders page without crashing: ${name}`, () => {
      const { container } = render(<Component />);
      expect(container).toBeDefined();
      expect(container.firstChild).not.toBeNull();
      // Ensure no raw crash or error boundary text
      expect(container.textContent).not.toContain("This page didn't load");
    });
  }
});
