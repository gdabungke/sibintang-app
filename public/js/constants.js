/**
 * ============================================================================
 * SIBINTANG - MASTER DATA, RBAC MATRIX & STATIC TEMPLATES (public/js/constants.js)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.2.0)
 * ============================================================================
 * Berkas ini bertindak sebagai pusat konfigurasi data master sekolah, URL
 * Web App Google Apps Script Drive (@belajar.id), matriks default hak akses
 * peran (RBAC), template pengumuman & liturgi doa Katolik, koleksi ikon SVG
 * global, dan template footer resmi.
 *
 * Susunan Kode:
 * 1. Konfigurasi Endpoint Google Apps Script Drive & Master Data Sekolah
 * 2. Matriks Default Hak Akses Peran (DEFAULT_ROLE_PERMISSIONS) & Pengaturan Sekolah
 * 3. Master Pengumuman & Template Liturgi Doa Katolik
 * 4. Koleksi Ikon SVG Global (ICONS - Termasuk PDF, XLSX, YouTube, Globe, Setting)
 * 5. Template & Fungsi Render Footer Resmi (FOOTER_HTML, renderFooter)
 * 6. Ekspor Global Window
 */

// ============================================================================
// 1. KONFIGURASI ENDPOINT GOOGLE APPS SCRIPT DRIVE & MASTER DATA SEKOLAH
// ============================================================================

/**
 * URL Web App Google Apps Script (Akun @belajar.id) untuk pengunggahan berkas
 * langsung ke Google Drive (menggantikan Service Account Drive yang terbatas kuota).
 */
const WEB_APP_URL_DRIVE =
  'https://script.google.com/macros/s/AKfycbze6KdWG7_PT2ZJ1Gtbyy8NGhfGtuefojUNspmYrL3y7oSQnSJTREuqYn1UcsXirQ/exec';

/** Daftar Peran (Role) Pengelola di Portal Guru (Termasuk Wali Kelas & Admin) */
const DAFTAR_ROLE_GURU = [
  'Wali Kelas',
  'Guru Kelas',
  'Guru Mata Pelajaran',
  'Kepala Sekolah',
  'Operator',
  'Admin',
];

/** Daftar Rombongan Belajar (Kelas 1A - 6B) */
const DAFTAR_KELAS = [
  '1A', '1B', '2A', '2B', '3A', '3B',
  '4A', '4B', '5A', '5B', '6A', '6B',
];

/** Daftar Mata Pelajaran Kurikulum SD */
const DAFTAR_MAPEL = [
  'Pendidikan Agama & Budi Pekerti',
  'Pendidikan Pancasila (PPKn)',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam & Sosial (IPAS)',
  'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
  'Seni Budaya & Prakarya (SBdP)',
  'Bahasa Inggris',
  'Muatan Lokal / Informatika',
];

/** Kategori Sasaran Generator Token Registrasi Resmi */
const DAFTAR_TARGET_TOKEN = [
  {
    grup: 'Kategori Staf / Pengelola',
    items: ['Wali Kelas', 'Guru Kelas', 'Guru Mata Pelajaran', 'Kepala Sekolah', 'Operator', 'Admin'],
  },
  {
    grup: 'Kategori Siswa per Tingkat',
    items: [
      'Siswa - Kelas 1',
      'Siswa - Kelas 2',
      'Siswa - Kelas 3',
      'Siswa - Kelas 4',
      'Siswa - Kelas 5',
      'Siswa - Kelas 6',
    ],
  },
];

// ============================================================================
// 2. MATRIKS DEFAULT HAK AKSES PERAN (RBAC) & PENGATURAN SEKOLAH
// ============================================================================

