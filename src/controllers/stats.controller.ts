import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/stats.service';
import { sendSuccess, sendError } from '../utils/response.util';

export const StatsController = {
  async getQuick(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StatsService.getQuickStats();
      sendSuccess(res, 200, 'Data Quick Stats Dasbor', result);
    } catch (error) { next(error); }
  },

  async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StatsService.getCharts();
      sendSuccess(res, 200, 'Data Grafik Dasbor', result);
    } catch (error) { next(error); }
  },

  async getExportBa(req: Request, res: Response) {
    try {
      const { laporanId } = req.query;
      if (!laporanId) return sendError(res, 400, 'Parameter laporanId wajib disertakan');

      const result = await StatsService.getExportBaLaporan(laporanId as string);
      sendSuccess(res, 200, 'Data Berita Acara siap di-export', result);
    } catch (error: any) { sendError(res, 400, error.message); }
  }
};