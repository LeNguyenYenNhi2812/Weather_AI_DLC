// Unit SW-001: Service Worker - Offline Support & Stale-While-Revalidate

const CACHE_NAME = 'weather-app-v1';
const API_CACHE_NAME = 'weather-api-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/responsive.css',
  '/js/i18n.js',
  '/js/api-client.js',
  '/js/app.js',
  '/manifest.json'
];

const API_ENDPOINTS = [
  '/api/weather',
  '/api/forecast',
  '/api/alerts',
  '/api/history',
  '/api/validate-city',
  '/api/preferences'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map(name => {
              console.log('🧹 Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests to other domains
  if (url.origin !== location.origin) {
    return;
  }

  // API requests: Stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Static assets: Cache-first with fallback
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // HTML: Network-first for SPA navigation
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
    return;
  }
});

/**
 * Handle API requests with stale-while-revalidate
 */
async function handleAPIRequest(request) {
  const cacheName = API_CACHE_NAME;

  try {
    // Try network first
    const response = await fetchWithTimeout(request.clone(), 5000);

    // Cache the response
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request.url, response.clone());
    }

    return response;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('📡 Serving cached API response:', request.url);
      return cachedResponse;
    }

    // Return offline response if no cache
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'No cached data available. Please check your connection.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static asset requests with cache-first
 */
async function handleStaticRequest(request) {
  const cacheName = CACHE_NAME;

  try {
    // Check cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('💾 Serving from cache:', request.url);
      return cachedResponse;
    }

    // Fetch from network
    const response = await fetchWithTimeout(request.clone(), 5000);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request.url, response.clone());
    }

    return response;
  } catch (error) {
    // Fall back to cache or offline page
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50" y="50" text-anchor="middle" dy=".3em">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }

    return new Response('Offline - Resource not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handle document requests (HTML pages) with network-first
 */
async function handleDocumentRequest(request) {
  try {
    // Try network first for SPA navigation
    const response = await fetchWithTimeout(request.clone(), 5000);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.url, response.clone());
    }

    return response;
  } catch (error) {
    // Fall back to cache or index.html
    let cachedResponse = await caches.match(request);

    if (!cachedResponse) {
      cachedResponse = await caches.match('/index.html');
    }

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Offline - Page not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), timeout)
    )
  ]);
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/.test(url.pathname);
}

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Weather Alert';
  const options = {
    body: data.message || 'New weather alert',
    icon: '/favicon.svg',
    badge: '/badge.svg',
    tag: 'weather-alert',
    requireInteraction: data.severity === 'high'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if window already open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-preferences') {
    event.waitUntil(syncPreferences());
  }

  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncPreferences() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    // Implementation would sync preferences with server
    console.log('🔄 Syncing preferences...');
  } catch (error) {
    console.error('Sync error:', error);
  }
}

async function syncFavorites() {
  try {
    // Implementation would sync favorites with server
    console.log('🔄 Syncing favorites...');
  } catch (error) {
    console.error('Sync error:', error);
  }
}

console.log('✅ Service Worker loaded');
