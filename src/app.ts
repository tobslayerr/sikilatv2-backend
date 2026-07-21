import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { globalErrorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { sendSuccess, sendError } from './utils/response.util';

const app: Application = express();

// 1. SECURITY MIDDLEWARES
app.use(helmet()); // Menyembunyikan identitas server Express dari Hacker
app.use(cors({
  origin: [ENV.FRONTEND_URL, 'https://sikilat.smpn6pekalongan.org'], // Strict CORS
  credentials: true, // Mengizinkan HttpOnly Cookie JWT lewat
}));

// 2. PARSER MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Untuk membaca token JWT dari browser

// 3. RATE LIMITER (Hanya untuk endpoint API)
app.use('/api', apiLimiter);

// 4. ROUTES (TBA di Fase Selanjutnya)
// app.use('/api/v1/auth', authRoute);

// Endpoint Health Check
app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'SIKILAT V2 Backend API is running safely! 🚀🛡️');
});

// 404 Route Catcher (Jika user menembak URL ngawur)
app.use((req: Request, res: Response) => {
  sendError(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan di server ini.`);
});

// 5. GLOBAL ERROR HANDLER (Wajib berada di urutan paling bawah!)
app.use(globalErrorHandler);

export default app;