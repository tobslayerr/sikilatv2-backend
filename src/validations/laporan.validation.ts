import { z } from 'zod';

export const createLaporanSchema = z.object({
  // Bisa pilih barang dari DB, atau ketik nama barang jika tidak ada di DB
  idBarang: z.string().optional(),
  namaBarangLain: z.string().optional(),
  deskripsiKerusakan: z.string().min(5, 'Deskripsi kerusakan wajib diisi secara detail'),
}).refine(data => data.idBarang || data.namaBarangLain, {
  message: "Pilih Barang dari Inventaris ATAU isi Nama Barang Lain jika tidak ada",
  path: ["idBarang"],
});

export const updateStatusLaporanSchema = z.object({
  status: z.enum(['Diproses', 'Selesai', 'Butuh_Penggantian'], { message: "Status tidak valid" }),
  catatanPenanganan: z.string().optional(),
});