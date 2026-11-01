// ==========================================================================
// AUTH & ROLE ACCESS MANAGER (SiBintang)
// ==========================================================================

const KUNCI_SESI_GURU = 'sibintang_guru_data';
const KUNCI_SESI_SISWA = 'sibintang_siswa';

const Auth = {
  // --- MANAJEMEN SESI GURU / PENGELOLA ---
  getGuru() {
    try {
      const data = sessionStorage.getItem(KUNCI_SESI_GURU);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setGuru(guruData) {
    sessionStorage.setItem(KUNCI_SESI_GURU, JSON.stringify(guruData));
  },

  logoutGuru() {
    sessionStorage.removeItem(KUNCI_SESI_GURU);
    showToast('Berhasil keluar dari sesi.', 'info');
    setTimeout(() => location.reload(), 500);
  },

  // --- MANAJEMEN SESI SISWA ---
  getSiswa() {
    try {
      const data = localStorage.getItem(KUNCI_SESI_SISWA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSiswa(siswaData) {
    localStorage.setItem(KUNCI_SESI_SISWA, JSON.stringify(siswaData));
  },

  logoutSiswa() {
    localStorage.removeItem(KUNCI_SESI_SISWA);
    showToast('Berhasil keluar dari sesi.', 'info');
  },

  // --- PEMBATASAN AKSES & PENGUNCIAN ROLE GURU ---
  terapkanAksesRoleGuru(guru) {
    if (!guru) return;

    const role = (guru.role || '').trim();
    const kelasBinaan = guru.kelasBinaan || '-';
    const mapelAjar = guru.mapelAjar || '-';

    const selAbsen = document.getElementById('filterKelas');
    const selTugas = document.getElementById('filterKelasTugas');
    const selBuatTugas = document.getElementById('buatTugasKelas');
    const inputSesi = document.getElementById('ketSesi');
    const selectMapelBuat = document.getElementById('buatTugasMapel');
    const panelAdmin = document.getElementById('panelAdminToken');

    // 1. Tampilkan Panel Token jika Admin / Kepala Sekolah
    if (panelAdmin) {
      if (role === 'Admin' || role === 'Admin Sistem' || role === 'Kepala Sekolah') {
        panelAdmin.classList.remove('hidden');
      } else {
        panelAdmin.classList.add('hidden');
      }
    }

    // 2. KASUS: WALI KELAS (Terkunci ke Kelas Binaannya Saja)
    if ((role === 'Wali Kelas' || role === 'Guru Kelas') && kelasBinaan !== '-') {
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
      if (inputSesi && !inputSesi.value) {
        inputSesi.value = 'Absen Pagi';
      }
      return;
    }

    // 3. KASUS: GURU MATA PELAJARAN (Bisa Pilih Kelas, Sesi & Mapel Terkunci)
    if (role === 'Guru Mapel' || role === 'Guru Mata Pelajaran') {
      if (inputSesi) {
        inputSesi.value = `Mapel ${mapelAjar}`;
        inputSesi.readOnly = true;
      }
      if (selectMapelBuat && mapelAjar !== '-') {
        selectMapelBuat.value = mapelAjar;
        selectMapelBuat.disabled = true;
      }
      if (selAbsen) selAbsen.disabled = false;
      if (selTugas) selTugas.disabled = false;
      if (selBuatTugas) selBuatTugas.disabled = false;
      return;
    }

    // 4. KASUS: ADMIN & KEPALA SEKOLAH (Akses Penuh Semua Kelas & Sesi)
    if (role === 'Admin' || role === 'Admin Sistem' || role === 'Kepala Sekolah') {
      if (selAbsen) selAbsen.disabled = false;
      if (selTugas) selTugas.disabled = false;
      if (selBuatTugas) selBuatTugas.disabled = false;
      if (inputSesi) inputSesi.readOnly = false;
      if (selectMapelBuat) selectMapelBuat.disabled = false;
    }
  }
};

window.Auth = Auth;
