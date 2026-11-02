/**
 * ============================================================================
 * SIBINTANG - SHARED CONSTANTS & UI HELPERS (constants.js)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Berkas ini bertindak sebagai pusat master data statis sekolah, template
 * liturgi doa Katolik, koleksi ikon SVG, dan fungsi utilitas antarmuka (UI).
 */

// ============================================================================
// 1. MASTER DATA SEKOLAH (ROLE, KELAS, MAPEL, TOKEN)
// ============================================================================

// Master Data Peran (Role) Pengelola
const DAFTAR_ROLE_GURU = [
  'Guru Kelas',
  'Guru Mata Pelajaran',
  'Kepala Sekolah',
  'Operator'
];

// Master Target Kategori Generator Token Admin
const DAFTAR_TARGET_TOKEN = [
  {
    grup: 'Kategori Staf / Pengelola',
    items: ['Guru Kelas', 'Guru Mata Pelajaran', 'Kepala Sekolah', 'Operator']
  },
  {
    grup: 'Kategori Siswa per Tingkat',
    items: [
      'Siswa - Kelas 1',
      'Siswa - Kelas 2',
      'Siswa - Kelas 3',
      'Siswa - Kelas 4',
      'Siswa - Kelas 5',
      'Siswa - Kelas 6'
    ]
  }
];

// Master Daftar Rombongan Belajar (Kelas)
const DAFTAR_KELAS = [
  '1A', '1B', '2A', '2B', '3A', '3B',
  '4A', '4B', '5A', '5B', '6A', '6B'
];

// Master Daftar Mata Pelajaran
const DAFTAR_MAPEL = [
  'Pendidikan Agama & Budi Pekerti',
  'Pendidikan Pancasila (PPKn)',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam & Sosial (IPAS)',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
  'Seni Budaya & Prakarya (SBdP)',
  'Bahasa Inggris',
  'Muatan Lokal / Informatika'
];

// ============================================================================
// 2. MASTER PENGUMUMAN & TEMPLATE LITURGI DOA KATOLIK
// ============================================================================

// Master Target Pengumuman
const DAFTAR_TARGET_PENGUMUMAN = [
  { val: 'SEMUA', label: 'Semua Siswa (Global Seluruh Sekolah)' },
  ...DAFTAR_KELAS.map(k => ({ val: k, label: `Khusus Siswa Kelas ${k}` }))
];

// Master Kategori Pengumuman
const DAFTAR_KATEGORI_PENGUMUMAN = [
  'Umum',
  'Akademik & Ujian',
  'Keagamaan / Liturgi',
  'Libur & Cuti Bersama',
  'Kegiatan & Ekstrakurikuler',
  'Pengumuman Resmi Sekolah'
];

// Master Pilihan Template Pengumuman Cepat
const DAFTAR_TEMPLATE_PENGUMUMAN = [
  { val: '', label: '-- Pilih Template Pengumuman (Opsional) --' },
  { val: 'renungan_pagi', label: '✝ Jadwal Renungan & Doa Pagi Kelas (07.15 WIB)' },
  { val: 'doa_angelus', label: '✝ Jadwal Doa Malaikat Tuhan (Angelus Pk 12.00)' },
  { val: 'doa_penutup', label: '✝ Tertib Doa Penutup Pembelajaran & Pulang' },
  { val: 'libur', label: 'Jadwal Libur Semester & Cuti Bersama' },
  { val: 'rapor', label: 'Jadwal Pengambilan Buku Rapor' },
  { val: 'tugas', label: 'Peringatan Pengumpulan Tugas / PR' },
  { val: 'upacara', label: 'Kegiatan Upacara / Seragam Wajib' }
];

// ============================================================================
// 4. TEMPLATE FOOTER RESMI SIBINTANG (3 LAPIS OMBAK & SILUET GEREJA DETAIL BER-SALIB)
// ============================================================================

