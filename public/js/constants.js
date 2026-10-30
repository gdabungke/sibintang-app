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
