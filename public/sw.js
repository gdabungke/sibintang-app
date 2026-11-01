const CACHE_NAME = 'sibintang-pwa-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/guru.html',
  '/css/style.css',
  '/js/app.js',         
  '/js/constants.js',   
  '/js/auth.js',        
  '/js/siswa.js',       
  '/js/guru.js',        
  '/manifest.json',
  '/icon.png'
];

// 1. Install Service Worker & Simpan Aset Statis ke Cache
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

// 3. Strategi Fetch (Network First, Cache Fallback untuk aset statis)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan pernah men-cache request API dinamis (ke server / Google Sheets / Drive)
  if (url.pathname.startsWith('/api/') || req.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Simpan salinan respon yang valid ke cache untuk penggunaan offline berikutnya
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req)) // Jika internet mati/gagal fetch, ambil dari cache
  );
});
