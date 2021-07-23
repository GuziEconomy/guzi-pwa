const cacheName = 'guzi-cache-v1';
const filesToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/images/logo.png',
]

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName)
        .then(cache => {
            return cache.addAll(filesToCache);
        })
    );
})

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.open(cacheName)
        .then(cache => cach.match(e.request))
        .then(response => {
            return response || fetch(e.request);
        })
    );
});
