// ECRN browser-only service worker. Authenticated HTML is never cached.
//
// Goal: enable PWA install + a basic offline shell. We don't cache any
// dynamic data or auth state in V1; just the app shell HTML/CSS/JS so
// reopening the app while offline still shows the brand.
//
// Strategy:
//   - Network-first for navigation requests (always try fresh HTML).
//   - Cache-first for static assets under /_next/static/ and /icons/.

const CACHE_NAME = "ecrn-shell-v2";
const SHELL_ASSETS = [
  "/offline.html",
  "/brand/ecrn-horizontal-white-512.png",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("ecrn-shell-") && k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Don't touch non-GET or cross-origin
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Cache-first for static assets
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {}));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first for navigation
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html").then((r) => r || new Response("Offline", { status: 503 })))
    );
  }
});
