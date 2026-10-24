/**
 * Saheli 8.0 — DIVA UI & Component Interactive Acceptance Tests
 *
 * Requirements:
 * - Vitest runner with @testing-library/react (NEVER bun:test)
 * - Header, title, tagline & specialist legend
 * - Specialist selector controls (Auto, Eeve, FLASH, INSTINCT)
 * - Chat input, send button, suggested prompt chips
 * - Result cards rendering (Product cards, Media cards, Helpline cards)
 * - Reset / Clear Conversation button
 * - Privacy Firewall Modal (open/close)
 * - Clarification option buttons
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Diva from "../pages/Diva.jsx";
import en from "../i18n/en.js";

// Mock App context
vi.mock("@/App.jsx", () => ({
  useApp: () => ({
    t: (key, fallback) => en[key] || fallback || key,
    prefs: { lang: "en" },
  }),
}));

// Mock executeDivaRequest
vi.mock("@/lib/divaOrchestrator.js", () => ({
  executeDivaRequest: vi.fn(async ({ query, manualAgent }) => {
    if (query.includes("cramps and pad")) {
      return {
        status: "success",
        success: true,
        agentsInvoked: ["eeve", "flash"],
        route: { intent: "multi_agent", agents: ["eeve", "flash"] },
        specialistResults: {
          eeve: {
            agentId: "eeve",
            status: "success",
            success: true,
            text: "Cramps are common due to prostaglandins during menstruation.",
            sources: ["NHS Clinical Guidelines"],
            cards: [],
          },
          flash: {
            agentId: "flash",
            status: "success",
            success: true,
            text: "FLASH found verified comfort pads.",
            sources: ["FLASH Verified Registry"],
            cards: [
              {
                type: "product_card",
                id: "prod-1",
                name: "Carmesi Eco-Pads",
                brand: "Carmesi",
                category: "disposable_pads",
                price: 299,
                unitCost: "₹29.90 / pad",
                unit: "pad",
                rating: 4.8,
                tags: ["biodegradable", "rash-free"],
              },
            ],
          },
        },
      };
    }

    if (query.includes("movie")) {
      return {
        status: "success",
        success: true,
        agentsInvoked: ["instinct"],
        route: { intent: "entertainment", agents: ["instinct"] },
        specialistResults: {
          instinct: {
            agentId: "instinct",
            status: "success",
            success: true,
            text: "INSTINCT recommends this feel-good title.",
            sources: ["TMDB Verified Registry"],
            cards: [
              {
                type: "media_card",
                id: "media-1",
                title: "Crash Landing on You",
                releaseYear: 2019,
                mediaType: "tv_series",
                posterUrl: "https://example.com/poster.jpg",
                rating: 8.7,
                genres: ["Romance", "Comedy"],
                streamingServices: ["Netflix"],
              },
            ],
          },
        },
      };
    }

    if (query === "ambiguous query") {
      return {
        status: "clarification",
        success: true,
        route: { intent: "clarification", agents: [] },
        clarificationPrompt:
          "Would you like advice from Eeve (Health), FLASH (Essentials), or INSTINCT (Entertainment)?",
        options: [
          { id: "eeve", label: "Health Guidance (Eeve)" },
          { id: "flash", label: "Find Products (FLASH)" },
          { id: "instinct", label: "Entertainment & Vibe (INSTINCT)" },
        ],
      };
    }

    // Default mock response
    return {
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
    };
  }),
}));

describe("Saheli 8.0 — DIVA Interactive UI Acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders coordinator header, tagline, and all three specialists in the legend", () => {
    render(<Diva />);

    expect(screen.getByText("Diva — Your Saheli AI Coordinator")).toBeDefined();
    expect(screen.getByText("One conversation. Three specialists.")).toBeDefined();

    // Specialist legend
    expect(screen.getByText("Eeve")).toBeDefined();
    expect(screen.getByText("FLASH")).toBeDefined();
    expect(screen.getByText("INSTINCT")).toBeDefined();
  });

  it("switches routing mode selector tabs between Auto, Eeve, FLASH, and INSTINCT", () => {
    render(<Diva />);

    const autoBtn = screen.getByRole("button", { name: /Auto/i });
    const eeveBtn = screen.getByRole("button", { name: /Eeve \(Health\)/i });
    const flashBtn = screen.getByRole("button", { name: /FLASH \(Essentials\)/i });
    const instinctBtn = screen.getByRole("button", { name: /INSTINCT \(Entertainment\)/i });

    expect(autoBtn).toBeDefined();
    expect(eeveBtn).toBeDefined();
    expect(flashBtn).toBeDefined();
    expect(instinctBtn).toBeDefined();

    // Click Eeve
    fireEvent.click(eeveBtn);
    expect(eeveBtn.className).toContain("bg-foreground text-background");

    // Click FLASH
    fireEvent.click(flashBtn);
    expect(flashBtn.className).toContain("bg-foreground text-background");
  });

  it("submits user question and renders dual-agent specialist response cards", async () => {
    render(<Diva />);

    const input = screen.getByPlaceholderText(/Ask about your cycle, finding essentials/i);
    const sendBtn = screen.getByRole("button", { name: /Ask/i });

    fireEvent.change(input, { target: { value: "Tell me about cramps and pads" } });
    fireEvent.click(sendBtn);

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/Cramps are common due to prostaglandins/i)).toBeDefined();
      expect(screen.getByText(/FLASH found verified comfort pads/i)).toBeDefined();
      expect(screen.getByText("Carmesi Eco-Pads")).toBeDefined();
      expect(screen.getByText("₹299")).toBeDefined();
    });
  });

  it("renders entertainment response cards with streaming services and rating", async () => {
    render(<Diva />);

    const input = screen.getByPlaceholderText(/Ask about your cycle, finding essentials/i);
    const sendBtn = screen.getByRole("button", { name: /Ask/i });

    fireEvent.change(input, { target: { value: "suggest a romance movie" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Crash Landing on You/i)).toBeDefined();
      expect(screen.getByText(/Netflix/i)).toBeDefined();
      expect(screen.getByText(/8.7/i)).toBeDefined();
    });
  });

  it("opens and closes the Privacy Firewall modal", async () => {
    render(<Diva />);

    const privacyBtn = screen.getByRole("button", { name: /Privacy Firewall/i });
    fireEvent.click(privacyBtn);

    expect(screen.getByText("Diva Privacy Firewall Guarantees")).toBeDefined();
    expect(screen.getByText(/No Unified Surveillance Profile/i)).toBeDefined();

    const understoodBtn = screen.getByRole("button", { name: /Understood/i });
    fireEvent.click(understoodBtn);

    await waitFor(() => {
      expect(screen.queryByText("Diva Privacy Firewall Guarantees")).toBeNull();
    });
  });

  it("renders Reset button and clears conversation on click", async () => {
    render(<Diva />);

    const input = screen.getByPlaceholderText(/Ask about your cycle, finding essentials/i);
    const sendBtn = screen.getByRole("button", { name: /Ask/i });

    fireEvent.change(input, { target: { value: "hello test" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mocked response for query: hello test/i)).toBeDefined();
    });

    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Mocked response for query: hello test/i)).toBeNull();
    });
  });

  it("renders clarification prompt buttons and dispatches selected specialist on click", async () => {
    render(<Diva />);

    const input = screen.getByPlaceholderText(/Ask about your cycle, finding essentials/i);
    const sendBtn = screen.getByRole("button", { name: /Ask/i });

    fireEvent.change(input, { target: { value: "ambiguous query" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Diva needs a quick clarification:")).toBeDefined();
      expect(screen.getByRole("button", { name: "Health Guidance (Eeve)" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Find Products (FLASH)" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Entertainment & Vibe (INSTINCT)" })).toBeDefined();
    });

    // Click an option button
    const flashOption = screen.getByRole("button", { name: "Find Products (FLASH)" });
    fireEvent.click(flashOption);

    await waitFor(() => {
      expect(
        screen.getByText(/Mocked response for query: I want advice from flash/i),
      ).toBeDefined();
    });
  });
});
