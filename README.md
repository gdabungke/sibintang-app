<div align="center">

# 🌟 SiBintang (Sistem Informasi Bintang Timur)
### Platform Manajemen Sekolah & Absensi Berbasis PWA (Progressive Web App)
**SD RK Bintang Timur Rantauprapat**

[![Node.js](https://img.shields.io/badge/Node.js-v18%20%2F%20v20-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-UI-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Sheets API](https://img.shields.io/badge/Database-Google%20Sheets-107c41?style=for-the-badge&logo=googlesheets)](https://developers.google.com/sheets/api)
[![Vercel Deployment](https://img.shields.io/badge/Hosted%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

</div>

---

## 📌 Tentang Aplikasi
**SiBintang** adalah aplikasi manajemen sekolah terpadu yang dirancang khusus untuk **SD RK Bintang Timur Rantauprapat**. Aplikasi ini memfasilitasi pencatatan kehadiran (*attendance*) harian siswa menggunakan pemindai QR Code, pengumpulan tugas/PR sekolah, papan pengumuman real-time, serta portal khusus bagi guru dan pengelola sekolah.

Dibangun dengan arsitektur modern berbasis **Node.js, TypeScript, Express, dan Google Sheets API**, aplikasi ini ringan, cepat, serta mendukung fitur **PWA (Progressive Web App)** agar dapat dipasang langsung (*install*) di perangkat seluler maupun desktop.

---

## ✨ Fitur Utama

### 👨‍🏫 1. Portal Guru & Pengelola (`guru.html`)
* **Autentikasi Aman & Role-Based**: Mendukung peran sebagai *Wali Kelas*, *Guru Mata Pelajaran*, *Admin Sistem*, dan *Kepala Sekolah*.
* **Generator QR Code Absensi**: Pembuatan QR Code kehadiran kelas secara dinamis berdasarkan tanggal dan sesi.
* **Rekapitulasi Kehadiran & Tugas**: Memantau daftar siswa yang sudah atau belum absen secara *real-time*.
* **Aksi Cepat WhatsApp**: Tombol interaktif untuk mengirim pesan pengingat otomatis ke WhatsApp orang tua murid.
* **Sistem Penilaian (Grading)**: Memberikan nilai angka (0-100) beserta catatan evaluasi pada tugas siswa yang terkumpul.
* **Ekspor Data (CSV/Excel)**: Mengunduh rekap absensi dan nilai tugas langsung ke format spreadsheet.
* **Papan Pengumuman**: Menerbitkan pengumuman sekolah secara instan menggunakan templat otomatis.

### 👦 2. Portal Siswa & Orang Tua (`index.html`)
* **Absensi Mandiri via QR Scan**: Memindai kode QR harian dari guru kelas.
* **Pengumpulan Tugas / PR**: Mengunggah file tugas sekolah secara praktis.
* **Pusat Informasi & Pengumuman**: Menyimak informasi penting dan jadwal kegiatan sekolah langsung dari beranda.

---

## 🛠️ Teknologi yang Digunakan
* **Backend**: Node.js, Express.js, TypeScript
* **Database & Storage**: Google Sheets API (v4)
* **Frontend UI**: Tailwind CSS, HTML5, Vanilla JavaScript
* **PWA Features**: Service Workers, Web App Manifest
* **Deployment**: Vercel Serverless Functions

---

## 🚀 Panduan Instalasi & Pengembangan Lokal

Jika Anda ingin menjalankan atau mengembangkan proyek ini secara lokal di komputer Anda, ikuti langkah-langkah berikut:

1. **Clone Repository ini:**
   ```bash
   git clone [https://github.com/username-anda/sibintang-app.git](https://github.com/username-anda/sibintang-app.git)
   cd sibintang-app
