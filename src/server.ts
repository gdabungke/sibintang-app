import express, { Request, Response } from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Autentikasi Google API menggunakan GOOGLE_CREDENTIALS_JSON di Vercel
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

let auth: any;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
} else {
  auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../credentials.json'),
    scopes: SCOPES,
  });
}

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';

// Helper Format Waktu WIB
const getWaktuWIB = (): string => {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

// Mengambil Akun Khusus langsung dari Variabel Lingkungan Vercel (AKUN_KHUSUS_JSON)
interface AkunKhusus {
  nip: string;
  nama: string;
  role: string;
  kelasBinaan: string;
  mapelAjar: string;
}

const getAkunKhususList = (): AkunKhusus[] => {
  try {
    const rawAkun = process.env.AKUN_KHUSUS_JSON || process.env.AKUN_KHUSUS;
    if (!rawAkun) return [];
    return JSON.parse(rawAkun);
  } catch (err) {
    console.error('Gagal membaca variabel AKUN_KHUSUS_JSON:', err);
    return [];
  }
};

// Helper: Cek & Pastikan Tab Sheet Ada (Menghindari 400 Unable to parse range)
async function pastikanSheetAda(sheetTitle: string, defaultHeaders: string[] = []): Promise<void> {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = (meta.data.sheets || []).some(
      (s) => s.properties?.title?.toLowerCase() === sheetTitle.toLowerCase()
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetTitle },
              },
            },
          ],
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
  } catch (err) {
    console.warn(`Pemeriksaan tab sheet ${sheetTitle}:`, err);
  }
}

// Helper: Fungsi Cek Validitas Token di Sheet "Tokens"
async function validasiTokenDatabase(tokenInput: string, roleOrKategori: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tokens!A2:C',
    });
    const rows = response.data.values || [];
    const inputClean = (tokenInput || '').trim();
    const roleClean = (roleOrKategori || '').trim().toLowerCase();

    const found = rows.find((row) => {
      const dbToken = (row[0] || '').trim();
      const dbKategori = (row[1] || '').trim().toLowerCase();
      const dbStatus = (row[2] || '').trim().toLowerCase();

      if (dbToken !== inputClean || dbStatus !== 'aktif') {
        return false;
      }

      if (roleClean.includes('guru')) {
        return (
          dbKategori === 'guru' ||
          dbKategori.includes('guru') ||
          dbKategori.includes('mapel') ||
          dbKategori.includes('kelas')
        );
      }

      if (roleClean.includes('kelas') || roleClean.includes('siswa')) {
        const numTarget = roleClean.replace(/[^0-9]/g, '');
        const numDb = dbKategori.replace(/[^0-9]/g, '');
        if (numTarget && numDb) {
          return numTarget === numDb;
        }
      }

      return dbKategori === roleClean || dbKategori.includes(roleClean) || roleClean.includes(dbKategori);
    });

    return !!found;
  } catch (err) {
    console.error('Gagal memvalidasi token:', err);
    return false;
  }
}

// 1. ENDPOINT LOGIN & REGISTRASI SISWA
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, jk, ortu, nohp, aksi, token } = req.body;
    if (!nis) {
      return res.status(400).json({ success: false, message: 'Nomor Induk Siswa (NIS) wajib diisi!' });
    }

    const akunKhususList = getAkunKhususList();
    const akunKhusus = akunKhususList.find((user) => user.nip === nis);
    if (akunKhusus) {
      return res.json({
        success: true,
        data: {
          nis: akunKhusus.nip,
          nama: `${akunKhusus.nama} (${akunKhusus.role})`,
          kelas: '1A',
          jk: 'Laki-laki',
          ortu: 'Akun Pengelola Sekolah',
          nohp: '-',
        },
      });
    }

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Siswa!A2:F',
    });
    const rows = getRows.data.values || [];
    const existingStudent = rows.find((row) => row[0] === nis);

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
          nis: existingStudent[0],
          nama: existingStudent[1],
          kelas: existingStudent[2],
          jk: existingStudent[3],
          ortu: existingStudent[4],
          nohp: existingStudent[5],
        },
      });
    } else {
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'NIS sudah terdaftar di sistem! Silakan gunakan menu Masuk (Login).',
        });
      }
      if (!nama || !kelas) {
        return res.status(400).json({ success: false, message: 'Nama lengkap dan Kelas wajib diisi untuk pendaftaran!' });
      }

      const kategoriToken = `Kelas ${kelas.replace(/[^0-9]/g, '')}`;
      const isTokenValid = (await validasiTokenDatabase(token, kategoriToken)) || (await validasiTokenDatabase(token, kelas));
      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          message: `Token pendaftaran untuk ${kategoriToken} salah, tidak valid, atau belum dimasukkan!`,
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Siswa!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[nis, nama, kelas, jk || '-', ortu || '-', nohp || '-']],
        },
      });

      return res.json({
        success: true,
        data: { nis, nama, kelas, jk: jk || '-', ortu: ortu || '-', nohp: nohp || '-' },
      });
    }
  } catch (error: any) {
    console.error('Error Auth Siswa:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses data autentikasi siswa ke Google Sheet.' });
  }
});

// 2. ENDPOINT LOGIN & REGISTRASI GURU / PENGELOLA
app.post('/api/guru/login', async (req: Request, res: Response) => {
  try {
    const { nip, nama, role, kelasBinaan, mapelAjar, aksi, token } = req.body;
    if (!nip) {
      return res.status(400).json({ success: false, message: 'NIP / ID Guru wajib diisi!' });
    }

    const akunKhususList = getAkunKhususList();
    const akunKhusus = akunKhususList.find((user) => user.nip === nip);
    if (akunKhusus) {
      return res.json({
        success: true,
        data: akunKhusus,
      });
    }

    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Guru!A2:E',
    });
    const rows = getRows.data.values || [];
    const existingGuru = rows.find((row) => row[0] === nip);

    if (aksi === 'login') {
      if (!existingGuru) {
        return res.status(404).json({
          success: false,
          message: 'NIP belum terdaftar! Silakan lakukan Registrasi akun pengelola terlebih dahulu.',
        });
      }
      return res.json({
        success: true,
        data: {
          nip: existingGuru[0],
          nama: existingGuru[1],
          role: existingGuru[2],
          kelasBinaan: existingGuru[3],
          mapelAjar: existingGuru[4],
        },
      });
    } else {
      if (existingGuru) {
        return res.status(400).json({
          success: false,
          message: 'NIP sudah terdaftar di sistem! Silakan gunakan menu Masuk (Login).',
        });
      }
      if (!nama || !role) {
        return res.status(400).json({ success: false, message: 'Nama lengkap dan Peran (Role) wajib diisi!' });
      }

      const isTokenValid = await validasiTokenDatabase(token, role);
      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          message: `Token pendaftaran untuk role ${role} salah atau tidak valid!`,
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Guru!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[nip, nama, role, kelasBinaan || '-', mapelAjar || '-']],
        },
      });

      return res.json({
        success: true,
        data: { nip, nama, role, kelasBinaan: kelasBinaan || '-', mapelAjar: mapelAjar || '-' },
      });
    }
  } catch (error: any) {
    console.error('Error Auth Guru:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses autentikasi guru.' });
  }
});

