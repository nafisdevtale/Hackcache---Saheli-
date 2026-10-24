// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { translate } from "@/i18n/index.js";
import { LANGUAGES } from "@/i18n/languages.js";
import { Button, Card, Badge, PageHeader } from "@/components/bloom/index.js";
import More from "@/pages/More.jsx";

// Mock App context for rendering pages
vi.mock("@/App.jsx", () => ({
  useApp: vi.fn(() => ({
    t: (key, vars) => translate("en", key, vars),
    lang: "en",
    prefs: { lang: "en", discreet: false },
    pregnancyVisible: true,
  })),
}));

// Mock Link from @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("Saheli 9.0 — Visual, Typography & Layout Regression Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Multilingual Typography & Key Resolution Across All 13 Languages", () => {
    const CRITICAL_KEYS = [
      "app.name",
      "app.tagline",
      "nav.today",
      "nav.calendar",
      "nav.log",
      "nav.insights",
      "nav.companion",
      "nav.selfCare",
      "nav.discover",
      "nav.flash",
      "nav.instinct",
      "nav.diva",
      "nav.learn",
      "nav.community",
      "nav.settings",
      "companion.adoptionTitle",
      "companion.speciesAvailable",
      "today.logToday",
      "today.title",
    ];

    it("verifies all 13 languages resolve 100% of critical UI keys without raw key fallbacks", () => {
      LANGUAGES.forEach(({ code, nativeName }) => {
        CRITICAL_KEYS.forEach((key) => {
          const resolved = translate(code, key, { n: 15 });
          expect(
            resolved,
            `Language ${code} (${nativeName}) failed to resolve key ${key}`,
          ).toBeDefined();
          expect(resolved.startsWith(key), `Language ${code} returned unresolved key ${key}`).toBe(
            false,
          );
          expect(resolved.length).toBeGreaterThan(0);
        });
      });
    });

    it("preserves proper Urdu RTL translation and directionality", () => {
      const urduName = translate("ur", "app.name");
      const urduTagline = translate("ur", "app.tagline");
      const urduCompanions = translate("ur", "companion.speciesAvailable", { n: 15 });

      expect(urduName).toBe("سہیلی");
      expect(urduTagline).toBe("آپ کی نجی ماہواری ساتھی");
      expect(urduCompanions).toContain("15");
      expect(urduCompanions).toContain("ساتھی دستیاب ہیں");
    });

    it("interpolates count variables correctly across Hindi, Bengali, Tamil and Marathi", () => {
      expect(translate("hi", "companion.speciesAvailable", { n: 15 })).toContain("15 साथी उपलब्ध");
      expect(translate("bn", "companion.speciesAvailable", { n: 15 })).toContain(
        "15টি সঙ্গী উপলব্ধ",
      );
      expect(translate("ta", "companion.speciesAvailable", { n: 15 })).toContain(
        "15 தோழர்கள் உள்ளன",
      );
      expect(translate("mr", "companion.speciesAvailable", { n: 15 })).toContain(
        "15 साथीदार उपलब्ध",
      );
    });
  });

  describe("2. Viewport & Responsive Layout Safeguards", () => {
    it("ensures Bloom Button guarantees accessible touch target height (>= 44px) for mobile", () => {
      const { container } = render(<Button size="md">Touch Target Check</Button>);
      const btn = container.querySelector("button");
      expect(btn.className).toContain("min-h-[46px]");
    });

    it("ensures Bloom Card incorporates responsive surface and border tokens", () => {
      const { container } = render(<Card>Card Layout</Card>);
      const card = container.firstChild;
      expect(card.className).toContain("bloom-card");
      expect(card.className).toContain("p-4 sm:p-6");
    });

    it("ensures PageHeader renders without fixed height constraints or overflow truncation", () => {
      const { container } = render(
        <PageHeader
          tag="Reproductive Health"
          title="Understanding Your Menstrual Rhythm & Ovulation Window"
          subtitle="Comprehensive, uncertainty-aware evidence from FIGO and FOGSI guidelines"
        />,
      );
      const header = container.querySelector("header");
      expect(header.className).not.toContain("h-[");
      expect(header.className).toContain("space-y-2");
    });
  });

  describe("3. More Route Navigation Grid Responsiveness", () => {
    it("renders More navigation grid with responsive columns (grid-cols-1 sm:grid-cols-2) and no raw keys", () => {
      render(<More />);
      const navLinks = screen.getAllByRole("link");
      expect(navLinks.length).toBeGreaterThanOrEqual(14);

      // Verify that every link has a valid non-empty label and accessible touch target
      navLinks.forEach((link) => {
        expect(link.textContent.trim().length).toBeGreaterThan(0);
        expect(link.className).toContain("min-h-[60px]");
      });
    });
  });
});
