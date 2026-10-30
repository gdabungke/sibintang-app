import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { Readable } from 'stream';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Konfigurasi Multer (Simpan file sementara di memori sebelum diupload ke Drive)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // Maksimal 15 MB
});

// Autentikasi Google API menggunakan Environment Variables Vercel (KODE AMAN)
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';

// Helper Format Waktu WIB
const getWaktuWIB = (): string => {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

// Daftar Akun Khusus (Langsung terdaftar di kode sistem)
const AKUN_KHUSUS = [
  {
    nip: '133715',
    nama: 'Marolo',
    role: 'Admin Sistem',
    kelasBinaan: '-',
    mapelAjar: '-'
  },
  {
    nip: 'ADMINSDRKBT',
    nama: 'Administrator Utama',
    role: 'Admin Sistem',
    kelasBinaan: '-',
    mapelAjar: '-'
  },
  {
    nip: 'KEPSEK01',
    nama: 'Kepala Sekolah',
    role: 'Kepala Sekolah',
    kelasBinaan: '-',
    mapelAjar: '-'
  }
];

// Helper: Fungsi Cek Validitas Token di Sheet "Tokens"
async function validasiTokenDatabase(tokenInput: string, kategoriTarget: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tokens!A2:C',
    });
    const rows = response.data.values || [];
    // Kolom A: TokenKey, Kolom B: Kategori, Kolom C: Status ('Aktif')
    const found = rows.find(
      (row) => row[0] === tokenInput && row[1] === kategoriTarget && row[2] === 'Aktif'
    );
    return !!found;
  } catch (err) {
    console.error('Gagal memvalidasi token:', err);
    return false;
  }
}

// 1. ENDPOINT LOGIN & REGISTRASI SISWA (Berdasarkan NIS)
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, jk, ortu, nohp, aksi, token } = req.body;
    if (!nis) {
      return res.status(400).json({ success: false, message: 'Nomor Induk Siswa (NIS) wajib diisi!' });
    }

    // 1. BYPASS LOGIN AKUN KHUSUS ADMIN & KEPALA SEKOLAH KE PORTAL SISWA
    const akunKhusus = AKUN_KHUSUS.find((user) => user.nip === nis);
    if (akunKhusus) {
      return res.json({
        success: true,
        data: {
          nis: akunKhusus.nip,
          nama: `${akunKhusus.nama} (${akunKhusus.role})`,
          kelas: '1A', 
          jk: 'Laki-laki',
          ortu: 'Akun Pengelola Sekolah',
          nohp: '-'
        }
      });
    }

    // 2. PROSES MELALUI GOOGLE SHEET UNTUK SISWA REGULER
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
          message: 'NIS belum terdaftar! Silakan lakukan Registrasi atau minta Guru menambahkan data Anda ke Sheet.' 
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
          nohp: existingStudent[5] 
        } 
      });
    } else {
      if (existingStudent) {
        return res.status(400).json({ 
          success: false, 
          message: 'NIS sudah terdaftar di sistem! Silakan gunakan menu Masuk (Login).' 
        });
      }

      if (!nama || !kelas) {
        return res.status(400).json({ success: false, message: 'Nama lengkap dan Kelas wajib diisi untuk pendaftaran!' });
      }

      // Validasi Token Pendaftaran Siswa Berdasarkan Kelas (misal: "Kelas 1", "Kelas 2", dll)
      const kategoriToken = `Kelas ${kelas.replace(/[^0-9]/g, '')}`; 
      const isTokenValid = await validasiTokenDatabase(token, kategoriToken) || await validasiTokenDatabase(token, kelas);
      
      if (!isTokenValid) {
        return res.status(400).json({ 
          success: false, 
          message: `Token pendaftaran untuk ${kategoriToken} salah, tidak valid, atau belum dimasukkan!` 
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
        data: { nis, nama, kelas, jk: jk || '-', ortu: ortu || '-', nohp: nohp || '-' } 
      });
    }
  } catch (error: any) {
    console.error('Error Auth Siswa:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses data autentikasi siswa ke Google Sheet.' });
  }
});

