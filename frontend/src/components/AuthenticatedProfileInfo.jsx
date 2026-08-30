import React from 'react';

const getOrganizationName = (profile) => (
  profile?.organizationName || profile?.institute || 'Not provided'
);

const getUsername = (profile) => (
  profile?.username || profile?.email?.split('@')[0] || 'Not provided'
);

const AuthenticatedProfileInfo = ({ profile, title = 'Authenticated User Information' }) => {
  const rows = [
    { label: 'Username', value: getUsername(profile) },
    { label: 'Name', value: profile?.name || 'Not provided' },
    { label: 'Email Address', value: profile?.email || 'Not provided' },
    { label: 'Contact Number', value: profile?.contactNumber || 'Not provided' },
    { label: 'Organization / Business Name', value: getOrganizationName(profile) },
  ];

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-md bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {row.label}
            </p>
            <p className="mt-1 break-words font-semibold text-slate-800">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AuthenticatedProfileInfo;
