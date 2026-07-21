import { z } from 'zod';

export const createAgendaSchema = z.object({
  waktuMulai: z.string().min(1, 'Waktu mulai wajib diisi (Format ISO Date)'),
  waktuSelesai: z.string().min(1, 'Waktu selesai wajib diisi (Format ISO Date)'),
  posisiRuangan: z.string().min(1, 'Posisi ruangan/lab wajib diisi'),
  uraianKegiatan: z.string().min(3, 'Uraian kegiatan wajib diisi'),
  hasilKegiatan: z.string().optional(),
  ringkasan: z.string().optional(),
  objekPengguna: z.any().optional(), // Mendukung format JSON array untuk daftar hadir
});