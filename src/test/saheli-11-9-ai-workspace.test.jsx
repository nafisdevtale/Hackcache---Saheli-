// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiWorkspace, DEFAULT_SPECIALISTS_ORDER } from "../components/diva/AiWorkspace.jsx";
import en from "../i18n/en.js";

let storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => {
    storage[k] = String(v);
  },
  removeItem: (k) => {
    delete storage[k];
  },
  clear: () => {
    storage = {};
  },
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage, writable: true });

describe("Saheli 11.9 — Draggable & Customizable AI Workspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const mockT = (key) => en[key] || key;

  it("renders workspace header, all 3 specialist cards, and default controls", () => {
    render(<AiWorkspace t={mockT} />);

    expect(screen.getByTestId("saheli-ai-workspace")).toBeDefined();
    expect(screen.getByText("Saheli AI Workspace")).toBeDefined();

    for (const id of DEFAULT_SPECIALISTS_ORDER) {
      expect(screen.getByTestId(`workspace-card-${id}`)).toBeDefined();
    }

    expect(screen.getByRole("button", { name: /Default Layout/i })).toBeDefined();
  });

  it("reorders specialist cards using accessible keyboard controls (Move Up / Down)", () => {
    render(<AiWorkspace t={mockT} />);

    // In default order: index 0 is Eeve, index 1 is FLASH, index 2 is INSTINCT
    const moveDownEeve = screen.getByRole("button", { name: /Move down: Eeve/i });
    expect(moveDownEeve).toBeDefined();

    // Click move down on Eeve -> order becomes [flash, eeve, instinct]
    fireEvent.click(moveDownEeve);

    const cardsAfter = screen.getAllByRole("listitem");
    expect(cardsAfter[0].getAttribute("data-testid")).toBe("workspace-card-flash");
    expect(cardsAfter[1].getAttribute("data-testid")).toBe("workspace-card-eeve");
    expect(cardsAfter[2].getAttribute("data-testid")).toBe("workspace-card-instinct");

    // Persisted to localStorage
    const saved = JSON.parse(localStorage.getItem("saheli.ai_workspace_order"));
    expect(saved).toEqual(["flash", "eeve", "instinct"]);
  });

  it("resets to default layout when Default Layout button is clicked", () => {
    localStorage.setItem(
      "saheli.ai_workspace_order",
      JSON.stringify(["instinct", "flash", "eeve"]),
    );

    render(<AiWorkspace t={mockT} />);

    // Initially in custom order
    let cards = screen.getAllByRole("listitem");
    expect(cards[0].getAttribute("data-testid")).toBe("workspace-card-instinct");

    // Click Default Layout
    const resetBtn = screen.getByRole("button", { name: /Default Layout/i });
    fireEvent.click(resetBtn);

    cards = screen.getAllByRole("listitem");
    expect(cards[0].getAttribute("data-testid")).toBe("workspace-card-eeve");
    expect(cards[1].getAttribute("data-testid")).toBe("workspace-card-flash");
    expect(cards[2].getAttribute("data-testid")).toBe("workspace-card-instinct");
  });

  it("supports HTML5 drag and drop to reorder specialist cards", () => {
    render(<AiWorkspace t={mockT} />);

    const eeveCard = screen.getByTestId("workspace-card-eeve");
    const instinctCard = screen.getByTestId("workspace-card-instinct");

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("eeve"),
    };

    fireEvent.dragStart(eeveCard, { dataTransfer });
    fireEvent.dragOver(instinctCard);
    fireEvent.drop(instinctCard, { dataTransfer });

    const cards = screen.getAllByRole("listitem");
    // Eeve moved to index of instinct
    expect(cards[cards.length - 1].getAttribute("data-testid")).toBe("workspace-card-eeve");
  });
});
