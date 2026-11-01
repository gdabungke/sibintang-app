/**
 * ============================================================================
 * SIBINTANG - SISWA CONTROLLER & SCANNER (siswa.js)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Mengelola interaksi portal siswa: autentikasi, pemindai kamera QR dengan
 * panduan visual interaktif, toggle izin/sakit, pengunggahan tugas Google Drive,
 * pusat notifikasi terpadu (tugas belum dikumpul & pengumuman), serta log riwayat.
 */

let currentStudent = null;
let html5QrCode = null;

// ============================================================================
// 1. INISIALISASI PORTAL SISWA (Dipanggil otomatis oleh app.js)
// ============================================================================
function inisialisasiPortalSiswa() {
  // Isi dropdown dasar siswa dari constants.js
  isiDropdown('regKelas', DAFTAR_KELAS, 'Pilih Kelas');
  isiDropdown('mapel', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');

  // Hubungkan seluruh event listener elemen DOM
  initEventListeners();

  // Periksa sesi aktif siswa via auth.js
  currentStudent = Auth.getSiswa();
  if (currentStudent) {
    showDashboard();
  } else {
    updateHeaderUI(false);
  }
}
window.inisialisasiPortalSiswa = inisialisasiPortalSiswa;

// ============================================================================
// 2. PENDAFTARAN EVENT LISTENER ELEMEN DOM
// ============================================================================
function initEventListeners() {
  // Autentikasi & Akun Siswa
  document.getElementById('btnLogout')?.addEventListener('click', logout);
  document.getElementById('authTabBtn-masuk')?.addEventListener('click', () => switchAuthTab('masuk'));
  document.getElementById('authTabBtn-daftar')?.addEventListener('click', () => switchAuthTab('daftar'));
  document.getElementById('formMasuk')?.addEventListener('submit', prosesMasukSiswa);
  document.getElementById('formDaftar')?.addEventListener('submit', prosesDaftarSiswa);

  // Dropdown Profil Header Siswa
  const btnToggle = document.getElementById('btnToggleUserDropdownSiswa');
  const dropdownMenu = document.getElementById('userDropdownMenuSiswa');
  const chevron = document.getElementById('chevronDropdownSiswa');

  btnToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('hidden');
    chevron?.classList.toggle('rotate-180');
    // Tutup popover pengumuman/notifikasi jika profil dibuka
    document.getElementById('popoverNotifDesktop')?.classList.add('hidden');
  });

  // Toggle Lonceng Notifikasi Siswa (Desktop Popover vs Mobile Bottom Sheet)
  const btnNotif = document.getElementById('btnToggleNotifSiswa');
  btnNotif?.addEventListener('click', (e) => {
    e.stopPropagation();
    tandaiNotifikasiSiswaDibaca();

    if (window.innerWidth >= 768) {
      document.getElementById('popoverNotifDesktop')?.classList.toggle('hidden');
      dropdownMenu?.classList.add('hidden');
    } else {
      bukaBottomSheetPengumuman();
    }
  });

  // Tutup dropdown menu atau popover otomatis bila klik di luar area
  document.addEventListener('click', (e) => {
    if (dropdownMenu && !dropdownMenu.contains(e.target) && !btnToggle?.contains(e.target)) {
      dropdownMenu.classList.add('hidden');
      chevron?.classList.remove('rotate-180');
    }
    const popoverNotif = document.getElementById('popoverNotifDesktop');
    if (popoverNotif && !popoverNotif.contains(e.target) && !btnNotif?.contains(e.target)) {
      popoverNotif.classList.add('hidden');
    }
  });

  // Navigasi 2 Menu Utama (Presensi & Tugas)
  ['presensi', 'tugas'].forEach((tabKey) => {
    document.getElementById(`tabBtn-${tabKey}`)?.addEventListener('click', () => switchTab(tabKey));
    document.getElementById(`tabBtn-${tabKey}-mob`)?.addEventListener('click', () => switchTab(tabKey));
  });

  // Aksi Kamera & Refresh Data
  document.getElementById('btnStartScan')?.addEventListener('click', startScanner);
  document.getElementById('btnStopScan')?.addEventListener('click', stopScanner);
  document.getElementById('btnPerbaruiTugasGuru')?.addEventListener('click', loadDaftarTugasGuru);
  document.getElementById('btnSegarkanRiwayat')?.addEventListener('click', loadRiwayat);

  // Form Pengiriman Data
  document.getElementById('tugasForm')?.addEventListener('submit', submitTugasSiswa);
  document.getElementById('izinForm')?.addEventListener('submit', submitIzinSiswa);
}

// ============================================================================
// 3. AUTENTIKASI SISWA & SINKRONISASI TAMPILAN
// ============================================================================

