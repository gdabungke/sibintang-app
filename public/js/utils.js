/**
 * ============================================================================
 * SIBINTANG - SHARED FRONTEND UTILITIES, EXPORT ENGINE & DATATABLES (public/js/utils.js)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.1.0)
 * ============================================================================
 * Modul terpusat untuk seluruh fungsi utilitas antarmuka:
 * - Sanitasi XSS, Format Rentang Tanggal Indonesia, Tautan WhatsApp
 * - Manipulasi DOM, Dropdown, Swipeable Bottom Sheet Notifikasi
 * - Mesin Audio Terpadu (Beep Presensi & Lonceng Gereja Angelus)
 * - Toast Notifikasi & Modal Konfirmasi Asinkron
 * - Unggah Berkas Google Drive (via Google Apps Script @belajar.id) & YouTube
 * - Generator Ekspor Spreadsheet Excel (.xlsx OpenXML Asli) & Laporan Cetak PDF
 * - Komponen Tabel Interaktif Universal (buatDataTables) dengan Filter Kolom
 *   Otomatis (Kelas, Mata Pelajaran, Status) & Sortir Multi-Kriteria (No, NIS, Nama, Mapel)
 */

// ============================================================================
// 1. SANITASI TEKS, FORMAT TANGGAL INDONESIA & TAUTAN WHATSAPP
// ============================================================================

function escapeHtml(teks) {
  if (teks === null || teks === undefined) return '';
  return String(teks)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRentangTanggalIndo(tglMulai, tglSelesai = '') {
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const parseYMD = (str) => {
    if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) return null;
    const [y, m, d] = str.trim().split('-').map((n) => parseInt(n, 10));
    return { y, m, d, dPad: String(d).padStart(2, '0'), bulan: namaBulan[m - 1] || '' };
  };

  const p1 = parseYMD(tglMulai);
  if (!p1) return tglMulai || '-';

  const p2 = parseYMD(tglSelesai);
  if (!p2 || tglMulai === tglSelesai) {
    return `${p1.dPad} ${p1.bulan} ${p1.y}`;
  }

  if (p1.y === p2.y && p1.m === p2.m) {
    return `${p1.dPad} s/d ${p2.dPad} ${p1.bulan} ${p1.y}`;
  }
  if (p1.y === p2.y) {
    return `${p1.dPad} ${p1.bulan} s/d ${p2.dPad} ${p2.bulan} ${p1.y}`;
  }
  return `${p1.dPad} ${p1.bulan} ${p1.y} s/d ${p2.dPad} ${p2.bulan} ${p2.y}`;
}

function formatNomorWA(nohp) {
  return String(nohp || '')
    .replace(/^0/, '62')
    .replace(/[^0-9]/g, '');
}

function buatTautanWA(
  nohp,
  pesanTeks,
  labelTombol = 'Hubungi Ortu',
  warnaKelas = 'bg-emerald-600 hover:bg-emerald-700'
) {
  const cleanPhone = formatNomorWA(nohp);
  if (!cleanPhone) {
    return `<span class="text-slate-400">-</span>`;
  }
  const encodedMsg = encodeURIComponent(pesanTeks || '');
  const iconWa = typeof ICONS !== 'undefined' && ICONS.wa ? ICONS.wa : '';
  return `<a href="https://wa.me/${cleanPhone}?text=${encodedMsg}" target="_blank" rel="noopener noreferrer" class="${warnaKelas} text-white px-2.5 py-1 rounded-xl font-bold inline-flex items-center text-xs gap-1 shadow-sm transition">${iconWa}<span>${escapeHtml(labelTombol)}</span></a>`;
}

// ============================================================================
// 2. MANIPULASI DOM, DROPDOWN, BOTTOM SHEET SWIPE & STATUS TOMBOL/SWITCH TAB
// ============================================================================

const SWITCH_TAB_ACTIVE_CLS =
  'py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer';
const SWITCH_TAB_INACTIVE_CLS =
  'py-2 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition flex items-center gap-1.5 cursor-pointer';

function isiDropdown(selectId, items, placeholder = '', opsiTambahan = null) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = '';

  if (placeholder) {
    const optDef = document.createElement('option');
    optDef.value = '';
    optDef.textContent = placeholder;
    optDef.disabled = true;
    optDef.selected = true;
    el.appendChild(optDef);
  }

  if (opsiTambahan) {
    const optExtra = document.createElement('option');
    optExtra.value = opsiTambahan.val;
    optExtra.textContent = opsiTambahan.label;
    el.appendChild(optExtra);
  }

  (items || []).forEach((item) => {
    const opt = document.createElement('option');
    if (typeof item === 'object' && item !== null) {
      opt.value = item.val;
      opt.textContent = item.label;
    } else {
      opt.value = item;
      opt.textContent = item;
    }
    el.appendChild(opt);
  });
}

function isiDropdownGrup(selectId, dataGrup) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = '';

  (dataGrup || []).forEach((g) => {
    const groupEl = document.createElement('optgroup');
    groupEl.label = g.grup;

    (g.items || []).forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      groupEl.appendChild(opt);
    });

    el.appendChild(groupEl);
  });
}

function setTombolLoading(btn, isLoading, teksLoading = 'Memproses...', htmlNormal = '') {
  if (!btn) return;
  if (isLoading) {
    if (!btn.dataset.originalHtml) {
      btn.dataset.originalHtml = btn.innerHTML;
    }
    btn.disabled = true;
    btn.textContent = teksLoading;
  } else {
    btn.disabled = false;
    btn.innerHTML = htmlNormal || btn.dataset.originalHtml || btn.innerHTML;
  }
}