// 2. ENDPOINT LOGIN & REGISTRASI GURU / PENGELOLA (Berdasarkan NIP)
app.post('/api/guru/login', async (req: Request, res: Response) => {
  try {
    const { nip, nama, role, kelasBinaan, mapelAjar, aksi, token } = req.body;
    if (!nip) {
      return res.status(400).json({ success: false, message: 'NIP / ID Guru wajib diisi!' });
    }

    // 1. BYPASS AKUN KHUSUS (ADMIN & KEPALA SEKOLAH)
    const akunKhusus = AKUN_KHUSUS.find((user) => user.nip === nip);
    if (akunKhusus) {
      return res.json({
        success: true,
        data: akunKhusus
      });
    }

    // 2. PROSES MELALUI GOOGLE SHEET UNTUK GURU REGULER
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
          message: 'NIP belum terdaftar! Silakan lakukan Registrasi akun pengelola terlebih dahulu.' 
        });
      }

      return res.json({
        success: true,
        data: { 
          nip: existingGuru[0], 
          nama: existingGuru[1], 
          role: existingGuru[2], 
          kelasBinaan: existingGuru[3], 
          mapelAjar: existingGuru[4] 
        }
      });
    } else {
      if (existingGuru) {
        return res.status(400).json({ 
          success: false, 
          message: 'NIP sudah terdaftar di sistem! Silakan gunakan menu Masuk (Login).' 
        });
      }

      if (!nama || !role) {
        return res.status(400).json({ success: false, message: 'Nama lengkap dan Peran (Role) wajib diisi!' });
      }

      // Validasi Token Berdasarkan Role Pendaftar (Kepala Sekolah, Guru, atau Operator)
      const isTokenValid = await validasiTokenDatabase(token, role);
      if (!isTokenValid) {
        return res.status(400).json({ 
          success: false, 
          message: `Token pendaftaran untuk role ${role} salah atau tidak valid!` 
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
        data: { nip, nama, role, kelasBinaan: kelasBinaan || '-', mapelAjar: mapelAjar || '-' }
      });
    }
  } catch (error: any) {
    console.error('Error Auth Guru:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses autentikasi guru.' });
  }
});

// 3. ENDPOINT ABSENSI QR CODE (Menggunakan NIS)
app.post('/api/absen', async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, qrCodeData } = req.body;
    if (!nis) {
      return res.status(400).json({ success: false, message: 'NIS siswa tidak valid.' });
    }
    const waktu = getWaktuWIB();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nis, nama, kelas, 'Hadir', qrCodeData]],
      },
    });

    return res.json({ success: true, message: 'Absensi berhasil dicatat!', waktu });
  } catch (error: any) {
    console.error('Error Absen:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan absensi.' });
  }
});

// 4. ENDPOINT PENGUMPULAN TUGAS (UPLOAD DRIVE + CATAT DI SHEET) (Menggunakan NIS)
app.post('/api/tugas', upload.single('fileTugas'), async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, mapel, judulTugas } = req.body;
    const file = req.file;

    if (!file || !nis) {
      return res.status(400).json({ success: false, message: 'File tugas dan NIS wajib dilampirkan!' });
    }

    const waktu = getWaktuWIB();
    const cleanNama = nama.replace(/[^a-zA-Z0-9]/g, '_');
    const customFileName = `[Kelas_${kelas}]_${mapel}_${cleanNama}_${nis}_${file.originalname}`;

    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: customFileName,
        parents: DRIVE_FOLDER_ID ? [DRIVE_FOLDER_ID] : undefined,
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: 'id, webViewLink',
    });

    const fileLink = driveResponse.data.webViewLink || `https://drive.google.com/file/d/${driveResponse.data.id}/view`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tugas!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nis, nama, kelas, mapel, judulTugas, fileLink]],
      },
    });

    return res.json({
      success: true,
      message: 'Tugas berhasil diupload ke Google Drive & tercatat di Sheet!',
      fileLink,
      waktu
    });
  } catch (error: any) {
    console.error('Error Upload Tugas:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengupload tugas.' });
  }
});

// 5. ENDPOINT RIWAYAT LOG ABSEN & TUGAS PER SISWA (Berdasarkan NIS)
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

    const [siswaRes, tugasRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tugas!A2:G' }),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allTugas = tugasRes.data.values || [];

    const siswaKelas = allSiswa
      .filter((row) => row[2] === kelas)
      .map((row) => ({
        nis: row[0] || '',
        nama: row[1] || '',
        kelas: row[2] || '',
        ortu: row[4] || '-',
        nohp: row[5] || '-',
      }));

    const daftarTugas = allTugas
      .filter((row) => {
        const matchKelas = row[3] === kelas;
        const matchMapel = !mapel || mapel === 'SEMUA' || row[4] === mapel;
        return matchKelas && matchMapel;
      })
      .map((row) => ({
        waktu: row[0] || '-',
        nis: row[1] || '-',
        nama: row[2] || '-',
        kelas: row[3] || '-',
        mapel: row[4] || '-',
        judul: row[5] || '-',
        link: row[6] || '#',
      }))
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
    });
  } catch (error: any) {
    console.error('Error Guru Tugas:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data tugas siswa.' });
  }
});