const FOOTER_HTML = `
<!-- CSS Keyframe Inline untuk Animasi 3 Lapis Ombak Dinamis -->
<style>
@keyframes waveThree1 {
  0% { transform: translateX(0); }
  50% { transform: translateX(-10%); }
  100% { transform: translateX(0); }
}
@keyframes waveThree2 {
  0% { transform: translateX(0); }
  50% { transform: translateX(-15%); }
  100% { transform: translateX(0); }
}
.animate-wave-t1 { animation: waveThree1 12s ease-in-out infinite; }
.animate-wave-t2 { animation: waveThree2 8s ease-in-out infinite; }
</style>

<!-- TRANSISI LAUT KE PANTAI DENGAN 3 LAPISAN GELOMBANG & SILUET GEREJA BER-SALIB -->
<div class="relative w-full overflow-hidden leading-none pointer-events-none select-none hidden sm:block bg-slate-100 -mb-[1px]">
  <svg class="relative block w-full h-20 sm:h-28 text-slate-900" viewBox="0 0 2880 140" preserveAspectRatio="none">
    
    <!-- SILUET GEREJA MEGAH BER-SALIB & ORANG MENEMPEL RAPAT KE DASAR FOOTER -->
    <g fill="currentColor" class="text-slate-900">
      <!-- Menara Utama Gereja yang Lebih Tinggi & Kokoh -->
      <path d="M2635,140 L2635,35 L2670,10 L2705,35 L2705,140 Z" opacity="0.95" />
      
      <!-- Salib Besar di Puncak Menara Gereja -->
      <path d="M2670,0 L2670,18 M2662,6 L2678,6" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      
      <!-- Detail Jendela Menara & Pintu Utama Gereja -->
      <path d="M2665,45 L2675,45 L2675,65 L2665,65 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2660,115 C2660,100 2680,100 2680,115 L2680,140 L2660,140 Z" fill="#0f172a" opacity="0.8" />

      <!-- Badan & Atap Sayap Gedung Gereja -->
      <path d="M2540,140 L2540,75 L2800,75 L2800,140 Z" opacity="0.95" />
      <path d="M2520,75 L2670,25 L2820,75 Z" opacity="0.95" />
      
      <!-- Jendela Samping Gereja (Kiri & Kanan) -->
      <path d="M2570,90 L2590,90 L2590,120 L2570,120 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2610,90 L2630,90 L2630,120 L2610,120 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2710,90 L2730,90 L2730,120 L2710,120 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2750,90 L2770,90 L2770,120 L2750,120 Z" fill="#0f172a" opacity="0.6" />

      <!-- Siluet Orang Berdiri Menikmati Pemandangan Pantai di Samping Gereja -->
      <circle cx="2450" cy="112" r="4" />
      <path d="M2450,116 L2450,129 M2446,120 L2454,120 M2450,129 L2446,140 L2454,140" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      
      <circle cx="2466" cy="114" r="3.5" />
      <path d="M2466,118 L2466,130 M2462,122 L2470,122 M2466,130 L2463,140 L2469,140" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </g>

    <!-- 3 Lapis Gelombang Ombak Alami dari Kiri (Besar) Mengecil ke Kanan (Daratan Pantai) -->
    <path d="M0,75 C450,110 900,50 1500,100 C2100,130 2500,138 2880,140 L2880,140 L0,140 Z" fill="currentColor" fill-opacity="0.2" class="animate-wave-t1" style="animation-duration: 14s;"></path>
    <path d="M0,95 C400,125 950,70 1550,115 C2150,135 2500,139 2880,140 L2880,140 L0,140 Z" fill="currentColor" fill-opacity="0.4" class="animate-wave-t2" style="animation-duration: 10s;"></path>
    <path d="M0,110 C500,135 1000,90 1600,122 C2200,140 2550,140 2880,140 L2880,140 L0,140 Z" fill="currentColor" fill-opacity="0.8" class="animate-wave-t1" style="animation-duration: 7s;"></path>
  </svg>
</div>

<footer id="mainFooter" class="relative w-full flex-shrink-0 bg-slate-900 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif] no-print mt-auto overflow-hidden">
  
  <!-- KONTEN UTAMA FOOTER -->
  <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-4 md:pb-5">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">
      
      <!-- KOLOM KIRI (Lebar 5/12): Identitas & Kontak Singkat -->
      <div class="md:col-span-5 space-y-2 text-center md:text-left">
        <div class="flex items-center justify-center md:justify-start space-x-2.5">
          <img src="/icon.png" alt="Logo SiBintang" class="w-9 h-9 object-contain shrink-0 logo-contour-stroke" />
          <div>
            <h3 class="font-black text-white text-xs sm:text-sm leading-tight tracking-tight">SiBintang PWA v.3.0.0</h3>
            <p class="text-[10px] sm:text-[11px] text-amber-400 font-bold leading-tight">SD Swasta RK Bintang Timur Rantauprapat</p>
          </div>
        </div>

        <p class="text-[11px] text-slate-300 leading-snug pr-0 md:pr-2">
          Sistem Informasi Presensi Digital & Akademik di bawah naungan <span class="text-white font-semibold">Yayasan Perguruan Katolik Santo Laurensius</span>.
        </p>

        <p class="text-[10px] text-slate-400">
          Jl. Cut Mutia No. 10, Rantauprapat | <span class="text-slate-300 font-medium">NPSN: 10205570 (Akreditasi A)</span>
        </p>

        <!-- Tombol Aksi Cepat Kompak dengan Efek Hover -->
        <div class="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
          <a href="https://maps.google.com/?q=SD+RK+Bintang+Timur+Rantauprapat" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-blue-400 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700/60 transition active:scale-95 shadow-sm">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Google Maps</span>
          </a>
          <a href="tel:06242602068" class="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700/60 transition active:scale-95 shadow-sm">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>0624-2602068</span>
          </a>
        </div>
      </div>

      <!-- KOLOM KANAN (Lebar 7/12): 3 Menu Navigasi Rapat & Responsif -->
      <div class="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-left pt-1 md:pt-0">
        
        <!-- Menu 1: Layanan Aplikasi -->
        <div class="space-y-1">
          <h4 class="text-[11px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Layanan</span>
          </h4>
          <ul class="space-y-0.5 text-[11px] text-slate-300">
            <li><a href="/" class="hover:text-amber-400 transition">Portal Siswa</a></li>
            <li><a href="/guru.html" class="hover:text-amber-400 transition">Portal Guru & Pengelola</a></li>
            <li><span class="text-slate-400">Presensi QR Harian</span></li>
            <li><span class="text-slate-400">Tugas Google Drive</span></li>
            <li><span class="text-slate-400">Surat Izin / Sakit</span></li>
          </ul>
        </div>

        <!-- Menu 2: Liturgi Sekolah -->
        <div class="space-y-1">
          <h4 class="text-[11px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            <span>Liturgi</span>
          </h4>
          <ul class="space-y-0.5 text-[11px] text-slate-300">
            <li><span class="text-white font-medium">Renungan:</span> 07.15 WIB</li>
            <li><span class="text-white font-medium">Angelus:</span> 12.00 WIB</li>
            <li><span class="text-white font-medium">Doa Pulang:</span> Akhir KBM</li>
            <li><span class="text-slate-400">St. Laurensius</span></li>
          </ul>
        </div>

        <!-- Menu 3: Jam Belajar & Kontak -->
        <div class="space-y-1 col-span-2 sm:col-span-1">
          <h4 class="text-[11px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Operasional</span>
          </h4>
          <div class="space-y-0.5 text-[11px] text-slate-300">
            <p><b class="text-white">Senin - Sabtu:</b> 07.15 - 13.00</p>
            <p class="pt-0.5"><b class="text-white">Email:</b><br><a href="mailto:sdrk_bintangtimur@yahoo.com" class="break-all text-blue-400 hover:underline">sdrk_bintangtimur@yahoo.com</a></p>
          </div>
        </div>

      </div>

    </div>
  </div>

  <!-- BARIS BAWAH: HAK CIPTA & STATUS SISTEM -->
  <div class="relative z-10 bg-slate-950 py-2 px-4 border-t border-slate-800/60 text-slate-400 text-xs">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
      
      <p class="text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-left">
        &copy; 2026 <b class="text-slate-200">SD Swasta RK Bintang Timur Rantauprapat</b>. All rights reserved.
      </p>

      <div class="flex items-center gap-3">
        <div class="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-400">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Google Workspace Cloud</span>
        </div>
        <button type="button" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" title="Kembali ke atas" class="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/60 cursor-pointer">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
        </button>
      </div>

    </div>
  </div>

</footer>
`;

