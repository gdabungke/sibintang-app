/**
 * ============================================================================
 * SIBINTANG - GURU & PENGELOLA CONTROLLER (guru.js)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Mengelola interaksi dashboard guru dan pengelola sekolah: pembuatan QR
 * absensi harian, rekapitulasi presensi & ekspor CSV, verifikasi surat izin/sakit,
 * publikasi & penilaian tugas murid, generator token, penerbitan pengumuman,
 * dan pusat notifikasi terpadu (tugas belum dinilai & edaran resmi).
 */

let currentGuru = null;
let qrGenerator = null;
let cacheDaftarTugas = [];
let cacheRekapAbsen = null;
let cacheRekapTugasFull = null;

// ============================================================================
// 1. INISIALISASI PORTAL GURU (Dipanggil otomatis oleh app.js)
// ============================================================================
function inisialisasiPortalGuru() {
  // Isi dropdown dasar dari constants.js
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

  // Set default filter tanggal ke hari ini
  const today = new Date().toISOString().split('T')[0];
  const filterTgl = document.getElementById('filterTanggal');
  if (filterTgl) filterTgl.value = today;

  // Hubungkan seluruh event listener elemen DOM
  initEventListeners();

  // Periksa sesi aktif pengelola via auth.js
  currentGuru = Auth.getGuru();
  if (currentGuru) {
    bukaDashboardGuru();
  } else {
    updateGuruHeaderUI(false);
  }
}
window.inisialisasiPortalGuru = inisialisasiPortalGuru;

// ============================================================================
// 2. PENDAFTARAN EVENT LISTENER ELEMEN DOM
// ============================================================================
function initEventListeners() {
  // Autentikasi Pengelola
  document.getElementById('authTabBtn-masuk')?.addEventListener('click', () => switchAuthTab('masuk'));
  document.getElementById('authTabBtn-daftar')?.addEventListener('click', () => switchAuthTab('daftar'));
  document.getElementById('regRoleGuru')?.addEventListener('change', toggleRoleOptions);
  document.getElementById('btnLogoutGuru')?.addEventListener('click', logoutGuru);
  document.getElementById('formMasukGuru')?.addEventListener('submit', prosesMasukGuru);
  document.getElementById('formDaftarGuru')?.addEventListener('submit', prosesDaftarGuru);

  // Toggle Dropdown Profil Header Pengelola
  const btnToggle = document.getElementById('btnToggleUserDropdown');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  const chevron = document.getElementById('chevronDropdown');

  btnToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('hidden');
    chevron?.classList.toggle('rotate-180');
    document.getElementById('popoverNotifGuruDesktop')?.classList.add('hidden');
  });

  // Toggle Lonceng Notifikasi Guru (Desktop Popover vs Mobile Bottom Sheet)
  const btnNotif = document.getElementById('btnToggleNotifGuru');
  btnNotif?.addEventListener('click', (e) => {
    e.stopPropagation();
    tandaiNotifikasiGuruDibaca();

    if (window.innerWidth >= 768) {
      document.getElementById('popoverNotifGuruDesktop')?.classList.toggle('hidden');
      dropdownMenu?.classList.add('hidden');
    } else {
      bukaBottomSheetNotifGuru();
    }
  });

  // Tutup menu popover jika klik di luar area
  document.addEventListener('click', (e) => {
    if (dropdownMenu && !dropdownMenu.contains(e.target) && !btnToggle?.contains(e.target)) {
      dropdownMenu.classList.add('hidden');
      chevron?.classList.remove('rotate-180');
    }
    const popoverNotif = document.getElementById('popoverNotifGuruDesktop');
    if (popoverNotif && !popoverNotif.contains(e.target) && !btnNotif?.contains(e.target)) {
      popoverNotif.classList.add('hidden');
    }
  });

  // Tab Navigasi Menu Header (Desktop & Mobile)
  ['absen', 'tugas', 'pengumuman'].forEach((tabKey) => {
    document.getElementById(`tabGuruBtn-${tabKey}`)?.addEventListener('click', () => switchGuruTab(tabKey));
    document.getElementById(`tabGuruBtn-${tabKey}-mob`)?.addEventListener('click', () => switchGuruTab(tabKey));
  });

  // Tab 1: Absensi & QR
  document.getElementById('filterKelas')?.addEventListener('change', () => sinkronKelas('absen'));
  document.getElementById('filterTanggal')?.addEventListener('change', updateDashboardAbsen);
  document.getElementById('ketSesi')?.addEventListener('input', generateQR);
  document.getElementById('btnSegarkanRekap')?.addEventListener('click', loadRekapKelas);
  document.getElementById('btnExportCSV')?.addEventListener('click', exportAbsensiCSV);
  document.getElementById('btnCetakQR')?.addEventListener('click', () => window.print());

  // Tab 2: Kelola Tugas & PR
  document.getElementById('filterKelasTugas')?.addEventListener('change', () => sinkronKelas('tugas'));
  document.getElementById('filterMapelTugas')?.addEventListener('change', loadRekapTugas);
  document.getElementById('cariTugasInput')?.addEventListener('input', filterTabelTugasLokal);
  document.getElementById('btnSegarkanTugas')?.addEventListener('click', loadRekapTugas);
  document.getElementById('btnExportTugasCSV')?.addEventListener('click', exportTugasCSV);
  document.getElementById('btnCloseModalNilai')?.addEventListener('click', closeModalNilai);
  document.getElementById('btnBatalNilai')?.addEventListener('click', closeModalNilai);
  document.getElementById('formNilai')?.addEventListener('submit', simpanNilaiTugas);
  document.getElementById('formBuatTugasGuru')?.addEventListener('submit', submitBuatTugasGuru);

  // Tab 3: Pengumuman & Generator Token
  document.getElementById('p_template')?.addEventListener('change', pilihTemplatePengumuman);
  document.getElementById('formPengumuman')?.addEventListener('submit', submitPengumumanGuru);
  document.getElementById('formGenerateToken')?.addEventListener('submit', submitGenerateToken);
  document.getElementById('btnSalinToken')?.addEventListener('click', salinToken);
}

