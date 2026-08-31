import * as projectService from '../services/project.service.js';

export const createProject = async (req, res, next) => {
  try {
    if (!req.files?.coverImage?.[0]) {
      return res.status(400).json({ message: 'Project cover image is required' });
    }

    const project = await projectService.createProject(req.body, req.files, req.user);
    res.status(201).json(project);
  } catch (err) {
    if (err.message.includes('required') || err.message.includes('Invalid') || err.message.includes('Team member')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes('Image upload') || err.message.includes('Cloudinary')) {
      return res.status(500).json({ message: err.message });
    }
    return next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.query.userId);
    res.json(projects);
  } catch (err) {
    return next(err);
  }
};

export const getMyProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getAuthenticatedUserProjects(req.user.id);
    res.json(projects);
  } catch (err) {
    return next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json(project);
  } catch (err) {
    if (err.message === 'Project not found') {
      return res.status(404).json({ message: 'Project not found' });
    }
    return next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.files, req.user.id);
    res.json(project);
  } catch (err) {
    if (err.message === 'Project not found') return res.status(404).json({ message: err.message });
    if (err.message === 'Unauthorized') return res.status(403).json({ message: err.message });
    if (err.message.includes('Invalid') || err.message.includes('Team member')) return res.status(400).json({ message: err.message });
    return next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    if (err.message === 'Project not found') return res.status(404).json({ message: err.message });
    if (err.message === 'Unauthorized') return res.status(403).json({ message: err.message });
    return next(err);
  }
};
