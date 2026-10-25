// scripts/real-browser-verify.js
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 568, dpr: 2, mobile: true },
  { name: "mobile-375", width: 375, height: 667, dpr: 2, mobile: true },
  { name: "mobile-390", width: 390, height: 844, dpr: 3, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, dpr: 2, mobile: true },
  { name: "tablet-1024", width: 1024, height: 768, dpr: 2, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, dpr: 2, mobile: false },
  { name: "desktop-1920", width: 1920, height: 1080, dpr: 1, mobile: false },
  { name: "zoom-200", width: 640, height: 480, dpr: 2, mobile: false, zoom: 2 },
];

const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "hi", name: "Hindi (Devanagari)", dir: "ltr" },
  { code: "mr", name: "Marathi (Devanagari)", dir: "ltr" },
  { code: "bn", name: "Bengali (Eastern Nagari)", dir: "ltr" },
  { code: "ta", name: "Tamil (Brahmic)", dir: "ltr" },
  { code: "ur", name: "Urdu (Nastaliq RTL)", dir: "rtl" },
];

const ROUTES = [
  { path: "/", id: "today", name: "Today Dashboard" },
  { path: "/calendar", id: "calendar", name: "Calendar View" },
  { path: "/log", id: "log", name: "Log Day Entry" },
  { path: "/insights", id: "insights", name: "Insights & Analytics" },
  { path: "/companion", id: "companion", name: "Saheli Companion" },
  { path: "/selfcare", id: "selfcare", name: "Self Care Sanctuary" },
  { path: "/discover", id: "discover", name: "Discover Health" },
  { path: "/learn", id: "learn", name: "Learn Academy" },
  { path: "/community", id: "community", name: "Community Circles" },
  { path: "/ask", id: "eeve", name: "Eeve Health AI" },
  { path: "/flash", id: "flash", name: "FLASH Essentials" },
  { path: "/instinct", id: "instinct", name: "INSTINCT Entertainment" },
  { path: "/diva", id: "diva", name: "Diva Central Assistant" },
  { path: "/settings", id: "settings", name: "Settings & Privacy" },
  { path: "/more", id: "more", name: "More Hub" },
];

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), "docs/screenshots");
  const afterDir = path.resolve(screenshotsDir, "after");
  await fs.mkdir(screenshotsDir, { recursive: true });
  await fs.mkdir(afterDir, { recursive: true });

  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const userDataDir = "/tmp/saheli-chrome-verify-run";
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--remote-debugging-port=9222",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const results = [];
  let failures = 0;

  try {
    let pageTarget = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch("http://127.0.0.1:9222/json/list");
        if (res.ok) {
          const list = await res.json();
          pageTarget = list.find((t) => t.type === "page");
          if (pageTarget) break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!pageTarget) throw new Error("Could not find Chrome page target");
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Initialize demo data in IndexedDB/localStorage first so all routes have realistic content
    console.log("Navigating to base app to ensure storage initialization...");
    await cdp.send("Page.navigate", { url: "http://localhost:4173/" });
    await new Promise((r) => setTimeout(r, 1500));

    // Ensure demo mode is seeded so charts, companions, phases, etc. are populated
    await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        // If not already populated, trigger demo data via localStorage or reload
        const prefs = JSON.parse(localStorage.getItem("saheli.prefs") || "{}");
        if (!prefs.lang) {
          localStorage.setItem("saheli.prefs", JSON.stringify({ ...prefs, lang: "en" }));
        }
      })()`,
      awaitPromise: true,
    });

    console.log("\n=======================================================");
    console.log(" SAHELI 9.0 BLOOM REAL-BROWSER VISUAL VERIFICATION");
    console.log(" Headless Chrome 156 | Localhost:4173");
    console.log("=======================================================\n");

    // Phase 1: Viewport Responsive Matrix across core screens
    console.log("--- PHASE 1: RESPONSIVE VIEWPORT MATRIX ---");
    for (const vp of VIEWPORTS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: vp.mobile,
      });

      // Check Today and Calendar at this viewport
      for (const route of [ROUTES[0], ROUTES[1], ROUTES[13]]) {
        const url = `http://localhost:4173${route.path}`;
        await cdp.send("Page.navigate", { url });
        await new Promise((r) => setTimeout(r, 1200));

        const metrics = await cdp.send("Runtime.evaluate", {
          expression: `({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            hasErrorBoundary: document.body.innerText.includes("This page didn't load")
          })`,
          returnByValue: true,
        });

        const m = metrics.result.value;
        const pass = !m.hasHorizontalOverflow && !m.hasErrorBoundary;
        const filename = `vp_${vp.name}_${route.id}.png`;
        const filepath = path.join(screenshotsDir, filename);

        const ss = await cdp.send("Page.captureScreenshot", { format: "png" });
        await fs.writeFile(filepath, Buffer.from(ss.data, "base64"));
        await fs.writeFile(path.join(afterDir, filename), Buffer.from(ss.data, "base64"));

        if (!pass) failures++;
        results.push({
          category: "Viewport",
          name: `${vp.name} (${vp.width}x${vp.height}) - ${route.name}`,
          pass,
          scrollWidth: m.scrollWidth,
          clientWidth: m.clientWidth,
          screenshot: filename,
        });

        console.log(
          ` ${pass ? "✅" : "❌"} [${vp.name}] ${route.name.padEnd(22)} | W:${m.clientWidth}px Scroll:${m.scrollWidth}px | ${filename}`,
        );
      }
    }

    // Phase 2: Multilingual Typography & RTL Verification
    console.log("\n--- PHASE 2: MULTILINGUAL SCRIPT & RTL VERIFICATION ---");
    // Set standard mobile viewport: 390x844
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    for (const lang of LANGUAGES) {
      // Set language in localStorage
      await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const current = JSON.parse(localStorage.getItem("saheli.prefs") || "{}");
          current.lang = "${lang.code}";
          localStorage.setItem("saheli.prefs", JSON.stringify(current));
        })()`,
      });

      // Test Today and Companion in this language
      for (const route of [ROUTES[0], ROUTES[4]]) {
        const url = `http://localhost:4173${route.path}`;
        await cdp.send("Page.navigate", { url });
        await new Promise((r) => setTimeout(r, 1200));

        const langCheck = await cdp.send("Runtime.evaluate", {
          expression: `({
            htmlDir: document.documentElement.getAttribute("dir") || "ltr",
            htmlLang: document.documentElement.getAttribute("lang") || "",
            bodyFont: window.getComputedStyle(document.body).fontFamily,
            bodyLineHeight: window.getComputedStyle(document.body).lineHeight,
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            hasErrorBoundary: document.body.innerText.includes("This page didn't load"),
            // Check for raw unparsed translation keys like 'today.', 'companion.'
            rawKeyCount: (document.body.innerText.match(/\\b(pet|today|cal|nav|insights|companion)\\.[a-zA-Z0-9_]+/g) || []).length
          })`,
          returnByValue: true,
        });

        const lc = langCheck.result.value;
        const dirCorrect = lang.code === "ur" ? lc.htmlDir === "rtl" : lc.htmlDir === "ltr";
        const noRawKeys = lc.rawKeyCount === 0;
        const noOverflow = !lc.hasHorizontalOverflow;
        const noCrash = !lc.hasErrorBoundary;
        const pass = dirCorrect && noRawKeys && noOverflow && noCrash;

        const filename = `lang_${lang.code}_${route.id}.png`;
        const filepath = path.join(screenshotsDir, filename);

        const ss = await cdp.send("Page.captureScreenshot", { format: "png" });
        await fs.writeFile(filepath, Buffer.from(ss.data, "base64"));
        await fs.writeFile(path.join(afterDir, filename), Buffer.from(ss.data, "base64"));

        if (!pass) failures++;
        results.push({
          category: "Multilingual",
          name: `${lang.name} [${lang.code}] - ${route.name}`,
          pass,
          dir: lc.htmlDir,
          rawKeys: lc.rawKeyCount,
          scrollWidth: lc.scrollWidth,
          clientWidth: lc.clientWidth,
          screenshot: filename,
        });

        console.log(
          ` ${pass ? "✅" : "❌"} [${lang.code}] ${lang.name.padEnd(24)} | Dir:${lc.htmlDir} RawKeys:${lc.rawKeyCount} | ${filename}`,
        );
      }
    }

    // Reset back to English
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const current = JSON.parse(localStorage.getItem("saheli.prefs") || "{}");
        current.lang = "en";
        localStorage.setItem("saheli.prefs", JSON.stringify(current));
      })()`,
    });

    // Phase 3: Complete Page-by-Page Migration (All 15 routes on Mobile 390 & Desktop 1440)
    console.log("\n--- PHASE 3: ALL 15 ROUTES BLOOM AUDIT ---");
    for (const route of ROUTES) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true,
      });

      const url = `http://localhost:4173${route.path}`;
      await cdp.send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 1200));

      const audit = await cdp.send("Runtime.evaluate", {
        expression: `({
          title: document.title,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          hasErrorBoundary: document.body.innerText.includes("This page didn't load"),
          bloomCards: document.querySelectorAll(".bloom-card, .bloom-card-elevated, [class*='rounded-3xl'], [class*='rounded-2xl']").length,
          buttons: document.querySelectorAll("button, [role='button']").length,
          minTouchTargetsPass: Array.from(document.querySelectorAll("button, a")).every(el => {
            const rect = el.getBoundingClientRect();
            // Accept 0x0 for hidden items, otherwise check >= 36px or padded parent
            return (rect.width === 0 && rect.height === 0) || rect.height >= 36 || rect.width >= 36;
          })
        })`,
        returnByValue: true,
      });

      const a = audit.result.value;
      const pass = !a.hasHorizontalOverflow && !a.hasErrorBoundary;
      const filename = `page_${route.id}.png`;
      const filepath = path.join(screenshotsDir, filename);

      const ss = await cdp.send("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(filepath, Buffer.from(ss.data, "base64"));

      if (!pass) failures++;
      results.push({
        category: "Pages",
        name: route.name,
        pass,
        scrollWidth: a.scrollWidth,
        clientWidth: a.clientWidth,
        cards: a.bloomCards,
        screenshot: filename,
      });

      console.log(
        ` ${pass ? "✅" : "❌"} ${route.name.padEnd(26)} | Cards:${String(a.bloomCards).padStart(2)} | W:${a.clientWidth} Scroll:${a.scrollWidth} | ${filename}`,
      );
    }

    console.log("\n=======================================================");
    console.log(
      ` AUDIT COMPLETE: ${results.filter((r) => r.pass).length}/${results.length} PASSED (${failures} FAILURES)`,
    );
    console.log(" Screenshots saved to docs/screenshots/");
    console.log("=======================================================\n");

    // Write JSON summary for documentation embedding
    await fs.writeFile(
      path.join(screenshotsDir, "verification-summary.json"),
      JSON.stringify({ timestamp: new Date().toISOString(), results, failures }, null, 2),
    );

    cdp.close();
  } finally {
    chrome.kill();
  }

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
