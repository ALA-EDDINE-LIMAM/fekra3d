const IMAGE_CACHE = 'fekra3d-images-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('fekra3d-images-') && cacheName !== IMAGE_CACHE)
        .map((cacheName) => caches.delete(cacheName)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || request.destination !== 'image') {
    return;
  }

  event.respondWith(
    caches.open(IMAGE_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(request, { ignoreVary: true });
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok || networkResponse.type === 'opaque') {
          try {
            await cache.put(request, networkResponse.clone());
          } catch (error) {
            console.warn('Unable to cache image response:', error);
          }
        }

        return networkResponse;
      } catch (error) {
        const fallbackResponse = await cache.match(request, { ignoreVary: true });
        if (fallbackResponse) {
          return fallbackResponse;
        }
        throw error;
      }
    }),
  );
});
