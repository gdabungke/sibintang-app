let currentGuru = null;
let qrGenerator = null;
let cacheDaftarTugas = [];
let cacheRekapAbsen = null;
let cacheRekapTugasFull = null;

// Helper SVG Icons Profesional
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
  send: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`
};

// PWA: Handler Tombol Pasang Aplikasi Guru
let deferredPromptGuru = null;
const btnInstallGuru = document.getElementById('btnInstallAppGuru');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPromptGuru = e;
  if (btnInstallGuru) {
    btnInstallGuru.classList.remove('hidden');
  }
});

btnInstallGuru?.addEventListener('click', async () => {
  if (!deferredPromptGuru) return;
  deferredPromptGuru.prompt();
  const { outcome } = await deferredPromptGuru.userChoice;
  if (outcome === 'accepted' && btnInstallGuru) {
    btnInstallGuru.classList.add('hidden');
  }
  deferredPromptGuru = null;
});

window.addEventListener('appinstalled', () => {
  if (btnInstallGuru) btnInstallGuru.classList.add('hidden');
  showToast('Aplikasi Guru SiBintang berhasil dipasang!', 'success');
});

// Fungsi Global Toast Notification dengan Ikon SVG
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const iconSvg = type === 'success' ? ICONS.check : type === 'error' ? ICONS.error : ICONS.info;
  const toast = document.createElement('div');
  toast.className = `toast-item ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info'} flex items-center gap-2.5`;
  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Inisialisasi saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', () => {

  // 1a. Isi Dropdown dari constans.js
isiDropdown('regRoleGuru', DAFTAR_ROLE_GURU, 'Pilih Status / Peran (Role)');
isiDropdown('regKelasBinaan', DAFTAR_KELAS, 'Pilih Kelas Binaan');
isiDropdown('regMapelAjar', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');
isiDropdownGrup('tokenTarget', DAFTAR_TARGET_TOKEN);

isiDropdown('filterKelas', DAFTAR_KELAS);
isiDropdown('filterKelasTugas', DAFTAR_KELAS);
isiDropdown('filterMapelTugas', DAFTAR_MAPEL, '', { val: 'SEMUA', label: 'Semua Mata Pelajaran' });

isiDropdown('buatTugasKelas', DAFTAR_KELAS, 'Pilih Kelas Sasaran');
isiDropdown('buatTugasMapel', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');

isiDropdown('p_target', DAFTAR_TARGET_PENGUMUMAN);
isiDropdown('p_kategori', DAFTAR_KATEGORI_PENGUMUMAN);
isiDropdown('p_template', DAFTAR_TEMPLATE_PENGUMUMAN);

  // Render footer dinamis
  renderFooter();
  
  // 1b. Registrasi Service Worker PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service Worker registration failed:', err);
    });
  }

  // 2. Deteksi Banner iOS
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
  const iosBanner = document.getElementById('ios-install-banner');
  if (isIos && !isInStandaloneMode && iosBanner) {
    iosBanner.style.display = 'block';
  }
  document.getElementById('btnDismissIosBanner')?.addEventListener('click', () => {
    if (iosBanner) iosBanner.style.display = 'none';
  });

  // 3. Set Default Filter Tanggal Hari Ini
  const today = new Date().toISOString().split('T')[0];
  const filterTgl = document.getElementById('filterTanggal');
  if (filterTgl) filterTgl.value = today;

  // 4. Hubungkan Event Listener Seluruh Elemen
  initEventListeners();

  // 5. Cek Sesi Login Guru
  const savedGuru = sessionStorage.getItem('sibintang_guru_data');
  if (savedGuru) {
    try {
      currentGuru = JSON.parse(savedGuru);
      bukaDashboardGuru();
    } catch (e) {
      sessionStorage.removeItem('sibintang_guru_data');
      updateGuruHeaderUI(false);
    }
  } else {
    updateGuruHeaderUI(false);
  }
});

// 6. Sinkronisasi Header Guru Sesuai Status Login
function updateGuruHeaderUI(isLoggedIn) {
  const container = document.getElementById('headerGuruContainer');
  const spacer = document.getElementById('guruHeaderSpacer');
  const brand = document.getElementById('guruBrandSection');
  const linkSiswa = document.getElementById('linkPortalSiswa');
  const btnLogout = document.getElementById('btnLogoutGuru');

  if (isLoggedIn) {
    if (container) {
      container.className = "w-full max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-all duration-300";
    }
    if (spacer) spacer.classList.add('hidden');
    if (brand) brand.classList.remove('mx-auto');
    if (linkSiswa) linkSiswa.classList.add('hidden');
    if (btnLogout) btnLogout.classList.remove('hidden');
  } else {
    if (container) {
      container.className = "w-full max-w-xl mx-auto px-4 sm:px-0 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-all duration-300";
    }
    if (spacer) spacer.classList.remove('hidden');
    if (brand) brand.classList.add('mx-auto');
    if (linkSiswa) linkSiswa.classList.remove('hidden');
    if (btnLogout) btnLogout.classList.add('hidden');
  }
}

