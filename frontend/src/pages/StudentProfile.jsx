import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { getMyProjects } from '../api/project.api';
import { updateProfile } from '../api/user.api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthenticatedProfileInfo from '../components/AuthenticatedProfileInfo';

const StudentProfile = () => {
  const { user, setUser } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    technologies: Array.isArray(user?.technologies) ? user.technologies.join(', ') : '',
    location: user?.location || '',
    institute: user?.institute || '',
    organizationName: user?.organizationName || '',
    contactNumber: user?.contactNumber || '',
    degree: user?.degree || '',
    github: user?.github || '',
    linkedin: user?.linkedin || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        technologies: Array.isArray(user.technologies) ? user.technologies.join(', ') : '',
        location: user.location || '',
        institute: user.institute || '',
        organizationName: user.organizationName || '',
        contactNumber: user.contactNumber || '',
        degree: user.degree || '',
        github: user.github || '',
        linkedin: user.linkedin || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const response = await getMyProjects();
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects.");
      } finally {
        setLoadingProjects(false);
      }
    };
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await updateProfile(formData);
      setUser(response.data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 text-slate-900 px-4 py-8 sm:px-8 lg:px-12 font-sans">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">

        {/* Left Column: Profile Edit Form */}
        <div className="w-full">
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
              <img
                src={user?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                alt="Profile"
                className="w-20 h-20 rounded-md object-cover border border-slate-200"
              />
              <div className="min-w-0">
                <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Student
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {user?.name || "Student Name"}
                </h1>
                <p className="truncate text-slate-500 text-sm">{user?.email}</p>
                <p className="truncate text-slate-400 text-xs">@{user?.username || user?.email?.split('@')[0]}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="w-full space-y-5">
              <AuthenticatedProfileInfo profile={user} />
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors resize-none text-sm"
                  rows="3"
                  placeholder="Tell your story..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Technologies</label>
                <input
                  type="text"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="React, Node.js, Python..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Institute</label>
                <input
                  type="text"
                  name="institute"
                  value={formData.institute}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="University Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Organization / Business Name</label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="Club, startup, company, or team name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="BSc Software Engineering"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">GitHub</label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors text-sm"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-md border border-slate-900 bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
                >
                  {isSaving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Published Projects List */}
        <div className="w-full">
          <div className="mb-6 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Student Workspace</p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-950 tracking-tight">My Project Submissions</h2>
            <p className="mt-2 text-sm text-slate-500">Review submitted projects and update your own showcase records.</p>
          </div>

          {loadingProjects ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-slate-500 text-sm shadow-sm">Loading projects...</div>
          ) : projects.length > 0 ? (
            <div className="flex flex-col gap-4">
              {projects.map(project => (
                <div key={project._id} className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium tracking-wide">
                        {new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <Link 
                        to={`/edit-project/${project._id}`} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Edit Project
                      </Link>
                    </div>
                    <Link to={`/edit-project/${project._id}`} className="hover:underline hover:text-indigo-600 transition-colors inline-block mb-2">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                        {project.title}
                      </h3>
                    </Link>
                    <p className="text-slate-600 text-base mb-4 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4">
                      {project.tags && project.tags.length > 0 && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                          {project.tags[0]}
                        </span>
                      )}
                      <div className="flex gap-3 text-slate-400">
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                          </a>
                        )}
                        {project.demoUrl && (
                          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-36 h-32 flex-shrink-0">
                    <img
                      src={project.coverImage || "https://via.placeholder.com/150"}
                      alt={project.title}
                      className="w-full h-full rounded-md border border-slate-100 object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 shadow-sm">
              <p className="text-slate-600 text-lg font-semibold">You haven't published any projects yet.</p>
              <p className="mt-2 text-sm text-slate-500">Create a project submission to show your work in DevCanvas.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentProfile;
