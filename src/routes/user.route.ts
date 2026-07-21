import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// ==========================================
// AKSES UMUM (Semua Role yang sudah login)
// ==========================================
router.post('/edit-profil', requireAuth, UserController.requestEditProfile);

// ==========================================
// AKSES KHUSUS ADMIN & SUPER ADMIN
// ==========================================
const adminOnly = requireRole(['Admin', 'Super_Admin']);

router.get('/', requireAuth, adminOnly, UserController.getAllUsers);
router.get('/approval-requests', requireAuth, adminOnly, UserController.getApprovalRequests);
router.post('/approve/:id', requireAuth, adminOnly, UserController.processApproval);
router.put('/:id/block', requireAuth, adminOnly, UserController.toggleBlockUser);

export default router;