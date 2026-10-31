let currentStudent = null;
let html5QrCode = null;

// Inisialisasi saat Halaman Dimuat
window.addEventListener('DOMContentLoaded', () => {
  isiDropdown('regKelas', DAFTAR_KELAS, 'Pilih Kelas');
  isiDropdown('mapel', DAFTAR_MAPEL, 'Pilih Mata Pelajaran');
  renderFooter();
  initEventListeners();

  // Cek Sesi Siswa via Auth.js
  currentStudent = Auth.getSiswa();
  if (currentStudent) {
    showDashboard();
  } else {
    updateHeaderUI(false);
  }
});

// Pendaftaran Event Listener Elemen DOM
function initEventListeners() {
  document.getElementById('btnLogout')?.addEventListener('click', logout);
  document.getElementById('authTabBtn-masuk')?.addEventListener('click', () => switchAuthTab('masuk'));
  document.getElementById('authTabBtn-daftar')?.addEventListener('click', () => switchAuthTab('daftar'));

  document.getElementById('tabBtn-absen')?.addEventListener('click', () => switchTab('absen'));
  document.getElementById('tabBtn-tugas')?.addEventListener('click', () => switchTab('tugas'));
  document.getElementById('tabBtn-izin')?.addEventListener('click', () => switchTab('izin'));
  document.getElementById('tabBtn-riwayat')?.addEventListener('click', () => switchTab('riwayat'));

  document.getElementById('btnStartScan')?.addEventListener('click', startScanner);
  document.getElementById('btnStopScan')?.addEventListener('click', stopScanner);

  document.getElementById('btnPerbaruiPengumuman')?.addEventListener('click', loadPengumumanSiswa);
  document.getElementById('btnPerbaruiTugasGuru')?.addEventListener('click', loadDaftarTugasGuru);
  document.getElementById('btnSegarkanRiwayat')?.addEventListener('click', loadRiwayat);

  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
  const iosBanner = document.getElementById('ios-install-banner');
  if (isIos && !isInStandaloneMode && iosBanner) {
    iosBanner.style.display = 'block';
  }
  document.getElementById('btnDismissIosBanner')?.addEventListener('click', () => {
    if (iosBanner) iosBanner.style.display = 'none';
  });
}

function switchAuthTab(type) {
  const formMasuk = document.getElementById('formMasuk');
  const formDaftar = document.getElementById('formDaftar');
  const btnMasuk = document.getElementById('authTabBtn-masuk');
  const btnDaftar = document.getElementById('authTabBtn-daftar');
  if (!formMasuk || !formDaftar) return;

  if (type === 'masuk') {
    formMasuk.classList.remove('hidden');
    formDaftar.classList.add('hidden');
    if (btnMasuk) btnMasuk.className = 'py-2 text-xs font-bold rounded-lg bg-blue-700 text-white shadow-sm transition flex items-center justify-center gap-1.5';
    if (btnDaftar) btnDaftar.className = 'py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5';
  } else {
    formMasuk.classList.add('hidden');
    formDaftar.classList.remove('hidden');
    if (btnDaftar) btnDaftar.className = 'py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white shadow-sm transition flex items-center justify-center gap-1.5';
    if (btnMasuk) btnMasuk.className = 'py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-800 transition flex items-center justify-center gap-1.5';
  }
}

// 1A. Proses Masuk Siswa
document.getElementById('formMasuk')?.addEventListener('submit', async (e) => {
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
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Masuk ke Dashboard</span>`;
    btn.disabled = false;
  }
});

// 1B. Proses Registrasi Siswa
document.getElementById('formDaftar')?.addEventListener('submit', async (e) => {
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
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Daftar Akun Baru</span>`;
    btn.disabled = false;
  }
});

