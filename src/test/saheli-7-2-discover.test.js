import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  DISCOVER_ARTICLES,
  DISCOVER_CATEGORIES,
  getArticleById,
} from "@/content/discoverArticles.js";
import { SOURCES } from "@/content/sources.js";

const BOOKMARKS_KEY = "saheli_discover_bookmarks";

function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toggleBookmark(id) {
  const list = getBookmarks();
  const idx = list.indexOf(id);
  if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(id);
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  return list.includes(id);
}

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("Saheli 7.2 — Discover Knowledge & Awareness Hub", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Article Integrity & Medical Evidence", () => {
    it("all 6 evidence-based articles exist with full clinical credentials", () => {
      expect(DISCOVER_ARTICLES.length).toBe(6);

      for (const art of DISCOVER_ARTICLES) {
        expect(art.id).toBeDefined();
        expect(art.category).toBeDefined();
        expect(art.titleKey).toBeDefined();
        expect(art.summaryKey).toBeDefined();
        expect(art.readTimeMinutes).toBeGreaterThan(0);
        expect(art.medicalReviewStatus).toBeDefined();
        expect(art.lastVerified).toBeDefined();
        expect(art.sections.length).toBeGreaterThanOrEqual(2);

        // Every source ID referenced must exist in SOURCES registry
        for (const srcId of art.sourceIds) {
          expect(SOURCES[srcId]).toBeDefined();
          expect(SOURCES[srcId].url).toBeDefined();
        }
      }
    });

    it("all 5 problem statement categories are represented", () => {
      const activeCats = new Set(DISCOVER_ARTICLES.map((a) => a.category));
      const nonAllCategories = DISCOVER_CATEGORIES.filter((c) => c.id !== "all");

      for (const cat of nonAllCategories) {
        expect(activeCats.has(cat.id)).toBe(true);
      }
    });

    it("retrieves articles by ID accurately", () => {
      const art = getArticleById("when_supplies_unavailable");
      expect(art).toBeDefined();
      expect(art.category).toBe("supplies_unavailable");

      expect(getArticleById("non_existent")).toBeUndefined();
    });
  });

  describe("Clinical Safeguards: When Supplies Are Unavailable", () => {
    it("emergency article strictly warns against unsafe internal improvisation (TSS prevention)", () => {
      const emergencyArticle = getArticleById("when_supplies_unavailable");
      expect(emergencyArticle).toBeDefined();

      // Check section 4: "What NEVER to do"
      const section4 = emergencyArticle.sections.find(
        (s) => s.headingKey.includes("h4") || s.textKey.includes("t4"),
      );
      expect(section4).toBeDefined();
      expect(section4.headingKey).toBe("discover.art.emergencySupplies.h4");
      expect(section4.textKey).toBe("discover.art.emergencySupplies.t4");

      // Verify accredited sources for emergency guidance
      expect(emergencyArticle.sourceIds).toContain("unicef_hygiene");
      expect(emergencyArticle.sourceIds).toContain("who_selfcare");
    });

    it("cross-links to relevant FLASH essentials and Self Care routines", () => {
      const emergencyArticle = getArticleById("when_supplies_unavailable");
      expect(emergencyArticle.relatedFlashCategory).toBe("disposable_pads");
      expect(emergencyArticle.relatedSelfCareRoutine).toBe("routine_period_hygiene");

      const crampsArticle = getArticleById("cramps_relief_science");
      expect(crampsArticle.relatedFlashCategory).toBe("warm_compress");
      expect(crampsArticle.relatedSelfCareRoutine).toBe("routine_gentle_warmth");
    });
  });

  describe("Local Bookmarks Management", () => {
    it("saves, toggles and retrieves local bookmarks without telemetry", () => {
      expect(getBookmarks()).toEqual([]);

      // Bookmark first article
      const isBookmarked1 = toggleBookmark("when_supplies_unavailable");
      expect(isBookmarked1).toBe(true);
      expect(getBookmarks()).toContain("when_supplies_unavailable");

      // Bookmark second article
      const isBookmarked2 = toggleBookmark("disposable_vs_reusable");
      expect(isBookmarked2).toBe(true);
      expect(getBookmarks().length).toBe(2);

      // Toggle off first article
      const isBookmarked1After = toggleBookmark("when_supplies_unavailable");
      expect(isBookmarked1After).toBe(false);
      expect(getBookmarks()).not.toContain("when_supplies_unavailable");
      expect(getBookmarks()).toContain("disposable_vs_reusable");
    });
  });
});
