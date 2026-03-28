const CACHE_NAME = 'solo-sessions-v1';

// All files the app needs to run
const FILES_TO_CACHE = [
  '/Solo-Sessions/',
  '/Solo-Sessions/index.html',
  '/Solo-Sessions/manifest.json',
  '/Solo-Sessions/icons/icon-192.png',
  '/Solo-Sessions/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Josefin+Sans:wght@200;300;400&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Install: cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local files strictly, external resources best-effort
      const localFiles = FILES_TO_CACHE.filter(f => f.startsWith('/'));
      const externalFiles = FILES_TO_CACHE.filter(f => f.startsWith('http'));

      return cache.addAll(localFiles).then(() => {
        return Promise.allSettled(
          externalFiles.map(url =>
            fetch(url).then(res => cache.put(url, res)).catch(() => {})
          )
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If completely offline and not cached, return the app shell
        if (event.request.destination === 'document') {
          return caches.match('/Solo-Sessions/index.html');
        }
      });
    })
  );
});
