const CACHE_NAME = 'pos-speed-v2'; // WICHTIG: Erhöhe diese Nummer (v3, v4...), wenn du Code änderst!
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
  './icon-192.png'
  './icon-512.png'
];

// 1. Installieren und Dateien cachen
self.addEventListener('install', (event) => {
  // Zwingt den wartenen Service Worker sofort aktiv zu werden
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Aktivieren und alte Caches löschen (WICHTIG für Updates)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim()) // Übernimmt sofort die Kontrolle über alle offenen Tabs
  );
});

// 3. Dateien aus dem Cache laden (Offline First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Wenn im Cache, dann Cache nutzen, sonst Netzwerk
      return response || fetch(event.request);
    })
  );
});