// ============================================================================
// 3. PUSAT NOTIFIKASI GURU (TUGAS MASUK & PENGUMUMAN)
// ============================================================================

function bukaBottomSheetNotifGuru() {
  document.getElementById('bottomSheetNotifGuru')?.classList.remove('hidden');
}
window.bukaBottomSheetNotifGuru = bukaBottomSheetNotifGuru;

function tutupBottomSheetNotifGuru() {
  document.getElementById('bottomSheetNotifGuru')?.classList.add('hidden');
}
window.tutupBottomSheetNotifGuru = tutupBottomSheetNotifGuru;

function switchTabNotifGuru(tab) {
  const deskTugas = document.getElementById('notifDaftarTugasDesktop');
  const deskPeng = document.getElementById('notifDaftarPengumumanDesktop');
  const mobTugas = document.getElementById('notifDaftarTugasMobile');
  const mobPeng = document.getElementById('notifDaftarPengumumanMobile');

  const btnDeskTugas = document.getElementById('tabNotifBtn-tugas');
  const btnDeskPeng = document.getElementById('tabNotifBtn-pengumuman');
  const btnMobTugas = document.getElementById('tabNotifMobBtn-tugas');
  const btnMobPeng = document.getElementById('tabNotifMobBtn-pengumuman');

  if (tab === 'tugas') {
    deskTugas?.classList.remove('hidden');
    deskPeng?.classList.add('hidden');
    mobTugas?.classList.remove('hidden');
    mobPeng?.classList.add('hidden');

    btnDeskTugas?.classList.add('bg-white', 'text-indigo-900', 'shadow-sm');
    btnDeskTugas?.classList.remove('text-slate-500');
    btnDeskPeng?.classList.remove('bg-white', 'text-indigo-900', 'shadow-sm');
    btnDeskPeng?.classList.add('text-slate-500');

    btnMobTugas?.classList.add('bg-white', 'text-indigo-900', 'shadow-sm');
    btnMobTugas?.classList.remove('text-slate-500');
    btnMobPeng?.classList.remove('bg-white', 'text-indigo-900', 'shadow-sm');
    btnMobPeng?.classList.add('text-slate-500');
  } else {
    deskTugas?.classList.add('hidden');
    deskPeng?.classList.remove('hidden');
    mobTugas?.classList.add('hidden');
    mobPeng?.classList.remove('hidden');

    btnDeskPeng?.classList.add('bg-white', 'text-indigo-900', 'shadow-sm');
    btnDeskPeng?.classList.remove('text-slate-500');
    btnDeskTugas?.classList.remove('bg-white', 'text-indigo-900', 'shadow-sm');
    btnDeskTugas?.classList.add('text-slate-500');

    btnMobPeng?.classList.add('bg-white', 'text-indigo-900', 'shadow-sm');
    btnMobPeng?.classList.remove('text-slate-500');
    btnMobTugas?.classList.remove('bg-white', 'text-indigo-900', 'shadow-sm');
    btnMobTugas?.classList.add('text-slate-500');
  }
}
window.switchTabNotifGuru = switchTabNotifGuru;

