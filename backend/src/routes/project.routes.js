// CRUD routes for projects
import express from 'express';
import multer from 'multer';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/security.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  },
});

const projectUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'extraImages', maxCount: 10 },
]);

const router = express.Router();

router.post('/', authMiddleware, csrfProtection, auditLog('project.create'), projectUpload, createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', authMiddleware, csrfProtection, auditLog('project.update'), projectUpload, updateProject);
router.delete('/:id', authMiddleware, csrfProtection, auditLog('project.delete'), deleteProject);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('images are allowed')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

export default router;

