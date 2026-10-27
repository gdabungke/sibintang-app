let currentStudent = null;
let html5QrCode = null;

// Cek sesi login di LocalStorage saat halaman dibuka
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('sibintang_siswa');
  if (saved) {
    currentStudent = JSON.parse(saved);
    showDashboard();
  }
});

// 1. Proses Login Siswa
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitLogin');
  btn.textContent = 'Memproses...';
  btn.disabled = true;

  const payload = {
    nik: document.getElementById('nik').value.trim(),
    nama: document.getElementById('nama').value.trim(),
    kelas: document.getElementById('kelas').value,
    jk: document.getElementById('jk').value,
    ortu: document.getElementById('ortu').value.trim(),
    nohp: document.getElementById('nohp').value.trim(),
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
      localStorage.setItem('sibintang_siswa', JSON.stringify(currentStudent));
      showDashboard();
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('Gagal terhubung ke server.');
  } finally {
    btn.textContent = 'Masuk Aplikasi';
    btn.disabled = false;
  }
});

function showDashboard() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('appSection').classList.remove('hidden');
  document.getElementById('btnLogout').classList.remove('hidden');

  document.getElementById('profileNama').textContent = currentStudent.nama;
  document.getElementById('profileDetail').textContent = `NIK: ${currentStudent.nik} | Kelas: ${currentStudent.kelas}`;
  document.getElementById('tugasKelas').value = `Kelas ${currentStudent.kelas}`;

  loadRiwayat();
}

function logout() {
  stopScanner();
  localStorage.removeItem('sibintang_siswa');
  currentStudent = null;
  document.getElementById('appSection').classList.add('hidden');
  document.getElementById('btnLogout').classList.add('hidden');
  document.getElementById('loginSection').classList.remove('hidden');
}

// 2. Navigasi Antar Menu Siswa
function switchTab(tab) {
  ['absen', 'tugas', 'riwayat'].forEach((t) => {
    document.getElementById(`tabContent-${t}`).classList.add('hidden');
    const btn = document.getElementById(`tabBtn-${t}`);
    btn.classList.remove('bg-blue-700', 'text-white');
    btn.classList.add('text-slate-600');
  });

  document.getElementById(`tabContent-${tab}`).classList.remove('hidden');
  const activeBtn = document.getElementById(`tabBtn-${tab}`);
  activeBtn.classList.add('bg-blue-700', 'text-white');
  activeBtn.classList.remove('text-slate-600');

  if (tab !== 'absen') stopScanner();
  if (tab === 'riwayat') loadRiwayat();
}

// 3. Fungsi Kamera QR Scanner
function startScanner() {
  const alertBox = document.getElementById('absenAlert');
  alertBox.classList.add('hidden');

  html5QrCode = new Html5Qrcode('reader');
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
      document.getElementById('btnStartScan').classList.add('hidden');
      document.getElementById('btnStopScan').classList.remove('hidden');
    })
    .catch(() => {
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda.');
    });
}

async function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    await html5QrCode.stop();
    html5QrCode.clear();
  }
  document.getElementById('btnStartScan').classList.remove('hidden');
  document.getElementById('btnStopScan').classList.add('hidden');
}

async function kirimAbsensi(qrCodeData) {
  const alertBox = document.getElementById('absenAlert');
  alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-blue-50 text-blue-700';
  alertBox.textContent = 'Mencatat kehadiran ke Google Sheet...';
  alertBox.classList.remove('hidden');

  try {
    const res = await fetch('/api/absen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nik: currentStudent.nik,
        nama: currentStudent.nama,
        kelas: currentStudent.kelas,
        qrCodeData,
      }),
    });
    const result = await res.json();
    if (result.success) {
      alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-green-100 text-green-800';
      alertBox.textContent = `✅ ${result.message} (${result.waktu})`;
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-red-100 text-red-700';
    alertBox.textContent = '❌ Gagal mencatat absensi.';
  }
}

// 4. Proses Upload Tugas ke Google Drive & Sheet
document.getElementById('tugasForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitTugas');
  const alertBox = document.getElementById('tugasAlert');

  btn.textContent = 'Mengupload ke Google Drive...';
  btn.disabled = true;
  alertBox.classList.add('hidden');

  const formData = new FormData();
  formData.append('nik', currentStudent.nik);
  formData.append('nama', currentStudent.nama);
  formData.append('kelas', currentStudent.kelas);
  formData.append('mapel', document.getElementById('mapel').value);
  formData.append('judulTugas', document.getElementById('judulTugas').value.trim());
  formData.append('fileTugas', document.getElementById('fileTugas').files[0]);

  try {
    const res = await fetch('/api/tugas', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (result.success) {
      alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-green-100 text-green-800';
      alertBox.innerHTML = `✅ ${result.message} <br><a href="${result.fileLink}" target="_blank" class="underline font-bold mt-1 inline-block">Lihat File di Google Drive</a>`;
      alertBox.classList.remove('hidden');
      document.getElementById('tugasForm').reset();
      document.getElementById('tugasKelas').value = `Kelas ${currentStudent.kelas}`;
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-red-100 text-red-700';
    alertBox.textContent = '❌ Gagal mengupload tugas. Periksa koneksi atau ukuran file.';
    alertBox.classList.remove('hidden');
  } finally {
    btn.textContent = '📤 Kirim Tugas ke Google Drive';
    btn.disabled = false;
  }
});