function updateHeaderUI(isLoggedIn) {
  const container = document.getElementById('headerSiswaContainer');
  const spacer = document.getElementById('headerBalanceSpacer');
  const brand = document.getElementById('headerBrandSection');
  const guestBadge = document.getElementById('headerGuestBadge');
  const btnLogout = document.getElementById('btnLogout');

  if (isLoggedIn) {
    if (container) {
      container.className = "w-full max-w-6xl mx-auto px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-all duration-300";
    }
    if (spacer) spacer.classList.add('hidden');
    if (brand) brand.classList.remove('mx-auto');
    if (guestBadge) guestBadge.classList.add('hidden');
    if (btnLogout) btnLogout.classList.remove('hidden');
  } else {
    if (container) {
      container.className = "w-full max-w-md mx-auto px-4 sm:px-0 py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-all duration-300";
    }
    if (spacer) spacer.classList.remove('hidden');
    if (brand) brand.classList.remove('mx-auto');
    if (guestBadge) guestBadge.classList.remove('hidden');
    if (btnLogout) btnLogout.classList.add('hidden');
  }
  aturTampilanPasangPWA(isLoggedIn, 'siswaHeaderRight', 'Siswa');
}

function showDashboard() {
  document.getElementById('loginSection')?.classList.add('hidden');
  document.getElementById('appSection')?.classList.remove('hidden');
  updateHeaderUI(true);

  document.getElementById('profileNama').textContent = currentStudent.nama;
  document.getElementById('profileDetail').textContent = `NIS: ${currentStudent.nis} | Kelas: ${currentStudent.kelas}`;

  const inputKelasTugas = document.getElementById('tugasKelas');
  if (inputKelasTugas) inputKelasTugas.value = `Kelas ${currentStudent.kelas}`;

  loadRiwayat();
  loadPengumumanSiswa();
  loadDaftarTugasGuru();
}

