import { z } from 'zod';

export const registerSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  username: z.string().min(4, 'Username minimal 4 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nomorInduk: z.string().optional(), // NIP / NISN
  noWa: z.string().min(10, 'Nomor WA tidak valid'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const otpRequestSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
});

export const resetPasswordSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  otp: z.string().length(6, 'OTP harus 6 digit angka'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});