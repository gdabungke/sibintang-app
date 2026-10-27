const PIN_STANDAR_GURU = '123456';
let qrGenerator = null;
let cacheDaftarTugas = [];
let cacheRekapAbsen = null;
let cacheRekapTugasFull = null;

window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterTanggal').value = today;

  if (sessionStorage.getItem('sibintang_guru_auth') === 'true') {
    bukaDashboardGuru();
  }
});

// 1. Login PIN Guru
document.getElementById('loginGuruForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const inputPin = document.getElementById('pinGuru').value.trim();
  if (inputPin === PIN_STANDAR_GURU) {
    sessionStorage.setItem('sibintang_guru_auth', 'true');
    bukaDashboardGuru();
  } else {
    alert('PIN Guru tidak sesuai! Gunakan PIN standar: 123456');
  }
});

function bukaDashboardGuru() {
  document.getElementById('loginGuruSection').classList.add('hidden');
  document.getElementById('dashboardGuruSection').classList.remove('hidden');
  document.getElementById('btnLogoutGuru').classList.remove('hidden');
  updateDashboardAbsen();
  loadRekapTugas();
}

function logoutGuru() {
  sessionStorage.removeItem('sibintang_guru_auth');
  location.reload();
}

// 2. Navigasi Tab Guru & Sinkronisasi Pilihan Kelas
function switchGuruTab(tab) {
  ['absen', 'tugas'].forEach((t) => {
    document.getElementById(`tabGuruContent-${t}`).classList.add('hidden');
    const btn = document.getElementById(`tabGuruBtn-${t}`);
    btn.classList.remove('bg-indigo-800', 'text-white', 'shadow');
    btn.classList.add('text-slate-600');
  });

  document.getElementById(`tabGuruContent-${tab}`).classList.remove('hidden');
  const activeBtn = document.getElementById(`tabGuruBtn-${tab}`);
  activeBtn.classList.add('bg-indigo-800', 'text-white', 'shadow');
  activeBtn.classList.remove('text-slate-600');

  if (tab === 'absen') loadRekapKelas();
  if (tab === 'tugas') loadRekapTugas();
}

function sinkronKelas(source) {
  if (source === 'absen') {
    const val = document.getElementById('filterKelas').value;
    document.getElementById('filterKelasTugas').value = val;
    updateDashboardAbsen();
  } else {
    const val = document.getElementById('filterKelasTugas').value;
    document.getElementById('filterKelas').value = val;
    loadRekapTugas();
  }
}

function updateDashboardAbsen() {
  generateQR();
  loadRekapKelas();
}

