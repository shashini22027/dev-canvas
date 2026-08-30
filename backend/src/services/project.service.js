import Project from '../models/Project.js';
import eventBus from '../events/eventBus.js';
import cloudinary from '../lib/cloudinary.js';

const PROJECT_CATEGORIES = ['Web Application', 'Mobile Application', 'AI / Machine Learning', 'Data Science', 'IoT', 'Cyber Security', 'Other'];
const PROJECT_TYPES = ['Individual', 'Team Project'];

const cleanString = (value, maxLength = 300) => {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
};

const parseProjectPayload = (projectData) => {
    const title = cleanString(projectData.title, 100);
    const description = cleanString(projectData.description, 2000);
    const category = cleanString(projectData.category, 80);
    const projectType = cleanString(projectData.projectType, 40);
    const specialComments = cleanString(projectData.specialComments, 1000);
    const teamMemberCount = Number(projectData.teamMemberCount);
    const submissionDate = projectData.submissionDate ? new Date(projectData.submissionDate) : new Date();

    if (!title) throw new Error('Project title is required');
    if (!description) throw new Error('Project description is required');
    if (!PROJECT_CATEGORIES.includes(category)) throw new Error('Invalid project category');
    if (!PROJECT_TYPES.includes(projectType)) throw new Error('Invalid project type');
    if (!Number.isInteger(teamMemberCount) || teamMemberCount < 1 || teamMemberCount > 20) {
        throw new Error('Team member count must be between 1 and 20');
    }
    if (Number.isNaN(submissionDate.getTime())) throw new Error('Invalid submission date');

    return { title, description, category, projectType, teamMemberCount, submissionDate, specialComments };
};

export const uploadToCloudinary = async (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

export const createProject = async (projectData, files, user) => {
    let coverImageUrl = '';
    let extraImageUrls = [];

    if (files?.coverImage?.[0]) {
        coverImageUrl = await uploadToCloudinary(
            files.coverImage[0].buffer,
            'dev-canvas/projects'
        );
    }

    if (files?.extraImages?.length) {
        extraImageUrls = await Promise.all(
            files.extraImages.map((file) =>
                uploadToCloudinary(file.buffer, 'dev-canvas/projects/extras')
            )
        );
    }

    let tagsArray = [];
    if (projectData.tags) {
        tagsArray = typeof projectData.tags === 'string'
            ? projectData.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : projectData.tags;
    }

    const payload = parseProjectPayload(projectData);

    const project = new Project({
        ...payload,
        githubUrl: cleanString(projectData.githubUrl, 300),
        demoUrl: cleanString(projectData.demoUrl, 300),
        tags: tagsArray,
        studentId: user.id,
        coverImage: coverImageUrl,
        images: extraImageUrls,
    });

    await project.save();

    eventBus.emit("project:created", {
        project,
        creator: user,
    });

    return project;
};

export const getProjects = async (userId) => {
    const query = {};
    if (userId) {
        query.studentId = userId;
    }
    return await Project.find(query)
        .sort({ createdAt: -1 })
        .populate('studentId', 'name email profilePic');
};

export const getProjectById = async (projectId) => {
    const project = await Project.findById(projectId).populate('studentId', 'name email profilePic');
    if (!project) throw new Error('Project not found');
    return project;
};

export const updateProject = async (projectId, updateData, files, userId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    if (project.studentId.toString() !== userId) throw new Error('Unauthorized');

    if (files?.coverImage?.[0]) {
        project.coverImage = await uploadToCloudinary(
            files.coverImage[0].buffer,
            'dev-canvas/projects'
        );
    }

    let updatedImages = project.images || [];
    if (updateData.existingImages !== undefined) {
        try {
            updatedImages = JSON.parse(updateData.existingImages);
        } catch (e) {
            updatedImages = Array.isArray(updateData.existingImages) ? updateData.existingImages : [updateData.existingImages];
        }
    }

    if (files?.extraImages?.length) {
        const newlyUploaded = await Promise.all(
            files.extraImages.map((file) =>
                uploadToCloudinary(file.buffer, 'dev-canvas/projects/extras')
            )
        );
        updatedImages = [...updatedImages, ...newlyUploaded];
    }
    project.images = updatedImages;

    const { title, description, githubUrl, demoUrl, tags, category, projectType, teamMemberCount, submissionDate, specialComments } = updateData;
    if (title) project.title = title;
    if (description) project.description = description;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (demoUrl !== undefined) project.demoUrl = demoUrl;
    if (category !== undefined) {
        if (!PROJECT_CATEGORIES.includes(category)) throw new Error('Invalid project category');
        project.category = category;
    }
    if (projectType !== undefined) {
        if (!PROJECT_TYPES.includes(projectType)) throw new Error('Invalid project type');
        project.projectType = projectType;
    }
    if (teamMemberCount !== undefined) {
        const count = Number(teamMemberCount);
        if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error('Team member count must be between 1 and 20');
        project.teamMemberCount = count;
    }
    if (submissionDate !== undefined) {
        const date = new Date(submissionDate);
        if (Number.isNaN(date.getTime())) throw new Error('Invalid submission date');
        project.submissionDate = date;
    }
    if (specialComments !== undefined) project.specialComments = cleanString(specialComments, 1000);
    if (tags !== undefined) {
        project.tags = typeof tags === 'string'
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : tags;
    }

    await project.save();
    return project;
};

export const deleteProject = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    if (project.studentId.toString() !== userId) throw new Error('Unauthorized');

    await project.deleteOne();
    return { message: 'Project deleted' };
};