// 3. ENDPOINT ABSENSI QR CODE
app.post('/api/absen', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, qrCodeData } = req.body;
    if (!nis) {
      return res.status(400).json({ success: false, message: 'NIS siswa tidak valid.' });
    }
    if (!qrCodeData || typeof qrCodeData !== 'string') {
      return res.status(400).json({ success: false, message: 'Data QR Code tidak terbaca.' });
    }

    const qrParts = qrCodeData.split('|').map((item: string) => item.trim());
    if (qrParts.length < 4 || !qrParts[0].startsWith('ABSEN-SIBINTANG')) {
      return res.status(400).json({ success: false, message: 'Kode QR tidak valid atau format tidak sesuai.' });
    }

    const kelasQR = qrParts[1].toUpperCase();
    const tanggalQR = qrParts[2];
    const sesiQR = qrParts[3].toLowerCase();
    const kelasSiswa = (kelas || '').trim().toUpperCase();

    if (kelasSiswa !== kelasQR) {
      return res.status(403).json({
        success: false,
        message: `Gagal Absen! QR Code ini untuk Kelas ${kelasQR}, Anda terdaftar di Kelas ${kelasSiswa || '-'}.`,
      });
    }

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!B:F',
    });
    const rows = sheetData.data.values || [];

    const sudahAbsen = rows.some((row) => {
      const rowNis = (row[0] || '').toString().trim();
      const rowQrData = (row[4] || '').toString().trim().toLowerCase();
      if (rowNis !== nis.toString().trim()) return false;
      return (
        rowQrData === qrCodeData.trim().toLowerCase() ||
        (rowQrData.includes(tanggalQR.toLowerCase()) && rowQrData.includes(sesiQR))
      );
    });

    if (sudahAbsen) {
      return res.status(409).json({ success: false, message: `Anda sudah melakukan ${qrParts[3]} hari ini!` });
    }

    const waktu = getWaktuWIB();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nis, nama, kelasSiswa, 'Hadir', qrCodeData]],
      },
    });

    return res.json({ success: true, message: `Absensi ${qrParts[3]} Kelas ${kelasSiswa} berhasil dicatat!`, waktu });
  } catch (error: any) {
    console.error('Error Absen:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses absensi.' });
  }
});

// 4. ENDPOINT PENGUMPULAN TUGAS SISWA (KINI JSON MURNI DENGAN LINK DRIVE DARI APPS SCRIPT)
app.post('/api/tugas', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, mapel, judulTugas, judul, link, fileLink } = req.body;
    const finalJudul = (judulTugas || judul || 'Tugas').trim();
    const urlDrive = link || fileLink || '-';

    if (!nis) {
      return res.status(400).json({ success: false, message: 'NIS siswa wajib dilampirkan!' });
    }

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
        values: [[waktu, `'${nis}`, nama || '-', kelas || '-', mapel || '-', finalJudul, urlDrive]],
      },
    });

    return res.json({
      success: true,
      message: 'Tugas berhasil diunggah ke Google Drive & tercatat di Sheet!',
      fileLink: urlDrive,
      waktu,
    });
  } catch (error: any) {
    console.error('Error Simpan Tugas:', error.message);
    return res.status(500).json({ success: false, message: `Gagal mencatat tugas: ${error.message}` });
  }
});

// 5. ENDPOINT RIWAYAT LOG ABSEN & TUGAS PER SISWA
app.get('/api/riwayat/:nis', async (req: Request, res: Response) => {
  try {
    const { nis } = req.params;
    const [absenRes, tugasRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Absensi!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tugas!A2:I' }),
    ]);

    const absenRows = (absenRes.data.values || [])
      .filter((row) => row[1] === nis)
      .map((row) => ({
        waktu: row[0],
        nis: row[1],
        nama: row[2],
        kelas: row[3],
        status: row[4],
        keterangan: row[5],
      }))
      .reverse();

    const tugasRows = (tugasRes.data.values || [])
      .map((row, index) => ({
        rowIndex: index + 2,
        waktu: row[0] || '',
        nis: row[1] || '',
        nama: row[2] || '',
        kelas: row[3] || '',
        mapel: row[4] || '',
        judul: row[5] || '',
        link: row[6] || '',
        nilai: row[7] || '',
        catatan: row[8] || '',
      }))
      .filter((row) => row.nis === nis)
      .reverse();

    return res.json({ success: true, absensi: absenRows, tugas: tugasRows });
  } catch (error: any) {
    console.error('Error Riwayat:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat data.' });
  }
});