function animasiPutarIkon(iconId) {
  const icon = document.getElementById(iconId);
  if (!icon) return;
  icon.classList.add('animate-spin');
  setTimeout(() => icon.classList.remove('animate-spin'), 700);
}

function terapkanGayaTab(
  petaTombolId,
  activeKey,
  activeCls = SWITCH_TAB_ACTIVE_CLS,
  inactiveCls = SWITCH_TAB_INACTIVE_CLS
) {
  Object.entries(petaTombolId || {}).forEach(([key, btnId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.className = key === activeKey ? activeCls : inactiveCls;
    }
  });
}

function inisialisasiSwipeBottomSheet(backdropId, panelId, onClose) {
  const backdrop = document.getElementById(backdropId);
  const panel = document.getElementById(panelId);
  if (!backdrop || !panel || panel.dataset.swipeBound === 'true') return;
  panel.dataset.swipeBound = 'true';

  const handleArea = panel.querySelector('[data-sheet-handle]') || panel;
  const labelHint = panel.querySelector('[data-sheet-hint]');
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  const updateHintText = () => {
    if (!labelHint) return;
    const isExpanded = panel.classList.contains('sheet-expanded');
    labelHint.textContent = isExpanded
      ? 'Geser ke bawah untuk mengecilkan / menutup'
      : 'Geser ke atas untuk memperluas tampilan';
  };

  handleArea.addEventListener(
    'touchstart',
    (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startY = e.touches[0].clientY;
      currentY = startY;
      isDragging = true;
    },
    { passive: true }
  );

  handleArea.addEventListener(
    'touchmove',
    (e) => {
      if (!isDragging || !e.touches || e.touches.length === 0) return;
      currentY = e.touches[0].clientY;
    },
    { passive: true }
  );

  handleArea.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const deltaY = currentY - startY;

    if (deltaY < -35) {
      panel.classList.add('sheet-expanded');
      updateHintText();
    } else if (deltaY > 45) {
      if (panel.classList.contains('sheet-expanded')) {
        panel.classList.remove('sheet-expanded');
        updateHintText();
      } else if (typeof onClose === 'function') {
        onClose();
      }
    }
  });

  handleArea.addEventListener('click', () => {
    panel.classList.toggle('sheet-expanded');
    updateHintText();
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop && typeof onClose === 'function') {
      panel.classList.remove('sheet-expanded');
      updateHintText();
      onClose();
    }
  });
}

// ============================================================================
// 3. MESIN AUDIO TERPADU (BEEP PRESENSI & LONCENG GEREJA ANGELUS)
// ============================================================================
let sharedAudioContext = null;

function dapatkanAudioContext() {
  try {
    if (!sharedAudioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioContext = new AudioContextClass();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

function bunyikanBeep(tipe = 'success') {
  try {
    const ctx = dapatkanAudioContext();
    if (!ctx) return;

    const sekarang = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipe === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, sekarang);
      gain.gain.setValueAtTime(0.15, sekarang);
      osc.frequency.setValueAtTime(1320, sekarang + 0.08);
      gain.gain.setValueAtTime(0.15, sekarang + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.25);
      osc.start(sekarang);
      osc.stop(sekarang + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, sekarang);
      gain.gain.setValueAtTime(0.2, sekarang);
      osc.frequency.setValueAtTime(200, sekarang + 0.12);
      gain.gain.setValueAtTime(0.2, sekarang + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, sekarang + 0.35);
      osc.start(sekarang);
      osc.stop(sekarang + 0.35);
    }
  } catch (err) {
    console.warn('[SiBintang] Gagal memutar audio beep:', err);
  }
}

function bunyikanLoncengGereja(polaPenuh = false) {
  try {
    const ctx = dapatkanAudioContext();
    if (!ctx) return;

    function dentang(delayDetik, frekuensiDasar = 659.25, durasi = 2.8) {
      setTimeout(() => {
        const waktuMulai = ctx.currentTime;
        const oscUtama = ctx.createOscillator();
        const oscHarmonik = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscUtama.type = 'sine';
        oscUtama.frequency.setValueAtTime(frekuensiDasar, waktuMulai);
        oscHarmonik.type = 'triangle';
        oscHarmonik.frequency.setValueAtTime(frekuensiDasar * 2.01, waktuMulai);

        gainNode.gain.setValueAtTime(0.65, waktuMulai);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, waktuMulai + durasi);

        oscUtama.connect(gainNode);
        oscHarmonik.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscUtama.start(waktuMulai);
        oscHarmonik.start(waktuMulai);
        oscUtama.stop(waktuMulai + durasi);
        oscHarmonik.stop(waktuMulai + durasi);
      }, delayDetik * 1000);
    }

    dentang(0);
    dentang(2.0);
    dentang(4.0);
    if (polaPenuh) {
      dentang(6.5, 659.25, 3.5);
    }
  } catch (err) {
    console.warn('[SiBintang] Audio lonceng membutuhkan interaksi pengguna:', err);
  }
}

// ============================================================================
// 4. KOMPONEN NOTIFIKASI TOAST & MODAL KONFIRMASI ASINKRON
// ============================================================================

