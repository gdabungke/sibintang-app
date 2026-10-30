<div align="center">

<img src="https://raw.githubusercontent.com/gdabungke/sibintang-app/main/public/icon.png" alt="Logo SiBintang" width="96" height="96" style="border-radius: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); margin-bottom: 12px;" />

# SiBintang (Sistem Informasi Bintang Timur)
### Platform Manajemen Sekolah Terpadu Berbasis PWA (Progressive Web App)
**SD Swasta RK Bintang Timur Rantauprapat**

[![Node.js](https://img.shields.io/badge/Node.js-v18%20%2F%20v20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Sheets API](https://img.shields.io/badge/Database-Google%20Sheets%20API%20v4-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://developers.google.com/sheets/api)
[![Google Drive API](https://img.shields.io/badge/Storage-Google%20Drive%20v3-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://developers.google.com/drive)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## Ringkasan Eksekutif

**SiBintang** adalah sistem informasi dan manajemen operasional sekolah terintegrasi yang dikembangkan khusus untuk **SD Swasta RK Bintang Timur Rantauprapat**. Sistem ini dirancang untuk menyederhanakan presensi kehadiran harian siswa berbasis pemindaian QR Code, distribusi materi dan tugas sekolah, pengumpulan dokumen tugas secara digital ke Google Drive, monitoring perizinan, hingga penerbitan maklumat resmi sekolah.

Mengusung standar **Progressive Web App (PWA)**, aplikasi ini dapat diakses secara lintas platform (Desktop, Android, dan iOS) tanpa memerlukan instalasi aplikasi pihak ketiga, didukung oleh arsitektur backend nirserver (*serverless*) berbasis **Node.js, Express, TypeScript**, dan **Google Workspace API**.

---

## Arsitektur Fitur

### 1. Portal Guru & Pengelola (`public/guru.html`)
- **Autentikasi Berbasis Peran (RBAC)**: Pemisahan hak akses bagi *Wali Kelas*, *Guru Mata Pelajaran*, *Admin Sistem*, dan *Kepala Sekolah*.
- **Generator Token Mandiri**: Pembuatan token registrasi siswa (per kelas) dan staf secara dinamis langsung dari portal admin tanpa perlu mengubah variabel lingkungan produksi (*environment variables*).
- **Distribusi Tugas & Materi Pembelajaran**: Formulir penerbitan tugas baru dengan dukungan instruksi teks dan unggahan lampiran soal otomatis ke Google Drive sekolah.
- **Generator Kode QR Presensi**: Pembuatan kode QR presensi kelas harian yang dapat diproyeksikan di kelas atau dicetak langsung.
- **Monitoring Presensi Real-Time**: Rekapitulasi otomatis kehadiran harian yang membedakan siswa yang hadir dan belum hadir secara akurat.
- **Notifikasi Terintegrasi WhatsApp**: Akses pintas tautan komunikasi langsung ke kontak orang tua/wali murid untuk pemberitahuan ketidakhadiran atau keterlambatan pengumpulan tugas.
- **Evaluasi & Penilaian Digital**: Fasilitas peninjauan berkas tugas siswa, pemberian nilai angka (skala 0-100), dan umpan balik catatan evaluasi.
- **Papan Pengumuman Ber-Target**: Penerbitan maklumat dengan cakupan bertingkat (*Global Sekolah* atau *Khusus Kelas*) dilengkapi tanggal kedaluwarsa otomatis (*auto-expiry*).
- **Ekspor Laporan (CSV)**: Pengunduhan rekapitulasi presensi dan rekap nilai dalam format spreadsheet kompatibel Microsoft Excel.

### 2. Portal Siswa & Orang Tua (`public/index.html`)
- **Registrasi Aman via Token**: Pendaftaran akun siswa yang divalidasi langsung berdasarkan kode token resmi kelas.
- **Pemindai Presensi Kamera**: Pemindaian kode QR harian menggunakan modul kamera perangkat tanpa latensi tinggi.
- **Katalog Tugas Aktif**: Akses terhadap daftar tugas yang diterbitkan guru beserta tautan dokumen materi/soal.
- **Pengumpulan Tugas Digital**: Pengunggahan dokumen tugas (gambar/PDF/Word) yang tersimpan langsung ke direktori Google Drive sekolah.
- **Pengajuan Izin & Sakit Online**: Formulir pengajuan ketidakhadiran resmi yang dilengkapi fasilitas unggah surat dokter atau surat izin dari orang tua.
- **Papan Maklumat Resmi**: Penayangan pengumuman terstruktur dengan pemisahan visual antara maklumat resmi sekolah dan instruksi internal kelas.

---

## Struktur Direktori Proyek

```text
sibintang-app/
├── api/                           # Endpoint serverless untuk deployment Vercel
│   └── index.ts                   # Entry point serverless Express
├── public/                        # Aset frontend dan antarmuka web
│   ├── css/
│   │   └── style.css              # Kustomisasi stylesheet dan animasi toast
│   ├── js/
│   │   ├── guru.js                # Logika operasional portal guru & pengelola
│   │   └── siswa.js               # Logika operasional portal siswa & orang tua
│   ├── guru.html                  # Halaman portal guru & admin
│   ├── icon.svg                   # Logo vektor resmi SiBintang
│   ├── index.html                 # Halaman beranda portal siswa
│   ├── manifest.json              # Konfigurasi manifest Web App (PWA)
│   └── sw.js                      # Service Worker untuk kapabilitas PWA & caching
├── src/                           # Sumber kode backend Node.js / Express
│   └── server.ts                  # Server Express utama, routing, dan integrasi Google API
├── .env.example                   # Contoh konfigurasi variabel lingkungan
├── .gitignore                     # Berkas pengabaian versi Git
├── package.json                   # Dependensi proyek dan skrip npm
├── README.md                      # Dokumentasi teknis proyek
├── tsconfig.json                  # Konfigurasi kompilasi TypeScript
└── vercel.json                    # Konfigurasi perutean & build deployment Vercel
