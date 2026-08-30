import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import {
  toggleLike,
  getProjectLikeStatus,
  getProjectLikeCount,
  getLikedProjects,
} from '../controllers/like.controller.js';

const router = express.Router();

router.post(
  '/:projectId/toggle',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  csrfProtection,
  toggleLike
);

router.get(
  '/:projectId/status',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  getProjectLikeStatus
);

router.get(
  '/:projectId/count',
  authMiddleware,
  getProjectLikeCount
);

router.get(
  '/my-likes',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  getLikedProjects
);

export default router;
