// JMB Virtuals Portal - Service Worker
// v3 - HTML is always network (never cached); only static assets cached for offline.
const CACHE_NAME = 'jmb-portal-v3';
const ASSETS = ['/manifest.json', '/logo.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  // HTML/pages: ALWAYS from the network — never serve a cached page. Only fall back to
  // cache if the device is truly offline.
  if (isHTML) {
    e.respondWith(fetch(req).catch(function () { return caches.match(req); }));
    return;
  }

  // Static assets: network-first, cache the fresh copy for offline.
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () { return caches.match(req); })
  );
});