// Pendaftaran Event Listener Elemen DOM
function initEventListeners() {
  // Tab Switch Login vs Register
  document.getElementById('authTabBtn-masuk')?.addEventListener('click', () => switchAuthTab('masuk'));
  document.getElementById('authTabBtn-daftar')?.addEventListener('click', () => switchAuthTab('daftar'));

  // Toggle Opsi Role Pendaftaran Guru
  document.getElementById('regRoleGuru')?.addEventListener('change', toggleRoleOptions);

  // Tombol Logout
  document.getElementById('btnLogoutGuru')?.addEventListener('click', logoutGuru);

  // Navigasi Tab Dashboard Guru
  document.getElementById('tabGuruBtn-absen')?.addEventListener('click', () => switchGuruTab('absen'));
  document.getElementById('tabGuruBtn-tugas')?.addEventListener('click', () => switchGuruTab('tugas'));
  document.getElementById('tabGuruBtn-pengumuman')?.addEventListener('click', () => switchGuruTab('pengumuman'));

  // Filter Absensi
  document.getElementById('filterKelas')?.addEventListener('change', () => sinkronKelas('absen'));
  document.getElementById('filterTanggal')?.addEventListener('change', updateDashboardAbsen);
  document.getElementById('ketSesi')?.addEventListener('input', generateQR);
  document.getElementById('btnSegarkanRekap')?.addEventListener('click', loadRekapKelas);
  document.getElementById('btnExportCSV')?.addEventListener('click', exportAbsensiCSV);
  document.getElementById('btnCetakQR')?.addEventListener('click', () => window.print());

  // Filter Tugas
  document.getElementById('filterKelasTugas')?.addEventListener('change', () => sinkronKelas('tugas'));
  document.getElementById('filterMapelTugas')?.addEventListener('change', loadRekapTugas);
  document.getElementById('cariTugasInput')?.addEventListener('input', filterTabelTugasLokal);
  document.getElementById('btnSegarkanTugas')?.addEventListener('click', loadRekapTugas);
  document.getElementById('btnExportTugasCSV')?.addEventListener('click', exportTugasCSV);

  // Template Pengumuman
  document.getElementById('p_template')?.addEventListener('change', pilihTemplatePengumuman);

  // Modal Penilaian
  document.getElementById('btnCloseModalNilai')?.addEventListener('click', closeModalNilai);
  document.getElementById('btnBatalNilai')?.addEventListener('click', closeModalNilai);

  // Form Buat Tugas Baru oleh Guru
  document.getElementById('formBuatTugasGuru')?.addEventListener('submit', submitBuatTugasGuru);

  // Form Generate Token Admin
  document.getElementById('formGenerateToken')?.addEventListener('submit', submitGenerateToken);
  document.getElementById('btnSalinToken')?.addEventListener('click', salinToken);
}

// Fungsi Switch Tab Auth Guru (Masuk vs Registrasi)
function switchAuthTab(type) {
  const formMasuk = document.getElementById('formMasukGuru');
  const formDaftar = document.getElementById('formDaftarGuru');
  const btnMasuk = document.getElementById('authTabBtn-masuk');
  const btnDaftar = document.getElementById('authTabBtn-daftar');
  if (!formMasuk || !formDaftar) return;

  if (type === 'masuk') {
    formMasuk.classList.remove('hidden');
    formDaftar.classList.add('hidden');
    if (btnMasuk) btnMasuk.className = 'py-2 text-xs font-bold rounded-lg bg-indigo-800 text-white shadow-sm transition flex items-center justify-center gap-1.5';
    if (btnDaftar) btnDaftar.className = 'py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5';
  } else {
    formMasuk.classList.add('hidden');
    formDaftar.classList.remove('hidden');
    if (btnDaftar) btnDaftar.className = 'py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white shadow-sm transition flex items-center justify-center gap-1.5';
    if (btnMasuk) btnMasuk.className = 'py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5';
  }
}

// Tampilkan Opsi Tambahan Sesuai Role
function toggleRoleOptions() {
  const role = document.getElementById('regRoleGuru')?.value || '';
  const divKelas = document.getElementById('divKelasBinaan');
  const divMapel = document.getElementById('divMapelAjar');
  if (divKelas) divKelas.classList.add('hidden');
  if (divMapel) divMapel.classList.add('hidden');

  if ((role === 'Wali Kelas' || role === 'Guru Kelas') && divKelas) {
    divKelas.classList.remove('hidden');
  } else if ((role === 'Guru Mapel' || role === 'Guru Mata Pelajaran') && divMapel) {
    divMapel.classList.remove('hidden');
  }
}

