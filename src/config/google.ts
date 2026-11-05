/**
 * ============================================================================
 * SIBINTANG - GOOGLE SHEETS API & APPS SCRIPT DRIVE CONFIG (src/config/google.ts)
 * SD Swasta RK Bintang Timur Rantauprapat
 * ============================================================================
 * Mengelola inisialisasi autentikasi Google Service Account khusus untuk
 * Google Sheets API v4 (melalui GOOGLE_CREDENTIALS_JSON di Vercel atau berkas
 * lokal credentials.json), serta utilitas pemeriksaan tab sheet ber-cache.
 *
 * Catatan Arsitektur Penyimpanan Berkas (Google Drive):
 * Pengunggahan berkas tugas & surat izin TIDAK menggunakan Service Account
 * karena keterbatasan kuota penyimpanan Service Account pada akun @belajar.id,
 * melainkan diunggah langsung melalui Web App Google Apps Script:
 * WEB_APP_URL_DRIVE.
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// ============================================================================
// 1. KONSTANTA CAKUPAN (SCOPES), ID SPREADSHEET & ENDPOINT APPS SCRIPT DRIVE
// ============================================================================

/** Cakupan akses Service Account khusus untuk pembacaan & penulisan Google Sheets */
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/** ID Google Spreadsheet utama tempat menyimpan seluruh tab database */
export const SPREADSHEET_ID = (process.env.SPREADSHEET_ID || '').trim();

/** Endpoint Google Apps Script (@belajar.id) untuk pengunggahan berkas ke Google Drive */
export const WEB_APP_URL_DRIVE =
  process.env.WEB_APP_URL_DRIVE ||
  'https://script.google.com/macros/s/AKfycbze6KdWG7_PT2ZJ1Gtbyy8NGhfGtuefojUNspmYrL3y7oSQnSJTREuqYn1UcsXirQ/exec';

// ============================================================================
// 2. INISIALISASI KLIEN GOOGLE AUTH & SHEETS V4
// ============================================================================

/**
 * Membuat instance autentikasi Google Sheets API v4 menggunakan:
 * 1. Variabel lingkungan GOOGLE_CREDENTIALS_JSON (untuk deployment Vercel)
 * 2. Berkas lokal credentials.json pada root proyek (untuk pengembangan lokal)
 */
export function createGoogleAuth() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
      return new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } catch (err) {
      console.error('[SiBintang] Gagal mengurai GOOGLE_CREDENTIALS_JSON:', err);
    }
  }

  return new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../credentials.json'),
    scopes: SCOPES,
  });
}

export const auth = createGoogleAuth();
export const sheets = google.sheets({ version: 'v4', auth });

// ============================================================================
// 3. MANAJEMEN TAB SHEET OTOMATIS DENGAN CACHE MEMORI
// ============================================================================
const verifiedSheetsCache = new Set<string>();

/**
 * Memastikan tab sheet tersedia pada Google Spreadsheet dan menambahkan
 * baris header default jika tab baru dibuat. Menggunakan cache memori
 * agar tidak membebani kuota request Google Sheets API.
 */
export async function pastikanSheetAda(
  sheetTitle: string,
  defaultHeaders: string[] = []
): Promise<void> {
  const cacheKey = sheetTitle.toLowerCase();
  if (verifiedSheetsCache.has(cacheKey) || !SPREADSHEET_ID) return;

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = (meta.data.sheets || []).some(
      (s) => s.properties?.title?.toLowerCase() === cacheKey
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetTitle } } }],
        },
      });

      if (defaultHeaders.length > 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetTitle}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [defaultHeaders] },
        });
      }
    }

    verifiedSheetsCache.add(cacheKey);
  } catch (err) {
    console.warn(`[SiBintang] Pemeriksaan tab sheet ${sheetTitle}:`, err);
  }
}