// 8. ENDPOINT SIMPAN NILAI & CATATAN TUGAS OLEH GURU
app.post('/api/guru/nilai', async (req: Request, res: Response) => {
  try {
    const { rowIndex, nilai, catatan } = req.body;
    if (!rowIndex || isNaN(rowIndex)) {
      return res.status(400).json({ success: false, message: 'Nomor baris data tugas tidak valid!' });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Tugas!H${rowIndex}:I${rowIndex}`,
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

// 9. ENDPOINT PENGAJUAN IZIN / SAKIT SISWA (Menggunakan NIS)
app.post('/api/izin', upload.single('fileBukti'), async (req: Request, res: Response) => {
  try {
    const { nis, nama, kelas, statusIzin, keterangan, tanggalMulai } = req.body;
    const file = req.file;

    if (!nis || !nama || !kelas || !statusIzin || !tanggalMulai) {
      return res.status(400).json({ success: false, message: 'Data pengajuan izin belum lengkap!' });
    }

    const waktu = getWaktuWIB();
    let fileLink = '-';

    if (file) {
      const cleanNama = nama.replace(/[^a-zA-Z0-9]/g, '_');
      const customFileName = `[IZIN_${statusIzin.toUpperCase()}]_Kelas_${kelas}_${cleanNama}_${nis}_${file.originalname}`;
      
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const driveResponse = await drive.files.create({
        requestBody: {
          name: customFileName,
          parents: DRIVE_FOLDER_ID ? [DRIVE_FOLDER_ID] : undefined,
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream,
        },
        fields: 'id, webViewLink',
      });

      fileLink = driveResponse.data.webViewLink || `https://drive.google.com/file/d/${driveResponse.data.id}/view`;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Izin!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nis, nama, kelas, statusIzin, keterangan || '-', tanggalMulai, fileLink]],
      },
    });

    return res.json({ success: true, message: 'Pengajuan izin/sakit berhasil dikirim ke pihak sekolah!' });
  } catch (error: any) {
    console.error('Error Izin:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengirim pengajuan izin.' });
  }
});

// 10. ENDPOINT AMBIL RIWAYAT IZIN SISWA (Berdasarkan NIS)
app.get('/api/izin/:nis', async (req: Request, res: Response) => {
  try {
    const { nis } = req.params;
    const izinRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Izin!A2:H'
    });

    const rows = (izinRes.data.values || [])
      .filter((row) => row[1] === nis)
      .map((row) => ({
        waktu: row[0],
        status: row[4],
        keterangan: row[5],
        tanggal: row[6],
        link: row[7],
      }))
      .reverse();

    return res.json({ success: true, izin: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat riwayat izin.' });
  }
});

// 11. ENDPOINT TAMBAH PENGUMUMAN OLEH GURU
app.post('/api/guru/pengumuman', async (req: Request, res: Response) => {
  try {
    const { judul, isi, pembuat } = req.body;
    if (!judul || !isi) {
      return res.status(400).json({ success: false, message: 'Judul dan isi pengumuman wajib diisi!' });
    }

    const waktu = getWaktuWIB();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pengumuman!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, judul, isi, pembuat || 'Dewan Guru']],
      },
    });

    return res.json({ success: true, message: 'Pengumuman berhasil diterbitkan ke portal siswa!' });
  } catch (error: any) {
    console.error('Error Pengumuman:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menerbitkan pengumuman.' });
  }
});

// 12. ENDPOINT AMBIL PENGUMUMAN UNTUK SISWA & GURU
app.get('/api/pengumuman', async (req: Request, res: Response) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pengumuman!A2:D',
    });

    const rows = (response.data.values || [])
      .map((row) => ({
        waktu: row[0] || '',
        judul: row[1] || '',
        isi: row[2] || '',
        pembuat: row[3] || 'Dewan Guru',
      }))
      .reverse();

    return res.json({ success: true, pengumuman: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pengumuman.' });
  }
});

// 13. ENDPOINT ADMIN: GENERATE TOKEN BARU (Simpan ke Tab Sheet "Tokens")
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
      token: tokenBaru 
    });
  } catch (error: any) {
    console.error('Error Generate Token:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal men-generate token.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server SiBintang berjalan di http://localhost:${PORT}`);
});

// 14. ENDPOINT GURU: BUAT TUGAS / PR BARU (Mendukung Teks Instruksi & Upload File Soal)
app.post('/api/guru/buat-tugas', upload.single('fileSoal'), async (req: Request, res: Response) => {
  try {
    const { mapel, kelas, judul, deskripsi, deadline, pembuat } = req.body;
    const file = req.file;

    if (!mapel || !kelas || !judul || !deadline) {
      return res.status(400).json({ success: false, message: 'Mata pelajaran, kelas, judul, dan deadline wajib diisi!' });
    }

    const waktu = getWaktuWIB();
    let fileSoalLink = '-';

    // Jika guru mengunggah file lampiran soal ke Google Drive
    if (file) {
      const cleanJudul = judul.replace(/[^a-zA-Z0-9]/g, '_');
      const customFileName = `[SOAL_TUGAS]_${kelas}_${mapel}_${cleanJudul}_${file.originalname}`;
      
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const driveResponse = await drive.files.create({
        requestBody: {
          name: customFileName,
          parents: DRIVE_FOLDER_ID ? [DRIVE_FOLDER_ID] : undefined,
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream,
        },
        fields: 'id, webViewLink',
      });

      fileSoalLink = driveResponse.data.webViewLink || `https://drive.google.com/file/d/${driveResponse.data.id}/view`;
    }

    // Simpan data tugas ke Google Sheets pada Tab "DaftarTugas"
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'DaftarTugas!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, kelas, mapel, judul, deskripsi || '-', fileSoalLink, deadline, pembuat || 'Guru']],
      },
    });

    return res.json({ 
      success: true, 
      message: 'Tugas berhasil dipublikasikan ke siswa!',
      fileSoalLink 
    });
  } catch (error: any) {
    console.error('Error Buat Tugas Guru:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mempublikasikan tugas baru.' });
  }
});