// 1. Proses Masuk (Login) Guru Berdasarkan NIP
document.getElementById('formMasukGuru')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nip = document.getElementById('loginNip').value.trim();
  const btn = document.getElementById('btnSubmitMasukGuru');
  btn.textContent = 'Memverifikasi...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/guru/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, aksi: 'login' }),
    });
    const result = await res.json();
    if (result.success) {
      currentGuru = result.data;
      sessionStorage.setItem('sibintang_guru_data', JSON.stringify(currentGuru));
      showToast(`Selamat datang kembali, ${currentGuru.nama} (${currentGuru.role})`, 'success');
      setTimeout(() => bukaDashboardGuru(), 800);
    } else {
      showToast(result.message || result.error || 'NIP belum terdaftar. Silakan daftar terlebih dahulu.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Masuk ke Dashboard</span>`;
    btn.disabled = false;
  }
});

// 2. Proses Registrasi (Daftar Baru) Guru dengan Validasi Token
document.getElementById('formDaftarGuru')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitDaftarGuru');
  btn.textContent = 'Mendaftarkan...';
  btn.disabled = true;

  const role = document.getElementById('regRoleGuru')?.value || '';
  const mapelAjar = document.getElementById('regMapelAjar')?.value || '-';

  // Validasi jika memilih Guru Mapel tapi belum memilih mata pelajaran
  if ((role === 'Guru Mapel' || role === 'Guru Mata Pelajaran') && (!mapelAjar || mapelAjar === '-' || mapelAjar.includes('Pilih'))) {
    showToast('Pilih mata pelajaran yang Anda ampu!', 'error');
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Daftar Akun Pengelola Baru</span>`;
    btn.disabled = false;
    return;
  }

  const payload = {
    nip: document.getElementById('regNip').value.trim(),
    nama: document.getElementById('regNamaGuru').value.trim(),
    role: role,
    kelasBinaan: document.getElementById('regKelasBinaan')?.value || '-',
    mapelAjar: mapelAjar,
    token: document.getElementById('regTokenGuru')?.value.trim() || '',
    aksi: 'register',
  };

  try {
    const res = await fetch('/api/guru/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.success) {
      currentGuru = result.data;
      sessionStorage.setItem('sibintang_guru_data', JSON.stringify(currentGuru));
      showToast(`Registrasi berhasil! Selamat datang, ${currentGuru.nama}`, 'success');
      setTimeout(() => bukaDashboardGuru(), 800);
    } else {
      showToast(result.message || result.error || 'Gagal mendaftarkan akun pengelola.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Daftar Akun Pengelola Baru</span>`;
    btn.disabled = false;
  }
});

function bukaDashboardGuru() {
  document.getElementById('loginGuruSection')?.classList.add('hidden');
  document.getElementById('dashboardGuruSection')?.classList.remove('hidden');
  document.getElementById('btnLogoutGuru')?.classList.remove('hidden');
  updateGuruHeaderUI(true);

  const infoNama = document.getElementById('infoNamaGuru');
  const infoRole = document.getElementById('infoRoleGuru');
  if (infoNama) infoNama.textContent = currentGuru?.nama || 'Pengelola';
  if (infoRole) {
    let detailRole = `Peran: ${currentGuru?.role || 'Guru'}`;
    if (currentGuru?.role === 'Wali Kelas') detailRole += ` | Kelas Binaan: ${currentGuru.kelasBinaan}`;
    if (currentGuru?.role === 'Guru Mapel' || currentGuru?.role === 'Guru Mata Pelajaran') detailRole += ` | Mapel: ${currentGuru.mapelAjar}`;
    infoRole.textContent = detailRole;
  }

  // Tampilkan Panel Generator Token jika user memiliki hak Admin / Kepala Sekolah
  const role = currentGuru?.role || '';
  const panelAdmin = document.getElementById('panelAdminToken');
  if (panelAdmin) {
    if (role === 'Admin' || role === 'Admin Sistem' || role === 'Kepala Sekolah') {
      panelAdmin.classList.remove('hidden');
    } else {
      panelAdmin.classList.add('hidden');
    }
  }

  // Penguncian Dropdown Kelas untuk Wali Kelas
  if (currentGuru && currentGuru.role === 'Wali Kelas' && currentGuru.kelasBinaan !== '-') {
    const selAbsen = document.getElementById('filterKelas');
    const selTugas = document.getElementById('filterKelasTugas');
    const selBuatTugas = document.getElementById('buatTugasKelas');
    if (selAbsen) {
      selAbsen.value = currentGuru.kelasBinaan;
      selAbsen.disabled = true;
    }
    if (selTugas) {
      selTugas.value = currentGuru.kelasBinaan;
      selTugas.disabled = true;
    }
    if (selBuatTugas) {
      selBuatTugas.value = currentGuru.kelasBinaan;
    }
  }

  updateDashboardAbsen();
  loadRekapTugas();
}

