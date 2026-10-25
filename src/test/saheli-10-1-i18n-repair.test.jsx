// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { DICTS, translate } from "../i18n/index.js";
import { LANGUAGES } from "../i18n/languages.js";
import Today from "../pages/Today.jsx";

const ALL_LANG_CODES = LANGUAGES.map((l) => l.code);

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
  prefs: { lang: "en", discreet: false, readAloud: false, textSize: "md" },
  setPrefs: vi.fn(),
  t: (key, vars) => translate("en", key, vars),
  fmt: (d) => String(d),
  fmtRange: (a, b) => `${a} – ${b}`,
  isOnline: true,
  isDemo: false,
  banners: [],
  dismissBanner: vi.fn(),
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
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: () => ({ location: { pathname: "/" } }),
}));

describe("Saheli 10.1 — Localisation, Copy & Typography Quality Gate", () => {
  describe("1. Direct and Aliased Key Resolution Across All 13 Languages", () => {
    const keysToCheck = [
      "diva.exploreHub",
      "diva.openChat",
      "lock.subtitle",
      "flow.none",
      "text.sm",
      "text.md",
      "text.lg",
    ];

    for (const code of ALL_LANG_CODES) {
      it(`resolves all repaired keys in language [${code}] without raw key leakage`, () => {
        for (const key of keysToCheck) {
          const val = translate(code, key);
          expect(val).toBeDefined();
          expect(typeof val).toBe("string");
          expect(val.trim().length).toBeGreaterThan(0);
          expect(val).not.toBe(key);
        }
      });
    }

    it("resolves casing and category aliases seamlessly via KEY_ALIASES", () => {
      expect(translate("en", "diva.explorehub")).toBe("Explore AI Specialists");
      expect(translate("hi", "diva.explorehub")).toBe("एआई विशेषज्ञों को देखें");
      expect(translate("en", "diva.openchat")).toBe("Chat with Diva");
      expect(translate("en", "discover.cat.menstrual_awareness")).toBe("Menstrual Health");
      expect(translate("en", "discover.cat.supplies_unavailable")).toBe(
        "When Supplies Are Unavailable",
      );
      expect(translate("en", "discover.cat.self_care")).toBe("Self-Care & Comfort");
      expect(translate("en", "companion.actionToast.feed")).toBe("Enjoyed a delicious treat! 🍓");
      expect(translate("mr", "companion.actionToast.feed")).toBe("स्वादिष्ट खाऊचा आनंद घेतला! 🍓");
    });
  });

  describe("2. System-wide Dictionary Parity & Integrity", () => {
    const enKeys = Object.keys(DICTS.en).sort();

    for (const code of ALL_LANG_CODES) {
      it(`[${code}] has 100% key parity with en dictionary and zero empty entries`, () => {
        const dict = DICTS[code];
        expect(dict).toBeDefined();

        const dictKeys = Object.keys(dict).sort();
        expect(dictKeys.length).toBe(enKeys.length);

        for (const k of enKeys) {
          expect(dict[k]).toBeDefined();
          expect(typeof dict[k]).toBe("string");
          expect(dict[k].trim().length).toBeGreaterThan(0);
        }
      });
    }
  });

  describe("3. DOM Rendered Text Leakage Verification on Today Dashboard", () => {
    it("renders Today dashboard with ZERO raw i18n keys in DOM text", () => {
      const { container } = render(<Today />);
      const allText = container.textContent || "";
      // Regular expression matching accidental raw key leakage like "diva.explorehub", "pet.badge", etc.
      const leakedKeyRegex =
        /\b(diva|pet|companion|lock|common|discover|insights|selfcare)\.[a-zA-Z0-9_.]+\b/g;
      const leaks = allText.match(leakedKeyRegex) || [];

      expect(leaks).toEqual([]);
    });
  });
});