function switchAuthTab(type) {
  const formMasuk = document.getElementById('formMasuk');
  const formDaftar = document.getElementById('formDaftar');
  const btnMasuk = document.getElementById('authTabBtn-masuk');
  const btnDaftar = document.getElementById('authTabBtn-daftar');
  if (!formMasuk || !formDaftar) return;

  if (type === 'masuk') {
    formMasuk.classList.remove('hidden');
    formDaftar.classList.add('hidden');
    if (btnMasuk) btnMasuk.className = 'py-2.5 text-xs font-bold rounded-xl bg-blue-700 text-white shadow-sm transition flex items-center justify-center gap-1.5';
    if (btnDaftar) btnDaftar.className = 'py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5';
  } else {
    formMasuk.classList.add('hidden');
    formDaftar.classList.remove('hidden');
    if (btnDaftar) btnDaftar.className = 'py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-sm transition flex items-center justify-center gap-1.5';
    if (btnMasuk) btnMasuk.className = 'py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5';
  }
}

async function prosesMasukSiswa(e) {
  e.preventDefault();
  const nis = document.getElementById('loginNis').value.trim();
  const btn = document.getElementById('btnSubmitMasuk');
  btn.textContent = 'Memverifikasi...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, aksi: 'login' }),
    });
    const result = await res.json();

    if (result.success) {
      currentStudent = result.data;
      Auth.setSiswa(currentStudent);
      showToast('Berhasil masuk ke portal!', 'success');
      showDashboard();
    } else {
      showToast(result.message || 'NIS tidak ditemukan.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Masuk ke Dashboard</span>`;
    btn.disabled = false;
  }
}

async function prosesDaftarSiswa(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitDaftar');
  btn.textContent = 'Mendaftarkan...';
  btn.disabled = true;

  const payload = {
    nis: document.getElementById('regNis').value.trim(),
    nama: document.getElementById('regNama').value.trim(),
    kelas: document.getElementById('regKelas').value,
    jk: document.getElementById('regJk').value,
    ortu: document.getElementById('regOrtu').value.trim(),
    nohp: document.getElementById('regNohp').value.trim(),
    token: document.getElementById('regToken')?.value.trim() || '',
    aksi: 'register'
  };

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.success) {
      currentStudent = result.data;
      Auth.setSiswa(currentStudent);
      showToast('Registrasi berhasil! Selamat datang.', 'success');
      showDashboard();
    } else {
      showToast(result.message || 'Gagal mendaftarkan akun.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Daftar Akun Baru</span>`;
    btn.disabled = false;
  }
}

function updateHeaderUI(isLoggedIn) {
  const container = document.getElementById('headerSiswaContainer');
  const guestBadge = document.getElementById('headerGuestBadge');
  const userDropdown = document.getElementById('userProfileDropdownWrapSiswa');
  const notifWrap = document.getElementById('notifWrapSiswa');
  const navDesk = document.getElementById('navSiswaDesktop');
  const navMob = document.getElementById('navSiswaMobile');

  if (isLoggedIn) {
    if (container) container.className = "w-full max-w-6xl mx-auto px-4 md:px-6 transition-all duration-300";
    if (guestBadge) guestBadge.classList.add('hidden');
    if (userDropdown) userDropdown.classList.remove('hidden');
    if (notifWrap) notifWrap.classList.remove('hidden');

    if (navDesk) navDesk.className = "hidden md:flex items-center gap-1.5 bg-indigo-900/60 p-1 rounded-2xl border border-indigo-800/60 transition-all";
    if (navMob) navMob.className = "grid md:hidden pb-2.5 pt-0.5 grid-cols-2 gap-2 border-t border-indigo-900/50";
  } else {
    if (container) container.className = "w-full max-w-md mx-auto px-4 sm:px-0 transition-all duration-300";
    if (guestBadge) guestBadge.classList.remove('hidden');
    if (userDropdown) userDropdown.classList.add('hidden');
    if (notifWrap) notifWrap.classList.add('hidden');
    if (navDesk) navDesk.className = "hidden";
    if (navMob) navMob.className = "hidden";
  }

  aturTampilanPasangPWA(isLoggedIn, 'siswaHeaderRight', 'Siswa');
}

function showDashboard() {
  document.getElementById('loginSection')?.classList.add('hidden');
  document.getElementById('appSection')?.classList.remove('hidden');
  updateHeaderUI(true);

  // Penataan Data Profil Siswa
  const namaSiswa = currentStudent?.nama || 'Siswa';
  const kelasSiswa = currentStudent?.kelas || '-';
  const nisSiswa = currentStudent?.nis || '-';

  // 1. Tampilkan di Header Pill Siswa
  const pillName = document.getElementById('headerUserPillNameSiswa');
  const pillRole = document.getElementById('headerUserPillRoleSiswa');
  const initial = document.getElementById('headerAvatarInitialSiswa');

  if (pillName) pillName.textContent = namaSiswa.split(' ').slice(0, 2).join(' ');
  if (pillRole) pillRole.textContent = `Kelas ${kelasSiswa}`;
  if (initial) initial.textContent = (namaSiswa.trim()[0] || 'S').toUpperCase();

  // 2. Tampilkan di Dropdown Card Popover
  const ddNama = document.getElementById('dropdownNamaLengkapSiswa');
  const ddDetail = document.getElementById('dropdownPeranDetailSiswa');
  if (ddNama) ddNama.textContent = namaSiswa;
  if (ddDetail) ddDetail.textContent = `NIS: ${nisSiswa} | Kelas: ${kelasSiswa}`;

  const inputKelasTugas = document.getElementById('tugasKelas');
  if (inputKelasTugas) inputKelasTugas.value = `Kelas ${kelasSiswa}`;

  switchTab('presensi');
  switchPresensiMode('scan');
  loadRiwayat();
  loadRiwayatIzin();
  loadDaftarTugasGuru();
  muatUlangNotifikasiSiswa();
}

