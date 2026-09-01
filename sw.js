// PPLUA Command service worker.
//
// Network-first, not cache-first: this file gets updated often, and a
// cache-first strategy would risk silently serving a stale version even
// with a good connection. This only falls back to the cache when the
// network genuinely fails, which is the actual point of a service worker
// for a single-page app like this: offline access, not offline-by-default.
//
// Bump CACHE_NAME whenever the cached file list changes, so old caches get
// cleaned up on activate instead of accumulating forever.
const CACHE_NAME = 'pplua-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
