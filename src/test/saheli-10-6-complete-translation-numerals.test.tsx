// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  shouldUseNativeNumerals,
  getLocaleTag,
  formatInteger,
  formatNumber,
  formatDate,
  formatTime,
  formatRelativeTime,
  parseLocalizedNumber,
  NATIVE_NUMBERING_SYSTEMS,
  SUPPORTED_LOCALES,
} from "../lib/locale.js";
import { translate, DICTS } from "../i18n/index.js";
import { LANGUAGES } from "../i18n/languages.js";
import { RhythmRing } from "../components/cycle/RhythmRing.jsx";

const mockAppState = {
  lang: "en",
  prefs: { latinNumerals: false, useLatinNumerals: false, nativeNumerals: true },
  today: "2026-10-25",
  cycleState: { cycleDay: 14, phase: "ovulatory" },
};

vi.mock("@/App.jsx", () => ({
  useApp: () => ({
    lang: mockAppState.lang,
    prefs: mockAppState.prefs,
    today: mockAppState.today,
    cycleState: mockAppState.cycleState,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(mockAppState.lang, key, vars),
    fmtInteger: (val: number, opts?: Record<string, unknown>) =>
      formatInteger(val, mockAppState.lang, { ...mockAppState.prefs, ...opts }),
    fmtNumber: (val: number, opts?: Record<string, unknown>) =>
      formatNumber(val, mockAppState.lang, { ...mockAppState.prefs, ...opts }),
    fmt: (d: unknown) => d,
    fmtRange: (a: unknown, b: unknown) => `${a} - ${b}`,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("Saheli 10.6 — Total Translation Completeness & Native Numeral Enforcement", () => {
  beforeEach(() => {
    mockAppState.lang = "en";
    mockAppState.prefs = { latinNumerals: false, useLatinNumerals: false, nativeNumerals: true };
  });

  describe("1. Native Numeral Default Enforcement", () => {
    const nonEnglishLangs = [
      { code: "hi", num: 28, expected: "२८", script: "Devanagari" },
      { code: "mr", num: 28, expected: "२८", script: "Devanagari" },
    ];

    it("enforces shouldUseNativeNumerals true by default for supported Indic languages", () => {
      expect(shouldUseNativeNumerals("en")).toBe(false);
      for (const { code } of nonEnglishLangs) {
        expect(shouldUseNativeNumerals(code)).toBe(true);
        expect(shouldUseNativeNumerals(code, {})).toBe(true);
      }
    });

    it("formats integers using authentic native digits by default for supported Indic languages", () => {
      expect(formatInteger(28, "en")).toBe("28");
      for (const { code, num, expected, script } of nonEnglishLangs) {
        const formatted = formatInteger(num, code);
        expect(formatted, `Failed for ${code} (${script})`).toBe(expected);
      }
    });

    it("resolves correct BCP 47 locale tags with native numbering extension when native numerals are active", () => {
      expect(getLocaleTag("en", false)).toBe("en-IN-u-nu-latn");
      for (const { code } of nonEnglishLangs) {
        const tag = getLocaleTag(code, true);
        expect(tag).toContain(`-u-nu-${NATIVE_NUMBERING_SYSTEMS[code]}`);
      }
    });

    it("supports optional compatibility override toggle (prefs.latinNumerals / prefs.useLatinNumerals)", () => {
      // Overriding with latinNumerals: true forces standard Latin 0-9
      for (const { code } of nonEnglishLangs) {
        expect(shouldUseNativeNumerals(code, { latinNumerals: true })).toBe(false);
        expect(shouldUseNativeNumerals(code, { useLatinNumerals: true })).toBe(false);
        expect(shouldUseNativeNumerals(code, { nativeNumerals: false })).toBe(false);

        expect(formatInteger(28, code, { latinNumerals: true })).toBe("28");
        expect(formatInteger(28, code, { useLatinNumerals: true })).toBe("28");
      }
    });

    it("parses localized native numerals back to standard JavaScript numbers", () => {
      for (const { code, num, expected } of nonEnglishLangs) {
        const parsed = parseLocalizedNumber(expected, code);
        expect(parsed).toBe(num);
      }
      expect(parseLocalizedNumber("28", "en")).toBe(28);
    });
  });

  describe("2. Total Translation Completeness & Zero Leakage Across Supported Languages", () => {
    it("ensures all supported languages have exact 100% dictionary key parity (1974+ keys)", () => {
      const enKeys = Object.keys(DICTS.en);
      expect(enKeys.length).toBeGreaterThanOrEqual(1974);

      for (const langObj of LANGUAGES) {
        const lang = langObj.code;
        const langKeys = Object.keys(DICTS[lang]);
        expect(
          langKeys.length,
          `Dictionary ${lang} has ${langKeys.length} keys, expected ${enKeys.length}`,
        ).toBe(enKeys.length);

        const missing = enKeys.filter((k) => DICTS[lang][k] === undefined);
        expect(
          missing,
          `Dictionary ${lang} is missing keys: ${missing.slice(0, 5).join(", ")}`,
        ).toEqual([]);
      }
    });

    it("ensures translations contain no unresolved template tags, undefined, or empty values", () => {
      for (const [lang, dict] of Object.entries(DICTS)) {
        for (const [key, val] of Object.entries(dict)) {
          expect(typeof val, `${lang}:${key} must be string`).toBe("string");
          expect((val as string).trim().length, `${lang}:${key} must not be empty`).toBeGreaterThan(
            0,
          );
          expect((val as string).includes("undefined"), `${lang}:${key} contains 'undefined'`).toBe(
            false,
          );
          expect((val as string).includes("null"), `${lang}:${key} contains 'null'`).toBe(false);
        }
      }
    });

    it("verifies newly added 10.6 keys exist across all supported languages", () => {
      const sample106Keys = [
        "settings.latinNumerals",
        "settings.latinNumeralsDesc",
        "aria.cycleRing",
        "rem.nextPeriodDesc",
        "diva.privacyTitle",
        "set.pregnancyMode",
        "instinct.assistantTitle",
        "doc.title",
      ];

      for (const key of sample106Keys) {
        for (const langObj of LANGUAGES) {
          const lang = langObj.code;
          const translated = translate(lang, key);
          expect(translated, `Missing ${key} in ${lang}`).toBeTruthy();
          expect(translated).not.toBe(key);
        }
      }
    });
  });

  describe("3. Real-Time Language Switching & State Preservation", () => {
    it("allows dynamic language switching while preserving user form input and modal state", () => {
      function TestContainer() {
        const [lang, setLang] = useState("en");
        const [text, setText] = useState("");
        const [modalOpen, setModalOpen] = useState(false);

        return (
          <div>
            <div data-testid="greeting">{translate(lang, "nav.today")}</div>
            <button data-testid="switch-hi" onClick={() => setLang("hi")}>
              Hindi
            </button>
            <button data-testid="switch-mr" onClick={() => setLang("mr")}>
              Marathi
            </button>
            <button data-testid="open-modal" onClick={() => setModalOpen(true)}>
              {translate(lang, "nav.settings")}
            </button>
            <input
              data-testid="user-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={translate(lang, "log.notes")}
            />
            {modalOpen && (
              <div role="dialog" data-testid="modal">
                <h2>{translate(lang, "nav.settings")}</h2>
                <button data-testid="close-modal" onClick={() => setModalOpen(false)}>
                  {translate(lang, "common.close")}
                </button>
              </div>
            )}
          </div>
        );
      }

      render(<TestContainer />);

      // Initial English state
      expect(screen.getByTestId("greeting").textContent).toBe("Today");
      expect(screen.queryByTestId("modal")).toBeNull();

      // User types into input
      const input = screen.getByTestId("user-input");
      fireEvent.change(input, { target: { value: "Severe cramps today" } });
      expect((input as HTMLInputElement).value).toBe("Severe cramps today");

      // User opens modal
      fireEvent.click(screen.getByTestId("open-modal"));
      expect(screen.getByTestId("modal")).toBeTruthy();
      expect(screen.getByTestId("modal").textContent).toContain("Settings");

      // Switch language to Hindi
      fireEvent.click(screen.getByTestId("switch-hi"));

      // Verification: Modal remains open, input text preserved, labels localized
      expect(screen.getByTestId("modal")).toBeTruthy();
      expect(screen.getByTestId("modal").textContent).toContain(DICTS.hi["nav.settings"]);
      expect((input as HTMLInputElement).value).toBe("Severe cramps today");

      // Switch language to Marathi
      fireEvent.click(screen.getByTestId("switch-mr"));

      // Verification: Modal still open, input text still preserved, labels localized to Marathi
      expect(screen.getByTestId("modal")).toBeTruthy();
      expect(screen.getByTestId("modal").textContent).toContain(DICTS.mr["nav.settings"]);
      expect((input as HTMLInputElement).value).toBe("Severe cramps today");
    });
  });

  describe("4. Component Level Localization & Numeral Formatting", () => {
    it("renders RhythmRing with native numerals in Hindi", () => {
      mockAppState.lang = "hi";
      mockAppState.prefs = { latinNumerals: false, useLatinNumerals: false, nativeNumerals: true };
      mockAppState.cycleState = { cycleDay: 14, phase: "ovulatory" };

      const { container } = render(
        <RhythmRing
          analysis={{ currentCycleDay: 14, stats: { median: 28, avgPeriod: 5 } }}
          record={{}}
        />,
      );

      // Verify native numerals appear in the rendered output
      const textContent = container.textContent || "";
      expect(textContent).toContain("१४"); // Day 14 in Devanagari
      expect(textContent).toContain("२८"); // Day 28 in Devanagari
    });

    it("renders RhythmRing with native numerals in Marathi", () => {
      mockAppState.lang = "mr";
      mockAppState.prefs = { latinNumerals: false, useLatinNumerals: false, nativeNumerals: true };
      mockAppState.cycleState = { cycleDay: 14, phase: "ovulatory" };

      const { container } = render(
        <RhythmRing
          analysis={{ currentCycleDay: 14, stats: { median: 28, avgPeriod: 5 } }}
          record={{}}
        />,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("१४"); // Day 14 in Devanagari (Marathi)
      expect(textContent).toContain("२८"); // Day 28 in Devanagari (Marathi)
    });

    it("renders RhythmRing with standard Latin numerals when latinNumerals preference is true", () => {
      mockAppState.lang = "hi";
      mockAppState.prefs = { latinNumerals: true, useLatinNumerals: true, nativeNumerals: false };
      mockAppState.cycleState = { cycleDay: 14, phase: "ovulatory" };

      const { container } = render(
        <RhythmRing
          analysis={{ currentCycleDay: 14, stats: { median: 28, avgPeriod: 5 } }}
          record={{}}
        />,
      );

      const textContent = container.textContent || "";
      expect(textContent).toContain("14");
      expect(textContent).toContain("28");
    });
  });
});
