const CACHE_NAME = 'sibintang-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/guru.html',
  '/css/style.css',
  '/js/constants.js',
  '/js/siswa.js',
  '/js/guru.js',
  '/manifest.json',
  '/icon.png' 
];

// 1. Install Service Worker & Simpan Aset Statis
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Aktivasi & Hapus Cache Versi Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Strategi Fetch: API selalu ambil data terbaru dari server, aset statis gunakan Cache bila offline
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan pernah men-cache request API ke Google Sheet / Drive
  if (url.pathname.startsWith('/api/') || req.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Hanya simpan respon yang valid (status 200) ke cache
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});