// 5. Muat Riwayat Absen & Tugas (Beserta Nilai & Catatan Guru)
async function loadRiwayat() {
  if (!currentStudent) return;
  try {
    const res = await fetch(`/api/riwayat/${currentStudent.nik}`);
    const result = await res.json();
    if (!result.success) return;

    const tbodyAbsen = document.getElementById('tableAbsensi');
    if (result.absensi.length === 0) {
      tbodyAbsen.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada riwayat absensi.</td></tr>`;
    } else {
      tbodyAbsen.innerHTML = result.absensi
        .map(
          (item) => `
          <tr class="hover:bg-slate-50">
            <td class="p-2.5 font-medium">${item.waktu}</td>
            <td class="p-2.5">${item.kelas}</td>
            <td class="p-2.5"><span class="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">${item.status}</span></td>
            <td class="p-2.5 text-slate-500">${item.keterangan}</td>
          </tr>
        `
        )
        .join('');
    }

    const tbodyTugas = document.getElementById('tableTugas');
    if (result.tugas.length === 0) {
      tbodyTugas.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada tugas yang dikumpulkan.</td></tr>`;
    } else {
      tbodyTugas.innerHTML = result.tugas
        .map((item) => {
          const badgeNilai = item.nilai
            ? `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold text-xs inline-block">⭐ Nilai: ${item.nilai}</span>`
            : `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold text-[11px] inline-block">Menunggu Dinilai</span>`;

          const catatanGuru = item.catatan
            ? `<div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-200">💬 <b>Catatan Guru:</b> ${item.catatan}</div>`
            : '';

          return `
            <tr class="hover:bg-slate-50 align-top">
              <td class="p-3 text-slate-500 whitespace-nowrap">${item.waktu}</td>
              <td class="p-3 font-semibold text-blue-700">${item.mapel}</td>
              <td class="p-3">
                <div class="font-bold text-slate-800">${item.judul}</div>
                ${catatanGuru}
              </td>
              <td class="p-3 text-center">${badgeNilai}</td>
              <td class="p-3 text-right">
                <a href="${item.link}" target="_blank" class="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-bold inline-block text-xs">Buka File ↗</a>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  } catch (err) {
    console.error('Gagal memuat riwayat:', err);
  }
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

// Navigasi tab mencakup 'izin'
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
  if (tab === 'izin') loadRiwayatIzin();
  if (tab === 'riwayat') loadRiwayat();
}

// Handler Submit Form Izin
document.getElementById('izinForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitIzin');
  const alertBox = document.getElementById('izinAlert');

  btn.textContent = 'Mengirim...';
  btn.disabled = true;
  alertBox.classList.add('hidden');

  const formData = new FormData();
  formData.append('nik', currentStudent.nik);
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
      alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-green-100 text-green-800';
      alertBox.textContent = `✅ ${result.message}`;
      alertBox.classList.remove('hidden');
      document.getElementById('izinForm').reset();
      loadRiwayatIzin();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    alertBox.className = 'mt-4 p-3 rounded-xl text-xs font-semibold text-center bg-red-100 text-red-700';
    alertBox.textContent = '❌ Gagal mengirim izin.';
    alertBox.classList.remove('hidden');
  } finally {
    btn.textContent = '📤 Kirim Pengajuan Izin';
    btn.disabled = false;
  }
});

async function loadRiwayatIzin() {
  if (!currentStudent) return;
  try {
    const res = await fetch(`/api/izin/${currentStudent.nik}`);
    const result = await res.json();
    const tbody = document.getElementById('tableRiwayatIzin');
    if (!result.success || result.izin.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada riwayat izin.</td></tr>`;
      return;
    }

    tbody.innerHTML = result.izin.map(item => `
      <tr class="hover:bg-slate-50">
        <td class="p-2.5">${item.waktu}</td>
        <td class="p-2.5"><span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">${item.status}</span></td>
        <td class="p-2.5">${item.tanggal}</td>
        <td class="p-2.5">${item.keterangan}</td>
        <td class="p-2.5">${item.link !== '-' ? `<a href="${item.link}" target="_blank" class="text-blue-600 font-bold underline">Lihat Surat ↗</a>` : 'Tanpa Lampiran'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Gagal memuat riwayat izin:', err);
  }
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

// Di dalam fungsi showDashboard() tambahkan:
loadPengumumanSiswa();

// Fungsi untuk mengambil dan merender pengumuman
async function loadPengumumanSiswa() {
  const container = document.getElementById('listPengumumanSiswa');
  if (!container) return;

  try {
    const res = await fetch('/api/pengumuman');
    const result = await res.json();
    if (!result.success || result.pengumuman.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-500 text-center py-2">Belum ada pengumuman dari guru.</p>`;
      return;
    }

    container.innerHTML = result.pengumuman.map(p => `
      <div class="bg-white p-3.5 rounded-xl border border-amber-100 shadow-sm space-y-1">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-xs md:text-sm text-slate-800">${p.judul}</h4>
          <span class="text-[10px] text-slate-400">${p.waktu}</span>
        </div>
        <p class="text-xs text-slate-600 whitespace-pre-line leading-relaxed">${p.isi}</p>
        <p class="text-[10px] text-indigo-600 font-semibold pt-1">Dari: ${p.pembuat}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-red-500 text-center py-2">Gagal memuat pengumuman.</p>`;
  }
}