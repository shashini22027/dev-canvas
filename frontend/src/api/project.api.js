// API calls for project CRUD
import api from './axios';

export const createProject = (projectData) => api.post('/projects', projectData);
export const getProjects = (userId) => api.get(`/projects${userId ? `?userId=${userId}` : ''}`);
export const getMyProjects = () => api.get('/projects/me');
export const getProject = (id) => api.get('/projects/' + id);
export const updateProject = (id, projectData) => api.put('/projects/' + id, projectData);
export const deleteProject = (id) => api.delete('/projects/' + id);