async function logout() {
  const yakin = await konfirmasiModal({
    judul: 'Keluar Portal Siswa',
    pesan: 'Apakah Anda yakin ingin keluar dari akun ini?',
    teksKonfirmasi: 'Ya, Keluar',
    tipe: 'warning'
  });

  if (!yakin) return;

  stopScanner();
  Auth.logoutSiswa();
  currentStudent = null;

  document.getElementById('appSection')?.classList.add('hidden');
  document.getElementById('loginSection')?.classList.remove('hidden');
  updateHeaderUI(false);
}

// ============================================================================
// 4. NAVIGASI 2 MENU UTAMA & MODE PRESENSI
// ============================================================================

function switchTab(tab) {
  const tabPresensi = document.getElementById('tabContent-presensi');
  const tabTugas = document.getElementById('tabContent-tugas');

  if (tab === 'presensi') {
    tabPresensi?.classList.remove('hidden');
    tabTugas?.classList.add('hidden');
  } else {
    tabPresensi?.classList.add('hidden');
    tabTugas?.classList.remove('hidden');
    stopScanner();
    loadDaftarTugasGuru();
  }

  sinkronkanStyle2Tab(tab);
}

function sinkronkanStyle2Tab(activeTabKey) {
  ['presensi', 'tugas'].forEach((key) => {
    const btnDesk = document.getElementById(`tabBtn-${key}`);
    const btnMob = document.getElementById(`tabBtn-${key}-mob`);
    const isActive = key === activeTabKey;

    if (btnDesk) {
      btnDesk.className = isActive
        ? 'py-1.5 px-4 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm transition flex items-center gap-1.5'
        : 'py-1.5 px-4 text-xs font-bold rounded-xl text-indigo-200 hover:text-white hover:bg-indigo-800/50 transition flex items-center gap-1.5';
    }
    if (btnMob) {
      btnMob.className = isActive
        ? 'py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm transition flex items-center justify-center gap-1.5'
        : 'py-2 text-xs font-bold rounded-xl text-indigo-200 bg-indigo-900/60 transition flex items-center justify-center gap-1.5';
    }
  });
}

function switchPresensiMode(mode) {
  const boxScan = document.getElementById('boxPresensi-scan');
  const boxIzin = document.getElementById('boxPresensi-izin');
  const btnScan = document.getElementById('presensiModeBtn-scan');
  const btnIzin = document.getElementById('presensiModeBtn-izin');

  if (mode === 'scan') {
    boxScan?.classList.remove('hidden');
    boxIzin?.classList.add('hidden');
    if (btnScan) btnScan.className = 'py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
    if (btnIzin) btnIzin.className = 'py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer';
  } else {
    boxScan?.classList.add('hidden');
    boxIzin?.classList.remove('hidden');
    stopScanner();
    if (btnIzin) btnIzin.className = 'py-2 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
    if (btnScan) btnScan.className = 'py-2 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer';
  }
}
window.switchPresensiMode = switchPresensiMode;

// ============================================================================
// 5. KAMERA QR CODE SCANNER DENGAN PANDUAN VISUAL DINAMIS
// ============================================================================

function startScanner() {
  const alertBox = document.getElementById('absenAlert');
  if (alertBox) alertBox.classList.add('hidden');

  const guidePlaceholder = document.getElementById('scannerGuidePlaceholder');
  const activeOverlay = document.getElementById('scannerActiveOverlay');
  const badgeStatus = document.getElementById('badgeStatusKamera');

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('reader');
  }

  html5QrCode
    .start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      async (decodedText) => {
        await stopScanner();
        kirimAbsensi(decodedText);
      },
      () => {}
    )
    .then(() => {
      // Sembunyikan placeholder panduan, nyalakan bingkai laser aktif
      if (guidePlaceholder) guidePlaceholder.classList.add('hidden');
      if (activeOverlay) activeOverlay.classList.remove('hidden');

      if (badgeStatus) {
        badgeStatus.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
        badgeStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Memindai QR...';
      }

      document.getElementById('btnStartScan')?.classList.add('hidden');
      document.getElementById('btnStopScan')?.classList.remove('hidden');
    })
    .catch(() => {
      bunyikanBeep('error');
      showToast('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.', 'error');
    });
}