/**
 * Matriks Hak Akses Default untuk setiap Peran (Role):
 * - Semua role dapat men-generate QR Code Presensi & Membuat Pengumuman.
 * - Wali Kelas (murni) fokus memonitoring murid di kelasnya (verifikasi izin,
 *   monitoring kehadiran, log baca materi & ketuntasan tugas, WA ortu, buat pengumuman),
 *   namun TIDAK dapat membuat/mengirim materi/tugas atau menilai tugas siswa kecuali
 *   merangkap sebagai Guru Kelas (mode Guru Kelas diaktifkan).
 * - Kepala Sekolah fokus pada monitoring seluruh kelas, buat pengumuman,
 *   generate token pendaftaran, dan akses modal Setting Sistem.
 * - Operator bertugas sebagai pengolah data, ekspor laporan, dan generate token.
 * - Admin memiliki akses penuh di seluruh portal.
 */
const DEFAULT_ROLE_PERMISSIONS = {
  Admin: {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: true,
    canBuatTugas: true,
    canNilaiTugas: true,
    canBuatPengumuman: true,
    canPengumumanGlobal: true,
    canGenerateToken: true,
    canAksesSemuaKelas: true,
    canKelolaSetting: true,
  },
  'Kepala Sekolah': {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: false,
    canBuatTugas: false,
    canNilaiTugas: false,
    canBuatPengumuman: true,
    canPengumumanGlobal: true,
    canGenerateToken: true,
    canAksesSemuaKelas: true,
    canKelolaSetting: true,
  },
  Operator: {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: false,
    canBuatTugas: false,
    canNilaiTugas: false,
    canBuatPengumuman: true,
    canPengumumanGlobal: true,
    canGenerateToken: true,
    canAksesSemuaKelas: true,
    canKelolaSetting: false,
  },
  'Wali Kelas': {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: false,
    canBuatTugas: false,
    canNilaiTugas: false,
    canBuatPengumuman: true,
    canPengumumanGlobal: false,
    canGenerateToken: false,
    canAksesSemuaKelas: false,
    canKelolaSetting: false,
  },
  'Guru Kelas': {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: true,
    canBuatTugas: true,
    canNilaiTugas: true,
    canBuatPengumuman: true,
    canPengumumanGlobal: false,
    canGenerateToken: false,
    canAksesSemuaKelas: false,
    canKelolaSetting: false,
  },
  'Guru Mata Pelajaran': {
    canGenerateQR: true,
    canVerifikasiIzin: false,
    canBuatMateri: true,
    canBuatTugas: true,
    canNilaiTugas: true,
    canBuatPengumuman: true,
    canPengumumanGlobal: false,
    canGenerateToken: false,
    canAksesSemuaKelas: true,
    canKelolaSetting: false,
  },
};

/** Label ramah pengguna untuk setiap kunci hak akses di Modal Setting */
const DAFTAR_FITUR_RBAC = [
  { key: 'canGenerateQR', label: 'Generate & Cetak QR Presensi' },
  { key: 'canVerifikasiIzin', label: 'Verifikasi Surat Izin / Sakit' },
  { key: 'canBuatMateri', label: 'Tambah & Kelola Materi Pelajaran' },
  { key: 'canBuatTugas', label: 'Buat & Kirim Tugas Siswa' },
  { key: 'canNilaiTugas', label: 'Beri & Ubah Nilai Tugas' },
  { key: 'canBuatPengumuman', label: 'Buat Pengumuman Sekolah/Kelas' },
  { key: 'canPengumumanGlobal', label: 'Siarkan Pengumuman Global (Semua Kelas)' },
  { key: 'canGenerateToken', label: 'Kelola & Generate Token Pendaftaran' },
  { key: 'canAksesSemuaKelas', label: 'Monitoring Lintas Kelas (Semua Kelas)' },
  { key: 'canKelolaSetting', label: 'Akses Menu Setting Sistem & Hapus Data' },
];

/** Konfigurasi Akademik Default Sekolah */
const DEFAULT_SCHOOL_CONFIG = {
  tahunAjaran: '2026/2027',
  semester: 'Ganjil',
  kkmNilai: 75,
  jamOperasional: '07.00 - 12.20 WIB',
  batasJamMasuk: '07:15',
  wajibTokenRegistrasi: true,
};

// ============================================================================
// 3. MASTER PENGUMUMAN & TEMPLATE LITURGI DOA KATOLIK
// ============================================================================

