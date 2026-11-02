/**
 * ============================================================================
 * SIBINTANG - MAIN APPLICATION ORCHESTRATOR & BOOTSTRAPPER (app.js)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Berkas ini bertindak sebagai satu-satunya pintu masuk (Single Entry Point)
 * aplikasi untuk memuat pustaka dasar, mengelola fitur lintas modul (PWA,
 * antrean offline, audio lonceng doa), dan menginisialisasi controller halaman.
 */
(function () {
  'use strict';

  // ==========================================================================
  // 1. ASYNCHRONOUS SEQUENTIAL SCRIPT LOADER
  // ==========================================================================
  /**
   * Memuat skrip JavaScript secara dinamis dan menjamin urutan eksekusi sinkron
   * @param {string} src - Jalur path file skrip
   * @returns {Promise<void>}
   */
  function muatScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const tagScript = document.createElement('script');
      tagScript.src = src;
      tagScript.async = false;
      tagScript.onload = () => resolve();
      tagScript.onerror = () => reject(new Error(`[SiBintang] Gagal mengunduh modul: ${src}`));
      document.body.appendChild(tagScript);
    });
  }

  /**
   * Mendeteksi identitas dan konteks portal halaman yang sedang dibuka
   * @returns {'guru' | 'siswa'}
   */
  function deteksiKonteksHalaman() {
    const pathUrl = window.location.pathname.toLowerCase();
    if (document.getElementById('headerGuruContainer') || pathUrl.includes('guru')) {
      return 'guru';
    }
    return 'siswa';
  }

  // ==========================================================================
  // 2. RENDER FOOTER OTOMATIS
