const CACHE_VERSION = 'shopmate-v3';
const STATIC_CACHE = `shopmate-static-${CACHE_VERSION}`;

// STEP 1: STRICT PRECACHE
// We include '/', '/index.html', and the manifest.
// We REMOVED external icon files to prevent install failure if they are missing.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Strict caching. If ANY of these fail, the SW will not install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// STEP 2: PROPER ACTIVATION
// Clean up old caches and claim clients immediately.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (!key.includes(CACHE_VERSION)) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// STEP 3: NAVIGATION CACHE-FIRST
// Navigation requests (HTML) never hit the network first.
// Static assets are cached on the fly.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Handle Navigation (HTML requests)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          if (response) return response;
          // Fallback just in case, though strict install prevents this
          return fetch(event.request); 
        })
    );
    return;
  }

  // Handle Static Assets (Cache-First with Network Fallback)
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(networkResponse => {
            // Cache valid responses on the fly
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(event.request, clone));

            return networkResponse;
          });
      })
  );
});