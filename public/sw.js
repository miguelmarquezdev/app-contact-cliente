const CACHE_VERSION = 'v33'
const SHELL_CACHE = `happy-manager-shell-${CACHE_VERSION}`
const PAGE_CACHE = `happy-manager-pages-${CACHE_VERSION}`
const ASSET_CACHE = `happy-manager-assets-${CACHE_VERSION}`
const DATA_CACHE = `happy-manager-data-${CACHE_VERSION}`

const APP_SHELL = [
  '/',
  '/login',
  '/offline',
  '/client/dashboard',
  '/client/itineraries',
  '/client/profile',
  '/client/chat',
  '/collaborator/dashboard',
  '/collaborator/itineraries',
  '/collaborator/profile',
  '/collaborator/chat',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/site.webmanifest'
]

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  )
}

function isSupabaseFile(url) {
  return url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/')
}

async function putSafe(cacheName, request, response) {
  try {
    if (!response || response.status >= 400) return
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  } catch {
    // Ignore quota/private mode errors.
  }
}

async function networkFirst(request, fallbackUrl = '/offline') {
  try {
    const response = await fetch(request)
    await putSafe(PAGE_CACHE, request, response)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const fallback = await caches.match(fallbackUrl)
    if (fallback) return fallback
    return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      putSafe(cacheName, request, response)
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE, DATA_CACHE]
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !validCaches.includes(key)).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(PAGE_CACHE).then(async (cache) => {
        for (const url of event.data.urls) {
          try {
            await cache.add(url)
          } catch {
            // Skip pages blocked by auth or network.
          }
        }
      })
    )
  }

  if (event.data?.type === 'CLEAR_OFFLINE_CACHE') {
    event.waitUntil(
      Promise.all([caches.delete(PAGE_CACHE), caches.delete(DATA_CACHE)]).then(() => undefined)
    )
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
    return
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/data/')) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE))
    return
  }

  if (isSupabaseFile(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
  }
})
