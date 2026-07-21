import { Router } from 'express';
import { InventarisController } from '../controllers/inventaris.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { upload, handleUploadError } from '../middlewares/upload.middleware';

const router = Router();
const adminOnly = requireRole(['Admin', 'Super_Admin']);

// Semua user (Siswa/Teknisi) boleh melihat barang
router.get('/', requireAuth, InventarisController.getAll);

// Hanya Admin yang boleh Menambah Barang & Cetak QR
// Menggunakan upload.single('foto') untuk menerima form-data gambar
router.post('/', requireAuth, adminOnly, upload.single('foto'), handleUploadError, InventarisController.create);
router.get('/:id/qr', requireAuth, adminOnly, InventarisController.getQrCode);
router.put('/:id', requireAuth, adminOnly, upload.single('foto'), handleUploadError, InventarisController.update);

export default router;