import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  isStandalone,
  promptPwaInstall,
  setDeferredPrompt,
  getDeferredPrompt,
  clearAppCaches,
  applyServiceWorkerUpdate,
} from "../lib/pwa.js";

describe("PWA Web App Manifest", () => {
  const manifestPath = path.resolve(process.cwd(), "public/manifest.webmanifest");
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(manifestRaw);

  it("manifest exists and has valid JSON", () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe("object");
  });

  it("manifest includes required PWA identification and display properties", () => {
    expect(manifest.name).toBe("Saheli – Menstrual Health Companion");
    expect(manifest.short_name).toBe("Saheli");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("manifest contains valid icons with both any and maskable purposes", () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const purposes = manifest.icons.map((i) => i.purpose);
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");

    // Verify all icon files physically exist in public/
    for (const icon of manifest.icons) {
      const iconPath = path.resolve(process.cwd(), "public", icon.src.replace(/^\//, ""));
      expect(fs.existsSync(iconPath)).toBe(true);
      const stat = fs.statSync(iconPath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });
});

describe("Service Worker Privacy & Caching Architecture", () => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const swCode = fs.readFileSync(swPath, "utf-8");

  it("service worker has versioned cache name and cleanup of obsolete caches", () => {
    expect(swCode).toContain("CACHE_NAME =");
    expect(swCode).toContain("CACHE_VERSION =");
    expect(swCode).toContain("caches.delete(key)");
    expect(swCode).toContain("clients.claim()");
  });

  it("service worker precaches essential app shell assets", () => {
    expect(swCode).toMatch(/["']\/["']/);
    expect(swCode).toMatch(/["']\/manifest\.webmanifest["']/);
    expect(swCode).toMatch(/["']\/favicon\.ico["']/);
    expect(swCode).toMatch(/["']\/icon\.svg["']/);
    expect(swCode).toMatch(/["']\/icon-192\.png["']/);
  });

  it("strictly enforces GET-only requests to prevent caching data mutations", () => {
    expect(swCode).toMatch(/request\.method !== ["']GET["']/);
  });

  it("strictly enforces same-origin policy to prevent caching external health links or third parties", () => {
    expect(swCode).toContain("url.origin !== self.location.origin");
  });

  it("explicitly forbids caching sensitive export endpoints, query keys, or credentials", () => {
    expect(swCode).toMatch(/url\.pathname\.includes\(["']\/export["']\)/);
    expect(swCode).toMatch(/url\.search\.includes\(["']pin["']\)/);
    expect(swCode).toMatch(/url\.search\.includes\(["']key["']\)/);
  });

  it("supports offline navigation fallback to cached app shell or offline document", () => {
    expect(swCode).toMatch(/request\.mode === ["']navigate["']/);
    expect(swCode).toMatch(/caches\.match\(["']\/["']\)/);
    expect(swCode).toContain("OFFLINE_FALLBACK_HTML");
  });

  it("supports user-triggered safe update through SKIP_WAITING message", () => {
    expect(swCode).toContain("SKIP_WAITING");
    expect(swCode).toContain("self.skipWaiting()");
  });
});

describe("PWA Client Lifecycle & Helpers", () => {
  beforeEach(() => {
    setDeferredPrompt(null);
  });

  it("isStandalone detects browser vs standalone display mode", () => {
    expect(typeof isStandalone()).toBe("boolean");
  });

  it("promptPwaInstall handles missing prompt gracefully without crashing", async () => {
    const res = await promptPwaInstall();
    expect(res).toEqual({ outcome: "unsupported" });
  });

  it("promptPwaInstall invokes prompt and captures user acceptance", async () => {
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    };
    setDeferredPrompt(mockPrompt);
    expect(getDeferredPrompt()).toBe(mockPrompt);

    const res = await promptPwaInstall();
    expect(mockPrompt.prompt).toHaveBeenCalled();
    expect(res.outcome).toBe("accepted");
    expect(getDeferredPrompt()).toBeNull();
  });

  it("applyServiceWorkerUpdate posts SKIP_WAITING to waiting worker", () => {
    const postMessage = vi.fn();
    const mockReg = {
      waiting: { postMessage },
    };
    applyServiceWorkerUpdate(mockReg);
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("clearAppCaches deletes all application caches", async () => {
    const mockDelete = vi.fn().mockResolvedValue(true);
    const mockKeys = vi.fn().mockResolvedValue(["saheli-app-shell-v1", "old-cache"]);

    const origCaches = globalThis.caches;
    globalThis.caches = {
      keys: mockKeys,
      delete: mockDelete,
    };

    try {
      await clearAppCaches();
      expect(mockKeys).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith("saheli-app-shell-v1");
      expect(mockDelete).toHaveBeenCalledWith("old-cache");
    } finally {
      if (origCaches) globalThis.caches = origCaches;
      else delete globalThis.caches;
    }
  });
});

describe("Service Worker Fetch Interception Simulation", () => {
  const swCode = fs.readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf-8");

  function createSwEnvironment(fetchImpl = vi.fn()) {
    const listeners = {};
    const mockCacheStorage = new Map();
    const mockCaches = {
      open: vi.fn(async (name) => {
        if (!mockCacheStorage.has(name)) mockCacheStorage.set(name, new Map());
        const cache = mockCacheStorage.get(name);
        return {
          add: vi.fn(async (url) => cache.set(url, new Response("ok"))),
          put: vi.fn(async (req, res) => cache.set(typeof req === "string" ? req : req.url, res)),
          match: vi.fn(async (req) => {
            const key = typeof req === "string" ? req : req.url;
            return cache.get(key) || null;
          }),
        };
      }),
      match: vi.fn(async (req) => {
        const key =
          typeof req === "string"
            ? req
            : req.url
              ? new URL(req.url, "https://saheli.local").pathname
              : "/";
        for (const cache of mockCacheStorage.values()) {
          if (cache.has(key)) return cache.get(key);
        }
        return null;
      }),
      keys: vi.fn(async () => Array.from(mockCacheStorage.keys())),
      delete: vi.fn(async (key) => mockCacheStorage.delete(key)),
    };

    const scope = {
      self: {
        location: { origin: "https://saheli.local" },
        clients: { claim: vi.fn() },
        skipWaiting: vi.fn(),
        addEventListener: (event, handler) => {
          listeners[event] = handler;
        },
      },
      caches: mockCaches,
      fetch: fetchImpl,
      URL,
      Response,
      Promise,
      Map,
      Array,
      console,
    };

    const fn = new Function(...Object.keys(scope), swCode);
    fn(...Object.values(scope));

    return { listeners, mockCaches, mockCacheStorage, scope };
  }

  it("handles offline navigation by serving cached shell", async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    const { listeners, mockCacheStorage } = createSwEnvironment(failingFetch);
    const appShell = new Response("<!DOCTYPE html><html>App Shell</html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
    const shellCache = new Map();
    shellCache.set("/", appShell);
    mockCacheStorage.set("saheli-app-shell-v1", shellCache);

    let respondedWithPromise = null;
    const event = {
      request: {
        method: "GET",
        mode: "navigate",
        url: "https://saheli.local/calendar",
      },
      respondWith: (p) => {
        respondedWithPromise = p;
      },
    };

    listeners["fetch"](event);

    expect(respondedWithPromise).not.toBeNull();
    const res = await respondedWithPromise;
    expect(res).toBe(appShell);
  });

  it("bypasses service worker cache for POST requests", () => {
    const { listeners } = createSwEnvironment();
    let respondedWith = false;
    const event = {
      request: { method: "POST", url: "https://saheli.local/submit" },
      respondWith: () => {
        respondedWith = true;
      },
    };
    listeners["fetch"](event);
    expect(respondedWith).toBe(false);
  });

  it("bypasses service worker cache for external health links", () => {
    const { listeners } = createSwEnvironment();
    let respondedWith = false;
    const event = {
      request: { method: "GET", url: "https://www.who.int/news-room/fact-sheets/pcos" },
      respondWith: () => {
        respondedWith = true;
      },
    };
    listeners["fetch"](event);
    expect(respondedWith).toBe(false);
  });

  it("bypasses service worker cache for sensitive export or query endpoints", () => {
    const { listeners } = createSwEnvironment();
    let respondedWith = false;
    const event = {
      request: { method: "GET", url: "https://saheli.local/export/diary.json" },
      respondWith: () => {
        respondedWith = true;
      },
    };
    listeners["fetch"](event);
    expect(respondedWith).toBe(false);
  });
});
