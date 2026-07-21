import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Ambil token dari cookie, atau fallback ke Authorization Header (Bearer Token)
  const token = req.cookies?.jwt_token || req.headers.authorization?.split(' ')[1];

  if (!token) return sendError(res, 401, 'Akses Ditolak: Sesi tidak ditemukan. Silakan login.');

  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie('jwt_token'); // Hapus cookie busuk
    return sendError(res, 401, 'Sesi kadaluarsa atau tidak valid. Silakan login ulang.');
  }

  (req as any).user = decoded; // Menyisipkan data user ke dalam request
  next();
};