async function logout() {
  const yakin = await konfirmasiModal({
    judul: 'Keluar Portal Siswa',
    pesan: 'Apakah Anda yakin ingin keluar dari akun ini?',
    teksKonfirmasi: 'Keluar',
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

// 2. Navigasi Antar Menu Siswa
function switchTab(tab) {
  ['absen', 'tugas', 'izin', 'riwayat'].forEach((t) => {
    const content = document.getElementById(`tabContent-${t}`);
    const btn = document.getElementById(`tabBtn-${t}`);
    if (content) content.classList.add('hidden');
    if (btn) {
      btn.classList.remove('bg-blue-700', 'text-white');
      btn.classList.add('text-slate-600');
    }
  });

  const activeContent = document.getElementById(`tabContent-${tab}`);
  const activeBtn = document.getElementById(`tabBtn-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-blue-700', 'text-white');
    activeBtn.classList.remove('text-slate-600');
  }

  if (tab !== 'absen') stopScanner();
  if (tab === 'tugas') loadDaftarTugasGuru();
  if (tab === 'izin') loadRiwayatIzin();
  if (tab === 'riwayat') loadRiwayat();
}

// 3. Fungsi Kamera QR Scanner & Absensi
function startScanner() {
  const alertBox = document.getElementById('absenAlert');
  if (alertBox) alertBox.classList.add('hidden');

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('reader');
  }

  html5QrCode
    .start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      async (decodedText) => {
        await stopScanner();
        kirimAbsensi(decodedText);
      },
      () => {}
    )
    .then(() => {
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
  const btnStart = document.getElementById('btnStartScan');
  const btnStop = document.getElementById('btnStopScan');
  if (btnStart) btnStart.classList.remove('hidden');
  if (btnStop) btnStop.classList.add('hidden');
}

async function kirimAbsensi(qrCodeData) {
  const alertBox = document.getElementById('absenAlert');
  if (alertBox) {
    alertBox.className =
      'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-blue-50 text-blue-700 flex items-center justify-center gap-2 transition-all';
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

    if (!navigator.onLine) {
      if (typeof simpanKeAntreanOffline === 'function') {
        simpanKeAntreanOffline(payload);
      }
      bunyikanBeep('success');

      if (alertBox) {
        alertBox.className =
          'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-amber-100 text-amber-800 flex items-center justify-center gap-2 transition-all';
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
        alertBox.className =
          'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-green-100 text-green-800 flex items-center justify-center gap-2 transition-all';
        alertBox.innerHTML = `${ICONS.check}<span>${result.message} (${result.waktu})</span>`;
      }

      showToast(result.message || 'Absensi berhasil dicatat!', 'success');
      if (typeof loadRiwayat === 'function') loadRiwayat();
    } else {
      throw new Error(result.message || 'Gagal memproses absensi.');
    }
  } catch (err) {
    const isNetworkError =
      !navigator.onLine ||
      err.name === 'TypeError' ||
      (err.message && err.message.toLowerCase().includes('failed to fetch'));

    if (isNetworkError) {
      if (typeof simpanKeAntreanOffline === 'function') {
        simpanKeAntreanOffline(payload);
      }
      bunyikanBeep('success');

      if (alertBox) {
        alertBox.className =
          'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-amber-100 text-amber-800 flex items-center justify-center gap-2 transition-all';
        alertBox.innerHTML = `${ICONS.info}<span>Jaringan terputus. Data disimpan di antrean offline.</span>`;
      }

      showToast('Koneksi terputus: Disimpan ke antrean offline.', 'warning');
      return;
    }

    bunyikanBeep('error');

    if (alertBox) {
      alertBox.className =
        'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-red-100 text-red-700 flex items-center justify-center gap-2 transition-all';
      alertBox.innerHTML = `${ICONS.error}<span>Gagal mencatat absensi: ${err.message || 'Kesalahan server'}</span>`;
    }

    showToast(err.message || 'Gagal mencatat absensi.', 'error');
  }
}

// 4. Memuat Daftar Tugas Guru
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
        ? `<a href="${t.link}" target="_blank" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center">Buka File Soal ${ICONS.external}</a>`
        : '';
      const safeJudul = (t.judul || '').replace(/'/g, "\\'");
      const safeMapel = (t.mapel || '').replace(/'/g, "\\'");

      return `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span class="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md w-fit">${t.mapel}</span>
            <span class="text-[11px] text-slate-500 font-medium">Batas Waktu: ${t.deadline || '-'}</span>
          </div>
          <h4 class="text-sm font-bold text-slate-800">${t.judul}</h4>
          <p class="text-xs text-slate-600 leading-relaxed">${t.deskripsi || '-'}</p>
          <div class="pt-2 flex items-center justify-between gap-2 flex-wrap">
            ${fileLinkBtn}
            <button type="button" onclick="pilihTugas('${safeJudul}', '${safeMapel}')" class="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition ml-auto">Kumpul Tugas Ini</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-3">Gagal memuat daftar tugas terbaru.</p>`;
  }
}

function pilihTugas(judul, mapel) {
  const inputJudul = document.getElementById('judulTugas');
  const selectMapel = document.getElementById('mapel');
  if (inputJudul) inputJudul.value = judul;
  if (selectMapel && mapel) selectMapel.value = mapel;
  inputJudul?.scrollIntoView({ behavior: 'smooth' });
}

// 5. Upload Tugas Siswa
document.getElementById('tugasForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitTugas');
  const alertBox = document.getElementById('tugasAlert');
  const fileInput = document.getElementById('fileTugas')?.files?.[0];
  const judulVal = document.getElementById('judulTugas').value.trim();

  if (!fileInput) {
    showToast('Harap pilih berkas/file tugas Anda!', 'error');
    return;
  }

  btn.textContent = 'Mengupload ke Google Drive...';
  btn.disabled = true;
  alertBox.classList.add('hidden');

  const formData = new FormData();
  formData.append('nis', currentStudent.nis);
  formData.append('nama', currentStudent.nama);
  formData.append('kelas', currentStudent.kelas);
  formData.append('mapel', document.getElementById('mapel').value);
  formData.append('judulTugas', judulVal);
  formData.append('judul', judulVal);
  formData.append('fileTugas', fileInput);

  try {
    const res = await fetch('/api/tugas', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (result.success) {
      alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-green-100 text-green-800';
      alertBox.innerHTML = `
        <div class="flex items-center justify-center gap-1.5 font-bold mb-1">${ICONS.check}<span>${result.message}</span></div>
        <a href="${result.fileLink}" target="_blank" class="underline font-bold inline-flex items-center text-blue-700">Lihat File di Google Drive ${ICONS.external}</a>
      `;
      alertBox.classList.remove('hidden');
      showToast('Tugas berhasil diupload!', 'success');
      document.getElementById('tugasForm').reset();
      document.getElementById('tugasKelas').value = `Kelas ${currentStudent.kelas}`;
      loadRiwayat();
    } else {
      throw new Error(result.message || result.error);
    }
  } catch (err) {
    alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-red-100 text-red-700 flex items-center justify-center gap-1.5';
    alertBox.innerHTML = `${ICONS.error}<span>Gagal mengupload tugas: ${err.message || 'Kesalahan jaringan'}</span>`;
    alertBox.classList.remove('hidden');
    showToast('Gagal mengupload tugas.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg><span>Kirim Tugas ke Google Drive</span>`;
    btn.disabled = false;
  }
});

// 6. Muat Riwayat Absen & Tugas
async function loadRiwayat() {
  if (!currentStudent) return;
  try {
    const res = await fetch(`/api/riwayat/${currentStudent.nis}`);
    const result = await res.json();
    if (!result.success) return;

    const tbodyAbsen = document.getElementById('tableAbsensi');
    if (result.absensi.length === 0) {
      tbodyAbsen.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada riwayat absensi.</td></tr>`;
    } else {
      tbodyAbsen.innerHTML = result.absensi.map((item) => `
        <tr class="hover:bg-slate-50">
          <td class="p-2.5 font-medium">${item.waktu}</td>
          <td class="p-2.5">${item.kelas}</td>
          <td class="p-2.5"><span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">${item.status}</span></td>
          <td class="p-2.5 text-slate-500">${item.keterangan}</td>
        </tr>
      `).join('');
    }

    const tbodyTugas = document.getElementById('tableTugas');
    if (result.tugas.length === 0) {
      tbodyTugas.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada tugas yang dikumpulkan.</td></tr>`;
    } else {
      tbodyTugas.innerHTML = result.tugas.map((item) => {
        const badgeNilai = item.nilai
          ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center">${ICONS.star} Nilai: ${item.nilai}</span>`
          : `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold text-[11px] inline-block">Menunggu Dinilai</span>`;
        const catatanGuru = item.catatan
          ? `<div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-200 flex items-start gap-1">${ICONS.chat}<span><b>Catatan Guru:</b> ${item.catatan}</span></div>`
          : '';

        return `
          <tr class="hover:bg-slate-50 align-top">
            <td class="p-3 text-slate-500 whitespace-nowrap">${item.waktu}</td>
            <td class="p-3 font-semibold text-blue-700">${item.mapel}</td>
            <td class="p-3">
              <div class="font-bold text-slate-800">${item.judul}</div>
              ${catatanGuru}
            </td>
            <td class="p-3 text-right">
              <div class="mb-1">${badgeNilai}</div>
              <a href="${item.link}" target="_blank" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-bold inline-flex items-center text-xs">Buka File ${ICONS.external}</a>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Gagal memuat riwayat:', err);
  }
}

// 7. Pengajuan Izin Siswa
document.getElementById('izinForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitIzin');
  const alertBox = document.getElementById('izinAlert');
  btn.textContent = 'Mengirim...';
  btn.disabled = true;
  alertBox.classList.add('hidden');

  const formData = new FormData();
  formData.append('nis', currentStudent.nis);
  formData.append('nama', currentStudent.nama);
  formData.append('kelas', currentStudent.kelas);
  formData.append('statusIzin', document.getElementById('statusIzin').value);
  formData.append('tanggalMulai', document.getElementById('tanggalMulai').value);
  formData.append('keterangan', document.getElementById('keteranganIzin').value.trim());

  const fileInput = document.getElementById('fileBukti').files[0];
  if (fileInput) formData.append('fileBukti', fileInput);

  try {
    const res = await fetch('/api/izin', { method: 'POST', body: formData });
    const result = await res.json();
    if (result.success) {
      alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-green-100 text-green-800 flex items-center justify-center gap-1.5';
      alertBox.innerHTML = `${ICONS.check}<span>${result.message}</span>`;
      alertBox.classList.remove('hidden');
      showToast('Pengajuan izin terkirim!', 'success');
      document.getElementById('izinForm').reset();
      loadRiwayatIzin();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-red-100 text-red-700 flex items-center justify-center gap-1.5';
    alertBox.innerHTML = `${ICONS.error}<span>Gagal mengirim izin.</span>`;
    alertBox.classList.remove('hidden');
    showToast('Gagal mengirim izin.', 'error');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg><span>Kirim Pengajuan Izin</span>`;
    btn.disabled = false;
  }
});

async function loadRiwayatIzin() {
  if (!currentStudent) return;
  try {
    const res = await fetch(`/api/izin/${currentStudent.nis}`);
    const result = await res.json();
    const tbody = document.getElementById('tableRiwayatIzin');
    if (!tbody) return;

    if (!result.success || !result.izin || result.izin.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Belum ada riwayat izin / sakit.</td></tr>`;
      return;
    }

    tbody.innerHTML = result.izin.map((item) => {
      let badgeVerifikasi = `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold text-[11px] inline-flex items-center gap-1">Menunggu</span>`;
      if (item.verifikasi === 'Disetujui') {
        badgeVerifikasi = `<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[11px] inline-flex items-center gap-1">✓ Disetujui</span>`;
      } else if (item.verifikasi === 'Ditolak') {
        badgeVerifikasi = `<span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[11px] inline-flex items-center gap-1">✕ Ditolak</span>`;
      }

      const lampiranLink = (item.link && item.link !== '-' && item.link !== '#')
        ? `<a href="${item.link}" target="_blank" class="text-blue-600 font-bold underline inline-flex items-center">Lihat Surat ${ICONS.external}</a>`
        : '<span class="text-slate-400">Tanpa Lampiran</span>';

      return `
        <tr class="hover:bg-slate-50">
          <td class="p-2.5 text-slate-500 whitespace-nowrap">${item.waktu}</td>
          <td class="p-2.5"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">${item.status}</span></td>
          <td class="p-2.5 font-medium text-slate-800 whitespace-nowrap">${item.tanggal}</td>
          <td class="p-2.5 text-slate-600">${item.keterangan}</td>
          <td class="p-2.5 whitespace-nowrap">${lampiranLink}</td>
          <td class="p-2.5 whitespace-nowrap">${badgeVerifikasi}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Gagal memuat riwayat izin:', err);
  }
}

// 8. Pengumuman Sekolah
async function loadPengumumanSiswa() {
  const container = document.getElementById('listPengumumanSiswa');
  if (!container) return;

  if (!currentStudent) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-2">Silakan masuk untuk melihat pengumuman.</p>`;
    return;
  }

  try {
    const res = await fetch(`/api/pengumuman?kelas=${encodeURIComponent(currentStudent.kelas)}`);
    const result = await res.json();

    if (!result.success || !result.pengumuman || result.pengumuman.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-500 text-center py-3">Tidak ada pengumuman aktif saat ini.</p>`;
      return;
    }

    container.innerHTML = result.pengumuman.map((p) => {
      const isGlobal = p.target === 'SEMUA';
      const cardBg = isGlobal
        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 border-l-4 border-l-amber-500'
        : 'bg-white border-slate-200 border-l-4 border-l-blue-500';
      const badgeRole = isGlobal
        ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
            <svg class="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3 3h6a3 3 0 01-3 3z"/></svg> Pengumuman Resmi Sekolah
          </span>`
        : `<span class="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
            <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> Info Kelas ${p.target} (${p.kategori})
          </span>`;

      return `
        <div class="${cardBg} p-4 rounded-xl shadow-sm space-y-2 transition hover:shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>${badgeRole}</div>
            <span class="text-[10px] text-slate-500 font-medium">Berlaku s/d: ${p.tglBerakhir}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900">${p.judul}</h4>
          <p class="text-xs text-slate-700 whitespace-pre-line leading-relaxed">${p.isi}</p>
          <div class="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 mt-2">
            <span>Diterbitkan: <b>${p.pembuat}</b></span>
            <span class="text-[10px] text-slate-400">${p.waktu}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-red-500 text-center py-2">Gagal memuat pengumuman terbaru.</p>`;
  }
}
