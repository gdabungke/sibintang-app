/**
 * ============================================================================
 * SIBINTANG - BACKEND TYPESCRIPT INTERFACES & TYPES (src/types/index.ts)
 * SD Swasta RK Bintang Timur Rantauprapat (v3.2.0)
 * ============================================================================
 * Menyimpan seluruh kontrak tipe data (interfaces) untuk entitas Siswa, Guru,
 * Absensi, Materi Pelajaran, Tugas, Izin, Pengumuman, Token, Hak Akses Role
 * (RBAC), serta Pengaturan Sistem Sekolah.
 */

// ============================================================================
// 1. ENTITAS PENGGUNA, PERAN (ROLE) & HAK AKSES DINAMIS
// ============================================================================
export interface AkunKhusus {
  nip: string;
  nama: string;
  role: string;
  kelasBinaan: string;
  mapelAjar: string;
  merangkapGuruKelas?: boolean;
}

export interface DataSiswa {
  rowIndex?: number;
  nis: string;
  nama: string;
  kelas: string;
  jk: string;
  ortu: string;
  nohp: string;
}

export interface DataGuru {
  rowIndex?: number;
  nip: string;
  nama: string;
  role: string;
  kelasBinaan: string;
  mapelAjar: string;
  merangkapGuruKelas?: boolean;
}

export interface RolePermissionItem {
  canGenerateQR: boolean;
  canVerifikasiIzin: boolean;
  canBuatMateri: boolean;
  canBuatTugas: boolean;
  canNilaiTugas: boolean;
  canBuatPengumuman: boolean;
  canPengumumanGlobal: boolean;
  canGenerateToken: boolean;
  canAksesSemuaKelas: boolean;
  canKelolaSetting: boolean;
}

// ============================================================================
// 2. ENTITAS OPERASIONAL AKADEMIK, MATERI PELAJARAN & PRESENSI
// ============================================================================
export interface LogAbsensi {
  waktu: string;
  nis: string;
  nama: string;
  kelas: string;
  status: string;
  keterangan: string;
}

export interface SiswaHadir extends DataSiswa {
  waktuAbsen: string;
  status: string;
  keteranganQr: string;
}

export interface ItemMateriAjar {
  id: number;
  rowIndex?: number;
  waktu: string;
  kelas: string;
  mapel: string;
  bab: string;
  judul: string;
  ringkasan: string;
  linkFile: string;
  linkExternal: string;
  pembuat: string;
}

export interface LogBacaMateri {
  waktu: string;
  nis: string;
  nama: string;
  kelas: string;
  mapel: string;
  judulMateri: string;
}

export interface SoalTugas {
  id: number;
  waktu: string;
  kelas: string;
  mapel: string;
  materi: string;
  judul: string;
  deskripsi: string;
  link: string;
  linkSoal: string;
  deadline: string;
  linkMateri: string;
  linkExternal: string;
  pembuat: string;
}

export interface TugasTerkumpul {
  rowIndex: number;
  waktu: string;
  nis: string;
  nama: string;
  kelas: string;
  mapel: string;
  materi: string;
  judul: string;
  judulLengkap: string;
  link: string;
  nilai: string | number;
  catatan: string;
}

export interface PermohonanIzin {
  rowIndex?: number;
  waktu?: string;
  waktuPengajuan?: string;
  nis: string;
  nama: string;
  kelas: string;
  status: string;
  keterangan: string;
  tanggal?: string;
  tanggalMulai?: string;
  link: string;
  verifikasi?: string;
  statusVerifikasi?: string;
  verifikator: string;
}

export interface ItemPengumuman {
  waktu: string;
  target: string;
  kategori: string;
  tglBerakhir: string;
  judul: string;
  isi: string;
  pembuat: string;
  isGlobal: boolean;
}
