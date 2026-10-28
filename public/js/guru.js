let currentGuru = null;
let qrGenerator = null;
let cacheDaftarTugas = [];
let cacheRekapAbsen = null;
let cacheRekapTugasFull = null;

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

// Fungsi Global Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-item ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info'}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Cek sesi login guru di SessionStorage saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const filterTgl = document.getElementById('filterTanggal');
  if (filterTgl) filterTgl.value = today;

  const savedGuru = sessionStorage.getItem('sibintang_guru_data');
  if (savedGuru) {
    try {
      currentGuru = JSON.parse(savedGuru);
      bukaDashboardGuru();
    } catch (e) {
      sessionStorage.removeItem('sibintang_guru_data');
    }
  }
});

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
    if (btnMasuk) btnMasuk.className = 'py-2 text-xs font-bold rounded-lg bg-indigo-800 text-white shadow-sm transition';
    if (btnDaftar) btnDaftar.className = 'py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-800 transition';
  } else {
    formMasuk.classList.add('hidden');
    formDaftar.classList.remove('hidden');
    if (btnDaftar) btnDaftar.className = 'py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white shadow-sm transition';
    if (btnMasuk) btnMasuk.className = 'py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-800 transition';
  }
}

// 1. Tampilkan opsi tambahan sesuai Role yang dipilih saat registrasi
function toggleRoleOptions() {
  const role = document.getElementById('regRoleGuru').value;
  const divKelas = document.getElementById('divKelasBinaan');
  const divMapel = document.getElementById('divMapelAjar');
  if (divKelas) divKelas.classList.add('hidden');
  if (divMapel) divMapel.classList.add('hidden');

  if (role === 'Wali Kelas' && divKelas) {
    divKelas.classList.remove('hidden');
  } else if (role === 'Guru Mapel' && divMapel) {
    divMapel.classList.remove('hidden');
  }
}

// 2A. Proses Masuk (Login) Guru Berdasarkan NIP
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
      showToast(`✅ Selamat datang kembali, ${currentGuru.nama} (${currentGuru.role})`, 'success');
      setTimeout(() => bukaDashboardGuru(), 800);
    } else {
      showToast(result.message || 'NIP belum terdaftar. Silakan daftar terlebih dahulu.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.textContent = 'Masuk ke Dashboard';
    btn.disabled = false;
  }
});

// 2B. Proses Registrasi (Daftar Baru) Guru / Pengelola
document.getElementById('formDaftarGuru')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitDaftarGuru');
  btn.textContent = 'Mendaftarkan...';
  btn.disabled = true;

  const payload = {
    nip: document.getElementById('regNip').value.trim(),
    nama: document.getElementById('regNamaGuru').value.trim(),
    role: document.getElementById('regRoleGuru').value,
    kelasBinaan: document.getElementById('regKelasBinaan')?.value || '-',
    mapelAjar: document.getElementById('regMapelAjar')?.value || '-',
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
      showToast(`✅ Registrasi berhasil! Selamat datang, ${currentGuru.nama}`, 'success');
      setTimeout(() => bukaDashboardGuru(), 800);
    } else {
      showToast(result.message || 'Gagal mendaftarkan akun pengelola.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.textContent = 'Daftar Akun Pengelola Baru';
    btn.disabled = false;
  }
});

function bukaDashboardGuru() {
  document.getElementById('loginGuruSection').classList.add('hidden');
  document.getElementById('dashboardGuruSection').classList.remove('hidden');
  document.getElementById('btnLogoutGuru').classList.remove('hidden');

  const infoNama = document.getElementById('infoNamaGuru');
  const infoRole = document.getElementById('infoRoleGuru');
  if (infoNama) infoNama.textContent = currentGuru?.nama || 'Pengelola';
  if (infoRole) {
    let detailRole = `Peran: ${currentGuru?.role || 'Guru'}`;
    if (currentGuru?.role === 'Wali Kelas') detailRole += ` | Kelas Binaan: ${currentGuru.kelasBinaan}`;
    if (currentGuru?.role === 'Guru Mapel') detailRole += ` | Mapel: ${currentGuru.mapelAjar}`;
    infoRole.textContent = detailRole;
  }

  if (currentGuru && currentGuru.role === 'Wali Kelas' && currentGuru.kelasBinaan !== '-') {
    const selAbsen = document.getElementById('filterKelas');
    const selTugas = document.getElementById('filterKelasTugas');
    if (selAbsen) {
      selAbsen.value = currentGuru.kelasBinaan;
      selAbsen.disabled = true;
    }
    if (selTugas) {
      selTugas.value = currentGuru.kelasBinaan;
      selTugas.disabled = true;
    }
  }

  updateDashboardAbsen();
  loadRekapTugas();
}

function logoutGuru() {
  sessionStorage.removeItem('sibintang_guru_data');
  currentGuru = null;
  showToast('Berhasil keluar dari sesi.', 'info');
  setTimeout(() => location.reload(), 500);
}

