import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { editProfileSchema, approveProfileSchema } from '../validations/user.validation';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response.util';

export const UserController = {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';

      const { total, data } = await UserService.getAllUsers(page, limit, search);
      
      sendPaginatedSuccess(res, 200, 'Berhasil mengambil daftar pengguna', data, {
        total, page, limit, totalPages: Math.ceil(total / limit)
      });
    } catch (error) { next(error); }
  },

  async requestEditProfile(req: Request, res: Response) {
    try {
      const parsed = editProfileSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const user = (req as any).user;
      const result = await UserService.requestEditProfile(user.id, parsed.data.dataBaru, parsed.data.alasan);
      
      sendSuccess(res, 201, 'Request perubahan profil berhasil dikirim. Menunggu persetujuan Admin.', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async getApprovalRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      // Perbaikan TS: Memastikan ini hanya dibaca sebagai string atau undefined
      const status = req.query.status as string | undefined;

      const { total, data } = await UserService.getApprovalRequests(page, limit, status);
      
      sendPaginatedSuccess(res, 200, 'Berhasil mengambil antrean persetujuan profil', data, {
        total, page, limit, totalPages: Math.ceil(total / limit)
      });
    } catch (error) { next(error); }
  },

  async processApproval(req: Request, res: Response) {
    try {
      // Perbaikan TS: Memaksa Express membaca params.id sebagai string tunggal mutlak
      const requestId = req.params.id as string;
      const admin = (req as any).user;
      
      const parsed = approveProfileSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const result = await UserService.processApproval(requestId, admin.id, parsed.data.status, parsed.data.alasanPenolakan);
      sendSuccess(res, 200, `Request profil berhasil diproses menjadi ${parsed.data.status}`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async toggleBlockUser(req: Request, res: Response) {
    try {
      // Perbaikan TS: Memaksa Express membaca params.id sebagai string tunggal mutlak
      const userId = req.params.id as string;
      const result = await UserService.toggleBlockUser(userId);
      const statusTxt = result.isActive ? 'Diaktifkan kembali' : 'Diblokir';
      
      sendSuccess(res, 200, `Akun ${result.username} berhasil ${statusTxt}.`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  }
};