/**
 * ============================================================================
 * SIBINTANG - AUTHENTICATION & DYNAMIC RBAC MANAGER (public/js/auth.js)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.2.0)
 * ============================================================================
 * Mengelola penyimpanan sesi login untuk Siswa (localStorage) dan Pengelola/Guru
 * (sessionStorage), manajemen matriks hak akses peran (RBAC) dinamis yang
 * terhubung ke backend (/api/admin/settings), fitur pengalih peran ganda
 * (Wali Kelas <-> Guru Kelas), serta akses Admin lintas portal.
 *
 * Susunan Kode:
 * 1. Penyimpanan Konfigurasi Sistem & Matriks Hak Akses Role Dinamis
 * 2. Manajemen Sesi Guru, Pengelola & Multi-Peran (Wali Kelas + Guru Kelas)
 * 3. Manajemen Sesi Siswa & Akses Lintas Portal Admin
 * 4. Utilitas Perpindahan Tab Masuk / Registrasi Terpadu
 * 5. Evaluasi Izin Fitur & Penerapan Kontrol Antarmuka Berbasis Peran (RBAC)
 */

const KUNCI_SESI_GURU = 'sibintang_guru_data';
const KUNCI_SESI_SISWA = 'sibintang_siswa';
const KUNCI_SETTING_LOKAL = 'sibintang_system_settings_v32';

