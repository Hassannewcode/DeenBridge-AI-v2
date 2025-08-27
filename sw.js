const CACHE_NAME = 'deenbridge-cache-v4'; // Bump version to trigger update
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/index.tsx',
    'https://cdn.tailwindcss.com',
    'https://esm.sh/react@^19.1.1',
    'https://esm.sh/react-dom@^19.1.1',
    'https://esm.sh/@google/genai@^1.13.0',
    'https://esm.sh/marked@^12.0.2',
    'https://esm.sh/dompurify@^3.1.5',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap'
    // Icons are referenced in index.html and manifest, they will be cached on first load.
];

self.addEventListener('install', event => {
    // Pre-cache the main shell of the application
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching app shell');
            // Use addAll, but catch errors for individual assets to make it more robust
            const promises = PRECACHE_ASSETS.map(url => {
                return cache.add(url).catch(err => {
                    console.warn(`[Service Worker] Failed to cache ${url}:`, err);
                });
            });
            return Promise.all(promises);
        })
        .then(() => {
            // Force the waiting service worker to become the active service worker.
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => {
            // Take control of the page immediately
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    // Ignore non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignore API requests to Google
    if (event.request.url.includes('googleapis.com')) {
        return; // Let API requests go to the network
    }

    // Use a "stale-while-revalidate" strategy for all other assets.
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                // Fetch from the network in the background to update the cache.
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    console.warn('[Service Worker] Fetch failed:', err);
                    // If the network fails, the cached response (if available) is still returned.
                });

                // Return the cached response if it exists, otherwise wait for the network.
                return cachedResponse || fetchPromise;
            });
        })
    );
});