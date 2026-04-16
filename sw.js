/* ═══════════════════════════════════════════════════
   BIONOTES — Service Worker
   Cache-first for static assets | Network-first for PDFs
═══════════════════════════════════════════════════ */

const CACHE_NAME = 'bionotes-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/notes.html',
  '/search.html',
  '/admin.html',
  '/manifest.json',
  '/assets/css/global.css',
  '/assets/css/animations.css',
  '/assets/css/hero.css',
  '/assets/css/cards.css',
  '/assets/js/notes-data.js',
  '/assets/js/app.js',
  '/assets/js/search.js',
  '/assets/js/three-scene.js',
  '/assets/js/gsap-animations.js',
  '/assets/js/cursor.js',
  '/assets/js/theme.js',
  '/assets/js/admin.js',
];

/* ── INSTALL: pre-cache static assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache install partial:', err))
  );
});

/* ── ACTIVATE: clear old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: stale-while-revalidate for HTML/JS/CSS, network-first for PDFs ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and cross-origin */
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  /* PDFs: network-first */
  if (url.pathname.endsWith('.pdf')) {
    event.respondWith(
      fetch(request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* Everything else: cache-first */
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return resp;
      });
      return cached || network;
    })
  );
});