/** Sasaran Penerima Pengumuman (Global atau Spesifik Kelas) */
const DAFTAR_TARGET_PENGUMUMAN = [
  { val: 'SEMUA', label: 'Semua Siswa (Global Seluruh Sekolah)' },
  ...DAFTAR_KELAS.map((k) => ({ val: k, label: `Khusus Siswa Kelas ${k}` })),
];

/** Kategori Topik Pengumuman Sekolah */
const DAFTAR_KATEGORI_PENGUMUMAN = [
  'Umum',
  'Akademik & Ujian',
  'Keagamaan / Liturgi',
  'Libur & Cuti Bersama',
  'Kegiatan & Ekstrakurikuler',
  'Pengumuman Resmi Sekolah',
];

/** Opsi Dropdown Template Pengumuman Cepat */
const DAFTAR_TEMPLATE_PENGUMUMAN = [
  { val: '', label: '-- Pilih Template Pengumuman (Opsional) --' },
  { val: 'renungan_pagi', label: '✝ Jadwal Renungan & Doa Pagi Kelas (07.15 WIB)' },
  { val: 'doa_angelus', label: '✝ Jadwal Doa Malaikat Tuhan (Angelus Pk 12.00)' },
  { val: 'doa_penutup', label: '✝ Tertib Doa Penutup Pembelajaran & Pulang' },
  { val: 'libur', label: 'Jadwal Libur Semester & Cuti Bersama' },
  { val: 'rapor', label: 'Jadwal Pengambilan Buku Rapor' },
  { val: 'tugas', label: 'Peringatan Pengumpulan Tugas / PR' },
  { val: 'upacara', label: 'Kegiatan Upacara / Seragam Wajib' },
];

/** Isi Prasetel Template Pengumuman Cepat */
const TEMPLATE_PENGUMUMAN_DATA = {
  renungan_pagi: {
    kategori: 'Keagamaan / Liturgi',
    judul: 'Tertib Renungan & Doa Pembuka Pagi (07.15 WIB)',
    isi: 'Diharapkan seluruh siswa sudah hadir di dalam ruang kelas masing-masing sebelum pukul 07.15 WIB untuk mengikuti renungan pagi dan doa pembuka pembelajaran dengan khidmat bersama Bapak/Ibu Wali Kelas.',
  },
  doa_angelus: {
    kategori: 'Keagamaan / Liturgi',
    judul: 'Tertib Doa Malaikat Tuhan (Angelus Pukul 12.00 WIB)',
    isi: 'Saat lonceng sekolah berbunyi tepat pukul 12.00 WIB, seluruh aktivitas pembelajaran dihentikan sejenak. Mari mengambil sikap hening dan mendaraskan Doa Malaikat Tuhan (Angelus) bersama-sama di dalam kelas.',
  },
  doa_penutup: {
    kategori: 'Keagamaan / Liturgi',
    judul: 'Tertib Doa Penutup Pembelajaran & Kepulangan Siswa',
    isi: 'Sebelum meninggalkan ruang kelas pada akhir jam pelajaran, seluruh siswa wajib merapikan alat tulis, menjaga kebersihan bangku, dan mengikuti Doa Penutup Pembelajaran serta Doa Bapa Kami & Salam Maria dengan tertib.',
  },
  libur: {
    kategori: 'Libur & Cuti Bersama',
    judul: 'Pemberitahuan Libur Akademik & Cuti Bersama Sekolah',
    isi: 'Diberitahukan kepada seluruh siswa dan orang tua/wali murid SD Swasta RK Bintang Timur Rantauprapat bahwa kegiatan belajar mengajar diliburkan sesuai kalender pendidikan dan akan kembali aktif seperti biasa setelah masa libur berakhir.',
  },
  rapor: {
    kategori: 'Akademik & Ujian',
    judul: 'Jadwal Pembagian Buku Laporan Hasil Belajar (Rapor)',
    isi: 'Kami mengundang Bapak/Ibu Orang Tua/Wali Murid untuk hadir mengambil Buku Rapor hasil belajar siswa di ruang kelas masing-masing mulai pukul 08.00 WIB s/d selesai. Mohon hadir tepat waktu.',
  },
  tugas: {
    kategori: 'Akademik & Ujian',
    judul: 'Pengingat Batas Waktu Pengumpulan Tugas / PR Siswa',
    isi: 'Mengingatkan kepada para siswa yang belum mengunggah berkas tugas atau pekerjaan rumah (PR) agar segera mengumpulkannya melalui menu Tugas & Materi di Portal Siswa SiBintang sebelum batas waktu (deadline) berakhir.',
  },
  upacara: {
    kategori: 'Kegiatan & Ekstrakurikuler',
    judul: 'Pelaksanaan Upacara Bendera & Kelengkapan Atribut Seragam',
    isi: 'Seluruh siswa wajib hadir pukul 07.00 WIB dengan mengenakan seragam sekolah lengkap beserta topi, dasi, ikat pinggang, dan sepatu hitam untuk mengikuti kegiatan Upacara Bendera di lapangan sekolah.',
  },
};

