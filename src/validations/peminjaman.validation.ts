import { z } from 'zod';

export const createPeminjamanSchema = z.object({
  idBarang: z.string().min(1, 'Barang wajib dipilih'),
  // Memaksa input tanggal menjadi format ISO (YYYY-MM-DDTHH:mm:ss.SSSZ)
  tanggalWajibKembali: z.string().min(1, 'Tanggal pengembalian wajib diisi'),
  keperluan: z.string().min(5, 'Keperluan wajib dijelaskan detail'),
});

export const approvePeminjamanSchema = z.object({
  status: z.enum(['Disetujui', 'Ditolak'], { message: "Status harus 'Disetujui' atau 'Ditolak'" }),
  catatanPenolakan: z.string().optional(),
});

export const scanReturnSchema = z.object({
  idBarang: z.string().min(1, 'Data QR Code (ID Barang) tidak terbaca'),
});

export const returnStatusSchema = z.object({
  kondisi: z.enum(['Normal', 'Rusak'], { message: "Kondisi akhir harus 'Normal' atau 'Rusak'" }),
  catatanPengembalian: z.string().optional(),
});