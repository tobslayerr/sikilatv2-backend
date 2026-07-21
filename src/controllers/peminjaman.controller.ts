import { Request, Response, NextFunction } from 'express';
import { PeminjamanService } from '../services/peminjaman.service';
import { createPeminjamanSchema, approvePeminjamanSchema, scanReturnSchema, returnStatusSchema } from '../validations/peminjaman.validation';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response.util';

export const PeminjamanController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const user = (req as any).user;

      const { total, data } = await PeminjamanService.getAll(page, limit, user.id, user.role);
      sendPaginatedSuccess(res, 200, 'Berhasil mengambil data peminjaman', data, { total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response) {
    try {
      const parsed = createPeminjamanSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const user = (req as any).user;
      const result = await PeminjamanService.create(user.id, parsed.data);
      sendSuccess(res, 201, result.message, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async approve(req: Request, res: Response) {
    try {
      const parsed = approvePeminjamanSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const result = await PeminjamanService.approve(req.params.id as string, parsed.data.status, parsed.data.catatanPenolakan);
      sendSuccess(res, 200, `Peminjaman berhasil ${parsed.data.status}`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async scanReturn(req: Request, res: Response) {
    try {
      const parsed = scanReturnSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const result = await PeminjamanService.scanReturn(parsed.data.idBarang);
      sendSuccess(res, 200, 'Data peminjaman aktif ditemukan', result);
    } catch (error: any) { sendError(res, 404, error.message); }
  },

  async returnStatus(req: Request, res: Response) {
    try {
      const parsed = returnStatusSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const admin = (req as any).user;
      const result = await PeminjamanService.processReturn(req.params.id as string, parsed.data.kondisi, parsed.data.catatanPengembalian, admin.id);
      sendSuccess(res, 200, `Barang berhasil dikembalikan (Kondisi: ${parsed.data.kondisi})`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  }
};