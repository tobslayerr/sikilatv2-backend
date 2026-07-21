import { Request, Response, NextFunction } from 'express';
import { LaporanService } from '../services/laporan.service';
import { createLaporanSchema, updateStatusLaporanSchema } from '../validations/laporan.validation';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response.util';

export const LaporanController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const user = (req as any).user;

      const { total, data } = await LaporanService.getAll(page, limit, user.id, user.role, status);
      sendPaginatedSuccess(res, 200, 'Berhasil mengambil data laporan kerusakan', data, { total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response) {
    try {
      const parsed = createLaporanSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const user = (req as any).user;
      const result = await LaporanService.create(user.id, parsed.data, req.file);
      sendSuccess(res, 201, 'Laporan kerusakan berhasil dikirim', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async ambilTugas(req: Request, res: Response) {
    try {
      const teknisi = (req as any).user;
      const result = await LaporanService.ambilTugas(req.params.id as string, teknisi.id);
      sendSuccess(res, 200, 'Tugas perbaikan berhasil diambil', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const parsed = updateStatusLaporanSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const teknisi = (req as any).user;
      const result = await LaporanService.updateStatus(req.params.id as string, teknisi.id, parsed.data.status, parsed.data.catatanPenanganan);
      sendSuccess(res, 200, `Status laporan diperbarui menjadi ${parsed.data.status}`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async teknisiInsert(req: Request, res: Response) {
    try {
      const parsed = createLaporanSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const teknisi = (req as any).user;
      const result = await LaporanService.teknisiInsert(teknisi.id, parsed.data, req.file);
      sendSuccess(res, 201, 'Laporan lapangan teknisi berhasil dibuat dan diproses', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  }
};