function renderFooter(containerId = 'footerContainer') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = FOOTER_HTML;
  } else {
    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
  }
}

// ============================================================================
// 5. HELPER PENGISI DROPDOWN SELECT
// ============================================================================

function isiDropdown(selectId, items, placeholder = '', opsiTambahan = null) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = '';

  if (placeholder) {
    const optDef = document.createElement('option');
    optDef.value = '';
    optDef.textContent = placeholder;
    optDef.disabled = true;
    optDef.selected = true;
    el.appendChild(optDef);
  }

  if (opsiTambahan) {
    const optExtra = document.createElement('option');
    optExtra.value = opsiTambahan.val;
    optExtra.textContent = opsiTambahan.label;
    el.appendChild(optExtra);
  }

  items.forEach(item => {
    const opt = document.createElement('option');
    if (typeof item === 'object') {
      opt.value = item.val;
      opt.textContent = item.label;
    } else {
      opt.value = item;
      opt.textContent = item;
    }
    el.appendChild(opt);
  });
}

function isiDropdownGrup(selectId, dataGrup) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = '';

  dataGrup.forEach(g => {
    const groupEl = document.createElement('optgroup');
    groupEl.label = g.grup;

    g.items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      groupEl.appendChild(opt);
    });

    el.appendChild(groupEl);
  });
}

