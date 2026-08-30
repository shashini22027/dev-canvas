import User from '../models/User.js';
import Project from '../models/Project.js';
import Follower from '../models/Follower.js';

const sanitizeText = (value, maxLength = 300) => {
  if (typeof value !== 'string') return '';

  const cleaned = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.slice(0, maxLength);
};

const sanitizeUrl = (value, maxLength = 300) => {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (!/^https?:\/\//i.test(trimmed)) return '';

  const safe = trimmed.replace(/[\u0000-\u001F\u007F<>"'\\]/g, '').trim();
  return safe.slice(0, maxLength);
};

export const updateUserService = async (userId, data) => {
  const { bio, technologies, location, institute, organizationName, contactNumber, degree, github, linkedin } = data;

  let techArray = [];
  if (typeof technologies === 'string') {
    techArray = technologies
      .split(',')
      .map((t) => sanitizeText(t, 40))
      .filter(Boolean);
  } else if (Array.isArray(technologies)) {
    techArray = technologies
      .map((t) => sanitizeText(String(t), 40))
      .filter(Boolean);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        bio: sanitizeText(bio, 500),
        technologies: techArray,
        location: sanitizeText(location, 120),
        institute: sanitizeText(institute, 160),
        organizationName: sanitizeText(organizationName, 160),
        contactNumber: sanitizeText(contactNumber, 30),
        degree: sanitizeText(degree, 160),
        github: sanitizeUrl(github, 300),
        linkedin: sanitizeUrl(linkedin, 300),
      },
    },
    { new: true, runValidators: true }
  ).select('-__v');

  return updatedUser;
};

export const getUserByIdService = async (id) => {
  const user = await User.findById(id)
    .select('username name email profilePic role bio technologies location institute organizationName contactNumber degree github linkedin createdAt');

  if (!user) {
    return null;
  }

  const [projects, followerCount] = await Promise.all([
    Project.find({ studentId: id }).sort({ createdAt: -1 }),
    Follower.countDocuments({ followingId: id }),
  ]);

  return { user, projects, followerCount };
};
