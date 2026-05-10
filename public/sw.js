/* Sales Orbit — Service Worker
   Enables PWA installability (Add to Home Screen / Install App).
   Strategy: network-first for API calls, cache-first for static assets. */

const CACHE  = 'salesorbit-v1'
const STATIC = ['/', '/manifest.json', '/favicon.svg', '/icon-maskable.svg']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Always go to network for API / backend calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/health')) {
    e.respondWith(fetch(e.request))
    return
  }

  // Cache-first for everything else (static assets, HTML shell)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
    })
  )
})
