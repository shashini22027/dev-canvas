// Admin routes
import express from 'express';
import { getAllUsers, getAllProjects, deleteProject, toggleUserStatus, updateProjectStatus } from '../controllers/admin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = express.Router();

// Users route - only ADMIN can access
router.get('/users', authMiddleware, roleMiddleware('ADMIN'), getAllUsers);
router.put('/users/:id/toggle-status', authMiddleware, roleMiddleware('ADMIN'), toggleUserStatus);

// Projects route - only ADMIN can access
router.get('/projects', authMiddleware, roleMiddleware('ADMIN'), getAllProjects);
router.patch('/projects/:id/status', authMiddleware, roleMiddleware('ADMIN'), updateProjectStatus);

// Delete project route - only ADMIN can access
router.delete('/projects/:id', authMiddleware, roleMiddleware('ADMIN'), deleteProject);

export default router;
