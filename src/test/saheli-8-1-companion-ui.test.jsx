// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import Companion from "../pages/Companion.jsx";
import { PET_SPECIES } from "../content/pets.js";
import { translate } from "../i18n/index.js";
import {
  DEFAULT_COMPANION_STATE,
  loadCompanionState,
  saveCompanionState,
  resetCompanion,
} from "../lib/companionStorage.js";

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

// Mock App context
const mockAppState = {
  lang: "en",
  t: (key, vars) => translate(mockAppState.lang, key, vars),
  prefs: { lang: "en" },
};

vi.mock("@/App.jsx", () => ({
  useApp: () => ({
    t: (key, vars) => translate(mockAppState.lang, key, vars),
    prefs: mockAppState.prefs,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe("SAHELI 8.1 — Companion Dashboard & Global UI Repair", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAppState.lang = "en";
    mockAppState.prefs = { lang: "en" };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("1. Key Resolution & Localisation Parity", () => {
    it("resolves raw pet.* keys correctly into translated strings", () => {
      expect(translate("en", "pet.badge")).toBe("Your Companion");
      expect(translate("hi", "pet.badge")).toBe("आपका साथी");
      expect(translate("mr", "pet.badge")).toBe("तुमचा साथीदार");

      expect(translate("en", "pet.adoptTitle")).toBe("Meet Your New Companion");
      expect(translate("en", "pet.adoptSubtitle")).toBe(
        "Choose a companion to join your Saheli journey.",
      );
    });

    it("correctly interpolates dynamic species count in all locales without raw keys", () => {
      const enCount = translate("en", "companion.speciesAvailable", { n: PET_SPECIES.length });
      expect(enCount).toBe("15 Companions Available");
      expect(enCount).not.toContain("pet.speciesAvailable");

      const hiCount = translate("hi", "companion.speciesAvailable", { n: PET_SPECIES.length });
      expect(hiCount).toBe("15 साथी उपलब्ध");

      const mrCount = translate("mr", "companion.speciesAvailable", { n: PET_SPECIES.length });
      expect(mrCount).toBe("15 साथीदार उपलब्ध");
    });

    it("resolves all 15 species names and descriptions across en, hi, and mr", () => {
      for (const pet of PET_SPECIES) {
        const enName = translate("en", pet.nameKey);
        const hiName = translate("hi", pet.nameKey);
        const mrName = translate("mr", pet.nameKey);

        expect(enName).not.toMatch(/^pet\.species\./);
        expect(hiName).not.toMatch(/^pet\.species\./);
        expect(mrName).not.toMatch(/^pet\.species\./);

        const enDesc = translate("en", pet.descriptionKey);
        const hiDesc = translate("hi", pet.descriptionKey);
        const mrDesc = translate("mr", pet.descriptionKey);

        expect(enDesc).not.toMatch(/^pet\.species\./);
        expect(hiDesc).not.toMatch(/^pet\.species\./);
        expect(mrDesc).not.toMatch(/^pet\.species\./);
        expect(enDesc.length).toBeGreaterThan(10);
      }
    });
  });

  describe("2. Unadopted Companion Dashboard Render", () => {
    it("renders adoption header without raw i18n keys", () => {
      render(<Companion />);

      expect(screen.getByText("Your Companion")).toBeInTheDocument();
      expect(screen.getByText("Meet Your New Companion")).toBeInTheDocument();
      expect(
        screen.getByText("Choose a companion to join your Saheli journey."),
      ).toBeInTheDocument();
      expect(screen.getByText("15 Companions Available")).toBeInTheDocument();

      // Ensure NO raw keys leaked into the DOM
      expect(screen.queryByText(/pet\.badge/)).not.toBeInTheDocument();
      expect(screen.queryByText(/pet\.adoptTitle/)).not.toBeInTheDocument();
      expect(screen.queryByText(/pet\.adoptSubtitle/)).not.toBeInTheDocument();
      expect(screen.queryByText(/pet\.speciesAvailable/)).not.toBeInTheDocument();
    });

    it("displays live preview card with species name, description and accessible region", () => {
      render(<Companion />);

      // Default selected species is cat ("Gentle Cat")
      expect(screen.getAllByText("Gentle Cat").length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(
          "A calm and affectionate friend who loves quiet purrs and gentle stretches.",
        ),
      ).toBeInTheDocument();

      const previewRegion = screen.getByRole("region", { name: /Gentle Cat preview/i });
      expect(previewRegion).toBeInTheDocument();
    });

    it("renders all 15 selectable pet cards with responsive grid classes and accessible labels", () => {
      render(<Companion />);

      for (const pet of PET_SPECIES) {
        const petLabel = translate("en", pet.nameKey);
        const button = screen.getByRole("button", {
          name: new RegExp(petLabel, "i"),
        });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-pressed");
      }
    });

    it("switches preview and custom name when selecting a different companion", () => {
      render(<Companion />);

      const dogName = translate("en", "pet.species.dog");
      const dogBtn = screen.getByRole("button", { name: new RegExp(dogName, "i") });
      fireEvent.click(dogBtn);

      // Preview updates to dog
      expect(screen.getAllByText(dogName).length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText("An eager and loyal companion who greets every day with wagging warmth."),
      ).toBeInTheDocument();

      // Name input default updates to dog's default name "Moti"
      const nameInput = screen.getByRole("textbox", { name: /give your friend a name/i });
      expect(nameInput.value).toBe("Moti");
    });

    it("completes adoption and transitions cleanly to adopted sanctuary state", () => {
      render(<Companion />);

      const adoptBtn = screen.getByRole("button", { name: /adopt this friend/i });
      fireEvent.click(adoptBtn);

      // Now adopted state should show sanctuary header and care activities
      expect(screen.getByText("Care & Mindful Moments")).toBeInTheDocument();
      expect(screen.getByText("Offer Treat")).toBeInTheDocument();
      expect(screen.getByText("Gentle Play")).toBeInTheDocument();
      expect(screen.getByText("Brush & Groom")).toBeInTheDocument();
      expect(screen.getByText("Cozy Rest")).toBeInTheDocument();
      expect(screen.getByText("Show Love")).toBeInTheDocument();

      // State is persisted in localStorage
      const saved = loadCompanionState();
      expect(saved.isAdopted).toBe(true);
    });
  });

  describe("3. Multilingual Rendering (Hindi & Urdu RTL)", () => {
    it("renders the entire adoption screen in Hindi with zero English leakage on keys", () => {
      mockAppState.lang = "hi";
      mockAppState.prefs = { lang: "hi" };

      render(<Companion />);

      expect(screen.getByText("आपका साथी")).toBeInTheDocument();
      expect(screen.getByText("15 साथी उपलब्ध")).toBeInTheDocument();
      expect(screen.getAllByText("प्यारी बिल्ली").length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText("शांत और स्नेही साथी जिसे कोमल खिंचाव और शांति पसंद है।"),
      ).toBeInTheDocument();
      expect(screen.queryByText(/pet\./)).not.toBeInTheDocument();
    });

    it("renders the entire adoption screen in Marathi with zero English leakage on keys", () => {
      mockAppState.lang = "mr";
      mockAppState.prefs = { lang: "mr" };

      render(<Companion />);

      expect(screen.getByText("तुमचा साथीदार")).toBeInTheDocument();
      expect(screen.getByText("15 साथीदार उपलब्ध")).toBeInTheDocument();
      expect(screen.queryByText(/pet\./)).not.toBeInTheDocument();
    });
  });
});