// 6. ENDPOINT REKAP ABSENSI HARIAN PER KELAS (KHUSUS GURU)
app.get('/api/guru/rekap', async (req: Request, res: Response) => {
  try {
    const { kelas, tanggal } = req.query;
    if (!kelas || !tanggal) {
      return res.status(400).json({ success: false, message: 'Parameter kelas dan tanggal wajib diisi!' });
    }

    const [siswaRes, absenRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Absensi!A2:F' }),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allAbsen = absenRes.data.values || [];

    const siswaKelas = allSiswa
      .filter((row) => row[2] === kelas)
      .map((row) => ({
        nis: row[0] || '',
        nama: row[1] || '',
        kelas: row[2] || '',
        jk: row[3] || '-',
        ortu: row[4] || '-',
        nohp: row[5] || '-',
      }));

    const [year, month, day] = (tanggal as string).split('-');
    const dateStrId1 = `${parseInt(day)}/${parseInt(month)}/${year}`;
    const dateStrId2 = `${day}/${month}/${year}`;
    const targetQrPrefix = `ABSEN-SIBINTANG|${kelas}|${tanggal}`;

    const absenHariIni = allAbsen.filter((row) => {
      const waktu = row[0] || '';
      const rowKelas = row[3] || '';
      const qrData = row[5] || '';
      const isMatchingQr = qrData.startsWith(targetQrPrefix);
      const isMatchingDateAndClass = rowKelas === kelas && (waktu.includes(dateStrId1) || waktu.includes(dateStrId2));
      return isMatchingQr || isMatchingDateAndClass;
    });

    const sudahAbsen: any[] = [];
    const belumAbsen: any[] = [];

    siswaKelas.forEach((siswa) => {
      const logHadir = absenHariIni.find((row) => row[1] === siswa.nis);
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

    return res.json({
      success: true,
      kelas,
      tanggal,
      totalSiswa: siswaKelas.length,
      jumlahHadir: sudahAbsen.length,
      jumlahBelum: belumAbsen.length,
      sudahAbsen,
      belumAbsen,
    });
  } catch (error: any) {
    console.error('Error Rekap Guru:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil rekap absensi kelas.' });
  }
});

// 7. ENDPOINT REKAP TUGAS PER KELAS & MAPEL (KHUSUS GURU)
app.get('/api/guru/tugas', async (req: Request, res: Response) => {
  try {
    const { kelas, mapel } = req.query;
    if (!kelas) {
      return res.status(400).json({ success: false, message: 'Parameter kelas wajib diisi!' });
    }

    const [siswaRes, tugasRes, daftarSoalRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tugas!A2:I' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'DaftarTugas!A2:H' }).catch(() => ({ data: { values: [] } })),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allTugas = tugasRes.data.values || [];
    const allSoal = daftarSoalRes.data.values || [];

    const siswaKelas = allSiswa
      .filter((row) => row[2] === kelas)
      .map((row) => ({
        nis: row[0] || '',
        nama: row[1] || '',
        kelas: row[2] || '',
        ortu: row[4] || '-',
        nohp: row[5] || '-',
      }));

    const daftarSoalKelas = allSoal
      .filter((row) => row[1] === kelas && (!mapel || mapel === 'SEMUA' || row[2] === mapel))
      .map((row) => ({
        waktu: row[0] || '-',
        kelas: row[1] || '-',
        mapel: row[2] || '-',
        judul: row[3] || '-',
        deskripsi: row[4] || '-',
        link: row[5] || '#',
        deadline: row[6] || '-',
        pembuat: row[7] || 'Guru',
      }))
      .reverse();

    const daftarTugas = allTugas
      .map((row, index) => ({
        rowIndex: index + 2,
        waktu: row[0] || '-',
        nis: row[1] || '-',
        nama: row[2] || '-',
        kelas: row[3] || '-',
        mapel: row[4] || '-',
        judul: row[5] || '-',
        link: row[6] || '#',
        nilai: row[7] || '',
        catatan: row[8] || '',
      }))
      .filter((item) => {
        const matchKelas = item.kelas === kelas;
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
    });
  } catch (error: any) {
    console.error('Error Guru Tugas:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data tugas siswa.' });
  }
});

// 8a. ENDPOINT GURU: BUAT TUGAS / SOAL BARU (KINI MENGGUNAKAN LINK DRIVE DARI APPS SCRIPT)
app.post('/api/guru/buat-tugas', async (req: Request, res: Response) => {
  try {
    const { mapel, kelas, judul, deskripsi, deadline, pembuat, linkSoal, link } = req.body;
    const fileSoalLink = linkSoal || link || '-';

    if (!mapel || !kelas || !judul || !deadline) {
      return res.status(400).json({ success: false, message: 'Mata pelajaran, kelas, judul, dan deadline wajib diisi!' });
    }

    const waktu = getWaktuWIB();

    await pastikanSheetAda('DaftarTugas', [
      'Waktu Dibuat',
      'Kelas',
      'Mata Pelajaran',
      'Judul Tugas',
      'Deskripsi / Instruksi',
      'Link File Soal (Drive)',
      'Deadline',
      'Pembuat',
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'DaftarTugas!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, kelas, mapel, judul, deskripsi || '-', fileSoalLink, deadline, pembuat || 'Guru']],
      },
    });

    return res.json({
      success: true,
      message: 'Tugas berhasil dipublikasikan ke siswa!',
      fileSoalLink,
    });
  } catch (error: any) {
    console.error('Error Buat Tugas Guru:', error.message);
    return res.status(500).json({ success: false, message: `Gagal mempublikasikan tugas: ${error.message}` });
  }
});

// 8b. ENDPOINT SIMPAN NILAI & CATATAN TUGAS OLEH GURU
app.post('/api/guru/nilai', async (req: Request, res: Response) => {
  try {
    const { rowIndex, nilai, catatan } = req.body;
    const targetRow = Number(rowIndex);

    if (!targetRow || isNaN(targetRow) || targetRow < 2) {
      return res.status(400).json({ success: false, message: 'Nomor baris data tugas tidak valid!' });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Tugas!H${targetRow}:I${targetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[nilai !== undefined && nilai !== '' ? nilai : '', catatan || '']],
      },
    });

    return res.json({ success: true, message: 'Nilai dan catatan berhasil disimpan ke Google Sheet!' });
  } catch (error: any) {
    console.error('Error Simpan Nilai:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan nilai ke Google Sheet.' });
  }
});

