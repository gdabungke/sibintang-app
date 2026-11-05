/**
 * ============================================================================
 * SIBINTANG - SISWA CONTROLLER, SCANNER & PROGRESS ANALYTICS (public/js/siswa.js)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.2.0)
 * ============================================================================
 * Mengelola seluruh interaksi pada Portal Siswa:
 * - Autentikasi bebas kedipan & dukungan akses Admin lintas portal
 * - Reset dashboard saat klik logo SiBintang
 * - Urutan 3 Menu Utama (Opsi A):
 *   1. Presensi & Kehadiran
 *   2. Tugas & Materi (Daftar Tugas, Materi Pelajaran, Riwayat & Nilai)
 *   3. Perkembangan & Profil (Grafik Nilai Harian, Statistik Kehadiran, Biodata)
 */
(function () {
  'use strict';

  // ==========================================================================
  // 1. DEKLARASI STATE & CACHE DATA MODUL
  // ==========================================================================
  let currentStudent = null;
  let html5QrCode = null;
  let simulasiKameraAktif = false;

  const dtStateAbsenSiswa = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateIzinSiswa = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };
  const dtStateTugasSiswa = { page: 1, perPage: 5, search: '', sortBy: 'no_asc' };

  let cacheAbsensiRaw = [];
  let cacheIzinRaw = [];
  let cacheTugasRaw = [];
  let cacheMateriAjarSiswa = [];
  let cacheMateriDibacaSet = new Set();

  // ==========================================================================
  // 2. INISIALISASI PORTAL & PENDAFTARAN EVENT LISTENER DOM
  // ==========================================================================

  function inisialisasiPortalSiswa() {
    isiDropdown('regKelas', DAFTAR_KELAS, 'Pilih Kelas');
    isiDropdown('mapel', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');
    isiDropdown('filterMapelGrafikSiswa', DAFTAR_MAPEL, '', {
      val: 'SEMUA',
      label: 'Semua Mata Pelajaran',
    });
    isiDropdown('filterMapelMateriSiswa', DAFTAR_MAPEL, '', {
      val: 'SEMUA',
      label: 'Semua Mata Pelajaran',
    });

    inisialisasiRentangTanggalIzin();
    initEventListeners();

    if (typeof inisialisasiSwipeBottomSheet === 'function') {
      inisialisasiSwipeBottomSheet(
        'bottomSheetPengumuman',
        'sheetPanelSiswa',
        tutupBottomSheetPengumuman
      );
    }

    currentStudent = Auth.getSiswa();
    if (currentStudent) {
      showDashboard();
    } else {
      updateHeaderUI(false);
    }
  }

  function inisialisasiRentangTanggalIzin() {
    const today = new Date().toISOString().split('T')[0];
    const tglMulaiInput = document.getElementById('tanggalMulai');
    const tglSelesaiInput = document.getElementById('tanggalSelesai');

    if (tglMulaiInput && !tglMulaiInput.value) tglMulaiInput.value = today;
    if (tglSelesaiInput && !tglSelesaiInput.value) tglSelesaiInput.value = today;
    if (tglSelesaiInput && tglMulaiInput) tglSelesaiInput.min = tglMulaiInput.value;

    perbaruiLabelRentangIzin();

    tglMulaiInput?.addEventListener('change', () => {
      if (tglSelesaiInput) {
        tglSelesaiInput.min = tglMulaiInput.value;
        if (!tglSelesaiInput.value || tglSelesaiInput.value < tglMulaiInput.value) {
          tglSelesaiInput.value = tglMulaiInput.value;
        }
      }
      perbaruiLabelRentangIzin();
    });

    tglSelesaiInput?.addEventListener('change', perbaruiLabelRentangIzin);
  }

  function perbaruiLabelRentangIzin() {
    const tglMulai = document.getElementById('tanggalMulai')?.value || '';
    const tglSelesai = document.getElementById('tanggalSelesai')?.value || tglMulai;
    const infoEl = document.getElementById('infoRentangTanggalIzin');
    if (!infoEl) return;

    const teksIndo =
      typeof formatRentangTanggalIndo === 'function'
        ? formatRentangTanggalIndo(tglMulai, tglSelesai)
        : tglMulai;

    let jumlahHari = 1;
    if (tglMulai && tglSelesai && tglSelesai >= tglMulai) {
      const diffMs = new Date(tglSelesai).getTime() - new Date(tglMulai).getTime();
      jumlahHari = Math.max(1, Math.round(diffMs / 86400000) + 1);
    }
    infoEl.textContent = `Tanggal berhalangan: ${teksIndo} (${jumlahHari} hari)`;
  }

  function initEventListeners() {
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    document.getElementById('authTabBtn-masuk')?.addEventListener('click', () => switchAuthTab('masuk'));
    document.getElementById('authTabBtn-daftar')?.addEventListener('click', () => switchAuthTab('daftar'));
    document.getElementById('formMasuk')?.addEventListener('submit', prosesMasukSiswa);
    document.getElementById('formDaftar')?.addEventListener('submit', prosesDaftarSiswa);

    const btnToggle = document.getElementById('btnToggleUserDropdownSiswa');
    const dropdownMenu = document.getElementById('userDropdownMenuSiswa');
    const chevron = document.getElementById('chevronDropdownSiswa');

    btnToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu?.classList.toggle('hidden');
      chevron?.classList.toggle('rotate-180');
      document.getElementById('popoverNotifDesktop')?.classList.add('hidden');
    });

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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        tutupModalScanQR();
        tutupModalFormIzin();
        tutupModalKirimTugas();
        tutupModalTeksDoaSiswa();
        tutupBottomSheetPengumuman();
      }
    });

    // Navigasi 3 Menu Utama (Presensi, Tugas & Materi, Perkembangan & Profil)
    ['presensi', 'tugas', 'perkembangan'].forEach((tabKey) => {
      document.getElementById(`tabBtn-${tabKey}`)?.addEventListener('click', () => switchTab(tabKey));
      document.getElementById(`tabBtn-${tabKey}-mob`)?.addEventListener('click', () => switchTab(tabKey));
    });

    document.getElementById('filterMapelGrafikSiswa')?.addEventListener('change', () => {
      renderDashboardPerkembanganSiswa();
    });

    document.getElementById('filterMapelMateriSiswa')?.addEventListener('change', () => {
      renderDaftarMateriSiswa();
    });

    document.getElementById('btnStartScan')?.addEventListener('click', startScanner);
    document.getElementById('btnStopScan')?.addEventListener('click', stopScanner);
    document.getElementById('btnPerbaruiTugasGuru')?.addEventListener('click', () => {
      animasiPutarIkon('iconRefreshDaftarTugas');
      loadDaftarTugasGuru();
      loadDaftarMateriSiswa();
      loadRiwayat();
      muatUlangNotifikasiSiswa();
      showToast('Data tugas, materi pelajaran & riwayat nilai diperbarui.', 'info');
    });
    document.getElementById('btnSegarkanRiwayat')?.addEventListener('click', () => {
      animasiPutarIkon('iconRefreshAbsen');
      loadRiwayat();
      loadRiwayatIzin();
      showToast('Data riwayat kehadiran & izin diperbarui.', 'info');
    });

    document.getElementById('tugasForm')?.addEventListener('submit', submitTugasSiswa);
    document.getElementById('izinForm')?.addEventListener('submit', submitIzinSiswa);
  }

  // ==========================================================================
  // 3. AUTENTIKASI SISWA, SINKRONISASI HEADER & FUNGSI RESET LOGO
  // ==========================================================================

  function resetKeTampilanAwalSiswa() {
    tutupModalScanQR();
    tutupModalFormIzin();
    tutupModalKirimTugas();
    tutupModalTeksDoaSiswa();
    tutupBottomSheetPengumuman();
    document.getElementById('userDropdownMenuSiswa')?.classList.add('hidden');
    document.getElementById('popoverNotifDesktop')?.classList.add('hidden');

    if (currentStudent) {
      dtStateAbsenSiswa.page = 1;
      dtStateAbsenSiswa.search = '';
      dtStateIzinSiswa.page = 1;
      dtStateIzinSiswa.search = '';
      dtStateTugasSiswa.page = 1;
      dtStateTugasSiswa.search = '';

      switchTab('presensi');
      switchPresensiTab('riwayat');
      switchTugasTab('daftar');
      loadRiwayat();
      loadRiwayatIzin();
      loadDaftarTugasGuru();
      loadDaftarMateriSiswa();
      muatUlangNotifikasiSiswa();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Tampilan dashboard disegarkan ke halaman awal.', 'info');
    } else {
      switchAuthTab('masuk');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function switchAuthTab(type) {
    Auth.switchTabFormAuth(type, {
      formMasukId: 'formMasuk',
      formDaftarId: 'formDaftar',
      btnMasukId: 'authTabBtn-masuk',
      btnDaftarId: 'authTabBtn-daftar',
      activeMasukColor: 'bg-blue-700',
    });
  }

  async function prosesMasukSiswa(e) {
    e.preventDefault();
    const nis = document.getElementById('loginNis').value.trim();
    const btn = document.getElementById('btnSubmitMasuk');
    setTombolLoading(btn, true, 'Memverifikasi...');

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
        showToast(`Selamat belajar, ${currentStudent.nama}!`, 'success');
        showDashboard();
      } else {
        showToast(result.message || 'NIS tidak ditemukan.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  async function prosesDaftarSiswa(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitDaftar');
    setTombolLoading(btn, true, 'Mendaftarkan...');

    const payload = {
      nis: document.getElementById('regNis').value.trim(),
      nama: document.getElementById('regNama').value.trim(),
      kelas: document.getElementById('regKelas').value,
      jk: document.getElementById('regJk').value,
      ortu: document.getElementById('regOrtu').value.trim(),
      nohp: document.getElementById('regNohp').value.trim(),
      token: document.getElementById('regToken')?.value.trim() || '',
      aksi: 'register',
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
        showToast('Registrasi berhasil! Selamat datang di SiBintang.', 'success');
        showDashboard();
      } else {
        showToast(result.message || 'Gagal mendaftarkan akun.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  function updateHeaderUI(isLoggedIn) {
    document.documentElement.setAttribute('data-auth-state', isLoggedIn ? 'authenticated' : 'guest');

    const container = document.getElementById('headerSiswaContainer');
    const guestBadge = document.getElementById('headerGuestBadge');
    const userDropdown = document.getElementById('userProfileDropdownWrapSiswa');
    const notifWrap = document.getElementById('notifWrapSiswa');
    const navDesk = document.getElementById('navSiswaDesktop');
    const navMob = document.getElementById('navSiswaMobile');

    if (isLoggedIn) {
      if (container) container.className = 'w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6';
      if (guestBadge) guestBadge.classList.add('hidden');
      if (userDropdown) userDropdown.classList.remove('hidden');
      if (notifWrap) notifWrap.classList.remove('hidden');
      if (navDesk)
        navDesk.className =
          'hidden md:flex items-center gap-1.5 bg-indigo-900/60 p-1 rounded-2xl border border-indigo-800/60 transition-all';
      if (navMob)
        navMob.className = 'grid md:hidden pb-2 pt-1 grid-cols-3 gap-1.5 border-t border-indigo-900/50';
    } else {
      if (container) container.className = 'w-full max-w-md mx-auto px-4 sm:px-0';
      if (guestBadge) guestBadge.classList.remove('hidden');
      if (userDropdown) userDropdown.classList.add('hidden');
      if (notifWrap) notifWrap.classList.add('hidden');
      if (navDesk) navDesk.className = 'hidden';
      if (navMob) navMob.className = 'hidden';
    }

    if (typeof aturTampilanPasangPWA === 'function') {
      aturTampilanPasangPWA(isLoggedIn, 'siswaHeaderRight', 'Siswa');
    }
  }

  function showDashboard() {
    document.getElementById('loginSection')?.classList.add('hidden');
    document.getElementById('appSection')?.classList.remove('hidden');
    updateHeaderUI(true);

    const namaSiswa = currentStudent?.nama || 'Siswa';
    const kelasSiswa = currentStudent?.kelas || '-';
    const nisSiswa = currentStudent?.nis || '-';

    const pillName = document.getElementById('headerUserPillNameSiswa');
    const pillRole = document.getElementById('headerUserPillRoleSiswa');
    const initial = document.getElementById('headerAvatarInitialSiswa');
    if (pillName) pillName.textContent = namaSiswa.split(' ').slice(0, 2).join(' ');
    if (pillRole) pillRole.textContent = `Kelas ${kelasSiswa}`;
    if (initial) initial.textContent = (namaSiswa.trim()[0] || 'S').toUpperCase();

    const ddNama = document.getElementById('dropdownNamaLengkapSiswa');
    const ddDetail = document.getElementById('dropdownPeranDetailSiswa');
    if (ddNama) ddNama.textContent = namaSiswa;
    if (ddDetail) ddDetail.textContent = `NIS: ${nisSiswa} | Kelas: ${kelasSiswa}`;

    const linkLintasGuru = document.getElementById('linkLintasPortalGuru');
    if (linkLintasGuru) {
      const isSuper =
        Boolean(currentStudent?.isAdminPortal) ||
        ['ADMIN', 'KEPSEK', 'OPERATOR'].includes(String(nisSiswa).toUpperCase()) ||
        Boolean(Auth.getGuru());
      linkLintasGuru.classList.toggle('hidden', !isSuper);
    }

    const inputKelasTugas = document.getElementById('tugasKelas');
    if (inputKelasTugas) inputKelasTugas.value = `Kelas ${kelasSiswa}`;

    // Muat daftar materi yang pernah ditandai selesai dari penyimpanan lokal
    try {
      const savedRead = JSON.parse(
        localStorage.getItem(`sibintang_materi_baca_${nisSiswa}`) || '[]'
      );
      if (Array.isArray(savedRead)) {
        cacheMateriDibacaSet = new Set(savedRead);
      }
    } catch {}

    switchTab('presensi');
    switchPresensiTab('riwayat');
    switchTugasTab('daftar');
    loadRiwayat();
    loadRiwayatIzin();
    loadDaftarTugasGuru();
    loadDaftarMateriSiswa();
    muatUlangNotifikasiSiswa();
  }

  async function logout() {
    const yakin = await konfirmasiModal({
      judul: 'Keluar Portal Siswa',
      pesan: 'Apakah Anda yakin ingin keluar dari akun ini?',
      teksKonfirmasi: 'Ya, Keluar',
      tipe: 'warning',
    });
    if (!yakin) return;

    await stopScanner();
    Auth.logoutSiswa();
    currentStudent = null;
    document.getElementById('appSection')?.classList.add('hidden');
    document.getElementById('loginSection')?.classList.remove('hidden');
    updateHeaderUI(false);
  }

  // ==========================================================================
  // 4. NAVIGASI MENU UTAMA (PRESENSI, TUGAS & MATERI, PERKEMBANGAN & PROFIL)
  // ==========================================================================
  function switchTab(tab) {
    ['presensi', 'tugas', 'perkembangan'].forEach((key) => {
      document.getElementById(`tabContent-${key}`)?.classList.toggle('hidden', key !== tab);

      const btnDesk = document.getElementById(`tabBtn-${key}`);
      const btnMob = document.getElementById(`tabBtn-${key}-mob`);
      const isActive = key === tab;

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

    if (tab !== 'presensi') {
      stopScanner();
    }
    if (tab === 'tugas') {
      loadDaftarTugasGuru();
      loadDaftarMateriSiswa();
      renderTabelTugasKumpul();
    } else if (tab === 'perkembangan') {
      renderDashboardPerkembanganSiswa();
    }
  }

  function switchPresensiTab(sub) {
    const subRiwayat = document.getElementById('presensiSubContent-riwayat');
    const subIzin = document.getElementById('presensiSubContent-izin');

    subRiwayat?.classList.toggle('hidden', sub !== 'riwayat');
    subIzin?.classList.toggle('hidden', sub !== 'izin');

    terapkanGayaTab(
      {
        riwayat: 'presensiTabBtn-riwayat',
        izin: 'presensiTabBtn-izin',
      },
      sub
    );

    if (sub === 'riwayat') {
      renderTabelAbsensi();
    } else {
      renderTabelIzin();
    }
  }

  function switchTugasTab(sub) {
    const mode = sub === 'riwayat' || sub === 'kirim' ? 'riwayat' : sub === 'materi' ? 'materi' : 'daftar';
    const subDaftar = document.getElementById('tugasSubContent-daftar');
    const subMateri = document.getElementById('tugasSubContent-materi');
    const subRiwayat = document.getElementById('tugasSubContent-riwayat');

    subDaftar?.classList.toggle('hidden', mode !== 'daftar');
    subMateri?.classList.toggle('hidden', mode !== 'materi');
    subRiwayat?.classList.toggle('hidden', mode !== 'riwayat');

    terapkanGayaTab(
      {
        daftar: 'tugasTabBtn-daftar',
        materi: 'tugasTabBtn-materi',
        riwayat: 'tugasTabBtn-riwayat',
      },
      mode
    );

    if (mode === 'materi') {
      loadDaftarMateriSiswa();
    } else if (mode === 'riwayat') {
      renderTabelTugasKumpul();
    }
  }

  // ==========================================================================
  // 5. DASHBOARD GRAFIK PERKEMBANGAN NILAI, KEHADIRAN & BIODATA SISWA
  // ==========================================================================
  async function muatUlangPerkembanganSiswa() {
    animasiPutarIkon('iconRefreshPerkembanganSiswa');
    await Promise.all([loadRiwayat(), loadRiwayatIzin()]);
    renderDashboardPerkembanganSiswa();
    showToast('Grafik perkembangan nilai & kehadiran diperbarui.', 'info');
  }

  function renderDashboardPerkembanganSiswa() {
    if (!currentStudent) return;

    const settings = typeof Auth !== 'undefined' ? Auth.getSettings() : {};
    const schoolCfg = settings.schoolConfig || {
      tahunAjaran: '2026/2027',
      semester: 'Ganjil',
      kkmNilai: 75,
    };
    const kkm = Number(schoolCfg.kkmNilai) || 75;

    const nama = currentStudent.nama || 'Siswa';
    const nis = currentStudent.nis || '-';
    const kelas = currentStudent.kelas || '-';
    const jkLabel =
      currentStudent.jk === 'P'
        ? 'Perempuan (P)'
        : currentStudent.jk === 'L'
          ? 'Laki-laki (L)'
          : currentStudent.jk || '-';
    const ortu = currentStudent.ortu || '-';
    const nohp = currentStudent.nohp || '-';

    const elAvatar = document.getElementById('profilAvatarBesar');
    const elNama = document.getElementById('profilNamaSiswa');
    const elNisKelas = document.getElementById('profilNisKelas');
    const elJk = document.getElementById('profilJkSiswa');
    const elTa = document.getElementById('profilTahunAjaran');
    const elOrtu = document.getElementById('profilOrtuSiswa');
    const elNohp = document.getElementById('profilNohpSiswa');

    if (elAvatar) elAvatar.textContent = (nama.trim()[0] || 'S').toUpperCase();
    if (elNama) elNama.textContent = nama;
    if (elNisKelas) elNisKelas.textContent = `NIS: ${nis} • Kelas ${kelas}`;
    if (elJk) elJk.textContent = jkLabel;
    if (elTa) elTa.textContent = `${schoolCfg.tahunAjaran} (${schoolCfg.semester})`;
    if (elOrtu) elOrtu.textContent = ortu;
    if (elNohp) elNohp.textContent = nohp;

    const jmlHadir = cacheAbsensiRaw.filter(
      (a) => !a.status || a.status.toLowerCase() === 'hadir'
    ).length;
    const jmlIzinAbsen = cacheAbsensiRaw.filter(
      (a) => (a.status || '').toLowerCase() === 'izin'
    ).length;
    const jmlSakitAbsen = cacheAbsensiRaw.filter(
      (a) => (a.status || '').toLowerCase() === 'sakit'
    ).length;

    const jmlIzinForm = cacheIzinRaw.filter((i) => (i.status || '').toLowerCase() === 'izin').length;
    const jmlSakitForm = cacheIzinRaw.filter((i) => (i.status || '').toLowerCase() === 'sakit').length;

    const totalIzin = Math.max(jmlIzinAbsen, jmlIzinForm);
    const totalSakit = Math.max(jmlSakitAbsen, jmlSakitForm);
    const totalCatatan = jmlHadir + totalIzin + totalSakit;
    const persenHadir = totalCatatan > 0 ? Math.round((jmlHadir / totalCatatan) * 100) : 100;
    const persenIzin = totalCatatan > 0 ? Math.round((totalIzin / totalCatatan) * 100) : 0;
    const persenSakit = Math.max(0, 100 - persenHadir - persenIzin);

    const elJmlHadir = document.getElementById('statJmlHadir');
    const elJmlIzin = document.getElementById('statJmlIzin');
    const elJmlSakit = document.getElementById('statJmlSakit');
    const elPersen = document.getElementById('teksPersenKehadiran');
    const elBadgeHadir = document.getElementById('badgePredikatKehadiran');
    const barHadir = document.getElementById('barHadirSiswa');
    const barIzin = document.getElementById('barIzinSiswa');
    const barSakit = document.getElementById('barSakitSiswa');

    if (elJmlHadir) elJmlHadir.textContent = String(jmlHadir);
    if (elJmlIzin) elJmlIzin.textContent = String(totalIzin);
    if (elJmlSakit) elJmlSakit.textContent = String(totalSakit);
    if (elPersen) elPersen.textContent = `${persenHadir}% (${jmlHadir} dari ${totalCatatan || jmlHadir} catatan)`;
    if (elBadgeHadir) {
      const predikat =
        persenHadir >= 90 ? 'Sangat Disiplin' : persenHadir >= 75 ? 'Baik' : 'Perlu Perhatian';
      elBadgeHadir.textContent = `Kehadiran ${persenHadir}% • ${predikat}`;
    }
    if (barHadir) barHadir.style.width = `${persenHadir}%`;
    if (barIzin) barIzin.style.width = `${persenIzin}%`;
    if (barSakit) barSakit.style.width = `${persenSakit}%`;

    const filterMapel = document.getElementById('filterMapelGrafikSiswa')?.value || 'SEMUA';
    const tugasFiltered = cacheTugasRaw.filter(
      (t) => !filterMapel || filterMapel === 'SEMUA' || t.mapel === filterMapel
    );

    const tugasDinilai = tugasFiltered
      .filter((t) => t.nilai !== '' && t.nilai !== null && t.nilai !== undefined && !isNaN(Number(t.nilai)))
      .map((t) => ({
        ...t,
        nilaiNum: Number(t.nilai),
      }))
      .reverse();

    const jmlDinilai = tugasDinilai.length;
    const rataNilai =
      jmlDinilai > 0
        ? Math.round(
            (tugasDinilai.reduce((acc, cur) => acc + cur.nilaiNum, 0) / jmlDinilai) * 10
          ) / 10
        : 0;

    let nilaiMax = 0;
    let mapelMax = '-';
    tugasDinilai.forEach((t) => {
      if (t.nilaiNum >= nilaiMax) {
        nilaiMax = t.nilaiNum;
        mapelMax = `${t.mapel} (${t.judul})`;
      }
    });

    const elRata = document.getElementById('kpiRataNilaiSiswa');
    const elPredikat = document.getElementById('kpiPredikatNilaiSiswa');
    const elMax = document.getElementById('kpiNilaiTertinggiSiswa');
    const elMapelMax = document.getElementById('kpiMapelTertinggiSiswa');
    const elJmlDinilai = document.getElementById('kpiJmlTugasDinilai');
    const elTotalKumpul = document.getElementById('kpiTotalTugasTerkumpul');
    const elKkm = document.getElementById('kpiNilaiKKMSekolah');
    const elStatusKkm = document.getElementById('kpiStatusTuntasKKM');

    if (elRata) elRata.textContent = jmlDinilai > 0 ? String(rataNilai) : '-';
    if (elPredikat) {
      if (jmlDinilai === 0) {
        elPredikat.textContent = 'Menunggu penilaian guru';
      } else if (rataNilai >= 90) {
        elPredikat.textContent = 'Predikat A (Sangat Baik)';
      } else if (rataNilai >= kkm) {
        elPredikat.textContent = 'Predikat B (Tuntas Baik)';
      } else {
        elPredikat.textContent = 'Predikat C (Perlu Bimbingan)';
      }
    }
    if (elMax) elMax.textContent = jmlDinilai > 0 ? String(nilaiMax) : '-';
    if (elMapelMax) elMapelMax.textContent = mapelMax;
    if (elJmlDinilai) elJmlDinilai.textContent = String(jmlDinilai);
    if (elTotalKumpul) elTotalKumpul.textContent = `dari ${tugasFiltered.length} tugas`;
    if (elKkm) elKkm.textContent = String(kkm);
    if (elStatusKkm) {
      const isTuntas = jmlDinilai === 0 || rataNilai >= kkm;
      elStatusKkm.textContent = jmlDinilai === 0 ? 'Standar' : isTuntas ? 'Tuntas KKM' : 'Di Bawah KKM';
      elStatusKkm.className = isTuntas
        ? 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800'
        : 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800';
    }

    const chartContainer = document.getElementById('containerGrafikNilaiSiswa');
    if (chartContainer) {
      if (jmlDinilai === 0) {
        chartContainer.innerHTML = `
          <div class="text-center py-8 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <p class="text-xs font-bold text-slate-600">Belum ada tugas yang dinilai pada filter mata pelajaran ini.</p>
            <p class="text-[11px] text-slate-400">Grafik akan otomatis muncul setelah guru memberikan nilai pada tugas yang kamu kumpulkan.</p>
          </div>
        `;
      } else {
        const barsHtml = tugasDinilai
          .map((item, idx) => {
            const pct = Math.min(100, Math.max(12, item.nilaiNum));
            const isPass = item.nilaiNum >= kkm;
            const barColor = isPass
              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 border-emerald-500'
              : 'bg-gradient-to-t from-amber-600 to-amber-400 border-amber-500';
            const shortMapel = String(item.mapel || '')
              .replace(/\([^)]*\)/g, '')
              .trim()
              .split(' ')
              .slice(0, 2)
              .join(' ');
            const tglShort = String(item.waktu || '').split(' ')[0] || `Tugas ${idx + 1}`;

            return `
              <div class="flex flex-col items-center justify-end h-48 flex-1 min-w-[54px] max-w-[90px] group relative">
                <div class="mb-1 px-2 py-0.5 rounded-lg text-[11px] font-black ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} shadow-2xs">
                  ${item.nilaiNum}
                </div>
                <div class="w-full h-36 bg-slate-200/70 rounded-2xl p-1 flex items-end relative overflow-hidden border border-slate-200">
                  <div class="w-full ${barColor} rounded-xl transition-all duration-500 shadow-sm" style="height: ${pct}%" title="${escapeHtml(item.mapel)} - ${escapeHtml(item.judul)} (Nilai: ${item.nilaiNum})"></div>
                </div>
                <div class="mt-2 text-center w-full">
                  <p class="text-[10px] font-extrabold text-slate-700 truncate" title="${escapeHtml(item.judul)}">${escapeHtml(shortMapel)}</p>
                  <p class="text-[9px] text-slate-400 font-mono truncate">${escapeHtml(tglShort)}</p>
                </div>
              </div>
            `;
          })
          .join('');

        chartContainer.innerHTML = `
          <div class="w-full overflow-x-auto pb-1">
            <div class="relative flex items-end justify-start sm:justify-around gap-3 min-w-[280px] pt-3 px-2">
              ${barsHtml}
            </div>
          </div>
        `;
      }
    }

    const mapelContainer = document.getElementById('containerRekapMapelSiswa');
    if (mapelContainer) {
      const grupMapel = {};
      cacheTugasRaw.forEach((t) => {
        if (t.nilai === '' || t.nilai === null || t.nilai === undefined || isNaN(Number(t.nilai))) return;
        const m = t.mapel || 'Lainnya';
        if (!grupMapel[m]) grupMapel[m] = [];
        grupMapel[m].push(Number(t.nilai));
      });

      const entriesMapel = Object.entries(grupMapel);
      if (entriesMapel.length === 0) {
        mapelContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Belum ada rekap nilai per mata pelajaran.</p>`;
      } else {
        mapelContainer.innerHTML = entriesMapel
          .map(([namaMapel, nilaiArr]) => {
            const avg = Math.round((nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length) * 10) / 10;
            const pred = avg >= 90 ? 'A' : avg >= kkm ? 'B' : 'C';
            const badgeCls =
              avg >= kkm
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-amber-100 text-amber-800 border-amber-200';
            const barCls = avg >= kkm ? 'bg-indigo-600' : 'bg-amber-500';

            return `
              <div class="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-slate-800 truncate" title="${escapeHtml(namaMapel)}">${escapeHtml(namaMapel)}</span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span class="text-[10px] text-slate-400 font-semibold">${nilaiArr.length} tugas</span>
                    <span class="px-2 py-0.5 rounded-lg text-[11px] font-black border ${badgeCls}">${avg} (${pred})</span>
                  </div>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full ${barCls} rounded-full transition-all duration-500" style="width: ${Math.min(100, avg)}%"></div>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }
  }

  function eksporPerkembanganSiswa(format = 'pdf') {
    if (!currentStudent) return;
    const headers = [
      'No',
      'Waktu Upload',
      'Mata Pelajaran',
      'Materi / Bab',
      'Judul Tugas',
      'Nilai',
      'Catatan Evaluasi Guru',
    ];
    const rows = cacheTugasRaw.map((t, idx) => [
      idx + 1,
      t.waktu || '-',
      t.mapel || '-',
      t.materi || '-',
      t.judul || '-',
      t.nilai !== '' && t.nilai !== undefined && t.nilai !== null ? String(t.nilai) : 'Belum Dinilai',
      t.catatan || '-',
    ]);

    const title = `LAPORAN PERKEMBANGAN NILAI TUGAS & KEHADIRAN SISWA`;
    const subtitle = `Nama: ${currentStudent.nama} (NIS: ${currentStudent.nis}) | Kelas: ${currentStudent.kelas}`;
    const cleanName = (currentStudent.nama || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_');

    if (format === 'xlsx') {
      unduhDataXLSX({
        filename: `Perkembangan_Nilai_${cleanName}_Kelas_${currentStudent.kelas}.xlsx`,
        title,
        subtitle,
        headers,
        rows,
      });
      showToast('Berkas Excel (.xlsx) perkembangan nilai berhasil diunduh.', 'success');
    } else {
      eksporTabelKePDF({
        filename: `Perkembangan_Nilai_${cleanName}_Kelas_${currentStudent.kelas}.pdf`,
        title,
        subtitle,
        headers,
        rows,
        signerRole: 'Orang Tua / Wali Murid',
        signerName: currentStudent.ortu || '________________________',
      });
    }
  }

  // ==========================================================================
  // 6. PEMINDAI KAMERA QR CODE (ANIMASI LASER) & PENGAJUAN IZIN RENTANG TANGGAL
  // ==========================================================================
  function tampilkanOverlayKameraAktif(modeSimulasi = false) {
    const guidePlaceholder = document.getElementById('scannerGuidePlaceholder');
    const activeOverlay = document.getElementById('scannerActiveOverlay');
    const badgeStatus = document.getElementById('badgeStatusKamera');

    if (guidePlaceholder) guidePlaceholder.classList.add('hidden');
    if (activeOverlay) activeOverlay.classList.remove('hidden');
    if (badgeStatus) {
      badgeStatus.className =
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
      badgeStatus.innerHTML =
        '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Memindai QR...';
    }
    document.getElementById('btnStartScan')?.classList.add('hidden');
    document.getElementById('btnStopScan')?.classList.remove('hidden');

    if (modeSimulasi) {
      simulasiKameraAktif = true;
      const readerEl = document.getElementById('reader');
      if (readerEl) {
        const kls = currentStudent?.kelas || '1A';
        const tgl = new Date().toISOString().split('T')[0];
        const qrSim = `ABSEN-SIBINTANG|${kls}|${tgl}|Absen Pagi`;
        readerEl.innerHTML = `
          <div class="w-full h-full flex flex-col items-center justify-end pb-3 px-3 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white text-center">
            <button type="button" onclick="simulasikanScanQRSiswa('${qrSim}')" class="relative z-30 pointer-events-auto bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl shadow-lg border border-emerald-400/40 transition cursor-pointer">
              Simulasikan Scan QR Kelas ${escapeHtml(kls)}
            </button>
          </div>
        `;
      }
    }
  }

  async function simulasikanScanQRSiswa(qrPayload) {
    await stopScanner();
    kirimAbsensi(qrPayload);
  }

  function startScanner() {
    const alertBox = document.getElementById('absenAlert');
    if (alertBox) alertBox.classList.add('hidden');

    if (typeof Html5Qrcode === 'undefined') {
      tampilkanOverlayKameraAktif(true);
      return;
    }

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('reader');
    }

    const onScanSuccess = async (decodedText) => {
      await stopScanner();
      kirimAbsensi(decodedText);
    };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 190, height: 190 } },
        onScanSuccess,
        () => {}
      )
      .then(() => tampilkanOverlayKameraAktif(false))
      .catch(() => {
        html5QrCode
          .start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 190, height: 190 } },
            onScanSuccess,
            () => {}
          )
          .then(() => tampilkanOverlayKameraAktif(false))
          .catch(() => {
            tampilkanOverlayKameraAktif(true);
            showToast('Mode simulasi pemindai QR diaktifkan.', 'info');
          });
      });
  }

  async function stopScanner() {
    try {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
        html5QrCode.clear();
      }
    } catch {}

    if (simulasiKameraAktif) {
      simulasiKameraAktif = false;
      const readerEl = document.getElementById('reader');
      if (readerEl) readerEl.innerHTML = '';
    }

    const guidePlaceholder = document.getElementById('scannerGuidePlaceholder');
    const activeOverlay = document.getElementById('scannerActiveOverlay');
    const badgeStatus = document.getElementById('badgeStatusKamera');

    if (guidePlaceholder) guidePlaceholder.classList.remove('hidden');
    if (activeOverlay) activeOverlay.classList.add('hidden');
    if (badgeStatus) {
      badgeStatus.className =
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200';
      badgeStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Kamera Standby';
    }

    document.getElementById('btnStartScan')?.classList.remove('hidden');
    document.getElementById('btnStopScan')?.classList.add('hidden');
  }

  async function kirimAbsensi(qrCodeData) {
    const alertBox = document.getElementById('absenAlert');
    if (alertBox) {
      alertBox.className =
        'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-blue-50 text-blue-700 flex items-center justify-center gap-2 transition-all';
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
        if (kelasQR && kelasQR !== 'SEMUA' && kelasSiswa && kelasQR !== kelasSiswa) {
          throw new Error(`QR ini khusus Kelas ${kelasQR}. Anda terdaftar di Kelas ${kelasSiswa}.`);
        }
      }

      if (!navigator.onLine) {
        if (typeof simpanKeAntreanOffline === 'function') {
          simpanKeAntreanOffline(payload);
        }
        bunyikanBeep('success');
        if (alertBox) {
          alertBox.className =
            'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-amber-100 text-amber-800 flex items-center justify-center gap-2 transition-all';
          alertBox.innerHTML = `${ICONS.info}<span>Tersimpan di antrean offline. Akan terkirim otomatis saat online.</span>`;
        }
        showToast('Koneksi offline: Data kehadiran disimpan di perangkat.', 'warning');
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
          alertBox.className =
            'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800 flex items-center justify-center gap-2 transition-all';
          alertBox.innerHTML = `${ICONS.check}<span>${escapeHtml(result.message)} (${escapeHtml(result.waktu)})</span>`;
        }
        showToast(result.message || 'Absensi berhasil dicatat!', 'success');
        loadRiwayat();
      } else {
        throw new Error(result.message || 'Gagal memproses absensi.');
      }
    } catch (err) {
      bunyikanBeep('error');
      if (alertBox) {
        alertBox.className =
          'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-700 flex items-center justify-center gap-2 transition-all';
        alertBox.innerHTML = `${ICONS.error}<span>Gagal: ${escapeHtml(err.message || 'Kesalahan server')}</span>`;
      }
      showToast(err.message || 'Gagal mencatat absensi.', 'error');
    }
  }

  async function submitIzinSiswa(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitIzin');
    const alertBox = document.getElementById('izinAlert');
    const fileInput = document.getElementById('fileBukti')?.files?.[0];
    const statusIzinVal = document.getElementById('statusIzin')?.value || 'Izin';
    const rawMulai = document.getElementById('tanggalMulai')?.value || '';
    const rawSelesai = document.getElementById('tanggalSelesai')?.value || rawMulai;

    if (rawSelesai && rawMulai && rawSelesai < rawMulai) {
      showToast('Tanggal selesai tidak boleh sebelum tanggal mulai!', 'error');
      return;
    }

    const tanggalTerformat =
      typeof formatRentangTanggalIndo === 'function'
        ? formatRentangTanggalIndo(rawMulai, rawSelesai)
        : rawMulai;

    setTombolLoading(btn, true, 'Memproses berkas...');
    alertBox.classList.add('hidden');

    try {
      let linkBukti = '-';
      if (fileInput) {
        showToast('Mengunggah bukti surat izin ke Google Drive...', 'info');
        setTombolLoading(btn, true, 'Mengunggah ke Drive...');

        const cleanNama = (currentStudent?.nama || 'Siswa').replace(/\s+/g, '_');
        const cleanKelas = (currentStudent?.kelas || 'Kelas').replace(/\s+/g, '_');
        const cleanStatus = statusIzinVal.replace(/\s+/g, '_');
        const timestamp = Math.floor(Date.now() / 1000);
        const namaFileKustom = `Surat${cleanStatus}_${cleanNama}_${cleanKelas}_${timestamp}`;
        const namaSubFolder = `Surat_Izin_${cleanKelas}`;

        linkBukti = await uploadFileKeDrivePribadi(fileInput, namaFileKustom, namaSubFolder);
      }

      setTombolLoading(btn, true, 'Mengirim permohonan...');
      const res = await fetch('/api/izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: currentStudent.nis,
          nama: currentStudent.nama,
          kelas: currentStudent.kelas,
          statusIzin: statusIzinVal,
          tanggalMulai: tanggalTerformat,
          keterangan: document.getElementById('keteranganIzin').value.trim(),
          link: linkBukti,
          linkBukti,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alertBox.className =
          'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5';
        alertBox.innerHTML = `${ICONS.check}<span>${escapeHtml(result.message || 'Pengajuan izin berhasil terkirim!')}</span>`;
        alertBox.classList.remove('hidden');

        showToast(`Pengajuan izin (${tanggalTerformat}) terkirim!`, 'success');
        document.getElementById('izinForm').reset();
        inisialisasiRentangTanggalIzin();

        loadRiwayatIzin();
        setTimeout(() => {
          tutupModalFormIzin();
          switchPresensiTab('izin');
        }, 900);
      } else {
        throw new Error(result.message || result.error);
      }
    } catch (err) {
      alertBox.className =
        'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5';
      alertBox.innerHTML = `${ICONS.error}<span>Gagal mengirim izin: ${escapeHtml(err.message || 'Kesalahan jaringan')}</span>`;
      alertBox.classList.remove('hidden');
      showToast('Gagal mengirim izin.', 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  // ==========================================================================
  // 7. DAFTAR TUGAS, MATERI PELAJARAN & PENGUMPULAN KE GOOGLE DRIVE
  // ==========================================================================
  async function loadDaftarTugasGuru() {
    if (!currentStudent) return;
    const container = document.getElementById('containerDaftarTugasGuru');
    if (!container) return;

    try {
      const [resSoal, resRiwayat] = await Promise.all([
        fetch(`/api/guru/tugas?kelas=${encodeURIComponent(currentStudent.kelas)}`),
        fetch(`/api/riwayat/${currentStudent.nis}`).catch(() => null),
      ]);

      const result = await resSoal.json();
      const tugasList = result.daftarSoal || result.bankSoal || result.data || result.daftarTugas || [];

      let riwayatTugasKumpul = [];
      if (resRiwayat && resRiwayat.ok) {
        const dataRiwayat = await resRiwayat.json();
        riwayatTugasKumpul = (dataRiwayat.tugas || []).map((t) => {
          const m = (t.mapel || '').trim().toLowerCase();
          const j = (t.judul || '').trim().toLowerCase();
          return `${m}:::${j}`;
        });
      }

      if (!result.success || tugasList.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
            <div class="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-slate-800">Belum ada tugas terbaru dari guru</h4>
              <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">Saat ini belum ada tugas atau PR aktif untuk Kelas ${escapeHtml(currentStudent.kelas)}. Silakan periksa kembali nanti.</p>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = tugasList
        .map((t) => {
          const safeJudul = (t.judul || '').replace(/'/g, "\\'");
          const safeMapel = (t.mapel || '').replace(/'/g, "\\'");
          const safeMateri = (t.materi || '').replace(/'/g, "\\'");

          const keyTugas = `${(t.mapel || '').trim().toLowerCase()}:::${(t.judul || '').trim().toLowerCase()}`;
          const keyTugasWithMateri = `${(t.mapel || '').trim().toLowerCase()}:::[${(t.materi || '').trim().toLowerCase()}] ${(t.judul || '').trim().toLowerCase()}`;
          const sudahKumpul =
            riwayatTugasKumpul.includes(keyTugas) || riwayatTugasKumpul.includes(keyTugasWithMateri);

          const fileLinkBtn =
            t.link && t.link !== '-' && t.link !== '#'
              ? `<a href="${t.link}" target="_blank" rel="noopener noreferrer" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">${ICONS.fileDoc || ''}<span>Buka File Soal</span>${ICONS.external}</a>`
              : '';

          let urlMateri = t.linkMateri || t.linkExternal || t.linkYoutube || t.video || '';
          if (!urlMateri && t.link && (t.link.includes('youtu.be') || t.link.includes('youtube.com'))) {
            urlMateri = t.link;
          }

          const isYt = getYouTubeId(urlMateri);
          const ytEmbed = isYt ? renderYouTubeEmbed(urlMateri) : '';
          const ytLinkBtn = isYt
            ? `<a href="${urlMateri}" target="_blank" rel="noopener noreferrer" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">${ICONS.youtube || ''}<span>Tonton di YouTube</span>${ICONS.external}</a>`
            : '';

          const webMateriBtn =
            !isYt && urlMateri && urlMateri !== '-' && urlMateri !== '#'
              ? `<a href="${urlMateri}" target="_blank" rel="noopener noreferrer" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">
                   ${ICONS.globe || ''}
                   <span>Buka Tautan Materi</span>
                   ${ICONS.external}
                 </a>`
              : '';

          const materiBadge = t.materi
            ? `<span class="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">${escapeHtml(t.materi)}</span>`
            : '';

          if (sudahKumpul) {
            return `
              <div class="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 space-y-2.5 transition-all">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">${escapeHtml(t.mapel)}</span>
                    ${materiBadge}
                  </div>
                  <span class="text-[11px] text-slate-400 font-medium">Batas Waktu: ${escapeHtml(t.deadline || '-')}</span>
                </div>
                <h4 class="text-sm font-black text-slate-800">${escapeHtml(t.judul)}</h4>
                <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(t.deskripsi || '-')}</p>
                ${ytEmbed}
                <div class="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-emerald-200/60">
                  <div class="flex items-center gap-1.5 flex-wrap">${fileLinkBtn} ${ytLinkBtn} ${webMateriBtn}</div>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-200/80 text-emerald-800 text-xs font-bold ml-auto">
                    <svg class="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Sudah Dikerjakan</span>
                  </span>
                </div>
              </div>
            `;
          }

          return `
            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5 transition-all">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md">${escapeHtml(t.mapel)}</span>
                  ${materiBadge}
                </div>
                <span class="text-[11px] text-slate-500 font-medium">Batas Waktu: ${escapeHtml(t.deadline || '-')}</span>
              </div>
              <h4 class="text-sm font-black text-slate-800">${escapeHtml(t.judul)}</h4>
              <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(t.deskripsi || '-')}</p>
              ${ytEmbed}
              <div class="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-slate-200/60">
                <div class="flex items-center gap-1.5 flex-wrap">${fileLinkBtn} ${ytLinkBtn} ${webMateriBtn}</div>
                <button type="button" onclick="pilihTugas('${safeJudul}', '${safeMapel}', '${safeMateri}')" class="cursor-pointer text-xs bg-indigo-900 hover:bg-indigo-950 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-sm border border-indigo-700/50 inline-flex items-center gap-1.5 ml-auto">
                  <svg class="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  <span>Kumpul Tugas Ini</span>
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    } catch {
      container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Gagal memuat daftar tugas terbaru.</p>`;
    }
  }

  /**
   * Memuat & Merender Daftar Materi Pelajaran dari Guru pada Sub-Tab "Materi Pelajaran"
   */
  async function loadDaftarMateriSiswa() {
    if (!currentStudent) return;
    try {
      const res = await fetch(`/api/materi?kelas=${encodeURIComponent(currentStudent.kelas)}`);
      const result = await res.json();
      if (result.success) {
        cacheMateriAjarSiswa = result.daftarMateri || [];
        if (Array.isArray(result.logBaca)) {
          result.logBaca.forEach((log) => {
            if (String(log.nis) === String(currentStudent.nis) && log.materiTerakhir && log.materiTerakhir !== '-') {
              cacheMateriDibacaSet.add(log.materiTerakhir);
            }
          });
        }
        renderDaftarMateriSiswa();
      }
    } catch {
      const container = document.getElementById('containerDaftarMateriSiswa');
      if (container) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Gagal memuat materi pelajaran.</p>`;
      }
    }
  }

  function renderDaftarMateriSiswa() {
    const container = document.getElementById('containerDaftarMateriSiswa');
    if (!container) return;

    const filterMapel = document.getElementById('filterMapelMateriSiswa')?.value || 'SEMUA';
    const listFiltered = cacheMateriAjarSiswa.filter(
      (m) => !filterMapel || filterMapel === 'SEMUA' || m.mapel === filterMapel
    );

    if (listFiltered.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
          <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <div>
            <h4 class="font-extrabold text-sm text-slate-800">Belum ada materi pelajaran pada mata pelajaran ini</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">Materi bacaan atau video pembelajaran yang diterbitkan guru untuk Kelas ${escapeHtml(currentStudent?.kelas || '-')} akan tampil di sini.</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = listFiltered
      .map((m) => {
        const safeJudul = (m.judul || '').replace(/'/g, "\\'");
        const safeMapel = (m.mapel || '').replace(/'/g, "\\'");
        const sudahDibaca = cacheMateriDibacaSet.has(m.judul);

        const fileLinkBtn =
          m.linkFile && m.linkFile !== '-' && m.linkFile !== '#'
            ? `<a href="${m.linkFile}" target="_blank" rel="noopener noreferrer" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">${ICONS.fileDoc || ''}<span>Buka Modul / Bahan Bacaan</span>${ICONS.external}</a>`
            : '';

        const urlVideo = m.linkExternal || '';
        const isYt = getYouTubeId(urlVideo);
        const ytEmbed = isYt ? renderYouTubeEmbed(urlVideo) : '';
        const ytLinkBtn = isYt
          ? `<a href="${urlVideo}" target="_blank" rel="noopener noreferrer" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">${ICONS.youtube || ''}<span>Tonton di YouTube</span>${ICONS.external}</a>`
          : '';
        const webBtn =
          !isYt && urlVideo && urlVideo !== '-' && urlVideo !== '#'
            ? `<a href="${urlVideo}" target="_blank" rel="noopener noreferrer" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">${ICONS.globe || ''}<span>Buka Tautan Materi</span>${ICONS.external}</a>`
            : '';

        const btnBacaHtml = sudahDibaca
          ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-200/80 text-emerald-800 text-xs font-bold ml-auto">
               <svg class="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
               <span>Sudah Dipelajari</span>
             </span>`
          : `<button type="button" onclick="tandaiMateriSudahDibaca('${safeJudul}', '${safeMapel}')" class="cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 ml-auto">
               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
               <span>Tandai Sudah Dipelajari</span>
             </button>`;

        return `
          <div class="p-4 rounded-2xl border ${sudahDibaca ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'} space-y-2.5 transition-all">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-md">${escapeHtml(m.mapel)}</span>
                <span class="text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md">${escapeHtml(m.bab || 'Materi Umum')}</span>
              </div>
              <span class="text-[11px] text-slate-400 font-medium">Oleh: ${escapeHtml(m.pembuat || 'Guru')} • ${escapeHtml(m.waktu || '-')}</span>
            </div>
            <h4 class="text-sm font-black text-slate-800">${escapeHtml(m.judul)}</h4>
            <p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">${escapeHtml(m.ringkasan || '-')}</p>
            ${ytEmbed}
            <div class="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-slate-200/60">
              <div class="flex items-center gap-1.5 flex-wrap">${fileLinkBtn} ${ytLinkBtn} ${webBtn}</div>
              ${btnBacaHtml}
            </div>
          </div>
        `;
      })
      .join('');
  }

  async function tandaiMateriSudahDibaca(judulMateri, mapel) {
    if (!currentStudent) return;
    try {
      const res = await fetch('/api/materi/baca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: currentStudent.nis,
          nama: currentStudent.nama,
          kelas: currentStudent.kelas,
          judulMateri,
          mapel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        cacheMateriDibacaSet.add(judulMateri);
        try {
          localStorage.setItem(
            `sibintang_materi_baca_${currentStudent.nis}`,
            JSON.stringify(Array.from(cacheMateriDibacaSet))
          );
        } catch {}
        renderDaftarMateriSiswa();
        showToast(data.message || 'Materi berhasil ditandai sudah dipelajari!', 'success');
      }
    } catch {
      showToast('Gagal menyimpan status baca materi.', 'error');
    }
  }

  function pilihTugas(judul, mapel, materi = '') {
    const inputJudul = document.getElementById('judulTugas');
    const selectMapel = document.getElementById('mapel');
    const alertBox = document.getElementById('tugasAlert');
    if (alertBox) alertBox.classList.add('hidden');

    if (inputJudul) {
      inputJudul.value = materi ? `[${materi}] ${judul}` : judul;
    }
    if (selectMapel && mapel) {
      selectMapel.value = mapel;
    }

    switchTab('tugas');
    bukaModalKirimTugas();
  }

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

    setTombolLoading(btn, true, 'Mengupload ke Google Drive...');
    alertBox.classList.add('hidden');

    try {
      const cleanNama = (currentStudent?.nama || 'Siswa').replace(/\s+/g, '_');
      const cleanKelas = (currentStudent?.kelas || 'Kelas').replace(/\s+/g, '_');
      const cleanMapel = mapelVal.replace(/\s+/g, '_');
      const timestamp = Math.floor(Date.now() / 1000);
      const namaFileKustom = `${cleanNama}_${cleanKelas}_${cleanMapel}_${timestamp}`;
      const namaSubFolder = `Tugas_${cleanKelas}_${cleanMapel}`;

      showToast('Mengunggah file ke Google Drive...', 'info');
      const linkDrive = await uploadFileKeDrivePribadi(fileInput, namaFileKustom, namaSubFolder);
      if (!linkDrive) {
        throw new Error('Gagal mendapatkan tautan file dari Google Drive.');
      }

      setTombolLoading(btn, true, 'Menyimpan data tugas...');
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
          fileLink: linkDrive,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alertBox.className = 'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800';
        alertBox.innerHTML = `
          <div class="flex items-center justify-center gap-1.5 font-bold mb-1">${ICONS.check}<span>${escapeHtml(result.message || 'Tugas berhasil disimpan!')}</span></div>
          <a href="${linkDrive}" target="_blank" rel="noopener noreferrer" class="underline font-bold inline-flex items-center text-blue-700">Lihat File di Google Drive ${ICONS.external}</a>
        `;
        alertBox.classList.remove('hidden');

        showToast('Tugas berhasil diupload!', 'success');
        document.getElementById('tugasForm').reset();

        await loadRiwayat();
        await loadDaftarTugasGuru();
        muatUlangNotifikasiSiswa();

        setTimeout(() => {
          tutupModalKirimTugas();
          switchTugasTab('riwayat');
        }, 900);
      } else {
        throw new Error(result.message || result.error);
      }
    } catch (err) {
      alertBox.className =
        'mt-3 p-2.5 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5';
      alertBox.innerHTML = `${ICONS.error}<span>Gagal mengupload tugas: ${escapeHtml(err.message || 'Kesalahan jaringan')}</span>`;
      alertBox.classList.remove('hidden');
      showToast('Gagal mengupload tugas: ' + (err.message || ''), 'error');
    } finally {
      setTombolLoading(btn, false);
    }
  }

  // ==========================================================================
  // 8. TABEL RIWAYAT KEHADIRAN, IZIN, & NILAI TUGAS (DATATABLES)
  // ==========================================================================
  async function loadRiwayat() {
    if (!currentStudent) return;
    try {
      const res = await fetch(`/api/riwayat/${currentStudent.nis}`);
      const result = await res.json();
      if (!result.success) return;

      cacheAbsensiRaw = result.absensi || [];
      dtStateAbsenSiswa.page = 1;
      renderTabelAbsensi();

      cacheTugasRaw = result.tugas || [];
      dtStateTugasSiswa.page = 1;
      renderTabelTugasKumpul();
      renderDashboardPerkembanganSiswa();
    } catch (err) {
      console.error('[SiBintang] Gagal memuat riwayat:', err);
    }
  }

  async function loadRiwayatIzin() {
    if (!currentStudent) return;
    try {
      const res = await fetch(`/api/izin/${currentStudent.nis}`);
      const result = await res.json();
      if (!result.success) return;

      cacheIzinRaw = result.izin || [];
      dtStateIzinSiswa.page = 1;
      renderTabelIzin();
      renderDashboardPerkembanganSiswa();
    } catch (err) {
      console.error('[SiBintang] Gagal memuat riwayat izin:', err);
    }
  }

  function renderTabelAbsensi() {
    buatDataTables({
      data: cacheAbsensiRaw,
      state: dtStateAbsenSiswa,
      containerId: 'presensiSubContent-riwayat',
      tbodyId: 'tableAbsensi',
      colSpan: 5,
      emptyMessage: 'Belum ada riwayat absensi kehadiran.',
      searchPlaceholder: 'Cari No, tanggal, sesi, atau status...',
      renderRow: (item, index, bgRowClass) => {
        let badgeStatus = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Hadir</span>`;
        if (item.status === 'Izin') {
          badgeStatus = `<span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Izin</span>`;
        } else if (item.status === 'Sakit') {
          badgeStatus = `<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Sakit</span>`;
        }

        let keteranganHtml = '';
        const rawKet = item.keterangan || '-';
        if (typeof rawKet === 'string' && rawKet.startsWith('ABSEN-SIBINTANG')) {
          const parts = rawKet.split('|').map((p) => p.trim());
          const kelas = parts[1] || item.kelas || '';
          const sesi = parts[3] || 'Absen Pagi';
          keteranganHtml = `
            <div class="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Hadir di Kelas ${escapeHtml(kelas)} (${escapeHtml(sesi)})</span>
            </div>
          `;
        } else {
          keteranganHtml = `<span class="text-xs text-slate-600">${escapeHtml(rawKet)}</span>`;
        }

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-medium text-slate-700 text-xs whitespace-nowrap">${escapeHtml(item.waktu)}</td>
            <td class="p-3 font-bold text-slate-800 text-xs">${escapeHtml(item.kelas)}</td>
            <td class="p-3 whitespace-nowrap">${badgeStatus}</td>
            <td class="p-3 leading-snug">${keteranganHtml}</td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelAbsensi(),
    });
  }

  function renderTabelIzin() {
    buatDataTables({
      data: cacheIzinRaw,
      state: dtStateIzinSiswa,
      containerId: 'presensiSubContent-izin',
      tbodyId: 'tableRiwayatIzin',
      colSpan: 6,
      emptyMessage: 'Belum ada riwayat pengajuan izin atau sakit.',
      searchPlaceholder: 'Cari No, tanggal, kategori, atau alasan...',
      renderRow: (item, index, bgRowClass) => {
        let badgeVerifikasi = `<span class="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">Menunggu</span>`;
        if (item.verifikasi === 'Disetujui') {
          badgeVerifikasi = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">✓ Disetujui</span>`;
        } else if (item.verifikasi === 'Ditolak') {
          badgeVerifikasi = `<span class="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">✕ Ditolak</span>`;
        }

        const lampiranLink =
          item.link && item.link !== '-' && item.link !== '#'
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition">${ICONS.fileDoc || ''}<span>Lihat</span>${ICONS.external}</a>`
            : '<span class="text-slate-400 italic text-[11px]">Tanpa Berkas</span>';

        const teksTanggal =
          typeof formatRentangTanggalIndo === 'function' && /^\d{4}-\d{2}-\d{2}$/.test(item.tanggal || '')
            ? formatRentangTanggalIndo(item.tanggal)
            : item.tanggal;

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 font-semibold text-slate-800 whitespace-nowrap text-xs">${escapeHtml(teksTanggal)}</td>
            <td class="p-3 text-xs"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">${escapeHtml(item.status)}</span></td>
            <td class="p-3 text-slate-600 text-xs max-w-xs truncate" title="${escapeHtml(item.keterangan)}">${escapeHtml(item.keterangan)}</td>
            <td class="p-3 whitespace-nowrap text-xs">${lampiranLink}</td>
            <td class="p-3 whitespace-nowrap text-xs">${badgeVerifikasi}</td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelIzin(),
    });
  }

  function renderTabelTugasKumpul() {
    buatDataTables({
      data: cacheTugasRaw,
      state: dtStateTugasSiswa,
      containerId: 'boxTabelRiwayatTugasWrap',
      tbodyId: 'tableTugas',
      colSpan: 5,
      emptyMessage: 'Belum ada tugas yang dikumpulkan.',
      searchPlaceholder: 'Cari No, mata pelajaran, atau judul tugas...',
      renderRow: (item, index, bgRowClass) => {
        const badgeNilai =
          item.nilai !== '' && item.nilai !== null && item.nilai !== undefined
            ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl font-black text-xs inline-flex items-center gap-1 shadow-xs">${ICONS.star} Nilai: ${escapeHtml(item.nilai)}</span>`
            : `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-bold text-[11px] inline-block">Menunggu Dinilai</span>`;

        const catatanGuru = item.catatan
          ? `<div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-1 border border-slate-200"><span><b>Catatan Guru:</b> "${escapeHtml(item.catatan)}"</span></div>`
          : '';

        const materiBadge = item.materi
          ? `<span class="inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mb-1">${escapeHtml(item.materi)}</span>`
          : '';

        return `
          <tr class="${bgRowClass} hover:bg-slate-50 align-top transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-center font-bold">${index + 1}</td>
            <td class="p-3 text-slate-500 text-xs whitespace-nowrap">${escapeHtml(item.waktu)}</td>
            <td class="p-3 font-bold text-blue-700 text-xs">${escapeHtml(item.mapel)}</td>
            <td class="p-3">
              ${materiBadge}
              <div class="font-black text-slate-800 text-xs">${escapeHtml(item.judul)}</div>
              ${catatanGuru}
            </td>
            <td class="p-3 text-right whitespace-nowrap">
              <div class="mb-1.5">${badgeNilai}</div>
              <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-3 py-1.5 rounded-xl font-bold inline-flex items-center text-xs gap-1.5 transition">${ICONS.fileDoc || ''}<span>Buka File</span>${ICONS.external}</a>
            </td>
          </tr>
        `;
      },
      onStateChange: () => renderTabelTugasKumpul(),
    });
  }

  // ==========================================================================
  // 9. PUSAT NOTIFIKASI SISWA (SWIPEABLE BOTTOM SHEET) & PAPAN PENGUMUMAN
  // ==========================================================================
  function switchTabNotifSiswa(tab) {
    const isTugas = tab === 'tugas';
    document.getElementById('listNotifTugasDesktop')?.classList.toggle('hidden', !isTugas);
    document.getElementById('listPengumumanDesktop')?.classList.toggle('hidden', isTugas);
    document.getElementById('listNotifTugasMobile')?.classList.toggle('hidden', !isTugas);
    document.getElementById('listPengumumanMobile')?.classList.toggle('hidden', isTugas);

    const activeCls = 'py-1.5 rounded-lg bg-blue-600 text-white shadow-sm transition cursor-pointer';
    const inactiveCls = 'py-1.5 rounded-lg text-slate-600 hover:text-slate-800 transition cursor-pointer';

    terapkanGayaTab(
      { tugas: 'tabNotifSiswaBtn-tugas', pengumuman: 'tabNotifSiswaBtn-pengumuman' },
      tab,
      activeCls,
      inactiveCls
    );
    terapkanGayaTab(
      { tugas: 'tabNotifSiswaMobBtn-tugas', pengumuman: 'tabNotifSiswaMobBtn-pengumuman' },
      tab,
      activeCls,
      inactiveCls
    );
  }

  async function muatUlangNotifikasiSiswa() {
    if (!currentStudent) return;
    let totalTugasBelumKumpul = 0;

    try {
      const resTugas = await fetch(`/api/guru/tugas?kelas=${encodeURIComponent(currentStudent.kelas)}`);
      const dataTugas = await resTugas.json();
      const daftarTugas = dataTugas.daftarSoal || dataTugas.bankSoal || dataTugas.data || dataTugas.daftarTugas || [];

      let tugasSudahKumpulMap = [];
      try {
        const resRiwayat = await fetch(`/api/riwayat/${currentStudent.nis}`);
        const dataRiwayat = await resRiwayat.json();
        tugasSudahKumpulMap = (dataRiwayat.tugas || []).map((t) => {
          const m = (t.mapel || '').trim().toLowerCase();
          const j = (t.judul || '').trim().toLowerCase();
          return `${m}:::${j}`;
        });
      } catch {}

      const tugasBelumSelesai = daftarTugas.filter((t) => {
        const key = `${(t.mapel || '').trim().toLowerCase()}:::${(t.judul || '').trim().toLowerCase()}`;
        const keyWithMateri = `${(t.mapel || '').trim().toLowerCase()}:::[${(t.materi || '').trim().toLowerCase()}] ${(t.judul || '').trim().toLowerCase()}`;
        return !tugasSudahKumpulMap.includes(key) && !tugasSudahKumpulMap.includes(keyWithMateri);
      });

      totalTugasBelumKumpul = tugasBelumSelesai.length;

      const htmlTugas =
        tugasBelumSelesai.length === 0
          ? `<p class="text-xs text-slate-400 text-center py-4">Semua tugas kelas sudah kamu selesaikan.</p>`
          : tugasBelumSelesai
              .map((t) => {
                const safeJudul = (t.judul || '').replace(/'/g, "\\'");
                const safeMapel = (t.mapel || '').replace(/'/g, "\\'");
                const safeMateri = (t.materi || '').replace(/'/g, "\\'");
                const infoMateri = t.materi ? ` &bull; ${escapeHtml(t.materi)}` : '';

                return `
                  <div class="p-3 bg-blue-50/70 hover:bg-blue-100/70 rounded-2xl border border-blue-100 transition space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">${escapeHtml(t.mapel)}${infoMateri}</span>
                      <span class="text-[10px] text-slate-400 font-mono">Batas: ${escapeHtml(t.deadline || '-')}</span>
                    </div>
                    <h5 class="text-xs font-black text-slate-800 leading-snug">${escapeHtml(t.judul)}</h5>
                    <p class="text-[11px] text-slate-600 truncate">${escapeHtml(t.deskripsi || '-')}</p>
                    <div class="pt-1.5 flex items-center justify-between border-t border-blue-200/50 mt-1">
                      <span class="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Belum Dikumpul</span>
                      <button type="button" onclick="pilihTugasDariNotif('${safeJudul}', '${safeMapel}', '${safeMateri}')" class="cursor-pointer text-[11px] font-bold text-blue-700 hover:underline">Kerjakan Sekarang →</button>
                    </div>
                  </div>
                `;
              })
              .join('');

      const deskTugas = document.getElementById('listNotifTugasDesktop');
      const mobTugas = document.getElementById('listNotifTugasMobile');
      if (deskTugas) deskTugas.innerHTML = htmlTugas;
      if (mobTugas) mobTugas.innerHTML = htmlTugas;
    } catch {
      const errHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memeriksa tugas baru.</p>`;
      const deskTugas = document.getElementById('listNotifTugasDesktop');
      if (deskTugas) deskTugas.innerHTML = errHtml;
    }

    await loadPengumumanSiswa();

    const counterPill = document.getElementById('notifSiswaCounterPill');
    if (counterPill) counterPill.textContent = `${totalTugasBelumKumpul} Tugas Aktif`;

    const badgeLive = document.getElementById('badgeNotifLive');
    let sudahDibaca = false;
    try {
      sudahDibaca = localStorage.getItem('sibintang_notif_siswa_read') === 'true';
    } catch {}
    if (totalTugasBelumKumpul > 0 || !sudahDibaca) {
      badgeLive?.classList.remove('hidden');
    } else {
      badgeLive?.classList.add('hidden');
    }
  }

  function pilihTugasDariNotif(judul, mapel, materi = '') {
    tutupBottomSheetPengumuman();
    document.getElementById('popoverNotifDesktop')?.classList.add('hidden');
    pilihTugas(judul, mapel, materi);
  }

  function tandaiNotifikasiSiswaDibaca() {
    document.getElementById('badgeNotifLive')?.classList.add('hidden');
    try {
      localStorage.setItem('sibintang_notif_siswa_read', 'true');
    } catch {}
  }

  async function loadPengumumanSiswa() {
    const listDesk = document.getElementById('listPengumumanDesktop');
    const listMob = document.getElementById('listPengumumanMobile');
    if ((!listDesk && !listMob) || !currentStudent) return;

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

      const htmlCards = pengumuman
        .map(
          (p) => `
        <div class="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${p.target === 'SEMUA' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${escapeHtml(p.kategori)}</span>
            <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(p.waktu)}</span>
          </div>
          <h5 class="text-xs font-black text-slate-800 leading-snug">${escapeHtml(p.judul)}</h5>
          <p class="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">${escapeHtml(p.isi)}</p>
        </div>
      `
        )
        .join('');

      if (listDesk) listDesk.innerHTML = htmlCards;
      if (listMob) listMob.innerHTML = htmlCards;
    } catch {
      const errorHtml = `<p class="text-xs text-rose-500 text-center py-2">Gagal memuat pengumuman.</p>`;
      if (listDesk) listDesk.innerHTML = errorHtml;
      if (listMob) listMob.innerHTML = errorHtml;
    }
  }

  // ==========================================================================
  // 10. PENGENDALI MODAL POP-UP & EKSPOR GLOBAL WINDOW
  // ==========================================================================
  function bukaModalScanQR() {
    document.getElementById('modalScanQR')?.classList.remove('hidden');
  }

  function tutupModalScanQR() {
    stopScanner();
    document.getElementById('modalScanQR')?.classList.add('hidden');
  }

  function bukaModalKirimTugas() {
    document.getElementById('tugasAlert')?.classList.add('hidden');
    document.getElementById('modalKirimTugas')?.classList.remove('hidden');
  }

  function tutupModalKirimTugas() {
    document.getElementById('modalKirimTugas')?.classList.add('hidden');
  }

  function bukaModalFormIzin() {
    inisialisasiRentangTanggalIzin();
    document.getElementById('izinAlert')?.classList.add('hidden');
    document.getElementById('modalFormIzin')?.classList.remove('hidden');
  }

  function tutupModalFormIzin() {
    document.getElementById('modalFormIzin')?.classList.add('hidden');
  }

  function bukaModalTeksDoaSiswa() {
    document.getElementById('modalDoaSiswa')?.classList.remove('hidden');
  }

  function tutupModalTeksDoaSiswa() {
    document.getElementById('modalDoaSiswa')?.classList.add('hidden');
  }

  function bukaBottomSheetPengumuman() {
    document.getElementById('sheetPanelSiswa')?.classList.remove('sheet-expanded');
    document.getElementById('bottomSheetPengumuman')?.classList.remove('hidden');
  }

  function tutupBottomSheetPengumuman() {
    document.getElementById('sheetPanelSiswa')?.classList.remove('sheet-expanded');
    document.getElementById('bottomSheetPengumuman')?.classList.add('hidden');
  }

  window.inisialisasiPortalSiswa = inisialisasiPortalSiswa;
  window.resetKeTampilanAwalSiswa = resetKeTampilanAwalSiswa;
  window.switchAuthTab = switchAuthTab;
  window.switchTab = switchTab;
  window.switchPresensiTab = switchPresensiTab;
  window.switchTugasTab = switchTugasTab;
  window.muatUlangPerkembanganSiswa = muatUlangPerkembanganSiswa;
  window.renderDashboardPerkembanganSiswa = renderDashboardPerkembanganSiswa;
  window.eksporPerkembanganSiswa = eksporPerkembanganSiswa;
  window.simulasikanScanQRSiswa = simulasikanScanQRSiswa;
  window.kirimAbsensi = kirimAbsensi;
  window.pilihTugas = pilihTugas;
  window.loadDaftarMateriSiswa = loadDaftarMateriSiswa;
  window.renderDaftarMateriSiswa = renderDaftarMateriSiswa;
  window.tandaiMateriSudahDibaca = tandaiMateriSudahDibaca;
  window.loadRiwayat = loadRiwayat;
  window.loadRiwayatIzin = loadRiwayatIzin;
  window.switchTabNotifSiswa = switchTabNotifSiswa;
  window.muatUlangNotifikasiSiswa = muatUlangNotifikasiSiswa;
  window.pilihTugasDariNotif = pilihTugasDariNotif;
  window.loadPengumumanSiswa = loadPengumumanSiswa;
  window.bukaModalScanQR = bukaModalScanQR;
  window.tutupModalScanQR = tutupModalScanQR;
  window.bukaModalKirimTugas = bukaModalKirimTugas;
  window.tutupModalKirimTugas = tutupModalKirimTugas;
  window.bukaModalFormIzin = bukaModalFormIzin;
  window.tutupModalFormIzin = tutupModalFormIzin;
  window.bukaModalTeksDoaSiswa = bukaModalTeksDoaSiswa;
  window.tutupModalTeksDoaSiswa = tutupModalTeksDoaSiswa;
  window.bukaBottomSheetPengumuman = bukaBottomSheetPengumuman;
  window.tutupBottomSheetPengumuman = tutupBottomSheetPengumuman;
})();
