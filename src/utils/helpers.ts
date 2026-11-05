/**
 * ============================================================================
 * SIBINTANG - BACKEND HELPER & VALIDATION UTILITIES (src/utils/helpers.ts)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Kumpulan fungsi utilitas murni untuk pemformatan waktu WIB, sanitasi sel
 * spreadsheet, ekstraksi materi tugas, dan validasi token pendaftaran.
 */

import { sheets, SPREADSHEET_ID } from '../config/google';
import { AkunKhusus } from '../types';

// ============================================================================
// 1. PEMFORMATAN WAKTU & TANGGAL ZONA WIB (ASIA/JAKARTA)
// ============================================================================

/**
 * Mengembalikan timestamp lengkap berformat Waktu Indonesia Barat (WIB)
 */
export const getWaktuWIB = (): string => {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

/**
 * Mengembalikan tanggal hari ini (YYYY-MM-DD) dalam zona waktu WIB
 */
export const getTanggalHariIniWIB = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value || new Date().getFullYear();
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  return `${y}-${m}-${d}`;
};

// ============================================================================
// 2. SANITASI TEKS & EKSTRAKSI MATERI TUGAS
// ============================================================================

/**
 * Membersihkan tanda kutip tunggal di awal nilai sel Google Sheets (misal `'1001`)
 */
export const bersihkanKutipanSel = (val: unknown): string => {
  return String(val ?? '').replace(/^'+/, '').trim();
};

/**
 * Mengekstrak pasangan [Materi] dan Judul Tugas apabila disimpan dalam satu kolom
 */
export const ekstrakMateriDanJudul = (
  rawJudul: string,
  rawMateri = ''
): { materi: string; judul: string } => {
  const bersihJudul = (rawJudul || '').trim();
  const bersihMateri = (rawMateri || '').trim();
  if (bersihMateri) {
    return { materi: bersihMateri, judul: bersihJudul || '-' };
  }
  const match = bersihJudul.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (match) {
    return { materi: match[1].trim(), judul: match[2].trim() };
  }
  return { materi: '', judul: bersihJudul || '-' };
};

// ============================================================================
// 3. MANAJEMEN AKUN KHUSUS & VALIDASI TOKEN DATABASE
// ============================================================================

/**
 * Mengambil daftar akun khusus pengelola dari variabel lingkungan (AKUN_KHUSUS_JSON)
 */
export const getAkunKhususList = (): AkunKhusus[] => {
  try {
    const rawAkun = process.env.AKUN_KHUSUS_JSON || process.env.AKUN_KHUSUS;
    if (!rawAkun) return [];
    const parsed = JSON.parse(rawAkun);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[SiBintang] Gagal membaca variabel AKUN_KHUSUS_JSON:', err);
    return [];
  }
};

/**
 * Memvalidasi kecocokan token pendaftaran terhadap tab sheet "Tokens"
 */
export async function validasiTokenDatabase(
  tokenInput: string,
  roleOrKategori: string
): Promise<boolean> {
  try {
    const inputClean = (tokenInput || '').trim();
    if (!inputClean) return false;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tokens!A2:C',
    });
    const rows = response.data.values || [];
    const roleClean = (roleOrKategori || '').trim().toLowerCase();

    const found = rows.find((row) => {
      const dbToken = (row[0] || '').trim();
      const dbKategori = (row[1] || '').trim().toLowerCase();
      const dbStatus = (row[2] || '').trim().toLowerCase();

      if (dbToken.toUpperCase() !== inputClean.toUpperCase() || dbStatus !== 'aktif') {
        return false;
      }

      if (roleClean.includes('guru') || roleClean.includes('wali')) {
        return (
          dbKategori === 'guru' ||
          dbKategori.includes('guru') ||
          dbKategori.includes('mapel') ||
          dbKategori.includes('kelas')
        );
      }

      if (
        roleClean.includes('kelas') ||
        roleClean.includes('siswa') ||
        /^[1-6][a-z]$/i.test(roleClean)
      ) {
        if (dbKategori === 'siswa') return true;
        const numTarget = roleClean.replace(/[^0-9]/g, '');
        const numDb = dbKategori.replace(/[^0-9]/g, '');
        if (numTarget && numDb) {
          return numTarget === numDb;
        }
      }

      return (
        dbKategori === roleClean ||
        dbKategori.includes(roleClean) ||
        roleClean.includes(dbKategori)
      );
    });

    return Boolean(found);
  } catch (err) {
    console.error('[SiBintang] Gagal memvalidasi token:', err);
    return false;
  }
}