// ============================================================================
// 6. TOAST NOTIFICATION & AUDIO BEEP FEEDBACK
// ============================================================================

function showToast(pesan, tipe = 'info') {
  let container = document.getElementById('toastContainerGlobal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainerGlobal';
    // DIPERBAIKI: Menggunakan top-20 dan right-4 agar berada di bawah header & sejajar area profil
    container.className = 'fixed top-20 right-4 sm:right-6 z-[100] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none no-print';
    document.body.appendChild(container);
  }

  const skema = {
    success: {
      bg: 'bg-emerald-600/95 border-emerald-500/40 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
    },
    error: {
      bg: 'bg-rose-600/95 border-rose-500/40 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
    },
    warning: {
      bg: 'bg-amber-600/95 border-amber-500/40 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
    },
    info: {
      bg: 'bg-slate-900/95 border-slate-700/50 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    }
  };

  const config = skema[tipe] || skema.info;
  const toast = document.createElement('div');
  // Animasi masuk dari atas ke bawah secara lembut
  toast.className = `pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${config.bg} transform transition-all duration-300 translate-y-[-20px] opacity-0`;
  toast.innerHTML = `
    <div class="flex items-center gap-2.5 overflow-hidden">
      ${config.icon}
      <span class="text-xs font-medium leading-snug">${pesan}</span>
    </div>
    <button type="button" class="text-white/70 hover:text-white p-1 text-xs font-bold transition cursor-pointer">✕</button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-20px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  const tutupToast = () => {
    toast.classList.add('translate-y-[-20px]', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('button').addEventListener('click', tutupToast);
  setTimeout(tutupToast, 3500);
}

let audioCtxSiBintang = null;

function dapatkanAudioContext() {
  if (!audioCtxSiBintang) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtxSiBintang = new AudioContextClass();
    }
  }
  if (audioCtxSiBintang && audioCtxSiBintang.state === 'suspended') {
    audioCtxSiBintang.resume();
  }
  return audioCtxSiBintang;
}

function bunyikanBeep(tipe = 'success') {
  try {
    const ctx = dapatkanAudioContext();
    if (!ctx) return;

    const sekarang = ctx.currentTime;

    if (tipe === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(880, sekarang);
      gain.gain.setValueAtTime(0.15, sekarang);

      osc.frequency.setValueAtTime(1320, sekarang + 0.08);
      gain.gain.setValueAtTime(0.15, sekarang + 0.08);

      gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.25);

      osc.start(sekarang);
      osc.stop(sekarang + 0.25);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(300, sekarang);
      gain.gain.setValueAtTime(0.2, sekarang);

      osc.frequency.setValueAtTime(200, sekarang + 0.12);
      gain.gain.setValueAtTime(0.2, sekarang + 0.12);

      gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.35);

      osc.start(sekarang);
      osc.stop(sekarang + 0.35);
    }
  } catch (err) {
    console.warn('Gagal memutar audio beep:', err);
  }
}

// ============================================================================
// 7. ADAPTIVE ASYNC MODAL CONFIRMATION
// ============================================================================

function konfirmasiModal({
  judul = 'Konfirmasi Tindakan',
  pesan = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  teksKonfirmasi = 'Ya, Lanjutkan',
  teksBatal = 'Batal',
  tipe = 'warning'
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.id = 'modalKonfirmasiBackdrop';
    backdrop.className =
      'fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 opacity-0';

    const skema = {
      warning: {
        iconBg: 'bg-amber-500/10 border-amber-500/25 ring-8 ring-amber-500/5',
        iconGlow: 'bg-amber-400/20',
        btnConfirm:
          'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30',
        svg: `
          <svg class="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H6a2 2 0 00-2 2v10a2 2 0 002 2h7" stroke-dasharray="2 2" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.15" stroke-width="2"/>
          </svg>
        `
      },
      danger: {
        iconBg: 'bg-rose-500/10 border-rose-500/25 ring-8 ring-rose-500/5',
        iconGlow: 'bg-rose-400/20',
        btnConfirm:
          'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg shadow-rose-600/30',
        svg: `
          <svg class="w-8 h-8 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        `
      },
      info: {
        iconBg: 'bg-indigo-500/10 border-indigo-500/25 ring-8 ring-indigo-500/5',
        iconGlow: 'bg-indigo-400/20',
        btnConfirm:
          'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-600/30',
        svg: `
          <svg class="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `
      }
    };

    const config = skema[tipe] || skema.warning;

    backdrop.innerHTML = `
      <div id="modalBoxElement" class="relative w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-t sm:border border-slate-100/80 text-center transform transition-all duration-300 ease-out translate-y-full sm:translate-y-4 sm:scale-95 pb-8 sm:pb-7 overflow-hidden">
        <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 ${config.iconGlow} rounded-full blur-2xl pointer-events-none"></div>
        <div class="sm:hidden w-12 h-1 bg-slate-300/80 rounded-full mx-auto mb-6"></div>
        <div class="relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border ${config.iconBg} mb-5 shadow-sm">
          ${config.svg}
        </div>
        <h3 class="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug">${judul}</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed px-2 font-medium">${pesan}</p>
        <div class="mt-7 grid grid-cols-2 gap-3">
          <button type="button" id="btnModalBatal" class="cursor-pointer py-3 sm:py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all">
            ${teksBatal}
          </button>
          <button type="button" id="btnModalKonfirmasi" class="cursor-pointer py-3 sm:py-2.5 px-4 rounded-xl text-xs font-bold active:scale-95 transition-all ${config.btnConfirm}">
            ${teksKonfirmasi}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const modalBox = backdrop.querySelector('#modalBoxElement');

    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      modalBox.classList.remove('translate-y-full', 'sm:translate-y-4', 'sm:scale-95');
      modalBox.classList.add('translate-y-0', 'sm:scale-100');
    });

    const tutup = (hasil) => {
      backdrop.classList.add('opacity-0');
      modalBox.classList.remove('translate-y-0', 'sm:scale-100');
      modalBox.classList.add('translate-y-full', 'sm:translate-y-4', 'sm:scale-95');
      setTimeout(() => {
        backdrop.remove();
        resolve(hasil);
      }, 250);
    };

    backdrop.querySelector('#btnModalKonfirmasi').addEventListener('click', () => tutup(true));
    backdrop.querySelector('#btnModalBatal').addEventListener('click', () => tutup(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) tutup(false);
    });
  });
}

// ============================================================================
// KOLEKSI IKON GLOBAL UNTUK GURU.JS & PORTAL
// ============================================================================
var ICONS = {
  check: `<svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
  error: `<svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
  info: `<svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  star: `<svg class="w-3.5 h-3.5 text-amber-500 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`,
  external: `<svg class="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`,
  edit: `<svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  wa: `<svg class="w-3.5 h-3.5 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/></svg>`,
  upload: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`,
  plus: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
  save: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
  send: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`,
  chat: `<svg class="w-3.5 h-3.5 text-slate-500 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`
};

