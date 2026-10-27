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

// Autentikasi Google API menggunakan Service Account
const KEYFILEPATH = path.join(__dirname, '../credentials.json');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
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

// 1. ENDPOINT LOGIN / REGISTRASI SISWA
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { nik, nama, kelas, jk, ortu, nohp } = req.body;
    if (!nik || !nama || !kelas) {
      return res.status(400).json({ success: false, message: 'NIK, Nama, dan Kelas wajib diisi!' });
    }

    // Cek apakah NIK sudah terdaftar di Sheet "Siswa"
    const getRows = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Siswa!A2:F',
    });

    const rows = getRows.data.values || [];
    const existingStudent = rows.find((row) => row[0] === nik);

    if (!existingStudent) {
      // Jika belum ada, tambahkan data siswa baru ke Sheet "Siswa"
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Siswa!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[nik, nama, kelas, jk || '-', ortu || '-', nohp || '-']],
        },
      });
    }

    return res.json({
      success: true,
      data: { nik, nama, kelas, jk, ortu, nohp }
    });
  } catch (error: any) {
    console.error('Error Login:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses data login ke Google Sheet.' });
  }
});

// 2. ENDPOINT ABSENSI QR CODE
app.post('/api/absen', async (req: Request, res: Response) => {
  try {
    const { nik, nama, kelas, qrCodeData } = req.body;
    const waktu = getWaktuWIB();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nik, nama, kelas, 'Hadir', qrCodeData]],
      },
    });

    return res.json({ success: true, message: 'Absensi berhasil dicatat!', waktu });
  } catch (error: any) {
    console.error('Error Absen:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan absensi.' });
  }
});

// 3. ENDPOINT PENGUMPULAN TUGAS (UPLOAD DRIVE + CATAT DI SHEET)
app.post('/api/tugas', upload.single('fileTugas'), async (req: Request, res: Response) => {
  try {
    const { nik, nama, kelas, mapel, judulTugas } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'File tugas wajib dilampirkan!' });
    }

    const waktu = getWaktuWIB();
    const cleanNama = nama.replace(/[^a-zA-Z0-9]/g, '_');
    const customFileName = `[Kelas_${kelas}]_${mapel}_${cleanNama}_${nik}_${file.originalname}`;

    // Konversi Buffer ke Stream untuk diupload ke Google Drive
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

    // Simpan log pengumpulan tugas ke Sheet "Tugas"
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tugas!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nik, nama, kelas, mapel, judulTugas, fileLink]],
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

// 4. ENDPOINT RIWAYAT LOG ABSEN & TUGAS PER SISWA
// Perbarui Endpoint Riwayat Siswa
app.get('/api/riwayat/:nik', async (req: Request, res: Response) => {
  try {
    const { nik } = req.params;

    const [absenRes, tugasRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Absensi!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tugas!A2:I' }), // Ambil sampai Kolom I
    ]);

    const absenRows = (absenRes.data.values || [])
      .filter((row) => row[1] === nik)
      .map((row) => ({
        waktu: row[0],
        nik: row[1],
        nama: row[2],
        kelas: row[3],
        status: row[4],
        keterangan: row[5],
      }))
      .reverse();

    // Mapping data tugas beserta indeks baris sheet (i + 2 karena mulai dari baris ke-2)
    const tugasRows = (tugasRes.data.values || [])
      .map((row, index) => ({
        rowIndex: index + 2,
        waktu: row[0] || '',
        nik: row[1] || '',
        nama: row[2] || '',
        kelas: row[3] || '',
        mapel: row[4] || '',
        judul: row[5] || '',
        link: row[6] || '',
        nilai: row[7] || '',
        catatan: row[8] || '',
      }))
      .filter((row) => row.nik === nik)
      .reverse();

    return res.json({ success: true, absensi: absenRows, tugas: tugasRows });
  } catch (error: any) {
    console.error('Error Riwayat:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat data.' });
  }
});