// 3. Generate QR Code Absensi Harian
function generateQR() {
  const kelas = document.getElementById('filterKelas').value;
  const tanggal = document.getElementById('filterTanggal').value;
  const sesi = document.getElementById('ketSesi').value.trim() || 'Harian';
  const qrDataString = `ABSEN-SIBINTANG|${kelas}|${tanggal}|${sesi}`;

  document.getElementById('qrTitleKelas').textContent = `QR Absensi Kelas ${kelas}`;
  document.getElementById('qrSubTanggal').textContent = `Tanggal: ${tanggal} (${sesi})`;
  document.getElementById('qrPayloadText').textContent = qrDataString;

  const container = document.getElementById('qrcodeContainer');
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

// 4. Ambil Rekap Kehadiran Siswa
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
              <td class="p-2.5 font-mono text-slate-600">${s.nik}</td>
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
            <td class="p-2.5 font-mono text-slate-500">${s.nik}</td>
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

// 5. Ambil Daftar & Rekap Pengumpulan Tugas
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
              <td class="p-2.5 font-mono text-slate-600">${s.nik}</td>
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
  document.getElementById('badgeJumlahTugas').textContent = `${list.length} File Tugas`;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Belum ada file PR/Tugas yang dikumpulkan untuk filter ini.</td></tr>`;
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
            <div class="text-[11px] font-mono text-slate-400">NIK: ${item.nik}</div>
          </td>
          <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">${item.kelas}</span></td>
          <td class="p-3"><span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">${item.mapel}</span></td>
          <td class="p-3 font-medium text-slate-700">
            ${item.judul}
            ${catatanText}
          </td>
          <td class="p-3 text-center">${badgeNilai}</td>
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
      item.nik.toLowerCase().includes(keyword) ||
      item.judul.toLowerCase().includes(keyword) ||
      item.mapel.toLowerCase().includes(keyword)
  );
  renderTabelTugas(hasil);
}

// 6. Modal Penilaian Guru
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
      closeModalNilai();
      loadRekapTugas();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('Gagal terhubung ke server.');
  } finally {
    btn.textContent = '💾 Simpan Nilai';
    btn.disabled = false;
  }
}

// 7. Fitur Export ke Excel (CSV)
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
    alert('Data absensi belum termuat. Silakan klik Segarkan Rekap terlebih dahulu.');
    return;
  }

  const { kelas, tanggal, sudahAbsen, belumAbsen } = cacheRekapAbsen;
  if (sudahAbsen.length === 0 && belumAbsen.length === 0) {
    alert('Belum ada data siswa di kelas ini untuk di-export.');
    return;
  }

  const rows = [
    ['REKAP ABSENSI HARIAN - SD RK BINTANG TIMUR RANTAUPRAPAT'],
    [`Kelas: ${kelas}`, `Tanggal: ${tanggal}`],
    [],
    ['No', 'NIK / NISN', 'Nama Lengkap Siswa', 'L/P', 'Kelas', 'Status Kehadiran', 'Waktu Scan Absen', 'Nama Orang Tua', 'No. HP Ortu'],
  ];

  let no = 1;
  sudahAbsen.forEach((s) => {
    rows.push([no++, `'${s.nik}`, s.nama, s.jk, s.kelas, s.status || 'Hadir', s.waktuAbsen || '-', s.ortu || '-', `'${s.nohp || '-'}`]);
  });

  belumAbsen.forEach((s) => {
    rows.push([no++, `'${s.nik}`, s.nama, s.jk, s.kelas, 'Belum Absen', '-', s.ortu || '-', `'${s.nohp || '-'}`]);
  });

  downloadCSVFile(`Rekap_Absensi_Kelas_${kelas}_${tanggal}.csv`, rows);
}

function exportTugasCSV() {
  const kelas = document.getElementById('filterKelasTugas').value;
  const mapel = document.getElementById('filterMapelTugas').value;

  if (!cacheDaftarTugas || cacheDaftarTugas.length === 0) {
    alert('Belum ada data tugas terkumpul pada filter ini untuk di-export.');
    return;
  }

  const rows = [
    ['REKAP PENGUMPULAN & NILAI TUGAS - SD RK BINTANG TIMUR RANTAUPRAPAT'],
    [`Kelas: ${kelas}`, `Mata Pelajaran: ${mapel}`],
    [],
    ['No', 'Waktu Upload', 'NIK / NISN', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Judul / Keterangan Tugas', 'Nilai Angka', 'Catatan Guru', 'Link File Google Drive'],
  ];

  cacheDaftarTugas.forEach((t, idx) => {
    rows.push([
      idx + 1,
      t.waktu,
      `'${t.nik}`,
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
    rows.push(['No', 'NIK / NISN', 'Nama Siswa', 'Kelas', 'Nama Orang Tua', 'No. HP Ortu']);
    cacheRekapTugasFull.belumKumpul.forEach((s, idx) => {
      rows.push([idx + 1, `'${s.nik}`, s.nama, s.kelas, s.ortu || '-', `'${s.nohp || '-'}`]);
    });
  }

  const cleanMapel = mapel.replace(/[^a-zA-Z0-9]/g, '_');
  downloadCSVFile(`Rekap_Nilai_Tugas_Kelas_${kelas}_${cleanMapel}.csv`, rows);
}

