import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
const stafOnly = requireRole(['Admin', 'Super_Admin', 'Pengawas_IT', 'Pengawas_Sarpras', 'Pengawas_Admin']);

// Semua user login boleh lihat dasbor quick (atau batasi sesuai kebutuhan)
router.get('/quick', requireAuth, StatsController.getQuick);
router.get('/charts', requireAuth, stafOnly, StatsController.getCharts);
router.get('/export-ba', requireAuth, stafOnly, StatsController.getExportBa);

export default router;