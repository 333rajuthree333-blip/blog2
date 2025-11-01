// Service Worker for caching and performance optimization
const CACHE_NAME = 'techsci-blog-v1.0.0';
const STATIC_CACHE = 'techsci-static-v1.0.0';
const DYNAMIC_CACHE = 'techsci-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/css/style.css',
    '/css/chatbot.css',
    '/js/app.js',
    '/js/chatbot.js',
    '/js/comments.js',
    '/logo.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip caching for API calls and external resources
    if (url.origin !== location.origin ||
        url.pathname.startsWith('/api/') ||
        url.pathname.includes('/admin/') ||
        url.search.includes('nocache')) {
        return;
    }

    // Cache-first strategy for static assets
    if (STATIC_ASSETS.some(asset => url.href.includes(asset))) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request).then(fetchResponse => {
                        return caches.open(STATIC_CACHE).then(cache => {
                            cache.put(event.request, fetchResponse.clone());
                            return fetchResponse;
                        });
                    });
                })
        );
    } else {
        // Network-first strategy for pages
        event.respondWith(
            fetch(event.request)
                .then(fetchResponse => {
                    // Cache successful responses
                    if (fetchResponse.status === 200) {
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(event.request, fetchResponse.clone());
                        });
                    }
                    return fetchResponse;
                })
                .catch(() => {
                    // Return cached version if network fails
                    return caches.match(event.request);
                })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle offline actions when connection is restored
    console.log('Service Worker: Performing background sync');

    // You can implement offline comment submission, etc. here
    // For example, sync pending comments when back online
}

// Push notifications (for future use)
self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: data.url,
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});

console.log('Service Worker: Loaded successfully');