function logoutGuru() {
  sessionStorage.removeItem('sibintang_guru_data');
  currentGuru = null;
  document.getElementById('btnLogoutGuru')?.classList.add('hidden');
  updateGuruHeaderUI(false);
  showToast('Berhasil keluar dari sesi.', 'info');
  setTimeout(() => location.reload(), 500);
}

// 3. Navigasi Tab Menu Guru
function switchGuruTab(tab) {
  ['absen', 'tugas', 'pengumuman'].forEach((t) => {
    const content = document.getElementById(`tabGuruContent-${t}`);
    const btn = document.getElementById(`tabGuruBtn-${t}`);
    if (content) content.classList.add('hidden');
    if (btn) {
      btn.classList.remove('bg-indigo-800', 'text-white', 'shadow');
      btn.classList.add('text-slate-700');
    }
  });

  const activeContent = document.getElementById(`tabGuruContent-${tab}`);
  const activeBtn = document.getElementById(`tabGuruBtn-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-indigo-800', 'text-white', 'shadow');
    activeBtn.classList.remove('text-slate-700');
  }

  if (tab === 'absen') loadRekapKelas();
  if (tab === 'tugas') loadRekapTugas();
}

function sinkronKelas(source) {
  if (currentGuru && currentGuru.role === 'Wali Kelas' && currentGuru.kelasBinaan !== '-') return;
  if (source === 'absen') {
    const val = document.getElementById('filterKelas').value;
    const target = document.getElementById('filterKelasTugas');
    if (target) target.value = val;
    updateDashboardAbsen();
  } else {
    const val = document.getElementById('filterKelasTugas').value;
    const target = document.getElementById('filterKelas');
    if (target) target.value = val;
    loadRekapTugas();
  }
}

function updateDashboardAbsen() {
  generateQR();
  loadRekapKelas();
}

// 4. Generate QR Code Absensi
function generateQR() {
  const kelas = document.getElementById('filterKelas')?.value || '1A';
  const tanggal = document.getElementById('filterTanggal')?.value || new Date().toISOString().split('T')[0];
  const sesi = document.getElementById('ketSesi')?.value.trim() || 'Harian';
  const qrDataString = `ABSEN-SIBINTANG|${kelas}|${tanggal}|${sesi}`;

  const titleEl = document.getElementById('qrTitleKelas');
  const subEl = document.getElementById('qrSubTanggal');
  const payloadEl = document.getElementById('qrPayloadText');

  if (titleEl) titleEl.textContent = `QR Absensi Kelas ${kelas}`;
  if (subEl) subEl.textContent = `Tanggal: ${tanggal} (${sesi})`;
  if (payloadEl) payloadEl.textContent = qrDataString;

  const container = document.getElementById('qrcodeContainer');
  if (!container) return;
  container.innerHTML = '';
  qrGenerator = new QRCode(container, {
    text: qrDataString,
    width: 210,
    height: 210,
    colorDark: '#1e1b4b',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });
}

// 5. Rekap Absensi Siswa
async function loadRekapKelas() {
  const kelas = document.getElementById('filterKelas')?.value;
  const tanggal = document.getElementById('filterTanggal')?.value;
  if (!kelas || !tanggal) return;

  try {
    const res = await fetch(`/api/guru/rekap?kelas=${encodeURIComponent(kelas)}&tanggal=${encodeURIComponent(tanggal)}`);
    const data = await res.json();
    if (!data.success) return;

    cacheRekapAbsen = data;
    document.getElementById('statTotal').textContent = data.totalSiswa || 0;
    document.getElementById('statHadir').textContent = data.jumlahHadir || 0;
    document.getElementById('statBelum').textContent = data.jumlahBelum || 0;
    document.getElementById('badgeBelum').textContent = `${data.jumlahBelum || 0} Siswa`;
    document.getElementById('badgeHadir').textContent = `${data.jumlahHadir || 0} Siswa`;

    const tbodyBelum = document.getElementById('tbodyBelumAbsen');
    if (!data.belumAbsen || data.belumAbsen.length === 0) {
      tbodyBelum.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-emerald-600 font-semibold">Semua siswa terdaftar di Kelas ${kelas} sudah absen hari ini.</td></tr>`;
    } else {
      tbodyBelum.innerHTML = data.belumAbsen
        .map((s) => {
          const cleanPhone = (s.nohp || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
          const waText = encodeURIComponent(
            `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa ananda ${s.nama} (Kelas ${s.kelas}) belum tercatat melakukan scan absensi pada tanggal ${tanggal}. Terima kasih.`
          );
          const waBtn = cleanPhone
            ? `<a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-bold inline-flex items-center text-xs">${ICONS.wa}<span>Hubungi Ortu</span></a>`
            : `<span class="text-slate-400">-</span>`;

          return `
            <tr class="hover:bg-rose-50/40">
              <td class="p-2.5 font-mono text-slate-600">${s.nis}</td>
              <td class="p-2.5 font-bold text-slate-800">${s.nama}</td>
              <td class="p-2.5">${s.jk}</td>
              <td class="p-2.5">${s.ortu}</td>
              <td class="p-2.5 text-right">${waBtn}</td>
            </tr>
          `;
        })
        .join('');
    }

    const tbodySudah = document.getElementById('tbodySudahAbsen');
    if (!data.sudahAbsen || data.sudahAbsen.length === 0) {
      tbodySudah.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada siswa yang melakukan scan QR pada tanggal ini.</td></tr>`;
    } else {
      tbodySudah.innerHTML = data.sudahAbsen
        .map(
          (s) => `
            <tr class="hover:bg-slate-50">
              <td class="p-2.5 font-medium text-slate-600">${s.waktuAbsen}</td>
              <td class="p-2.5 font-mono text-slate-500">${s.nis}</td>
              <td class="p-2.5 font-bold text-slate-800">${s.nama}</td>
              <td class="p-2.5"><span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">${s.status}</span></td>
            </tr>
          `
        )
        .join('');
    }
  } catch (err) {
    console.error('Gagal mengambil rekap absen:', err);
  }
}

// 6. Rekap Pengumpulan Tugas
async function loadRekapTugas() {
  const kelas = document.getElementById('filterKelasTugas')?.value;
  const mapel = document.getElementById('filterMapelTugas')?.value;
  if (!kelas || !mapel) return;

  try {
    const res = await fetch(`/api/guru/tugas?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`);
    const data = await res.json();
    if (!data.success) return;

    cacheRekapTugasFull = data;
    cacheDaftarTugas = data.daftarTugas || [];

    document.getElementById('statTotalFileTugas').textContent = `${data.totalTerkumpul || 0} File`;
    document.getElementById('statSiswaSudahTugas').textContent = `${data.jumlahSiswaSudah || 0} Siswa`;
    document.getElementById('statSiswaBelumTugas').textContent = `${data.jumlahSiswaBelum || 0} Siswa`;
    document.getElementById('badgeBelumTugas').textContent = `${data.jumlahSiswaBelum || 0} Siswa`;

    renderTabelTugas(cacheDaftarTugas);

    const tbodyBelumTugas = document.getElementById('tbodyBelumTugas');
    const infoMapel = mapel === 'SEMUA' ? 'PR/Tugas Sekolah' : `Mata Pelajaran ${mapel}`;

    if (!data.belumKumpul || data.belumKumpul.length === 0) {
      tbodyBelumTugas.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-emerald-600 font-semibold">Seluruh siswa di Kelas ${kelas} sudah mengumpulkan tugas pada kategori ini.</td></tr>`;
    } else {
      tbodyBelumTugas.innerHTML = data.belumKumpul
        .map((s) => {
          const cleanPhone = (s.nohp || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
          const waText = encodeURIComponent(
            `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa ananda ${s.nama} (Kelas ${s.kelas}) belum mengumpulkan ${infoMapel} di aplikasi SiBintang. Mohon bantuannya untuk mengingatkan ananda. Terima kasih.`
          );
          const waBtn = cleanPhone
            ? `<a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold inline-flex items-center text-xs">${ICONS.wa}<span>Ingatkan Ortu</span></a>`
            : `<span class="text-slate-400">-</span>`;

          return `
            <tr class="hover:bg-amber-50/40">
              <td class="p-2.5 font-mono text-slate-600">${s.nis}</td>
              <td class="p-2.5 font-bold text-slate-800">${s.nama}</td>
              <td class="p-2.5">${s.ortu}</td>
              <td class="p-2.5 text-right">${waBtn}</td>
            </tr>
          `;
        })
        .join('');
    }
  } catch (err) {
    console.error('Gagal mengambil data tugas:', err);
  }
}

function renderTabelTugas(list) {
  const tbody = document.getElementById('tbodyDaftarTugas');
  const badgeJumlah = document.getElementById('badgeJumlahTugas');
  if (badgeJumlah) badgeJumlah.textContent = `${list.length} File Tugas`;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Belum ada file PR/Tugas yang dikumpulkan untuk filter ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((item) => {
      const catatanText = item.catatan ? `<div class="text-[11px] text-slate-500 italic mt-0.5">"${item.catatan}"</div>` : '';
      const safeNama = (item.nama || '').replace(/'/g, "\\'");
      const safeJudul = (item.judul || '').replace(/'/g, "\\'");
      const safeCatatan = (item.catatan || '').replace(/'/g, "\\'");

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 text-slate-500 whitespace-nowrap">${item.waktu}</td>
          <td class="p-3">
            <div class="font-bold text-slate-800">${item.nama}</div>
            <div class="text-[11px] font-mono text-slate-400">NIS: ${item.nis}</div>
          </td>
          <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">${item.kelas}</span></td>
          <td class="p-3"><span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">${item.mapel}</span></td>
          <td class="p-3 font-medium text-slate-700">
            ${item.judul}
            ${catatanText}
          </td>
          <td class="p-3 text-right whitespace-nowrap space-x-1">
            <a href="${item.link}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center text-xs">Buka File ${ICONS.external}</a>
            <button type="button" onclick="openModalNilai(${item.rowIndex}, '${safeNama}', '${safeJudul}', '${item.nilai || ''}', '${safeCatatan}')" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center text-xs">
              ${ICONS.edit}<span>Beri Nilai</span>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function filterTabelTugasLokal() {
  const keyword = document.getElementById('cariTugasInput').value.toLowerCase().trim();
  if (!keyword) {
    renderTabelTugas(cacheDaftarTugas);
    return;
  }
  const hasil = cacheDaftarTugas.filter(
    (item) =>
      item.nama.toLowerCase().includes(keyword) ||
      item.nis.toLowerCase().includes(keyword) ||
      item.judul.toLowerCase().includes(keyword) ||
      item.mapel.toLowerCase().includes(keyword)
  );
  renderTabelTugas(hasil);
}

// 7. Modal Penilaian Guru
function openModalNilai(rowIndex, nama, judul, nilai, catatan) {
  document.getElementById('modalRowIndex').value = rowIndex;
  document.getElementById('modalNamaSiswa').textContent = nama;
  document.getElementById('modalJudulTugas').textContent = judul;
  document.getElementById('inputNilaiAngka').value = nilai;
  document.getElementById('inputCatatanGuru').value = catatan;
  document.getElementById('modalNilai').classList.remove('hidden');
}

function closeModalNilai() {
  document.getElementById('modalNilai').classList.add('hidden');
}

document.getElementById('formNilai')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rowIndex = document.getElementById('modalRowIndex').value;
  const nilai = document.getElementById('inputNilaiAngka').value;
  const catatan = document.getElementById('inputCatatanGuru').value.trim();
  const btn = document.getElementById('btnSimpanNilai');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/guru/nilai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIndex: parseInt(rowIndex), nilai, catatan }),
    });
    const result = await res.json();
    if (result.success) {
      showToast('Nilai dan catatan berhasil disimpan!', 'success');
      closeModalNilai();
      loadRekapTugas();
    } else {
      showToast(result.message || result.error || 'Gagal menyimpan nilai.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `${ICONS.save}<span>Simpan Nilai</span>`;
    btn.disabled = false;
  }
});

// 8. Pembuatan Tugas / PR Baru oleh Guru
async function submitBuatTugasGuru(e) {
  e.preventDefault();
  const kelas = document.getElementById('buatTugasKelas').value;
  const mapel = document.getElementById('buatTugasMapel').value;
  const judul = document.getElementById('buatTugasJudul').value.trim();
  const deadline = document.getElementById('buatTugasDeadline').value;
  const deskripsi = document.getElementById('buatTugasDeskripsi').value.trim();
  const fileInput = document.getElementById('buatTugasFile')?.files?.[0];

  const activeUser = currentGuru || JSON.parse(sessionStorage.getItem('sibintang_guru_data') || '{}');
  const btn = document.getElementById('btnPublikasiTugas');
  btn.textContent = 'Memublikasikan...';
  btn.disabled = true;

  try {
    let res;
    // Jika tidak ada file lampiran, kirim JSON biasa agar backend Vercel tidak error multipart
    if (!fileInput) {
      res = await fetch('/api/guru/buat-tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelas,
          mapel,
          judul,
          deadline,
          deskripsi,
          pembuat: activeUser.nama || 'Guru',
        }),
      });
    } else {
      const formData = new FormData();
      formData.append('kelas', kelas);
      formData.append('mapel', mapel);
      formData.append('judul', judul);
      formData.append('deadline', deadline);
      formData.append('deskripsi', deskripsi);
      formData.append('pembuat', activeUser.nama || 'Guru');
      formData.append('fileSoal', fileInput);

      res = await fetch('/api/guru/buat-tugas', {
        method: 'POST',
        body: formData,
      });
    }

    const data = await res.json();
    if (data.success) {
      showToast('Tugas baru berhasil dipublikasikan ke siswa!', 'success');
      document.getElementById('formBuatTugasGuru').reset();
      if (currentGuru && currentGuru.role === 'Wali Kelas' && currentGuru.kelasBinaan !== '-') {
        document.getElementById('buatTugasKelas').value = currentGuru.kelasBinaan;
      }
    } else {
      showToast(data.message || data.error || 'Gagal memublikasikan tugas.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan server saat memublikasikan tugas.', 'error');
  } finally {
    btn.innerHTML = `${ICONS.upload}<span>Publikasikan Tugas ke Siswa</span>`;
    btn.disabled = false;
  }
}

