// Service worker minimal pour TANKLE : rend le site installable (PWA) et met
// en cache les fichiers essentiels pour un chargement plus rapide ensuite.
// Ne fait AUCUNE tentative de "vrai" mode hors-ligne complet (l'API d'images
// externes n'est pas mise en cache) : c'est volontairement simple.

const CACHE_NAME = "tankle-cache-v1";
const CORE_ASSETS = [
  "./index.html",
  "./tanks.json",
  "./favicon.ico",
  "./favicon-32.png",
  "./icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Stratégie "network first, cache en secours" : privilégie toujours la
  // version en ligne la plus fraîche (utile puisque tanks.json évolue),
  // et ne sert le cache que si le réseau échoue (hors-ligne).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
