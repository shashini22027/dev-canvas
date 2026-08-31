import * as adminService from '../services/admin.service.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await adminService.fetchAllUsers();
        return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};

export const getAllProjects = async (req, res, next) => {
    try {
        const projects = await adminService.fetchAllProjects();
        return res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        next(err);
    }
};

export const deleteProject = async (req, res, next) => {
    try {
        await adminService.removeProject(req.params.id);
        return res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        if (err.message === 'Invalid project id') {
            return res.status(400).json({ success: false, message: 'Invalid project id' });
        }
        if (err.message === 'Project not found') {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        next(err);
    }
};

export const updateProjectStatus = async (req, res, next) => {
    try {
        const project = await adminService.updateProjectStatus(req.params.id, req.body.status);
        return res.status(200).json({ success: true, message: 'Project status updated successfully', data: project });
    } catch (err) {
        if (err.message === 'Invalid project id') {
            return res.status(400).json({ success: false, message: 'Invalid project id' });
        }
        if (err.message === 'Project not found') {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        if (err.message === 'Invalid project status') {
            return res.status(400).json({ success: false, message: 'Invalid project status' });
        }
        next(err);
    }
};

export const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await adminService.toggleUserStatus(req.params.id, req.user.id);
        return res.status(200).json({ success: true, message: `User ${user.isDisabled ? 'disabled' : 'enabled'} successfully`, data: user });
    } catch (err) {
        if (err.message === 'Invalid user id' || err.message === 'Invalid authenticated user id') {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (err.message === 'User not found') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (err.message === 'Cannot disable your own account') {
            return res.status(400).json({ success: false, message: 'Cannot disable your own account' });
        }
        next(err);
    }
};
