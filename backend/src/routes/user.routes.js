import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { updateProfile, getUserById } from '../controllers/user.controller.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';

const router = express.Router();

router.put('/profile', authMiddleware, csrfProtection, updateProfile);
router.get('/:id', authMiddleware, getUserById);

export default router;
