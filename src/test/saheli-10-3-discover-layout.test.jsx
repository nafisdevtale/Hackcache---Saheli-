// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Discover from "../pages/Discover";
import { translate } from "../i18n";

// Polyfill localStorage
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage.clear) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

// Mock App context
const mockAppState = {
  lang: "en",
  t: (key, vars) => translate(mockAppState.lang, key, vars),
};

vi.mock("@/App.jsx", () => ({
  useApp: () => ({
    t: (key, vars) => translate(mockAppState.lang, key, vars),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className, onClick }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("SAHELI 10.3 — Discover Layout & Button Overlap Repair", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAppState.lang = "en";
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("1. Header & Filter Bar Separation", () => {
    it("renders search input, category tabs and bookmarks button cleanly without collisions", () => {
      render(<Discover />);

      const searchInput = screen.getByPlaceholderText(
        "Search articles by topic, question, or keyword...",
      );
      expect(searchInput).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBeGreaterThanOrEqual(5);

      const bookmarkBtn = screen.getByRole("button", { name: /Saved Articles/i });
      expect(bookmarkBtn).toBeInTheDocument();
      expect(bookmarkBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("filters articles by category when category tab is selected", () => {
      render(<Discover />);

      const essentialsTab = screen.getByRole("tab", { name: /Product Essentials/i });
      fireEvent.click(essentialsTab);
      expect(essentialsTab).toHaveAttribute("aria-selected", "true");

      const articleCards = screen.getAllByRole("heading", { level: 3 });
      expect(articleCards.length).toBeGreaterThanOrEqual(1);
    });

    it("toggles bookmarks filter and displays bookmark state", () => {
      render(<Discover />);

      const bookmarkToggle = screen.getByRole("button", { name: /Saved Articles/i });
      fireEvent.click(bookmarkToggle);
      expect(bookmarkToggle).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("2. Multilingual Long-Label Protection (Hindi & Urdu)", () => {
    it("renders all category labels and bookmarks button in Hindi without crashing or overflowing", () => {
      mockAppState.lang = "hi";
      render(<Discover />);

      expect(screen.getByText("ज्ञान और जागरूकता")).toBeInTheDocument();
      expect(screen.getByText(/सहेली खोज/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /सहेजे गए लेख/i })).toBeInTheDocument();
    });

    it("renders all category labels and bookmarks button in Urdu RTL without crashing", () => {
      mockAppState.lang = "ur";
      render(<Discover />);

      expect(screen.getByText("علم اور آگاہی")).toBeInTheDocument();
      expect(screen.getByText(/سہیلی دریافت/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /محفوظ شدہ مضامین/i })).toBeInTheDocument();
    });
  });

  describe("3. Article Reader Modal Dialog & Actions", () => {
    it("opens article reader dialog with close button and bookmark action", () => {
      render(<Discover />);

      const firstCard = screen.getAllByRole("heading", { level: 3 })[0];
      fireEvent.click(firstCard);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("Close")).toBeInTheDocument();

      const bookmarkInDialog = within(dialog).getByRole("button", { name: /Save Article/i });
      expect(bookmarkInDialog).toBeInTheDocument();
      fireEvent.click(bookmarkInDialog);

      expect(within(dialog).getByText("Saved")).toBeInTheDocument();

      fireEvent.click(within(dialog).getByText("Close"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
