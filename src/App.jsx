import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { CONFIG } from "./config.js";
import {
  idbGet,
  idbWrite,
  idbDeleteDatabase,
  loadPrefs,
  savePrefs,
  clearAppLocalStorage,
} from "./lib/storage.js";
import {
  deriveKey,
  encryptJSON,
  decryptJSON,
  randomSaltB64,
  isEncrypted,
  isValidPin,
} from "./lib/encryption.js";
import { analyze } from "./lib/cycle.js";
import { evaluateSafety } from "./lib/safetyRules.js";
import { buildDemo } from "./data/demo.js";
import { emptyRecord, normalizeRecord, mergeRecords, blankDay } from "./lib/exportImport.js";
import { todayStr, formatDate, formatRange, addDays, isValidDate } from "./lib/localDate.js";
import { translate, pick } from "./i18n/index.js";
import {
  isStandalone,
  registerServiceWorker,
  applyServiceWorkerUpdate,
  setDeferredPrompt,
  promptPwaInstall,
  clearAppCaches,
} from "./lib/pwa.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const storeKey = (m) => (m?.mode === "demo" ? "demo" : "real");

export function AppProvider({ children }) {
  const [prefs, setPrefsState] = useState(loadPrefs); // rendered only on the client (ClientOnly)
  const [status, setStatus] = useState("loading"); // loading | onboarding | locked | ready | error
  const [meta, setMeta] = useState(null);
  const [record, setRecord] = useState(null);
  const [banners, setBanners] = useState([]);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : true,
  );
  const [isInstalled, setIsInstalled] = useState(isStandalone);
  const [canInstall, setCanInstall] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const keyRef = useRef(null);
  const stateRef = useRef({ meta: null, record: null });
  const writes = useRef(Promise.resolve());
  const today = todayStr();

  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => {
      const n = { ...p, ...patch };
      savePrefs(n);
      return n;
    });
  }, []);

  const t = useCallback((k, v) => translate(prefs.lang, k, v), [prefs.lang]);
  const L = useCallback((o) => pick(prefs.lang, o), [prefs.lang]);
  const fmt = useCallback((d, o) => formatDate(d, prefs.lang, o), [prefs.lang]);
  const fmtRange = useCallback((a, b) => formatRange(a, b, prefs.lang), [prefs.lang]);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const m = await idbGet("meta");
        if (!m?.onboarded) return setStatus("onboarding");
        setMeta(m);
        if (m.pin?.enabled) return setStatus("locked");
        const r = await idbGet(storeKey(m));
        if (isEncrypted(r)) return setStatus("locked");
        const normalized = normalizeRecord(r);
        stateRef.current = { meta: m, record: normalized };
        setRecord(normalized);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  // PWA offline state, installation prompt and service worker updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    registerServiceWorker(() => setUpdateWaiting(true));

    if ("serviceWorker" in navigator) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Apply display prefs & theme
  useEffect(() => {
    const h = document.documentElement;
    h.dataset.text = prefs.textSize || "md";
    h.classList.toggle("hc", !!prefs.contrast);
    h.lang = prefs.lang === "hi" ? "hi" : "en";

    const updateTheme = () => {
      const mode = prefs.theme || "system";
      const isDark =
        mode === "dark" ||
        (mode === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      h.classList.toggle("dark", isDark);
    };

    updateTheme();

    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        if (!prefs.theme || prefs.theme === "system") {
          updateTheme();
        }
      };
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [prefs]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const isRtl = prefs.lang === "ur";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = prefs.lang || "en";
    const id = setTimeout(() => {
      if (prefs.discreet) document.title = translate(prefs.lang, "app.discreetName");
      else if (!document.title || document.title === "Diary" || document.title === "डायरी")
        document.title = translate(prefs.lang, "app.name");
    }, 0);
    return () => clearTimeout(id);
  }, [prefs.discreet, prefs.lang, pathname]);

  async function writeRecord(next, nextMeta = meta, extraDeletes = []) {
    const value = keyRef.current ? await encryptJSON(keyRef.current, next) : next;
    await idbWrite(
      [
        ["meta", nextMeta],
        [storeKey(nextMeta), value],
      ],
      extraDeletes,
    );
    setMeta(nextMeta);
    setRecord(next);
    stateRef.current = { meta: nextMeta, record: next };
  }

  // Serialize mutations and read the last committed record, not a stale render.
  function mutate(fn) {
    const task = writes.current.then(() => fn(stateRef.current));
    writes.current = task.catch(() => {});
    return task;
  }

  const api = {
    async saveDay(entry) {
      return mutate(({ record: r, meta: m }) =>
        writeRecord({ ...r, days: { ...r.days, [entry.date]: entry } }, m),
      );
    },
    async deleteDay(date) {
      return mutate(({ record: r, meta: m }) => {
        const days = { ...r.days };
        delete days[date];
        return writeRecord({ ...r, days }, m);
      });
    },
    async update(fn) {
      return mutate(({ record: r, meta: m }) => writeRecord(fn(r), m));
    },
    async chooseDemo(ageGroup) {
      const m = { onboarded: true, mode: "demo", pin: { enabled: false } };
      const r = buildDemo(todayStr());
      if (ageGroup) r.settings.ageGroup = ageGroup;
      keyRef.current = null;
      await writeRecord(r, m);
      setStatus("ready");
    },
    async chooseFresh(ageGroup) {
      const r = emptyRecord();
      r.settings.ageGroup = ageGroup || "adult";
      if (r.settings.ageGroup === "under18") r.settings.showFertility = false;
      const m = { onboarded: true, mode: "real", pin: meta?.pin || { enabled: false } };
      await writeRecord(r, m, ["demo"]);
      setStatus("ready");
    },
    async completeOnboarding({
      mode = "real",
      ageGroup = "under18",
      pin = null,
      firstPeriodDate = null,
      discreet = false,
      lang = null,
    } = {}) {
      if (lang) {
        setPrefs({ lang, ...(discreet ? { discreet: true } : {}) });
      } else if (discreet) {
        setPrefs({ discreet: true });
      }

      if (mode === "demo") {
        return api.chooseDemo(ageGroup);
      }

      const r = emptyRecord();
      r.settings.ageGroup = ageGroup || "under18";
      if (r.settings.ageGroup === "under18") r.settings.showFertility = false;

      if (firstPeriodDate && isValidDate(firstPeriodDate)) {
        r.days[firstPeriodDate] = {
          ...blankDay(firstPeriodDate),
          period: true,
          flow: "medium",
          pain: 0,
          painStoppedActivities: false,
          symptoms: [],
        };
      }

      if (pin && isValidPin(pin)) {
        const salt = randomSaltB64();
        const iterations = CONFIG.pbkdf2Iterations;
        const key = await deriveKey(pin, salt, iterations);
        const nextMeta = {
          onboarded: true,
          mode: "real",
          pin: { enabled: true, salt, iterations, kdf: "PBKDF2-SHA256", cipher: "AES-GCM-256" },
        };
        const ct = await encryptJSON(key, r);
        await idbWrite(
          [
            ["meta", nextMeta],
            [storeKey(nextMeta), ct],
          ],
          ["demo"],
        );
        keyRef.current = key;
        setMeta(nextMeta);
        setRecord(r);
        stateRef.current = { meta: nextMeta, record: r };
        setStatus("ready");
      } else {
        const nextMeta = { onboarded: true, mode: "real", pin: { enabled: false } };
        await writeRecord(r, nextMeta, ["demo"]);
        setStatus("ready");
      }
    },
    async exitDemo() {
      const r = emptyRecord();
      r.settings.ageGroup = record.settings.ageGroup;
      r.settings.showFertility = r.settings.ageGroup !== "under18";
      await writeRecord(r, { ...meta, mode: "real" }, ["demo"]);
    },
    async tryDemo() {
      if (Object.keys(record.days).length) throw new Error("Demo requires an empty diary");
      const r = buildDemo(todayStr());
      await writeRecord(r, { ...meta, mode: "demo" }, ["real"]);
    },
    async unlock(pin) {
      const key = await deriveKey(pin, meta.pin.salt, meta.pin.iterations);
      const payload = await idbGet(storeKey(meta));
      const r = await decryptJSON(key, payload); // throws on wrong PIN / corrupt data
      keyRef.current = key;
      setRecord(normalizeRecord(r));
      stateRef.current = { meta, record: normalizeRecord(r) };
      setStatus("ready");
    },
    lock() {
      keyRef.current = null;
      stateRef.current = { meta, record: null };
      setRecord(null);
      setBanners([]);
      setStatus("locked");
    },
    async enablePin(pin) {
      const salt = randomSaltB64();
      const iterations = CONFIG.pbkdf2Iterations;
      const key = await deriveKey(pin, salt, iterations);
      const nextMeta = {
        ...meta,
        pin: { enabled: true, salt, iterations, kdf: "PBKDF2-SHA256", cipher: "AES-GCM-256" },
      };
      const ct = await encryptJSON(key, record);
      await idbWrite([
        ["meta", nextMeta],
        [storeKey(nextMeta), ct],
      ]);
      keyRef.current = key;
      setMeta(nextMeta);
      stateRef.current.meta = nextMeta;
    },
    async verifyPin(pin) {
      const key = await deriveKey(pin, meta.pin.salt, meta.pin.iterations);
      await decryptJSON(key, await idbGet(storeKey(meta)));
      return key;
    },
    async disablePin(pin) {
      await api.verifyPin(pin);
      const nextMeta = { ...meta, pin: { enabled: false } };
      await idbWrite([
        ["meta", nextMeta],
        [storeKey(nextMeta), record],
      ]);
      keyRef.current = null;
      setMeta(nextMeta);
      stateRef.current.meta = nextMeta;
    },
    async changePin(oldPin, newPin) {
      await api.verifyPin(oldPin);
      const salt = randomSaltB64();
      const key = await deriveKey(newPin, salt, CONFIG.pbkdf2Iterations);
      const nextMeta = {
        ...meta,
        pin: { ...meta.pin, enabled: true, salt, iterations: CONFIG.pbkdf2Iterations },
      };
      const ct = await encryptJSON(key, record);
      await idbWrite([
        ["meta", nextMeta],
        [storeKey(nextMeta), ct],
      ]);
      keyRef.current = key;
      setMeta(nextMeta);
      stateRef.current.meta = nextMeta;
    },
    async importRecord(incoming, strategy) {
      if (meta?.mode === "demo") throw new Error("Import is unavailable in demo mode");
      return mutate(({ record: r, meta: m }) =>
        writeRecord(mergeRecords(r, incoming, strategy), m),
      );
    },
    async restoreFromBackup(importedRecord) {
      const normalized = normalizeRecord(importedRecord);
      const m = { onboarded: true, mode: "real", pin: { enabled: false } };
      keyRef.current = null;
      await writeRecord(normalized, m, ["demo"]);
      setStatus("ready");
    },
    async installApp() {
      const res = await promptPwaInstall();
      if (res?.outcome === "accepted") {
        setCanInstall(false);
        setIsInstalled(true);
      }
      return res;
    },
    applyUpdate() {
      applyServiceWorkerUpdate();
    },
    dismissUpdate() {
      setUpdateWaiting(false);
    },
    async deleteAll() {
      await idbDeleteDatabase();
      clearAppLocalStorage();
      await clearAppCaches();
      keyRef.current = null;
      window.location.replace("/");
    },
  };

  const settings = record?.settings;
  const analysis = useMemo(
    () =>
      record
        ? analyze(record.days, {
            ageGroup: settings.ageGroup,
            today,
            paused: record.pregnancy.active || settings.trackingPaused,
          })
        : null,
    [record, today],
  );
  const safety = useMemo(
    () => (record && analysis ? evaluateSafety({ record, analysis, today }) : null),
    [record, analysis, today],
  );
  const fertilityVisible =
    !!settings &&
    (settings.ageGroup === "adult"
      ? settings.showFertility !== false
      : settings.fertilityOptIn === true);
  const pregnancyVisible =
    !!settings && (settings.ageGroup === "adult" || settings.pregnancyOptIn === true);

  // ---- Reminders (only while the app is open) ----
  const fired = useRef(new Set());
  const fire = useCallback(
    (msgKey, vars) => {
      const text = prefs.discreet
        ? translate(prefs.lang, "rem.msg.checkin")
        : msgKey === "__custom"
          ? record?.reminders.custom.text || ""
          : translate(prefs.lang, msgKey, vars);
      const title = translate(prefs.lang, prefs.discreet ? "app.discreetName" : "app.name");
      let shown = false;
      if (
        record?.reminders.notify &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body: text, tag: "saheli" });
          shown = true;
        } catch {
          shown = false;
        }
      }
      if (!shown) setBanners((b) => [...b, { id: Date.now() + Math.random(), text }]);
    },
    [prefs.discreet, prefs.lang, record],
  );

  useEffect(() => {
    if (status !== "ready" || !record) return;
    const tick = () => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const d = todayStr(now);
      const r = record.reminders;
      const once = (id, fn) => {
        const k = `${id}-${d}-${hm}`;
        if (!fired.current.has(k)) {
          fired.current.add(k);
          fn();
        }
      };
      if (r.daily.on && r.daily.time === hm) once("daily", () => fire("rem.msg.daily"));
      r.medicines.forEach(
        (m, i) => m.time === hm && once(`med${i}`, () => fire("rem.msg.med", { name: m.name })),
      );
      if (r.custom.on && r.custom.time === hm && r.custom.text)
        once("custom", () => fire(prefs.discreet ? "rem.msg.checkin" : "__custom", {}));
      if (
        r.nextPeriod &&
        analysis?.prediction &&
        addDays(analysis.prediction.start, -1) === d &&
        hm === "09:00"
      )
        once("np", () => fire("rem.msg.period"));
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [status, record, analysis, fire, prefs.discreet]);

  const bannersView = banners;

  const value = {
    prefs,
    setPrefs,
    t,
    L,
    fmt,
    fmtRange,
    lang: prefs.lang,
    today,
    status,
    meta,
    record,
    analysis,
    safety,
    fertilityVisible,
    pregnancyVisible,
    isDemo: meta?.mode === "demo",
    isOnline,
    canInstall,
    isInstalled,
    updateWaiting,
    banners: prefs.discreet
      ? bannersView.map((b) => ({ ...b, text: t("rem.msg.checkin") }))
      : bannersView,
    dismissBanner: (id) => setBanners((b) => b.filter((x) => x.id !== id)),
    fire,
    ...api,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
