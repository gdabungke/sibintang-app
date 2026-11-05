/**
 * ============================================================================
 * SIBINTANG - PROGRESSIVE WEB APP SERVICE WORKER (public/sw.js)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Mengelola penyimpanan cache aset statis aplikasi untuk akses cepat dan
 * ketahanan mode luar jaringan (offline fallback).
 *
 * Susunan Kode:
 * 1. Konfigurasi Nama Cache & Daftar Aset Statis
 * 2. Siklus Hidup Install (Pre-caching Aset Statis)
 * 3. Siklus Hidup Activate (Pembersihan Cache Versi Lama)
 * 4. Strategi Fetch (Network-First untuk Halaman, Bypass untuk /api/)
 */
const CACHE_NAME = 'sibintang-pwa-v3.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/guru.html',
  '/css/style.css',
  '/js/app.js',
  '/js/constants.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/siswa.js',
  '/js/guru.js',
  '/manifest.json',
  '/icon.png',
];

// ============================================================================
// 1. SIKLUS HIDUP INSTALL (PRE-CACHING ASET STATIS)
// ============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ============================================================================
// 2. SIKLUS HIDUP ACTIVATE (PEMBERSIHAN CACHE LAMA)
// ============================================================================
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

// ============================================================================
// 3. STRATEGI FETCH (NETWORK-FIRST DENGAN CACHE FALLBACK)
// ============================================================================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan pernah men-cache request API dinamis atau non-GET
  if (url.pathname.startsWith('/api/') || req.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && url.origin === self.location.origin) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cachedRes = await caches.match(req);
        if (cachedRes) return cachedRes;
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return Response.error();
      })
  );
});
