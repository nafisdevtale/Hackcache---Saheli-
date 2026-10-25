// IndexedDB for personal records; localStorage only for non-sensitive UI prefs.
const DB = "saheli";
const STORE = "kv";
const PREFS_KEY = "saheli.prefs";

function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => {
      r.result.onversionchange = () => r.result.close();
      res(r.result);
    };
    r.onerror = () => rej(r.error);
  });
}

export async function idbGet(key) {
  const db = await open();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const q = tx.objectStore(STORE).get(key);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
    tx.oncomplete = () => db.close();
  });
}

// Atomic multi-key write: all puts/deletes succeed or none do.
export async function idbWrite(puts = [], deletes = []) {
  const db = await open();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    for (const [k, v] of puts) st.put(v, k);
    for (const k of deletes) st.delete(k);
    tx.oncomplete = () => {
      db.close();
      res();
    };
    tx.onerror = () => {
      db.close();
      rej(tx.error);
    };
    tx.onabort = () => {
      db.close();
      rej(tx.error || new Error("aborted"));
    };
  });
}

export async function idbDel(key) {
  return idbWrite([], [key]);
}

export function idbDeleteDatabase() {
  return new Promise((res, rej) => {
    const r = indexedDB.deleteDatabase(DB);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error("Close other Saheli tabs before deleting data"));
  });
}

export const DEFAULT_PREFS = {
  lang: "en",
  textSize: "md",
  contrast: false,
  theme: "system", // "light" | "dark" | "system"
  readAloud: false,
  discreet: false,
  latinNumerals: false, // Default is false: non-English languages automatically use native script numerals
  useLatinNumerals: false,
  nativeNumerals: true,
};
let memoryStore = {};

function getStorage(type = "localStorage") {
  try {
    if (typeof window !== "undefined" && window[type]) {
      const k = "__saheli_test__";
      window[type].setItem(k, "1");
      window[type].removeItem(k);
      return window[type];
    }
  } catch {
    /* access denied or disabled in private browsing */
  }
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
    setItem: (k, v) => {
      memoryStore[k] = String(v);
    },
    removeItem: (k) => {
      delete memoryStore[k];
    },
    clear: () => {
      memoryStore = {};
    },
  };
}

export function loadPrefs() {
  try {
    const store = getStorage("localStorage");
    return { ...DEFAULT_PREFS, ...JSON.parse(store?.getItem(PREFS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}
export function savePrefs(p) {
  try {
    const store = getStorage("localStorage");
    store?.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* access denied */
  }
}
export function clearAppLocalStorage() {
  try {
    const store = getStorage("localStorage");
    if (store) {
      Object.keys(store)
        .filter((k) => k.startsWith("saheli."))
        .forEach((k) => store.removeItem(k));
    }
  } catch {
    /* unavailable */
  }
  try {
    const sStore = getStorage("sessionStorage");
    if (sStore) {
      Object.keys(sStore)
        .filter((k) => k.startsWith("saheli."))
        .forEach((k) => sStore.removeItem(k));
    }
  } catch {
    /* unavailable */
  }
}