function tandaiNotifikasiGuruDibaca() {
  const badge = document.getElementById('badgeNotifLiveGuru');
  if (badge) {
    badge.classList.add('hidden');
  }
  localStorage.setItem('sibintang_notif_guru_read', Date.now().toString());
}

async function muatUlangNotifikasiGuru() {
  if (!currentGuru) return;

  const kelasTarget = currentGuru.kelasBinaan !== '-' ? currentGuru.kelasBinaan : '1A';
  const mapelTarget = currentGuru.mapelAjar !== '-' ? currentGuru.mapelAjar : 'SEMUA';

  let jumlahItemBaru = 0;

  // 1. Ambil Notifikasi Tugas Masuk
  try {
    const resTugas = await fetch(`/api/guru/tugas?kelas=${encodeURIComponent(kelasTarget)}&mapel=${encodeURIComponent(mapelTarget)}`);
    const dataTugas = await resTugas.json();
    const daftar = dataTugas.daftarTugas || [];

    // Filter presisi: hanya yang benar-benar belum dinilai (bukan nilai 0)
    const belumDinilai = daftar.filter(t => t.nilai === '' || t.nilai === null || t.nilai === undefined);
    jumlahItemBaru += belumDinilai.length;

    const htmlTugas = belumDinilai.length === 0
      ? `<p class="text-xs text-slate-400 text-center py-4">Semua tugas siswa sudah dinilai.</p>`
      : belumDinilai.map(t => {
          const safeKelas = (t.kelas || '').replace(/'/g, "\\'");
          const safeMapel = (t.mapel || '').replace(/'/g, "\\'");
          return `
            <div class="p-3 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-2xl border border-indigo-100 transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-md">${t.kelas} • ${t.mapel}</span>
                <span class="text-[10px] text-slate-400 font-mono">${t.waktu}</span>
              </div>
              <h5 class="text-xs font-black text-slate-800">${t.nama} <span class="text-[10px] text-slate-500 font-normal">(NIS: ${t.nis})</span></h5>
              <p class="text-[11px] text-slate-600 truncate">${t.judul}</p>
              <div class="pt-1.5 flex items-center justify-between border-t border-indigo-200/50 mt-1">
                <span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Belum Dinilai</span>
                <button type="button" onclick="arahkanKePenilaian('${safeKelas}', '${safeMapel}')" class="cursor-pointer text-[11px] font-bold text-indigo-700 hover:underline">Buka & Beri Nilai →</button>
              </div>
            </div>
          `;
        }).join('');

    const deskTugas = document.getElementById('notifDaftarTugasDesktop');
    const mobTugas = document.getElementById('notifDaftarTugasMobile');
    if (deskTugas) deskTugas.innerHTML = htmlTugas;
    if (mobTugas) mobTugas.innerHTML = htmlTugas;
  } catch {
    const errorHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memuat notifikasi tugas.</p>`;
    const deskTugas = document.getElementById('notifDaftarTugasDesktop');
    if (deskTugas) deskTugas.innerHTML = errorHtml;
  }

  // 2. Ambil Notifikasi Pengumuman Resmi Sekolah
  try {
    const resPeng = await fetch(`/api/pengumuman?kelas=SEMUA`);
    const dataPeng = await resPeng.json();
    const daftarPeng = dataPeng.pengumuman || [];

    const htmlPeng = daftarPeng.length === 0
      ? `<p class="text-xs text-slate-400 text-center py-4">Tidak ada pengumuman aktif saat ini.</p>`
      : daftarPeng.map(p => `
          <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">${p.kategori}</span>
              <span class="text-[10px] text-slate-400 font-mono">${p.waktu}</span>
            </div>
            <h5 class="text-xs font-black text-slate-800 leading-snug">${p.judul}</h5>
            <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">${p.isi}</p>
            <div class="pt-1 text-[10px] text-slate-400 font-medium border-t border-slate-100 mt-1">
              Oleh: <b>${p.pembuat}</b>
            </div>
          </div>
        `).join('');

    const deskPeng = document.getElementById('notifDaftarPengumumanDesktop');
    const mobPeng = document.getElementById('notifDaftarPengumumanMobile');
    if (deskPeng) deskPeng.innerHTML = htmlPeng;
    if (mobPeng) mobPeng.innerHTML = htmlPeng;
  } catch {
    const errorHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memuat pengumuman.</p>`;
    const deskPeng = document.getElementById('notifDaftarPengumumanDesktop');
    if (deskPeng) deskPeng.innerHTML = errorHtml;
  }

  // 3. Atur Pill Counter dan Live Ping Badge
  const counterPill = document.getElementById('notifCounterPill');
  if (counterPill) counterPill.textContent = `${jumlahItemBaru} Tugas Baru`;

  const badge = document.getElementById('badgeNotifLiveGuru');
  if (jumlahItemBaru > 0) {
    badge?.classList.remove('hidden');
  } else {
    badge?.classList.add('hidden');
  }
}
window.muatUlangNotifikasiGuru = muatUlangNotifikasiGuru;

function arahkanKePenilaian(kelas, mapel) {
  tutupBottomSheetNotifGuru();
  document.getElementById('popoverNotifGuruDesktop')?.classList.add('hidden');

  switchGuruTab('tugas');

  const filterK = document.getElementById('filterKelasTugas');
  const filterM = document.getElementById('filterMapelTugas');
  if (filterK && kelas) filterK.value = kelas;
  if (filterM && mapel) filterM.value = mapel;

  loadRekapTugas();
}
window.arahkanKePenilaian = arahkanKePenilaian;

// ============================================================================
// 4. AUTENTIKASI PENGELOLA & SINKRONISASI TAMPILAN
// ============================================================================

function switchAuthTab(type) {
  const formMasuk = document.getElementById('formMasukGuru');
  const formDaftar = document.getElementById('formDaftarGuru');
  const btnMasuk = document.getElementById('authTabBtn-masuk');
  const btnDaftar = document.getElementById('authTabBtn-daftar');
  if (!formMasuk || !formDaftar) return;

  if (type === 'masuk') {
    formMasuk.classList.remove('hidden');
    formDaftar.classList.add('hidden');
    if (btnMasuk) btnMasuk.className = 'py-2.5 text-xs font-bold rounded-xl bg-indigo-800 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
    if (btnDaftar) btnDaftar.className = 'py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer';
  } else {
    formMasuk.classList.add('hidden');
    formDaftar.classList.remove('hidden');
    if (btnDaftar) btnDaftar.className = 'py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer';
    if (btnMasuk) btnMasuk.className = 'py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer';
  }
}

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

async function prosesMasukGuru(e) {
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
      Auth.setGuru(currentGuru);
      showToast(`Selamat datang kembali, ${currentGuru.nama} (${currentGuru.role})`, 'success');
      setTimeout(() => bukaDashboardGuru(), 800);
    } else {
      showToast(result.message || result.error || 'NIP belum terdaftar.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Masuk ke Dashboard</span>`;
    btn.disabled = false;
  }
}

async function prosesDaftarGuru(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitDaftarGuru');
  btn.textContent = 'Mendaftarkan...';
  btn.disabled = true;

  const role = document.getElementById('regRoleGuru')?.value || '';
  const mapelAjar = document.getElementById('regMapelAjar')?.value || '-';

  if ((role === 'Guru Mapel' || role === 'Guru Mata Pelajaran') && (!mapelAjar || mapelAjar === '-' || mapelAjar.includes('Pilih'))) {
    showToast('Pilih mata pelajaran yang Anda ampu!', 'error');
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Daftar Akun Baru</span>`;
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
      Auth.setGuru(currentGuru);
      showToast(`Registrasi berhasil! Selamat datang, ${currentGuru.nama}`, 'success');
      setTimeout(() => bukaDashboardGuru(), 800);
    } else {
      showToast(result.message || result.error || 'Gagal mendaftarkan akun pengelola.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Daftar Akun Baru</span>`;
    btn.disabled = false;
  }
}

function updateGuruHeaderUI(isLoggedIn) {
  const container = document.getElementById('headerGuruContainer');
  const linkSiswa = document.getElementById('linkPortalSiswa');
  const userDropdown = document.getElementById('userProfileDropdownWrap');
  const notifWrap = document.getElementById('notifWrapGuru');
  const navDesk = document.getElementById('navGuruDesktop');
  const navMob = document.getElementById('navGuruMobile');

  if (isLoggedIn) {
    if (container) container.className = "w-full max-w-6xl mx-auto px-4 md:px-6 transition-all duration-300";
    if (linkSiswa) linkSiswa.classList.add('hidden');
    if (userDropdown) userDropdown.classList.remove('hidden');
    if (notifWrap) notifWrap.classList.remove('hidden');
    if (navDesk) navDesk.className = "hidden md:flex items-center gap-1 bg-indigo-900/60 p-1 rounded-2xl border border-indigo-800/60 transition-all";
    if (navMob) navMob.className = "grid md:hidden pb-2.5 pt-0.5 grid-cols-3 gap-1.5 border-t border-indigo-900/50";
  } else {
    if (container) container.className = "w-full max-w-md mx-auto px-4 sm:px-0 transition-all duration-300";
    if (linkSiswa) linkSiswa.classList.remove('hidden');
    if (userDropdown) userDropdown.classList.add('hidden');
    if (notifWrap) notifWrap.classList.add('hidden');
    if (navDesk) navDesk.className = "hidden";
    if (navMob) navMob.className = "hidden";
  }

  aturTampilanPasangPWA(isLoggedIn, 'guruHeaderRight', 'Pengelola');
}

function bukaDashboardGuru() {
  document.getElementById('loginGuruSection')?.classList.add('hidden');
  document.getElementById('dashboardGuruSection')?.classList.remove('hidden');
  updateGuruHeaderUI(true);

  // Penataan Data Profil Pengelola
  const namaGuru = currentGuru?.nama || 'Pengelola';
  const roleGuru = currentGuru?.role || 'Guru';
  let detailRole = `Peran: ${roleGuru}`;
  if (currentGuru?.role === 'Wali Kelas') detailRole += ` | Kelas Binaan: ${currentGuru.kelasBinaan}`;
  if (currentGuru?.role === 'Guru Mapel' || currentGuru?.role === 'Guru Mata Pelajaran') detailRole += ` | Mapel: ${currentGuru.mapelAjar}`;

  const pillName = document.getElementById('headerUserPillName');
  const pillRole = document.getElementById('headerUserPillRole');
  const initial = document.getElementById('headerAvatarInitial');
  if (pillName) pillName.textContent = namaGuru.split(' ').slice(0, 2).join(' ');
  if (pillRole) pillRole.textContent = roleGuru;
  if (initial) initial.textContent = (namaGuru.trim()[0] || 'G').toUpperCase();

  const ddNama = document.getElementById('dropdownNamaLengkap');
  const ddRole = document.getElementById('dropdownPeranDetail');
  if (ddNama) ddNama.textContent = namaGuru;
  if (ddRole) ddRole.textContent = detailRole;

  Auth.terapkanAksesRoleGuru(currentGuru);
  switchGuruTab('absen');
  updateDashboardAbsen();
  loadRekapTugas();
  muatUlangNotifikasiGuru();
}

async function logoutGuru() {
  const yakin = await konfirmasiModal({
    judul: 'Keluar Portal Guru & Pengelola',
    pesan: 'Apakah Anda yakin ingin mengakhiri sesi dashboard pengelola ini?',
    teksKonfirmasi: 'Ya, Keluar',
    tipe: 'warning'
  });

  if (yakin) {
    Auth.logoutGuru();
  }
}

// ============================================================================
// 5. MANAJEMEN TAB NAVIGASI GURU (3 MENU)
// ============================================================================

function switchGuruTab(tab) {
  ['absen', 'tugas', 'pengumuman'].forEach((t) => {
    const content = document.getElementById(`tabGuruContent-${t}`);
    if (content) content.classList.add('hidden');
  });

  const activeContent = document.getElementById(`tabGuruContent-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');

  sinkronkanStyleTabGuru(tab);

  if (tab === 'absen') loadRekapKelas();
  if (tab === 'tugas') loadRekapTugas();
}

function sinkronkanStyleTabGuru(activeTabKey) {
  const tabs = ['absen', 'tugas', 'pengumuman'];
  tabs.forEach((key) => {
    const btnDesk = document.getElementById(`tabGuruBtn-${key}`);
    const btnMob = document.getElementById(`tabGuruBtn-${key}-mob`);
    const isActive = key === activeTabKey;

    if (btnDesk) {
      btnDesk.className = isActive
        ? 'py-1.5 px-3.5 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer'
        : 'py-1.5 px-3.5 text-xs font-bold rounded-xl text-indigo-200 hover:text-white hover:bg-indigo-800/50 transition flex items-center gap-1.5 cursor-pointer';
    }

    if (btnMob) {
      btnMob.className = isActive
        ? 'py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-sm transition flex items-center justify-center gap-1 cursor-pointer'
        : 'py-2 text-xs font-bold rounded-xl text-indigo-200 bg-indigo-900/60 transition flex items-center justify-center gap-1 cursor-pointer';
    }
  });
}

function sinkronKelas(source) {
  if (currentGuru && (currentGuru.role === 'Wali Kelas' || currentGuru.role === 'Guru Kelas') && currentGuru.kelasBinaan !== '-') return;

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
  loadVerifikasiIzinGuru();
}

// ============================================================================
// 6. GENERATOR QR CODE ABSENSI KELAS
// ============================================================================

function generateQR() {
  const kelas = document.getElementById('filterKelas')?.value || currentGuru?.kelasBinaan || '1A';
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
    colorDark: '#1e3a8a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => {
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgLogo = new Image();
    imgLogo.src = 'icon.png';

    imgLogo.onerror = () => {
      const fallbackImg = container.querySelector('img');
      if (fallbackImg) fallbackImg.src = canvas.toDataURL();
    };

    imgLogo.onload = () => {
      const size = canvas.width;
      const logoSize = size * 0.22;
      const center = size / 2;
      const pos = (size - logoSize) / 2;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(center, center, (logoSize / 2) + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgLogo, pos, pos, logoSize, logoSize);
      ctx.restore();

      const fallbackImg = container.querySelector('img');
      if (fallbackImg) {
        fallbackImg.src = canvas.toDataURL();
      }
    };
  }, 50);
}

// ============================================================================
// 7. REKAPITULASI PRESENSI & VERIFIKASI PERMOHONAN IZIN
// ============================================================================

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

    // Siswa Belum Absen
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
            ? `<a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold inline-flex items-center text-xs gap-1 shadow-sm transition">${ICONS.wa}<span>Hubungi Ortu</span></a>`
            : `<span class="text-slate-400">-</span>`;

          return `
            <tr class="hover:bg-rose-50/40 transition">
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

    // Siswa Sudah Absen
    const tbodySudah = document.getElementById('tbodySudahAbsen');
    if (!data.sudahAbsen || data.sudahAbsen.length === 0) {
      tbodySudah.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada siswa yang melakukan scan QR pada tanggal ini.</td></tr>`;
    } else {
      tbodySudah.innerHTML = data.sudahAbsen
        .map(
          (s) => `
          <tr class="hover:bg-slate-50 transition">
            <td class="p-2.5 font-medium text-slate-600">${s.waktuAbsen}</td>
            <td class="p-2.5 font-mono text-slate-500">${s.nis}</td>
            <td class="p-2.5 font-bold text-slate-800">${s.nama}</td>
            <td class="p-2.5"><span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold">${s.status}</span></td>
          </tr>
        `
        )
        .join('');
    }
  } catch (err) {
    console.error('Gagal mengambil rekap absen:', err);
  }
}

async function loadVerifikasiIzinGuru() {
  const kelas = document.getElementById('filterKelas')?.value;
  const tbody = document.getElementById('tbodyVerifikasiIzin');
  if (!kelas || !tbody) return;

  try {
    const res = await fetch(`/api/guru/verifikasi-izin?kelas=${encodeURIComponent(kelas)}`);
    const data = await res.json();

    if (!data.success || !data.daftarIzin || data.daftarIzin.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-400">Tidak ada pengajuan izin/sakit untuk Kelas ${kelas}.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.daftarIzin
      .map((item) => {
        const linkSurat = item.link && item.link !== '-' && item.link !== '#'
          ? `<a href="${item.link}" target="_blank" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold inline-flex items-center text-[11px] gap-1 transition">Berkas ${ICONS.external}</a>`
          : `<span class="text-slate-400 italic">Tanpa Berkas</span>`;

        let badgeStatus = `<span class="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Menunggu</span>`;
        if (item.statusVerifikasi === 'Disetujui') {
          badgeStatus = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">✓ Disetujui</span>`;
        } else if (item.statusVerifikasi === 'Ditolak') {
          badgeStatus = `<span class="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">✕ Ditolak</span>`;
        }

        const aksiBtn = item.statusVerifikasi === 'Disetujui' || item.statusVerifikasi === 'Ditolak'
          ? `<span class="text-[11px] text-slate-400 font-medium">Oleh: ${item.verifikator || '-'}</span>`
          : `
            <div class="inline-flex items-center gap-1.5">
              <button type="button" onclick="responIzinSiswa(${item.rowIndex}, 'Disetujui')" class="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-sm transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>ACC</span>
              </button>
              <button type="button" onclick="responIzinSiswa(${item.rowIndex}, 'Ditolak')" class="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-sm transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                <span>Tolak</span>
              </button>
            </div>
          `;

        return `
          <tr class="hover:bg-slate-50 transition">
            <td class="p-3 text-slate-500 whitespace-nowrap">${item.waktuPengajuan}</td>
            <td class="p-3">
              <div class="font-bold text-slate-800">${item.nama}</div>
              <div class="text-[11px] font-mono text-slate-400">NIS: ${item.nis}</div>
            </td>
            <td class="p-3 font-semibold text-slate-700">${item.status}</td>
            <td class="p-3 font-medium text-slate-800 whitespace-nowrap">${item.tanggalMulai}</td>
            <td class="p-3 text-slate-600 max-w-xs truncate" title="${item.keterangan}">${item.keterangan}</td>
            <td class="p-3 whitespace-nowrap">${linkSurat}</td>
            <td class="p-3 text-center whitespace-nowrap">${badgeStatus}</td>
            <td class="p-3 text-right whitespace-nowrap">${aksiBtn}</td>
          </tr>
        `;
      })
      .join('');
  } catch (err) {
    console.error('Gagal mengambil daftar izin siswa:', err);
  }
}
window.loadVerifikasiIzinGuru = loadVerifikasiIzinGuru;

async function responIzinSiswa(rowIndex, tindakan) {
  const yakin = await konfirmasiModal({
    judul: `Verifikasi Izin: ${tindakan}`,
    pesan: `Tandai permohonan izin ini sebagai status "${tindakan}"?`,
    teksKonfirmasi: `Ya, ${tindakan}`,
    tipe: tindakan === 'Disetujui' ? 'info' : 'danger'
  });

  if (!yakin) return;

  const verifikator = currentGuru ? `${currentGuru.nama} (${currentGuru.role})` : 'Wali Kelas';
  try {
    const res = await fetch('/api/guru/verifikasi-izin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIndex, tindakan, verifikator }),
    });
    const result = await res.json();

    if (result.success) {
      showToast(result.message, 'success');
      loadVerifikasiIzinGuru();
      loadRekapKelas();
    } else {
      showToast(result.message || 'Gagal memproses permohonan izin.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  }
}
window.responIzinSiswa = responIzinSiswa;

// ============================================================================
// 8. KELOLA TUGAS, DAFTAR PENGUMPULAN & PENILAIAN
// ============================================================================

async function submitBuatTugasGuru(e) {
  e.preventDefault();
  const kelas = document.getElementById('buatTugasKelas').value;
  const mapel = document.getElementById('buatTugasMapel').value;
  const judul = document.getElementById('buatTugasJudul').value.trim();
  const deadline = document.getElementById('buatTugasDeadline').value;
  const deskripsi = document.getElementById('buatTugasDeskripsi').value.trim();
  const fileInput = document.getElementById('buatTugasFile')?.files?.[0];
  const activeUser = currentGuru || Auth.getGuru() || {};
  const btn = document.getElementById('btnPublikasiTugas');
  btn.textContent = 'Memublikasikan...';
  btn.disabled = true;

  try {
    let res;
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
      Auth.terapkanAksesRoleGuru(currentGuru);
      muatUlangNotifikasiGuru();
    } else {
      showToast(data.message || data.error || 'Gagal memublikasikan tugas.', 'error');
    }
  } catch {
    showToast('Terjadi kesalahan server saat memublikasikan tugas.', 'error');
  } finally {
    btn.innerHTML = `${ICONS.upload}<span>Publikasikan Tugas ke Siswa</span>`;
    btn.disabled = false;
  }
}

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

    // Siswa Belum Kumpul Tugas
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
            ? `<a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold inline-flex items-center text-xs gap-1 shadow-sm transition">${ICONS.wa}<span>Ingatkan Ortu</span></a>`
            : `<span class="text-slate-400">-</span>`;

          return `
            <tr class="hover:bg-amber-50/40 transition">
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
            <a href="${item.link}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center text-xs gap-1 transition shadow-sm">Buka File ${ICONS.external}</a>
            <button type="button" onclick="openModalNilai(${item.rowIndex}, '${safeNama}', '${safeJudul}', '${item.nilai !== undefined && item.nilai !== null ? item.nilai : ''}', '${safeCatatan}')" class="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center text-xs gap-1 transition border border-indigo-200">
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

function openModalNilai(rowIndex, nama, judul, nilai, catatan) {
  document.getElementById('modalRowIndex').value = rowIndex;
  document.getElementById('modalNamaSiswa').textContent = nama;
  document.getElementById('modalJudulTugas').textContent = judul;
  document.getElementById('inputNilaiAngka').value = nilai;
  document.getElementById('inputCatatanGuru').value = catatan;
  document.getElementById('modalNilai').classList.remove('hidden');
}
window.openModalNilai = openModalNilai;

function closeModalNilai() {
  document.getElementById('modalNilai').classList.add('hidden');
}
window.closeModalNilai = closeModalNilai;

async function simpanNilaiTugas(e) {
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
      muatUlangNotifikasiGuru(); // Otomatis perbarui jumlah tugas yang belum dinilai
    } else {
      showToast(result.message || result.error || 'Gagal menyimpan nilai.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `${ICONS.save}<span>Simpan Nilai</span>`;
    btn.disabled = false;
  }
}

// ============================================================================
// 9. GENERATOR TOKEN REGISTRASI RESMI (ADMIN / KEPALA SEKOLAH)
// ============================================================================

async function submitGenerateToken(e) {
  e.preventDefault();
  const kategoriEl = document.getElementById('tokenTarget') || document.getElementById('tokenKategori');
  const customTokenEl = document.getElementById('customToken') || document.getElementById('customTokenInput');
  const kategori = kategoriEl?.value || 'Guru';
  const customToken = customTokenEl?.value.trim() || '';
  const activeUser = currentGuru || Auth.getGuru() || {};

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
  } catch {
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

// ============================================================================
// 10. EKSPOR DATA KE FORMAT CSV (EXCEL COMPATIBLE)
// ============================================================================

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
      t.nilai !== '' && t.nilai !== undefined && t.nilai !== null ? t.nilai : 'Belum Dinilai',
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

// ============================================================================
// 11. TEMPLATE PENGUMUMAN & PENERBITAN PENGUMUMAN SEKOLAH
// ============================================================================

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

async function submitPengumumanGuru(e) {
  e.preventDefault();
  const target = document.getElementById('p_target')?.value;
  const kategori = document.getElementById('p_kategori')?.value;
  const tglBerakhir = document.getElementById('p_expired')?.value;
  const judul = document.getElementById('p_judul')?.value.trim();
  const isi = document.getElementById('p_isi')?.value.trim();
  const btn = document.getElementById('btnKirimPengumuman');

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
      muatUlangNotifikasiGuru(); // Otomatis refresh daftar notifikasi pengumuman
    } else {
      showToast(result.message || result.error || 'Gagal menerbitkan pengumuman.', 'error');
    }
  } catch {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg><span>Terbitkan Pengumuman</span>`;
    btn.disabled = false;
  }
}
