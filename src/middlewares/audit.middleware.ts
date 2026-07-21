import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Hanya catat request yang memanipulasi data
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    
    // Tunggu sampai request selesai merespon user
    res.on('finish', async () => {
      const user = (req as any).user; // Diisi oleh auth.middleware nanti
      
      // Catat hanya jika request berhasil (status 2xx) dan user sudah login
      if (user && res.statusCode >= 200 && res.statusCode < 400) {
        try {
          // Mengambil nama modul dari URL (Contoh: /api/v1/inventaris -> inventaris)
          const tabelTerkait = req.originalUrl.split('/')[3] || 'sistem_umum';
          
          await prisma.auditLog.create({
            data: {
              idUser: user.id,
              aksi: req.method, // POST (Tambah), PUT (Update), DELETE (Hapus)
              tabelTerkait: tabelTerkait,
              dataSesudah: req.body && Object.keys(req.body).length > 0 ? req.body : null,
              waktu: new Date()
            }
          });
        } catch (error) {
          // Gagal log tidak boleh mematikan server
          console.error('⚠️ Gagal menyimpan Audit Log:', error);
        }
      }
    });
  }
  
  next(); // Lanjutkan ke rute utama
};