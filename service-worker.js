// Define a unique cache name. Update the version number (v2, v3, etc.) 
// whenever you update your icons or code to force a refresh.
const CACHE_NAME = 'my-app-cache-v1';

// List of assets to cache for offline use.
// This includes your icons, manifest, and core app files.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',        // Ensure this matches your main HTML file name
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/styles.css',        // Uncomment/rename to match your CSS file
  '/app.js'             // Uncomment/rename to match your main JS file
];

// 1. INSTALL EVENT
// This triggers when the service worker is first installed.
// We open the cache and add all the assets defined above.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and icons');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Forces the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
});

// 2. ACTIVATE EVENT
// This cleans up old caches so they don't take up unnecessary space.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that isn't the current one (CACHE_NAME)
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Takes control of all open clients (pages) immediately.
      return self.clients.claim();
    })
  );
});

// 3. FETCH EVENT
// This intercepts network requests.
// Strategy: Cache-First (Serve from cache if available, else fetch from network).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 1. If the resource is in the cache, return it.
        if (response) {
          return response;
        }

        // 2. If not in cache, fetch from the network.
        return fetch(event.request).then((networkResponse) => {
          // Optional: Cache new requests dynamically.
          // This allows pages visited offline to be available later.
          
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need two copies.
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
      .catch(() => {
        // Optional: Fallback logic if both cache and network fail
        // For example, return a custom offline page:
        // return caches.match('/offline.html');
      })
  );
});