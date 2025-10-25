const CACHE_NAME = 'deenbridge-cache-v7'; // Version bumped for update
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/icon-monochrome.svg',
    // Key external assets for a basic offline shell
    'https://cdn.tailwindcss.com',
    'https://esm.sh/react@19.1.1',
    'https://esm.sh/react-dom@19.1.1/client',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;700&family=El+Messiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;700&family=Inter:wght@400;500;600;700&family=Lateef:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Readex+Pro:wght@400;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Precaching app shell');
            const promises = PRECACHE_ASSETS.map(url => {
                return cache.add(new Request(url, { cache: 'reload' })).catch(err => {
                    console.warn(`[Service Worker] Failed to precache ${url}:`, err);
                });
            });
            return Promise.all(promises);
        })
        .then(() => {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // Ignore non-GET requests and API calls to Google
    if (request.method !== 'GET' || request.url.includes('googleapis.com')) {
        return;
    }

    // Network-first strategy for HTML navigation requests.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // If the fetch is successful, clone it, cache it, and return it.
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // If the network fails, try to serve the main page from cache.
                    return caches.match('/');
                })
        );
        return;
    }

    // Stale-While-Revalidate strategy for all other assets (CSS, JS, fonts, images).
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(request).then(cachedResponse => {
                const fetchPromise = fetch(request).then(networkResponse => {
                    // Check if we received a valid response to cache
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    console.warn(`[Service Worker] Fetch failed for ${request.url}:`, err);
                    // This catch is to prevent the promise from rejecting if the network fails.
                    // If there's a cachedResponse, it would have already been returned.
                });

                // Return the cached response immediately if it exists, otherwise wait for the network.
                // The network fetch will happen in the background to update the cache for the next visit.
                return cachedResponse || fetchPromise;
            });
        })
    );
});