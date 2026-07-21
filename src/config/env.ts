import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10, "JWT Secret minimal 10 karakter!"),
  JWT_EXPIRES_IN: z.string().default('1d'),
  // CLOUDINARY (Opsional agar tidak crash jika belum diisi)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('❌ ERROR: Variabel Environment (.env) tidak valid!\n', _env.error.format());
  process.exit(1);
}
export const ENV = _env.data;