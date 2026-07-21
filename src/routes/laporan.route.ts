import { Router } from 'express';
import { LaporanController } from '../controllers/laporan.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { upload, handleUploadError } from '../middlewares/upload.middleware';

const router = Router();
const teknisiOnly = requireRole(['Teknisi', 'Admin', 'Super_Admin']);

// AKSES UMUM (Pelapor)
router.get('/', requireAuth, LaporanController.getAll);
router.post('/', requireAuth, upload.single('fotoBukti'), handleUploadError, LaporanController.create);

// AKSES KHUSUS TEKNISI & ADMIN
router.put('/:id/ambil-tugas', requireAuth, teknisiOnly, LaporanController.ambilTugas);
router.put('/:id/update-status', requireAuth, teknisiOnly, LaporanController.updateStatus);
router.post('/teknisi-insert', requireAuth, teknisiOnly, upload.single('fotoBukti'), handleUploadError, LaporanController.teknisiInsert);

export default router;