// 9. ENDPOINT PENGAJUAN IZIN / SAKIT SISWA (KINI JSON MURNI DENGAN LINK DRIVE DARI APPS SCRIPT)
app.post('/api/izin', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, statusIzin, keterangan, tanggalMulai, link, linkBukti } = req.body;
    const fileLink = link || linkBukti || '-';

    if (!nis || !nama || !kelas || !statusIzin || !tanggalMulai) {
      return res.status(400).json({ success: false, message: 'Data pengajuan izin belum lengkap!' });
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
        values: [[waktu, `'${nis}`, nama, kelas, statusIzin, keterangan || '-', tanggalMulai, fileLink, 'Menunggu', '-']],
      },
    });

    return res.json({
      success: true,
      message: 'Pengajuan izin/sakit berhasil dikirim ke pihak sekolah!',
      fileLink,
    });
  } catch (error: any) {
    console.error('Error Izin Detail:', error.message);
    return res.status(500).json({ success: false, message: `Gagal mengirim pengajuan izin: ${error.message}` });
  }
});

// 10a. ENDPOINT AMBIL RIWAYAT IZIN SISWA
app.get('/api/izin/:nis', async (req: Request, res: Response) => {
  try {
    const { nis } = req.params;
    const izinRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Izin!A2:J',
    });

    const rows = (izinRes.data.values || [])
      .filter((row) => String(row[1] || '').trim() === String(nis).trim())
      .map((row) => ({
        waktu: row[0] || '-',
        nis: row[1] || '-',
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
    console.error('Error Get Riwayat Izin:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memuat riwayat izin.' });
  }
});

