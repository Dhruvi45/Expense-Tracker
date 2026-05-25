// ⚠️  Bump this version string on every deployment so the old cache is wiped.
const CACHE_VERSION = "v3";
const CACHE_NAME = `expense-tracker-${CACHE_VERSION}`;

// Only pre-cache the offline fallback page — NOT real routes.
// Next.js HTML pages must always be fetched fresh so UI changes appear immediately.
const PRECACHE_URLS = ["/offline"];

// Install: pre-cache offline fallback only
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // addAll fails silently if the page doesn't exist, so use individual adds
        Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              /* offline page may not exist yet – ignore */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// Activate: delete every cache that doesn't match the current version
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests entirely
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // ── Next.js hashed static chunks (/\_next/static/) ──────────────────────
  // These filenames are content-hashed by Next.js, so it is safe to cache
  // them indefinitely. Serve from cache, fall back to network.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ── API routes ───────────────────────────────────────────────────────────
  // Always network-only; never serve stale API data from cache.
  if (url.pathname.startsWith("/api/")) {
    return; // let the browser handle it normally
  }

  // ── Static public assets (icons, images) ────────────────────────────────
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ── Page navigations (HTML) ──────────────────────────────────────────────
  // Network-first, NO caching of HTML responses.
  // This guarantees that new deployments are always reflected immediately.
  // Falls back to the offline page if the network is unavailable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then(
          (offline) => offline || new Response("You are offline.", { status: 503 })
        )
      )
    );
    return;
  }
});

// Notify all open tabs when a new SW has taken control so they can reload.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
