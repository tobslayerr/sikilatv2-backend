import { Request, Response, NextFunction } from 'express';
import { WaService } from '../services/wa.service';
import { reminderWaSchema, broadcastWaSchema } from '../validations/wa.validation';
import { sendSuccess, sendError } from '../utils/response.util';

export const WaController = {
  async sendReminder(req: Request, res: Response) {
    try {
      const parsed = reminderWaSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const result = await WaService.sendReminder(parsed.data.idPeminjaman);
      sendSuccess(res, 200, `Reminder WA berhasil dikirim ke ${result.target}`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  },

  async sendBroadcast(req: Request, res: Response) {
    try {
      const parsed = broadcastWaSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, 'Validasi Gagal', parsed.error.format());

      const teknisi = (req as any).user;
      const result = await WaService.sendBroadcast(teknisi.id, parsed.data.pesan, parsed.data.roleTarget);
      sendSuccess(res, 200, `Broadcast WA berhasil dikirim ke ${result.jumlahTerkirim} pengguna`, result);
    } catch (error: any) { sendError(res, 400, error.message); }
  }
};