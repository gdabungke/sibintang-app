/**
 * ============================================================================
 * SIBINTANG - GURU, MATERI PELAJARAN, RBAC & SYSTEM SETTINGS (public/js/guru.js)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.2.0)
 * ============================================================================
 * Mengelola seluruh interaksi pada Portal Guru & Pengelola:
 * - Navigasi 3 Menu Utama Header:
 *   1. QR & Rekap
 *   2. Materi Pelajaran (Daftar Materi Ajar, Log Baca/Akses Siswa, Lanjutkan ke Tugas)
 *   3. Kelola Tugas (Tugas Diterbitkan, Tugas Terkumpul, Belum Mengumpulkan)
 * - Menu Kelola Pengumuman Sekolah ditempatkan di Dropdown Profil Atas
 *   (di atas Generator Token Akun & Setting Sistem) + pintasan di Lonceng Notifikasi
 * - Modal Setting Sistem, Hak Akses Role & Hapus Data (#modalSettingSistem)
 */
(function () {
  'use strict';

  // ==========================================================================
  // 1. DEKLARASI STATE & CACHE DATA MODUL
  // ==========================================================================
  let currentGuru = null;
  let qrGenerator = null;
  let activeTabRekapAbsen = 'belum';
  let activeTabMateriRekap = 'daftar';
  let activeTabTugasRekap = 'terbit';

  const dtStateBelumAbsen = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateSudahAbsen = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateVerifikasiIzin = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateDaftarMateri = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateLogBacaMateri = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateTugasTerbit = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateDaftarTugas = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateBelumTugas = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStatePengumuman = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };

  let cacheRekapAbsen = null;
  let cacheRekapTugasFull = null;
  let cacheBelumAbsen = [];
  let cacheSudahAbsen = [];
  let cacheVerifikasiIzin = [];
  let cacheDaftarMateriGuru = [];
  let cacheLogBacaMateri = [];
  let cacheDaftarTugas = [];
  let cacheDaftarSoalTerbit = [];
  let cacheBelumKumpul = [];
  let cachePengumumanGuru = [];

  // State untuk Modal Setting Sistem & Role
  let workingSettings = null;
  let cacheAdminGuruList = [];
  let cacheAdminSiswaList = [];

  // ==========================================================================
  // 2. INISIALISASI PORTAL & PENDAFTARAN EVENT LISTENER DOM
  // ==========================================================================

  function inisialisasiPortalGuru() {
    const currentSettings = Auth.getSettings();
    const daftarRoleAktif = currentSettings.daftarRole || DAFTAR_ROLE_GURU;

    isiDropdown('regRoleGuru', daftarRoleAktif, 'Pilih Status / Peran (Role)');
    isiDropdown('regKelasBinaan', DAFTAR_KELAS, 'Pilih Kelas Binaan');
    isiDropdown('regMapelAjar', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');
    isiDropdownGrup('tokenTarget', DAFTAR_TARGET_TOKEN);

    isiDropdown('filterKelas', DAFTAR_KELAS, '', { val: 'SEMUA', label: 'Semua Kelas' });
    isiDropdown('filterKelasTugas', DAFTAR_KELAS, '', { val: 'SEMUA', label: 'Semua Kelas' });
    isiDropdown('filterMapelTugas', DAFTAR_MAPEL, '', { val: 'SEMUA', label: 'Semua Mata Pelajaran' });

    isiDropdown('buatMateriKelas', DAFTAR_KELAS, 'Pilih Kelas Sasaran');
    isiDropdown('buatMateriMapel', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');

    isiDropdown('buatTugasKelas', DAFTAR_KELAS, 'Pilih Kelas Sasaran');
    isiDropdown('buatTugasMapel', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');

    isiDropdown('p_target', DAFTAR_TARGET_PENGUMUMAN);
    isiDropdown('p_kategori', DAFTAR_KATEGORI_PENGUMUMAN);
    isiDropdown('p_template', DAFTAR_TEMPLATE_PENGUMUMAN);

    const today = new Date().toISOString().split('T')[0];
    const filterTgl = document.getElementById('filterTanggal');
    if (filterTgl) filterTgl.value = today;

    const nextWeekDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const inputDeadline = document.getElementById('buatTugasDeadline');
    if (inputDeadline && !inputDeadline.value) inputDeadline.value = nextWeekDate;
    const inputExpired = document.getElementById('p_expired');
    if (inputExpired && !inputExpired.value) inputExpired.value = nextWeekDate;

    initEventListeners();

    if (typeof inisialisasiSwipeBottomSheet === 'function') {
      inisialisasiSwipeBottomSheet(
        'bottomSheetNotifGuru',
        'sheetPanelGuru',
        tutupBottomSheetNotifGuru
      );
    }

    Auth.syncSettingsFromServer().then(() => {
      if (currentGuru) {
        Auth.terapkanAksesRoleGuru(currentGuru);
      }
    });

    currentGuru = Auth.getGuru();
    if (currentGuru) {
      bukaDashboardGuru();
    } else {
      updateGuruHeaderUI(false);
    }
  }

  function initEventListeners() {
    document.getElementById('authTabGuruBtn-masuk')?.addEventListener('click', () => switchAuthTab('masuk'));
    document.getElementById('authTabGuruBtn-daftar')?.addEventListener('click', () => switchAuthTab('daftar'));
    document.getElementById('regRoleGuru')?.addEventListener('change', toggleRoleOptions);
    document.getElementById('btnLogoutGuru')?.addEventListener('click', logoutGuru);
    document.getElementById('formMasukGuru')?.addEventListener('submit', prosesMasukGuru);
    document.getElementById('formDaftarGuru')?.addEventListener('submit', prosesDaftarGuru);

    const btnToggle = document.getElementById('btnToggleUserDropdown');
    const dropdownMenu = document.getElementById('userDropdownMenu');
    const chevron = document.getElementById('chevronDropdown');

    btnToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle('hidden');
      chevron?.classList.toggle('rotate-180');
      document.getElementById('popoverNotifGuruDesktop')?.classList.add('hidden');
    });

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

    document.addEventListener('click', (e) => {
      if (dropdownMenu && !dropdownMenu.contains(e.target) && !btnToggle?.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
        chevron?.classList.remove('rotate-180');
      }
      const popoverNotif = document.getElementById('popoverNotifGuruDesktop');
      if (popoverNotif && !popoverNotif.contains(e.target) && !btnNotif?.contains(e.target)) {
        popoverNotif.classList.add('hidden');
      }
      const wrapExpAbsen = document.getElementById('wrapDropdownExportAbsen');
      if (wrapExpAbsen && !wrapExpAbsen.contains(e.target)) {
        document.getElementById('menuExportAbsen')?.classList.add('hidden');
      }
      const wrapExpMateri = document.getElementById('wrapDropdownExportMateri');
      if (wrapExpMateri && !wrapExpMateri.contains(e.target)) {
        document.getElementById('menuExportMateri')?.classList.add('hidden');
      }
      const wrapExpTugas = document.getElementById('wrapDropdownExportTugas');
      if (wrapExpTugas && !wrapExpTugas.contains(e.target)) {
        document.getElementById('menuExportTugas')?.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModalNilai();
        tutupModalQR();
        tutupModalBuatMateri();
        tutupModalBuatTugas();
        tutupModalBuatPengumuman();
        tutupModalKelolaPengumuman();
        tutupModalGeneratorToken();
        tutupModalSettingSistem();
        tutupModalTeksDoaGuru();
        tutupBottomSheetNotifGuru();
      }
    });

    // Tab Navigasi 3 Menu Header (1. absen, 2. materi, 3. tugas)
    ['absen', 'materi', 'tugas'].forEach((tabKey) => {
      document.getElementById(`tabGuruBtn-${tabKey}`)?.addEventListener('click', () => switchGuruTab(tabKey));
      document.getElementById(`tabGuruBtn-${tabKey}-mob`)?.addEventListener('click', () => switchGuruTab(tabKey));
    });

    // Menu 1: Absensi & QR
    document.getElementById('filterKelas')?.addEventListener('change', () => {
      generateQR();
      loadRekapKelas();
      loadVerifikasiIzinGuru();
    });
    document.getElementById('filterTanggal')?.addEventListener('change', updateDashboardAbsen);
    document.getElementById('ketSesi')?.addEventListener('input', generateQR);
    document.getElementById('btnSegarkanRekap')?.addEventListener('click', () => {
      loadRekapKelas();
      loadVerifikasiIzinGuru();
      showToast('Data rekap presensi & izin diperbarui.', 'info');
    });

    // Menu 2: Materi Pelajaran & Log Baca Siswa
    document.getElementById('btnSegarkanMateri')?.addEventListener('click', () => {
      loadRekapMateriGuru();
      showToast('Data materi pelajaran & log baca siswa diperbarui.', 'info');
    });
    document.getElementById('formBuatMateriGuru')?.addEventListener('submit', submitBuatMateriGuru);
    document.getElementById('buatMateriLinkExternal')?.addEventListener('input', () =>
      perbaruiIndikatorLinkInput('buatMateriLinkExternal', 'ikonInputLinkMateri', 'badgeDeteksiLinkMateri')
    );

    // Menu 3: Kelola Tugas & PR
    document.getElementById('btnSegarkanTugas')?.addEventListener('click', () => {
      loadRekapTugas();
      showToast('Data tugas kelas diperbarui.', 'info');
    });
    document.getElementById('btnCloseModalNilai')?.addEventListener('click', closeModalNilai);
    document.getElementById('btnBatalNilai')?.addEventListener('click', closeModalNilai);
    document.getElementById('formNilai')?.addEventListener('submit', simpanNilaiTugas);
    document.getElementById('formBuatTugasGuru')?.addEventListener('submit', submitBuatTugasGuru);
    document.getElementById('buatTugasLinkExternal')?.addEventListener('input', () =>
      perbaruiIndikatorLinkInput('buatTugasLinkExternal', 'ikonInputLinkTugas', 'badgeDeteksiLinkTugas')
    );

    // Modal Pengumuman & Generator Token
    document.getElementById('p_template')?.addEventListener('change', pilihTemplatePengumuman);
    document.getElementById('formPengumuman')?.addEventListener('submit', submitPengumumanGuru);
    document.getElementById('btnRefreshPengumuman')?.addEventListener('click', () => {
      muatUlangRiwayatPengumumanGuru();
      showToast('Daftar pengumuman aktif diperbarui.', 'info');
    });
    document.getElementById('formGenerateTokenModal')?.addEventListener('submit', submitGenerateToken);
    document.getElementById('btnSalinToken')?.addEventListener('click', salinTokenKeClipboard);
  }

  function toggleMenuExport(menuId) {
    const el = document.getElementById(menuId);
    if (!el) return;
    el.classList.toggle('hidden');
  }

  function perbaruiIndikatorLinkInput(inputId, iconBoxId, badgeId) {
    const input = document.getElementById(inputId);
    const iconBox = document.getElementById(iconBoxId);
    const badge = document.getElementById(badgeId);
    if (!input || !iconBox) return;

    const url = (input.value || '').trim();
    if (!url) {
      iconBox.innerHTML = `<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`;
      input.classList.remove('border-rose-400', 'bg-rose-50/30', 'border-indigo-400', 'bg-indigo-50/30');
      if (badge) badge.className = 'hidden';
      return;
    }

    const isYt = typeof getYouTubeId === 'function' && getYouTubeId(url);
    if (isYt) {
      iconBox.innerHTML = ICONS.youtube || '';
      input.classList.add('border-rose-400', 'bg-rose-50/30');
      input.classList.remove('border-indigo-400', 'bg-indigo-50/30');
      if (badge) {
        badge.className =
          'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200';
        badge.innerHTML = `${ICONS.youtube || ''}<span>YouTube Aktif</span>`;
      }
    } else {
      iconBox.innerHTML = ICONS.globe || '';
      input.classList.add('border-indigo-400', 'bg-indigo-50/30');
      input.classList.remove('border-rose-400', 'bg-rose-50/30');
      if (badge) {
        badge.className =
          'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200';
        badge.innerHTML = `${ICONS.globe || ''}<span>Tautan Web Aktif</span>`;
      }
    }
  }

  // ==========================================================================
  // 3. AUTENTIKASI PENGELOLA, MULTI-ROLE SWITCHER & FUNGSI RESET LOGO
  // ==========================================================================

  function resetKeTampilanAwalGuru() {
    closeModalNilai();
    tutupModalQR();
    tutupModalBuatMateri();
    tutupModalBuatTugas();
    tutupModalBuatPengumuman();
    tutupModalKelolaPengumuman();
    tutupModalGeneratorToken();
    tutupModalSettingSistem();
    tutupModalTeksDoaGuru();
    tutupBottomSheetNotifGuru();
    document.getElementById('userDropdownMenu')?.classList.add('hidden');
    document.getElementById('popoverNotifGuruDesktop')?.classList.add('hidden');

    if (currentGuru) {
      [
        dtStateBelumAbsen,
        dtStateSudahAbsen,
        dtStateVerifikasiIzin,
        dtStateDaftarMateri,
        dtStateLogBacaMateri,
        dtStateTugasTerbit,
        dtStateDaftarTugas,
        dtStateBelumTugas,
        dtStatePengumuman,
      ].forEach((st) => {
        st.page = 1;
        st.search = '';
        st.filterKelas = '';
        st.filterMapel = '';
        st.filterStatus = '';
        st.sortBy = 'no_asc';
      });

      Auth.terapkanAksesRoleGuru(currentGuru);
      switchGuruTab('absen');
      switchTabRekapAbsen('belum');
      switchTabMateriRekap('daftar');
      switchTabTugasRekap('terbit');
      updateDashboardAbsen();
      loadRekapMateriGuru();
      loadRekapTugas();
      muatUlangRiwayatPengumumanGuru();
      muatUlangNotifikasiGuru();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Dashboard pengelola disegarkan ke tampilan awal.', 'info');
    } else {
      switchAuthTab('masuk');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function switchAuthTab(type) {
    Auth.switchTabFormAuth(type, {
      formMasukId: 'formMasukGuru',
      formDaftarId: 'formDaftarGuru',
      btnMasukId: 'authTabGuruBtn-masuk',
      btnDaftarId: 'authTabGuruBtn-daftar',
      activeMasukColor: 'bg-blue-600',
    });
  }

  function toggleRoleOptions() {
    const role = document.getElementById('regRoleGuru')?.value || '';
    const divKelas = document.getElementById('divKelasBinaan');
    const divRangkap = document.getElementById('divRangkapGuruKelas');
    const divMapel = document.getElementById('divMapelAjar');

    divKelas?.classList.add('hidden');
    divRangkap?.classList.add('hidden');
    divMapel?.classList.add('hidden');

    if (role === 'Wali Kelas' || role === 'Guru Kelas') {
      divKelas?.classList.remove('hidden');
      if (role === 'Wali Kelas') {
        divRangkap?.classList.remove('hidden');
      }
    } else if (role === 'Guru Mapel' || role === 'Guru Mata Pelajaran') {
      divMapel?.classList.remove('hidden');
    }
  }

  function ubahModePeranAktif(roleBaru) {
    if (!currentGuru) return;
    currentGuru = Auth.switchActiveRole(currentGuru, roleBaru);
    perbaruiLabelHeaderGuru();
    Auth.terapkanAksesRoleGuru(currentGuru);
    renderTabelDaftarMateriGuru();
    renderTabelTugas();
    renderRiwayatTugasGuru(cacheDaftarSoalTerbit);
    document.getElementById('userDropdownMenu')?.classList.add('hidden');
    showToast(`Mode peran aktif diubah menjadi: ${roleBaru}`, 'success');
  }

  async function prosesMasukGuru(e) {
    e.preventDefault();
    const nip = document.getElementById('loginNip').value.trim();
    const btn = document.getElementById('btnSubmitMasukGuru');
    setTombolLoading(btn, true, 'Memverifikasi...');

    try {
      const res = await fetch('/api/guru/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, aksi: 'login' }),
      });
      const result = await res.json();
      if (result.success) {
        currentGuru = result.data;
        currentGuru.activeRole = currentGuru.role || 'Guru Kelas';
        Auth.setGuru(currentGuru);
        showToast(`Selamat datang kembali, ${currentGuru.nama} (${currentGuru.role})`, 'success');
        setTimeout(() => bukaDashboardGuru(), 350);
      } else {
        showToast(result.message || result.error || 'NIP belum terdaftar.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  async function prosesDaftarGuru(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitDaftarGuru');
    setTombolLoading(btn, true, 'Mendaftarkan...');

    const role = document.getElementById('regRoleGuru')?.value || '';
    const mapelAjar = document.getElementById('regMapelAjar')?.value || '-';
    const kelasBinaan = document.getElementById('regKelasBinaan')?.value || '-';
    const merangkapGuruKelas =
      role === 'Wali Kelas' && Boolean(document.getElementById('regRangkapGuruKelas')?.checked);

    if ((role === 'Wali Kelas' || role === 'Guru Kelas') && (!kelasBinaan || kelasBinaan === '-')) {
      showToast('Pilih kelas binaan Anda!', 'error');
      setTombolLoading(btn, false);
      return;
    }

    if (
      (role === 'Guru Mapel' || role === 'Guru Mata Pelajaran') &&
      (!mapelAjar || mapelAjar === '-' || mapelAjar.includes('Pilih'))
    ) {
      showToast('Pilih mata pelajaran yang Anda ampu!', 'error');
      setTombolLoading(btn, false);
      return;
    }

    const payload = {
      nip: document.getElementById('regNip').value.trim(),
      nama: document.getElementById('regNamaGuru').value.trim(),
      role,
      kelasBinaan,
      mapelAjar,
      merangkapGuruKelas,
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
        currentGuru.activeRole = currentGuru.role || 'Guru Kelas';
        Auth.setGuru(currentGuru);
        showToast(`Registrasi berhasil! Selamat datang, ${currentGuru.nama}`, 'success');
        setTimeout(() => bukaDashboardGuru(), 350);
      } else {
        showToast(result.message || result.error || 'Gagal mendaftarkan akun pengelola.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  function updateGuruHeaderUI(isLoggedIn) {
    document.documentElement.setAttribute('data-auth-state', isLoggedIn ? 'authenticated' : 'guest');

    const container = document.getElementById('headerGuruContainer');
    const linkSiswa = document.getElementById('linkPortalSiswa');
    const userDropdown = document.getElementById('userProfileDropdownWrap');
    const notifWrap = document.getElementById('notifWrapGuru');
    const navDesk = document.getElementById('navGuruDesktop');
    const navMob = document.getElementById('navGuruMobile');

    if (isLoggedIn) {
      if (container) container.className = 'w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6';
      if (linkSiswa) {
        const isAdminUser =
          currentGuru && (currentGuru.role === 'Admin' || Auth.getActiveRole(currentGuru) === 'Admin');
        linkSiswa.classList.toggle('hidden', !isAdminUser);
      }
      if (userDropdown) userDropdown.classList.remove('hidden');
      if (notifWrap) notifWrap.classList.remove('hidden');
      if (navDesk)
        navDesk.className =
          'hidden md:flex items-center gap-1 bg-indigo-900/60 p-1 rounded-2xl border border-indigo-800/60 transition-all';
      if (navMob)
        navMob.className = 'grid md:hidden pb-2.5 pt-0.5 grid-cols-3 gap-1.5 border-t border-indigo-900/50';
    } else {
      if (container) container.className = 'w-full max-w-md mx-auto px-4 sm:px-0';
      if (linkSiswa) linkSiswa.classList.remove('hidden');
      if (userDropdown) userDropdown.classList.add('hidden');
      if (notifWrap) notifWrap.classList.add('hidden');
      if (navDesk) navDesk.className = 'hidden';
      if (navMob) navMob.className = 'hidden';
    }

    if (typeof aturTampilanPasangPWA === 'function') {
      aturTampilanPasangPWA(isLoggedIn, 'guruHeaderRight', 'Pengelola');
    }
  }

  function perbaruiLabelHeaderGuru() {
    if (!currentGuru) return;
    const namaGuru = currentGuru.nama || 'Pengelola';
    const activeRole = Auth.getActiveRole(currentGuru);
    let detailRole = `Peran Aktif: ${activeRole}`;
    if (currentGuru.kelasBinaan && currentGuru.kelasBinaan !== '-') {
      detailRole += ` | Kelas: ${currentGuru.kelasBinaan}`;
    }
    if (currentGuru.mapelAjar && currentGuru.mapelAjar !== '-') {
      detailRole += ` | Mapel: ${currentGuru.mapelAjar}`;
    }

    const pillName = document.getElementById('headerUserPillName');
    const pillRole = document.getElementById('headerUserPillRole');
    const initial = document.getElementById('headerAvatarInitial');

    if (pillName) pillName.textContent = namaGuru.split(' ').slice(0, 2).join(' ');
    if (pillRole) pillRole.textContent = activeRole;
    if (initial) initial.textContent = (namaGuru.trim()[0] || 'G').toUpperCase();

    const ddNama = document.getElementById('dropdownNamaLengkap');
    const ddRole = document.getElementById('dropdownPeranDetail');
    if (ddNama) ddNama.textContent = namaGuru;
    if (ddRole) ddRole.textContent = detailRole;
  }

  function bukaDashboardGuru() {
    document.getElementById('loginGuruSection')?.classList.add('hidden');
    document.getElementById('dashboardGuruSection')?.classList.remove('hidden');
    updateGuruHeaderUI(true);
    perbaruiLabelHeaderGuru();

    const selAbsen = document.getElementById('filterKelas');
    if (selAbsen) {
      if (currentGuru?.kelasBinaan && currentGuru.kelasBinaan !== '-') {
        selAbsen.value = currentGuru.kelasBinaan;
      } else {
        selAbsen.value = '1A';
      }
    }

    Auth.terapkanAksesRoleGuru(currentGuru);
    switchGuruTab('absen');
    updateDashboardAbsen();
    loadRekapMateriGuru();
    loadRekapTugas();
    muatUlangRiwayatPengumumanGuru();
    muatUlangNotifikasiGuru();
  }

  async function logoutGuru() {
    const yakin = await konfirmasiModal({
      judul: 'Keluar Portal Guru & Pengelola',
      pesan: 'Apakah Anda yakin ingin mengakhiri sesi dashboard pengelola ini?',
      teksKonfirmasi: 'Ya, Keluar',
      tipe: 'warning',
    });
    if (!yakin) return;

    Auth.logoutGuru();
    currentGuru = null;
    document.getElementById('dashboardGuruSection')?.classList.add('hidden');
    document.getElementById('loginGuruSection')?.classList.remove('hidden');
    updateGuruHeaderUI(false);
  }

  // ==========================================================================
  // 4. NAVIGASI MENU UTAMA (QR & REKAP, MATERI PELAJARAN, KELOLA TUGAS)
  // ==========================================================================
  function switchGuruTab(tab) {
    ['absen', 'materi', 'tugas'].forEach((t) => {
      document.getElementById(`tabGuruContent-${t}`)?.classList.toggle('hidden', t !== tab);

      const btnDesk = document.getElementById(`tabGuruBtn-${t}`);
      const btnMob = document.getElementById(`tabGuruBtn-${t}-mob`);
      const isActive = t === tab;

      if (btnDesk) {
        btnDesk.className = isActive
          ? 'py-1.5 px-3.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer'
          : 'py-1.5 px-3.5 text-xs font-bold rounded-xl text-indigo-200 hover:text-white hover:bg-indigo-800/50 transition flex items-center gap-1.5 cursor-pointer';
      }
      if (btnMob) {
        btnMob.className = isActive
          ? 'py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white shadow-sm transition flex items-center justify-center gap-1 cursor-pointer'
          : 'py-1.5 text-xs font-bold rounded-xl text-indigo-200 bg-indigo-900/60 transition flex items-center justify-center gap-1 cursor-pointer';
      }
    });

    if (tab === 'absen') {
      loadRekapKelas();
      loadVerifikasiIzinGuru();
    } else if (tab === 'materi') {
      loadRekapMateriGuru();
    } else if (tab === 'tugas') {
      loadRekapTugas();
    }
  }

  function switchTabRekapAbsen(mode) {
    activeTabRekapAbsen = mode;
    document.getElementById('boxTabelBelumAbsenWrap')?.classList.toggle('hidden', mode !== 'belum');
    document.getElementById('boxTabelSudahAbsenWrap')?.classList.toggle('hidden', mode !== 'sudah');
    document.getElementById('boxTabelVerifikasiIzinWrap')?.classList.toggle('hidden', mode !== 'izin');

    terapkanGayaTab(
      {
        belum: 'tabAbsenBtn-belum',
        sudah: 'tabAbsenBtn-sudah',
        izin: 'tabAbsenBtn-izin',
      },
      mode
    );

    if (mode === 'belum') renderTabelBelumAbsen();
    else if (mode === 'sudah') renderTabelSudahAbsen();
    else if (mode === 'izin') loadVerifikasiIzinGuru();
  }

  function switchTabMateriRekap(sub) {
    activeTabMateriRekap = sub;
    document.getElementById('boxTabelMateriAjarWrap')?.classList.toggle('hidden', sub !== 'daftar');
    document.getElementById('boxTabelLogBacaMateriWrap')?.classList.toggle('hidden', sub !== 'log');

    terapkanGayaTab(
      {
        daftar: 'tabMateriRekapBtn-daftar',
        log: 'tabMateriRekapBtn-log',
      },
      sub
    );

    if (sub === 'daftar') renderTabelDaftarMateriGuru();
    else renderTabelLogBacaMateri();
  }

  function switchTabTugasRekap(sub) {
    activeTabTugasRekap = sub;
    document.getElementById('boxTabelTugasDiterbitkanWrap')?.classList.toggle('hidden', sub !== 'terbit');
    document.getElementById('boxTabelDaftarTugasWrap')?.classList.toggle('hidden', sub !== 'terkumpul');
    document.getElementById('boxTabelBelumTugasWrap')?.classList.toggle('hidden', sub !== 'belum');

    terapkanGayaTab(
      {
        terbit: 'tabTugasRekapBtn-terbit',
        terkumpul: 'tabTugasRekapBtn-terkumpul',
        belum: 'tabTugasRekapBtn-belum',
      },
      sub
    );

    if (sub === 'terbit') renderRiwayatTugasGuru(cacheDaftarSoalTerbit);
    else if (sub === 'terkumpul') renderTabelTugas();
    else if (sub === 'belum') renderTabelBelumTugas();
  }

  // ==========================================================================
  // 5. GENERATOR QR CODE (DI MODAL), REKAP PRESENSI & VERIFIKASI SURAT IZIN
  // ==========================================================================
  function updateDashboardAbsen() {
    generateQR();
    loadRekapKelas();
    loadVerifikasiIzinGuru();
  }

  function dapatkanKelasTargetAbsen() {
    if (
      currentGuru &&
      !Auth.hasPermission(currentGuru, 'canAksesSemuaKelas') &&
      currentGuru.kelasBinaan &&
      currentGuru.kelasBinaan !== '-'
    ) {
      return currentGuru.kelasBinaan;
    }
    const valModal = document.getElementById('filterKelas')?.value;
    return valModal || currentGuru?.kelasBinaan || '1A';
  }

  function generateQR() {
    const rawKelas = dapatkanKelasTargetAbsen();
    const kelasQR = rawKelas === 'SEMUA' ? '1A' : rawKelas;
    const tanggal = document.getElementById('filterTanggal')?.value || new Date().toISOString().split('T')[0];
    const sesi = document.getElementById('ketSesi')?.value.trim() || 'Absen Pagi';
    const qrDataString = `ABSEN-SIBINTANG|${kelasQR}|${tanggal}|${sesi}`;

    const titleEl = document.getElementById('qrTitleKelas');
    const subEl = document.getElementById('qrSubTanggal');
    const payloadEl = document.getElementById('qrPayloadText');

    if (titleEl) titleEl.textContent = `QR Absensi Kelas ${kelasQR}`;
    if (subEl) subEl.textContent = `Tanggal: ${tanggal} (${sesi})`;
    if (payloadEl) {
      payloadEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/80 shadow-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sesi: ${escapeHtml(sesi)} &bull; Kelas ${escapeHtml(kelasQR)}</span>
        </span>
      `;
    }

    const container = document.getElementById('qrcodeContainer');
    if (!container || typeof QRCode === 'undefined') return;
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
      imgLogo.src = '/icon.png';
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
        ctx.arc(center, center, logoSize / 2 + 4, 0, Math.PI * 2);
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

  async function loadRekapKelas() {
    const canAll = currentGuru && Auth.hasPermission(currentGuru, 'canAksesSemuaKelas');
    const kelas = canAll ? 'SEMUA' : dapatkanKelasTargetAbsen();
    const tanggal = document.getElementById('filterTanggal')?.value || new Date().toISOString().split('T')[0];

    animasiPutarIkon('iconRefreshRekapGuru');
    try {
      const res = await fetch(
        `/api/guru/rekap?kelas=${encodeURIComponent(kelas)}&tanggal=${encodeURIComponent(tanggal)}`
      );
      const data = await res.json();
      if (!data.success) return;

      const badgeBelum = document.getElementById('badgeBelum');
      const badgeHadir = document.getElementById('badgeHadir');
      const badgeIzin = document.getElementById('badgeIzinMenunggu');

      if (badgeBelum) badgeBelum.textContent = data.belumAbsen?.length || 0;
      if (badgeHadir) badgeHadir.textContent = data.sudahAbsen?.length || 0;
      if (badgeIzin && Array.isArray(data.izinMenunggu)) {
        badgeIzin.textContent = data.izinMenunggu.length;
      }

      cacheRekapAbsen = data;
      cacheBelumAbsen = data.belumAbsen || [];
      cacheSudahAbsen = data.sudahAbsen || [];

      dtStateBelumAbsen.page = 1;
      renderTabelBelumAbsen();

      dtStateSudahAbsen.page = 1;
      renderTabelSudahAbsen();
    } catch (err) {
      console.error('[SiBintang] Gagal mengambil rekap absen:', err);
    }
  }

  async function loadVerifikasiIzinGuru() {
    const canAll = currentGuru && Auth.hasPermission(currentGuru, 'canAksesSemuaKelas');
    const kelas = canAll ? 'SEMUA' : dapatkanKelasTargetAbsen();
    const tanggal = document.getElementById('filterTanggal')?.value || new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(
        `/api/guru/verifikasi-izin?kelas=${encodeURIComponent(kelas)}&tanggal=${encodeURIComponent(tanggal)}`
      );
      const data = await res.json();
      if (data.success) {
        cacheVerifikasiIzin = data.daftarIzin || [];
        const jumlahMenunggu = cacheVerifikasiIzin.filter(
          (item) => (item.statusVerifikasi || 'Menunggu') === 'Menunggu'
        ).length;
        const badgeIzin = document.getElementById('badgeIzinMenunggu');
        if (badgeIzin) badgeIzin.textContent = jumlahMenunggu;

        dtStateVerifikasiIzin.page = 1;
        renderTabelVerifikasiIzin();
      }
    } catch (err) {
      console.error('[SiBintang] Gagal memuat data izin:', err);
    }
  }

  function renderTabelBelumAbsen() {
    const tanggal = document.getElementById('filterTanggal')?.value || '';
    buatDataTables({
      data: cacheBelumAbsen,
      state: dtStateBelumAbsen,
      containerId: 'boxTabelBelumAbsenWrap',
      tbodyId: 'tbodyBelumAbsen',
      colSpan: 7,
      emptyMessage: 'Seluruh siswa di kelas ini sudah melakukan presensi hari ini.',
      searchPlaceholder: 'Cari No, NIS, nama siswa, atau orang tua...',
      renderRow: (s, index, bgRowClass) => {
        const waBtn = buatTautanWA(
          s.nohp,
          `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa ananda ${s.nama} (Kelas ${s.kelas}) belum tercatat melakukan scan absensi pada tanggal ${tanggal}. Terima kasih.`,
          'Hubungi Ortu',
          'bg-emerald-600 hover:bg-emerald-700'
        );

        return `
          <tr class="${bgRowClass} hover:bg-rose-50/40 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-mono text-slate-600">${escapeHtml(s.nis)}</td>
            <td class="p-3 font-bold text-slate-800">${escapeHtml(s.nama)}</td>
            <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-xs">${escapeHtml(s.kelas)}</span></td>
            <td class="p-3">${escapeHtml(s.jk)}</td>
            <td class="p-3">${escapeHtml(s.ortu)}</td>
            <td class="p-3 text-right">${waBtn}</td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelBelumAbsen(),
    });
  }

  function renderTabelSudahAbsen() {
    buatDataTables({
      data: cacheSudahAbsen,
      state: dtStateSudahAbsen,
      containerId: 'boxTabelSudahAbsenWrap',
      tbodyId: 'tbodySudahAbsen',
      colSpan: 6,
      emptyMessage: 'Belum ada siswa yang melakukan scan presensi pada tanggal ini.',
      searchPlaceholder: 'Cari No, NIS, atau nama siswa hadir...',
      renderRow: (s, index, bgRowClass) => {
        let badgeCls = 'bg-emerald-100 text-emerald-700';
        if (s.status === 'Izin') badgeCls = 'bg-amber-100 text-amber-800';
        if (s.status === 'Sakit') badgeCls = 'bg-rose-100 text-rose-800';

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-medium text-slate-600">${escapeHtml(s.waktuAbsen)}</td>
            <td class="p-3 font-mono text-slate-500">${escapeHtml(s.nis)}</td>
            <td class="p-3 font-bold text-slate-800">${escapeHtml(s.nama)}</td>
            <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-xs">${escapeHtml(s.kelas)}</span></td>
            <td class="p-3"><span class="${badgeCls} px-2.5 py-0.5 rounded-full font-bold text-[10px]">✓ ${escapeHtml(s.status)}</span></td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelSudahAbsen(),
    });
  }

  function renderTabelVerifikasiIzin() {
    const canVerif = !currentGuru || Auth.hasPermission(currentGuru, 'canVerifikasiIzin');

    buatDataTables({
      data: cacheVerifikasiIzin,
      state: dtStateVerifikasiIzin,
      containerId: 'boxTabelVerifikasiIzinWrap',
      tbodyId: 'tbodyVerifikasiIzin',
      colSpan: 9,
      emptyMessage: 'Tidak ada permohonan izin atau sakit untuk kelas ini.',
      searchPlaceholder: 'Cari No, NIS, nama siswa, atau keterangan...',
      renderRow: (item, index, bgRowClass) => {
        const linkSurat =
          item.link && item.link !== '-' && item.link !== '#'
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center text-[11px] gap-1 transition">${ICONS.fileDoc || ''}<span>Berkas</span>${ICONS.external}</a>`
            : `<span class="text-slate-400 italic">Tanpa Berkas</span>`;

        let badgeStatus = `<span class="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Menunggu</span>`;
        if (item.statusVerifikasi === 'Disetujui') {
          badgeStatus = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">✓ Disetujui</span>`;
        } else if (item.statusVerifikasi === 'Ditolak') {
          badgeStatus = `<span class="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">✕ Ditolak</span>`;
        }

        let aksiBtn = '';
        if (item.statusVerifikasi === 'Disetujui' || item.statusVerifikasi === 'Ditolak') {
          aksiBtn = `<span class="text-[11px] text-slate-400 font-medium">Oleh: ${escapeHtml(item.verifikator || '-')}</span>`;
        } else if (!canVerif) {
          aksiBtn = `<span class="text-[11px] text-slate-400 italic">Mode Monitoring</span>`;
        } else {
          aksiBtn = `
            <div class="inline-flex items-center gap-1.5">
              <button type="button" onclick="responIzinSiswa(${item.rowIndex}, 'Disetujui')" class="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow-sm transition">ACC</button>
              <button type="button" onclick="responIzinSiswa(${item.rowIndex}, 'Ditolak')" class="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow-sm transition">Tolak</button>
            </div>
          `;
        }

        const teksTanggal =
          typeof formatRentangTanggalIndo === 'function' && /^\d{4}-\d{2}-\d{2}$/.test(item.tanggalMulai || '')
            ? formatRentangTanggalIndo(item.tanggalMulai)
            : item.tanggalMulai;

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 text-slate-500 whitespace-nowrap">${escapeHtml(item.waktuPengajuan)}</td>
            <td class="p-3"><div class="font-bold text-slate-800">${escapeHtml(item.nama)}</div><div class="text-[11px] font-mono text-slate-400">NIS: ${escapeHtml(item.nis)} • Kelas ${escapeHtml(item.kelas)}</div></td>
            <td class="p-3 font-semibold text-slate-700">${escapeHtml(item.status)}</td>
            <td class="p-3 font-medium text-slate-800 whitespace-nowrap">${escapeHtml(teksTanggal)}</td>
            <td class="p-3 text-slate-600 max-w-xs truncate" title="${escapeHtml(item.keterangan)}">${escapeHtml(item.keterangan)}</td>
            <td class="p-3 whitespace-nowrap">${linkSurat}</td>
            <td class="p-3 text-center whitespace-nowrap">${badgeStatus}</td>
            <td class="p-3 text-right whitespace-nowrap">${aksiBtn}</td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelVerifikasiIzin(),
    });
  }

  async function responIzinSiswa(rowIndex, tindakan) {
    const yakin = await konfirmasiModal({
      judul: `Verifikasi Izin: ${tindakan}`,
      pesan: `Tandai permohonan izin ini sebagai status "${tindakan}"?`,
      teksKonfirmasi: `Ya, ${tindakan}`,
      tipe: tindakan === 'Disetujui' ? 'info' : 'danger',
    });
    if (!yakin) return;

    const activeRole = Auth.getActiveRole(currentGuru);
    const verifikator = currentGuru ? `${currentGuru.nama} (${activeRole})` : 'Wali Kelas';
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

  // ==========================================================================
  // 5B. MENU MATERI PELAJARAN, LOG BACA SISWA & PINTASAN "JADIKAN TUGAS"
  // ==========================================================================
  async function loadRekapMateriGuru() {
    const canAllKelas = currentGuru && Auth.hasPermission(currentGuru, 'canAksesSemuaKelas');
    const rawKelas = dapatkanKelasTargetAbsen();
    // Jika kelas wali belum diset ('-' atau kosong), muat SEMUA kelas agar materi yang baru dibuat tetap tampil
    const kelas = canAllKelas || !rawKelas || rawKelas === '-' ? 'SEMUA' : rawKelas;

    const activeRole = Auth.getActiveRole(currentGuru);
    const mapel =
      (activeRole === 'Guru Mapel' || activeRole === 'Guru Mata Pelajaran') &&
      currentGuru?.mapelAjar &&
      currentGuru.mapelAjar !== '-'
        ? currentGuru.mapelAjar
        : 'SEMUA';

    animasiPutarIkon('iconRefreshMateriGuru');
    try {
      const res = await fetch(
        `/api/materi?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`
      );
      const data = await res.json();
      if (!data.success) return;

      cacheDaftarMateriGuru = Array.isArray(data.daftarMateri) ? data.daftarMateri : [];
      // cacheLogBacaMateri (rekap status baca per siswa) untuk tabel Log Baca / Akses Siswa
      cacheLogBacaMateri = Array.isArray(data.logAksesSiswa)
        ? data.logAksesSiswa
        : Array.isArray(data.logBaca)
          ? data.logBaca
          : [];

      const bTotal = document.getElementById('badgeTotalMateriGuru');
      const bBelumBaca = document.getElementById('badgeBelumBacaMateri');
      if (bTotal) bTotal.textContent = String(cacheDaftarMateriGuru.length);
      if (bBelumBaca) {
        const jmlBelum = cacheLogBacaMateri.filter(
          (s) => (s.statusBaca || '').toLowerCase().includes('belum')
        ).length;
        bBelumBaca.textContent = String(jmlBelum);
      }

      dtStateDaftarMateri.page = 1;
      renderTabelDaftarMateriGuru();

      dtStateLogBacaMateri.page = 1;
      renderTabelLogBacaMateri();
    } catch (err) {
      console.error('[SiBintang] Gagal memuat materi pelajaran:', err);
    }
  }

  function renderTabelDaftarMateriGuru() {
    const canBuatMateri =
      !currentGuru ||
      Auth.hasPermission(currentGuru, 'canBuatMateri') ||
      Auth.hasPermission(currentGuru, 'canBuatTugas');
    const canBuatTugas = !currentGuru || Auth.hasPermission(currentGuru, 'canBuatTugas');

    buatDataTables({
      data: cacheDaftarMateriGuru,
      state: dtStateDaftarMateri,
      containerId: 'boxTabelMateriAjarWrap',
      tbodyId: 'tbodyDaftarMateriGuru',
      colSpan: 7,
      emptyMessage: 'Belum ada materi pelajaran atau modul yang diterbitkan.',
      searchPlaceholder: 'Cari No, kelas, mata pelajaran, bab, atau judul materi...',
      renderRow: (m, index, bgRowClass) => {
        const fileBtn =
          m.linkFile && m.linkFile !== '-' && m.linkFile !== '#'
            ? `<a href="${m.linkFile}" target="_blank" rel="noopener noreferrer" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-[11px] transition shadow-xs">${ICONS.fileDoc || ''}<span>Modul Drive</span>${ICONS.external}</a>`
            : '';

        const urlVideo = m.linkExternal || '';
        const isYt = typeof getYouTubeId === 'function' && getYouTubeId(urlVideo);
        let linkExtBtn = '';
        if (urlVideo && urlVideo !== '-' && urlVideo !== '#') {
          if (isYt) {
            linkExtBtn = `<a href="${urlVideo}" target="_blank" rel="noopener noreferrer" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-[11px] transition shadow-xs">${ICONS.youtube || ''}<span>YouTube</span>${ICONS.external}</a>`;
          } else {
            linkExtBtn = `<a href="${urlVideo}" target="_blank" rel="noopener noreferrer" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-[11px] transition shadow-xs">${ICONS.globe || ''}<span>Tautan Web</span>${ICONS.external}</a>`;
          }
        }

        const mediaFallback =
          !fileBtn && !linkExtBtn
            ? `<span class="text-slate-400 text-[11px]">Catatan Teks</span>`
            : '';

        // PERBAIKAN BUG: Konversi m.id dan m.judul ke String terlebih dahulu sebelum .replace()
        const safeId = String(m.id ?? m.rowIndex ?? '').replace(/'/g, "\\'");
        const safeJudul = String(m.judul ?? '').replace(/'/g, "\\'");

        const btnJadikanTugas = canBuatTugas
          ? `<button type="button" onclick="lanjutkanMateriKeTugas('${safeId}')" title="Buat latihan/tugas dari materi ini" class="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition">
               <span>Jadikan Tugas</span>
             </button>`
          : `<span class="text-[11px] text-slate-400 italic">Monitoring</span>`;

        const btnHapus = canBuatMateri
          ? `<button type="button" onclick="hapusMateriGuru('${safeId}', '${safeJudul}')" title="Hapus materi" class="cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-xl text-[11px] font-bold inline-flex items-center transition">
               ${ICONS.trash || '✕'}
             </button>`
          : '';

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 text-slate-500 whitespace-nowrap text-xs">${escapeHtml(m.waktu || '-')}</td>
            <td class="p-3"><span class="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs">${escapeHtml(m.kelas || '-')}</span></td>
            <td class="p-3">
              <div class="font-bold text-indigo-700 text-xs">${escapeHtml(m.mapel || '-')}</div>
              <div class="text-[11px] text-slate-500 font-medium">${escapeHtml(m.bab || '-')}</div>
            </td>
            <td class="p-3 max-w-xs">
              <div class="font-bold text-slate-800 text-xs truncate" title="${escapeHtml(m.judul || '-')}">${escapeHtml(m.judul || '-')}</div>
              <div class="text-[11px] text-slate-500 truncate" title="${escapeHtml(m.ringkasan || '-')}">${escapeHtml(m.ringkasan || '-')}</div>
            </td>
            <td class="p-3 whitespace-nowrap"><div class="inline-flex items-center gap-1.5 flex-wrap">${fileBtn}${linkExtBtn}${mediaFallback}</div></td>
            <td class="p-3 text-right whitespace-nowrap"><div class="inline-flex items-center justify-end gap-1.5">${btnJadikanTugas}${btnHapus}</div></td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelDaftarMateriGuru(),
    });
  }

  function renderTabelLogBacaMateri() {
    buatDataTables({
      data: cacheLogBacaMateri,
      state: dtStateLogBacaMateri,
      containerId: 'boxTabelLogBacaMateriWrap',
      tbodyId: 'tbodyLogBacaMateri',
      colSpan: 7,
      emptyMessage: 'Belum ada data log baca siswa untuk kelas ini.',
      searchPlaceholder: 'Cari No, NIS, nama siswa, atau status baca...',
      renderRow: (s, index, bgRowClass) => {
        const sudahBaca = !(s.statusBaca || '').toLowerCase().includes('belum');
        const badgeStatus = sudahBaca
          ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">✓ Sudah Dipelajari</span>`
          : `<span class="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">Belum Membaca</span>`;

        const actionWa = sudahBaca
          ? `<span class="text-[11px] text-emerald-700 font-semibold">Aktif Belajar</span>`
          : buatTautanWA(
              s.nohp,
              `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa terdapat materi pelajaran baru di Portal Siswa SiBintang untuk Kelas ${s.kelas}. Mohon mendampingi ananda ${s.nama} untuk membaca/mempelajari materi tersebut. Terima kasih.`,
              'Ingatkan Ortu',
              'bg-amber-600 hover:bg-amber-700'
            );

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-mono text-slate-600">${escapeHtml(s.nis)}</td>
            <td class="p-3 font-bold text-slate-800">${escapeHtml(s.nama)}</td>
            <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-xs">${escapeHtml(s.kelas)}</span></td>
            <td class="p-3 whitespace-nowrap">${badgeStatus}</td>
            <td class="p-3">
              <div class="font-semibold text-slate-700 text-xs truncate max-w-[220px]" title="${escapeHtml(s.materiTerakhir || '-')}">${escapeHtml(s.materiTerakhir || '-')}</div>
              <div class="text-[10px] text-slate-400 font-mono">${escapeHtml(s.waktuTerakhir || s.waktuBaca || s.waktu || '-')}</div></td>
            <td class="p-3 text-right whitespace-nowrap">${actionWa}</td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelLogBacaMateri(),
    });
  }

  async function submitBuatMateriGuru(e) {
    e.preventDefault();
    if (
      currentGuru &&
      !Auth.hasPermission(currentGuru, 'canBuatMateri') &&
      !Auth.hasPermission(currentGuru, 'canBuatTugas')
    ) {
      showToast('Peran Anda saat ini hanya untuk monitoring dan tidak dapat menerbitkan materi.', 'warning');
      return;
    }

    const kelas = document.getElementById('buatMateriKelas').value;
    const mapel = document.getElementById('buatMateriMapel').value;
    const bab = document.getElementById('buatMateriBab')?.value.trim() || 'Materi Umum';
    const judul = document.getElementById('buatMateriJudul').value.trim();
    const ringkasan = document.getElementById('buatMateriRingkasan').value.trim();
    const linkExternal = document.getElementById('buatMateriLinkExternal')?.value.trim() || '';
    const fileInput = document.getElementById('buatMateriFile')?.files?.[0];
    const activeUser = currentGuru || Auth.getGuru() || {};

    const btn = document.getElementById('btnPublikasiMateri');
    setTombolLoading(btn, true, 'Memproses modul...');

    try {
      let linkFile = '-';
      if (fileInput) {
        showToast('Mengunggah modul materi ke Google Drive...', 'info');
        setTombolLoading(btn, true, 'Mengunggah ke Drive...');
        const cleanMapel = (mapel || 'Materi').replace(/\s+/g, '_');
        const cleanKelas = (kelas || 'Umum').replace(/\s+/g, '_');
        const timestamp = Math.floor(Date.now() / 1000);
        const namaFileKustom = `Materi_${cleanMapel}_${timestamp}`;
        const namaSubFolder = `Materi_${cleanKelas}_${cleanMapel}`;
        linkFile = await uploadFileKeDrivePribadi(fileInput, namaFileKustom, namaSubFolder);
      }

      setTombolLoading(btn, true, 'Memublikasikan materi...');
      const res = await fetch('/api/guru/materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelas,
          mapel,
          bab,
          judul,
          ringkasan,
          linkExternal,
          linkFile,
          pembuat: activeUser.nama || 'Guru',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Materi pelajaran baru berhasil diterbitkan ke siswa!', 'success');
        document.getElementById('formBuatMateriGuru').reset();
        perbaruiIndikatorLinkInput('buatMateriLinkExternal', 'ikonInputLinkMateri', 'badgeDeteksiLinkMateri');
        Auth.terapkanAksesRoleGuru(currentGuru);
        tutupModalBuatMateri();
        switchTabMateriRekap('daftar');
        loadRekapMateriGuru();
      } else {
        showToast(data.message || 'Gagal menerbitkan materi pelajaran.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan saat menerbitkan materi.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  /**
   * Pintasan Cerdas: Mengonversi Materi Ajar menjadi Form Buat Tugas Baru
   */
  function lanjutkanMateriKeTugas(idMateri) {
    const item = cacheDaftarMateriGuru.find((m) => String(m.id) === String(idMateri));
    if (!item) return;

    if (currentGuru && !Auth.hasPermission(currentGuru, 'canBuatTugas')) {
      showToast('Ubah mode peran ke Guru Kelas untuk membuat tugas dari materi ini.', 'warning');
      return;
    }

    bukaModalBuatTugas();

    const selKelas = document.getElementById('buatTugasKelas');
    const selMapel = document.getElementById('buatTugasMapel');
    const inpMateri = document.getElementById('buatTugasMateri');
    const inpJudul = document.getElementById('buatTugasJudul');
    const inpLink = document.getElementById('buatTugasLinkExternal');
    const inpDesk = document.getElementById('buatTugasDeskripsi');

    if (selKelas && item.kelas && item.kelas !== 'SEMUA') selKelas.value = item.kelas;
    if (selMapel && item.mapel) selMapel.value = item.mapel;
    if (inpMateri) inpMateri.value = item.bab || 'Materi Umum';
    if (inpJudul) inpJudul.value = `Latihan: ${item.judul}`;
    if (inpLink) inpLink.value = item.linkExternal || '';
    if (inpDesk) {
      inpDesk.value = `Pelajari materi "${item.judul}" (${item.bab || 'Materi Kelas'}), kemudian kerjakan latihan yang diberikan dan unggah hasilnya ke Google Drive.`;
    }
    perbaruiIndikatorLinkInput('buatTugasLinkExternal', 'ikonInputLinkTugas', 'badgeDeteksiLinkTugas');
    showToast('Form Buat Tugas telah diisi otomatis dari Materi Pelajaran!', 'info');
  }

  async function hapusMateriGuru(idMateri, judul) {
    const yakin = await konfirmasiModal({
      judul: 'Hapus Materi Pelajaran?',
      pesan: `Materi "${judul}" akan dihapus dari daftar materi kelas. Lanjutkan?`,
      teksKonfirmasi: 'Ya, Hapus Materi',
      tipe: 'danger',
    });
    if (!yakin) return;

    try {
      const res = await fetch(`/api/guru/materi/${encodeURIComponent(idMateri)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Materi berhasil dihapus.', 'success');
        loadRekapMateriGuru();
      } else {
        showToast(data.message || 'Gagal menghapus materi.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    }
  }

  // ==========================================================================
  // 6. PUBLIKASI TUGAS, REKAP & PENILAIAN TUGAS SISWA (SESUAI HAK AKSES ROLE)
  // ==========================================================================
  async function submitBuatTugasGuru(e) {
    e.preventDefault();
    if (currentGuru && !Auth.hasPermission(currentGuru, 'canBuatTugas')) {
      showToast('Peran Anda saat ini tidak memiliki akses untuk menerbitkan tugas.', 'error');
      return;
    }

    const kelas = document.getElementById('buatTugasKelas').value;
    const mapel = document.getElementById('buatTugasMapel').value;
    const materi = document.getElementById('buatTugasMateri')?.value.trim() || 'Materi Umum';
    const judul = document.getElementById('buatTugasJudul').value.trim();
    const deadline = document.getElementById('buatTugasDeadline').value;
    const deskripsi = document.getElementById('buatTugasDeskripsi').value.trim();
    const linkExternal = document.getElementById('buatTugasLinkExternal')?.value.trim() || '';
    const fileInput = document.getElementById('buatTugasFile')?.files?.[0];
    const activeUser = currentGuru || Auth.getGuru() || {};

    const btn = document.getElementById('btnPublikasiTugas');
    setTombolLoading(btn, true, 'Memproses berkas...');

    try {
      let linkSoal = '-';
      if (fileInput) {
        showToast('Mengunggah berkas soal ke Google Drive...', 'info');
        setTombolLoading(btn, true, 'Mengunggah ke Drive...');
        const cleanMapel = (mapel || 'Materi').replace(/\s+/g, '_');
        const cleanKelas = (kelas || 'Umum').replace(/\s+/g, '_');
        const timestamp = Math.floor(Date.now() / 1000);
        const namaFileKustom = `Tugas_${cleanMapel}_${timestamp}`;
        const namaSubFolder = `Soal_${cleanKelas}_${cleanMapel}`;
        linkSoal = await uploadFileKeDrivePribadi(fileInput, namaFileKustom, namaSubFolder);
      }

      setTombolLoading(btn, true, 'Memublikasikan tugas...');
      const res = await fetch('/api/guru/buat-tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelas,
          mapel,
          materi,
          judul,
          deadline,
          deskripsi,
          linkMateri: linkExternal,
          linkExternal,
          pembuat: activeUser.nama || 'Guru',
          linkSoal,
          link: linkSoal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Tugas baru berhasil dipublikasikan ke siswa!', 'success');
        document.getElementById('formBuatTugasGuru').reset();
        perbaruiIndikatorLinkInput('buatTugasLinkExternal', 'ikonInputLinkTugas', 'badgeDeteksiLinkTugas');
        Auth.terapkanAksesRoleGuru(currentGuru);
        tutupModalBuatTugas();
        switchGuruTab('tugas');
        switchTabTugasRekap('terbit');
        muatUlangNotifikasiGuru();
        loadRekapTugas();
      } else {
        showToast(data.message || data.error || 'Gagal memublikasikan tugas.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan saat memublikasikan tugas.', 'error');
    } finally {
      setTombolLoading(btn, false, '', `${ICONS.upload}<span>Publikasikan Tugas</span>`);
    }
  }

  async function loadRekapTugas() {
    // Pastikan objek Auth aman
    const authObj = typeof Auth !== 'undefined' ? Auth : window.Auth || {};
    const canAllKelas = currentGuru && typeof authObj.hasPermission === 'function' && authObj.hasPermission(currentGuru, 'canAksesSemuaKelas');
    const kelas = canAllKelas ? 'SEMUA' : (typeof dapatkanKelasTargetAbsen === 'function' ? dapatkanKelasTargetAbsen() : 'SEMUA');
    
    // Deklarasi aman untuk activeRole agar tidak terjadi ReferenceError
    let activeRole = 'Guru Kelas';
    try {
      if (typeof authObj.getActiveRole === 'function' && currentGuru) {
        activeRole = authObj.getActiveRole(currentGuru);
      } else if (currentGuru?.role) {
        activeRole = currentGuru.role;
      }
    } catch {
      activeRole = currentGuru?.role || 'Guru Kelas';
    }

    const mapel =
      (activeRole === 'Guru Mapel' || activeRole === 'Guru Mata Pelajaran') &&
      currentGuru?.mapelAjar &&
      currentGuru.mapelAjar !== '-'
        ? currentGuru.mapelAjar
        : 'SEMUA';

    animasiPutarIkon('iconRefreshTugasGuru');
    try {
      const res = await fetch(
        `/api/guru/tugas?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`
      );
      const data = await res.json();
      if (!data.success) return;

      cacheRekapTugasFull = data;
      cacheDaftarTugas = data.daftarTugas || [];
      cacheDaftarSoalTerbit = data.daftarSoal || data.bankSoal || data.soalTerbit || [];
      cacheBelumKumpul = data.belumKumpul || [];

      const bTotal = document.getElementById('badgeTotalTugasGuru');
      const bJml = document.getElementById('badgeJumlahTugas');
      const bBelum = document.getElementById('badgeBelumTugas');
      if (bTotal) bTotal.textContent = cacheDaftarSoalTerbit.length;
      if (bJml) bJml.textContent = cacheDaftarTugas.length;
      if (bBelum) bBelum.textContent = cacheBelumKumpul.length;

      dtStateTugasTerbit.page = 1;
      renderRiwayatTugasGuru(cacheDaftarSoalTerbit);

      dtStateDaftarTugas.page = 1;
      renderTabelTugas();

      dtStateBelumTugas.page = 1;
      renderTabelBelumTugas();
    } catch (err) {
      console.error('[SiBintang] Gagal mengambil data tugas:', err);
    }
  }

  function renderRiwayatTugasGuru(daftarSoal) {
    if (daftarSoal) cacheDaftarSoalTerbit = daftarSoal;
    const badge = document.getElementById('badgeTotalTugasGuru');
    if (badge) badge.textContent = cacheDaftarSoalTerbit.length;

    buatDataTables({
      data: cacheDaftarSoalTerbit,
      state: dtStateTugasTerbit,
      containerId: 'boxTabelTugasDiterbitkanWrap',
      tbodyId: 'tbodyRiwayatTugasDiterbitkan',
      colSpan: 6,
      emptyMessage: 'Belum ada soal atau materi tugas yang diterbitkan.',
      searchPlaceholder: 'Cari No, kelas, mata pelajaran, atau judul...',
      renderRow: (t, index, bgRowClass) => {
        const linkFileSoal = t.linkSoal || t.link || '';
        const fileLinkBtn =
          linkFileSoal && linkFileSoal !== '-' && linkFileSoal !== '#'
            ? `<a href="${linkFileSoal}" target="_blank" rel="noopener noreferrer" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-[11px] transition shadow-xs">${ICONS.fileDoc || ''}<span>Berkas Soal</span>${ICONS.external}</a>`
            : '';

        const urlVideo = t.linkMateri || t.linkExternal || t.linkYoutube || t.video || '';
        const isYt = typeof getYouTubeId === 'function' && getYouTubeId(urlVideo);

        let linkMateriBtn = '';
        if (urlVideo && urlVideo !== '-' && urlVideo !== '#') {
          if (isYt) {
            linkMateriBtn = `<a href="${urlVideo}" target="_blank" rel="noopener noreferrer" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-[11px] transition shadow-xs">${ICONS.youtube || ''}<span>YouTube</span>${ICONS.external}</a>`;
          } else {
            linkMateriBtn = `<a href="${urlVideo}" target="_blank" rel="noopener noreferrer" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-[11px] transition shadow-xs">${ICONS.globe || ''}<span>Tautan Web</span>${ICONS.external}</a>`;
          }
        }

        const fallbackInfo =
          !fileLinkBtn && !linkMateriBtn ? `<span class="text-slate-400 text-[11px]">Instruksi Teks</span>` : '';

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-bold text-slate-800"><span class="bg-slate-100 px-2.5 py-1 rounded-lg">${escapeHtml(t.kelas)}</span></td>
            <td class="p-3"><div class="font-bold text-indigo-700">${escapeHtml(t.mapel)}</div><div class="text-[11px] text-slate-500">${escapeHtml(t.materi || '-')}</div></td>
            <td class="p-3 max-w-xs"><div class="font-bold text-slate-800 truncate" title="${escapeHtml(t.judul)}">${escapeHtml(t.judul)}</div><div class="text-[11px] text-slate-500 truncate" title="${escapeHtml(t.deskripsi || '-')}">${escapeHtml(t.deskripsi || '-')}</div></td>
            <td class="p-3 font-semibold text-slate-700 whitespace-nowrap">${escapeHtml(t.deadline || '-')}</td>
            <td class="p-3 text-right whitespace-nowrap"><div class="inline-flex items-center justify-end gap-1.5 flex-wrap">${fileLinkBtn}${linkMateriBtn}${fallbackInfo}</div></td>
          </tr>
        `;
      },
      onStateChange: () => renderRiwayatTugasGuru(cacheDaftarSoalTerbit),
    });
  }

  function renderTabelTugas(list) {
    if (list) cacheDaftarTugas = list;
    const badgeJumlah = document.getElementById('badgeJumlahTugas');
    if (badgeJumlah) badgeJumlah.textContent = cacheDaftarTugas.length;

    const canNilai = !currentGuru || Auth.hasPermission(currentGuru, 'canNilaiTugas');

    buatDataTables({
      data: cacheDaftarTugas,
      state: dtStateDaftarTugas,
      containerId: 'boxTabelDaftarTugasWrap',
      tbodyId: 'tbodyDaftarTugas',
      colSpan: 7,
      emptyMessage: 'Belum ada berkas tugas siswa yang dikumpulkan.',
      searchPlaceholder: 'Cari No, NIS, nama siswa, mapel, atau judul...',
      renderRow: (item, index, bgRowClass) => {
        const catatanText = item.catatan
          ? `<div class="text-[11px] text-slate-500 italic mt-0.5">"${escapeHtml(item.catatan)}"</div>`
          : '';
        const safeNama = (item.nama || '').replace(/'/g, "\\'");
        const safeJudul = (item.judul || '').replace(/'/g, "\\'");
        const safeCatatan = (item.catatan || '').replace(/'/g, "\\'");
        const materiText = item.materi
          ? `<div class="text-[11px] text-slate-500 font-medium mt-0.5 truncate max-w-[140px]" title="${escapeHtml(item.materi)}">${escapeHtml(item.materi)}</div>`
          : '';

        const nilaiBadge =
          item.nilai !== undefined && item.nilai !== null && item.nilai !== ''
            ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl font-black text-xs inline-flex items-center gap-0.5 mr-1">${ICONS.star}${escapeHtml(item.nilai)}</span>`
            : `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-bold text-[10px] mr-1">Belum Dinilai</span>`;

        const isYtLink = typeof getYouTubeId === 'function' && getYouTubeId(item.link || '');
        const iconLampiran = isYtLink ? ICONS.youtube || '' : '';

        const btnNilaiHtml = canNilai
          ? `<button type="button" onclick="openModalNilai(${item.rowIndex}, '${safeNama}', '${safeJudul}', '${item.nilai !== undefined && item.nilai !== null ? item.nilai : ''}', '${safeCatatan}')" class="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center text-xs gap-1 transition border border-indigo-200">
               ${ICONS.edit}<span>${item.nilai ? 'Ubah Nilai' : 'Beri Nilai'}</span>
             </button>`
          : '';

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 text-slate-500 whitespace-nowrap text-xs">${escapeHtml(item.waktu)}</td>
            <td class="p-3"><div class="font-bold text-slate-800 text-xs">${escapeHtml(item.nama)}</div><div class="text-[11px] font-mono text-slate-400">NIS: ${escapeHtml(item.nis)}</div></td>
            <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs">${escapeHtml(item.kelas)}</span></td>
            <td class="p-3"><span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold text-xs inline-block">${escapeHtml(item.mapel)}</span>${materiText}</td>
            <td class="p-3 font-medium text-slate-700 text-xs">${escapeHtml(item.judul)}${catatanText}</td>
            <td class="p-3 text-right whitespace-nowrap space-x-1">
              ${nilaiBadge}
              <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center text-xs gap-1 transition shadow-sm">${iconLampiran}<span>Buka File</span>${ICONS.external}</a>
              ${btnNilaiHtml}
            </td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelTugas(),
    });
  }

  function renderTabelBelumTugas() {
    buatDataTables({
      data: cacheBelumKumpul,
      state: dtStateBelumTugas,
      containerId: 'boxTabelBelumTugasWrap',
      tbodyId: 'tbodyBelumTugas',
      colSpan: 6,
      emptyMessage: 'Seluruh siswa di kelas ini sudah mengumpulkan tugas.',
      searchPlaceholder: 'Cari No, NIS, nama siswa, atau orang tua...',
      renderRow: (s, index, bgRowClass) => {
        const waBtn = buatTautanWA(
          s.nohp,
          `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa ananda ${s.nama} (Kelas ${s.kelas}) belum mengumpulkan Tugas/PR di aplikasi SiBintang. Mohon bantuannya untuk mengingatkan ananda. Terima kasih.`,
          'Ingatkan Ortu',
          'bg-amber-600 hover:bg-amber-700'
        );

        return `
          <tr class="${bgRowClass} hover:bg-amber-50/40 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-mono text-slate-600">${escapeHtml(s.nis)}</td>
            <td class="p-3 font-bold text-slate-800">${escapeHtml(s.nama)}</td>
            <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-xs">${escapeHtml(s.kelas)}</span></td>
            <td class="p-3">${escapeHtml(s.ortu)}</td>
            <td class="p-3 text-right">${waBtn}</td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelBelumTugas(),
    });
  }

  function openModalNilai(rowIndex, nama, judul, nilai, catatan) {
    if (currentGuru && !Auth.hasPermission(currentGuru, 'canNilaiTugas')) {
      showToast('Mode peran Anda saat ini hanya untuk monitoring dan tidak dapat memberi nilai.', 'warning');
      return;
    }
    document.getElementById('modalRowIndex').value = rowIndex;
    document.getElementById('modalNamaSiswa').textContent = nama;
    document.getElementById('modalJudulTugas').textContent = judul;
    document.getElementById('inputNilaiAngka').value = nilai;
    document.getElementById('inputCatatanGuru').value = catatan;
    document.getElementById('modalNilai').classList.remove('hidden');
  }

  function closeModalNilai() {
    document.getElementById('modalNilai')?.classList.add('hidden');
  }

  async function simpanNilaiTugas(e) {
    e.preventDefault();
    const rowIndex = document.getElementById('modalRowIndex').value;
    const nilai = document.getElementById('inputNilaiAngka').value;
    const catatan = document.getElementById('inputCatatanGuru').value.trim();

    const btn = document.getElementById('btnSimpanNilai');
    setTombolLoading(btn, true, 'Menyimpan...');

    try {
      const res = await fetch('/api/guru/nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: parseInt(rowIndex, 10), nilai, catatan }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('Nilai dan catatan berhasil disimpan!', 'success');
        closeModalNilai();
        loadRekapTugas();
        muatUlangNotifikasiGuru();
      } else {
        showToast(result.message || result.error || 'Gagal menyimpan nilai.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setTombolLoading(btn, false, '', `${ICONS.save}<span>Simpan Nilai</span>`);
    }
  }

  // ==========================================================================
  // 7. EKSPOR KONTEKSTUAL KE PDF & XLSX (SESUAI SWITCH TAB & FILTER AKTIF)
  // ==========================================================================
  function eksporAbsensiTabAktif(format = 'pdf') {
    document.getElementById('menuExportAbsen')?.classList.add('hidden');
    const tanggal = document.getElementById('filterTanggal')?.value || new Date().toISOString().split('T')[0];
    const signerName = currentGuru?.nama || 'Pengelola Sekolah';
    const signerRole = Auth.getActiveRole(currentGuru);

    let title = '';
    let subtitle = `Tanggal Presensi: ${tanggal}`;
    let headers = [];
    let rows = [];
    let filePrefix = '';

    if (activeTabRekapAbsen === 'sudah') {
      const source = dtStateSudahAbsen._filteredRows || cacheSudahAbsen;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Sudah Scan untuk diekspor.', 'warning');
        return;
      }
      title = 'REKAPITULASI SISWA SUDAH SCAN PRESENSI';
      filePrefix = `Rekap_Sudah_Scan_${tanggal}`;
      headers = ['No', 'Waktu Scan', 'NIS', 'Nama Siswa', 'Kelas', 'Status Kehadiran'];
      rows = source.map((s, i) => [
        i + 1,
        s.waktuAbsen || '-',
        s.nis || '-',
        s.nama || '-',
        s.kelas || '-',
        s.status || 'Hadir',
      ]);
    } else if (activeTabRekapAbsen === 'izin') {
      const source = dtStateVerifikasiIzin._filteredRows || cacheVerifikasiIzin;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Verifikasi Izin/Sakit untuk diekspor.', 'warning');
        return;
      }
      title = 'DAFTAR PERMOHONAN & VERIFIKASI SURAT IZIN / SAKIT SISWA';
      filePrefix = `Rekap_Verifikasi_Izin_${tanggal}`;
      headers = ['No', 'Waktu Pengajuan', 'NIS', 'Nama Siswa', 'Kelas', 'Kategori', 'Tanggal Izin', 'Keterangan', 'Status Verifikasi'];
      rows = source.map((item, i) => [
        i + 1,
        item.waktuPengajuan || '-',
        item.nis || '-',
        item.nama || '-',
        item.kelas || '-',
        item.status || '-',
        item.tanggalMulai || '-',
        item.keterangan || '-',
        item.statusVerifikasi || 'Menunggu',
      ]);
    } else {
      const source = dtStateBelumAbsen._filteredRows || cacheBelumAbsen;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Belum Absen untuk diekspor.', 'warning');
        return;
      }
      title = 'DAFTAR SISWA BELUM MELAKUKAN PRESENSI HARIAN';
      filePrefix = `Rekap_Belum_Absen_${tanggal}`;
      headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'L/P', 'Nama Orang Tua', 'No. WhatsApp Ortu'];
      rows = source.map((s, i) => [
        i + 1,
        s.nis || '-',
        s.nama || '-',
        s.kelas || '-',
        s.jk || '-',
        s.ortu || '-',
        s.nohp || '-',
      ]);
    }

    if (format === 'xlsx') {
      unduhDataXLSX({ filename: `${filePrefix}.xlsx`, title, subtitle, headers, rows });
      showToast(`Berkas Excel (${filePrefix}.xlsx) berhasil diunduh!`, 'success');
    } else {
      eksporTabelKePDF({
        filename: `${filePrefix}.pdf`,
        title,
        subtitle,
        headers,
        rows,
        signerRole,
        signerName,
      });
    }
  }

  function eksporMateriTabAktif(format = 'pdf') {
    document.getElementById('menuExportMateri')?.classList.add('hidden');
    const signerName = currentGuru?.nama || 'Pengelola Sekolah';
    const signerRole = Auth.getActiveRole(currentGuru);
    const today = new Date().toISOString().split('T')[0];

    let title = '';
    let subtitle = `Dicetak oleh: ${signerName} (${signerRole})`;
    let headers = [];
    let rows = [];
    let filePrefix = '';

    if (activeTabMateriRekap === 'daftar') {
      const source = dtStateDaftarMateri._filteredRows || cacheDaftarMateriGuru;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Daftar Materi Ajar untuk diekspor.', 'warning');
        return;
      }
      title = 'DAFTAR MATERI PELAJARAN & MODUL AJAR KELAS';
      filePrefix = `Daftar_Materi_Pelajaran_${today}`;
      headers = ['No', 'Waktu Terbit', 'Kelas', 'Mata Pelajaran', 'Bab / Topik', 'Judul Materi', 'Pembuat'];
      rows = source.map((m, i) => [
        i + 1,
        m.waktu || '-',
        m.kelas || '-',
        m.mapel || '-',
        m.bab || '-',
        m.judul || '-',
        m.pembuat || '-',
      ]);
    } else {
      const source = dtStateLogBacaMateri._filteredRows || cacheLogBacaMateri;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Log Baca Siswa untuk diekspor.', 'warning');
        return;
      }
      title = 'REKAPITULASI LOG BACA & AKSES MATERI PELAJARAN SISWA';
      filePrefix = `Log_Baca_Materi_Siswa_${today}`;
      headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Status Baca', 'Materi Terakhir Dibaca', 'Waktu Akses'];
      rows = source.map((s, i) => [
        i + 1,
        s.nis || '-',
        s.nama || '-',
        s.kelas || '-',
        s.statusBaca || '-',
        s.materiTerakhir || '-',
        s.waktuBaca || '-',
      ]);
    }

    if (format === 'xlsx') {
      unduhDataXLSX({ filename: `${filePrefix}.xlsx`, title, subtitle, headers, rows });
      showToast(`Berkas Excel (${filePrefix}.xlsx) berhasil diunduh!`, 'success');
    } else {
      eksporTabelKePDF({
        filename: `${filePrefix}.pdf`,
        title,
        subtitle,
        headers,
        rows,
        signerRole,
        signerName,
      });
    }
  }

  function eksporTugasTabAktif(format = 'pdf') {
    document.getElementById('menuExportTugas')?.classList.add('hidden');
    const signerName = currentGuru?.nama || 'Pengelola Sekolah';
    const signerRole = Auth.getActiveRole(currentGuru);
    const today = new Date().toISOString().split('T')[0];

    let title = '';
    let subtitle = `Dicetak oleh: ${signerName} (${signerRole})`;
    let headers = [];
    let rows = [];
    let filePrefix = '';

    if (activeTabTugasRekap === 'terbit') {
      const source = dtStateTugasTerbit._filteredRows || cacheDaftarSoalTerbit;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Tugas Diterbitkan untuk diekspor.', 'warning');
        return;
      }
      title = 'DAFTAR TUGAS & PR YANG DITERBITKAN';
      filePrefix = `Daftar_Tugas_Diterbitkan_${today}`;
      headers = ['No', 'Kelas', 'Mata Pelajaran', 'Materi / Bab', 'Judul Tugas', 'Batas Waktu (Deadline)', 'Pembuat'];
      rows = source.map((t, i) => [
        i + 1,
        t.kelas || '-',
        t.mapel || '-',
        t.materi || '-',
        t.judul || '-',
        t.deadline || '-',
        t.pembuat || '-',
      ]);
    } else if (activeTabTugasRekap === 'terkumpul') {
      const source = dtStateDaftarTugas._filteredRows || cacheDaftarTugas;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Tugas Terkumpul untuk diekspor.', 'warning');
        return;
      }
      title = 'REKAPITULASI PENGUMPULAN & NILAI TUGAS SISWA';
      filePrefix = `Rekap_Nilai_Tugas_Terkumpul_${today}`;
      headers = ['No', 'Waktu Upload', 'NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Judul Tugas', 'Nilai', 'Catatan Guru'];
      rows = source.map((t, i) => [
        i + 1,
        t.waktu || '-',
        t.nis || '-',
        t.nama || '-',
        t.kelas || '-',
        t.mapel || '-',
        t.judul || '-',
        t.nilai !== '' && t.nilai !== undefined && t.nilai !== null ? String(t.nilai) : 'Belum Dinilai',
        t.catatan || '-',
      ]);
    } else {
      const source = dtStateBelumTugas._filteredRows || cacheBelumKumpul;
      if (!source || source.length === 0) {
        showToast('Belum ada data pada tab Belum Mengumpulkan untuk diekspor.', 'warning');
        return;
      }
      title = 'DAFTAR SISWA BELUM MENGUMPULKAN TUGAS';
      filePrefix = `Daftar_Belum_Kumpul_Tugas_${today}`;
      headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Nama Orang Tua', 'No. WhatsApp Ortu'];
      rows = source.map((s, i) => [
        i + 1,
        s.nis || '-',
        s.nama || '-',
        s.kelas || '-',
        s.ortu || '-',
        s.nohp || '-',
      ]);
    }

    if (format === 'xlsx') {
      unduhDataXLSX({ filename: `${filePrefix}.xlsx`, title, subtitle, headers, rows });
      showToast(`Berkas Excel (${filePrefix}.xlsx) berhasil diunduh!`, 'success');
    } else {
      eksporTabelKePDF({
        filename: `${filePrefix}.pdf`,
        title,
        subtitle,
        headers,
        rows,
        signerRole,
        signerName,
      });
    }
  }

  // ==========================================================================
  // 8. MODAL KELOLA PENGUMUMAN & GENERATOR TOKEN REGISTRASI
  // ==========================================================================
  function bukaModalKelolaPengumuman() {
    document.getElementById('userDropdownMenu')?.classList.add('hidden');
    document.getElementById('popoverNotifGuruDesktop')?.classList.add('hidden');
    tutupBottomSheetNotifGuru();
    Auth.terapkanAksesRoleGuru(currentGuru);
    document.getElementById('modalKelolaPengumuman')?.classList.remove('hidden');
    muatUlangRiwayatPengumumanGuru();
  }

  function tutupModalKelolaPengumuman() {
    document.getElementById('modalKelolaPengumuman')?.classList.add('hidden');
  }

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
    const activeRole = Auth.getActiveRole(currentGuru);

    if (target === 'SEMUA' && !Auth.hasPermission(currentGuru, 'canPengumumanGlobal') && !Auth.isRoleAdmin(activeRole)) {
      showToast(
        'Untuk menyiarkan ke SEMUA kelas (Global), silakan pilih kelas spesifik Anda atau aktifkan izin Pengumuman Global di menu Setting.',
        'warning'
      );
      return;
    }

    setTombolLoading(btn, true, 'Menerbitkan...');

    const pembuatNama = currentGuru ? `${currentGuru.nama} (${activeRole})` : 'Dewan Guru';
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
        const nextWeekDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const inputExpired = document.getElementById('p_expired');
        if (inputExpired) inputExpired.value = nextWeekDate;

        tutupModalBuatPengumuman();
        muatUlangRiwayatPengumumanGuru();
        muatUlangNotifikasiGuru();
      } else {
        showToast(result.message || result.error || 'Gagal menerbitkan pengumuman.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  async function muatUlangRiwayatPengumumanGuru() {
    animasiPutarIkon('iconRefreshPengumumanGuru');
    try {
      const res = await fetch('/api/pengumuman?kelas=SEMUA');
      const data = await res.json();
      cachePengumumanGuru = data.pengumuman || [];
      dtStatePengumuman.page = 1;
      renderTabelRiwayatPengumuman();
    } catch (err) {
      console.error('[SiBintang] Gagal mengambil riwayat pengumuman:', err);
    }
  }

  function renderTabelRiwayatPengumuman() {
    buatDataTables({
      data: cachePengumumanGuru,
      state: dtStatePengumuman,
      containerId: 'boxTabelPengumumanGuruWrap',
      tbodyId: 'tbodyRiwayatPengumumanGuru',
      colSpan: 7,
      emptyMessage: 'Belum ada pengumuman aktif yang diterbitkan.',
      searchPlaceholder: 'Cari No, judul, kategori, atau isi pengumuman...',
      renderRow: (p, index, bgRowClass) => `
        <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
          <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
          <td class="p-3 font-medium text-slate-600 whitespace-nowrap text-xs">${escapeHtml(p.waktu)}</td>
          <td class="p-3 text-xs"><span class="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg">${escapeHtml(p.target)}</span></td>
          <td class="p-3 text-xs"><span class="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-lg">${escapeHtml(p.kategori)}</span></td>
          <td class="p-3 max-w-xs">
            <div class="font-bold text-slate-800 text-xs">${escapeHtml(p.judul)}</div>
            <div class="text-[11px] text-slate-500 truncate" title="${escapeHtml(p.isi)}">${escapeHtml(p.isi)}</div>
          </td>
          <td class="p-3 text-xs font-mono text-slate-600 whitespace-nowrap">${escapeHtml(p.tglBerakhir)}</td>
          <td class="p-3 text-right font-semibold text-xs text-slate-700 whitespace-nowrap">${escapeHtml(p.pembuat)}</td>
        </tr>
      `,
      onStateChange: () => renderTabelRiwayatPengumuman(),
    });
  }

  async function submitGenerateToken(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const kategoriEl = document.getElementById('tokenTarget');
    const customTokenEl = document.getElementById('customTokenInput');
    const kategori = kategoriEl?.value || 'Guru';
    const customToken = customTokenEl?.value.trim() || '';
    const activeUser = currentGuru || Auth.getGuru() || {};

    const btn = document.getElementById('btnGenerateToken');
    setTombolLoading(btn, true, 'Memproses...');

    try {
      const res = await fetch('/api/admin/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kategori, customToken, pembuat: activeUser.nama || 'Admin' }),
      });
      const data = await res.json();
      if (data.success) {
        const teksToken = document.getElementById('teksTokenBaru');
        if (teksToken) teksToken.textContent = data.token;
        document.getElementById('hasilTokenContainer')?.classList.remove('hidden');
        showToast(data.message || 'Token berhasil dibuat!', 'success');
        if (customTokenEl) customTokenEl.value = '';
      } else {
        showToast(data.message || data.error || 'Gagal membuat token.', 'error');
      }
    } catch (err) {
      console.error('[SiBintang] Error generator token:', err);
      showToast('Gagal terhubung ke server saat generate token.', 'error');
    } finally {
      setTombolLoading(btn, false, '', `${ICONS.plus}<span>Buat Token Baru</span>`);
    }
  }

  function salinTokenKeClipboard() {
    const tokenEl = document.getElementById('teksTokenBaru');
    const tokenText = tokenEl?.textContent;
    if (!tokenText) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(tokenText)
        .then(() => showToast('Token berhasil disalin ke clipboard!', 'info'))
        .catch(() => salinTeksFallback(tokenText));
    } else {
      salinTeksFallback(tokenText);
    }
  }

  function salinTeksFallback(teks) {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = teks;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      showToast('Token berhasil disalin ke clipboard!', 'info');
    } catch {
      showToast('Gagal menyalin token.', 'error');
    }
  }

  // ==========================================================================
  // 9. MODAL SETTING SISTEM, HAK AKSES ROLE & HAPUS DATA (ADMIN & KEPSEK)
  // ==========================================================================
  async function bukaModalSettingSistem() {
    document.getElementById('userDropdownMenu')?.classList.add('hidden');
    if (currentGuru && !Auth.canAccessSystemSettings(currentGuru)) {
      showToast('Hanya Admin atau Kepala Sekolah yang dapat membuka menu Setting Sistem.', 'error');
      return;
    }

    workingSettings = JSON.parse(JSON.stringify(Auth.getSettings()));
    isiDropdown('selectSettingRoleTarget', workingSettings.daftarRole);
    renderDaftarChecklistPermissionRole();

    const sc = workingSettings.schoolConfig || {};
    const elTa = document.getElementById('cfgTahunAjaran');
    const elSem = document.getElementById('cfgSemester');
    const elKkm = document.getElementById('cfgKkmNilai');
    const elJam = document.getElementById('cfgBatasJamMasuk');
    const elWajib = document.getElementById('cfgWajibToken');

    if (elTa) elTa.value = sc.tahunAjaran || '2026/2027';
    if (elSem) elSem.value = sc.semester || 'Ganjil';
    if (elKkm) elKkm.value = sc.kkmNilai ?? 75;
    if (elJam) elJam.value = sc.batasJamMasuk || '07:15';
    if (elWajib) elWajib.checked = sc.wajibTokenRegistrasi !== false;

    switchTabSettingSistem('rbac');
    document.getElementById('modalSettingSistem')?.classList.remove('hidden');

    muatDaftarGuruAdmin();
    muatDaftarSiswaAdmin();
  }

  function tutupModalSettingSistem() {
    document.getElementById('modalSettingSistem')?.classList.add('hidden');
  }

  function switchTabSettingSistem(tabKey) {
    ['rbac', 'guru', 'siswa', 'sekolah'].forEach((k) => {
      document.getElementById(`settingContent-${k}`)?.classList.toggle('hidden', k !== tabKey);
    });

    terapkanGayaTab(
      {
        rbac: 'tabSettingBtn-rbac',
        guru: 'tabSettingBtn-guru',
        siswa: 'tabSettingBtn-siswa',
        sekolah: 'tabSettingBtn-sekolah',
      },
      tabKey,
      'py-2 px-3.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm transition cursor-pointer',
      'py-2 px-3.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer'
    );
  }

  function renderDaftarChecklistPermissionRole() {
    if (!workingSettings) workingSettings = JSON.parse(JSON.stringify(Auth.getSettings()));
    const roleName = document.getElementById('selectSettingRoleTarget')?.value || 'Wali Kelas';
    const container = document.getElementById('containerChecklistPermissionRole');
    if (!container) return;

    if (!workingSettings.rolePermissions[roleName]) {
      workingSettings.rolePermissions[roleName] = {
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
      };
    }

    const perms = workingSettings.rolePermissions[roleName];
    const fiturList =
      typeof DAFTAR_FITUR_RBAC !== 'undefined'
        ? DAFTAR_FITUR_RBAC
        : [
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

    container.innerHTML = fiturList
      .map((f) => {
        const checked = Boolean(perms[f.key]);
        return `
          <label class="flex items-center justify-between p-3 rounded-2xl border ${checked ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-slate-200'} cursor-pointer transition hover:border-indigo-300 select-none">
            <span class="text-xs font-bold ${checked ? 'text-indigo-950' : 'text-slate-600'} pr-2">${escapeHtml(f.label)}</span>
            <input type="checkbox" data-perm-key="${escapeHtml(f.key)}" ${checked ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-indigo-700 focus:ring-indigo-600 cursor-pointer" />
          </label>
        `;
      })
      .join('');

    container.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const key = e.target.getAttribute('data-perm-key');
        workingSettings.rolePermissions[roleName][key] = e.target.checked;
        renderDaftarChecklistPermissionRole();
      });
    });
  }

  function tambahRoleBaruKeSistem() {
    const input = document.getElementById('inputNamaRoleBaru');
    const namaBaru = (input?.value || '').trim();
    if (!namaBaru) {
      showToast('Masukkan nama role baru terlebih dahulu.', 'warning');
      return;
    }
    if (workingSettings.daftarRole.includes(namaBaru)) {
      showToast('Nama role tersebut sudah ada di dalam sistem.', 'warning');
      return;
    }

    workingSettings.daftarRole.push(namaBaru);
    workingSettings.rolePermissions[namaBaru] = {
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
    };

    if (input) input.value = '';
    isiDropdown('selectSettingRoleTarget', workingSettings.daftarRole);
    const sel = document.getElementById('selectSettingRoleTarget');
    if (sel) sel.value = namaBaru;
    renderDaftarChecklistPermissionRole();
    showToast(`Role "${namaBaru}" ditambahkan. Klik Simpan Setting ke Server untuk menerapkan.`, 'success');
  }

  async function hapusRoleTerpilihDariSistem() {
    const roleName = document.getElementById('selectSettingRoleTarget')?.value || '';
    if (!roleName) return;
    if (roleName === 'Admin' || roleName === 'Kepala Sekolah') {
      showToast(`Role inti "${roleName}" tidak dapat dihapus demi keamanan akses sistem.`, 'error');
      return;
    }

    const yakin = await konfirmasiModal({
      judul: `Hapus Role "${roleName}"?`,
      pesan: `Role "${roleName}" akan dihapus dari daftar pilihan peran sistem. Lanjutkan?`,
      teksKonfirmasi: 'Ya, Hapus Role',
      tipe: 'danger',
    });
    if (!yakin) return;

    workingSettings.daftarRole = workingSettings.daftarRole.filter((r) => r !== roleName);
    delete workingSettings.rolePermissions[roleName];
    isiDropdown('selectSettingRoleTarget', workingSettings.daftarRole);
    renderDaftarChecklistPermissionRole();
    await simpanPengaturanSistemKeBackend();
  }

  async function resetDefaultPermissionSistem() {
    const yakin = await konfirmasiModal({
      judul: 'Kembalikan Pengaturan Default?',
      pesan: 'Seluruh matriks hak akses role dan parameter sekolah akan dikembalikan ke standar awal.',
      teksKonfirmasi: 'Ya, Reset Default',
      tipe: 'warning',
    });
    if (!yakin) return;

    workingSettings = {
      daftarRole: [...DAFTAR_ROLE_GURU],
      rolePermissions: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)),
      schoolConfig: { ...DEFAULT_SCHOOL_CONFIG },
    };
    isiDropdown('selectSettingRoleTarget', workingSettings.daftarRole);
    renderDaftarChecklistPermissionRole();
    await simpanPengaturanSistemKeBackend();
  }

  async function simpanPengaturanSistemKeBackend() {
    if (!workingSettings) return;
    const btn = document.getElementById('btnSimpanSettingSistem');
    setTombolLoading(btn, true, 'Menyimpan...');

    workingSettings.schoolConfig = {
      tahunAjaran: document.getElementById('cfgTahunAjaran')?.value.trim() || '2026/2027',
      semester: document.getElementById('cfgSemester')?.value || 'Ganjil',
      kkmNilai: Number(document.getElementById('cfgKkmNilai')?.value || 75),
      jamOperasional: '07.00 - 12.20 WIB',
      batasJamMasuk: document.getElementById('cfgBatasJamMasuk')?.value.trim() || '07:15',
      wajibTokenRegistrasi: Boolean(document.getElementById('cfgWajibToken')?.checked),
    };

    try {
      Auth.saveSettingsLocal(workingSettings);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workingSettings),
      });
      const data = await res.json();
      isiDropdown('regRoleGuru', workingSettings.daftarRole, 'Pilih Status / Peran (Role)');
      if (currentGuru) {
        Auth.terapkanAksesRoleGuru(currentGuru);
        renderTabelDaftarMateriGuru();
        renderTabelTugas();
        renderTabelVerifikasiIzin();
      }
      showToast(data.message || 'Pengaturan sistem berhasil disimpan ke server!', 'success');
    } catch {
      showToast('Tersimpan di perangkat lokal (gagal sinkron ke server).', 'warning');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  async function muatDaftarGuruAdmin() {
    const tbody = document.getElementById('tbodySettingDaftarGuru');
    if (!tbody) return;
    try {
      const res = await fetch('/api/admin/guru');
      const data = await res.json();
      cacheAdminGuruList = data.daftarGuru || [];
      renderTabelSettingGuru();
    } catch {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-500">Gagal memuat daftar akun guru.</td></tr>`;
    }
  }

  function renderTabelSettingGuru() {
    const tbody = document.getElementById('tbodySettingDaftarGuru');
    if (!tbody) return;
    const roleList = workingSettings?.daftarRole || DAFTAR_ROLE_GURU;

    if (cacheAdminGuruList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada data akun pengelola.</td></tr>`;
      return;
    }

    tbody.innerHTML = cacheAdminGuruList
      .map((g) => {
        const safeNip = (g.nip || '').replace(/'/g, "\\'");
        const safeNama = (g.nama || '').replace(/'/g, "\\'");
        const optsRole = roleList
          .map(
            (r) =>
              `<option value="${escapeHtml(r)}" ${g.role === r ? 'selected' : ''}>${escapeHtml(r)}</option>`
          )
          .join('');

        return `
          <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-2.5 font-mono font-bold text-slate-600">${escapeHtml(g.nip)}</td>
            <td class="p-2.5 font-bold text-slate-800">${escapeHtml(g.nama)}</td>
            <td class="p-2.5">
              <div class="flex items-center gap-1.5">
                <select onchange="ubahRoleAkunGuruAdmin('${safeNip}', this.value, ${Boolean(g.merangkapGuruKelas)})" class="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white">
                  ${optsRole}
                </select>
                ${g.kelasBinaan && g.kelasBinaan !== '-' ? `<span class="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">Kls ${escapeHtml(g.kelasBinaan)}</span>` : ''}
              </div>
            </td>
            <td class="p-2.5 text-center">
              <input type="checkbox" ${g.merangkapGuruKelas ? 'checked' : ''} onchange="ubahRoleAkunGuruAdmin('${safeNip}', '${escapeHtml(g.role)}', this.checked)" class="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" title="Merangkap Guru Kelas" />
            </td>
            <td class="p-2.5 text-right">
              <button type="button" onclick="hapusAkunGuruAdmin('${safeNip}', '${safeNama}')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer">
                Hapus
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  async function ubahRoleAkunGuruAdmin(nip, roleBaru, merangkapGuruKelas) {
    try {
      const res = await fetch('/api/admin/guru/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, role: roleBaru, merangkapGuruKelas }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Peran akun berhasil diperbarui!', 'success');
        muatDaftarGuruAdmin();
      } else {
        showToast(data.message || 'Gagal memperbarui peran.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    }
  }

  async function hapusAkunGuruAdmin(nip, nama) {
    if (nip.toLowerCase() === 'admin') {
      showToast('Akun Administrator Utama tidak dapat dihapus.', 'error');
      return;
    }
    const yakin = await konfirmasiModal({
      judul: `Hapus Akun Pengelola?`,
      pesan: `Akun "${nama}" (NIP: ${nip}) akan dihapus permanen dari database aplikasi. Lanjutkan?`,
      teksKonfirmasi: 'Ya, Hapus Akun',
      tipe: 'danger',
    });
    if (!yakin) return;

    try {
      const res = await fetch(`/api/admin/guru/${encodeURIComponent(nip)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Akun berhasil dihapus!', 'success');
        muatDaftarGuruAdmin();
      } else {
        showToast(data.message || 'Gagal menghapus akun.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    }
  }

  async function muatDaftarSiswaAdmin() {
    const tbody = document.getElementById('tbodySettingDaftarSiswa');
    if (!tbody) return;
    try {
      const res = await fetch('/api/admin/siswa');
      const data = await res.json();
      cacheAdminSiswaList = data.daftarSiswa || [];
      renderTabelSettingSiswa();
    } catch {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-500">Gagal memuat daftar siswa.</td></tr>`;
    }
  }

  function renderTabelSettingSiswa() {
    const tbody = document.getElementById('tbodySettingDaftarSiswa');
    if (!tbody) return;
    const q = (document.getElementById('inputCariSiswaSetting')?.value || '').toLowerCase().trim();
    const filtered = q
      ? cacheAdminSiswaList.filter(
          (s) =>
            String(s.nis || '').toLowerCase().includes(q) ||
            String(s.nama || '').toLowerCase().includes(q) ||
            String(s.kelas || '').toLowerCase().includes(q)
        )
      : cacheAdminSiswaList;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Tidak ada data siswa yang cocok.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((s) => {
        const safeNis = (s.nis || '').replace(/'/g, "\\'");
        const safeNama = (s.nama || '').replace(/'/g, "\\'");
        return `
          <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-2.5 font-mono font-bold text-slate-600">${escapeHtml(s.nis)}</td>
            <td class="p-2.5 font-bold text-slate-800">${escapeHtml(s.nama)}</td>
            <td class="p-2.5"><span class="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">${escapeHtml(s.kelas)}</span></td>
            <td class="p-2.5 text-slate-600">${escapeHtml(s.ortu)} <span class="text-[10px] font-mono text-slate-400">(${escapeHtml(s.nohp)})</span></td>
            <td class="p-2.5 text-right">
              <button type="button" onclick="hapusDataSiswaAdmin('${safeNis}', '${safeNama}')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer">
                Hapus Siswa
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  async function hapusDataSiswaAdmin(nis, nama) {
    const yakin = await konfirmasiModal({
      judul: 'Hapus Data Siswa dari Aplikasi?',
      pesan: `Data siswa "${nama}" (NIS: ${nis}) akan dihapus dari database aplikasi SiBintang. Lanjutkan?`,
      teksKonfirmasi: 'Ya, Hapus Siswa',
      tipe: 'danger',
    });
    if (!yakin) return;

    try {
      const res = await fetch(`/api/admin/siswa/${encodeURIComponent(nis)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Data siswa berhasil dihapus!', 'success');
        muatDaftarSiswaAdmin();
        loadRekapKelas();
        loadRekapMateriGuru();
        loadRekapTugas();
      } else {
        showToast(data.message || 'Gagal menghapus data siswa.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    }
  }

  // ==========================================================================
  // 10. PUSAT NOTIFIKASI GURU (SWIPEABLE BOTTOM SHEET)
  // ==========================================================================
  function switchTabNotifGuru(tab) {
    const isTugas = tab === 'tugas';
    document.getElementById('notifDaftarTugasDesktop')?.classList.toggle('hidden', !isTugas);
    document.getElementById('notifDaftarPengumumanDesktop')?.classList.toggle('hidden', isTugas);
    document.getElementById('notifDaftarTugasMobile')?.classList.toggle('hidden', !isTugas);
    document.getElementById('notifDaftarPengumumanMobile')?.classList.toggle('hidden', isTugas);

    const activeCls = 'py-1.5 rounded-lg bg-blue-600 text-white shadow-sm transition cursor-pointer';
    const inactiveCls = 'py-1.5 rounded-lg text-slate-600 hover:text-slate-800 transition cursor-pointer';

    terapkanGayaTab(
      { tugas: 'tabNotifBtn-tugas', pengumuman: 'tabNotifBtn-pengumuman' },
      tab,
      activeCls,
      inactiveCls
    );
    terapkanGayaTab(
      { tugas: 'tabNotifMobBtn-tugas', pengumuman: 'tabNotifMobBtn-pengumuman' },
      tab,
      activeCls,
      inactiveCls
    );
  }

  function tandaiNotifikasiGuruDibaca() {
    document.getElementById('badgeNotifLiveGuru')?.classList.add('hidden');
    try {
      localStorage.setItem('sibintang_notif_guru_read', Date.now().toString());
    } catch {}
  }

  async function muatUlangNotifikasiGuru() {
    if (!currentGuru) return;
    const kelasTarget =
      currentGuru.kelasBinaan && currentGuru.kelasBinaan !== '-' ? currentGuru.kelasBinaan : 'SEMUA';
    const mapelTarget =
      currentGuru.mapelAjar && currentGuru.mapelAjar !== '-' ? currentGuru.mapelAjar : 'SEMUA';
    let jumlahItemBaru = 0;

    try {
      const resTugas = await fetch(
        `/api/guru/tugas?kelas=${encodeURIComponent(kelasTarget)}&mapel=${encodeURIComponent(mapelTarget)}`
      );
      const dataTugas = await resTugas.json();
      const daftar = dataTugas.daftarTugas || [];
      const belumDinilai = daftar.filter(
        (t) => t.nilai === '' || t.nilai === null || t.nilai === undefined
      );
      jumlahItemBaru += belumDinilai.length;

      const htmlTugas =
        belumDinilai.length === 0
          ? `<p class="text-xs text-slate-400 text-center py-4">Semua tugas siswa sudah dinilai.</p>`
          : belumDinilai
              .map((t) => {
                const safeKelas = (t.kelas || '').replace(/'/g, "\\'");
                const safeMapel = (t.mapel || '').replace(/'/g, "\\'");
                return `
                  <div class="p-3 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-2xl border border-indigo-100 transition space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-md">${escapeHtml(t.kelas)} • ${escapeHtml(t.mapel)}</span>
                      <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(t.waktu)}</span>
                    </div>
                    <h5 class="text-xs font-black text-slate-800">${escapeHtml(t.nama)} <span class="text-[10px] text-slate-500 font-normal">(NIS: ${escapeHtml(t.nis)})</span></h5>
                    <p class="text-[11px] text-slate-600 truncate">${escapeHtml(t.judul)}</p>
                    <div class="pt-1.5 flex items-center justify-between border-t border-indigo-200/50 mt-1">
                      <span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Belum Dinilai</span>
                      <button type="button" onclick="arahkanKePenilaian('${safeKelas}', '${safeMapel}')" class="cursor-pointer text-[11px] font-bold text-indigo-700 hover:underline">Buka Tugas →</button>
                    </div>
                  </div>
                `;
              })
              .join('');

      const deskTugas = document.getElementById('notifDaftarTugasDesktop');
      const mobTugas = document.getElementById('notifDaftarTugasMobile');
      if (deskTugas) deskTugas.innerHTML = htmlTugas;
      if (mobTugas) mobTugas.innerHTML = htmlTugas;
    } catch {
      const errorHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memuat notifikasi tugas.</p>`;
      const deskTugas = document.getElementById('notifDaftarTugasDesktop');
      const mobTugas = document.getElementById('notifDaftarTugasMobile');
      if (deskTugas) deskTugas.innerHTML = errorHtml;
      if (mobTugas) mobTugas.innerHTML = errorHtml;
    }

    try {
      const resPeng = await fetch('/api/pengumuman?kelas=SEMUA');
      const dataPeng = await resPeng.json();
      const daftarPeng = dataPeng.pengumuman || [];

      const btnKelolaPengHtml = `
        <button type="button" onclick="bukaModalKelolaPengumuman()" class="w-full py-2 px-3 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer mb-2">
          <svg class="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>Kelola / Buat Pengumuman Sekolah</span>
        </button>
      `;

      const htmlPeng =
        btnKelolaPengHtml +
        (daftarPeng.length === 0
          ? `<p class="text-xs text-slate-400 text-center py-4">Tidak ada pengumuman aktif saat ini.</p>`
          : daftarPeng
              .map(
                (p) => `
            <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">${escapeHtml(p.kategori)}</span>
                <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(p.waktu)}</span>
              </div>
              <h5 class="text-xs font-black text-slate-800 leading-snug">${escapeHtml(p.judul)}</h5>
              <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">${escapeHtml(p.isi)}</p>
              <div class="pt-1 text-[10px] text-slate-400 font-medium border-t border-slate-100 mt-1">
                Oleh: <b>${escapeHtml(p.pembuat)}</b>
              </div>
            </div>
          `
              )
              .join(''));

      const deskPeng = document.getElementById('notifDaftarPengumumanDesktop');
      const mobPeng = document.getElementById('notifDaftarPengumumanMobile');
      if (deskPeng) deskPeng.innerHTML = htmlPeng;
      if (mobPeng) mobPeng.innerHTML = htmlPeng;
    } catch {
      const errorHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memuat pengumuman.</p>`;
      const deskPeng = document.getElementById('notifDaftarPengumumanDesktop');
      const mobPeng = document.getElementById('notifDaftarPengumumanMobile');
      if (deskPeng) deskPeng.innerHTML = errorHtml;
      if (mobPeng) mobPeng.innerHTML = errorHtml;
    }

    const counterPill = document.getElementById('notifCounterPill');
    if (counterPill) counterPill.textContent = `${jumlahItemBaru} Tugas Baru`;

    const badge = document.getElementById('badgeNotifLiveGuru');
    if (jumlahItemBaru > 0) {
      badge?.classList.remove('hidden');
    } else {
      badge?.classList.add('hidden');
    }
  }

  function arahkanKePenilaian(kelas, mapel) {
    document.getElementById('popoverNotifGuruDesktop')?.classList.add('hidden');
    tutupBottomSheetNotifGuru();
    switchGuruTab('tugas');
    if (kelas) dtStateDaftarTugas.filterKelas = kelas;
    if (mapel) dtStateDaftarTugas.filterMapel = mapel;
    switchTabTugasRekap('terkumpul');
    loadRekapTugas();
  }

  // ==========================================================================
  // 11. PENGENDALI MODAL POP-UP & EKSPOR GLOBAL WINDOW
  // ==========================================================================
  function bukaBottomSheetNotifGuru() {
    document.getElementById('sheetPanelGuru')?.classList.remove('sheet-expanded');
    document.getElementById('bottomSheetNotifGuru')?.classList.remove('hidden');
  }

  function tutupBottomSheetNotifGuru() {
    document.getElementById('sheetPanelGuru')?.classList.remove('sheet-expanded');
    document.getElementById('bottomSheetNotifGuru')?.classList.add('hidden');
  }

  function bukaModalTeksDoaGuru() {
    document.getElementById('modalDoaGuru')?.classList.remove('hidden');
  }

  function tutupModalTeksDoaGuru() {
    document.getElementById('modalDoaGuru')?.classList.add('hidden');
  }

  function bukaModalGeneratorToken() {
    document.getElementById('userDropdownMenu')?.classList.add('hidden');
    document.getElementById('hasilTokenContainer')?.classList.add('hidden');
    document.getElementById('modalGeneratorToken')?.classList.remove('hidden');
  }

  function tutupModalGeneratorToken() {
    document.getElementById('modalGeneratorToken')?.classList.add('hidden');
  }

  function bukaModalQR() {
    Auth.terapkanAksesRoleGuru(currentGuru);
    const selKelas = document.getElementById('filterKelas');
    if (selKelas && selKelas.value === 'SEMUA') {
      selKelas.value = currentGuru?.kelasBinaan && currentGuru.kelasBinaan !== '-' ? currentGuru.kelasBinaan : '1A';
    }
    const inputTgl = document.getElementById('filterTanggal');
    if (inputTgl && !inputTgl.value) {
      inputTgl.value = new Date().toISOString().split('T')[0];
    }
    const inputSesi = document.getElementById('ketSesi');
    if (inputSesi && !inputSesi.value.trim()) {
      inputSesi.value = 'Absen Pagi';
    }
    document.getElementById('modalQR')?.classList.remove('hidden');
    generateQR();
  }

  function tutupModalQR() {
    document.getElementById('modalQR')?.classList.add('hidden');
  }

  function bukaModalBuatMateri() {
    if (
      currentGuru &&
      !Auth.hasPermission(currentGuru, 'canBuatMateri') &&
      !Auth.hasPermission(currentGuru, 'canBuatTugas')
    ) {
      showToast('Mode peran Anda saat ini hanya untuk monitoring dan tidak dapat menerbitkan materi.', 'warning');
      return;
    }
    Auth.terapkanAksesRoleGuru(currentGuru);
    perbaruiIndikatorLinkInput('buatMateriLinkExternal', 'ikonInputLinkMateri', 'badgeDeteksiLinkMateri');
    document.getElementById('modalBuatMateri')?.classList.remove('hidden');
  }

  function tutupModalBuatMateri() {
    document.getElementById('modalBuatMateri')?.classList.add('hidden');
  }

  function bukaModalBuatTugas() {
    if (currentGuru && !Auth.hasPermission(currentGuru, 'canBuatTugas')) {
      showToast('Mode peran Anda saat ini hanya untuk monitoring dan tidak dapat membuat tugas.', 'warning');
      return;
    }
    Auth.terapkanAksesRoleGuru(currentGuru);
    perbaruiIndikatorLinkInput('buatTugasLinkExternal', 'ikonInputLinkTugas', 'badgeDeteksiLinkTugas');
    document.getElementById('modalBuatTugas')?.classList.remove('hidden');
  }

  function tutupModalBuatTugas() {
    document.getElementById('modalBuatTugas')?.classList.add('hidden');
  }

  function bukaModalBuatPengumuman() {
    const nextWeekDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const inputExpired = document.getElementById('p_expired');
    if (inputExpired && !inputExpired.value) inputExpired.value = nextWeekDate;

    const selectTarget = document.getElementById('p_target');
    if (
      selectTarget &&
      currentGuru &&
      !Auth.hasPermission(currentGuru, 'canPengumumanGlobal') &&
      currentGuru.kelasBinaan &&
      currentGuru.kelasBinaan !== '-'
    ) {
      selectTarget.value = currentGuru.kelasBinaan;
    }

    document.getElementById('modalBuatPengumuman')?.classList.remove('hidden');
  }

  function tutupModalBuatPengumuman() {
    document.getElementById('modalBuatPengumuman')?.classList.add('hidden');
  }

  // Ekspor Global Window
  window.inisialisasiPortalGuru = inisialisasiPortalGuru;
  window.resetKeTampilanAwalGuru = resetKeTampilanAwalGuru;
  window.ubahModePeranAktif = ubahModePeranAktif;
  window.toggleMenuExport = toggleMenuExport;
  window.eksporAbsensiTabAktif = eksporAbsensiTabAktif;
  window.eksporMateriTabAktif = eksporMateriTabAktif;
  window.eksporTugasTabAktif = eksporTugasTabAktif;
  window.logoutGuru = logoutGuru;
  window.switchGuruTab = switchGuruTab;
  window.generateQR = generateQR;
  window.switchTabNotifGuru = switchTabNotifGuru;
  window.muatUlangNotifikasiGuru = muatUlangNotifikasiGuru;
  window.arahkanKePenilaian = arahkanKePenilaian;
  window.loadVerifikasiIzinGuru = loadVerifikasiIzinGuru;
  window.responIzinSiswa = responIzinSiswa;
  window.loadRekapMateriGuru = loadRekapMateriGuru;
  window.switchTabMateriRekap = switchTabMateriRekap;
  window.lanjutkanMateriKeTugas = lanjutkanMateriKeTugas;
  window.hapusMateriGuru = hapusMateriGuru;
  window.openModalNilai = openModalNilai;
  window.closeModalNilai = closeModalNilai;
  window.submitGenerateToken = submitGenerateToken;
  window.salinTokenKeClipboard = salinTokenKeClipboard;
  window.bukaModalKelolaPengumuman = bukaModalKelolaPengumuman;
  window.tutupModalKelolaPengumuman = tutupModalKelolaPengumuman;
  window.muatUlangRiwayatPengumumanGuru = muatUlangRiwayatPengumumanGuru;
  window.switchTabRekapAbsen = switchTabRekapAbsen;
  window.switchTabTugasRekap = switchTabTugasRekap;
  window.bukaBottomSheetNotifGuru = bukaBottomSheetNotifGuru;
  window.tutupBottomSheetNotifGuru = tutupBottomSheetNotifGuru;
  window.bukaModalTeksDoaGuru = bukaModalTeksDoaGuru;
  window.tutupModalTeksDoaGuru = tutupModalTeksDoaGuru;
  window.bukaModalGeneratorToken = bukaModalGeneratorToken;
  window.tutupModalGeneratorToken = tutupModalGeneratorToken;
  window.bukaModalSettingSistem = bukaModalSettingSistem;
  window.tutupModalSettingSistem = tutupModalSettingSistem;
  window.switchTabSettingSistem = switchTabSettingSistem;
  window.renderDaftarChecklistPermissionRole = renderDaftarChecklistPermissionRole;
  window.tambahRoleBaruKeSistem = tambahRoleBaruKeSistem;
  window.hapusRoleTerpilihDariSistem = hapusRoleTerpilihDariSistem;
  window.resetDefaultPermissionSistem = resetDefaultPermissionSistem;
  window.simpanPengaturanSistemKeBackend = simpanPengaturanSistemKeBackend;
  window.muatDaftarGuruAdmin = muatDaftarGuruAdmin;
  window.ubahRoleAkunGuruAdmin = ubahRoleAkunGuruAdmin;
  window.hapusAkunGuruAdmin = hapusAkunGuruAdmin;
  window.muatDaftarSiswaAdmin = muatDaftarSiswaAdmin;
  window.renderTabelSettingSiswa = renderTabelSettingSiswa;
  window.hapusDataSiswaAdmin = hapusDataSiswaAdmin;
  window.bukaModalQR = bukaModalQR;
  window.tutupModalQR = tutupModalQR;
  window.bukaModalBuatMateri = bukaModalBuatMateri;
  window.tutupModalBuatMateri = tutupModalBuatMateri;
  window.bukaModalBuatTugas = bukaModalBuatTugas;
  window.tutupModalBuatTugas = tutupModalBuatTugas;
  window.bukaModalBuatPengumuman = bukaModalBuatPengumuman;
  window.tutupModalBuatPengumuman = tutupModalBuatPengumuman;
})();
