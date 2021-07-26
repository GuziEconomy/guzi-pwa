const cacheName = 'guzi-cache-v2';
const filesToCache = [
    '/',
    '/index.html',
    '/js/guzi.js',
    '/js/pwacompat.min.js',
    '/js/localforage.min.js',
    '/images/logo.png'
]

self.addEventListener("install", e => {
  caches.open(cacheName).then(cache => {
    cache.addAll(files);
  });
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== cacheName) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", e => {});

self.addEventListener("fetch", event => {
    event.respondWith(
      caches
        .open(cacheName)
        .then(cache => cache.match(event.request))
        .then(response => response || fetch(event.request))
    );
});
