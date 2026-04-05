// sw.js — FitForge Service Worker
const CACHE_NAME = "fitforge-v13";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./scriptt.js",
  "./styling.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// ── Install: cache all essential assets ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell...");
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// ── Activate: remove outdated caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      ),
    ),
  );
  self.clients.claim();
});

// ── Fetch: cache-first for app shell, network-first for others ──
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // For navigation requests (HTML pages) — network first, cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  // For everything else — cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const clone = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
