// Gradatone keeps piano sample responses available for offline play.
const PIANO_CACHE = 'gradatone-piano-samples-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames.filter((name) => name !== PIANO_CACHE).map((name) => caches.delete(name))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method === 'GET' && url.origin === self.location.origin && /\/piano-samples\/[^/]+\.mp3$/.test(url.pathname)) {
        event.respondWith(caches.open(PIANO_CACHE).then(async (cache) => {
            const cached = await cache.match(request);
            if (cached) return cached;
            const response = await fetch(request);
            if (response.ok) await cache.put(request, response.clone());
            return response;
        }));
        return;
    }
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => new Response('Network error', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
    })));
});
