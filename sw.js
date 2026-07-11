// ══════════════════════════════════════════════════════════════════════════════
//  JMB Virtuals Portal — Service Worker
//
//  This file does two jobs, because a scope can only have ONE service worker:
//
//   1. Push notifications. OneSignal's worker is imported below; it attaches its
//      own 'push' and 'notificationclick' listeners to this same worker.
//   2. The offline shell. Static assets are cached so the app opens instantly and
//      still boots without a connection.
//
//  IMPORTANT — HTML IS NEVER SERVED FROM CACHE FIRST.
//  The portal is one enormous HTML file that changes on every deploy. If we served
//  it from cache, employees would be stuck on a stale build. So pages always come
//  from the network, and the cache is only a last-resort fallback when offline.
// ══════════════════════════════════════════════════════════════════════════════

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE = 'jmb-portal-v5';
const ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/badge-96.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE; })
              .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   // never touch Apps Script / CDN / Supabase traffic

  var isHTML = req.mode === 'navigate' ||
               (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  // Pages: network first, always. Cache is only a lifeline when truly offline.
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) { return hit || caches.match('/'); });
        })
    );
    return;
  }

  // Static assets: serve from cache instantly, refresh in the background.
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

// Let the page tell a waiting worker to take over immediately (used after a deploy).
self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
