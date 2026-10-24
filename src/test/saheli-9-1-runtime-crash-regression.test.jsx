// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Today from "@/pages/Today.jsx";
import { phaseKey, analyze, getAuthoritativeCycleState } from "@/lib/cycle.js";
import { translate } from "@/i18n/index.js";
import { buildDemo } from "@/data/demo.js";

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock companionStorage
vi.mock("@/lib/companionStorage.js", () => ({
  loadCompanionState: vi.fn(() => ({
    isAdopted: true,
    name: "Mimi",
    speciesId: "cat",
    growthStage: 2,
    accessory: "bell",
    currentMood: "happy",
  })),
}));

let currentMockApp = null;
vi.mock("@/App.jsx", () => ({
  useApp: () => currentMockApp,
}));

describe("SAHELI 9.1 — Runtime Crash Repair & Today Dashboard Regression Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. phaseKey Unit Defensiveness", () => {
    it("handles undefined gracefully without throwing TypeError: Cannot read properties of undefined (reading 'lastStart')", () => {
      expect(() => phaseKey(undefined)).not.toThrow();
      expect(phaseKey(undefined)).toBe("phase.unknown");
    });

    it("handles null gracefully", () => {
      expect(() => phaseKey(null)).not.toThrow();
      expect(phaseKey(null)).toBe("phase.unknown");
    });

    it("handles an empty object without lastStart gracefully", () => {
      expect(() => phaseKey({})).not.toThrow();
      expect(phaseKey({})).toBe("phase.unknown");
    });

    it("returns correct phase strings for valid analysis states", () => {
      const mockAnalysis = {
        lastStart: "2026-10-01",
        inPeriod: true,
        status: "predicted",
      };
      expect(phaseKey(mockAnalysis)).toBe("phase.period");
    });
  });

  describe("2. Today Dashboard Rendering with Active Cycle Records (Demo & Real)", () => {
    it("renders successfully with demo cycle records and never enters the error boundary", () => {
      const today = "2026-10-24";
      const record = buildDemo(today);
      const analysis = analyze(record.days, { today });
      const cycleState = getAuthoritativeCycleState(record, today);

      currentMockApp = {
        t: (k, vars) => translate("en", k, vars),
        L: (str) => str,
        fmt: (d) => String(d),
        fmtRange: (s, e) => `${s} – ${e}`,
        analysis,
        cycleState,
        safety: { urgent: [], cards: [] },
        record,
        today,
        fertilityVisible: true,
        update: vi.fn(),
        tryDemo: vi.fn(),
      };

      // Render Today with mockApp
      const { container } = render(<Today />);

      // Ensure error boundary message is NOT present
      expect(screen.queryByText(/This page didn't load/i)).toBeNull();
      expect(screen.queryByText(/Your saved records have not been changed/i)).toBeNull();

      // Ensure primary Today dashboard elements render
      expect(screen.getByText(/Today's Logged Summary/i)).toBeDefined();
      expect(container.querySelector("h1")).not.toBeNull();
    });

    it("renders successfully with an empty profile (zero cycle records)", () => {
      currentMockApp = {
        t: (k, vars) => translate("en", k, vars),
        L: (str) => str,
        fmt: (d) => String(d),
        fmtRange: (s, e) => `${s} – ${e}`,
        analysis: { status: "insufficient", currentCycleDay: null, cycles: [], periods: [] },
        cycleState: null,
        safety: { urgent: [], cards: [] },
        record: { days: {}, settings: {} },
        today: "2026-10-24",
        fertilityVisible: true,
        update: vi.fn(),
        tryDemo: vi.fn(),
      };

      render(<Today />);

      // Must render clean welcome state, not error boundary
      expect(screen.queryByText(/This page didn't load/i)).toBeNull();
      expect(screen.getByText(/Welcome to your diary/i)).toBeDefined();
    });

    it("renders successfully when the user is currently on their period", () => {
      const daysWithPeriod = {
        "2026-10-24": { period: true, flow: "medium", pain: 2 },
      };
      const record = { days: daysWithPeriod, settings: {} };
      const today = "2026-10-24";
      const analysis = {
        status: "predicted",
        currentCycleDay: 1,
        lastStart: "2026-10-24",
        inPeriod: true,
        periods: [{ start: "2026-10-24", end: "2026-10-28", length: 5 }],
        cycles: [{ start: "2026-09-24", end: "2026-10-23", length: 30 }],
        prediction: { start: "2026-11-23", end: "2026-11-26", basedOn: 1 },
      };
      const cycleState = getAuthoritativeCycleState(record, today);

      currentMockApp = {
        t: (k, vars) => translate("en", k, vars),
        L: (str) => str,
        fmt: (d) => String(d),
        fmtRange: (s, e) => `${s} – ${e}`,
        analysis,
        cycleState,
        safety: { urgent: [], cards: [] },
        record,
        today,
        fertilityVisible: true,
        update: vi.fn(),
        tryDemo: vi.fn(),
      };

      render(<Today />);

      expect(screen.queryByText(/This page didn't load/i)).toBeNull();
      expect(screen.getAllByText(/Day 1 of your cycle/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
