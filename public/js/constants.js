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

// Master Daftar Kelas
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

// Master Target Pengumuman
const DAFTAR_TARGET_PENGUMUMAN = [
  { val: 'SEMUA', label: 'Semua Siswa (Global Seluruh Sekolah)' },
  ...DAFTAR_KELAS.map(k => ({ val: k, label: `Khusus Siswa Kelas ${k}` }))
];

// Master Kategori Pengumuman
const DAFTAR_KATEGORI_PENGUMUMAN = [
  'Umum',
  'Akademik & Ujian',
  'Libur & Cuti Bersama',
  'Kegiatan & Ekstrakurikuler',
  'Keuangan / SPP',
  'Penting & Mendesak'
];

// Master Template Pengumuman
const DAFTAR_TEMPLATE_PENGUMUMAN = [
  { val: '', label: '-- Pilih Template Pengumuman (Opsional) --' },
  { val: 'libur', label: 'Jadwal Libur Semester & Cuti Bersama' },
  { val: 'rapor', label: 'Jadwal Pengambilan Buku Rapor' },
  { val: 'tugas', label: 'Peringatan Pengumpulan Tugas / PR' },
  { val: 'upacara', label: 'Kegiatan Upacara / Seragam Wajib' }
];

const TEMPLATE_PENGUMUMAN_DATA = {
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

// ==========================================
// TEMPLATE FOOTER RESMI SIBINTANG
// ==========================================
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

      <!-- Kolom 3: Kontak & Layanan -->
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

  <!-- Baris Bawah: Hak Cipta & Lisensi -->
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

/**
 * Fungsi otomatis untuk menyisipkan footer ke dalam kontainer
 * @param {string} containerId - ID elemen target container (default: 'footerContainer')
 */
function renderFooter(containerId = 'footerContainer') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = FOOTER_HTML;
  } else {
    // Fallback: Jika tidak ada container, otomatis tempelkan sebelum akhir </body>
    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
  }
}

/**
 * Mengisi dropdown <select> secara dinamis
 * @param {string} selectId - ID elemen select di HTML
 * @param {Array<string>} dataList - Array data pilihan
 * @param {string} placeholder - Teks opsi default pertama (opsional)
 * @param {boolean} includeSemua - Opsi tambahan 'SEMUA' untuk filter/rekap (opsional)
 */
// Helper Pengisi Dropdown Otomatis
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
