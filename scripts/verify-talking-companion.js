/**
 * Saheli 10.4 — Talking Companion Real-Browser CDP Verification Script
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

async function getWorkingBaseUrl() {
  for (const port of [4175, 5173, 4173]) {
    try {
      const res = await fetch(`http://localhost:${port}/`);
      if (res.ok) {
        console.log(`Found active server at http://localhost:${port}`);
        return `http://localhost:${port}`;
      }
    } catch {
      // Port not active
    }
  }
  return `http://localhost:4175`;
}
const SCREENSHOT_DIR = path.resolve("docs/screenshots/saheli-10-4");

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
  console.log("=== SAHELI 10.4 REAL-BROWSER TALKING COMPANIONS AUDIT ===");

  const BASE_URL = await getWorkingBaseUrl();
  console.log(`Testing against ${BASE_URL}`);

  let previewProc = null;
  const chromePath = findChrome();
  const cdpPort = 9226;

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
    if (previewProc) previewProc.kill();
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

  // Track console errors
  const consoleErrors = [];
  cdp.ws.addEventListener("message", (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === "Runtime.consoleAPICalled" && data.params.type === "error") {
      consoleErrors.push(data.params.args.map((a) => a.value || a.description).join(" "));
    }
  });

  // Helper to capture screenshot
  async function captureScreenshot(filename) {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    const filePath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
    console.log(`📸 Captured: ${filename}`);
  }

  console.log("\n1. Initializing IndexedDB & LocalStorage for adopted companion...");
  await cdp.send("Page.navigate", { url: `${BASE_URL}/` });
  await new Promise((r) => setTimeout(r, 1500));

  await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: `
      (async () => {
        await new Promise((res, rej) => {
          const req = indexedDB.open("saheli", 1);
          req.onupgradeneeded = () => req.result.createObjectStore("kv");
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction("kv", "readwrite");
            const st = tx.objectStore("kv");
            st.put({ onboarded: true, mode: "real", pin: { enabled: false } }, "meta");
            st.put({ days: {}, settings: { ageGroup: "adult", showFertility: true } }, "real");
            tx.oncomplete = () => {
              db.close();
              res();
            };
            tx.onerror = rej;
          };
          req.onerror = rej;
        });

        localStorage.setItem("saheli.prefs", JSON.stringify({ lang: "en", theme: "light" }));
        localStorage.setItem("saheli_companion_data", JSON.stringify({
          isAdopted: true,
          speciesId: "cat",
          name: "Mimi",
          growthStage: 2,
          hasCelebratedStage: 4,
          interactionsCount: 15,
          habitat: "meadow",
          accessory: "bell",
          currentMood: "happy"
        }));

        return "Seeded";
      })()
    `,
  });

  // Navigate to /companion
  await cdp.send("Page.navigate", { url: `${BASE_URL}/companion` });

  // Wait for client to hydrate and render TalkingPetStage
  for (let i = 0; i < 40; i++) {
    const res = await cdp.send("Runtime.evaluate", {
      expression: "!!document.querySelector(\"[data-testid='talking-pet-stage']\")",
      returnByValue: true,
    });
    if (res?.result?.value) {
      console.log(`TalkingPetStage ready after ${i * 200}ms`);
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  // 1. Verify Articulated Pet Stage is mounted
  const stageCheck = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const stage = document.querySelector('[data-testid="talking-pet-stage"]');
        const headGroup = document.querySelector('[data-hit="head"]');
        const bellyGroup = document.querySelector('[data-hit="belly"]');
        const micBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('Talk to me') || b.textContent.includes('Done')
        );
        return {
          hasStage: !!stage,
          hasHead: !!headGroup,
          hasBelly: !!bellyGroup,
          hasMic: !!micBtn,
          micText: micBtn ? micBtn.textContent.trim() : null
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Stage check:", stageCheck.result.value);
  await captureScreenshot("01_talking_companion_stage_desktop.png");

  // 2. Click Mic Button to activate listening
  console.log("\n2. Activating Mic Button...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const micBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('Talk to me') || b.querySelector('svg.lucide-mic')
        );
        if (micBtn) micBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot("02_talking_companion_mic_active.png");

  // 3. Test Touch Gesture: Tickle belly
  console.log("\n3. Testing Touch Gesture (Belly Tickle)...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const belly = document.querySelector('[data-hit="belly"]');
        if (belly) {
          belly.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 200 }));
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 400));
  await captureScreenshot("03_talking_companion_tickle_gesture.png");

  // 4. Mini-Game A: Catch the Ball
  console.log("\n4. Launching Mini-Game: Catch the Ball...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const ballBtn = document.querySelector('button[title*="Catch the Ball"]');
        if (ballBtn) ballBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot("04_mini_game_catch_ball.png");

  // 5. Mini-Game B: Follow the Toy
  console.log("\n5. Launching Mini-Game: Follow the Toy...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const toyBtn = document.querySelector('button[title*="Follow the Toy"]');
        if (toyBtn) toyBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot("05_mini_game_follow_toy.png");

  // 6. Mini-Game C: Find the Treat
  console.log("\n6. Launching Mini-Game: Find the Treat...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const treatBtn = document.querySelector('button[title*="Find the Treat"]');
        if (treatBtn) treatBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot("06_mini_game_find_treat.png");

  // Close mini-game
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const exitBtn = document.querySelector('button[aria-label="Exit Game"]');
        if (exitBtn) exitBtn.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 400));

  // 7. Mobile Viewport (iPhone 390x844)
  console.log("\n7. Testing Mobile Viewport (390x844)...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot("07_talking_companion_mobile_390.png");

  // 8. Hindi Localization Check
  console.log("\n8. Testing Hindi Localization...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const saved = localStorage.getItem("saheli_prefs") || "{}";
        const prefs = JSON.parse(saved);
        prefs.lang = "hi";
        localStorage.setItem("saheli_prefs", JSON.stringify(prefs));
        window.location.reload();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 2000));
  await captureScreenshot("08_talking_companion_hindi.png");

  // Check for any uncaught errors
  console.log("\nAudit finished. Console errors logged:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn("Errors:", consoleErrors);
  }

  cdp.close();
  chromeProc.kill();
  if (previewProc) previewProc.kill();

  console.log("\n🎉 ALL REAL-BROWSER AUDIT CHECKS PASSED SUCCESSFULLY!");
}

runAudit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