// 3. Navigasi Tab Guru & Sinkronisasi Pilihan Kelas
function switchGuruTab(tab) {
  ['absen', 'tugas', 'pengumuman'].forEach((t) => {
    const content = document.getElementById(`tabGuruContent-${t}`);
    const btn = document.getElementById(`tabGuruBtn-${t}`);
    if (content) content.classList.add('hidden');
    if (btn) {
      btn.classList.remove('bg-indigo-800', 'text-white', 'shadow');
      btn.classList.add('text-slate-600');
    }
  });

  const activeContent = document.getElementById(`tabGuruContent-${tab}`);
  const activeBtn = document.getElementById(`tabGuruBtn-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-indigo-800', 'text-white', 'shadow');
    activeBtn.classList.remove('text-slate-600');
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

// 4. Generate QR Code Absensi Harian
function generateQR() {
  const kelas = document.getElementById('filterKelas').value;
  const tanggal = document.getElementById('filterTanggal').value;
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

// 5. Ambil Rekap Kehadiran Siswa
async function loadRekapKelas() {
  const kelas = document.getElementById('filterKelas').value;
  const tanggal = document.getElementById('filterTanggal').value;

  try {
    const res = await fetch(`/api/guru/rekap?kelas=${encodeURIComponent(kelas)}&tanggal=${encodeURIComponent(tanggal)}`);
    const data = await res.json();
    if (!data.success) return;

    cacheRekapAbsen = data;
    document.getElementById('statTotal').textContent = data.totalSiswa;
    document.getElementById('statHadir').textContent = data.jumlahHadir;
    document.getElementById('statBelum').textContent = data.jumlahBelum;
    document.getElementById('badgeBelum').textContent = `${data.jumlahBelum} Siswa`;
    document.getElementById('badgeHadir').textContent = `${data.jumlahHadir} Siswa`;

    const tbodyBelum = document.getElementById('tbodyBelumAbsen');
    if (data.belumAbsen.length === 0) {
      tbodyBelum.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-emerald-600 font-semibold">🎉 Semua siswa terdaftar di Kelas ${kelas} sudah absen hari ini!</td></tr>`;
    } else {
      tbodyBelum.innerHTML = data.belumAbsen
        .map((s) => {
          const cleanPhone = (s.nohp || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
          const waText = encodeURIComponent(
            `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa ananda *${s.nama}* (Kelas ${s.kelas}) belum tercatat melakukan scan absensi pada tanggal ${tanggal}. Terima kasih.`
          );
          const waBtn = cleanPhone
            ? `<a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-bold inline-block">Hubungi Ortu</a>`
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
    if (data.sudahAbsen.length === 0) {
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

// 6. Ambil Daftar & Rekap Pengumpulan Tugas
async function loadRekapTugas() {
  const kelas = document.getElementById('filterKelasTugas').value;
  const mapel = document.getElementById('filterMapelTugas').value;

  try {
    const res = await fetch(`/api/guru/tugas?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`);
    const data = await res.json();
    if (!data.success) return;

    cacheRekapTugasFull = data;
    cacheDaftarTugas = data.daftarTugas || [];

    document.getElementById('statTotalFileTugas').textContent = `${data.totalTerkumpul} File`;
    document.getElementById('statSiswaSudahTugas').textContent = `${data.jumlahSiswaSudah} Siswa`;
    document.getElementById('statSiswaBelumTugas').textContent = `${data.jumlahSiswaBelum} Siswa`;
    document.getElementById('badgeBelumTugas').textContent = `${data.jumlahSiswaBelum} Siswa`;

    renderTabelTugas(cacheDaftarTugas);

    const tbodyBelumTugas = document.getElementById('tbodyBelumTugas');
    const infoMapel = mapel === 'SEMUA' ? 'PR/Tugas Sekolah' : `Mata Pelajaran ${mapel}`;

    if (data.belumKumpul.length === 0) {
      tbodyBelumTugas.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-emerald-600 font-semibold">🎉 Seluruh siswa di Kelas ${kelas} sudah mengumpulkan tugas pada kategori ini!</td></tr>`;
    } else {
      tbodyBelumTugas.innerHTML = data.belumKumpul
        .map((s) => {
          const cleanPhone = (s.nohp || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
          const waText = encodeURIComponent(
            `Halo Bapak/Ibu ${s.ortu}, kami dari SD RK Bintang Timur Rantauprapat menginformasikan bahwa ananda *${s.nama}* (Kelas ${s.kelas}) belum mengumpulkan *${infoMapel}* di aplikasi SiBintang. Mohon bantuannya untuk mengingatkan ananda. Terima kasih.`
          );
          const waBtn = cleanPhone
            ? `<a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold inline-block">Ingatkan Ortu</a>`
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

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">Belum ada file PR/Tugas yang dikumpulkan untuk filter ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((item) => {
      const badgeNilai = item.nilai
        ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold text-xs">⭐ ${item.nilai}</span>`
        : `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold text-[11px]">Belum Dinilai</span>`;
      const catatanText = item.catatan ? `<div class="text-[11px] text-slate-500 italic mt-0.5">"${item.catatan}"</div>` : '';

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
            <a href="${item.link}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl font-bold inline-block text-xs">File ↗</a>
            <button onclick="openModalNilai(${item.rowIndex}, '${item.nama.replace(/'/g, '')}', '${item.judul.replace(/'/g, '')}', '${item.nilai || ''}', '${(item.catatan || '').replace(/'/g, '')}')" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2.5 py-1.5 rounded-xl font-bold inline-block text-xs">
              ✍️ Nilai
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

async function submitNilaiGuru(e) {
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
      showToast('✅ Nilai dan catatan berhasil disimpan!', 'success');
      closeModalNilai();
      loadRekapTugas();
    } else {
      showToast(result.message || 'Gagal menyimpan nilai.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.textContent = 'Simpan Nilai';
    btn.disabled = false;
  }
}

// 8. Fitur Export ke Excel (CSV)
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
  sudahAbsen.forEach((s) => {
    rows.push([no++, `'${s.nis}`, s.nama, s.jk, s.kelas, s.status || 'Hadir', s.waktuAbsen || '-', s.ortu || '-', `'${s.nohp || '-'}`]);
  });
  belumAbsen.forEach((s) => {
    rows.push([no++, `'${s.nis}`, s.nama, s.jk, s.kelas, 'Belum Absen', '-', s.ortu || '-', `'${s.nohp || '-'}`]);
  });
  downloadCSVFile(`Rekap_Absensi_Kelas_${kelas}_${tanggal}.csv`, rows);
  showToast('File CSV absensi berhasil diunduh.', 'success');
}

function exportTugasCSV() {
  const kelas = document.getElementById('filterKelasTugas').value;
  const mapel = document.getElementById('filterMapelTugas').value;
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

// 9. Kelola Pengumuman Sekolah
const templatePengumumanData = {
  libur: {
    judul: 'Jadwal Libur Sekolah dan Cuti Bersama',
    isi: 'Diberitahukan kepada seluruh siswa dan orang tua murid SD RK Bintang Timur Rantauprapat bahwa kegiatan belajar mengajar diliburkan mulai tanggal ... sampai dengan ... dalam rangka libur semester. Kegiatan sekolah akan aktif kembali seperti biasa pada hari ...',
  },
  rapor: {
    judul: 'Jadwal Pengambilan Rapor / Buku Laporan Hasil Belajar',
    isi: 'Kepada Bapak/Ibu Orang Tua/Wali murid, diundang untuk hadir pada pengambilan Buku Laporan Hasil Belajar (Rapor) semester ini yang akan dilaksanakan pada hari ..., tanggal ..., pukul ... bertempat di ruang kelas masing-masing.',
  },
  tugas: {
    judul: 'Peringatan Pengumpulan Tugas dan PR Sekolah',
    isi: 'Diingatkan kepada seluruh siswa untuk segera menyelesaikan dan mengumpulkan PR atau tugas sekolah yang belum diserahkan melalui aplikasi SiBintang sebelum batas waktu yang telah ditentukan oleh guru mata pelajaran.',
  },
  upacara: {
    judul: 'Pemberitahuan Kegiatan Upacara / Ekstrakurikuler Wajib',
    isi: 'Diberitahukan kepada seluruh siswa agar hadir tepat waktu pada kegiatan sekolah yang akan dilaksanakan pada hari ... pukul ... dengan mengenakan pakaian seragam lengkap sesuai ketentuan sekolah.',
  },
};

function pilihTemplatePengumuman() {
  const kunci = document.getElementById('p_template').value;
  const inputJudul = document.getElementById('p_judul');
  const inputIsi = document.getElementById('p_isi');
  if (templatePengumumanData[kunci]) {
    inputJudul.value = templatePengumumanData[kunci].judul;
    inputIsi.value = templatePengumumanData[kunci].isi;
  } else {
    inputJudul.value = '';
    inputIsi.value = '';
  }
}

async function submitPengumuman(e) {
  e.preventDefault();
  const judul = document.getElementById('p_judul').value.trim();
  const isi = document.getElementById('p_isi').value.trim();
  const btn = document.getElementById('btnKirimPengumuman');
  btn.textContent = 'Menerbitkan...';
  btn.disabled = true;

  const pembuatNama = currentGuru ? `${currentGuru.nama} (${currentGuru.role})` : 'Dewan Guru';

  try {
    const res = await fetch('/api/guru/pengumuman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, isi, pembuat: pembuatNama }),
    });
    const result = await res.json();
    if (result.success) {
      showToast('✅ Pengumuman berhasil diterbitkan!', 'success');
      document.getElementById('formPengumuman').reset();
    } else {
      showToast(result.message || 'Gagal menerbitkan pengumuman.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  } finally {
    btn.textContent = 'Terbitkan Pengumuman';
    btn.disabled = false;
  }
}
