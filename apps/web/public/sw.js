const CACHE_NAME = "otiz-shell-v1";
const OFFLINE_ASSETS = ["/offline.html", "/manifest.webmanifest", "/otiz-icon.svg", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("otiz-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_DATA") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith("otiz-shell-")).map((key) => caches.delete(key)))
      )
    );
  }
});
