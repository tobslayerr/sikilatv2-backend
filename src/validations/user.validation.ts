import { z } from 'zod';

export const editProfileSchema = z.object({
  dataBaru: z.object({
    namaLengkap: z.string().optional(),
    noWa: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  }),
  alasan: z.string().min(5, 'Alasan wajib diisi (minimal 5 karakter untuk menjelaskan kenapa ingin diubah)'),
});

export const approveProfileSchema = z.object({
  // ZOD BARU: Cukup gunakan 'message' alih-alih 'errorMap'
  status: z.enum(['APPROVED', 'REJECTED'], { message: "Status harus 'APPROVED' atau 'REJECTED'" }),
  alasanPenolakan: z.string().optional(), // Opsional jika ditolak
});