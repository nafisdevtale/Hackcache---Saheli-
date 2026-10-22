// Saheli Progressive Web App Service Worker
// Versioned offline shell and approved static asset caching.
// PRIVACY NOTICE: Personal cycle records, logs, encrypted payloads, and PINs
// live strictly in IndexedDB/WebCrypto and are NEVER handled or stored by this worker.

const CACHE_VERSION = "v1";
const CACHE_NAME = `saheli-app-shell-${CACHE_VERSION}`;

// Approved app shell assets precached on installation
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

// Offline fallback document for emergency when shell is somehow missing
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Saheli – Offline</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem 1rem; background: #fcf8f6; color: #2d1d1a; text-align: center; }
    .card { max-width: 24rem; margin: 3rem auto; padding: 2rem; background: #ffffff; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #a34438; }
    p { font-size: 1rem; line-height: 1.5; color: #5a423e; }
    button { margin-top: 1.5rem; background: #a34438; color: #ffffff; border: none; border-radius: 0.75rem; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: bold; cursor: pointer; }
    button:focus { outline: 3px solid #e07060; outline-offset: 2px; }
  </style>
</head>
<body>
  <div class="card" role="alert">
    <h1>Saheli – Offline</h1>
    <p>You are currently offline. Connect to the internet once to load the application shell.</p>
    <p>Once loaded, your diary and health guidance will remain fully accessible offline.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;

// Install event: Precache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Add each precache item safely without failing the whole install if one non-critical icon fails
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch {
          // If a single secondary asset fails in dev, continue precaching remaining
        }
      }
    }),
  );
});

// Activate event: purge obsolete caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key.startsWith("saheli-") && key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Safe manual update triggered by user acceptance
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch event: Privacy-safe caching
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Strict privacy rule 1: Only handle GET requests. Never intercept PUT/POST/DELETE.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Strict privacy rule 2: Only intercept same-origin requests.
  // Never cache external medical links (WHO, NHS, eSanjeevani, etc.) or 3rd party calls.
  if (url.origin !== self.location.origin) return;

  // Strict privacy rule 3: Never cache data URLs, blob URLs, or sensitive export endpoints.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.pathname.includes("/export") || url.search.includes("pin") || url.search.includes("key"))
    return;

  // Navigation requests (HTML document loading / route refresh)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              // Also ensure root '/' is synced
              if (url.pathname !== "/") {
                cache.put("/", networkResponse.clone());
              }
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback for navigation: return cached matching document or root shell '/'
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const cachedShell = await caches.match("/");
          if (cachedShell) return cachedShell;

          return new Response(OFFLINE_FALLBACK_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }),
    );
    return;
  }

  // Versioned static assets (/assets/*) — hashed filenames, safe for Cache-First
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // Other same-origin static assets (manifest, icons, favicon) — Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    }),
  );
});
