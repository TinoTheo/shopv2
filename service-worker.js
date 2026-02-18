// ============================================
// SERVICE WORKER — SIMPLE CACHE-FIRST STRATEGY
// Compatible with older Android WebView (Android 5+)
// ============================================

const CACHE_NAME = 'shopmate-v1';
const CACHE_VERSION = '20240101';

// Assets to cache immediately on install
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// ============================================
// INSTALL EVENT — Cache core assets
// ============================================
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  
  // Force immediate activation (skip waiting)
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching core assets...');
        return cache.addAll(ASSETS_TO_CACHE).catch(function(err) {
          // Some assets may fail (e.g., if offline during install)
          // That's okay - we'll cache them on first fetch
          console.warn('[SW] Some assets failed to cache:', err);
        });
      })
      .then(function() {
        console.log('[SW] Installation complete');
      })
      .catch(function(err) {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ============================================
// ACTIVATE EVENT — Clear old caches
// ============================================
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  
  // Claim all clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            // Delete old cache versions
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function() {
        console.log('[SW] Activation complete');
      })
  );
});

// ============================================
// FETCH EVENT — Cache-first strategy with fallback
// ============================================
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (let them go to network)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Not in cache - fetch from network
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(function(networkResponse) {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              // Clone the response (streams can only be read once)
              var responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(function(err) {
            // Network failed - try to serve offline page
            console.warn('[SW] Network fetch failed:', err);
            
            // For navigation requests, serve a fallback
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // Return error response
            return new Response('Offline - Content not cached', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
      .catch(function(err) {
        console.error('[SW] Cache match failed:', err);
        // Last resort - try network directly
        return fetch(event.request).catch(function() {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ============================================
// MESSAGE HANDLER — For communication with main app
// ============================================
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

console.log('[SW] Service worker loaded');