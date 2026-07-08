// Service Worker for Caching & Push Notifications
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `univoid-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `univoid-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `univoid-images-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/favicon.jpg',
  '/images/univoid-og.jpg',
];

// Cache size limits
const DYNAMIC_CACHE_LIMIT = 50;
const IMAGE_CACHE_LIMIT = 100;

// Trim cache to limit
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    trimCache(cacheName, maxItems);
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => 
              key !== STATIC_CACHE && 
              key !== DYNAMIC_CACHE && 
              key !== IMAGE_CACHE
            )
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => clients.claim())
  );
});

// Fetch strategies
const isStaticAsset = (url) => {
  return url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/);
};

const isImage = (url) => {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/);
};

const isApiCall = (url) => {
  return url.hostname.includes('supabase') || 
         url.pathname.startsWith('/api') ||
         url.pathname.includes('/rest/') ||
         url.pathname.includes('/auth/');
};

const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Cache-first strategy (for static assets)
const cacheFirst = async (request, cacheName) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached;
  }
};

// Stale-while-revalidate (for images)
const staleWhileRevalidate = async (request, cacheName, limit) => {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
        trimCache(cacheName, limit);
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
};

// Network-first (for dynamic content)
const networkFirst = async (request, cacheName, limit) => {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      trimCache(cacheName, limit);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/');
    }
    throw error;
  }
};

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls - let them go to network
  if (isApiCall(url)) return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Static assets - cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Images - stale while revalidate
  if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(event.request, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
    return;
  }

  // Navigation & dynamic content - network first with cache fallback
  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirst(event.request, DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT));
    return;
  }

  // Default: network first for other requests
  event.respondWith(networkFirst(event.request, DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT));
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/favicon.jpg',
    badge: '/favicon.jpg',
    tag: 'univoid-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: notificationData.badge,
        tag: payload.tag || notificationData.tag,
        data: { url: payload.link || payload.url || '/' }
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [100, 50, 100],
      requireInteraction: false,
      silent: false
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, link } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.jpg',
      badge: '/favicon.jpg',
      tag: 'univoid-notification-' + Date.now(),
      data: { url: link || '/' },
      vibrate: [100, 50, 100],
      requireInteraction: false
    });
  }
  
  // Skip waiting message to activate new SW immediately
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});