// 10b. ENDPOINT AMBIL DAFTAR PENGAJUAN IZIN UNTUK GURU
app.get('/api/guru/verifikasi-izin', async (req: Request, res: Response) => {
  try {
    const kelas = req.query.kelas as string;
    if (!kelas) {
      return res.status(400).json({ success: false, message: 'Parameter kelas wajib disertakan!' });
    }

    const izinRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Izin!A2:J',
    });

    const allRows = izinRes.data.values || [];
    const daftarIzin: any[] = [];

    allRows.forEach((row, index) => {
      const rowKelas = String(row[3] || '').trim().toUpperCase();
      if (rowKelas === kelas.trim().toUpperCase()) {
        daftarIzin.push({
          rowIndex: index + 2,
          waktuPengajuan: row[0] || '-',
          nis: row[1] || '-',
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
    console.error('Error Get Izin Guru Detail:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar izin siswa.' });
  }
});

// 10c. ENDPOINT AKSI VERIFIKASI IZIN / SAKIT OLEH GURU
app.post('/api/guru/verifikasi-izin', async (req: Request, res: Response) => {
  try {
    const { rowIndex, tindakan, verifikator } = req.body;
    const targetRow = Number(rowIndex);

    if (!targetRow || isNaN(targetRow) || targetRow < 2 || !tindakan) {
      return res.status(400).json({ success: false, message: 'Data verifikasi atau nomor baris tidak valid!' });
    }

    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Izin!A${targetRow}:J${targetRow}`,
    });

    const rowData = rowRes.data.values?.[0];
    if (!rowData) {
      return res.status(404).json({ success: false, message: 'Data pengajuan izin tidak ditemukan.' });
    }

    const nis = rowData[1];
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
    console.error('Error Aksi Verifikasi Izin Detail:', error.message);
    return res.status(500).json({ success: false, message: `Gagal memproses verifikasi izin: ${error.message}` });
  }
});

// 11. ENDPOINT TAMBAH PENGUMUMAN DENGAN TARGET & MASA TAYANG
app.post('/api/guru/pengumuman', async (req: Request, res: Response) => {
  try {
    const { target, kategori, tglBerakhir, judul, isi, pembuat } = req.body;
    if (!target || !tglBerakhir || !judul || !isi) {
      return res.status(400).json({ success: false, message: 'Target, masa tayang, judul, dan isi wajib diisi!' });
    }

    const waktu = getWaktuWIB();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pengumuman!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, target, kategori || 'Umum', tglBerakhir, judul, isi, pembuat || 'Pengelola']],
      },
    });

    return res.json({ success: true, message: 'Pengumuman berhasil diterbitkan!' });
  } catch (error: any) {
    console.error('Error Pengumuman:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menerbitkan pengumuman.' });
  }
});

// 12. ENDPOINT AMBIL PENGUMUMAN
app.get('/api/pengumuman', async (req: Request, res: Response) => {
  try {
    const { kelas } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pengumuman!A2:G',
    });

    const rows = response.data.values || [];
    const validRows = rows
      .filter((row) => {
        const tglExpired = row[3] || '9999-12-31';
        const target = row[1] || 'SEMUA';
        const isNotExpired = tglExpired >= today;
        const isTargetMatch = !kelas || target === 'SEMUA' || target === kelas;
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
        isGlobal: (row[1] || 'SEMUA') === 'SEMUA',
      }))
      .sort((a, b) => {
        if (a.isGlobal && !b.isGlobal) return -1;
        if (!a.isGlobal && b.isGlobal) return 1;
        return 0;
      })
      .reverse();

    return res.json({ success: true, pengumuman: validRows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pengumuman.' });
  }
});

// 13. ENDPOINT ADMIN: GENERATE TOKEN BARU
app.post('/api/admin/generate-token', async (req: Request, res: Response) => {
  try {
    const { kategori, customToken, pembuat } = req.body;
    if (!kategori) {
      return res.status(400).json({ success: false, message: 'Kategori token wajib dipilih!' });
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const prefix = kategori.toUpperCase().replace(/\s+/g, '-');
    const tokenBaru = customToken || `BTG-${prefix}-${randomCode}`;
    const waktu = getWaktuWIB();

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
    console.error('Error Generate Token:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal men-generate token.' });
  }
});

// PENTUTUP PORT
app.listen(PORT, () => {
  console.log(`Server SiBintang berjalan di http://localhost:${PORT}`);
});
