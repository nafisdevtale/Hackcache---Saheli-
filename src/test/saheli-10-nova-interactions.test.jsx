// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import Companion from "../pages/Companion.jsx";
import Calendar from "../pages/Calendar.jsx";
import LogDay from "../pages/LogDay.jsx";
import Diva from "../pages/Diva.jsx";
import {
  NovaDialog,
  NovaButton,
  NovaCard,
  NovaBadge,
  NovaHeading,
} from "../components/nova/index.js";
import { PET_SPECIES } from "../content/pets.js";
import { translate } from "../i18n/index.js";
import { loadCompanionState, adoptPet } from "../lib/companionStorage.js";

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

const mockAppState = {
  lang: "en",
  t: (key, vars) => translate(mockAppState.lang, key, vars),
  prefs: { lang: "en" },
  fmt: (d) => String(d),
  record: {
    days: {},
    settings: { trackedSymptoms: ["cramps", "headache", "bloating", "fatigue"] },
  },
  update: vi.fn(),
  updateDay: vi.fn(),
  saveDay: vi.fn(async () => {}),
  deleteDay: vi.fn(async () => {}),
  saveOvulationObservation: vi.fn(async () => {}),
  deleteOvulationObservation: vi.fn(async () => {}),
  analysis: {
    cycleStats: { avgLength: 28, cycleStd: 1.2 },
    predictions: { nextPeriodDate: "2026-11-15" },
    fertilitySuppressed: false,
  },
  today: "2026-10-24",
};

vi.mock("@/App.jsx", () => ({
  useApp: () => ({
    t: (key, vars) => translate(mockAppState.lang, key, vars),
    prefs: mockAppState.prefs,
    fmt: mockAppState.fmt,
    record: mockAppState.record,
    update: mockAppState.update,
    updateDay: mockAppState.updateDay,
    saveDay: mockAppState.saveDay,
    deleteDay: mockAppState.deleteDay,
    saveOvulationObservation: mockAppState.saveOvulationObservation,
    deleteOvulationObservation: mockAppState.deleteOvulationObservation,
    analysis: mockAppState.analysis,
    today: mockAppState.today,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useSearch: () => ({ date: "2026-10-24" }),
}));

vi.mock("@/lib/divaOrchestrator.js", () => ({
  executeDivaRequest: vi.fn(async ({ query, manualAgent }) => ({
    status: "success",
    success: true,
    agentsInvoked: [manualAgent === "auto" ? "eeve" : manualAgent],
    route: { intent: "health_inquiry", agents: [manualAgent === "auto" ? "eeve" : manualAgent] },
    specialistResults: {
      [manualAgent === "auto" ? "eeve" : manualAgent]: {
        agentId: manualAgent === "auto" ? "eeve" : manualAgent,
        status: "success",
        success: true,
        text: `Mocked response for query: ${query}`,
        sources: ["Saheli Verified Sources"],
        cards: [],
      },
    },
  })),
}));

describe("Saheli 10.0 — Project Nova User Interaction Regression Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAppState.lang = "en";
    mockAppState.prefs = { lang: "en" };
    mockAppState.update.mockClear();
    mockAppState.updateDay.mockClear();
    mockAppState.saveDay.mockClear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("1. Nova Dialog Primitives & Accessibility", () => {
    it("renders modal dialog when open and traps or closes on escape key", () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <NovaDialog isOpen={true} onClose={handleClose} title="Test Nova Dialog">
          <p>Dialog Body Content</p>
        </NovaDialog>,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Nova Dialog")).toBeInTheDocument();
      expect(screen.getByText("Dialog Body Content")).toBeInTheDocument();

      // Escape key triggers onClose
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Re-rendering with isOpen=false removes dialog from DOM
      rerender(
        <NovaDialog isOpen={false} onClose={handleClose} title="Test Nova Dialog">
          <p>Dialog Body Content</p>
        </NovaDialog>,
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("2. Companion Sanctuary Care Flow", () => {
    it("executes care activity clicks and increments interaction counter", () => {
      adoptPet("cat", "Mimi", "meadow", "none");

      render(<Companion />);

      // Find care button for Offer Treat
      const feedBtn = screen.getByText("Offer Treat");
      expect(feedBtn).toBeInTheDocument();

      fireEvent.click(feedBtn.closest("button"));

      // State is updated in storage
      const state = loadCompanionState();
      expect(state.interactionsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Diva Specialist Routing", () => {
    it("allows user to toggle specialist tabs and submit inquiries", async () => {
      render(<Diva />);

      const flashBtn = screen.getByRole("button", { name: /FLASH \(Essentials\)/i });
      fireEvent.click(flashBtn);

      const input = screen.getByPlaceholderText(/Ask about your cycle, finding essentials/i);
      const sendBtn = screen.getByRole("button", { name: /Ask/i });

      fireEvent.change(input, { target: { value: "Organic bamboo pads" } });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/Organic bamboo pads/i)).toBeInTheDocument();
      });
    });
  });

  describe("4. Log Day Flow Form Interaction", () => {
    it("renders Nova styled logging sections and handles flow selection and save", async () => {
      render(<LogDay />);

      // Verify date header
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

      // Toggle period switch to reveal flow choices
      const periodSwitch = screen.getByRole("switch");
      expect(periodSwitch).toBeInTheDocument();
      fireEvent.click(periodSwitch);

      // Find flow options (e.g. Medium flow chip)
      const mediumFlowBtn = await screen.findByRole("button", { name: /Medium/i });
      expect(mediumFlowBtn).toBeInTheDocument();
      fireEvent.click(mediumFlowBtn);

      // Save day record
      const saveBtn = screen.getByRole("button", { name: /^Save$/i });
      fireEvent.click(saveBtn);

      expect(mockAppState.saveDay).toHaveBeenCalledWith(
        expect.objectContaining({ flow: "medium", period: true }),
      );
    });
  });
});