// ==========================================================================
 function renderFooter(containerId = 'footerContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Prioritaskan FOOTER_HTML dari constants.js jika ada
  if (typeof FOOTER_HTML !== 'undefined') {
    container.innerHTML = FOOTER_HTML;
   }
  }
  window.renderFooter = renderFooter;

  // ==========================================================================
  // 3. PWA SERVICE WORKER & INSTALLATION MANAGER
  // ==========================================================================
  let deferredPromptSiBintang = null; // Tangkap event instalasi browser PWA

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptSiBintang = e;
    window.deferredPromptSiBintang = e;
  });

  /**
   * Mendaftarkan Service Worker PWA untuk kemampuan offline caching
   */
  function inisialisasiServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SiBintang] Registrasi Service Worker dilewati:', err);
      });
    }
  }

  /**
   * Deteksi banner khusus bagi pengguna perangkat iOS Safari
   */
  function inisialisasiBannerIos() {
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
    const iosBanner = document.getElementById('ios-install-banner');
    if (isIos && !isInStandaloneMode && iosBanner) {
      iosBanner.style.display = 'block';
    }
    document.getElementById('btnDismissIosBanner')?.addEventListener('click', () => {
      if (iosBanner) iosBanner.style.display = 'none';
    });
  }

  /**
   * Mengatur tampilan tombol pasang PWA
   */
  function aturTampilanPasangPWA(isLoggedIn, containerTargetId, teksPeran = 'Siswa') {
    let banner = document.getElementById('pwaInstallBanner');
    let btnHeader = document.getElementById('btnDynamicInstallHeader');
    const targetParent = document.getElementById(containerTargetId);

    if (isLoggedIn) {
      if (banner) banner.remove();
      if (!btnHeader && targetParent) {
        btnHeader = document.createElement('button');
        btnHeader.id = 'btnDynamicInstallHeader';
        btnHeader.type = 'button';
        btnHeader.title = 'Pasang Aplikasi SiBintang ke Perangkat';
        btnHeader.className = 'group relative inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-emerald-900/20 border border-emerald-400/40 whitespace-nowrap cursor-pointer overflow-hidden';
        btnHeader.innerHTML = `
          <div class="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
          <svg class="w-3.5 h-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span class="tracking-wide">Pasang <span class="hidden sm:inline opacity-90">PWA</span></span>
        `;
        btnHeader.onclick = () => jalankanInstalasiPWA(teksPeran);
        targetParent.insertBefore(btnHeader, targetParent.firstChild);
      } else if (btnHeader) {
        btnHeader.classList.remove('hidden');
        btnHeader.classList.add('inline-flex');
      }
    } else {
      if (btnHeader) btnHeader.remove();
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'pwaInstallBanner';
        banner.className = 'fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-slate-900/95 backdrop-blur text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between z-50 border border-slate-700/50 no-print transition-all duration-300';
        banner.innerHTML = `
          <div class="flex items-center space-x-3 overflow-hidden">
            <div class="bg-blue-600 text-white font-bold rounded-xl w-9 h-9 flex items-center justify-center text-sm shadow shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </div>
            <div class="truncate">
              <p class="text-xs font-bold leading-tight truncate">Pasang Aplikasi SiBintang</p>
              <p class="text-[11px] text-slate-300 truncate">Akses portal ${teksPeran} langsung dari layar utama</p>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0">
            <button id="btnKonfirmasiPasangBanner" type="button" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"> Pasang </button>
            <button id="btnTutupBannerPwa" type="button" class="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer"> ✕ </button>
          </div>
        `;
        document.body.appendChild(banner);
        document.getElementById('btnKonfirmasiPasangBanner')?.addEventListener('click', () => jalankanInstalasiPWA(teksPeran));
        document.getElementById('btnTutupBannerPwa')?.addEventListener('click', () => banner.remove());
      }
    }
  }

  /**
   * Menjalankan dialog prompt instalasi PWA
   */
  async function jalankanInstalasiPWA(teksPeran = 'Siswa') {
    const promptEvent = deferredPromptSiBintang || window.deferredPromptSiBintang;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        document.getElementById('pwaInstallBanner')?.remove();
        document.getElementById('btnDynamicInstallHeader')?.remove();
        if (typeof showToast === 'function') {
          showToast('Aplikasi berhasil dipasang di perangkat Anda!', 'success');
        }
      }
      deferredPromptSiBintang = null;
      window.deferredPromptSiBintang = null;
    } else {
      bukaModalPanduanPWA(teksPeran);
    }
  }

  /**
   * Modal dialog instruksi manual instalasi PWA
   */
  function bukaModalPanduanPWA(peran = 'Siswa') {
    document.getElementById('modalPanduanPWA')?.remove();
    const backdrop = document.createElement('div');
    backdrop.id = 'modalPanduanPWA';
    backdrop.className = 'fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 opacity-0';
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

    backdrop.innerHTML = `
      <div id="pwaModalBox" class="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-7 shadow-2xl border-t sm:border border-slate-100 text-left transform transition-all duration-300 translate-y-full sm:translate-y-4 sm:scale-95 pb-8 sm:pb-7">
        <div class="sm:hidden w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5"></div>
        <div class="flex items-start gap-3.5 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 shadow-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-800">Pasang Aplikasi SiBintang</h3>
            <p class="text-xs text-slate-500 font-medium">Akses portal ${peran} langsung dari layar utama perangkat Anda.</p>
          </div>
        </div>
        <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 my-4 text-xs text-slate-600">
          ${ isIos ? `
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">1</span>
              <span>Tekan tombol <b>Bagikan (Share)</b> di bilah navigasi Safari.</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">2</span>
              <span>Pilih menu <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b>.</span>
            </div>
          ` : `
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">1</span>
              <span>Klik ikon <b>titik tiga (⋮)</b> di kanan atas peramban browser.</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">2</span>
              <span>Pilih opsi <b>"Pasang Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.</span>
            </div>
          ` }
        </div>
        <button type="button" id="btnTutupPanduanPWA" class="cursor-pointer w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20"> Mengerti </button>
      </div>
    `;

    document.body.appendChild(backdrop);
    const box = backdrop.querySelector('#pwaModalBox');
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      box.classList.remove('translate-y-full', 'sm:translate-y-4', 'sm:scale-95');
      box.classList.add('translate-y-0', 'sm:scale-100');
    });

    const tutup = () => {
      backdrop.classList.add('opacity-0');
      box.classList.remove('translate-y-0', 'sm:scale-100');
      box.classList.add('translate-y-full', 'sm:translate-y-4', 'sm:scale-95');
      setTimeout(() => backdrop.remove(), 250);
    };

    backdrop.querySelector('#btnTutupPanduanPWA').addEventListener('click', tutup);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) tutup();
    });
  }

  window.aturTampilanPasangPWA = aturTampilanPasangPWA;
  window.jalankanInstalasiPWA = jalankanInstalasiPWA;
  window.bukaModalPanduanPWA = bukaModalPanduanPWA;

  // ==========================================================================
  // 4. OFFLINE QUEUE MANAGER & AUTO-SYNC
  // ==========================================================================
  const KUNCI_ANTREAN_OFFLINE = 'sibintang_offline_queue';

  function dapatkanAntreanOffline() {
    try {
      return JSON.parse(localStorage.getItem(KUNCI_ANTREAN_OFFLINE) || '[]');
    } catch {
      return [];
    }
  }

  function simpanKeAntreanOffline(dataAbsen) {
    const antrean = dapatkanAntreanOffline();
    const duplikat = antrean.some(
      (item) => item.nis === dataAbsen.nis && item.qrCodeData === dataAbsen.qrCodeData
    );
    if (!duplikat) {
      antrean.push({
        ...dataAbsen,
        waktuScanLokal: new Date().toLocaleTimeString('id-ID'),
        dibuatPada: Date.now()
      });
      localStorage.setItem(KUNCI_ANTREAN_OFFLINE, JSON.stringify(antrean));
    }
  }

  function hapusDariAntreanOffline(timestamp) {
    let antrean = dapatkanAntreanOffline();
    antrean = antrean.filter((item) => item.dibuatPada !== timestamp);
    localStorage.setItem(KUNCI_ANTREAN_OFFLINE, JSON.stringify(antrean));
  }

  async function prosesSinkronisasiAntrean() {
    if (!navigator.onLine) return;
    const antrean = dapatkanAntreanOffline();
    if (antrean.length === 0) return;

    if (typeof showToast === 'function') {
      showToast(`Menghubungkan... Mengirim ${antrean.length} data absensi tertunda.`, 'info');
    }

    for (const item of antrean) {
      try {
        const res = await fetch('/api/absen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nis: item.nis,
            nama: item.nama,
            kelas: item.kelas,
            qrCodeData: item.qrCodeData
          })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          hapusDariAntreanOffline(item.dibuatPada);
        } else if (result.message && result.message.includes('sudah')) {
          hapusDariAntreanOffline(item.dibuatPada);
        }
      } catch {
        break; // Tunda jika jaringan belum stabil
      }
    }

    const sisa = dapatkanAntreanOffline().length;
    if (sisa === 0) {
      if (typeof bunyikanBeep === 'function') bunyikanBeep('success');
      if (typeof showToast === 'function') showToast('Seluruh absensi offline berhasil dikirim!', 'success');
      if (typeof loadRiwayat === 'function') loadRiwayat();
    }
  }

  window.addEventListener('online', () => {
    if (typeof showToast === 'function') showToast('Koneksi internet kembali aktif.', 'info');
    prosesSinkronisasiAntrean();
  });

  window.addEventListener('offline', () => {
    if (typeof showToast === 'function') showToast('Koneksi terputus. Beralih ke mode offline.', 'warning');
  });

  window.simpanKeAntreanOffline = simpanKeAntreanOffline;
  window.prosesSinkronisasiAntrean = prosesSinkronisasiAntrean;

  // ==========================================================================
  // 5. LITURGI HARIAN: LONCENG GEREJA & TIMER DOA ANGELUS
  // ==========================================================================
  let audioCtxAngelus = null;

  /**
   * Mensintesis suara dentang lonceng tembaga gereja menggunakan Web Audio API
   * @param {boolean} polaPenuh
   */
  function bunyikanLoncengGereja(polaPenuh = false) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxAngelus || audioCtxAngelus.state === 'suspended') {
        audioCtxAngelus = new AudioContextClass();
      }
      if (audioCtxAngelus.state === 'suspended') {
        audioCtxAngelus.resume();
      }
      const ctx = audioCtxAngelus;

      function dentang(delayDetik, frekuensiDasar = 659.25, durasi = 2.8) {
        setTimeout(() => {
          const waktuMulai = ctx.currentTime;
          const oscUtama = ctx.createOscillator();
          const oscHarmonik = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscUtama.type = 'sine';
          oscUtama.frequency.setValueAtTime(frekuensiDasar, waktuMulai);
          oscHarmonik.type = 'triangle';
          oscHarmonik.frequency.setValueAtTime(frekuensiDasar * 2.01, waktuMulai);

          gainNode.gain.setValueAtTime(0.65, waktuMulai);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, waktuMulai + durasi);

          oscUtama.connect(gainNode);
          oscHarmonik.connect(gainNode);
          gainNode.connect(ctx.destination);

          oscUtama.start(waktuMulai);
          oscHarmonik.start(waktuMulai);
          oscUtama.stop(waktuMulai + durasi);
          oscHarmonik.stop(waktuMulai + durasi);
        }, delayDetik * 1000);
      }

      dentang(0);
      dentang(2.0);
      dentang(4.0);
      if (polaPenuh) {
        dentang(6.5, 659.25, 3.5);
      }
    } catch (err) {
      console.warn('[SiBintang] Audio context lonceng membutuhkan interaksi layar:', err);
    }
  }

  let statusSudahBunyiHariIni = false;

  /**
   * Timer pemantau pukul 12.00 WIB untuk mendaraskan Doa Malaikat Tuhan
   */
  function inisialisasiTimerAngelusOtomatis() {
    setInterval(() => {
      const skrg = new Date();
      const hari = skrg.getDay(); // 0: Minggu, 6: Sabtu
      const jam = skrg.getHours();
      const menit = skrg.getMinutes();
      const detik = skrg.getSeconds();

      if (jam === 0 && menit === 0) {
        statusSudahBunyiHariIni = false;
      }

      // Pukul 12:00:00 WIB di hari sekolah (Senin - Jumat)
      if (hari >= 1 && hari <= 5 && jam === 12 && menit === 0 && detik === 0 && !statusSudahBunyiHariIni) {
        const loncengAktif = localStorage.getItem('sibintang_lonceng_aktif') !== 'false';
        if (loncengAktif) {
          statusSudahBunyiHariIni = true;
          bunyikanLoncengGereja(true);
          if (typeof showToast === 'function') {
            showToast('✝ Saatnya Doa Malaikat Tuhan (Angelus) Pukul 12.00 WIB', 'info');
          }
          if (typeof bukaModalTeksDoaSiswa === 'function') {
            bukaModalTeksDoaSiswa();
          } else if (typeof bukaModalTeksDoaGuru === 'function') {
            bukaModalTeksDoaGuru();
          }
        }
      }
    }, 1000);
  }

  window.bunyikanLoncengGereja = bunyikanLoncengGereja;

  /**
   * Memeriksa apakah aplikasi berjalan di lingkungan pengembangan lokal
   * @returns {boolean}
   */
  function isLocalHost() {
    const host = window.location.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      window.location.protocol === 'file:'
    );
  }

  // ==========================================================================
  // 6. MAIN BOOTSTRAPPER (EKSEKUSI PEMUATAN MODUL)
  // ==========================================================================
  async function bootApp() {
    try {
      // 1. Muat mock-local.js HANYA jika berada di localhost dan berkas tersedia
      if (isLocalHost()) {
        try {
          await muatScript('/js/mock-local.js');
          console.log('[SiBintang] Lingkungan lokal terdeteksi: mock-local.js berhasil diaktifkan.');
        } catch {
          console.info('[SiBintang] mock-local.js tidak ditemukan/diabaikan gitignore. Melanjutkan dengan API reguler.');
        }
      } else {
        console.log('[SiBintang] Lingkungan produksi/live terdeteksi: Menggunakan backend API server.');
      }

      // 2. Muat pustaka data dasar dan status sesi secara berurutan
      await muatScript('/js/constants.js');
      await muatScript('/js/auth.js');

      // 3. Jalankan fitur umum lingkungan aplikasi
      inisialisasiServiceWorker();
      inisialisasiBannerIos();
      inisialisasiTimerAngelusOtomatis();

      // Render footer secara aman setelah constants.js termuat
      if (typeof renderFooter === 'function') {
        renderFooter('footerContainer');
      }

      if (navigator.onLine) {
        prosesSinkronisasiAntrean();
      }

      // 4. Muat file controller sesuai konteks halaman aktif
      const mode = deteksiKonteksHalaman();
      if (mode === 'guru') {
        await muatScript('/js/guru.js');
        if (typeof inisialisasiPortalGuru === 'function') {
          inisialisasiPortalGuru();
        }
      } else {
        await muatScript('/js/siswa.js');
        if (typeof inisialisasiPortalSiswa === 'function') {
          inisialisasiPortalSiswa();
        }
      }

      console.log(`[SiBintang] Aplikasi berjalan sukses pada mode: ${mode.toUpperCase()}`);
    } catch (error) {
      console.error('[SiBintang] Kesalahan fatal saat booting aplikasi:', error);
    }
  }

  // Eksekusi boot saat dokumen DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
  } else {
    bootApp();
  }
})();