async function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    await html5QrCode.stop();
    html5QrCode.clear();
  }

  const guidePlaceholder = document.getElementById('scannerGuidePlaceholder');
  const activeOverlay = document.getElementById('scannerActiveOverlay');
  const badgeStatus = document.getElementById('badgeStatusKamera');

  // Kembalikan ke tampilan ilustrasi panduan visual
  if (guidePlaceholder) guidePlaceholder.classList.remove('hidden');
  if (activeOverlay) activeOverlay.classList.add('hidden');

  if (badgeStatus) {
    badgeStatus.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200';
    badgeStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Kamera Standby';
  }

  const btnStart = document.getElementById('btnStartScan');
  const btnStop = document.getElementById('btnStopScan');
  if (btnStart) btnStart.classList.remove('hidden');
  if (btnStop) btnStop.classList.add('hidden');
}

async function kirimAbsensi(qrCodeData) {
  const alertBox = document.getElementById('absenAlert');
  if (alertBox) {
    alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-blue-50 text-blue-700 flex items-center justify-center gap-2 transition-all';
    alertBox.innerHTML = `${ICONS.info}<span>Mencatat kehadiran...</span>`;
    alertBox.classList.remove('hidden');
  }

  const payload = {
    nis: currentStudent?.nis,
    nama: currentStudent?.nama,
    kelas: currentStudent?.kelas,
    qrCodeData,
  };

  try {
    if (typeof qrCodeData === 'string' && qrCodeData.startsWith('ABSEN-SIBINTANG')) {
      const qrParts = qrCodeData.split('|').map((p) => p.trim());
      const kelasQR = (qrParts[1] || '').toUpperCase();
      const kelasSiswa = (currentStudent?.kelas || '').trim().toUpperCase();

      if (kelasQR && kelasSiswa && kelasQR !== kelasSiswa) {
        throw new Error(`QR ini khusus Kelas ${kelasQR}. Anda terdaftar di Kelas ${kelasSiswa}.`);
      }
    }

    // Jalur Mode Offline
    if (!navigator.onLine) {
      if (typeof simpanKeAntreanOffline === 'function') {
        simpanKeAntreanOffline(payload);
      }
      bunyikanBeep('success');
      if (alertBox) {
        alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-amber-100 text-amber-800 flex items-center justify-center gap-2 transition-all';
        alertBox.innerHTML = `${ICONS.info}<span>Tersimpan di antrean offline. Akan terkirim otomatis saat online.</span>`;
      }
      showToast('Koneksi offline: Data kehadiran disimpan di HP.', 'warning');
      return;
    }

    const res = await fetch('/api/absen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.success) {
      bunyikanBeep('success');
      if (alertBox) {
        alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800 flex items-center justify-center gap-2 transition-all';
        alertBox.innerHTML = `${ICONS.check}<span>${result.message} (${result.waktu})</span>`;
      }
      showToast(result.message || 'Absensi berhasil dicatat!', 'success');
      loadRiwayat();
    } else {
      throw new Error(result.message || 'Gagal memproses absensi.');
    }
  } catch (err) {
    const isNetworkError = !navigator.onLine || err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('failed to fetch'));
    if (isNetworkError) {
      if (typeof simpanKeAntreanOffline === 'function') {
        simpanKeAntreanOffline(payload);
      }
      bunyikanBeep('success');
      if (alertBox) {
        alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-amber-100 text-amber-800 flex items-center justify-center gap-2 transition-all';
        alertBox.innerHTML = `${ICONS.info}<span>Jaringan terputus. Data disimpan di antrean offline.</span>`;
      }
      showToast('Koneksi terputus: Disimpan ke antrean offline.', 'warning');
      return;
    }

    bunyikanBeep('error');
    if (alertBox) {
      alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-700 flex items-center justify-center gap-2 transition-all';
      alertBox.innerHTML = `${ICONS.error}<span>Gagal: ${err.message || 'Kesalahan server'}</span>`;
    }
    showToast(err.message || 'Gagal mencatat absensi.', 'error');
  }
}

// ============================================================================
// 6. DAFTAR TUGAS DARI GURU & PENGUMPULAN FILE TUGAS
// ============================================================================