// 9. Dynamic Token Generator Khusus Admin / Kepala Sekolah
async function submitGenerateToken(e) {
  e.preventDefault();
  // Kompatibel dengan id='tokenTarget' (HTML baru) maupun id='tokenKategori' (HTML lama)
  const kategoriEl = document.getElementById('tokenTarget') || document.getElementById('tokenKategori');
  const customTokenEl = document.getElementById('customToken') || document.getElementById('customTokenInput');
  const kategori = kategoriEl?.value || 'Guru';
  const customToken = customTokenEl?.value.trim() || '';

  const activeUser = currentGuru || JSON.parse(sessionStorage.getItem('sibintang_guru_data') || '{}');
  const btn = document.getElementById('btnGenerateToken') || e.target.querySelector('button[type="submit"]');
  if (btn) {
    btn.textContent = 'Membuat...';
    btn.disabled = true;
  }

  try {
    const res = await fetch('/api/admin/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kategori, customToken, pembuat: activeUser.nama || 'Admin' }),
    });
    const data = await res.json();
    if (data.success) {
      const teksToken = document.getElementById('teksTokenBaru') || document.getElementById('hasilTokenTeks');
      if (teksToken) teksToken.textContent = data.token;
      document.getElementById('hasilTokenContainer')?.classList.remove('hidden');
      showToast(data.message || 'Token berhasil dibuat!', 'success');
    } else {
      showToast(data.message || data.error || 'Gagal membuat token.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server saat generate token.', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = `${ICONS.plus}<span>Buat Token Baru</span>`;
      btn.disabled = false;
    }
  }
}

