import { Request, Response, NextFunction, CookieOptions } from 'express'; // <-- Tambahkan CookieOptions di sini
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, otpRequestSchema, resetPasswordSchema } from '../validations/auth.validation';
import { sendSuccess, sendError } from '../utils/response.util';
import { ENV } from '../config/env';

// Tambahkan tipe : CookieOptions agar TypeScript mengenali literal 'lax' dan 'none'
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax', 
  maxAge: 24 * 60 * 60 * 1000, // 1 Hari
};

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const result = await AuthService.register(parsed.data);
      sendSuccess(res, 201, 'Registrasi berhasil. Silakan tunggu verifikasi Admin.', result);
    } catch (error: any) {
      if (error.message.includes('sudah digunakan')) return sendError(res, 400, error.message);
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const { token, user } = await AuthService.login(parsed.data.username, parsed.data.password);
      
      // Set token ke dalam HttpOnly Cookie
      res.cookie('jwt_token', token, cookieOptions);
      sendSuccess(res, 200, 'Login berhasil', user);
    } catch (error: any) {
      sendError(res, 401, error.message);
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('jwt_token');
    sendSuccess(res, 200, 'Logout berhasil, sesi telah dihapus.');
  },

  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = otpRequestSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal');

      const otp = await AuthService.requestOtp(parsed.data.username);
      // NOTE: Di tahap produksi, OTP ini harus dikirim via WA/Email. 
      // Untuk tahap Development, kita kembalikan di response agar mudah dites.
      sendSuccess(res, 200, 'OTP berhasil dibuat (Valid 5 Menit)', { otp_kunci_sementara: otp });
    } catch (error: any) {
      sendError(res, 404, error.message);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      await AuthService.resetPassword(parsed.data.username, parsed.data.otp, parsed.data.newPassword);
      sendSuccess(res, 200, 'Password berhasil direset! Silakan login kembali.');
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  },

  async getMe(req: Request, res: Response) {
    // req.user diisi oleh auth.middleware
    sendSuccess(res, 200, 'Sesi aktif ditemukan.', (req as any).user);
  }
};