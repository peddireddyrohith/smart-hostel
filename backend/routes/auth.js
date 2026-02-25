import express from 'express';
import { register, login, getMe, refreshToken, logout, getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerRules, loginRules, validate } from '../middleware/validate.js';

const router = express.Router();

// Public routes
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules, validate, login);
router.post('/refresh',  refreshToken);

// Protected routes (require valid JWT)
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);

export default router;
