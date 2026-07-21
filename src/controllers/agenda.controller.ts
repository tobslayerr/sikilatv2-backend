import { Request, Response, NextFunction } from 'express';
import { AgendaService } from '../services/agenda.service';
import { createAgendaSchema } from '../validations/agenda.validation';
import { sendSuccess, sendError } from '../utils/response.util';

export const AgendaController = {
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AgendaService.getTemplates();
      sendSuccess(res, 200, 'Berhasil mengambil template agenda', result);
    } catch (error) { next(error); }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const result = await AgendaService.getAll(start as string, end as string);
      sendSuccess(res, 200, 'Berhasil mengambil daftar kegiatan', result);
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response) {
    try {
      const parsed = createAgendaSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const pengawas = (req as any).user;
      const result = await AgendaService.create(pengawas.id, parsed.data);
      
      sendSuccess(res, 201, 'Jadwal lab berhasil dibooking', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  }
};