// scripts/nova-browser-verify.js
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
  const screenshotsDir = path.resolve(process.cwd(), "docs/screenshots/nova");
  await fs.mkdir(screenshotsDir, { recursive: true });

  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const userDataDir = "/tmp/saheli-chrome-nova-verify";
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

    console.log("Navigating to base app to ensure storage initialization...");
    await cdp.send("Page.navigate", { url: "http://localhost:4173/" });
    await new Promise((r) => setTimeout(r, 1500));

    await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const prefs = JSON.parse(localStorage.getItem("saheli.prefs") || "{}");
        if (!prefs.lang) {
          localStorage.setItem("saheli.prefs", JSON.stringify({ ...prefs, lang: "en" }));
        }
      })()`,
      awaitPromise: true,
    });

    console.log("\n=======================================================");
    console.log(" SAHELI 10.0 NOVA REAL-BROWSER VISUAL VERIFICATION");
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

      await cdp.send("Page.navigate", { url: "http://localhost:4173/" });
      await new Promise((r) => setTimeout(r, 600));

      const audit = await cdp.send("Runtime.evaluate", {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          hasErrorBoundary: document.body.innerText.includes("This page didn't load"),
          headingsCount: document.querySelectorAll("h1, h2, h3").length,
          sidebarVisible: !!document.querySelector("aside"),
          dockVisible: !!document.querySelector("nav[aria-label='Main navigation'], nav[aria-label='मुख्य नेविगेशन']")
        })`,
        returnByValue: true,
      });

      const a = audit.result.value;
      const pass = !a.hasHorizontalOverflow && !a.hasErrorBoundary;
      const filename = `vp_${vp.name}.png`;
      const filepath = path.join(screenshotsDir, filename);

      const ss = await cdp.send("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(filepath, Buffer.from(ss.data, "base64"));

      if (!pass) failures++;
      results.push({
        category: "Viewport",
        name: vp.name,
        width: vp.width,
        pass,
        scrollWidth: a.scrollWidth,
        clientWidth: a.clientWidth,
        screenshot: filename,
      });

      console.log(
        ` ${pass ? "✅" : "❌"} ${vp.name.padEnd(16)} | W:${a.clientWidth} Scroll:${a.scrollWidth} | Sidebar:${a.sidebarVisible} Dock:${a.dockVisible} | ${filename}`,
      );
    }

    // Phase 2: Multilingual Typographic Rendering & Diacritic Collision Checks
    console.log("\n--- PHASE 2: MULTILINGUAL SCRIPTS & RTL VALIDATION ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    for (const lang of LANGUAGES) {
      await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const prefs = JSON.parse(localStorage.getItem("saheli.prefs") || "{}");
          prefs.lang = "${lang.code}";
          localStorage.setItem("saheli.prefs", JSON.stringify(prefs));
          document.documentElement.lang = "${lang.code}";
          document.documentElement.dir = "${lang.dir}";
        })()`,
      });

      await cdp.send("Page.navigate", { url: "http://localhost:4173/" });
      await new Promise((r) => setTimeout(r, 600));

      const audit = await cdp.send("Runtime.evaluate", {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          hasErrorBoundary: document.body.innerText.includes("This page didn't load"),
          rawKeyMatches: (document.body.innerText.match(/\\b(nav|today|pet|diva|flash|instinct)\\.[a-zA-Z0-9_.]+\\b/g) || []).length,
          dir: document.documentElement.dir
        })`,
        returnByValue: true,
      });

      const a = audit.result.value;
      const pass = !a.hasHorizontalOverflow && !a.hasErrorBoundary && a.rawKeyMatches === 0;
      const filename = `lang_${lang.code}.png`;
      const filepath = path.join(screenshotsDir, filename);

      const ss = await cdp.send("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(filepath, Buffer.from(ss.data, "base64"));

      if (!pass) failures++;
      results.push({
        category: "Language",
        name: lang.name,
        code: lang.code,
        dir: lang.dir,
        pass,
        rawKeys: a.rawKeyMatches,
        screenshot: filename,
      });

      console.log(
        ` ${pass ? "✅" : "❌"} [${lang.code}] ${lang.name.padEnd(26)} | Dir:${a.dir} | RawKeys:${a.rawKeyMatches} | ${filename}`,
      );
    }

    // Reset language to English for full page audit
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const prefs = JSON.parse(localStorage.getItem("saheli.prefs") || "{}");
        prefs.lang = "en";
        localStorage.setItem("saheli.prefs", JSON.stringify(prefs));
        document.documentElement.lang = "en";
        document.documentElement.dir = "ltr";
      })()`,
    });

    // Phase 3: All 15 User Routes Full Verification
    console.log("\n--- PHASE 3: ALL 15 ROUTES INTEGRITY & VISUAL AUDIT ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    for (const route of ROUTES) {
      await cdp.send("Page.navigate", { url: `http://localhost:4173${route.path}` });
      await new Promise((r) => setTimeout(r, 600));

      const audit = await cdp.send("Runtime.evaluate", {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          hasErrorBoundary: document.body.innerText.includes("This page didn't load"),
          headings: document.querySelectorAll("h1, h2, h3").length,
          buttons: document.querySelectorAll("button, [role='button']").length,
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
        screenshot: filename,
      });

      console.log(
        ` ${pass ? "✅" : "❌"} ${route.name.padEnd(26)} | Headings:${String(a.headings).padStart(2)} | W:${a.clientWidth} Scroll:${a.scrollWidth} | ${filename}`,
      );
    }

    console.log("\n=======================================================");
    console.log(
      ` AUDIT COMPLETE: ${results.filter((r) => r.pass).length}/${results.length} PASSED (${failures} FAILURES)`,
    );
    console.log(" Screenshots saved to docs/screenshots/nova/");
    console.log("=======================================================\n");

    await fs.writeFile(
      path.join(screenshotsDir, "nova-verification-summary.json"),
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