// ============================================================================
// UPLOAD FILE GOOGLE DRIVE VIA APPS SCRIPT (@belajar.id)
// ============================================================================
const WEB_APP_URL_DRIVE = "https://script.google.com/macros/s/AKfycbze6KdWG7_PT2ZJ1Gtbyy8NGhfGtuefojUNspmYrL3y7oSQnSJTREuqYn1UcsXirQ/exec";

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Upload file langsung ke Drive via Apps Script
 * @param {File} fileObj - Objek file dari input
 * @param {string} customFileName - Nama kustom file (opsional)
 * @param {string} subFolder - Nama sub-folder target di Drive (opsional)
 */
async function uploadFileKeDrivePribadi(fileObj, customFileName = "", subFolder = "") {
  if (!fileObj) return null;

  try {
    const base64Data = await toBase64(fileObj);
    
    // Ambil ekstensi asli berkas (misal .pdf, .jpg, .png)
    const ekstensi = fileObj.name.includes('.') 
      ? '.' + fileObj.name.split('.').pop() 
      : '';

    // Gunakan customFileName jika diberikan, pastikan ekstensinya tetap menempel
    let namaAkhir = fileObj.name;
    if (customFileName && customFileName.trim() !== '') {
      const namaBersih = customFileName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_');
      namaAkhir = namaBersih.endsWith(ekstensi) ? namaBersih : `${namaBersih}${ekstensi}`;
    }

    const payload = {
      fileName: namaAkhir,
      mimeType: fileObj.type || 'application/octet-stream',
      fileData: base64Data.split(',')[1],
      subFolder: subFolder || ""
    };

    const response = await fetch(WEB_APP_URL_DRIVE, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status === 'success') {
      return result.fileUrl; // Mengembalikan link Google Drive
    } else {
      throw new Error(result.message || 'Gagal menyimpan berkas ke Google Drive');
    }
  } catch (error) {
    console.error('[Upload Drive Error]:', error);
    throw error;
  }
}

