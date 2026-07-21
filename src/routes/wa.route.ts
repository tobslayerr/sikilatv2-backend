import { Router } from 'express';
import { WaController } from '../controllers/wa.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Hanya Admin yg bisa tagih barang
router.post('/reminder', requireAuth, requireRole(['Admin', 'Super_Admin']), WaController.sendReminder);
// Hanya Teknisi & Admin yg bisa sebar broadcast
router.post('/broadcast', requireAuth, requireRole(['Teknisi', 'Admin', 'Super_Admin']), WaController.sendBroadcast);

export default router;