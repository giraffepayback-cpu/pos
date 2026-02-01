const CACHE_NAME = 'simple-pos-cache-v4'; // Name erhöht, um Cache-Refresh zu erzwingen

// WICHTIG: Alle Kommas am Zeilenende müssen da sein!
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. Installation: Dateien in den Cache schaufeln
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache...');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Die "Magie" für den Offline-Modus
self.addEventListener('fetch', (event) => {
  // Wir schauen erst im Cache nach. Wenn es da ist -> sofort ausliefern.
  // Wenn nicht -> versuche es über das Netzwerk zu laden.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Cache-Treffer
      }
      return fetch(event.request); // Netzwerk-Versuch
    }).catch(() => {
      // Falls beides fehlschlägt (z.B. Offline und Bild nicht im Cache)
      // Hier könnte man eine offline.html zurückgeben, falls vorhanden
    })
  );
});
