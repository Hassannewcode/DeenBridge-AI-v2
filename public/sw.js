const CACHE_NAME = 'deenbridge-cache-v5'; // Bump version to trigger update
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
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;700&family=El+Messiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;700&family=Inter:wght@400;500;600;700&family=Lateef:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Readex+Pro:wght@400;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching app shell');
            const promises = PRECACHE_ASSETS.map(url => {
                return cache.add(new Request(url, { cache: 'reload' })).catch(err => {
                    console.warn(`[Service Worker] Failed to cache ${url}:`, err);
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

    // Ignore non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Ignore API requests to Google
    if (request.url.includes('googleapis.com')) {
        return; // Let API requests go to the network
    }

    // For HTML and main script, use a network-first strategy.
    const isAppShell = request.mode === 'navigate' || request.destination === 'script' || request.url.endsWith('index.tsx');

    if (isAppShell) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // If the fetch is successful, clone it and cache it.
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // If the network fails, try to serve from cache.
                    return caches.match(request);
                })
        );
        return;
    }

    // For all other assets (CSS, fonts, images), use a cache-first strategy.
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(request).then(networkResponse => {
                 if (networkResponse && networkResponse.ok) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            });
        })
    );
});