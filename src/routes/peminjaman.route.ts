import { Router } from 'express';
import { PeminjamanController } from '../controllers/peminjaman.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
const adminOnly = requireRole(['Admin', 'Super_Admin']);

// AKSES UMUM (Pelapor/Siswa bisa ajukan pinjam dan lihat riwayatnya)
router.post('/', requireAuth, PeminjamanController.create);
router.get('/', requireAuth, PeminjamanController.getAll);

// AKSES ADMIN SAJA
router.put('/:id/approve', requireAuth, adminOnly, PeminjamanController.approve);
router.post('/scan-return', requireAuth, adminOnly, PeminjamanController.scanReturn);
router.put('/:id/return-status', requireAuth, adminOnly, PeminjamanController.returnStatus);

export default router;