function showToast(pesan, tipe = 'info') {
  let container = document.getElementById('toastContainerGlobal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainerGlobal';
    container.className =
      'fixed top-20 right-4 sm:right-6 z-[100] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none no-print';
    document.body.appendChild(container);
  }

  const skema = {
    success: {
      bg: 'bg-emerald-600/95 border-emerald-500/40 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    },
    error: {
      bg: 'bg-rose-600/95 border-rose-500/40 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    },
    warning: {
      bg: 'bg-amber-600/95 border-amber-500/40 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    },
    info: {
      bg: 'bg-slate-900/95 border-slate-700/50 text-white',
      icon: `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    },
  };

  const config = skema[tipe] || skema.info;
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${config.bg} transform transition-all duration-300 translate-y-[-20px] opacity-0`;
  toast.innerHTML = `
    <div class="flex items-center gap-2.5 overflow-hidden">
      ${config.icon}
      <span class="text-xs font-medium leading-snug">${escapeHtml(pesan)}</span>
    </div>
    <button type="button" class="text-white/70 hover:text-white p-1 text-xs font-bold transition cursor-pointer">✕</button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-20px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  const tutupToast = () => {
    toast.classList.add('translate-y-[-20px]', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('button').addEventListener('click', tutupToast);
  setTimeout(tutupToast, 3500);
}

function konfirmasiModal({
  judul = 'Konfirmasi Tindakan',
  pesan = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  teksKonfirmasi = 'Ya, Lanjutkan',
  teksBatal = 'Batal',
  tipe = 'warning',
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.id = 'modalKonfirmasiBackdrop';
    backdrop.className =
      'fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 opacity-0';

    const skema = {
      warning: {
        iconBg: 'bg-amber-500/10 border-amber-500/25 ring-8 ring-amber-500/5',
        iconGlow: 'bg-amber-400/20',
        btnConfirm:
          'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30',
        svg: `
          <svg class="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H6a2 2 0 00-2 2v10a2 2 0 002 2h7" stroke-dasharray="2 2" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.15" stroke-width="2"/>
          </svg>
        `,
      },
      danger: {
        iconBg: 'bg-rose-500/10 border-rose-500/25 ring-8 ring-rose-500/5',
        iconGlow: 'bg-rose-400/20',
        btnConfirm:
          'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg shadow-rose-600/30',
        svg: `
          <svg class="w-8 h-8 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        `,
      },
      info: {
        iconBg: 'bg-indigo-500/10 border-indigo-500/25 ring-8 ring-indigo-500/5',
        iconGlow: 'bg-indigo-400/20',
        btnConfirm:
          'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-600/30',
        svg: `
          <svg class="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
      },
    };

    const config = skema[tipe] || skema.warning;

    backdrop.innerHTML = `
      <div id="modalBoxElement" class="relative w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-t sm:border border-slate-100/80 text-center transform transition-all duration-300 ease-out translate-y-full sm:translate-y-4 sm:scale-95 pb-8 sm:pb-7 overflow-hidden">
        <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 ${config.iconGlow} rounded-full blur-2xl pointer-events-none"></div>
        <div class="sm:hidden w-12 h-1 bg-slate-300/80 rounded-full mx-auto mb-6"></div>
        <div class="relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border ${config.iconBg} mb-5 shadow-sm">
          ${config.svg}
        </div>
        <h3 class="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug">${escapeHtml(judul)}</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed px-2 font-medium">${escapeHtml(pesan)}</p>
        <div class="mt-7 grid grid-cols-2 gap-3">
          <button type="button" id="btnModalBatal" class="cursor-pointer py-3 sm:py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all">
            ${escapeHtml(teksBatal)}
          </button>
          <button type="button" id="btnModalKonfirmasi" class="cursor-pointer py-3 sm:py-2.5 px-4 rounded-xl text-xs font-bold active:scale-95 transition-all ${config.btnConfirm}">
            ${escapeHtml(teksKonfirmasi)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const modalBox = backdrop.querySelector('#modalBoxElement');

    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      modalBox.classList.remove('translate-y-full', 'sm:translate-y-4', 'sm:scale-95');
      modalBox.classList.add('translate-y-0', 'sm:scale-100');
    });

    const tutup = (hasil) => {
      backdrop.classList.add('opacity-0');
      modalBox.classList.remove('translate-y-0', 'sm:scale-100');
      modalBox.classList.add('translate-y-full', 'sm:translate-y-4', 'sm:scale-95');
      setTimeout(() => {
        backdrop.remove();
        resolve(hasil);
      }, 250);
    };

    backdrop.querySelector('#btnModalKonfirmasi').addEventListener('click', () => tutup(true));
    backdrop.querySelector('#btnModalBatal').addEventListener('click', () => tutup(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) tutup(false);
    });
  });
}

// ============================================================================
// 5. INTEGRASI UNGGAH GOOGLE DRIVE (APPS SCRIPT @BELAJAR.ID) & VIDEO YOUTUBE
// ============================================================================

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

async function uploadFileKeDrivePribadi(fileObj, customFileName = '', subFolder = '') {
  if (!fileObj) return null;

  const targetUrl =
    typeof WEB_APP_URL_DRIVE !== 'undefined'
      ? WEB_APP_URL_DRIVE
      : 'https://script.google.com/macros/s/AKfycbze6KdWG7_PT2ZJ1Gtbyy8NGhfGtuefojUNspmYrL3y7oSQnSJTREuqYn1UcsXirQ/exec';

  try {
    const base64Data = await toBase64(fileObj);
    const ekstensi = fileObj.name.includes('.') ? '.' + fileObj.name.split('.').pop() : '';

    let namaAkhir = fileObj.name;
    if (customFileName && customFileName.trim() !== '') {
      const namaBersih = customFileName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_');
      namaAkhir = namaBersih.endsWith(ekstensi) ? namaBersih : `${namaBersih}${ekstensi}`;
    }

    const payload = {
      fileName: namaAkhir,
      mimeType: fileObj.type || 'application/octet-stream',
      fileData: base64Data.split(',')[1],
      subFolder: subFolder || '',
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.status === 'success') {
      return result.fileUrl;
    }
    throw new Error(result.message || 'Gagal menyimpan berkas ke Google Drive');
  } catch (error) {
    if (typeof window.MOCK_DB !== 'undefined') {
      console.info('[SiBintang Mock] Simulasi unggah berkas ke Google Drive:', fileObj.name);
      return `https://drive.google.com/file/d/simulasi-${encodeURIComponent(fileObj.name)}/view`;
    }
    console.error('[Upload Drive Error]:', error);
    throw error;
  }
}

function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

function renderYouTubeEmbed(url) {
  const ytId = getYouTubeId(url);
  if (!ytId) return '';
  return `
    <div class="mt-2.5 rounded-2xl overflow-hidden shadow-sm border border-slate-200 aspect-video bg-black max-w-full">
      <iframe 
        class="w-full h-full" 
        src="https://www.youtube-nocookie.com/embed/${ytId}" 
        title="Materi Pembelajaran YouTube" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    </div>
  `;
}

// ============================================================================
// 6. GENERATOR EKSPOR EXCEL (.XLSX OPENXML ASLI) & LAPORAN CETAK PDF
// ============================================================================

/**
 * Menghitung CRC32 untuk arsip ZIP OpenXML (.xlsx)
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function hitungCRC32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Membuat arsip ZIP tidak terkompresi (STORE) di memori untuk format OpenXML .xlsx
 */
function buatZipBuffer(filesMap) {
  const encoder = new TextEncoder();
  const entries = Object.entries(filesMap).map(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const dataBytes = typeof content === 'string' ? encoder.encode(content) : content;
    const crc = hitungCRC32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  let localSize = 0;
  let centralSize = 0;
  entries.forEach((e) => {
    localSize += 30 + e.nameBytes.length + e.dataBytes.length;
    centralSize += 46 + e.nameBytes.length;
  });

  const totalSize = localSize + centralSize + 22;
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  let offset = 0;
  entries.forEach((e) => {
    e.localOffset = offset;
    view.setUint32(offset, 0x04034b50, true); // Local file header signature
    view.setUint16(offset + 4, 20, true); // Version needed
    view.setUint16(offset + 6, 0, true); // Flags
    view.setUint16(offset + 8, 0, true); // Compression: STORE (0)
    view.setUint16(offset + 10, 0, true); // Mod time
    view.setUint16(offset + 12, 0x5821, true); // Mod date
    view.setUint32(offset + 14, e.crc, true); // CRC32
    view.setUint32(offset + 18, e.dataBytes.length, true); // Compressed size
    view.setUint32(offset + 22, e.dataBytes.length, true); // Uncompressed size
    view.setUint16(offset + 26, e.nameBytes.length, true); // File name length
    view.setUint16(offset + 28, 0, true); // Extra field length
    buf.set(e.nameBytes, offset + 30);
    buf.set(e.dataBytes, offset + 30 + e.nameBytes.length);
    offset += 30 + e.nameBytes.length + e.dataBytes.length;
  });

  const centralDirOffset = offset;
  entries.forEach((e) => {
    view.setUint32(offset, 0x02014b50, true); // Central directory signature
    view.setUint16(offset + 4, 20, true); // Version made by
    view.setUint16(offset + 6, 20, true); // Version needed
    view.setUint16(offset + 8, 0, true); // Flags
    view.setUint16(offset + 10, 0, true); // Compression: STORE (0)
    view.setUint16(offset + 12, 0, true); // Mod time
    view.setUint16(offset + 14, 0x5821, true); // Mod date
    view.setUint32(offset + 16, e.crc, true); // CRC32
    view.setUint32(offset + 20, e.dataBytes.length, true);
    view.setUint32(offset + 24, e.dataBytes.length, true);
    view.setUint16(offset + 28, e.nameBytes.length, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    view.setUint16(offset + 34, 0, true);
    view.setUint16(offset + 36, 0, true);
    view.setUint32(offset + 38, 0, true);
    view.setUint32(offset + 42, e.localOffset, true);
    buf.set(e.nameBytes, offset + 46);
    offset += 46 + e.nameBytes.length;
  });

  view.setUint32(offset, 0x06054b50, true); // End of central directory
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, entries.length, true);
  view.setUint16(offset + 10, entries.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralDirOffset, true);
  view.setUint16(offset + 20, 0, true);

  return buf;
}

function kolomExcelHuruf(colIdx) {
  let n = colIdx + 1;
  let str = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Menghasilkan dan mengunduh berkas Microsoft Excel (.xlsx) OpenXML asli
 */
function unduhDataXLSX({
  filename = 'Rekap_SiBintang.xlsx',
  title = 'REKAP DATA SIBINTANG - SD SWASTA RK BINTANG TIMUR RANTAUPRAPAT',
  subtitle = '',
  headers = [],
  rows = [],
}) {
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  const allSheetRows = [
    [title],
    [subtitle || `Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
    [],
    headers,
    ...rows,
  ];

  // Hitung lebar kolom otomatis
  const colWidths = headers.map((h, cIdx) => {
    let maxLen = String(h || '').length;
    rows.forEach((r) => {
      const cellLen = String(r[cIdx] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return Math.min(Math.max(maxLen + 4, 10), 42);
  });

  const colsXml = colWidths
    .map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const sheetDataXml = allSheetRows
    .map((rowArr, rIdx) => {
      const rowNum = rIdx + 1;
      const isTitle = rIdx === 0;
      const isSubtitle = rIdx === 1;
      const isHeader = rIdx === 3;
      const cellsXml = rowArr
        .map((val, cIdx) => {
          const cellRef = `${kolomExcelHuruf(cIdx)}${rowNum}`;
          const styleIdx = isTitle ? 1 : isSubtitle ? 2 : isHeader ? 3 : 4;
          const rawStr = String(val ?? '');
          const isNumeric = !isHeader && !isTitle && !isSubtitle && cIdx === 0 && /^\d+$/.test(rawStr);
          if (isNumeric) {
            return `<c r="${cellRef}" s="${styleIdx}" t="n"><v>${rawStr}</v></c>`;
          }
          return `<c r="${cellRef}" s="${styleIdx}" t="inlineStr"><is><t>${escapeXml(rawStr)}</t></is></c>`;
        })
        .join('');
      const ht = isTitle ? ' height="24" customHeight="1"' : isHeader ? ' height="22" customHeight="1"' : '';
      return `<row r="${rowNum}"${ht}>${cellsXml}</row>`;
    })
    .join('');

  const filesMap = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Data SiBintang" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FF1E1B4B"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E1B4B"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
  </cellXfs>
</styleSheet>`,
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${sheetDataXml}</sheetData>
</worksheet>`,
  };

  const zipBytes = buatZipBuffer(filesMap);
  const blob = new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Menampilkan Modal Pratinjau Laporan Resmi Siap Cetak / Simpan ke PDF
 */
function eksporTabelKePDF({ filename = 'Laporan_SiBintang.pdf', title = 'LAPORAN REKAPITULASI DATA AKADEMIK & PRESENSI', subtitle = '', headers = [], rows = [], signerRole = 'Pengelola / Guru', signerName = '________________________', }) {
  let modal = document.getElementById('modalPreviewExportPDF');
  if (modal) modal.remove();
  const waktuCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', });
  const thHtml = headers
    .map(
      (h) => `<th class="py-2.5 px-3 bg-indigo-950 text-white font-bold text-[11px] border border-slate-300 text-left">${escapeHtml(h)}</th>`
    )
    .join('');
  const trHtml = rows
    .map(
      (r, idx) => `
      <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
        ${r
          .map(
            (cell, cIdx) => `<td class="py-2 px-3 border border-slate-300 text-[11px] text-slate-800 ${cIdx === 0 ? 'text-center font-bold' : ''}">${escapeHtml(cell)}</td>`
          )
          .join('')}
      </tr>
    `
    )
    .join('');
  modal = document.createElement('div');
  modal.id = 'modalPreviewExportPDF';
  modal.className = 'fixed inset-0 z-[9998] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
  modal.innerHTML = `
    <style>
      @media print {
        body, html {
          background: white !important;
          height: auto !important;
          overflow: visible !important;
        }
        body * {
          visibility: hidden !important;
        }
        #areaDokumenCetakPDF, #areaDokumenCetakPDF * {
          visibility: visible !important;
        }
        #areaDokumenCetakPDF {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-height: none !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          box-shadow: none !important;
        }
        .no-print {
          display: none !important;
        }
      }
    </style>
    <div class="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between pb-3.5 border-b border-slate-200 shrink-0 no-print">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black">
            ${ICONS.pdf || 'PDF'}
          </div>
          <div>
            <h3 class="font-extrabold text-sm sm:text-base text-slate-800">Pratinjau Ekspor Dokumen PDF</h3>
            <p class="text-[11px] text-slate-500">Siap dicetak atau disimpan sebagai PDF (${rows.length} baris data sesuai tab aktif).</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="btnPrintPdfNow" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer">
            ${ICONS.pdf || ''}
            <span>Cetak / Simpan PDF</span>
          </button>
          <button type="button" id="btnClosePdfPreview" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer">✕ Tutup</button>
        </div>
      </div>
      <div id="areaDokumenCetakPDF" class="overflow-y-auto p-4 sm:p-6 bg-white text-slate-900 space-y-4">
        <!-- Header dengan CSS Grid 3 Kolom & Logo digeser ke kanan dengan pl-4 -->
        <div class="border-b-2 border-slate-900 pb-3.5 grid grid-cols-[auto_1fr_auto] items-center gap-4 px-2 sm:px-3">
          <div class="flex items-center pl-4 sm:pl-6">
            <img src="/icon.png" alt="Logo Sekolah" class="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-transparent" onerror="this.style.display='none'" />
          </div>
          <div class="text-center space-y-0.5">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-600">YAYASAN PERGURUAN KATOLIK SANTO LAURENSIUS</p>
            <h2 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">SD SWASTA RK BINTANG TIMUR RANTAUPRAPAT</h2>
            <p class="text-[11px] text-slate-600">Jl. Cut Mutia No. 48, Rantauprapat | Telp: (0624) 2602068 | NPSN: 10205570 (Akreditasi A)</p>
          </div>
          <div class="w-20 sm:w-24 invisible select-none"></div>
        </div>
        <div class="text-center space-y-0.5">
          <h3 class="text-sm font-black uppercase text-slate-900">${escapeHtml(title)}</h3>
          <p class="text-xs font-semibold text-slate-600">${escapeHtml(subtitle)}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-slate-300">
            <thead>
              <tr>${thHtml}</tr>
            </thead>
            <tbody>${trHtml}</tbody>
          </table>
        </div>
        <div class="pt-6 flex justify-end text-xs text-slate-800">
          <div class="text-center w-60 space-y-12">
            <div>
              <p>Rantauprapat, ${escapeHtml(waktuCetak)}</p>
              <p class="font-bold">${escapeHtml(signerRole)}</p>
            </div>
            <div>
              <p class="font-black underline">${escapeHtml(signerName)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#btnClosePdfPreview')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  modal.querySelector('#btnPrintPdfNow')?.addEventListener('click', () => {
    window.print();
    showToast(`Dialog cetak / simpan PDF untuk "${filename}" dibuka.`, 'success');
  });
}

// ============================================================================
// 7. KOMPONEN TABEL INTERAKTIF UNIVERSAL (DATATABLES) DENGAN FILTER & SORTIR
// ============================================================================

function buatDataTables(config) {
  let {
    data = [],
    state = { page: 1, perPage: 5, search: '', filterKelas: '', filterMapel: '', filterStatus: '', sortBy: '' },
    containerId,
    tbodyId,
    colSpan = 5,
    emptyMessage = 'Belum ada data.',
    searchPlaceholder = 'Cari No, NIS, Nama, atau Mapel...',
    renderRow,
    onStateChange,
  } = config;

  const tbody = document.getElementById(tbodyId);
  const container = document.getElementById(containerId) || tbody?.closest('div')?.parentElement;
  if (!container || !tbody) return;

  // Deteksi otomatis ketersediaan kolom untuk filter cepat pada tabel
  const kelasSet = new Set();
  const mapelSet = new Set();
  const statusSet = new Set();
  let hasNis = false;
  let hasNama = false;
  let hasMapel = false;

  (data || []).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    if (item.nis) hasNis = true;
    if (item.nama || item.judul) hasNama = true;
    if (item.mapel) {
      hasMapel = true;
      mapelSet.add(String(item.mapel).trim());
    }
    if (item.kelas && item.kelas !== '-') {
      kelasSet.add(String(item.kelas).trim().toUpperCase());
    }
    const stVal = item.statusVerifikasi || item.verifikasi || item.status || item.kategori || '';
    if (stVal && stVal !== '-') {
      statusSet.add(String(stVal).trim());
    }
  });

  // Lampirkan nomor urut asli (_origNo) agar pengguna bisa memfilter / mengurutkan berdasarkan Nomor Urut
  const indexedData = (data || []).map((item, idx) => ({
    ...item,
    _origNo: idx + 1,
  }));

  // Terapkan filter kolom (Kelas, Mata Pelajaran, Status) + pencarian multi-kriteria (No Urut, NIS, Nama, Mapel)
  const cleanSearch = (state.search || '').toLowerCase().trim();
  const fKelas = (state.filterKelas || '').toUpperCase().trim();
  const fMapel = (state.filterMapel || '').trim();
  const fStatus = (state.filterStatus || '').trim();

  let filtered = indexedData.filter((item) => {
    if (fKelas && String(item.kelas || '').toUpperCase().trim() !== fKelas) {
      return false;
    }
    if (fMapel && String(item.mapel || '').trim() !== fMapel) {
      return false;
    }
    if (fStatus) {
      const stVal = String(
        item.statusVerifikasi || item.verifikasi || item.status || item.kategori || ''
      ).trim();
      if (stVal !== fStatus) return false;
    }
    if (!cleanSearch) return true;

    // Jika kata kunci berupa angka murni pendek (misal "1", "2"), cocokkan juga dengan Nomor Urut atau NIS
    if (/^\d+$/.test(cleanSearch) && String(item._origNo) === cleanSearch) {
      return true;
    }

    return Object.entries(item || {}).some(([k, val]) => {
      if (k === '_origNo') return String(val) === cleanSearch;
      return (
        val !== null &&
        val !== undefined &&
        val.toString().toLowerCase().includes(cleanSearch)
      );
    });
  });

  // Terapkan pengurutan (Sortir berdasarkan Nomor Urut, NIS, Nama Siswa, atau Mata Pelajaran)
  const sortBy = state.sortBy || 'no_asc';
  if (sortBy === 'no_desc') {
    filtered.sort((a, b) => b._origNo - a._origNo);
  } else if (sortBy === 'nis_asc') {
    filtered.sort((a, b) => String(a.nis || '').localeCompare(String(b.nis || ''), 'id', { numeric: true }));
  } else if (sortBy === 'nama_asc') {
    filtered.sort((a, b) =>
      String(a.nama || a.judul || '').localeCompare(String(b.nama || b.judul || ''), 'id')
    );
  } else if (sortBy === 'nama_desc') {
    filtered.sort((a, b) =>
      String(b.nama || b.judul || '').localeCompare(String(a.nama || a.judul || ''), 'id')
    );
  } else if (sortBy === 'mapel_asc') {
    filtered.sort((a, b) => String(a.mapel || '').localeCompare(String(b.mapel || ''), 'id'));
  }

  // Simpan hasil filter terkini ke dalam state agar tombol Export PDF/XLSX mengekspor persis isi tabel aktif
  state._filteredRows = filtered;

  const totalEntries = filtered.length;
  const perPage = parseInt(state.perPage, 10) || 5;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(Math.max(1, state.page || 1), totalPages);
  state.page = currentPage;

  const startIdx = totalEntries === 0 ? 0 : (currentPage - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, totalEntries);
  const pageData = filtered.slice(startIdx, endIdx);

  // Render Top Bar (Dropdown Limit Proporsional + Filter Kolom Dinamis + Sortir + Pencarian)
  let topBar = container.querySelector('.dt-top-bar');
  if (!topBar) {
    topBar = document.createElement('div');
    topBar.className =
      'dt-top-bar flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-3.5 text-xs text-slate-600 font-semibold';
    const tableWrap = container.querySelector('.overflow-x-auto') || tbody.closest('table');
    container.insertBefore(topBar, tableWrap);
  }

  const daftarKelasOpsi =
    kelasSet.size > 1
      ? Array.from(kelasSet).sort()
      : typeof DAFTAR_KELAS !== 'undefined' && kelasSet.size === 1
        ? Array.from(kelasSet)
        : [];
  const daftarMapelOpsi = Array.from(mapelSet).sort();
  const daftarStatusOpsi = Array.from(statusSet).sort();

  if (!topBar.querySelector('.dt-search-input')) {
    topBar.innerHTML = `
      <div class="flex items-center gap-2 flex-wrap">
        <span>Tampilkan</span>
        <select class="dt-per-page bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition shadow-xs">
          <option value="5" ${perPage === 5 ? 'selected' : ''}>5</option>
          <option value="10" ${perPage === 10 ? 'selected' : ''}>10</option>
          <option value="25" ${perPage === 25 ? 'selected' : ''}>25</option>
        </select>
        <span class="hidden sm:inline">baris</span>
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
        <select class="dt-filter-kelas hidden bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition"></select>
        <select class="dt-filter-mapel hidden bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition max-w-[180px] truncate"></select>
        <select class="dt-filter-status hidden bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition"></select>

        <select class="dt-sort-by bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition" title="Urutkan Berdasarkan Kolom">
          <option value="no_asc">Urut: No (1 → Akhir)</option>
          <option value="no_desc">Urut: No (Akhir → 1)</option>
          <option value="nis_asc">Urut: NIS (A → Z)</option>
          <option value="nama_asc">Urut: Nama / Judul (A → Z)</option>
          <option value="nama_desc">Urut: Nama / Judul (Z → A)</option>
          <option value="mapel_asc">Urut: Mata Pelajaran (A → Z)</option>
        </select>

        <div class="relative flex-grow sm:flex-grow-0 sm:w-60">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" class="dt-search-input w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-xs placeholder:text-slate-400 font-medium" placeholder="${escapeHtml(searchPlaceholder)}" value="${escapeHtml(state.search || '')}">
        </div>
      </div>
    `;

    topBar.querySelector('.dt-search-input').addEventListener('input', (e) => {
      state.search = e.target.value;
      state.page = 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    });

    topBar.querySelector('.dt-per-page').addEventListener('change', (e) => {
      state.perPage = parseInt(e.target.value, 10);
      state.page = 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    });

    topBar.querySelector('.dt-sort-by').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.page = 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    });

    topBar.querySelector('.dt-filter-kelas').addEventListener('change', (e) => {
      state.filterKelas = e.target.value;
      state.page = 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    });

    topBar.querySelector('.dt-filter-mapel').addEventListener('change', (e) => {
      state.filterMapel = e.target.value;
      state.page = 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    });

    topBar.querySelector('.dt-filter-status').addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      state.page = 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    });
  }

  // Sinkronkan opsi dropdown filter kolom pada setiap render
  const selectEl = topBar.querySelector('.dt-per-page');
  if (selectEl && String(selectEl.value) !== String(perPage)) {
    selectEl.value = String(perPage);
  }
  const sortEl = topBar.querySelector('.dt-sort-by');
  if (sortEl && sortEl.value !== (state.sortBy || 'no_asc')) {
    sortEl.value = state.sortBy || 'no_asc';
  }
  const searchEl = topBar.querySelector('.dt-search-input');
  if (searchEl && document.activeElement !== searchEl && searchEl.value !== (state.search || '')) {
    searchEl.value = state.search || '';
  }

  const fKelasEl = topBar.querySelector('.dt-filter-kelas');
  if (fKelasEl) {
    if (kelasSet.size > 1 || state.filterKelas) {
      fKelasEl.classList.remove('hidden');
      const opts = ['<option value="">Semua Kelas</option>'].concat(
        Array.from(new Set([...(typeof DAFTAR_KELAS !== 'undefined' ? DAFTAR_KELAS : []), ...daftarKelasOpsi])).map(
          (k) => `<option value="${escapeHtml(k)}" ${state.filterKelas === k ? 'selected' : ''}>Kelas ${escapeHtml(k)}</option>`
        )
      );
      fKelasEl.innerHTML = opts.join('');
    } else {
      fKelasEl.classList.add('hidden');
    }
  }

  const fMapelEl = topBar.querySelector('.dt-filter-mapel');
  if (fMapelEl) {
    if (hasMapel || state.filterMapel) {
      fMapelEl.classList.remove('hidden');
      const allMapels = Array.from(
        new Set([...daftarMapelOpsi, ...(typeof DAFTAR_MAPEL !== 'undefined' ? DAFTAR_MAPEL : [])])
      );
      fMapelEl.innerHTML =
        '<option value="">Semua Mapel</option>' +
        allMapels
          .map(
            (m) =>
              `<option value="${escapeHtml(m)}" ${state.filterMapel === m ? 'selected' : ''}>${escapeHtml(m)}</option>`
          )
          .join('');
    } else {
      fMapelEl.classList.add('hidden');
    }
  }

  const fStatusEl = topBar.querySelector('.dt-filter-status');
  if (fStatusEl) {
    if (daftarStatusOpsi.length > 1 || state.filterStatus) {
      fStatusEl.classList.remove('hidden');
      fStatusEl.innerHTML =
        '<option value="">Semua Status/Kategori</option>' +
        daftarStatusOpsi
          .map(
            (st) =>
              `<option value="${escapeHtml(st)}" ${state.filterStatus === st ? 'selected' : ''}>${escapeHtml(st)}</option>`
          )
          .join('');
    } else {
      fStatusEl.classList.add('hidden');
    }
  }

  // Render Isi Tabel
  let rowsHtml = '';
  const hasActiveFilter = Boolean(cleanSearch || fKelas || fMapel || fStatus);

  if (totalEntries === 0) {
    const subMessage = hasActiveFilter
      ? 'Tidak ada rekaman data yang cocok dengan filter / kata kunci pencarian ini.'
      : '';
    rowsHtml = `
      <tr>
        <td colspan="${colSpan}" class="py-12 px-4 text-center bg-slate-50/50">
          <div class="flex flex-col items-center justify-center space-y-2">
            <div class="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/60 shadow-inner">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            </div>
            <p class="text-xs font-bold text-slate-600">${escapeHtml(emptyMessage)}</p>
            ${subMessage ? `<p class="text-[11px] text-slate-400">${escapeHtml(subMessage)}</p>` : ''}
          </div>
        </td>
      </tr>
    `;
  } else {
    rowsHtml += pageData
      .map((item, idx) => {
        const isEven = idx % 2 === 0;
        const bgRowClass = isEven ? 'bg-white' : 'bg-slate-50/60';
        const displayIndex = item._origNo ? item._origNo - 1 : startIdx + idx;
        return renderRow(item, displayIndex, bgRowClass);
      })
      .join('');

    const sisaBaris = perPage - pageData.length;
    if (sisaBaris > 0 && perPage <= 10) {
      for (let i = 0; i < sisaBaris; i++) {
        const currentIdx = pageData.length + i;
        const bgRowClass = currentIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
        let siluetCells = `<td class="py-3 px-3 text-center font-mono text-xs text-slate-300 font-bold">${startIdx + currentIdx + 1}</td>`;
        for (let c = 1; c < colSpan; c++) {
          siluetCells += `
            <td class="py-3 px-3">
              <div class="h-3 bg-slate-200/80 rounded-lg w-3/4 animate-pulse"></div>
            </td>
          `;
        }
        rowsHtml += `
          <tr class="${bgRowClass} border-b border-slate-100/80 opacity-40 select-none pointer-events-none">
            ${siluetCells}
          </tr>
        `;
      }
    }
  }

  tbody.innerHTML = rowsHtml;

  // Render Bottom Bar Paginasi
  let bottomBar = container.querySelector('.dt-bottom-bar');
  if (!bottomBar) {
    bottomBar = document.createElement('div');
    bottomBar.className =
      'dt-bottom-bar flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500 font-medium';
    container.appendChild(bottomBar);
  }

  let pagesHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      pagesHtml += `<button type="button" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-sm shadow-blue-500/20">${i}</button>`;
    } else {
      pagesHtml += `<button type="button" data-page="${i}" class="dt-page-btn w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition active:scale-95 cursor-pointer">${i}</button>`;
    }
  }

  bottomBar.innerHTML = `
    <div class="text-[11px] sm:text-xs text-slate-500 font-medium">
      Menampilkan <span class="font-bold text-slate-800">${totalEntries === 0 ? 0 : startIdx + 1}</span> sampai <span class="font-bold text-slate-800">${endIdx}</span> dari <span class="font-bold text-slate-800">${totalEntries}</span> data
    </div>
    <div class="inline-flex items-center gap-1.5 self-end sm:self-auto select-none flex-wrap">
      <button type="button" class="dt-prev-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" ${currentPage <= 1 ? 'disabled' : ''}>
        Sebelumnya
      </button>
      <div class="inline-flex items-center gap-1">${pagesHtml}</div>
      <button type="button" class="dt-next-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" ${currentPage >= totalPages ? 'disabled' : ''}>
        Selanjutnya
      </button>
    </div>
  `;

  bottomBar.querySelectorAll('.dt-page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.page = parseInt(btn.dataset.page, 10);
      if (typeof onStateChange === 'function') onStateChange(state);
    });
  });

  bottomBar.querySelector('.dt-prev-btn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      state.page = currentPage - 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    }
  });

  bottomBar.querySelector('.dt-next-btn')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      state.page = currentPage + 1;
      if (typeof onStateChange === 'function') onStateChange(state);
    }
  });
}

