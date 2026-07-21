import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.util';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per IP dalam 15 menit
  handler: (req, res) => {
    sendError(res, 429, 'Terlalu banyak request dari IP ini. Sistem menahan akses Anda, coba lagi dalam 15 menit (Anti-Spam SIKILAT).');
  },
  standardHeaders: true,
  legacyHeaders: false,
});