// ============================================================================
// HELPER DETEKSI & EMBED VIDEO YOUTUBE MATERI TUGAS
// ============================================================================

/**
 * Mengekstrak ID 11 karakter video YouTube dari berbagai format tautan
 * (dukungan: watch?v=, youtu.be, shorts, embed, mobile)
 * @param {string} url
 * @returns {string|null}
 */
function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Merender iframe responsif pemutar YouTube ramah perangkat seluler
 * @param {string} url
 * @returns {string} HTML embed player
 */
function renderYouTubeEmbed(url) {
  const ytId = getYouTubeId(url);
  if (!ytId) return '';
  return `
    <div class="mt-2.5 rounded-2xl overflow-hidden shadow-sm border border-slate-200 aspect-video bg-black max-w-full">
      <iframe 
        class="w-full h-full" 
        src="https://www.youtube-nocookie.com/embed/${ytId}" 
        title="Materi Pembelajaran YouTube" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    </div>
  `;
}

// Buka akses ke window global
window.getYouTubeId = getYouTubeId;
window.renderYouTubeEmbed = renderYouTubeEmbed;
window.toBase64 = toBase64;
window.uploadFileKeDrivePribadi = uploadFileKeDrivePribadi;
window.konfirmasiModal = konfirmasiModal;
window.showToast = showToast;
window.bunyikanBeep = bunyikanBeep;
window.renderFooter = renderFooter;
window.isiDropdown = isiDropdown;
window.isiDropdownGrup = isiDropdownGrup;
window.ICONS = ICONS;