// ============================================================================
// 8. EKSPOR GLOBAL WINDOW
// ============================================================================
window.SWITCH_TAB_ACTIVE_CLS = SWITCH_TAB_ACTIVE_CLS;
window.SWITCH_TAB_INACTIVE_CLS = SWITCH_TAB_INACTIVE_CLS;

window.escapeHtml = escapeHtml;
window.formatRentangTanggalIndo = formatRentangTanggalIndo;
window.formatNomorWA = formatNomorWA;
window.buatTautanWA = buatTautanWA;
window.isiDropdown = isiDropdown;
window.isiDropdownGrup = isiDropdownGrup;
window.setTombolLoading = setTombolLoading;
window.animasiPutarIkon = animasiPutarIkon;
window.terapkanGayaTab = terapkanGayaTab;
window.inisialisasiSwipeBottomSheet = inisialisasiSwipeBottomSheet;
window.dapatkanAudioContext = dapatkanAudioContext;
window.bunyikanBeep = bunyikanBeep;
window.bunyikanLoncengGereja = bunyikanLoncengGereja;
window.showToast = showToast;
window.konfirmasiModal = konfirmasiModal;
window.toBase64 = toBase64;
window.uploadFileKeDrivePribadi = uploadFileKeDrivePribadi;
window.getYouTubeId = getYouTubeId;
window.renderYouTubeEmbed = renderYouTubeEmbed;
window.unduhDataXLSX = unduhDataXLSX;
window.eksporTabelKePDF = eksporTabelKePDF;
window.buatDataTables = buatDataTables;
