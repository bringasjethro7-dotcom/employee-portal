// JMB Virtuals Portal - Service Worker
// v2 - network-first, never serves stale HTML while online
const CACHE_NAME = 'jmb-portal-v2';
const ASSETS = ['/manifest.json', '/logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  // HTML: always network-first, never cache — so users get the newest build.
  if (isHTML) {
    e.respondWith(
      fetch(req).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('/'); });
      })
    );
    return;
  }

  // Static assets: network-first, cache the fresh copy for offline fallback.
  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      })
      .catch(function () { return caches.match(req); })
  );
});
