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
  'Muatan Lokal / Bahasa Daerah'
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

// Data Isi Otomatis Template Pengumuman
const TEMPLATE_PENGUMUMAN_DATA = {
  renungan_pagi: {
    kategori: 'Keagamaan / Liturgi',
    judul: 'Jadwal Renungan & Doa Pagi Bersama di Kelas',
    isi: 'Salam damai Kristus,\n\nDiberitahukan kepada seluruh siswa-siswi dan Bapak/Ibu Wali Kelas SD Swasta RK Bintang Timur Rantauprapat:\n\nSetiap hari kegiatan belajar mengajar akan diawali dengan Renungan Pagi dan Doa Pembuka bersama pada pukul 07.15 WIB di ruang kelas masing-masing.\n\nPetugas giliran pembacaan Sabda Kitab Suci dan pemimpin doa dimohon mempersiapkan diri dengan baik. Seluruh siswa diharapkan sudah hadir di kelas sebelum lonceng berbunyi dan mengikuti renungan dengan sikap hening, sopan, dan khidmat.\n\n"Tuhan adalah terangku dan keselamatanku, kepada siapakah aku harus takut?" (Mzm 27:1)'
  },
  doa_angelus: {
    kategori: 'Keagamaan / Liturgi',
    judul: 'Doa Malaikat Tuhan (Angelus) Pukul 12.00 WIB',
    isi: 'Diberitahukan kepada seluruh keluarga besar SD Swasta RK Bintang Timur Rantauprapat:\n\nTepat pukul 12.00 WIB saat lonceng doa dibunyikan, seluruh kegiatan belajar mengajar dan aktivitas kelas dihentikan sejenak untuk mendaraskan Doa Malaikat Tuhan (Angelus) secara bersama-sama di kelas masing-masing.\n\nMarilah kita mengheningkan cipta untuk menyapa Bunda Maria dan mensyukuri karya penyelamatan Tuhan Yesus bagi kita semua.\n\nBunda Maria Bintang Samudera, doakanlah kami. Amin.'
  },
  doa_penutup: {
    kategori: 'Keagamaan / Liturgi',
    judul: 'Doa Penutup dan Syukur Sebelum Pulang Sekolah',
    isi: 'Diberitahukan kepada seluruh siswa agar senantiasa menutup proses belajar dengan Doa Syukur, Doa Bapa Kami, dan Salam Maria sebelum meninggalkan ruangan kelas.\n\nPastikan meja dan kursi dirapikan kembali, kebersihan kelas terjaga, serta berdoa memohon perlindungan Tuhan agar seluruh siswa dan guru tiba di rumah dengan selamat.'
  },
  libur: {
    kategori: 'Libur & Cuti Bersama',
    judul: 'Jadwal Libur Sekolah dan Cuti Bersama',
    isi: 'Diberitahukan kepada seluruh siswa dan orang tua murid SD RK Bintang Timur Rantauprapat bahwa kegiatan belajar mengajar diliburkan mulai tanggal ... sampai dengan ... dalam rangka libur semester. Kegiatan sekolah akan aktif kembali seperti biasa pada hari ...'
  },
  rapor: {
    kategori: 'Akademik & Ujian',
    judul: 'Jadwal Pengambilan Rapor / Buku Laporan Hasil Belajar',
    isi: 'Kepada Bapak/Ibu Orang Tua/Wali murid, diundang untuk hadir pada pengambilan Buku Laporan Hasil Belajar (Rapor) semester ini yang akan dilaksanakan pada hari ..., tanggal ..., pukul ... bertempat di ruang kelas masing-masing.'
  },
  tugas: {
    kategori: 'Akademik & Ujian',
    judul: 'Peringatan Pengumpulan Tugas dan PR Sekolah',
    isi: 'Diingatkan kepada seluruh siswa untuk segera menyelesaikan dan mengumpulkan PR atau tugas sekolah yang belum diserahkan melalui aplikasi SiBintang sebelum batas waktu yang telah ditentukan oleh guru mata pelajaran.'
  },
  upacara: {
    kategori: 'Kegiatan & Ekstrakurikuler',
    judul: 'Pemberitahuan Kegiatan Upacara / Ekstrakurikuler Wajib',
    isi: 'Diberitahukan kepada seluruh siswa agar hadir tepat waktu pada kegiatan sekolah yang akan dilaksanakan pada hari ... pukul ... dengan mengenakan pakaian seragam lengkap sesuai ketentuan sekolah.'
  }
};

// ============================================================================
// 3. KOLEKSI IKON SVG TERPADU (ICONS)
// ============================================================================

