import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toggleFollow, getFollowStatus, getFollowerCount } from '../api/follow.api';
import { updateProfile } from '../api/user.api';
import AuthenticatedProfileInfo from '../components/AuthenticatedProfileInfo';
import { toast } from 'react-toastify';

const RecruiterProfile = ({ profile: profileProp }) => {
  const location = useLocation();
  const { user, setUser } = useAuthStore();
  const isRecruiter = user?.role === 'RECRUITER';
  const profile = profileProp || location.state?.profile || user || null;
  const isOwnProfile = !profileProp && !location.state?.profile;

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile?.followerCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    technologies: Array.isArray(user?.technologies) ? user.technologies.join(', ') : '',
    location: user?.location || '',
    institute: user?.institute || '',
    organizationName: user?.organizationName || '',
    contactNumber: user?.contactNumber || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
  });

  useEffect(() => {
    setFollowerCount(profile?.followerCount ?? 0);
  }, [profile]);

  useEffect(() => {
    if (!user || !isOwnProfile) return;

    setFormData({
      bio: user.bio || '',
      technologies: Array.isArray(user.technologies) ? user.technologies.join(', ') : '',
      location: user.location || '',
      institute: user.institute || '',
      organizationName: user.organizationName || '',
      contactNumber: user.contactNumber || '',
      github: user.github || '',
      linkedin: user.linkedin || '',
    });
  }, [user, isOwnProfile]);

  useEffect(() => {
    const syncFollowState = async () => {
      if (!profile?._id || !isRecruiter || profile._id === user?._id) return;

      try {
        const [statusResponse, countResponse] = await Promise.all([
          getFollowStatus(profile._id),
          getFollowerCount(profile._id),
        ]);

        setFollowing(Boolean(statusResponse.data?.following));
        setFollowerCount(countResponse.data?.count ?? 0);
      } catch {
        setFollowing(false);
        setFollowerCount(profile?.followerCount ?? 0);
      }
    };

    syncFollowState();
  }, [profile, isRecruiter, user?._id]);

  const handleFollowToggle = async () => {
    if (!profile?._id || loading || !isRecruiter || profile._id === user?._id) return;

    try {
      setLoading(true);
      setError('');

      const response = await toggleFollow(profile._id);
      const nextFollowing = Boolean(response.data?.following);

      setFollowing(nextFollowing);
      setFollowerCount((current) => current + (nextFollowing ? 1 : -1));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update follow state');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await updateProfile(formData);
      setUser(response.data);
      toast.success('Recruiter profile updated successfully!');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update recruiter profile.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex-1 px-6 py-10 text-slate-600">
        No profile selected.
      </div>
    );
  }

  const showFollowButton = isRecruiter && profile._id !== user?._id;

  const editableFields = [
    { label: 'Organization / Business Name', name: 'organizationName', type: 'text', placeholder: 'Company, agency, or hiring team' },
    { label: 'Contact Number', name: 'contactNumber', type: 'tel', placeholder: '+94 77 123 4567' },
    { label: 'Location', name: 'location', type: 'text', placeholder: 'City, Country' },
    { label: 'Institute / Company', name: 'institute', type: 'text', placeholder: 'Organization or university' },
    { label: 'Technologies of Interest', name: 'technologies', type: 'text', placeholder: 'React, Node.js, AI, Cyber Security' },
    { label: 'GitHub', name: 'github', type: 'url', placeholder: 'https://github.com/company' },
    { label: 'LinkedIn', name: 'linkedin', type: 'url', placeholder: 'https://linkedin.com/in/username' },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] flex-1 bg-slate-50 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <img
              src={profile.profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=recruiter'}
              alt={profile.name}
              className="h-20 w-20 rounded-md border border-slate-200 object-cover"
            />
            <div className="min-w-0">
              <span className="inline-flex rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                {profile.role || 'Recruiter'}
              </span>
              <h1 className="mt-2 truncate text-2xl font-extrabold text-slate-950">{profile.name}</h1>
              <p className="truncate text-sm text-slate-500">{profile.email}</p>
            </div>
          </div>

          <div className="mt-6">
            <AuthenticatedProfileInfo profile={profile} />
          </div>

          <div className="mt-6 flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold">Followers</span>
            <span>{followerCount}</span>
          </div>

          {showFollowButton && (
            <button
              type="button"
              onClick={handleFollowToggle}
              disabled={loading}
              aria-pressed={following}
              className={`mt-6 w-full rounded-md px-4 py-3 text-sm font-bold transition ${
                following
                  ? 'border border-slate-200 bg-slate-100 text-slate-800'
                  : 'bg-slate-900 text-white hover:bg-black'
              } disabled:opacity-60`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Recruiter Workspace</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
              {isOwnProfile ? 'Update Recruiter Profile' : 'Recruiter Details'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {isOwnProfile
                ? 'Maintain your contact details, organization information, and hiring interests.'
                : 'View recruiter identity and engagement information.'}
            </p>
          </div>

          {isOwnProfile ? (
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              {editableFields.map((field) => (
                <div key={field.name}>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              ))}

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe your recruitment focus, company background, or project interests."
                  className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {error && (
                <p className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 sm:col-span-2">
                  {error}
                </p>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-md border border-slate-900 bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <p className="text-sm leading-relaxed text-slate-600">
                {profile.bio || 'No recruiter bio has been added yet.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RecruiterProfile;
