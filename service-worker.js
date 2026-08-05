const CACHE_NAME = "soma-cinema-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/reset.css",
  "./css/variables.css",
  "./css/base.css",
  "./js/app.js"
];

// Instala o Service Worker e salva os arquivos essenciais.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Remove versões antigas do cache.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Procura o arquivo no cache antes de buscar na internet.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});