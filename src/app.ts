import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { globalErrorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { sendSuccess, sendError } from './utils/response.util';
import { auditLogMiddleware } from './middlewares/audit.middleware';

// -----------------------------------------------------------
// IMPOR FITUR FINAL
// -----------------------------------------------------------
import apiRoutes from './routes/index';
import { setupSwagger } from './config/swagger';

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

// Rate limiter khusus endpoint API
app.use('/api', apiLimiter);

// ==========================================
// 2. MAIN ROUTES & FITUR
// ==========================================

// Endpoint Health Check Root
app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'SIKILAT V2 Backend API is running safely! 🚀🛡️');
});

// Setup Dokumentasi Swagger (Diakses tanpa /api/v1)
setupSwagger(app);

// Pasang CCTV Audit Log Global (Harus sebelum apiRoutes)
app.use(auditLogMiddleware);

// PEMUSATAN SELURUH ROUTER SIKILAT (Modul 1-8)
app.use('/api/v1', apiRoutes);

// ==========================================
// 3. FALLBACK MIDDLEWARES (WAJIB DI BAWAH)
// ==========================================
app.use((req: Request, res: Response) => {
  sendError(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan di server ini.`);
});

app.use(globalErrorHandler);

export default app;