const CACHE_NAME = 'deenbridge-cache-v1';

self.addEventListener('install', event => {
    // Pre-cache the main shell of the application
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html'
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Use a "stale-while-revalidate" strategy for all requests.
    // This provides an offline-first experience by serving from cache immediately
    // while updating the cache with a fresh network request in the background.
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Only cache successful GET requests
                    if (event.request.method === 'GET' && networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // This will be hit if the network request fails, e.g., offline
                    // In that case, if we had a cached response, it would have been returned already.
                    // If not, the fetch will fail, which is the correct behavior for uncached assets offline.
                });

                // Return the cached response if it exists, otherwise wait for the network
                return response || fetchPromise;
            });
        })
    );
});