function salinToken() {
  const tokenEl = document.getElementById('teksTokenBaru') || document.getElementById('hasilTokenTeks');
  const tokenText = tokenEl?.textContent;
  if (!tokenText) return;
  navigator.clipboard.writeText(tokenText).then(() => {
    showToast('Token berhasil disalin ke clipboard!', 'info');
  }).catch(() => {
    showToast('Gagal menyalin token.', 'error');
  });
}

// 10. Fitur Export ke Excel (CSV)
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function downloadCSVFile(filename, rows) {
  const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCSV).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportAbsensiCSV() {
  if (!cacheRekapAbsen) {
    showToast('Data absensi belum termuat.', 'error');
    return;
  }
  const { kelas, tanggal, sudahAbsen, belumAbsen } = cacheRekapAbsen;
  if (sudahAbsen.length === 0 && belumAbsen.length === 0) {
    showToast('Belum ada data siswa di kelas ini.', 'error');
    return;
  }

  const rows = [
    ['REKAP ABSENSI HARIAN - SD RK BINTANG TIMUR RANTAUPRAPAT'],
    [`Kelas: ${kelas}`, `Tanggal: ${tanggal}`],
    [],
    ['No', 'NIS', 'Nama Lengkap Siswa', 'L/P', 'Kelas', 'Status Kehadiran', 'Waktu Scan Absen', 'Nama Orang Tua', 'No. HP Ortu'],
  ];

  let no = 1;
  (sudahAbsen || []).forEach((s) => {
    rows.push([no++, `'${s.nis}`, s.nama, s.jk, s.kelas, s.status || 'Hadir', s.waktuAbsen || '-', s.ortu || '-', `'${s.nohp || '-'}`]);
  });
  (belumAbsen || []).forEach((s) => {
    rows.push([no++, `'${s.nis}`, s.nama, s.jk, s.kelas, 'Belum Absen', '-', s.ortu || '-', `'${s.nohp || '-'}`]);
  });

  downloadCSVFile(`Rekap_Absensi_Kelas_${kelas}_${tanggal}.csv`, rows);
  showToast('File CSV absensi berhasil diunduh.', 'success');
}

