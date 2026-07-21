import { Request, Response, NextFunction } from 'express';
import { InventarisService } from '../services/inventaris.service';
import { inventarisSchema } from '../validations/inventaris.validation';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response.util';

export const InventarisController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';

      const { total, data } = await InventarisService.getAll(page, limit, search);
      sendPaginatedSuccess(res, 200, 'Berhasil mengambil data inventaris', data, { total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response) {
    try {
      const parsed = inventarisSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const result = await InventarisService.create(parsed.data, req.file);
      sendSuccess(res, 201, 'Barang berhasil ditambahkan', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async getQrCode(req: Request, res: Response) {
    try {
      const result = await InventarisService.getQrCode(req.params.id as string);
      sendSuccess(res, 200, 'QR Code berhasil di-generate', result);
    } catch (error: any) { sendError(res, 404, error.message); }
  }
};