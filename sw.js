const cacheName = 'guzi-cache-v2';
const filesToCache = [
    '/',
    '/index.html',
    '/css/bootstrap.min.css',
    '/css/guzi.css',
    '/js/core/guzi.js',
    '/js/libs/jquery.min.js',
    '/js/libs/bootstrap.bundle.min.js',
    '/js/libs/localforage.min.js',
    '/js/libs/msgpack.min.js',
    '/js/libs/elliptic.min.js',
    '/js/libs/sha.min.js',
    '/js/libs/crypto-js/core.js',
    '/js/libs/crypto-js/enc-base64.js',
    '/js/libs/crypto-js/md5.js',
    '/js/libs/crypto-js/evpkdf.js',
    '/js/libs/crypto-js/cipher-core.js',
    '/js/libs/crypto-js/aes.js',
    '/js/bootstrap.bundle.min.css',
    '/js/libs/pwacompat.min.js',
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