function exportTugasCSV() {
  const kelas = document.getElementById('filterKelasTugas')?.value;
  const mapel = document.getElementById('filterMapelTugas')?.value;

  if (!cacheDaftarTugas || cacheDaftarTugas.length === 0) {
    showToast('Belum ada data tugas terkumpul.', 'error');
    return;
  }

  const rows = [
    ['REKAP PENGUMPULAN & NILAI TUGAS - SD RK BINTANG TIMUR RANTAUPRAPAT'],
    [`Kelas: ${kelas}`, `Mata Pelajaran: ${mapel}`],
    [],
    ['No', 'Waktu Upload', 'NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Judul / Keterangan Tugas', 'Nilai Angka', 'Catatan Guru', 'Link File Google Drive'],
  ];

  cacheDaftarTugas.forEach((t, idx) => {
    rows.push([
      idx + 1,
      t.waktu,
      `'${t.nis}`,
      t.nama,
      t.kelas,
      t.mapel,
      t.judul,
      t.nilai !== '' && t.nilai !== undefined ? t.nilai : 'Belum Dinilai',
      t.catatan || '-',
      t.link,
    ]);
  });

  if (cacheRekapTugasFull && cacheRekapTugasFull.belumKumpul && cacheRekapTugasFull.belumKumpul.length > 0) {
    rows.push([]);
    rows.push(['DAFTAR SISWA BELUM MENGUMPULKAN TUGAS PADA FILTER INI']);
    rows.push(['No', 'NIS', 'Nama Siswa', 'Kelas', 'Nama Orang Tua', 'No. HP Ortu']);
    cacheRekapTugasFull.belumKumpul.forEach((s, idx) => {
      rows.push([idx + 1, `'${s.nis}`, s.nama, s.kelas, s.ortu || '-', `'${s.nohp || '-'}`]);
    });
  }

  const cleanMapel = mapel.replace(/[^a-zA-Z0-9]/g, '_');
  downloadCSVFile(`Rekap_Nilai_Tugas_Kelas_${kelas}_${cleanMapel}.csv`, rows);
  showToast('File CSV tugas berhasil diunduh.', 'success');
}