// =========================================================
// REGISTRASI PWA SERVICE WORKER & TOMBOL INSTALL OTOMATIS
// =========================================================
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('PWA Service Worker SiBintang aktif.'))
      .catch((err) => console.error('Gagal mendaftarkan Service Worker:', err));
  });
}

// Tangkap event instalasi PWA di Android / Chrome Desktop
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  tampilkanBannerInstallPWA();
});

function tampilkanBannerInstallPWA() {
  if (document.getElementById('pwaInstallBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.className = 'fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between z-50 border border-slate-700 no-print';
  banner.innerHTML = `
    <div class="flex items-center space-x-3">
      <div class="bg-yellow-400 text-blue-900 font-bold rounded-xl w-9 h-9 flex items-center justify-center text-lg shadow">★</div>
      <div>
        <p class="text-xs font-bold">Install Aplikasi SiBintang</p>
        <p class="text-[11px] text-slate-300">Pasang di layar utama HP agar lebih praktis</p>
      </div>
    </div>
    <div class="flex items-center space-x-1.5">
      <button id="btnConfirmInstallPWA" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
        Install
      </button>
      <button onclick="document.getElementById('pwaInstallBanner').remove()" class="text-slate-400 hover:text-white px-1.5 text-sm font-bold">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('btnConfirmInstallPWA').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      banner.remove();
    }
    deferredPrompt = null;
  });
}

// Fungsi Global Toast Notification
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  toast.innerHTML = `
    <div class="flex items-center space-x-2.5">
      <span class="font-bold">${type === 'success' ? 'SUKSES:' : type === 'error' ? 'PERHATIAN:' : 'INFO:'}</span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Perbarui fungsi switchGuruTab agar mencakup 'pengumuman'
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

// Handler Kirim Pengumuman
async function submitPengumuman(e) {
  e.preventDefault();
  const judul = document.getElementById('p_judul').value.trim();
  const isi = document.getElementById('p_isi').value.trim();
  const btn = document.getElementById('btnKirimPengumuman');

  btn.textContent = 'Menerbitkan...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/guru/pengumuman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, isi, pembuat: 'Dewan Guru SD RK Bintang Timur' })
    });
    const result = await res.json();
    if (result.success) {
      alert(result.message);
      document.getElementById('formPengumuman').reset();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('Gagal terhubung ke server.');
  } finally {
    btn.textContent = 'Terbitkan Pengumuman';
    btn.disabled = false;
  }
}

// Data Template Pengumuman Otomatis
const templatePengumumanData = {
  libur: {
    judul: "Jadwal Libur Sekolah dan Cuti Bersama",
    isi: "Diberitahukan kepada seluruh siswa dan orang tua murid SD RK Bintang Timur Rantauprapat bahwa kegiatan belajar mengajar diliburkan mulai tanggal ... sampai dengan ... dalam rangka libur semester. Kegiatan sekolah akan aktif kembali seperti biasa pada hari ..."
  },
  rapor: {
    judul: "Jadwal Pengambilan Rapor / Buku Laporan Hasil Belajar",
    isi: "Kepada Bapak/Ibu Orang Tua/Wali murid, diundang untuk hadir pada pengambilan Buku Laporan Hasil Belajar (Rapor) semester ini yang akan dilaksanakan pada hari ..., tanggal ..., pukul ... bertempat di ruang kelas masing-masing."
  },
  tugas: {
    judul: "Peringatan Pengumpulan Tugas dan PR Sekolah",
    isi: "Diingatkan kepada seluruh siswa untuk segera menyelesaikan dan mengumpulkan PR atau tugas sekolah yang belum diserahkan melalui aplikasi SiBintang sebelum batas waktu yang telah ditentukan oleh guru mata pelajaran."
  },
  upacara: {
    judul: "Pemberitahuan Kegiatan Upacara / Ekstrakurikuler Wajib",
    isi: "Diberitahukan kepada seluruh siswa agar hadir tepat waktu pada kegiatan sekolah yang akan dilaksanakan pada hari ... pukul ... dengan mengenakan pakaian seragam lengkap sesuai ketentuan sekolah."
  }
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