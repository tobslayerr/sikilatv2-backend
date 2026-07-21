import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/request-otp', AuthController.requestOtp);
router.post('/reset-password', AuthController.resetPassword);

// Dilindungi oleh requireAuth
router.get('/me', requireAuth, AuthController.getMe);

export default router;