const ICONS = {
  check: `<svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
  error: `<svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
  info: `<svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  star: `<svg class="w-3.5 h-3.5 text-amber-500 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`,
  external: `<svg class="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>`,
  chat: `<svg class="w-3.5 h-3.5 text-slate-500 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
  wa: `<svg class="w-3.5 h-3.5 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/></svg>`,
  edit: `<svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  upload: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`,
  plus: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
  save: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
  send: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`
};

window.ICONS = ICONS;

// ============================================================================
// 4. TEMPLATE FOOTER RESMI SIBINTANG
// ============================================================================

const FOOTER_HTML = `
<footer id="mainFooter" class="w-full flex-shrink-0 bg-slate-900 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif] border-t-4 border-amber-500 no-print mt-auto">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">
      <!-- Kolom 1: Profil Lembaga & Logo -->
      <div class="md:col-span-5 space-y-3 text-center md:text-left">
        <div class="flex items-center justify-center md:justify-start space-x-3.5">
          <img src="/icon.png" alt="Logo SiBintang" class="w-14 h-14 object-contain flex-shrink-0 logo-contour-stroke" />
          <div>
            <h3 class="font-bold text-white text-base leading-tight">SiBintang PWA</h3>
            <p class="text-xs text-amber-400 font-semibold tracking-wide">SD Swasta RK Bintang Timur Rantauprapat</p>
          </div>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed pr-0 md:pr-4">
          Sistem Informasi Manajemen Sekolah dan Presensi Digital terintegrasi untuk mendukung ketertiban administrasi belajar mengajar di bawah naungan <span class="text-slate-200 font-semibold">Yayasan Perguruan Katolik Santo Laurensius</span>.
        </p>
        <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
          <span class="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-lg">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            Akreditasi A
          </span>
          <span class="inline-flex items-center bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            NPSN: 10205570
          </span>
          <span class="inline-flex items-center bg-slate-800 border border-slate-700 text-blue-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            PWA Ready
          </span>
        </div>
      </div>

      <!-- Kolom 2: Lokasi Sekolah -->
      <div class="md:col-span-4 space-y-2.5 text-center md:text-left">
        <h4 class="text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center md:justify-start gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Alamat & Lokasi</span>
        </h4>
        <div class="space-y-2 text-xs text-slate-400 leading-relaxed">
          <div class="flex items-start justify-center md:justify-start gap-2">
            <svg class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p>
              Jl. Cut Mutia No. 10 (Jln. Cut Meutia Ujung), Kel. Siringo-Ringo, Kec. Rantau Utara, Kab. Labuhanbatu, Sumatera Utara 21413.
            </p>
          </div>
          <div class="pt-1">
            <a href="https://maps.google.com/?q=SD+RK+Bintang+Timur+Rantauprapat" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold text-xs transition">
              <span>Buka di Google Maps</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Kolom 3: Kontak & Jam Operasional -->
      <div class="md:col-span-3 space-y-2.5 text-center md:text-left">
        <h4 class="text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center md:justify-start gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Kontak Resmi</span>
        </h4>
        <div class="space-y-2 text-xs text-slate-400">
          <div class="flex items-center justify-center md:justify-start gap-2">
            <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>0624-2602068</span>
          </div>
          <div class="flex items-center justify-center md:justify-start gap-2">
            <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span class="break-all">sdrk_bintangtimur@yahoo.com</span>
          </div>
          <div class="flex items-center justify-center md:justify-start gap-2">
            <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Senin - Sabtu (07.15 - 13.00 WIB)</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Baris Bawah: Hak Cipta -->
  <div class="bg-slate-950 py-3.5 px-4 border-t border-slate-800 text-center text-slate-400 text-xs">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
      <div class="flex items-center space-x-2">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span class="text-slate-300 font-medium">SiBintang PWA v2.0</span>
        <span class="text-slate-600">|</span>
        <span class="text-slate-400">Arsitektur Cloud Google Workspace</span>
      </div>
      <p class="text-[11px] text-slate-500">
        Hak Cipta &copy; 2026 <b class="text-slate-400">Yayasan Perguruan Katolik Santo Laurensius</b>. Seluruh hak cipta dilindungi undang-undang.
      </p>
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
    container.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none no-print';
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
  toast.className = `pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${config.bg} transform transition-all duration-300 translate-y-[-20px] opacity-0`;
  toast.innerHTML = `
    <div class="flex items-center gap-2.5 overflow-hidden">
      ${config.icon}
      <span class="text-xs font-medium leading-snug">${pesan}</span>
    </div>
    <button type="button" class="text-white/70 hover:text-white p-1 text-xs font-bold transition">✕</button>
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

// Buka akses ke window global
window.konfirmasiModal = konfirmasiModal;
window.showToast = showToast;
window.bunyikanBeep = bunyikanBeep;
window.renderFooter = renderFooter;
window.isiDropdown = isiDropdown;
window.isiDropdownGrup = isiDropdownGrup;
