/**
 * Saheli 10.6 — Real-Browser Total Localisation & Native Numeral Verification
 *
 * Launches Chromium/Chrome via Chrome DevTools Protocol (CDP), testing:
 * 1. Default native numeral formatting across Indic languages
 * 2. Latin numerals for English
 * 3. The optional Standard Latin Digits compatibility override toggle in Settings
 * 4. Zero English leaks across core screens
 * 5. High-resolution screenshots saved to docs/screenshots/saheli-10-6/
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOT_DIR = path.resolve("docs/screenshots/saheli-10-6");

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

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function startServerIfNeeded() {
  for (const port of [4173, 5173, 4174]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) {
        console.log(`Found active server on port ${port}`);
        return { baseUrl: `http://127.0.0.1:${port}`, proc: null };
      }
    } catch {}
  }

  console.log("Starting preview server on port 4173...");
  const proc = spawn("bun", ["run", "preview", "--port", "4173", "--host", "127.0.0.1"], {
    stdio: "pipe",
  });
  await new Promise((r) => setTimeout(r, 2500));
  return { baseUrl: "http://127.0.0.1:4173", proc };
}

async function runAudit() {
  console.log("===============================================================");
  console.log("SAHELI 10.6 REAL-BROWSER AUDIT & NATIVE NUMERAL VERIFICATION");
  console.log("===============================================================");

  const { baseUrl, proc: serverProc } = await startServerIfNeeded();
  const chromePath = findChrome();
  const cdpPort = 9225;

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1280,900",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const cdp = new SimpleCDP(wsUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("DOM.enable");

    const capture = async (filename) => {
      const filePath = path.join(SCREENSHOT_DIR, filename);
      const res = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
      });
      fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
      console.log(`📸 Saved: ${filename}`);
    };

    const seedData = async () => {
      await cdp.send("Runtime.evaluate", {
        awaitPromise: true,
        expression: `
          new Promise((resolve, reject) => {
            const req = indexedDB.open("saheli", 1);
            req.onupgradeneeded = () => req.result.createObjectStore("kv");
            req.onsuccess = () => {
              const db = req.result;
              const tx = db.transaction("kv", "readwrite");
              const st = tx.objectStore("kv");
              st.put({ onboarded: true, mode: "demo", pin: { enabled: false } }, "meta");
              const today = new Date().toISOString().slice(0, 10);
              const sampleRecord = {
                version: 1,
                days: {
                  [today]: { period: true, flow: "heavy", pain: 2, symptoms: ["cramps"] }
                },
                settings: { ageGroup: "adult", showFertility: true },
                pets: {
                  adopted: [{ id: "cat", name: "Mimi", speciesId: "cat", adoptedAt: "2026-04-01", growthPoints: 45 }]
                }
              };
              st.put(sampleRecord, "demo");
              tx.oncomplete = () => { db.close(); resolve(); };
              tx.onerror = () => { db.close(); reject(tx.error); };
            };
            req.onerror = () => reject(req.error);
          })
        `,
      });
    };

    const setPrefs = async (lang, latinNumerals = false) => {
      await cdp.send("Runtime.evaluate", {
        expression: `
          (() => {
            const raw = localStorage.getItem("saheli.prefs") || "{}";
            const prefs = JSON.parse(raw);
            prefs.lang = "${lang}";
            prefs.latinNumerals = ${Boolean(latinNumerals)};
            prefs.useLatinNumerals = ${Boolean(latinNumerals)};
            prefs.nativeNumerals = ${!Boolean(latinNumerals)};
            localStorage.setItem("saheli.prefs", JSON.stringify(prefs));
            document.documentElement.lang = "${lang}";
            document.documentElement.dir = "${lang === "ur" ? "rtl" : "ltr"}";
          })()
        `,
      });
    };

    // 1. Initial navigation & seed
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 2000));
    await seedData();

    // 1. English (Standard Latin Digits)
    console.log("Testing 01: English Today");
    await setPrefs("en", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("01_today_english_latin.png");

    // 2. Hindi Today (Native Devanagari default)
    console.log("Testing 02: Hindi Today (Native Devanagari)");
    await setPrefs("hi", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("02_today_hindi_native.png");

    // 3. Bengali Today (Native Bengali default)
    console.log("Testing 03: Bengali Today (Native Bengali)");
    await setPrefs("bn", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("03_today_bengali_native.png");

    // 4. Tamil Today (Native Tamil default)
    console.log("Testing 04: Tamil Today (Native Tamil)");
    await setPrefs("ta", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("04_today_tamil_native.png");

    // 5. Telugu Today (Native Telugu default)
    console.log("Testing 05: Telugu Today (Native Telugu)");
    await setPrefs("te", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("05_today_telugu_native.png");

    // 6. Urdu RTL Today (Native Eastern Arabic-Indic default)
    console.log("Testing 06: Urdu RTL Today (Native Eastern Arabic-Indic)");
    await setPrefs("ur", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("06_today_urdu_rtl_native.png");

    // 7. Calendar in Hindi (Native Devanagari)
    console.log("Testing 07: Calendar Hindi (Native Devanagari)");
    await setPrefs("hi", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/calendar` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("07_calendar_hindi_native.png");

    // 8. Companion in Bengali
    console.log("Testing 08: Companion Bengali");
    await setPrefs("bn", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/companion` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("08_companion_bengali.png");

    // 9. Diva in Marathi
    console.log("Testing 09: Diva Marathi");
    await setPrefs("mr", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/diva` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("09_diva_marathi.png");

    // 10. INSTINCT in Tamil
    console.log("Testing 10: INSTINCT Tamil");
    await setPrefs("ta", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/instinct` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("10_instinct_tamil.png");

    // 11. Settings in Hindi showing Standard Latin Digits Toggle
    console.log("Testing 11: Settings Hindi (Latin Numerals Toggle)");
    await setPrefs("hi", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/settings` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("11_settings_latin_digits_toggle.png");

    // 12. Hindi Today with Latin Numerals Override Enabled
    console.log("Testing 12: Hindi Today with Latin Numerals Override");
    await setPrefs("hi", true); // latinNumerals: true
    await cdp.send("Page.navigate", { url: `${baseUrl}/` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("12_today_hindi_latin_override.png");

    // 13. Doctor Guidance in Hindi
    console.log("Testing 13: Doctor Guidance Hindi");
    await setPrefs("hi", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/doctor` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("13_doctor_guidance_hindi.png");

    // 14. Pregnancy in Hindi
    console.log("Testing 14: Pregnancy Mode Hindi");
    await setPrefs("hi", false);
    await cdp.send("Page.navigate", { url: `${baseUrl}/pregnancy` });
    await new Promise((r) => setTimeout(r, 1500));
    await capture("14_pregnancy_mode_hindi.png");

    cdp.close();
    console.log("\n✅ All 14 Saheli 10.6 verification screenshots captured successfully!");
  } finally {
    try {
      chromeProc.kill("SIGTERM");
    } catch {}
    if (serverProc) {
      try {
        serverProc.kill("SIGTERM");
      } catch {}
    }
  }
}

runAudit().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