const Auth = {
  // ==========================================================================
  // 1. PENYIMPANAN KONFIGURASI SISTEM & MATRIKS HAK AKSES ROLE DINAMIS
  // ==========================================================================

  /**
   * Mengambil pengaturan sistem & matriks RBAC terkini (dari cache localStorage atau default)
   */
  getSettings() {
    const defaultPerms =
      typeof DEFAULT_ROLE_PERMISSIONS !== 'undefined' ? DEFAULT_ROLE_PERMISSIONS : {};
    const defaultRoles =
      typeof DAFTAR_ROLE_GURU !== 'undefined'
        ? DAFTAR_ROLE_GURU
        : ['Wali Kelas', 'Guru Kelas', 'Guru Mata Pelajaran', 'Kepala Sekolah', 'Operator', 'Admin'];
    const defaultSchool =
      typeof DEFAULT_SCHOOL_CONFIG !== 'undefined'
        ? DEFAULT_SCHOOL_CONFIG
        : {
            tahunAjaran: '2026/2027',
            semester: 'Ganjil',
            kkmNilai: 75,
            jamOperasional: '07.00 - 12.20 WIB',
            batasJamMasuk: '07:15',
            wajibTokenRegistrasi: true,
          };

    try {
      const saved = localStorage.getItem(KUNCI_SETTING_LOKAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          daftarRole:
            Array.isArray(parsed.daftarRole) && parsed.daftarRole.length > 0
              ? parsed.daftarRole
              : [...defaultRoles],
          rolePermissions: {
            ...JSON.parse(JSON.stringify(defaultPerms)),
            ...(parsed.rolePermissions || {}),
          },
          schoolConfig: {
            ...defaultSchool,
            ...(parsed.schoolConfig || {}),
          },
        };
      }
    } catch {}

    return {
      daftarRole: [...defaultRoles],
      rolePermissions: JSON.parse(JSON.stringify(defaultPerms)),
      schoolConfig: { ...defaultSchool },
    };
  },

  /**
   * Menyimpan pembaruan pengaturan sistem ke localStorage & menyinkronkan variabel global
   */
  saveSettingsLocal(settingsObj) {
    try {
      localStorage.setItem(KUNCI_SETTING_LOKAL, JSON.stringify(settingsObj));
      if (Array.isArray(settingsObj.daftarRole)) {
        window.DAFTAR_ROLE_GURU = settingsObj.daftarRole;
      }
    } catch (err) {
      console.warn('[SiBintang] Gagal menyimpan pengaturan lokal:', err);
    }
  },

  /**
   * Memuat pengaturan sistem terbaru dari endpoint backend (/api/admin/settings)
   */
  async syncSettingsFromServer() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data && data.success && data.settings) {
        this.saveSettingsLocal(data.settings);
        return data.settings;
      }
    } catch {}
    return this.getSettings();
  },

  // ==========================================================================
  // 2. MANAJEMEN SESI GURU, PENGELOLA & MULTI-PERAN (WALI KELAS + GURU KELAS)
  // ==========================================================================

  getGuru() {
    try {
      const data = sessionStorage.getItem(KUNCI_SESI_GURU);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setGuru(guruData) {
    try {
      if (guruData && !guruData.activeRole) {
        guruData.activeRole = guruData.role || 'Guru Kelas';
      }
      sessionStorage.setItem(KUNCI_SESI_GURU, JSON.stringify(guruData));
    } catch (err) {
      console.warn('[SiBintang] Gagal menyimpan sesi guru:', err);
    }
  },

  getActiveRole(guru) {
    const g = guru || this.getGuru();
    if (!g) return 'Guru Kelas';
    return (g.activeRole || g.role || 'Guru Kelas').trim();
  },

  switchActiveRole(guru, roleBaru) {
    const g = guru || this.getGuru();
    if (!g) return null;
    g.activeRole = roleBaru;
    this.setGuru(g);
    return g;
  },

  logoutGuru() {
    try {
      sessionStorage.removeItem(KUNCI_SESI_GURU);
    } catch {}
    if (typeof showToast === 'function') {
      showToast('Berhasil keluar dari sesi pengelola.', 'info');
    }
    setTimeout(() => location.reload(), 500);
  },

  // ==========================================================================
  // 3. MANAJEMEN SESI SISWA & AKSES LINTAS PORTAL ADMIN
  // ==========================================================================

  getSiswa() {
    try {
      const data = localStorage.getItem(KUNCI_SESI_SISWA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSiswa(siswaData) {
    try {
      localStorage.setItem(KUNCI_SESI_SISWA, JSON.stringify(siswaData));
    } catch (err) {
      console.warn('[SiBintang] Gagal menyimpan sesi siswa:', err);
    }
  },

  logoutSiswa() {
    try {
      localStorage.removeItem(KUNCI_SESI_SISWA);
    } catch {}
    if (typeof showToast === 'function') {
      showToast('Berhasil keluar dari sesi siswa.', 'info');
    }
  },

  // ==========================================================================
  // 4. UTILITAS PERPINDAHAN TAB MASUK / REGISTRASI TERPADU
  // ==========================================================================

  switchTabFormAuth(
    type,
    { formMasukId, formDaftarId, btnMasukId, btnDaftarId, activeMasukColor = 'bg-blue-600' }
  ) {
    const formMasuk = document.getElementById(formMasukId);
    const formDaftar = document.getElementById(formDaftarId);
    const btnMasuk = document.getElementById(btnMasukId);
    const btnDaftar = document.getElementById(btnDaftarId);

    if (!formMasuk || !formDaftar) return;

    const baseBtnCls =
      'py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer';
    const inactiveCls = `${baseBtnCls} text-slate-600 hover:text-slate-800`;

    if (type === 'masuk') {
      formMasuk.classList.remove('hidden');
      formDaftar.classList.add('hidden');
      if (btnMasuk) btnMasuk.className = `${baseBtnCls} ${activeMasukColor} text-white shadow-sm`;
      if (btnDaftar) btnDaftar.className = inactiveCls;
    } else {
      formMasuk.classList.add('hidden');
      formDaftar.classList.remove('hidden');
      if (btnDaftar) btnDaftar.className = `${baseBtnCls} bg-emerald-600 text-white shadow-sm`;
      if (btnMasuk) btnMasuk.className = inactiveCls;
    }
  },

  // ==========================================================================
  // 5. EVALUASI IZIN FITUR & PENERAPAN KONTROL ANTARMUKA BERBASIS PERAN (RBAC)
  // ==========================================================================

  getRolePermissions(roleName = '') {
    const settings = this.getSettings();
    const cleanRole = String(roleName || 'Guru Kelas').trim();
    const normalized =
      cleanRole === 'Admin Sistem'
        ? 'Admin'
        : cleanRole === 'Guru Mapel'
          ? 'Guru Mata Pelajaran'
          : cleanRole;

    if (settings.rolePermissions && settings.rolePermissions[normalized]) {
      return settings.rolePermissions[normalized];
    }

    return {
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
  },

  hasPermission(guru, permissionKey) {
    const g = guru || this.getGuru();
    if (!g) return false;
    const activeRole = this.getActiveRole(g);
    if (activeRole === 'Admin' || activeRole === 'Admin Sistem') return true;
    const perms = this.getRolePermissions(activeRole);
    return Boolean(perms && perms[permissionKey]);
  },

  isRoleAdmin(role = '') {
    const r = String(role || '').trim();
    return ['Admin', 'Admin Sistem', 'Kepala Sekolah', 'Operator'].includes(r);
  },

  canAccessSystemSettings(guru) {
    const g = guru || this.getGuru();
    if (!g) return false;
    const baseRole = String(g.role || '').trim();
    const activeRole = this.getActiveRole(g);
    return (
      baseRole === 'Admin' ||
      baseRole === 'Admin Sistem' ||
      baseRole === 'Kepala Sekolah' ||
      activeRole === 'Admin' ||
      activeRole === 'Kepala Sekolah' ||
      this.hasPermission(g, 'canKelolaSetting')
    );
  },

  /**
   * Menerapkan pembatasan tombol aksi, dropdown kelas di modal QR, mata pelajaran,
   * pengalih peran ganda, serta menu Pengumuman, Token & Setting sesuai role aktif.
   */
  terapkanAksesRoleGuru(guru) {
    if (!guru) return;

    const activeRole = this.getActiveRole(guru);
    const kelasBinaan = guru.kelasBinaan && guru.kelasBinaan !== '-' ? guru.kelasBinaan : '1A';
    const mapelAjar = guru.mapelAjar || '-';
    const perms = this.getRolePermissions(activeRole);
    const canMateri = perms.canBuatMateri !== undefined ? perms.canBuatMateri : perms.canBuatTugas;

    const selAbsen = document.getElementById('filterKelas');
    const selTugas = document.getElementById('filterKelasTugas');
    const selBuatTugas = document.getElementById('buatTugasKelas');
    const selBuatMateri = document.getElementById('buatMateriKelas');
    const inputSesi = document.getElementById('ketSesi');
    const selectMapelFilter = document.getElementById('filterMapelTugas');
    const selectMapelBuat = document.getElementById('buatTugasMapel');
    const selectMapelBuatMateri = document.getElementById('buatMateriMapel');
    const selectTargetPengumuman = document.getElementById('p_target');

    const wrapMenuPengumuman = document.getElementById('wrapMenuPengumumanGuru');
    const wrapMenuToken = document.getElementById('wrapMenuTokenAdmin');
    const wrapMenuSetting = document.getElementById('wrapMenuSettingAdmin');
    const wrapRoleSwitcher = document.getElementById('wrapRoleSwitcherDropdown');
    const btnActionBuatMateri = document.getElementById('btnActionBuatMateri');
    const badgeModeMonitoringMateri = document.getElementById('badgeModeMonitoringMateri');
    const btnActionBuatTugas = document.getElementById('btnActionBuatTugas');
    const btnActionBuatPengumuman = document.getElementById('btnActionBuatPengumuman');
    const badgeModeMonitoringTugas = document.getElementById('badgeModeMonitoringTugas');
    const linkPortalSiswaHeader = document.getElementById('linkPortalSiswa');

    // 1. Menu Kelola Pengumuman di Dropdown Profil (Tampil untuk Semua Role)
    if (wrapMenuPengumuman) {
      wrapMenuPengumuman.classList.remove('hidden');
    }

    // 2. Menu Generator Token (Admin, Kepala Sekolah, Operator, atau sesuai RBAC)
    if (wrapMenuToken) {
      wrapMenuToken.classList.toggle('hidden', !perms.canGenerateToken);
    }

    // 3. Menu Setting Sistem & Hak Akses Role (Admin & Kepala Sekolah)
    if (wrapMenuSetting) {
      wrapMenuSetting.classList.toggle('hidden', !this.canAccessSystemSettings(guru));
    }

    // 4. Tautan Cepat Lintas Portal untuk Admin
    if (linkPortalSiswaHeader) {
      if (activeRole === 'Admin' || guru.role === 'Admin') {
        linkPortalSiswaHeader.classList.remove('hidden');
      }
    }

    // 5. Pengalih Peran Cepat (Khusus Wali Kelas yang Merangkap Guru Kelas atau Admin)
    if (wrapRoleSwitcher) {
      const bisaRangkap =
        Boolean(guru.merangkapGuruKelas) ||
        guru.role === 'Wali Kelas + Guru Kelas' ||
        guru.role === 'Admin';
      wrapRoleSwitcher.classList.toggle('hidden', !bisaRangkap);
      const btnModeWali = document.getElementById('btnSwitchModeWali');
      const btnModeGuru = document.getElementById('btnSwitchModeGuru');
      if (btnModeWali && btnModeGuru) {
        const isModeWali = activeRole === 'Wali Kelas';
        btnModeWali.className = isModeWali
          ? 'py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-indigo-900 text-white shadow-xs transition cursor-pointer'
          : 'py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer';
        btnModeGuru.className = !isModeWali
          ? 'py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-xs transition cursor-pointer'
          : 'py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer';
      }
    }

    // 6. Tombol Action Tambah Materi & Indikator Mode Monitoring Materi
    if (btnActionBuatMateri) {
      btnActionBuatMateri.classList.toggle('hidden', !canMateri);
    }
    if (badgeModeMonitoringMateri) {
      badgeModeMonitoringMateri.classList.toggle('hidden', Boolean(canMateri));
      badgeModeMonitoringMateri.textContent =
        activeRole === 'Wali Kelas'
          ? `Mode Monitoring Materi Kelas ${kelasBinaan} (Pantau Log Baca Siswa)`
          : `Mode Monitoring Materi (${activeRole})`;
    }

    // 7. Tombol Action Buat Tugas & Indikator Mode Monitoring Tugas
    if (btnActionBuatTugas) {
      btnActionBuatTugas.classList.toggle('hidden', !perms.canBuatTugas);
    }
    if (badgeModeMonitoringTugas) {
      badgeModeMonitoringTugas.classList.toggle('hidden', perms.canBuatTugas);
      badgeModeMonitoringTugas.textContent =
        activeRole === 'Wali Kelas'
          ? `Mode Monitoring Wali Kelas ${kelasBinaan} (Tanpa Buat/Nilai Tugas)`
          : `Mode Monitoring ${activeRole}`;
    }

    // 8. Tombol Action Buat Pengumuman (Aktif untuk Wali Kelas, Guru, Kepsek, Operator, Admin)
    if (btnActionBuatPengumuman) {
      btnActionBuatPengumuman.classList.toggle('hidden', !perms.canBuatPengumuman);
    }

    // 9. Pengaturan Target Pengumuman Default
    if (selectTargetPengumuman) {
      if (!perms.canPengumumanGlobal && kelasBinaan && kelasBinaan !== '-') {
        selectTargetPengumuman.value = kelasBinaan;
      }
    }

    // 10. Penguncian Kelas & Sesi pada Modal QR, Materi & Tugas
    if (!perms.canAksesSemuaKelas) {
      if (selAbsen) {
        selAbsen.value = kelasBinaan;
        selAbsen.disabled = true;
      }
      if (selTugas) {
        selTugas.value = kelasBinaan;
        selTugas.disabled = true;
      }
      if (selBuatTugas) {
        selBuatTugas.value = kelasBinaan;
        selBuatTugas.disabled = true;
      }
      if (selBuatMateri) {
        selBuatMateri.value = kelasBinaan;
        selBuatMateri.disabled = true;
      }
      if (inputSesi) {
        inputSesi.readOnly = false;
        if (!inputSesi.value) inputSesi.value = 'Absen Pagi';
      }
      if (selectMapelFilter) {
        selectMapelFilter.value = 'SEMUA';
        selectMapelFilter.disabled = false;
      }
      if (selectMapelBuat) selectMapelBuat.disabled = false;
      if (selectMapelBuatMateri) selectMapelBuatMateri.disabled = false;
      return;
    }

    // 11. Guru Mata Pelajaran (Lintas Kelas, Mapel Terkunci)
    if (activeRole === 'Guru Mapel' || activeRole === 'Guru Mata Pelajaran') {
      if (inputSesi) {
        if (!inputSesi.value || inputSesi.value === 'Absen Pagi') {
          inputSesi.value = 'Absen Pagi';
        }
        inputSesi.readOnly = false;
      }
      if (selectMapelFilter && mapelAjar !== '-') {
        selectMapelFilter.value = mapelAjar;
      }
      if (selectMapelBuat && mapelAjar !== '-') {
        selectMapelBuat.value = mapelAjar;
        selectMapelBuat.disabled = true;
      }
      if (selectMapelBuatMateri && mapelAjar !== '-') {
        selectMapelBuatMateri.value = mapelAjar;
        selectMapelBuatMateri.disabled = true;
      }
      if (selAbsen) selAbsen.disabled = false;
      if (selTugas) {
        selTugas.value = 'SEMUA';
        selTugas.disabled = false;
      }
      if (selBuatTugas) selBuatTugas.disabled = false;
      if (selBuatMateri) selBuatMateri.disabled = false;
      return;
    }

    // 12. Admin, Kepala Sekolah, Operator (Lintas Kelas Penuh)
    if (selAbsen) selAbsen.disabled = false;
    if (selTugas) {
      selTugas.value = 'SEMUA';
      selTugas.disabled = false;
    }
    if (selBuatTugas) selBuatTugas.disabled = false;
    if (selBuatMateri) selBuatMateri.disabled = false;
    if (inputSesi) {
      inputSesi.readOnly = false;
      if (!inputSesi.value) inputSesi.value = 'Absen Pagi';
    }
    if (selectMapelFilter) {
      selectMapelFilter.value = 'SEMUA';
      selectMapelFilter.disabled = false;
    }
    if (selectMapelBuat) selectMapelBuat.disabled = false;
    if (selectMapelBuatMateri) selectMapelBuatMateri.disabled = false;
  },
};

window.Auth = Auth;