// 11. Kelola Pengumuman Sekolah
function pilihTemplatePengumuman() {
  const kunci = document.getElementById('p_template')?.value;
  const inputKategori = document.getElementById('p_kategori');
  const inputJudul = document.getElementById('p_judul');
  const inputIsi = document.getElementById('p_isi');

  if (TEMPLATE_PENGUMUMAN_DATA && TEMPLATE_PENGUMUMAN_DATA[kunci]) {
    const data = TEMPLATE_PENGUMUMAN_DATA[kunci];
    if (inputKategori) inputKategori.value = data.kategori;
    if (inputJudul) inputJudul.value = data.judul;
    if (inputIsi) inputIsi.value = data.isi;
  } else {
    if (inputJudul) inputJudul.value = '';
    if (inputIsi) inputIsi.value = '';
  }
}

// Handler Submit Penerbitan Pengumuman
document.getElementById('formPengumuman')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const target = document.getElementById('p_target')?.value;
  const kategori = document.getElementById('p_kategori')?.value;
  const tglBerakhir = document.getElementById('p_expired')?.value;
  const judul = document.getElementById('p_judul')?.value.trim();
  const isi = document.getElementById('p_isi')?.value.trim();
  const btn = document.getElementById('btnKirimPengumuman');

  // Proteksi hak akses role: selain Admin / Kepala Sekolah tidak boleh buat pengumuman global SEMUA
  const userRole = currentGuru?.role || '';
  if (target === 'SEMUA' && (userRole !== 'Admin Sistem' && userRole !== 'Admin' && userRole !== 'Kepala Sekolah')) {
    showToast('Hanya Kepala Sekolah atau Admin yang dapat menerbitkan Pengumuman Global!', 'error');
    return;
  }

  btn.textContent = 'Menerbitkan...';
  btn.disabled = true;

  const pembuatNama = currentGuru ? `${currentGuru.nama} (${currentGuru.role})` : 'Dewan Guru';

  try {
    const res = await fetch('/api/guru/pengumuman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, kategori, tglBerakhir, judul, isi, pembuat: pembuatNama }),
    });
    const result = await res.json();
    if (result.success) {
      showToast('Pengumuman berhasil diterbitkan!', 'success');
      document.getElementById('formPengumuman').reset();
    } else {
      showToast(result.message || result.error || 'Gagal menerbitkan pengumuman.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg><span>Terbitkan Pengumuman</span>`;
    btn.disabled = false;
  }
});