// 5. ENDPOINT REKAP ABSENSI HARIAN PER KELAS (KHUSUS GURU)
app.get('/api/guru/rekap', async (req: Request, res: Response) => {
  try {
    const { kelas, tanggal } = req.query; // format tanggal: YYYY-MM-DD
    if (!kelas || !tanggal) {
      return res.status(400).json({ success: false, message: 'Parameter kelas dan tanggal wajib diisi!' });
    }

    const [siswaRes, absenRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Siswa!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Absensi!A2:F' }),
    ]);

    const allSiswa = siswaRes.data.values || [];
    const allAbsen = absenRes.data.values || [];

    // 1. Filter daftar siswa berdasarkan kelas yang dipilih
    const siswaKelas = allSiswa
      .filter((row) => row[2] === kelas)
      .map((row) => ({
        nik: row[0] || '',
        nama: row[1] || '',
        kelas: row[2] || '',
        jk: row[3] || '-',
        ortu: row[4] || '-',
        nohp: row[5] || '-',
      }));

    // 2. Siapkan pencocokan tanggal (mendukung pencarian via kode QR maupun format tanggal lokal id-ID)
    const [year, month, day] = (tanggal as string).split('-');
    const dateStrId1 = `${parseInt(day)}/${parseInt(month)}/${year}`; // Contoh: 27/10/2026
    const dateStrId2 = `${day}/${month}/${year}`;                     // Contoh: 27/10/2026 (dengan leading zero)
    const targetQrPrefix = `ABSEN-SIBINTANG|${kelas}|${tanggal}`;

    // 3. Filter data absensi khusus kelas dan tanggal tersebut
    const absenHariIni = allAbsen.filter((row) => {
      const waktu = row[0] || '';
      const rowKelas = row[3] || '';
      const qrData = row[5] || '';

      const isMatchingQr = qrData.startsWith(targetQrPrefix);
      const isMatchingDateAndClass =
        rowKelas === kelas && (waktu.includes(dateStrId1) || waktu.includes(dateStrId2));

      return isMatchingQr || isMatchingDateAndClass;
    });

    // 4. Pisahkan siswa yang SUDAH ABSEN dan BELUM ABSEN
    const sudahAbsen: any[] = [];
    const belumAbsen: any[] = [];

    siswaKelas.forEach((siswa) => {
      const logHadir = absenHariIni.find((row) => row[1] === siswa.nik);
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

// 6. ENDPOINT DAFTAR & REKAP PENGUMPULAN TUGAS PER KELAS & MAPEL (KHUSUS GURU)
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

    // 1. Ambil seluruh siswa di kelas tersebut
    const siswaKelas = allSiswa
      .filter((row) => row[2] === kelas)
      .map((row) => ({
        nik: row[0] || '',
        nama: row[1] || '',
        kelas: row[2] || '',
        ortu: row[4] || '-',
        nohp: row[5] || '-',
      }));

    // 2. Filter daftar tugas berdasarkan Kelas dan Mata Pelajaran (jika dipilih)
    const daftarTugas = allTugas
      .filter((row) => {
        const matchKelas = row[3] === kelas;
        const matchMapel = !mapel || mapel === 'SEMUA' || row[4] === mapel;
        return matchKelas && matchMapel;
      })
      .map((row) => ({
        waktu: row[0] || '-',
        nik: row[1] || '-',
        nama: row[2] || '-',
        kelas: row[3] || '-',
        mapel: row[4] || '-',
        judul: row[5] || '-',
        link: row[6] || '#',
      }))
      .reverse();

    // 3. Cek siswa kelas tersebut yang belum mengumpulkan tugas (berdasarkan filter saat ini)
    const nikSudahKumpul = new Set(daftarTugas.map((t) => t.nik));
    const belumKumpul = siswaKelas.filter((s) => !nikSudahKumpul.has(s.nik));

    return res.json({
      success: true,
      totalSiswa: siswaKelas.length,
      totalTerkumpul: daftarTugas.length,
      jumlahSiswaSudah: nikSudahKumpul.size,
      jumlahSiswaBelum: belumKumpul.length,
      daftarTugas,
      belumKumpul,
    });
  } catch (error: any) {
    console.error('Error Guru Tugas:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data tugas siswa.' });
  }
});

// 7. ENDPOINT SIMPAN NILAI & CATATAN TUGAS OLEH GURU
app.post('/api/guru/nilai', async (req: Request, res: Response) => {
  try {
    const { rowIndex, nilai, catatan } = req.body; 
    // rowIndex adalah nomor baris di Google Sheet (misal: baris 2, 3, dst.)
    if (!rowIndex || isNaN(rowIndex)) {
      return res.status(400).json({ success: false, message: 'Nomor baris data tugas tidak valid!' });
    }

    // Update kolom H (Nilai) dan Kolom I (Catatan) pada baris tersebut
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

app.listen(PORT, () => {
  console.log(`Server SiBintang berjalan di http://localhost:${PORT}`);
});

// 8. ENDPOINT PENGAJUAN IZIN / SAKIT SISWA
app.post('/api/izin', upload.single('fileBukti'), async (req: Request, res: Response) => {
  try {
    const { nik, nama, kelas, statusIzin, keterangan, tanggalMulai } = req.body;
    const file = req.file;

    if (!nik || !nama || !kelas || !statusIzin || !tanggalMulai) {
      return res.status(400).json({ success: false, message: 'Data pengajuan izin belum lengkap!' });
    }

    const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    let fileLink = '-';

    // Jika ada lampiran surat dokter / surat izin, upload ke Google Drive
    if (file) {
      const cleanNama = nama.replace(/[^a-zA-Z0-9]/g, '_');
      const customFileName = `[IZIN_${statusIzin.toUpperCase()}]_Kelas_${kelas}_${cleanNama}_${nik}_${file.originalname}`;

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

    // Simpan ke Sheet "Izin"
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Izin!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[waktu, nik, nama, kelas, statusIzin, keterangan || '-', tanggalMulai, fileLink]],
      },
    });

    return res.json({ success: true, message: 'Pengajuan izin/sakit berhasil dikirim ke pihak sekolah!' });
  } catch (error: any) {
    console.error('Error Izin:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengirim pengajuan izin.' });
  }
});

// 9. ENDPOINT AMBIL RIWAYAT IZIN SISWA
app.get('/api/izin/:nik', async (req: Request, res: Response) => {
  try {
    const { nik } = req.params;
    const izinRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Izin!A2:H' });
    
    const rows = (izinRes.data.values || [])
      .filter((row) => row[1] === nik)
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

// 10. ENDPOINT TAMBAH PENGUMUMAN OLEH GURU
app.post('/api/guru/pengumuman', async (req: Request, res: Response) => {
  try {
    const { judul, isi, pembuat } = req.body;
    if (!judul || !isi) {
      return res.status(400).json({ success: false, message: 'Judul dan isi pengumuman wajib diisi!' });
    }

    const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

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

// 11. ENDPOINT AMBIL PENGUMUMAN UNTUK SISWA & GURU
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
      .reverse(); // Menampilkan pengumuman terbaru di atas

    return res.json({ success: true, pengumuman: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pengumuman.' });
  }
});