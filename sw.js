/* Mein Training 2.8: versioned offline cache, network-first for app code. */
const CACHE = 'meintraining-v282-20261106';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './version.json',
  './css/style.css', './css/ios-v28.css',
  './data/exercises.json', './data/plans.json', './data/translations.json',
  './js/loader.js', './js/app.js', './js/features.js',
  './js/tracking-advanced.js', './js/v27.js', './js/v28.js',
  './js/web-version-v28.js',
  './assets/icon.png', './assets/apple-touch-icon.png',
  './assets/icon-192.png', './assets/icon-512.png',
  './assets/icon-petrol-32.png', './assets/icon-petrol-192.png',
  './assets/icon-gold-32.png', './assets/icon-gold-192.png',
  './assets/icon-orange-32.png', './assets/icon-orange-192.png'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Do not abort service-worker installation because one optional icon is absent.
    await Promise.all(ASSETS.map(async path => {
      try {
        const response = await fetch(path, {cache: 'reload'});
        if (response.ok) await cache.put(path, response);
      } catch (err) { console.warn('Offline asset unavailable:', path, err); }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('meintraining-v') && k !== CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin ||
      !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request, {cache: 'no-store'});
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(request);
      if (cached) return cached;
      return Response.error();
    }
  })());
});