// ============================================================================
// 4. KOLEKSI IKON SVG GLOBAL (ICONS)
// ============================================================================
const ICONS = {
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
  chat: `<svg class="w-3.5 h-3.5 text-slate-500 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
  youtube: `<svg class="w-3.5 h-3.5 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  globe: `<svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>`,
  fileDoc: `<svg class="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  book: `<svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  pdf: `<svg class="w-3.5 h-3.5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`,
  xlsx: `<svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
  trash: `<svg class="w-3.5 h-3.5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
};

// ============================================================================
// 5. TEMPLATE & FUNGSI RENDER FOOTER RESMI SIBINTANG
// ============================================================================
const FOOTER_HTML = `
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

<div class="relative w-full overflow-hidden leading-none pointer-events-none select-none hidden sm:block bg-slate-100 -mb-[1px]">
  <svg class="relative block w-full h-20 sm:h-28 text-slate-900" viewBox="0 0 2880 140" preserveAspectRatio="none">
    <g fill="currentColor" class="text-slate-900">
      <path d="M2635,140 L2635,35 L2670,10 L2705,35 L2705,140 Z" opacity="0.95" />
      <path d="M2670,0 L2670,18 M2662,6 L2678,6" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M2665,45 L2675,45 L2675,65 L2665,65 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2660,115 C2660,100 2680,100 2680,115 L2680,140 L2660,140 Z" fill="#0f172a" opacity="0.8" />
      <path d="M2540,140 L2540,75 L2800,75 L2800,140 Z" opacity="0.95" />
      <path d="M2520,75 L2670,25 L2820,75 Z" opacity="0.95" />
      <path d="M2570,90 L2590,90 L2590,120 L2570,120 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2610,90 L2630,90 L2630,120 L2610,120 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2710,90 L2730,90 L2730,120 L2710,120 Z" fill="#0f172a" opacity="0.6" />
      <path d="M2750,90 L2770,90 L2770,120 L2750,120 Z" fill="#0f172a" opacity="0.6" />
      <circle cx="2450" cy="112" r="4" />
      <path d="M2450,116 L2450,129 M2446,120 L2454,120 M2450,129 L2446,140 L2454,140" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <circle cx="2466" cy="114" r="3.5" />
      <path d="M2466,118 L2466,130 M2462,122 L2470,122 M2466,130 L2463,140 L2469,140" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </g>
    <path d="M0,75 C450,110 900,50 1500,100 C2100,130 2500,138 2880,140 L2880,140 L0,140 Z" fill="currentColor" fill-opacity="0.2" class="animate-wave-t1" style="animation-duration: 14s;"></path>
    <path d="M0,95 C400,125 950,70 1550,115 C2150,135 2500,139 2880,140 L2880,140 L0,140 Z" fill="currentColor" fill-opacity="0.4" class="animate-wave-t2" style="animation-duration: 10s;"></path>
    <path d="M0,110 C500,135 1000,90 1600,122 C2200,140 2550,140 2880,140 L2880,140 L0,140 Z" fill="currentColor" fill-opacity="0.8" class="animate-wave-t1" style="animation-duration: 7s;"></path>
  </svg>
</div>

<footer id="mainFooter" class="relative w-full flex-shrink-0 bg-slate-900 text-slate-300 font-['Plus_Jakarta_Sans',sans-serif] no-print mt-auto overflow-hidden">
  <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-4 md:pb-5">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">
      <div class="md:col-span-5 space-y-2 text-center md:text-left">
        <div class="flex items-center justify-center md:justify-start space-x-2.5">
          <img src="/icon.png" alt="Logo SiBintang" class="w-9 h-9 object-contain shrink-0 logo-contour-stroke" />
          <div>
            <h3 class="font-black text-white text-xs sm:text-sm leading-tight tracking-tight">SiBintang PWA v.3.2.0</h3>
            <p class="text-[10px] sm:text-[11px] text-amber-400 font-bold leading-tight">SD Swasta RK Bintang Timur Rantauprapat</p>
          </div>
        </div>
        <p class="text-[11px] text-slate-300 leading-snug pr-0 md:pr-2">
          Sistem Informasi Presensi Digital & Akademik di bawah naungan <span class="text-white font-semibold">Yayasan Perguruan Katolik Santo Laurensius</span>.
        </p>
        <p class="text-[10px] text-slate-400">
          Jl. Cut Mutia No. 48, Rantauprapat | <span class="text-slate-300 font-medium">NPSN: 10205570 (Akreditasi A)</span>
        </p>
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

      <div class="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-left pt-1 md:pt-0">
        <div class="space-y-1">
          <h4 class="text-[11px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Layanan</span>
          </h4>
          <ul class="space-y-0.5 text-[11px] text-slate-300">
            <li><a href="/" class="hover:text-amber-400 transition">Portal Siswa</a></li>
            <li><a href="/guru.html" class="hover:text-amber-400 transition">Portal Guru & Pengelola</a></li>
            <li><span class="text-slate-400">Presensi QR Harian</span></li>
            <li><span class="text-slate-400">Materi & Tugas Drive</span></li>
            <li><span class="text-slate-400">Grafik Nilai & Profil</span></li>
          </ul>
        </div>

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

        <div class="space-y-1 col-span-2 sm:col-span-1">
          <h4 class="text-[11px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Operasional</span>
          </h4>
          <div class="space-y-0.5 text-[11px] text-slate-300">
            <p><b class="text-white">Senin - Sabtu:</b> 07.00 - 12.20 WIB</p>
            <p class="pt-0.5"><b class="text-white">Email:</b><br><a href="mailto:sdrk_bintangtimur@yahoo.com" class="break-all text-blue-400 hover:underline">sdrk_bintangtimur@yahoo.com</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>

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
// 6. EKSPOR GLOBAL WINDOW
// ============================================================================
window.WEB_APP_URL_DRIVE = WEB_APP_URL_DRIVE;
window.DAFTAR_ROLE_GURU = DAFTAR_ROLE_GURU;
window.DAFTAR_KELAS = DAFTAR_KELAS;
window.DAFTAR_MAPEL = DAFTAR_MAPEL;
window.DAFTAR_TARGET_TOKEN = DAFTAR_TARGET_TOKEN;
window.DEFAULT_ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;
window.DAFTAR_FITUR_RBAC = DAFTAR_FITUR_RBAC;
window.DEFAULT_SCHOOL_CONFIG = DEFAULT_SCHOOL_CONFIG;
window.DAFTAR_TARGET_PENGUMUMAN = DAFTAR_TARGET_PENGUMUMAN;
window.DAFTAR_KATEGORI_PENGUMUMAN = DAFTAR_KATEGORI_PENGUMUMAN;
window.DAFTAR_TEMPLATE_PENGUMUMAN = DAFTAR_TEMPLATE_PENGUMUMAN;
window.TEMPLATE_PENGUMUMAN_DATA = TEMPLATE_PENGUMUMAN_DATA;
window.ICONS = ICONS;
window.FOOTER_HTML = FOOTER_HTML;
window.renderFooter = renderFooter;
