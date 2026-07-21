import { z } from 'zod';

export const reminderWaSchema = z.object({
  idPeminjaman: z.string().min(1, 'ID Peminjaman wajib diisi'),
});

export const broadcastWaSchema = z.object({
  pesan: z.string().min(5, 'Pesan broadcast minimal 5 karakter'),
  roleTarget: z.enum(['Pengawas_IT', 'Pengawas_Sarpras', 'Admin', 'Semua_Pengawas'], { 
    message: "Target tidak valid" 
  }),
});