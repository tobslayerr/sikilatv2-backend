import authRoute from './routes/auth.route';
import userRoute from './routes/user.route';
import inventarisRoute from './routes/inventaris.route';
import peminjamanRoute from './routes/peminjaman.route';
import laporanRoute from './routes/laporan.route';
import agendaRoute from './routes/agenda.route';
import { auditLogMiddleware } from './middlewares/audit.middleware';

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { globalErrorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { sendSuccess, sendError } from './utils/response.util';

// --- IMPORT FASE 2 ---
import prisma from './config/database';
import { generateToken, verifyToken } from './utils/jwt.util';
import { formatDateWIB } from './utils/format.util';

const app: Application = express();

// ==========================================
// 1. SECURITY & PARSER MIDDLEWARES
// ==========================================
app.use(helmet());
app.use(cors({
  origin: [ENV.FRONTEND_URL, 'https://sikilat.smpn6pekalongan.org'], 
  credentials: true, 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Limit hanya berlaku untuk prefix /api
app.use('/api', apiLimiter);

// 2. MAIN ROUTES
app.use(auditLogMiddleware);

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/inventaris', inventarisRoute);
app.use('/api/v1/peminjaman', peminjamanRoute);
app.use('/api/v1/laporan', laporanRoute);
app.use('/api/v1/agenda', agendaRoute);

// ==========================================
// 2. MAIN ROUTES (WAJIB DI ATAS PENANGKAP 404)
// ==========================================

// Endpoint Health Check Root
app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'SIKILAT V2 Backend API is running safely! 🚀🛡️');
});

// Endpoint Test Fase 2
app.get('/api/test-fase2', async (req: Request, res: Response, next: any) => {
  try {
    const countUser = await prisma.user.count();
    const dummyPayload = { id: '123', role: 'Super_Admin' };
    const token = generateToken(dummyPayload);
    const decoded = verifyToken(token);

    sendSuccess(res, 200, 'FASE 2 BERHASIL! Alat Tukang Berfungsi Normal 🛠️', {
      database_status: 'Koneksi Sukses!',
      jumlah_user_terdaftar: countUser,
      waktu_server: formatDateWIB(new Date()),
      token_test: {
        raw: token,
        decoded: decoded
      }
    });
  } catch (error) {
    next(error); 
  }
});

// ==========================================
// 3. FALLBACK MIDDLEWARES (WAJIB DI BAWAH)
// ==========================================

// Penangkap 404 (Route tidak ditemukan)
app.use((req: Request, res: Response) => {
  sendError(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan di server ini.`);
});

// Pemusat Global Error Handler
app.use(globalErrorHandler);

export default app;