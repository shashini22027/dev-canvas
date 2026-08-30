import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import {
  toggleFollow,
  getFollowStatus,
  getFollowerCount,
  getFollowingList,
} from '../controllers/follow.controller.js';

const router = express.Router();

router.post(
  '/:userId/toggle',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  csrfProtection,
  toggleFollow
);

router.get(
  '/:userId/status',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  getFollowStatus
);

router.get(
  '/:userId/count',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  getFollowerCount
);

router.get(
  '/following',
  authMiddleware,
  roleMiddleware('RECRUITER'),
  getFollowingList
);

export default router;
