// API calls for admin (users, projects)
import api from './axios.js';

export const getAllUsers = () => api.get('/admin/users');

export const getAllProjects = () => api.get('/admin/projects');

export const deleteProject = (id) => api.delete(`/admin/projects/${id}`);

export const updateProjectStatus = (id, status) => api.patch(`/admin/projects/${id}/status`, { status });

export const toggleUserStatus = (id) => api.put(`/admin/users/${id}/toggle-status`);

