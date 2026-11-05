/**
 * ============================================================================
 * SIBINTANG - BACKEND EXPRESS & GOOGLE WORKSPACE API SERVER (src/server.ts)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.2.0)
 * ============================================================================
 * Menyediakan layanan RESTful API terintegrasi dengan Google Sheets API v4
 * untuk manajemen presensi QR Code, Materi Pelajaran & Log Baca Siswa,
 * penugasan Google Drive, verifikasi izin, papan pengumuman ber-target,
 * generator token pendaftaran, serta manajemen Pengaturan Sistem & RBAC Role.
 *
 * Susunan Kode:
 * 1. Inisialisasi Aplikasi, State Konfigurasi & Middleware Express
 * 2. Endpoint Diagnostik & Kesehatan Server (/api/health)
 * 3. Endpoint Autentikasi Siswa & Guru (/api/login, /api/guru/login)
 * 4. Endpoint Presensi QR & Rekap Kehadiran (/api/absen, /api/guru/rekap)
 * 5. Endpoint Permohonan & Verifikasi Izin/Sakit (/api/izin, /api/guru/izin)
 * 6. Endpoint Materi Pelajaran & Log Baca Siswa (/api/materi, /api/guru/materi)
 * 7. Endpoint Tugas, Bank Soal & Penilaian (/api/tugas, /api/guru/tugas, dll.)
 * 8. Endpoint Papan Pengumuman & Generator Token (/api/pengumuman, /api/admin/generate-token)
 * 9. Endpoint Manajemen Setting Sistem, Hak Akses Role, Guru & Siswa (/api/admin/*)
 * 10. Global Error Handler & Server Listener
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import {
  DataSiswa,
  DataGuru,
  SiswaHadir,
  ItemMateriAjar,
  LogBacaMateri,
  SoalTugas,
  TugasTerkumpul,
  PermohonanIzin,
  ItemPengumuman,
  RolePermissionItem,
} from './types';
import { sheets, SPREADSHEET_ID, pastikanSheetAda } from './config/google';
import {
  getWaktuWIB,
  getTanggalHariIniWIB,
  bersihkanKutipanSel,
  ekstrakMateriDanJudul,
  getAkunKhususList,
  validasiTokenDatabase,
} from './utils/helpers';

dotenv.config();

// ============================================================================
// 1. INISIALISASI APLIKASI, STATE KONFIGURASI & MIDDLEWARE EXPRESS
// ============================================================================
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissionItem> = {
  Admin: {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: true,
    canBuatTugas: true,
    canNilaiTugas: true,
    canBuatPengumuman: true,
    canPengumumanGlobal: true,
    canGenerateToken: true,
    canAksesSemuaKelas: true,
    canKelolaSetting: true,
  },
  'Kepala Sekolah': {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: false,
    canBuatTugas: false,
    canNilaiTugas: false,
    canBuatPengumuman: true,
    canPengumumanGlobal: true,
    canGenerateToken: true,
    canAksesSemuaKelas: true,
    canKelolaSetting: true,
  },
  Operator: {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: false,
    canBuatTugas: false,
    canNilaiTugas: false,
    canBuatPengumuman: true,
    canPengumumanGlobal: true,
    canGenerateToken: true,
    canAksesSemuaKelas: true,
    canKelolaSetting: false,
  },
  'Wali Kelas': {
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
  },
  'Guru Kelas': {
    canGenerateQR: true,
    canVerifikasiIzin: true,
    canBuatMateri: true,
    canBuatTugas: true,
    canNilaiTugas: true,
    canBuatPengumuman: true,
    canPengumumanGlobal: false,
    canGenerateToken: false,
    canAksesSemuaKelas: false,
    canKelolaSetting: false,
  },
  'Guru Mata Pelajaran': {
    canGenerateQR: true,
    canVerifikasiIzin: false,
    canBuatMateri: true,
    canBuatTugas: true,
    canNilaiTugas: true,
    canBuatPengumuman: true,
    canPengumumanGlobal: false,
    canGenerateToken: false,
    canAksesSemuaKelas: true,
    canKelolaSetting: false,
  },
};

let runtimeSettingsCache: {
  daftarRole: string[];
  rolePermissions: Record<string, RolePermissionItem>;
  schoolConfig: {
    tahunAjaran: string;
    semester: string;
    kkmNilai: number;
    jamOperasional: string;
    batasJamMasuk: string;
    wajibTokenRegistrasi: boolean;
  };
} = {
  daftarRole: [
    'Wali Kelas',
    'Guru Kelas',
    'Guru Mata Pelajaran',
    'Kepala Sekolah',
    'Operator',
    'Admin',
  ],
  rolePermissions: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)),
  schoolConfig: {
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    kkmNilai: 75,
    jamOperasional: '07.00 - 12.20 WIB',
    batasJamMasuk: '07:15',
    wajibTokenRegistrasi: true,
  },
};

// ============================================================================
// 2. ENDPOINT DIAGNOSTIK & KESEHATAN SERVER
// ============================================================================
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    service: 'SiBintang PWA API Server',
    version: '3.2.0',
    waktuWIB: getWaktuWIB(),
    spreadsheetConfigured: Boolean(SPREADSHEET_ID),
  });
});

// ============================================================================
// 3. ENDPOINT AUTENTIKASI SISWA & GURU (LOGIN & REGISTRASI)
// ============================================================================

app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, jk, ortu, nohp, aksi, token } = req.body;
    const cleanNis = bersihkanKutipanSel(nis);

    if (!cleanNis) {
      return res.status(400).json({
        success: false,
        message: 'Nomor Induk Siswa (NIS) wajib diisi!',
      });
    }

    if (cleanNis.toLowerCase() === 'admin' || cleanNis.toLowerCase() === 'operator') {
      return res.json({
        success: true,
        data: {
          nis: cleanNis.toUpperCase(),
          nama:
            cleanNis.toLowerCase() === 'admin'
              ? 'Administrator Sistem (Mode Siswa)'
              : 'Operator Sekolah (Mode Siswa)',
          kelas: '1A',
          jk: 'L',
          ortu: 'Pengelola Sistem SiBintang',
          nohp: '081234567890',
          isAdminPortal: true,
        },
      });
    }

    const akunKhususList = getAkunKhususList();
    const akunKhusus = akunKhususList.find(
      (user) => user.nip.toLowerCase() === cleanNis.toLowerCase()
    );
    if (akunKhusus) {
      return res.json({
        success: true,
        data: {
          nis: akunKhusus.nip,
          nama: `${akunKhusus.nama} (${akunKhusus.role})`,
          kelas:
            akunKhusus.kelasBinaan && akunKhusus.kelasBinaan !== '-'
              ? akunKhusus.kelasBinaan
              : '1A',
          jk: 'L',
          ortu: 'Akun Pengelola Sekolah',
          nohp: '-',
          isAdminPortal: true,
        },
      });
    }

    await pastikanSheetAda('Siswa', [
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Jenis Kelamin',
      'Nama Orang Tua',
      'No. WhatsApp',
    ]);

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Siswa!A2:F',
    });
    const rows = getRows.data.values || [];
    const existingStudent = rows.find((row) => bersihkanKutipanSel(row[0]) === cleanNis);

    if (aksi === 'login') {
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: 'NIS belum terdaftar! Silakan lakukan Registrasi terlebih dahulu.',
        });
      }
      return res.json({
        success: true,
        data: {
          nis: bersihkanKutipanSel(existingStudent[0]),
          nama: existingStudent[1] || '-',
          kelas: existingStudent[2] || '-',
          jk: existingStudent[3] || '-',
          ortu: existingStudent[4] || '-',
          nohp: bersihkanKutipanSel(existingStudent[5]) || '-',
        },
      });
    }

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'NIS sudah terdaftar di sistem! Silakan gunakan menu Masuk (Login).',
      });
    }
    if (!nama || !kelas) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap dan Kelas wajib diisi untuk pendaftaran!',
      });
    }

    if (runtimeSettingsCache.schoolConfig.wajibTokenRegistrasi) {
      const kategoriToken = `Kelas ${String(kelas).replace(/[^0-9]/g, '')}`;
      const isTokenValid =
        (await validasiTokenDatabase(token, kategoriToken)) ||
        (await validasiTokenDatabase(token, String(kelas))) ||
        (await validasiTokenDatabase(token, 'Siswa'));

      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          message: `Token pendaftaran untuk ${kategoriToken} salah, tidak valid, atau belum dimasukkan!`,
        });
      }
    }

    const cleanNama = String(nama).trim();
    const cleanKelas = String(kelas).trim().toUpperCase();
    const cleanJk = jk || '-';
    const cleanOrtu = ortu ? String(ortu).trim() : '-';
    const cleanNohp = nohp ? String(nohp).trim() : '-';

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Siswa!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[`'${cleanNis}`, cleanNama, cleanKelas, cleanJk, cleanOrtu, `'${cleanNohp}`]],
      },
    });

    return res.json({
      success: true,
      data: {
        nis: cleanNis,
        nama: cleanNama,
        kelas: cleanKelas,
        jk: cleanJk,
        ortu: cleanOrtu,
        nohp: cleanNohp,
      },
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Auth Siswa:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses data autentikasi siswa ke Google Sheet.',
    });
  }
});

app.post('/api/guru/login', async (req: Request, res: Response) => {
  try {
    const { nip, nama, role, kelasBinaan, mapelAjar, merangkapGuruKelas, aksi, token } = req.body;
    const cleanNip = bersihkanKutipanSel(nip);

    if (!cleanNip) {
      return res.status(400).json({
        success: false,
        message: 'NIP / ID Guru wajib diisi!',
      });
    }

    const akunKhususList = getAkunKhususList();
    const akunKhusus = akunKhususList.find(
      (user) => user.nip.toLowerCase() === cleanNip.toLowerCase()
    );
    if (akunKhusus) {
      return res.json({
        success: true,
        data: {
          ...akunKhusus,
          merangkapGuruKelas: Boolean(akunKhusus.merangkapGuruKelas),
        },
      });
    }

    await pastikanSheetAda('Guru', [
      'NIP / ID Guru',
      'Nama Lengkap & Gelar',
      'Peran (Role)',
      'Kelas Binaan',
      'Mata Pelajaran Ajar',
      'Merangkap Guru Kelas',
    ]);

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Guru!A2:F',
    });
    const rows = getRows.data.values || [];
    const existingGuru = rows.find(
      (row) => bersihkanKutipanSel(row[0]).toLowerCase() === cleanNip.toLowerCase()
    );

    if (aksi === 'login') {
      if (!existingGuru) {
        return res.status(404).json({
          success: false,
          message: 'NIP belum terdaftar! Silakan lakukan Registrasi akun pengelola terlebih dahulu.',
        });
      }
      const rawRangkap = String(existingGuru[5] || '').trim().toLowerCase();
      return res.json({
        success: true,
        data: {
          nip: bersihkanKutipanSel(existingGuru[0]),
          nama: existingGuru[1] || 'Guru',
          role: existingGuru[2] || 'Guru Kelas',
          kelasBinaan: existingGuru[3] || '-',
          mapelAjar: existingGuru[4] || '-',
          merangkapGuruKelas: rawRangkap === 'ya' || rawRangkap === 'true' || rawRangkap === '1',
        },
      });
    }

    if (existingGuru) {
      return res.status(400).json({
        success: false,
        message: 'NIP sudah terdaftar di sistem! Silakan gunakan menu Masuk (Login).',
      });
    }
    if (!nama || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap dan Peran (Role) wajib diisi!',
      });
    }

    if (runtimeSettingsCache.schoolConfig.wajibTokenRegistrasi) {
      const isTokenValid = await validasiTokenDatabase(token, role);
      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          message: `Token pendaftaran untuk peran ${role} salah atau tidak valid!`,
        });
      }
    }

    const cleanNama = String(nama).trim();
    const cleanRole = String(role).trim();
    const cleanKelasBinaan = kelasBinaan || '-';
    const cleanMapelAjar = mapelAjar || '-';
    const isRangkap = Boolean(merangkapGuruKelas);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Guru!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            `'${cleanNip}`,
            cleanNama,
            cleanRole,
            cleanKelasBinaan,
            cleanMapelAjar,
            isRangkap ? 'Ya' : 'Tidak',
          ],
        ],
      },
    });

    return res.json({
      success: true,
      data: {
        nip: cleanNip,
        nama: cleanNama,
        role: cleanRole,
        kelasBinaan: cleanKelasBinaan,
        mapelAjar: cleanMapelAjar,
        merangkapGuruKelas: isRangkap,
      },
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Auth Guru:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses autentikasi guru.',
    });
  }
});

// ============================================================================
// 4. ENDPOINT PRESENSI QR & REKAP KEHADIRAN HARIAN
// ============================================================================

app.post('/api/absen', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, qrCodeData } = req.body;
    const cleanNis = bersihkanKutipanSel(nis);

    if (!cleanNis) {
      return res.status(400).json({ success: false, message: 'NIS siswa tidak valid.' });
    }
    if (!qrCodeData || typeof qrCodeData !== 'string') {
      return res.status(400).json({ success: false, message: 'Data QR Code tidak terbaca.' });
    }

    const qrParts = qrCodeData.split('|').map((item: string) => item.trim());
    if (qrParts.length < 4 || !qrParts[0].startsWith('ABSEN-SIBINTANG')) {
      return res.status(400).json({
        success: false,
        message: 'Kode QR tidak valid atau bukan QR resmi SiBintang.',
      });
    }

    const kelasQR = qrParts[1].toUpperCase();
    const tanggalQR = qrParts[2];
    const sesiQR = qrParts[3].toLowerCase();
    const kelasSiswa = String(kelas || '').trim().toUpperCase();

    if (kelasSiswa && kelasQR !== 'SEMUA' && kelasSiswa !== kelasQR) {
      return res.status(403).json({
        success: false,
        message: `Gagal Absen! QR Code ini untuk Kelas ${kelasQR}, Anda terdaftar di Kelas ${kelasSiswa}.`,
      });
    }

    await pastikanSheetAda('Absensi', [
      'Waktu (Timestamp)',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Status Kehadiran',
      'Keterangan / Isi QR',
    ]);

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!B:F',
    });
    const rows = sheetData.data.values || [];

    const sudahAbsen = rows.some((row) => {
      const rowNis = bersihkanKutipanSel(row[0]);
      const rowQrData = String(row[4] || '').trim().toLowerCase();
      if (rowNis !== cleanNis) return false;
      return (
        rowQrData === qrCodeData.trim().toLowerCase() ||
        (rowQrData.includes(tanggalQR.toLowerCase()) && rowQrData.includes(sesiQR))
      );
    });

    if (sudahAbsen) {
      return res.status(409).json({
        success: false,
        message: `Anda sudah melakukan presensi ${qrParts[3]} pada tanggal ${tanggalQR}!`,
      });
    }

    const waktu = getWaktuWIB();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, `'${cleanNis}`, nama || '-', kelasSiswa || kelasQR, 'Hadir', qrCodeData.trim()]],
      },
    });

    return res.json({
      success: true,
      message: `Absensi ${qrParts[3]} Kelas ${kelasSiswa || kelasQR} berhasil dicatat!`,
      waktu,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Absen:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses absensi ke Google Sheet.',
    });
  }
});

app.get('/api/guru/rekap', async (req: Request, res: Response) => {
  try {
    const kelas = String(req.query.kelas || '1A').trim().toUpperCase();
    const tanggal = String(req.query.tanggal || getTanggalHariIniWIB()).trim();

    const [siswaRes, absenRes, izinRes] = await Promise.all([
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Absensi!A2:F' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Izin!A2:J' })
        .catch(() => ({ data: { values: [] } })),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allAbsen = absenRes.data.values || [];
    const allIzin = izinRes.data.values || [];

    const isAllKelas = kelas === 'SEMUA';

    const siswaKelas: DataSiswa[] = allSiswa
      .filter((row) => isAllKelas || String(row[2] || '').trim().toUpperCase() === kelas)
      .map((row) => ({
        nis: bersihkanKutipanSel(row[0]),
        nama: row[1] || '',
        kelas: String(row[2] || '').trim().toUpperCase(),
        jk: row[3] || '-',
        ortu: row[4] || '-',
        nohp: bersihkanKutipanSel(row[5]) || '-',
      }));

    const [year, month, day] = tanggal.split('-');
    const dateStrId1 = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
    const dateStrId2 = `${day}/${month}/${year}`;

    const absenHariIni = allAbsen.filter((row) => {
      const waktu = String(row[0] || '');
      const rowKelas = String(row[3] || '').trim().toUpperCase();
      const qrData = String(row[5] || '');
      const targetQrPrefix = isAllKelas
        ? `ABSEN-SIBINTANG|`
        : `ABSEN-SIBINTANG|${kelas}|${tanggal}`;
      const isMatchingQr =
        qrData.toUpperCase().startsWith(targetQrPrefix.toUpperCase()) &&
        qrData.includes(tanggal);
      const isMatchingDateAndClass =
        (isAllKelas || rowKelas === kelas) &&
        (waktu.includes(dateStrId1) || waktu.includes(dateStrId2) || waktu.includes(tanggal));
      return isMatchingQr || isMatchingDateAndClass;
    });

    const sudahAbsen: SiswaHadir[] = [];
    const belumAbsen: DataSiswa[] = [];

    siswaKelas.forEach((siswa) => {
      const logHadir = absenHariIni.find((row) => bersihkanKutipanSel(row[1]) === siswa.nis);
      if (logHadir) {
        sudahAbsen.push({
          ...siswa,
          waktuAbsen: logHadir[0],
          status: logHadir[4] || 'Hadir',
          keteranganQr: logHadir[5] || '-',
        });
      } else {
        belumAbsen.push(siswa);
      }
    });

    const izinMenunggu = allIzin.filter((row) => {
      const rowKelas = String(row[3] || '').trim().toUpperCase();
      const statusVerif = String(row[8] || 'Menunggu').trim();
      return (isAllKelas || rowKelas === kelas) && statusVerif === 'Menunggu';
    });

    return res.json({
      success: true,
      kelas,
      tanggal,
      totalSiswa: siswaKelas.length,
      jumlahHadir: sudahAbsen.length,
      jumlahBelum: belumAbsen.length,
      sudahAbsen,
      belumAbsen,
      izinMenunggu,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Rekap Guru:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil rekap absensi kelas.',
    });
  }
});

// ============================================================================
// 5. ENDPOINT PERMOHONAN & VERIFIKASI SURAT IZIN / SAKIT
// ============================================================================

app.post('/api/izin', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, statusIzin, keterangan, tanggalMulai, link, linkBukti } = req.body;
    const cleanNis = bersihkanKutipanSel(nis);
    const fileLink = link || linkBukti || '-';

    if (!cleanNis || !nama || !kelas || !statusIzin || !tanggalMulai) {
      return res.status(400).json({
        success: false,
        message: 'Data pengajuan izin belum lengkap!',
      });
    }

    const waktu = getWaktuWIB();
    await pastikanSheetAda('Izin', [
      'Waktu Pengajuan',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Status (Izin/Sakit)',
      'Keterangan / Alasan',
      'Tanggal Mulai',
      'Link Bukti Surat (Drive)',
      'Status Verifikasi',
      'Verifikator',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Izin!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            waktu,
            `'${cleanNis}`,
            nama,
            String(kelas).trim().toUpperCase(),
            statusIzin,
            keterangan || '-',
            tanggalMulai,
            fileLink,
            'Menunggu',
            '-',
          ],
        ],
      },
    });

    return res.json({
      success: true,
      message: 'Pengajuan izin/sakit berhasil dikirim ke pihak sekolah!',
      fileLink,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Izin Detail:', error.message);
    return res.status(500).json({
      success: false,
      message: `Gagal mengirim pengajuan izin: ${error.message}`,
    });
  }
});

app.get('/api/izin/:nis', async (req: Request, res: Response) => {
  try {
    const cleanNis = bersihkanKutipanSel(req.params.nis);
    const izinRes = await sheets.spreadsheets.values
      .get({ spreadsheetId: SPREADSHEET_ID, range: 'Izin!A2:J' })
      .catch(() => ({ data: { values: [] } }));

    const rows: PermohonanIzin[] = (izinRes.data.values || [])
      .filter((row) => bersihkanKutipanSel(row[1]) === cleanNis)
      .map((row) => ({
        waktu: row[0] || '-',
        nis: bersihkanKutipanSel(row[1]),
        nama: row[2] || '-',
        kelas: row[3] || '-',
        status: row[4] || 'Izin',
        keterangan: row[5] || '-',
        tanggal: row[6] || '-',
        link: row[7] || '-',
        verifikasi: row[8] || 'Menunggu',
        verifikator: row[9] || '-',
      }))
      .reverse();

    return res.json({ success: true, izin: rows });
  } catch (error: any) {
    console.error('[SiBintang] Error Get Riwayat Izin:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat riwayat izin.',
    });
  }
});

const handleGetIzinGuru = async (req: Request, res: Response) => {
  try {
    const kelas = String(req.query.kelas || 'SEMUA').trim().toUpperCase();
    const isAllKelas = !kelas || kelas === 'SEMUA';

    const izinRes = await sheets.spreadsheets.values
      .get({ spreadsheetId: SPREADSHEET_ID, range: 'Izin!A2:J' })
      .catch(() => ({ data: { values: [] } }));
    const allRows = izinRes.data.values || [];
    const daftarIzin: PermohonanIzin[] = [];

    allRows.forEach((row, index) => {
      const rowKelas = String(row[3] || '').trim().toUpperCase();
      if (isAllKelas || rowKelas === kelas) {
        daftarIzin.push({
          rowIndex: index + 2,
          waktuPengajuan: row[0] || '-',
          nis: bersihkanKutipanSel(row[1]) || '-',
          nama: row[2] || '-',
          kelas: row[3] || '-',
          status: row[4] || 'Izin',
          keterangan: row[5] || '-',
          tanggalMulai: row[6] || '-',
          link: row[7] || '-',
          statusVerifikasi: row[8] || 'Menunggu',
          verifikator: row[9] || '-',
        });
      }
    });

    daftarIzin.reverse();
    return res.json({ success: true, daftarIzin });
  } catch (error: any) {
    console.error('[SiBintang] Error Get Izin Guru Detail:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar izin siswa.',
    });
  }
};

app.get('/api/guru/verifikasi-izin', handleGetIzinGuru);
app.get('/api/guru/izin', handleGetIzinGuru);

const handlePostVerifikasiIzinGuru = async (req: Request, res: Response) => {
  try {
    const { rowIndex, tindakan, verifikator } = req.body;
    const targetRow = Number(rowIndex);

    if (!targetRow || isNaN(targetRow) || targetRow < 2 || !tindakan) {
      return res.status(400).json({
        success: false,
        message: 'Data verifikasi atau nomor baris tidak valid!',
      });
    }

    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Izin!A${targetRow}:J${targetRow}`,
    });

    const rowData = rowRes.data.values?.[0];
    if (!rowData) {
      return res.status(404).json({
        success: false,
        message: 'Data pengajuan izin tidak ditemukan.',
      });
    }

    const nis = bersihkanKutipanSel(rowData[1]);
    const nama = rowData[2];
    const kelas = rowData[3];
    const statusIzin = rowData[4];
    const keterangan = rowData[5];
    const tanggalMulai = rowData[6];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Izin!I${targetRow}:J${targetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[tindakan, verifikator || 'Wali Kelas']],
      },
    });

    if (tindakan === 'Disetujui') {
      const waktuSekarang = getWaktuWIB();
      const jamOnly = waktuSekarang.includes(' ') ? waktuSekarang.split(' ')[1] : waktuSekarang;
      const waktuAbsen = `${tanggalMulai} ${jamOnly}`;
      const keteranganAbsen = `Surat ${statusIzin} disetujui ${verifikator || 'Guru'} (${keterangan})`;

      await pastikanSheetAda('Absensi', [
        'Waktu (Timestamp)',
        'NIS',
        'Nama Siswa',
        'Kelas',
        'Status Kehadiran',
        'Keterangan / Isi QR',
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Absensi!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[waktuAbsen, `'${nis}`, nama, kelas, statusIzin, keteranganAbsen]],
        },
      });
    }

    return res.json({
      success: true,
      message: `Pengajuan ${nama} berhasil ditandai sebagai: ${tindakan}`,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Aksi Verifikasi Izin Detail:', error.message);
    return res.status(500).json({
      success: false,
      message: `Gagal memproses verifikasi izin: ${error.message}`,
    });
  }
};

app.post('/api/guru/verifikasi-izin', handlePostVerifikasiIzinGuru);
app.post('/api/guru/izin', handlePostVerifikasiIzinGuru);

// ============================================================================
// 6. ENDPOINT MATERI PELAJARAN & LOG BACA SISWA (/api/materi, /api/guru/materi)
// ============================================================================

app.get('/api/materi', async (req: Request, res: Response) => {
  try {
    const kelas = String(req.query.kelas || 'SEMUA').trim().toUpperCase();
    const mapel = String(req.query.mapel || 'SEMUA').trim();
    const isAllKelas = !kelas || kelas === 'SEMUA';

    const [siswaRes, materiRes, logBacaRes] = await Promise.all([
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'MateriAjar!A2:I' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'LogBacaMateri!A2:F' })
        .catch(() => ({ data: { values: [] } })),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allMateri = materiRes.data.values || [];
    const allLogBaca = logBacaRes.data.values || [];

    const daftarMateri: ItemMateriAjar[] = allMateri
      .map((row, idx) => ({
        id: idx + 2,
        rowIndex: idx + 2,
        waktu: row[0] || '-',
        kelas: String(row[1] || '-').trim().toUpperCase(),
        mapel: row[2] || '-',
        bab: row[3] || 'Materi Umum',
        judul: row[4] || '-',
        ringkasan: row[5] || '-',
        linkFile: row[6] || '#',
        linkExternal: row[7] || '',
        pembuat: row[8] || 'Guru',
      }))
      .filter((m) => {
        const matchKelas = isAllKelas || m.kelas === kelas;
        const matchMapel = !mapel || mapel === 'SEMUA' || m.mapel === mapel;
        return matchKelas && matchMapel && Boolean(m.judul && m.judul !== '-');
      })
      .reverse();

    const logBacaFiltered: LogBacaMateri[] = allLogBaca
      .map((row) => ({
        waktu: row[0] || '-',
        nis: bersihkanKutipanSel(row[1]),
        nama: row[2] || '-',
        kelas: String(row[3] || '-').trim().toUpperCase(),
        mapel: row[4] || '-',
        judulMateri: row[5] || '-',
      }))
      .filter((l) => (isAllKelas || l.kelas === kelas) && (!mapel || mapel === 'SEMUA' || l.mapel === mapel))
      .reverse();

    const siswaKelas = allSiswa
      .filter((row) => isAllKelas || String(row[2] || '').trim().toUpperCase() === kelas)
      .map((row) => ({
        nis: bersihkanKutipanSel(row[0]),
        nama: row[1] || '-',
        kelas: String(row[2] || '').trim().toUpperCase(),
        ortu: row[4] || '-',
        nohp: bersihkanKutipanSel(row[5]) || '-',
      }));

    const logAksesSiswa = siswaKelas.map((s) => {
      const catatanSiswa = logBacaFiltered.filter((l) => l.nis === s.nis);
      const terakhir = catatanSiswa[0] || null;
      return {
        ...s,
        jumlahDibaca: catatanSiswa.length,
        statusBaca: catatanSiswa.length > 0 ? 'Sudah Dipelajari' : 'Belum Membaca',
        waktuTerakhir: terakhir ? terakhir.waktu : '-',
        materiTerakhir: terakhir ? `${terakhir.mapel}: ${terakhir.judulMateri}` : '-',
      };
    });

    return res.json({
      success: true,
      daftarMateri,
      logBaca: logBacaFiltered,
      logAksesSiswa,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Get Materi:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar materi pelajaran.',
    });
  }
});

app.post('/api/guru/materi', async (req: Request, res: Response) => {
  try {
    const { kelas, mapel, bab, judul, ringkasan, linkFile, linkExternal, pembuat } = req.body;
    if (!kelas || !mapel || !judul) {
      return res.status(400).json({
        success: false,
        message: 'Kelas, mata pelajaran, dan judul materi wajib diisi!',
      });
    }

    const waktu = getWaktuWIB();
    await pastikanSheetAda('MateriAjar', [
      'Waktu Terbit',
      'Kelas',
      'Mata Pelajaran',
      'Bab / Pokok Bahasan',
      'Judul Materi',
      'Ringkasan / Catatan',
      'Link Modul (Drive)',
      'Link Video / Web',
      'Pembuat',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MateriAjar!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            waktu,
            String(kelas).trim().toUpperCase(),
            mapel,
            (bab || 'Materi Umum').trim(),
            String(judul).trim(),
            (ringkasan || '-').trim(),
            linkFile || '-',
            (linkExternal || '-').trim(),
            pembuat || 'Guru',
          ],
        ],
      },
    });

    return res.json({
      success: true,
      message: 'Materi pelajaran berhasil diterbitkan ke portal siswa!',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal menerbitkan materi pelajaran: ${error.message}`,
    });
  }
});

app.delete('/api/guru/materi/:id', async (req: Request, res: Response) => {
  try {
    const targetRow = Number(req.params.id);
    if (!targetRow || isNaN(targetRow) || targetRow < 2) {
      return res.status(400).json({ success: false, message: 'ID materi tidak valid.' });
    }

    const resSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MateriAjar!A2:I',
    });
    const rows = resSheet.data.values || [];
    const rowIdx = targetRow - 2;
    if (rowIdx < 0 || rowIdx >= rows.length) {
      return res.status(404).json({ success: false, message: 'Data materi tidak ditemukan.' });
    }

    rows.splice(rowIdx, 1);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'MateriAjar!A2:I',
    });
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'MateriAjar!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      });
    }

    return res.json({
      success: true,
      message: 'Materi pelajaran berhasil dihapus.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus materi pelajaran.',
    });
  }
});

app.post('/api/materi/baca', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, mapel, judulMateri } = req.body;
    const cleanNis = bersihkanKutipanSel(nis);
    if (!cleanNis || !judulMateri) {
      return res.status(400).json({ success: false, message: 'Data siswa dan materi wajib diisi.' });
    }

    const waktu = getWaktuWIB();
    await pastikanSheetAda('LogBacaMateri', [
      'Waktu Akses',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Mata Pelajaran',
      'Judul Materi',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LogBacaMateri!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, `'${cleanNis}`, nama || '-', String(kelas || '-').toUpperCase(), mapel || '-', judulMateri]],
      },
    });

    return res.json({
      success: true,
      message: 'Materi berhasil ditandai sudah dipelajari!',
      waktu,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mencatat log baca materi.',
    });
  }
});

// ============================================================================
// 7. ENDPOINT TUGAS, BANK SOAL & PENILAIAN
// ============================================================================

app.post('/api/tugas', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, mapel, materi, judulTugas, judul, link, fileLink } = req.body;
    const cleanNis = bersihkanKutipanSel(nis);

    if (!cleanNis) {
      return res.status(400).json({ success: false, message: 'NIS siswa wajib dilampirkan!' });
    }

    const rawJudul = (judulTugas || judul || 'Tugas').trim();
    const finalJudul =
      materi && !rawJudul.startsWith('[') ? `[${String(materi).trim()}] ${rawJudul}` : rawJudul;
    const urlDrive = link || fileLink || '-';
    const waktu = getWaktuWIB();

    await pastikanSheetAda('Tugas', [
      'Waktu Upload',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Mata Pelajaran',
      'Judul / Ket. Tugas',
      'Link File Drive',
      'Nilai',
      'Catatan Guru',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tugas!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, `'${cleanNis}`, nama || '-', kelas || '-', mapel || '-', finalJudul, urlDrive]],
      },
    });

    return res.json({
      success: true,
      message: 'Tugas berhasil diunggah ke Google Drive & tercatat di Sheet!',
      fileLink: urlDrive,
      waktu,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Simpan Tugas:', error.message);
    return res.status(500).json({
      success: false,
      message: `Gagal mencatat tugas: ${error.message}`,
    });
  }
});

app.get('/api/riwayat/:nis', async (req: Request, res: Response) => {
  try {
    const cleanNis = bersihkanKutipanSel(req.params.nis);

    const [absenRes, tugasRes] = await Promise.all([
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Absensi!A2:F' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Tugas!A2:I' })
        .catch(() => ({ data: { values: [] } })),
    ]);

    const absenRows = (absenRes.data.values || [])
      .filter((row) => bersihkanKutipanSel(row[1]) === cleanNis)
      .map((row) => ({
        waktu: row[0] || '-',
        nis: bersihkanKutipanSel(row[1]),
        nama: row[2] || '-',
        kelas: row[3] || '-',
        status: row[4] || 'Hadir',
        keterangan: row[5] || '-',
      }))
      .reverse();

    const tugasRows: TugasTerkumpul[] = (tugasRes.data.values || [])
      .map((row, index) => {
        const parsed = ekstrakMateriDanJudul(row[5] || '');
        return {
          rowIndex: index + 2,
          waktu: row[0] || '',
          nis: bersihkanKutipanSel(row[1]),
          nama: row[2] || '',
          kelas: row[3] || '',
          mapel: row[4] || '',
          materi: parsed.materi,
          judul: parsed.judul,
          judulLengkap: row[5] || '',
          link: row[6] || '',
          nilai: row[7] ?? '',
          catatan: row[8] || '',
        };
      })
      .filter((row) => row.nis === cleanNis)
      .reverse();

    return res.json({ success: true, absensi: absenRows, tugas: tugasRows });
  } catch (error: any) {
    console.error('[SiBintang] Error Riwayat:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat data.' });
  }
});

app.get('/api/guru/tugas', async (req: Request, res: Response) => {
  try {
    const kelas = String(req.query.kelas || 'SEMUA').trim().toUpperCase();
    const mapel = String(req.query.mapel || 'SEMUA').trim();
    const isAllKelas = !kelas || kelas === 'SEMUA';

    const [siswaRes, tugasRes, daftarSoalRes] = await Promise.all([
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Tugas!A2:I' })
        .catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'DaftarTugas!A2:J' })
        .catch(() => ({ data: { values: [] } })),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allTugas = tugasRes.data.values || [];
    const allSoal = daftarSoalRes.data.values || [];

    const siswaKelas = allSiswa
      .filter((row) => isAllKelas || String(row[2] || '').trim().toUpperCase() === kelas)
      .map((row) => ({
        nis: bersihkanKutipanSel(row[0]),
        nama: row[1] || '',
        kelas: String(row[2] || '').trim().toUpperCase(),
        ortu: row[4] || '-',
        nohp: bersihkanKutipanSel(row[5]) || '-',
      }));

    const daftarSoalKelas: SoalTugas[] = allSoal
      .filter((row) => {
        const rowKelas = String(row[1] || '').trim().toUpperCase();
        const rowMapel = String(row[2] || '').trim();
        return (isAllKelas || rowKelas === kelas) && (!mapel || mapel === 'SEMUA' || rowMapel === mapel);
      })
      .map((row, idx) => ({
        id: idx + 1,
        waktu: row[0] || '-',
        kelas: row[1] || '-',
        mapel: row[2] || '-',
        materi: row[3] || 'Materi Umum',
        judul: row[4] || '-',
        deskripsi: row[5] || '-',
        link: row[6] || '#',
        linkSoal: row[6] || '#',
        deadline: row[7] || '-',
        linkMateri: row[8] || '',
        linkExternal: row[8] || '',
        pembuat: row[9] || 'Guru',
      }))
      .reverse();

    const daftarTugas: TugasTerkumpul[] = allTugas
      .map((row, index) => {
        const parsed = ekstrakMateriDanJudul(row[5] || '');
        return {
          rowIndex: index + 2,
          waktu: row[0] || '-',
          nis: bersihkanKutipanSel(row[1]),
          nama: row[2] || '-',
          kelas: String(row[3] || '-').trim().toUpperCase(),
          mapel: row[4] || '-',
          materi: parsed.materi,
          judul: parsed.judul,
          judulLengkap: row[5] || '-',
          link: row[6] || '#',
          nilai: row[7] ?? '',
          catatan: row[8] || '',
        };
      })
      .filter((item) => {
        const matchKelas = isAllKelas || item.kelas === kelas;
        const matchMapel = !mapel || mapel === 'SEMUA' || item.mapel === mapel;
        return matchKelas && matchMapel;
      })
      .reverse();

    const nisSudahKumpul = new Set(daftarTugas.map((t) => t.nis));
    const belumKumpul = siswaKelas.filter((s) => !nisSudahKumpul.has(s.nis));

    return res.json({
      success: true,
      totalSiswa: siswaKelas.length,
      totalTerkumpul: daftarTugas.length,
      jumlahSiswaSudah: nisSudahKumpul.size,
      jumlahSiswaBelum: belumKumpul.length,
      daftarTugas,
      belumKumpul,
      daftarSoal: daftarSoalKelas,
      bankSoal: daftarSoalKelas,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Guru Tugas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tugas siswa.',
    });
  }
});

app.post('/api/guru/buat-tugas', async (req: Request, res: Response) => {
  try {
    const {
      mapel,
      kelas,
      materi,
      judul,
      deskripsi,
      deadline,
      pembuat,
      linkSoal,
      link,
      linkMateri,
      linkExternal,
    } = req.body;

    const fileSoalLink = linkSoal || link || '-';
    const finalMateri = (materi || 'Materi Umum').trim();
    const finalLinkMateri = (linkMateri || linkExternal || '-').trim();

    if (!mapel || !kelas || !judul || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Mata pelajaran, kelas, judul, dan deadline wajib diisi!',
      });
    }

    const waktu = getWaktuWIB();
    await pastikanSheetAda('DaftarTugas', [
      'Waktu Dibuat',
      'Kelas',
      'Mata Pelajaran',
      'Materi / Pokok Bahasan',
      'Judul Tugas',
      'Deskripsi / Instruksi',
      'Link File Soal (Drive)',
      'Deadline',
      'Link Materi / YouTube',
      'Pembuat',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'DaftarTugas!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            waktu,
            String(kelas).trim().toUpperCase(),
            mapel,
            finalMateri,
            String(judul).trim(),
            deskripsi || '-',
            fileSoalLink,
            deadline,
            finalLinkMateri,
            pembuat || 'Guru',
          ],
        ],
      },
    });

    return res.json({
      success: true,
      message: 'Tugas berhasil dipublikasikan ke siswa!',
      fileSoalLink,
      linkMateri: finalLinkMateri,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Buat Tugas Guru:', error.message);
    return res.status(500).json({
      success: false,
      message: `Gagal mempublikasikan tugas: ${error.message}`,
    });
  }
});

app.post('/api/guru/nilai', async (req: Request, res: Response) => {
  try {
    const { rowIndex, nilai, catatan } = req.body;
    const targetRow = Number(rowIndex);

    if (!targetRow || isNaN(targetRow) || targetRow < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nomor baris data tugas tidak valid!',
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Tugas!H${targetRow}:I${targetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[nilai !== undefined && nilai !== '' ? nilai : '', catatan || '']],
      },
    });

    return res.json({
      success: true,
      message: 'Nilai dan catatan berhasil disimpan ke Google Sheet!',
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Simpan Nilai:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan nilai ke Google Sheet.',
    });
  }
});

// ============================================================================
// 8. ENDPOINT PAPAN PENGUMUMAN & GENERATOR TOKEN REGISTRASI
// ============================================================================

app.post('/api/guru/pengumuman', async (req: Request, res: Response) => {
  try {
    const { target, kategori, tglBerakhir, judul, isi, pembuat } = req.body;
    if (!target || !tglBerakhir || !judul || !isi) {
      return res.status(400).json({
        success: false,
        message: 'Target, masa tayang, judul, dan isi wajib diisi!',
      });
    }

    const waktu = getWaktuWIB();
    await pastikanSheetAda('Pengumuman', [
      'Waktu (Timestamp)',
      'Target (SEMUA/Kelas)',
      'Kategori',
      'Tenggat Waktu / Expired',
      'Judul Pengumuman',
      'Isi Pengumuman',
      'Pembuat',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pengumuman!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            waktu,
            String(target).trim().toUpperCase(),
            kategori || 'Umum',
            tglBerakhir,
            String(judul).trim(),
            String(isi).trim(),
            pembuat || 'Pengelola',
          ],
        ],
      },
    });

    return res.json({ success: true, message: 'Pengumuman berhasil diterbitkan!' });
  } catch (error: any) {
    console.error('[SiBintang] Error Pengumuman:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menerbitkan pengumuman.',
    });
  }
});

app.get('/api/pengumuman', async (req: Request, res: Response) => {
  try {
    const kelas = String(req.query.kelas || '').trim().toUpperCase();
    const today = getTanggalHariIniWIB();

    const response = await sheets.spreadsheets.values
      .get({ spreadsheetId: SPREADSHEET_ID, range: 'Pengumuman!A2:G' })
      .catch(() => ({ data: { values: [] } }));

    const rows = response.data.values || [];
    const validRows: ItemPengumuman[] = rows
      .filter((row) => {
        const tglExpired = String(row[3] || '9999-12-31').trim();
        const target = String(row[1] || 'SEMUA').trim().toUpperCase();
        const isNotExpired = tglExpired >= today;
        const isTargetMatch =
          !kelas || kelas === 'SEMUA' || target === 'SEMUA' || target === kelas;
        return isNotExpired && isTargetMatch;
      })
      .map((row) => ({
        waktu: row[0] || '',
        target: row[1] || 'SEMUA',
        kategori: row[2] || 'Umum',
        tglBerakhir: row[3] || '',
        judul: row[4] || '',
        isi: row[5] || '',
        pembuat: row[6] || 'Pengelola',
        isGlobal: String(row[1] || 'SEMUA').trim().toUpperCase() === 'SEMUA',
      }))
      .reverse()
      .sort((a, b) => {
        if (a.isGlobal && !b.isGlobal) return -1;
        if (!a.isGlobal && b.isGlobal) return 1;
        return 0;
      });

    return res.json({ success: true, pengumuman: validRows });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat pengumuman.',
    });
  }
});

app.post('/api/admin/generate-token', async (req: Request, res: Response) => {
  try {
    const { kategori, customToken, pembuat } = req.body;
    if (!kategori) {
      return res.status(400).json({
        success: false,
        message: 'Kategori token wajib dipilih!',
      });
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const prefix = String(kategori)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const tokenBaru =
      customToken && String(customToken).trim() !== ''
        ? String(customToken).trim().toUpperCase()
        : `BTG-${prefix}-${randomCode}`;
    const waktu = getWaktuWIB();

    await pastikanSheetAda('Tokens', [
      'TokenKey',
      'Kategori',
      'Status (Aktif)',
      'Waktu Dibuat',
      'Pembuat',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tokens!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[tokenBaru, kategori, 'Aktif', waktu, pembuat || 'Admin']],
      },
    });

    return res.json({
      success: true,
      message: `Token untuk ${kategori} berhasil dibuat!`,
      token: tokenBaru,
    });
  } catch (error: any) {
    console.error('[SiBintang] Error Generate Token:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal men-generate token.',
    });
  }
});

// ============================================================================
// 9. ENDPOINT MANAJEMEN SETTING SISTEM, HAK AKSES ROLE, GURU & SISWA (/api/admin/*)
// ============================================================================

app.get('/api/admin/settings', async (_req: Request, res: Response) => {
  try {
    if (SPREADSHEET_ID) {
      await pastikanSheetAda('Pengaturan', ['Kunci', 'NilaiJSON', 'WaktuDiperbarui']);
      const getRes = await sheets.spreadsheets.values
        .get({ spreadsheetId: SPREADSHEET_ID, range: 'Pengaturan!A2:B' })
        .catch(() => ({ data: { values: [] } }));
      const rows = getRes.data.values || [];
      const configRow = rows.find((r) => r[0] === 'SYSTEM_SETTINGS');
      if (configRow && configRow[1]) {
        try {
          const parsed = JSON.parse(configRow[1]);
          runtimeSettingsCache = { ...runtimeSettingsCache, ...parsed };
        } catch {}
      }
    }
    return res.json({
      success: true,
      settings: runtimeSettingsCache,
    });
  } catch (error: any) {
    return res.json({
      success: true,
      settings: runtimeSettingsCache,
    });
  }
});

app.post('/api/admin/settings', async (req: Request, res: Response) => {
  try {
    const { daftarRole, rolePermissions, schoolConfig } = req.body;
    if (Array.isArray(daftarRole) && daftarRole.length > 0) {
      runtimeSettingsCache.daftarRole = daftarRole;
    }
    if (rolePermissions && typeof rolePermissions === 'object') {
      runtimeSettingsCache.rolePermissions = rolePermissions;
    }
    if (schoolConfig && typeof schoolConfig === 'object') {
      runtimeSettingsCache.schoolConfig = {
        ...runtimeSettingsCache.schoolConfig,
        ...schoolConfig,
      };
    }

    if (SPREADSHEET_ID) {
      await pastikanSheetAda('Pengaturan', ['Kunci', 'NilaiJSON', 'WaktuDiperbarui']);
      const jsonVal = JSON.stringify(runtimeSettingsCache);
      await sheets.spreadsheets.values
        .update({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Pengaturan!A2:C2',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['SYSTEM_SETTINGS', jsonVal, getWaktuWIB()]],
          },
        })
        .catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Pengaturan sistem & hak akses role berhasil disimpan ke server!',
      settings: runtimeSettingsCache,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal menyimpan pengaturan sistem: ${error.message}`,
    });
  }
});

app.get('/api/admin/guru', async (_req: Request, res: Response) => {
  try {
    const resSheet = await sheets.spreadsheets.values
      .get({ spreadsheetId: SPREADSHEET_ID, range: 'Guru!A2:F' })
      .catch(() => ({ data: { values: [] } }));
    const rows = resSheet.data.values || [];
    const daftarGuru: DataGuru[] = rows
      .map((row, idx) => ({
        rowIndex: idx + 2,
        nip: bersihkanKutipanSel(row[0]),
        nama: row[1] || '-',
        role: row[2] || 'Guru Kelas',
        kelasBinaan: row[3] || '-',
        mapelAjar: row[4] || '-',
        merangkapGuruKelas: String(row[5] || '').toLowerCase() === 'ya',
      }))
      .filter((g) => Boolean(g.nip));

    return res.json({ success: true, daftarGuru });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar akun guru.',
    });
  }
});

app.post('/api/admin/guru/update-role', async (req: Request, res: Response) => {
  try {
    const { nip, role, kelasBinaan, mapelAjar, merangkapGuruKelas } = req.body;
    const cleanNip = bersihkanKutipanSel(nip);
    if (!cleanNip || !role) {
      return res.status(400).json({ success: false, message: 'NIP dan Role baru wajib diisi!' });
    }

    const resSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Guru!A2:F',
    });
    const rows = resSheet.data.values || [];
    const idx = rows.findIndex(
      (r) => bersihkanKutipanSel(r[0]).toLowerCase() === cleanNip.toLowerCase()
    );
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Data akun guru tidak ditemukan.' });
    }

    const rowNum = idx + 2;
    const current = rows[idx];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Guru!C${rowNum}:F${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            role,
            kelasBinaan !== undefined ? kelasBinaan : current[3] || '-',
            mapelAjar !== undefined ? mapelAjar : current[4] || '-',
            merangkapGuruKelas ? 'Ya' : 'Tidak',
          ],
        ],
      },
    });

    return res.json({
      success: true,
      message: `Peran akun ${current[1]} berhasil diperbarui menjadi ${role}.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal memperbarui peran guru: ${error.message}`,
    });
  }
});

app.delete('/api/admin/guru/:nip', async (req: Request, res: Response) => {
  try {
    const cleanNip = bersihkanKutipanSel(req.params.nip);
    const resSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Guru!A2:F',
    });
    const rows = resSheet.data.values || [];
    const filtered = rows.filter(
      (r) => bersihkanKutipanSel(r[0]).toLowerCase() !== cleanNip.toLowerCase()
    );

    if (filtered.length === rows.length) {
      return res.status(404).json({ success: false, message: 'Akun guru tidak ditemukan.' });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Guru!A2:F',
    });

    if (filtered.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Guru!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: filtered },
      });
    }

    return res.json({
      success: true,
      message: `Akun pengelola dengan NIP ${cleanNip} berhasil dihapus dari sistem.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal menghapus akun guru: ${error.message}`,
    });
  }
});

app.get('/api/admin/siswa', async (_req: Request, res: Response) => {
  try {
    const resSheet = await sheets.spreadsheets.values
      .get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' })
      .catch(() => ({ data: { values: [] } }));
    const rows = resSheet.data.values || [];
    const daftarSiswa: DataSiswa[] = rows
      .map((row, idx) => ({
        rowIndex: idx + 2,
        nis: bersihkanKutipanSel(row[0]),
        nama: row[1] || '-',
        kelas: String(row[2] || '-').trim().toUpperCase(),
        jk: row[3] || '-',
        ortu: row[4] || '-',
        nohp: bersihkanKutipanSel(row[5]) || '-',
      }))
      .filter((s) => Boolean(s.nis));

    return res.json({ success: true, daftarSiswa });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar siswa.',
    });
  }
});

app.delete('/api/admin/siswa/:nis', async (req: Request, res: Response) => {
  try {
    const cleanNis = bersihkanKutipanSel(req.params.nis);
    const resSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Siswa!A2:F',
    });
    const rows = resSheet.data.values || [];
    const filtered = rows.filter((r) => bersihkanKutipanSel(r[0]) !== cleanNis);

    if (filtered.length === rows.length) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Siswa!A2:F',
    });

    if (filtered.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Siswa!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: filtered },
      });
    }

    return res.json({
      success: true,
      message: `Data siswa dengan NIS ${cleanNis} berhasil dihapus dari database sekolah.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal menghapus data siswa: ${error.message}`,
    });
  }
});

// ============================================================================
// 10. GLOBAL ERROR HANDLER & SERVER LISTENER
// ============================================================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SiBintang] Unhandled Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SiBintang] Server berjalan di http://localhost:${PORT}`);
  });
}

export default app;
