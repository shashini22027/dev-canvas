import User from '../models/User.js';
import Project from '../models/Project.js';

export const fetchAllUsers = async () => {
    return await User.find({});
};

export const fetchAllProjects = async () => {
    return await Project.find({}).populate('studentId', 'name email profilePic');
};

export const removeProject = async (projectId) => {
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
        throw new Error('Project not found');
    }
    return project;
};

export const updateProjectStatus = async (projectId, status) => {
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        throw new Error('Invalid project status');
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { status },
        { new: true, runValidators: true }
    ).populate('studentId', 'name email profilePic username');

    if (!project) {
        throw new Error('Project not found');
    }

    return project;
};

export const toggleUserStatus = async (userId, requestUserId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Prevent admin from disabling themselves
    if (user._id.toString() === requestUserId.toString()) {
        throw new Error('Cannot disable your own account');
    }

    user.isDisabled = !user.isDisabled;
    await user.save();
    return user;
};
