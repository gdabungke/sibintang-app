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
import fs from 'fs';

dotenv.config();

// Deteksi apakah sedang dalam mode Mock Local JS
export const IS_MOCK_MODE = process.env.USE_MOCK_LOCAL === 'true' || (!process.env.GOOGLE_CREDENTIALS_JSON && !fs.existsSync(path.join(__dirname, '../../credentials.json')));

// ============================================================================
// 1. KONSTANTA CAKUPAN (SCOPES), ID SPREADSHEET & ENDPOINT APPS SCRIPT DRIVE
// ============================================================================

/** Cakupan akses Service Account khusus untuk pembacaan & penulisan Google Sheets */
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/** ID Google Spreadsheet utama tempat menyimpan seluruh tab database */
export const SPREADSHEET_ID = (process.env.SPREADSHEET_ID || 'mock_spreadsheet_id').trim();

/** Endpoint Google Apps Script (@belajar.id) untuk pengunggahan berkas ke Google Drive */
export const WEB_APP_URL_DRIVE =
  process.env.WEB_APP_URL_DRIVE ||
  'https://script.google.com/macros/s/AKfycbze6KdWG7_PT2ZJ1Gtbyy8NGhfGtuefojUNspmYrL3y7oSQnSJTREuqYn1UcsXirQ/exec';

// ============================================================================
// 2. INISIALISASI KLIEN GOOGLE AUTH & SHEETS V4 (DENGAN DUKUNGAN MOCK LOCAL)
// ============================================================================

export function createGoogleAuth() {
  if (IS_MOCK_MODE) {
    console.warn('[SiBintang] Berjalan dalam MODE MOCK LOCAL JS (Google Auth dilewati).');
    return null;
  }

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

  const keyFilePath = path.join(__dirname, '../../credentials.json');
  if (fs.existsSync(keyFilePath)) {
    return new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: SCOPES,
    });
  }

  return null;
}

export const auth = createGoogleAuth();

// Fallback aman untuk objek sheets agar tidak throw error saat mode mock aktif
export const sheets = auth 
  ? google.sheets({ version: 'v4', auth }) 
  : ({
      spreadsheets: {
        get: async () => ({ data: { sheets: [] } }),
        batchUpdate: async () => ({}),
        values: { append: async () => ({}) }
      }
    } as any);

// ============================================================================
// 3. MANAJEMEN TAB SHEET OTOMATIS DENGAN CACHE MEMORI & MOCK FALLBACK
// ============================================================================
const verifiedSheetsCache = new Set<string>();

/**
 * Memastikan tab sheet tersedia pada Google Spreadsheet dan menambahkan
 * baris header default jika tab baru dibuat. Menggunakan cache memori
 * serta mendukung bypass otomatis jika berjalan dalam mode Mock Local.
 */
export async function pastikanSheetAda(
  sheetTitle: string,
  defaultHeaders: string[] = []
): Promise<void> {
  const cacheKey = sheetTitle.toLowerCase();
  if (verifiedSheetsCache.has(cacheKey) || !SPREADSHEET_ID) return;

  if (IS_MOCK_MODE) {
    verifiedSheetsCache.add(cacheKey);
    return;
  }

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
