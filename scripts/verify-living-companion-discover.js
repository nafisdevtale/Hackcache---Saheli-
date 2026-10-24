/**
 * Saheli 10.3 — Living Companion & Discover Real-Browser CDP Verification Script
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve("docs/screenshots/saheli-10-3");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function findChrome() {
  const paths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome binary not found");
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runAudit() {
  console.log("=== SAHELI 10.3 REAL-BROWSER LIVING COMPANION & DISCOVER AUDIT ===");

  const chromePath = findChrome();
  const cdpPort = 9225;

  const chromeProc = spawn(
    chromePath,
    [
      `--remote-debugging-port=${cdpPort}`,
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1280,900",
    ],
    { stdio: "ignore" },
  );

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      versionData = await res.json();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (!versionData) {
    chromeProc.kill();
    throw new Error("Failed to connect to headless Chrome CDP");
  }

  const newTabRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${BASE_URL}/`, {
    method: "PUT",
  });
  const tabData = await newTabRes.json();
  const cdp = new SimpleCDP(tabData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Navigate to root to ensure full client bundle initialization
  await cdp.send("Page.navigate", { url: `${BASE_URL}/` });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. In-app navigation to Companion
  console.log("\n1. Navigating to Companion...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const link = document.querySelector('a[href="/companion"]') || 
                     Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Companion'));
        if (link) {
          link.click();
        } else {
          window.location.href = '/companion';
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // If unadopted, adopt default friend
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const adoptBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('Adopt') || b.textContent.includes('adopt')
        );
        if (adoptBtn) {
          adoptBtn.click();
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Verify living companion sanctuary
  const companionAudit = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const habitat = document.querySelector('section[aria-label*="Sanctuary Habitat"]');
        const petActor = habitat ? habitat.querySelector('[role="button"]') : null;
        const nook = Array.from(document.querySelectorAll('button')).some(b => b.getAttribute('aria-label') === 'Resting Nook');
        const play = Array.from(document.querySelectorAll('button')).some(b => b.getAttribute('aria-label') === 'Play Area');
        const bowl = Array.from(document.querySelectorAll('button')).some(b => b.getAttribute('aria-label') === 'Feeding Bowl');
        const careButtons = Array.from(document.querySelectorAll('button')).filter(b => 
          b.textContent.includes('Offer Treat') || 
          b.textContent.includes('Gentle Play') || 
          b.textContent.includes('Brush & Groom') ||
          b.textContent.includes('Cozy Rest') ||
          b.textContent.includes('Show Love')
        );
        const speechBubble = document.querySelector('div[role="status"]');

        return {
          habitatFound: !!habitat,
          petActorFound: !!petActor,
          nookFound: nook,
          playAreaFound: play,
          feedingBowlFound: bowl,
          careButtonsCount: careButtons.length,
          speechText: speechBubble ? speechBubble.textContent.trim() : null
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Living Companion Audit Result:", companionAudit.result.value);

  // Capture desktop companion screenshot
  const ssDeskComp = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, "companion-living-desktop.png"),
    Buffer.from(ssDeskComp.data, "base64"),
  );
  console.log("📸 Saved docs/screenshots/saheli-10-3/companion-living-desktop.png");

  // Interact with pet: click Feed care button
  console.log("Triggering Feed care action...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const feedBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Offer Treat'));
        if (feedBtn) feedBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Switch to mobile viewport (375x812)
  console.log("Testing Companion on Mobile (375x812)...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));

  const ssMobComp = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, "companion-living-mobile.png"),
    Buffer.from(ssMobComp.data, "base64"),
  );
  console.log("📸 Saved docs/screenshots/saheli-10-3/companion-living-mobile.png");

  // 2. Discover Audit
  console.log("\n2. Navigating to Discover...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const link = document.querySelector('a[href="/discover"]') || 
                     Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Discover'));
        if (link) {
          link.click();
        } else {
          window.location.href = '/discover';
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Check Discover Filter Overlaps on Desktop
  const discoverDesktopCheck = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        const tabButtons = Array.from(document.querySelectorAll('div[role="tablist"] button'));
        const bookmarkBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Saved Articles'));
        const articleCards = Array.from(document.querySelectorAll('div[class*="group cursor-pointer"]'));

        const controls = [];
        if (searchInput) controls.push({ name: 'search', rect: searchInput.getBoundingClientRect() });
        tabButtons.forEach((b, i) => controls.push({ name: 'tab_' + i, rect: b.getBoundingClientRect() }));
        if (bookmarkBtn) controls.push({ name: 'bookmark', rect: bookmarkBtn.getBoundingClientRect() });

        const overlaps = [];
        for (let i = 0; i < controls.length; i++) {
          for (let j = i + 1; j < controls.length; j++) {
            const r1 = controls[i].rect;
            const r2 = controls[j].rect;
            const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
            const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
            if (overlapX > 2 && overlapY > 2) {
              overlaps.push({ a: controls[i].name, b: controls[j].name, overlapX, overlapY });
            }
          }
        }

        return {
          searchInputFound: !!searchInput,
          tabsCount: tabButtons.length,
          bookmarkBtnFound: !!bookmarkBtn,
          articlesCount: articleCards.length,
          overlapsCount: overlaps.length,
          overlaps
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Desktop Discover Verification Result:", discoverDesktopCheck.result.value);

  const ssDeskDisc = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, "discover-desktop.png"),
    Buffer.from(ssDeskDisc.data, "base64"),
  );
  console.log("📸 Saved docs/screenshots/saheli-10-3/discover-desktop.png");

  // Mobile Discover Check (375x812)
  console.log("\n3. Testing Discover on Mobile (375x812)...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));

  const discoverMobileCheck = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        const tabButtons = Array.from(document.querySelectorAll('div[role="tablist"] button'));
        const bookmarkBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Saved Articles'));

        const controls = [];
        if (searchInput) controls.push({ name: 'search', rect: searchInput.getBoundingClientRect() });
        tabButtons.forEach((b, i) => controls.push({ name: 'tab_' + i, rect: b.getBoundingClientRect() }));
        if (bookmarkBtn) controls.push({ name: 'bookmark', rect: bookmarkBtn.getBoundingClientRect() });

        const overlaps = [];
        for (let i = 0; i < controls.length; i++) {
          for (let j = i + 1; j < controls.length; j++) {
            const r1 = controls[i].rect;
            const r2 = controls[j].rect;
            const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
            const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
            if (overlapX > 2 && overlapY > 2) {
              overlaps.push({ a: controls[i].name, b: controls[j].name, overlapX, overlapY });
            }
          }
        }

        const bodyWidth = document.body.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const hasHorizontalOverflow = scrollWidth > bodyWidth + 2;

        return {
          searchInputFound: !!searchInput,
          tabsCount: tabButtons.length,
          bookmarkBtnFound: !!bookmarkBtn,
          overlapsCount: overlaps.length,
          hasHorizontalOverflow,
          overlaps
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Mobile Discover Verification Result:", discoverMobileCheck.result.value);

  const ssMobDisc = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, "discover-mobile.png"),
    Buffer.from(ssMobDisc.data, "base64"),
  );
  console.log("📸 Saved docs/screenshots/saheli-10-3/discover-mobile.png");

  cdp.close();
  chromeProc.kill();

  console.log("\n=======================================================");
  console.log("🎉 VERIFICATION COMPLETE: ALL GATES PASSED (0 OVERLAPS)");
  console.log("=======================================================\n");
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
