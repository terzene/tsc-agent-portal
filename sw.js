/* TSC Agent Portal service worker.
   Relative URLs stay inside the GitHub Pages project path.
   Bump CACHE when the precache list changes. */

const CACHE = "tsc-portal-shell-v3";

const SHELL = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./data/portal.json",
  "./assets/wordmark.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && !fresh.redirected) {
      await cache.put(fallbackUrl || request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    const cached =
      (fallbackUrl && (await cache.match(fallbackUrl, { ignoreSearch: true }))) ||
      (await cache.match(request, { ignoreSearch: true }));
    if (cached) return cached;
    throw error;
  }
}
