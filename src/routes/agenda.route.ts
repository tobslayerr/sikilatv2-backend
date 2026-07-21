import { Router } from 'express';
import { AgendaController } from '../controllers/agenda.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();
const stafOnly = requireRole(['Admin', 'Super_Admin', 'Pengawas_IT', 'Pengawas_Sarpras', 'Pengawas_Admin']);

// Semua user (termasuk siswa) bisa melihat jadwal kalender agar tidak bentrok
router.get('/', requireAuth, AgendaController.getAll);

// Hanya Staf/Admin yang bisa menarik opsi Template dan Membooking Lab
router.get('/templates', requireAuth, stafOnly, AgendaController.getTemplates);
router.post('/', requireAuth, stafOnly, AgendaController.create);

export default router;