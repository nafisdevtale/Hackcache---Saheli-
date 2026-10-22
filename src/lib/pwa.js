// Progressive Web App lifecycle, installation and offline management.
// Privacy guarantee: No personal health records are handled or cached by this module.

let deferredPrompt = null;
let swRegistration = null;

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone flag
    !!("standalone" in window.navigator && window.navigator.standalone)
  );
}

export function registerServiceWorker(onUpdateAvailable) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  // Avoid duplicate registrations
  if (swRegistration) {
    return Promise.resolve(swRegistration);
  }

  return navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => {
      swRegistration = reg;

      // Check if an updated worker is already waiting
      if (reg.waiting && onUpdateAvailable) {
        onUpdateAvailable(reg);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // A new version is installed and waiting for activation
            if (onUpdateAvailable) onUpdateAvailable(reg);
          }
        });
      });

      return reg;
    })
    .catch(() => {
      // Gracefully handle registration failure (e.g. unsupported origins or private browsing)
      return null;
    });
}

export function applyServiceWorkerUpdate(reg = swRegistration) {
  if (reg && reg.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

export function setDeferredPrompt(e) {
  deferredPrompt = e;
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export async function promptPwaInstall() {
  if (!deferredPrompt) {
    return { outcome: "unsupported" };
  }
  try {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choice;
  } catch {
    deferredPrompt = null;
    return { outcome: "dismissed" };
  }
}

export async function clearAppCaches() {
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      // Ignore cache clearing errors
    }
  }
}