async function loadDaftarTugasGuru() {
  if (!currentStudent) return;
  const container = document.getElementById('containerDaftarTugasGuru');
  if (!container) return;

  try {
    const res = await fetch(`/api/guru/tugas?kelas=${encodeURIComponent(currentStudent.kelas)}`);
    const result = await res.json();
    const tugasList = result.daftarSoal || result.data || result.daftarTugas || [];

    if (!result.success || tugasList.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 text-center py-3">Belum ada tugas atau PR untuk kelas Anda.</p>`;
      return;
    }

    container.innerHTML = tugasList.map((t) => {
      const fileLinkBtn = (t.link && t.link !== '-' && t.link !== '#')
        ? `<a href="${t.link}" target="_blank" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition">Buka File Soal ${ICONS.external}</a>`
        : '';
      const safeJudul = (t.judul || '').replace(/'/g, "\\'");
      const safeMapel = (t.mapel || '').replace(/'/g, "\\'");

      return `
        <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span class="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md w-fit">${t.mapel}</span>
            <span class="text-[11px] text-slate-500 font-medium">Batas Waktu: ${t.deadline || '-'}</span>
          </div>
          <h4 class="text-sm font-black text-slate-800">${t.judul}</h4>
          <p class="text-xs text-slate-600 leading-relaxed">${t.deskripsi || '-'}</p>
          <div class="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-slate-200/60">
            ${fileLinkBtn}
            <button type="button" onclick="pilihTugas('${safeJudul}', '${safeMapel}')" class="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm ml-auto">Kumpul Tugas Ini</button>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-3">Gagal memuat daftar tugas terbaru.</p>`;
  }
}

function pilihTugas(judul, mapel) {
  const inputJudul = document.getElementById('judulTugas');
  const selectMapel = document.getElementById('mapel');
  if (inputJudul) inputJudul.value = judul;
  if (selectMapel && mapel) selectMapel.value = mapel;
  switchTab('tugas');
  inputJudul?.scrollIntoView({ behavior: 'smooth' });
}
window.pilihTugas = pilihTugas;

async function submitTugasSiswa(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitTugas');
  const alertBox = document.getElementById('tugasAlert');
  const fileInput = document.getElementById('fileTugas')?.files?.[0];
  const judulVal = document.getElementById('judulTugas')?.value.trim();
  const mapelVal = document.getElementById('mapel')?.value || 'Tugas';

  if (!fileInput) {
    showToast('Harap pilih berkas/file tugas Anda!', 'error');
    return;
  }

  btn.textContent = 'Mengupload ke Google Drive...';
  btn.disabled = true;
  alertBox.classList.add('hidden');

  try {
    // 1. Format nama berkas: nama_kelas_matapelajaran_timestamp
    const cleanNama = (currentStudent?.nama || 'Siswa').replace(/\s+/g, '_');
    const cleanKelas = (currentStudent?.kelas || 'Kelas').replace(/\s+/g, '_');
    const cleanMapel = mapelVal.replace(/\s+/g, '_');
    const timestamp = Math.floor(Date.now() / 1000);

    const namaFileKustom = `${cleanNama}_${cleanKelas}_${cleanMapel}_${timestamp}`;
    const namaSubFolder = `Tugas_${cleanKelas}_${cleanMapel}`;

    // Unggah berkas langsung ke Google Drive via Apps Script
    showToast('Mengunggah file ke Google Drive...', 'info');
    const linkDrive = await uploadFileKeDrivePribadi(fileInput, namaFileKustom, namaSubFolder);

    if (!linkDrive) {
      throw new Error('Gagal mendapatkan tautan file dari Google Drive.');
    }

    // 2. Kirim metadata tugas beserta link Google Drive ke backend Vercel
    btn.textContent = 'Menyimpan data tugas...';
    const res = await fetch('/api/tugas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nis: currentStudent.nis,
        nama: currentStudent.nama,
        kelas: currentStudent.kelas,
        mapel: mapelVal,
        judulTugas: judulVal,
        judul: judulVal,
        link: linkDrive,
        fileLink: linkDrive
      }),
    });

    const result = await res.json();

    if (result.success) {
      alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800';
      alertBox.innerHTML = `
        <div class="flex items-center justify-center gap-1.5 font-bold mb-1">${ICONS.check}<span>${result.message || 'Tugas berhasil disimpan!'}</span></div>
        <a href="${linkDrive}" target="_blank" class="underline font-bold inline-flex items-center text-blue-700">Lihat File di Google Drive ${ICONS.external}</a>
      `;
      alertBox.classList.remove('hidden');
      showToast('Tugas berhasil diupload!', 'success');
      document.getElementById('tugasForm').reset();
      loadRiwayat();
      if (typeof muatUlangNotifikasiSiswa === 'function') {
        muatUlangNotifikasiSiswa();
      }
    } else {
      throw new Error(result.message || result.error);
    }
  } catch (err) {
    alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5';
    alertBox.innerHTML = `${ICONS.error}<span>Gagal mengupload tugas: ${err.message || 'Kesalahan jaringan'}</span>`;
    alertBox.classList.remove('hidden');
    showToast('Gagal mengupload tugas: ' + (err.message || ''), 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg><span>Kirim ke Google Drive</span>`;
    btn.disabled = false;
  }
}

// ============================================================================
// 7. PERMOHONAN IZIN & SAKIT SISWA
// ============================================================================

async function submitIzinSiswa(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitIzin');
  const alertBox = document.getElementById('izinAlert');
  const fileInput = document.getElementById('fileBukti')?.files?.[0];
  const statusIzinVal = document.getElementById('statusIzin')?.value || 'Izin';

  btn.textContent = 'Memproses berkas...';
  btn.disabled = true;
  alertBox.classList.add('hidden');

  try {
    let linkBukti = '-';

    // 1. Jika ada lampiran surat dokter/bukti izin, upload langsung ke Google Drive via Apps Script
    if (fileInput) {
      if (typeof showToast === 'function') {
        showToast('Mengunggah bukti surat izin ke Google Drive...', 'info');
      }
      btn.textContent = 'Mengunggah ke Drive...';

      // Format nama berkas: SuratIzin_nama_kelas_timestamp
      const cleanNama = (currentStudent?.nama || 'Siswa').replace(/\s+/g, '_');
      const cleanKelas = (currentStudent?.kelas || 'Kelas').replace(/\s+/g, '_');
      const cleanStatus = statusIzinVal.replace(/\s+/g, '_');
      const timestamp = Math.floor(Date.now() / 1000);

      const namaFileKustom = `Surat${cleanStatus}_${cleanNama}_${cleanKelas}_${timestamp}`;
      const namaSubFolder = `Surat_Izin_${cleanKelas}`;

      linkBukti = await uploadFileKeDrivePribadi(fileInput, namaFileKustom, namaSubFolder);
    }

    // 2. Kirim data izin beserta tautan Google Drive ke backend Vercel
    btn.textContent = 'Mengirim permohonan...';
    const res = await fetch('/api/izin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nis: currentStudent.nis,
        nama: currentStudent.nama,
        kelas: currentStudent.kelas,
        statusIzin: statusIzinVal,
        tanggalMulai: document.getElementById('tanggalMulai').value,
        keterangan: document.getElementById('keteranganIzin').value.trim(),
        link: linkBukti,
        linkBukti: linkBukti
      }),
    });

    const result = await res.json();

    if (result.success) {
      alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5';
      alertBox.innerHTML = `${ICONS.check}<span>${result.message || 'Pengajuan izin berhasil terkirim!'}</span>`;
      alertBox.classList.remove('hidden');
      if (typeof showToast === 'function') {
        showToast('Pengajuan izin terkirim!', 'success');
      }
      document.getElementById('izinForm').reset();
      if (typeof loadRiwayatIzin === 'function') {
        loadRiwayatIzin();
      }
    } else {
      throw new Error(result.message || result.error);
    }
  } catch (err) {
    alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5';
    alertBox.innerHTML = `${ICONS.error}<span>Gagal mengirim izin: ${err.message || 'Kesalahan jaringan'}</span>`;
    alertBox.classList.remove('hidden');
    if (typeof showToast === 'function') {
      showToast('Gagal mengirim izin.', 'error');
    }
  } finally {
    btn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg><span>Kirim Permohonan Izin</span>`;
    btn.disabled = false;
  }
}

async function loadRiwayatIzin() {
  if (!currentStudent) return;

  try {
    const res = await fetch(`/api/izin/${currentStudent.nis}`);
    const result = await res.json();
    const tbody = document.getElementById('tableRiwayatIzin');
    if (!tbody) return;

    if (!result.success || !result.izin || result.izin.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada riwayat izin / sakit.</td></tr>`;
      return;
    }

    tbody.innerHTML = result.izin.map((item) => {
      let badgeVerifikasi = `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">Menunggu</span>`;
      if (item.verifikasi === 'Disetujui') {
        badgeVerifikasi = `<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">✓ Disetujui</span>`;
      } else if (item.verifikasi === 'Ditolak') {
        badgeVerifikasi = `<span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">✕ Ditolak</span>`;
      }

      const lampiranLink = (item.link && item.link !== '-' && item.link !== '#')
        ? `<a href="${item.link}" target="_blank" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition">Lihat ${ICONS.external}</a>`
        : '<span class="text-slate-400 italic">Tanpa Berkas</span>';

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-2.5 font-medium text-slate-800 whitespace-nowrap">${item.tanggal}</td>
          <td class="p-2.5"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">${item.status}</span></td>
          <td class="p-2.5 text-slate-600 max-w-xs truncate" title="${item.keterangan}">${item.keterangan}</td>
          <td class="p-2.5 whitespace-nowrap">${lampiranLink}</td>
          <td class="p-2.5 whitespace-nowrap">${badgeVerifikasi}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Gagal memuat riwayat izin:', err);
  }
}
window.loadRiwayatIzin = loadRiwayatIzin;

// ============================================================================
// 8. LOG RIWAYAT KEHADIRAN (SCAN) & RIWAYAT TUGAS
// ============================================================================

async function loadRiwayat() {
  if (!currentStudent) return;

  try {
    const res = await fetch(`/api/riwayat/${currentStudent.nis}`);
    const result = await res.json();
    if (!result.success) return;

    // Tabel Riwayat Absensi Kehadiran
    const tbodyAbsen = document.getElementById('tableAbsensi');
    if (result.absensi.length === 0) {
      tbodyAbsen.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada riwayat absensi.</td></tr>`;
    } else {
      tbodyAbsen.innerHTML = result.absensi.map((item) => `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-2.5 font-medium">${item.waktu}</td>
          <td class="p-2.5 font-bold">${item.kelas}</td>
          <td class="p-2.5"><span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">${item.status}</span></td>
          <td class="p-2.5 text-slate-500">${item.keterangan}</td>
        </tr>
      `).join('');
    }

    // Tabel Riwayat Pengumpulan Tugas & Nilai Guru
    const tbodyTugas = document.getElementById('tableTugas');
    if (result.tugas.length === 0) {
      tbodyTugas.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada tugas yang dikumpulkan.</td></tr>`;
    } else {
      tbodyTugas.innerHTML = result.tugas.map((item) => {
        const badgeNilai = item.nilai
          ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl font-black text-xs inline-flex items-center gap-1 shadow-sm">${ICONS.star} Nilai: ${item.nilai}</span>`
          : `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-bold text-[11px] inline-block">Menunggu Dinilai</span>`;

        const catatanGuru = item.catatan
          ? `<div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-1 border border-slate-200"><span><b>Catatan Guru:</b> "${item.catatan}"</span></div>`
          : '';

        return `
          <tr class="hover:bg-slate-50 align-top transition">
            <td class="p-3 text-slate-500 whitespace-nowrap">${item.waktu}</td>
            <td class="p-3 font-bold text-blue-700">${item.mapel}</td>
            <td class="p-3">
              <div class="font-black text-slate-800">${item.judul}</div>
              ${catatanGuru}
            </td>
            <td class="p-3 text-right whitespace-nowrap">
              <div class="mb-1.5">${badgeNilai}</div>
              <a href="${item.link}" target="_blank" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold inline-flex items-center text-xs gap-1 transition">Buka File ${ICONS.external}</a>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Gagal memuat riwayat:', err);
  }
}
window.loadRiwayat = loadRiwayat;

// ============================================================================
// 9. PUSAT NOTIFIKASI TERPADU SISWA (TUGAS MASUK & PENGUMUMAN SEKOLAH)
// ============================================================================

function switchTabNotifSiswa(tab) {
  const deskTugas = document.getElementById('listNotifTugasDesktop');
  const deskPeng = document.getElementById('listPengumumanDesktop');
  const mobTugas = document.getElementById('listNotifTugasMobile');
  const mobPeng = document.getElementById('listPengumumanMobile');

  const btnDeskTugas = document.getElementById('tabNotifSiswaBtn-tugas');
  const btnDeskPeng = document.getElementById('tabNotifSiswaBtn-pengumuman');
  const btnMobTugas = document.getElementById('tabNotifSiswaMobBtn-tugas');
  const btnMobPeng = document.getElementById('tabNotifSiswaMobBtn-pengumuman');

  if (tab === 'tugas') {
    deskTugas?.classList.remove('hidden');
    deskPeng?.classList.add('hidden');
    mobTugas?.classList.remove('hidden');
    mobPeng?.classList.add('hidden');

    btnDeskTugas?.classList.add('bg-white', 'text-blue-900', 'shadow-sm');
    btnDeskTugas?.classList.remove('text-slate-500');
    btnDeskPeng?.classList.remove('bg-white', 'text-blue-900', 'shadow-sm');
    btnDeskPeng?.classList.add('text-slate-500');

    btnMobTugas?.classList.add('bg-white', 'text-blue-900', 'shadow-sm');
    btnMobTugas?.classList.remove('text-slate-500');
    btnMobPeng?.classList.remove('bg-white', 'text-blue-900', 'shadow-sm');
    btnMobPeng?.classList.add('text-slate-500');
  } else {
    deskTugas?.classList.add('hidden');
    deskPeng?.classList.remove('hidden');
    mobTugas?.classList.add('hidden');
    mobPeng?.classList.remove('hidden');

    btnDeskPeng?.classList.add('bg-white', 'text-blue-900', 'shadow-sm');
    btnDeskPeng?.classList.remove('text-slate-500');
    btnDeskTugas?.classList.remove('bg-white', 'text-blue-900', 'shadow-sm');
    btnDeskTugas?.classList.add('text-slate-500');

    btnMobPeng?.classList.add('bg-white', 'text-blue-900', 'shadow-sm');
    btnMobPeng?.classList.remove('text-slate-500');
    btnMobTugas?.classList.remove('bg-white', 'text-blue-900', 'shadow-sm');
    btnMobTugas?.classList.add('text-slate-500');
  }
}
window.switchTabNotifSiswa = switchTabNotifSiswa;

async function muatUlangNotifikasiSiswa() {
  if (!currentStudent) return;

  let totalTugasBelumKumpul = 0;

  // 1. Ambil Notifikasi Tugas dari Guru
  try {
    const resTugas = await fetch(`/api/guru/tugas?kelas=${encodeURIComponent(currentStudent.kelas)}`);
    const dataTugas = await resTugas.json();
    const daftarTugas = dataTugas.daftarSoal || dataTugas.data || dataTugas.daftarTugas || [];

    // Ambil riwayat tugas yang sudah dikumpulkan siswa untuk difilter
    let tugasSudahKumpul = [];
    try {
      const resRiwayat = await fetch(`/api/riwayat/${currentStudent.nis}`);
      const dataRiwayat = await resRiwayat.json();
      tugasSudahKumpul = (dataRiwayat.tugas || []).map(t => (t.judul || '').trim().toLowerCase());
    } catch (_) {}

    // Saring tugas yang belum pernah diunggah oleh siswa ini
    const tugasBelumSelesai = daftarTugas.filter(t => {
      const judul = (t.judul || '').trim().toLowerCase();
      return !tugasSudahKumpul.includes(judul);
    });

    totalTugasBelumKumpul = tugasBelumSelesai.length;

    const htmlTugas = tugasBelumSelesai.length === 0
      ? `<p class="text-xs text-slate-400 text-center py-4">Semua tugas kelas sudah kamu selesaikan.</p>`
      : tugasBelumSelesai.map(t => {
          const safeJudul = (t.judul || '').replace(/'/g, "\\'");
          const safeMapel = (t.mapel || '').replace(/'/g, "\\'");
          return `
            <div class="p-3 bg-blue-50/70 hover:bg-blue-100/70 rounded-2xl border border-blue-100 transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">${t.mapel}</span>
                <span class="text-[10px] text-slate-400 font-mono">Batas: ${t.deadline || '-'}</span>
              </div>
              <h5 class="text-xs font-black text-slate-800 leading-snug">${t.judul}</h5>
              <p class="text-[11px] text-slate-600 truncate">${t.deskripsi || '-'}</p>
              <div class="pt-1.5 flex items-center justify-between border-t border-blue-200/50 mt-1">
                <span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Belum Dikumpul</span>
                <button type="button" onclick="pilihTugasDariNotif('${safeJudul}', '${safeMapel}')" class="cursor-pointer text-[11px] font-bold text-blue-700 hover:underline">Kerjakan Sekarang →</button>
              </div>
            </div>
          `;
        }).join('');

    const deskTugas = document.getElementById('listNotifTugasDesktop');
    const mobTugas = document.getElementById('listNotifTugasMobile');
    if (deskTugas) deskTugas.innerHTML = htmlTugas;
    if (mobTugas) mobTugas.innerHTML = htmlTugas;
  } catch {
    const errHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memeriksa tugas baru.</p>`;
    const deskTugas = document.getElementById('listNotifTugasDesktop');
    if (deskTugas) deskTugas.innerHTML = errHtml;
  }

  // 2. Ambil Pengumuman Sekolah
  await loadPengumumanSiswa();

  // 3. Update Pill Counter & Live Dot Badge
  const counterPill = document.getElementById('notifSiswaCounterPill');
  if (counterPill) counterPill.textContent = `${totalTugasBelumKumpul} Tugas Aktif`;

  const badgeLive = document.getElementById('badgeNotifLive');
  const sudahDibaca = localStorage.getItem('sibintang_notif_siswa_read') === 'true';

  if (totalTugasBelumKumpul > 0 || !sudahDibaca) {
    badgeLive?.classList.remove('hidden');
  } else {
    badgeLive?.classList.add('hidden');
  }
}
window.muatUlangNotifikasiSiswa = muatUlangNotifikasiSiswa;

function pilihTugasDariNotif(judul, mapel) {
  tutupBottomSheetPengumuman();
  document.getElementById('popoverNotifDesktop')?.classList.add('hidden');

  pilihTugas(judul, mapel);
}
window.pilihTugasDariNotif = pilihTugasDariNotif;

function tandaiNotifikasiSiswaDibaca() {
  const badgeLive = document.getElementById('badgeNotifLive');
  if (badgeLive) {
    badgeLive.classList.add('hidden');
  }
  localStorage.setItem('sibintang_notif_siswa_read', 'true');
}

function bukaBottomSheetPengumuman() {
  document.getElementById('bottomSheetPengumuman')?.classList.remove('hidden');
}
window.bukaBottomSheetPengumuman = bukaBottomSheetPengumuman;

function tutupBottomSheetPengumuman() {
  document.getElementById('bottomSheetPengumuman')?.classList.add('hidden');
}
window.tutupBottomSheetPengumuman = tutupBottomSheetPengumuman;

async function loadPengumumanSiswa() {
  const listDesk = document.getElementById('listPengumumanDesktop');
  const listMob = document.getElementById('listPengumumanMobile');
  if (!listDesk && !listMob) return;

  if (!currentStudent) return;

  try {
    const res = await fetch(`/api/pengumuman?kelas=${encodeURIComponent(currentStudent.kelas)}`);
    const result = await res.json();
    const pengumuman = result.pengumuman || [];

    if (!result.success || pengumuman.length === 0) {
      const emptyHtml = `<p class="text-xs text-slate-400 text-center py-4">Tidak ada pengumuman baru.</p>`;
      if (listDesk) listDesk.innerHTML = emptyHtml;
      if (listMob) listMob.innerHTML = emptyHtml;
      return;
    }

    const htmlCards = pengumuman.map((p) => `
      <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${p.target === 'SEMUA' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${p.kategori}</span>
          <span class="text-[10px] text-slate-400 font-mono">${p.waktu}</span>
        </div>
        <h5 class="text-xs font-black text-slate-800 leading-snug">${p.judul}</h5>
        <p class="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">${p.isi}</p>
      </div>
    `).join('');

    if (listDesk) listDesk.innerHTML = htmlCards;
    if (listMob) listMob.innerHTML = htmlCards;
  } catch {
    const errorHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memuat pengumuman.</p>`;
    if (listDesk) listDesk.innerHTML = errorHtml;
    if (listMob) listMob.innerHTML = errorHtml;
  }
}
window.loadPengumumanSiswa = loadPengumumanSiswa;
