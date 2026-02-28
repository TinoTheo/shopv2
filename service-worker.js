// ============================================
// SERVICE WORKER — Enhanced Offline-First Strategy
// ============================================

const CACHE_NAME = 'shopmate-v2';  // Increment version to force update
const CORE_CACHE = 'shopmate-core-v2';

// Only cache the essential HTML file during install
const CORE_ASSETS = [
  '/index.html'   // This is the only critical file; the rest is inline
];

// ============================================
// INSTALL EVENT — Cache core HTML
// ============================================
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(function(cache) {
        // Use addAll but catch individual failures – we want the install to succeed
        // even if one asset fails (e.g., if offline during first install)
        return Promise.allSettled(
          CORE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
            })
          )
        );
      })
      .then(function() {
        console.log('[SW] Core assets cached');
      })
  );
});

// ============================================
// ACTIVATE EVENT — Clean up old caches
// ============================================
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  
  // Claim all clients so the page is controlled immediately
  event.waitUntil(self.clients.claim());
  
  // Delete old caches
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CORE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ============================================
// FETCH EVENT — Cache‑first with navigation fallback
// ============================================
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  
  // For navigation requests, we always want to serve the cached index.html
  // even if the URL has query parameters or fragments
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(function() {
          // Network failed – serve index.html from cache
          return caches.match('/index.html')
            .then(function(cached) {
              if (cached) return cached;
              // If even index.html is missing, return a simple offline page
              return new Response('Offline – Please check your connection.', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }
  
  // For all other requests (assets, API calls, etc.), try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache – fetch from network
        return fetch(event.request)
          .then(function(networkResponse) {
            // Cache successful responses (e.g., images, scripts, styles)
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CORE_CACHE)
                .then(cache => cache.put(event.request, responseToCache))
                .catch(err => console.warn('[SW] Cache put failed:', err));
            }
            return networkResponse;
          })
          .catch(function(err) {
            console.warn('[SW] Fetch failed for', event.request.url, err);
            // No fallback – return a generic offline error
            return new Response('Offline content unavailable', { status: 503 });
          });
      })
  );
});

console.log('[SW] Service worker loaded (enhanced offline support)');