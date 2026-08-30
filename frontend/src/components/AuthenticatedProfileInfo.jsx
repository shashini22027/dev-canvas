import React from 'react';

const getOrganizationName = (profile) => (
  profile?.organizationName || profile?.institute || 'Not provided'
);

const getUsername = (profile) => (
  profile?.username || profile?.email?.split('@')[0] || 'Not provided'
);

const InfoIcon = ({ children }) => (
  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
    {children}
  </span>
);

const AuthenticatedProfileInfo = ({ profile, title = 'Authenticated User Information' }) => {
  const rows = [
    { label: 'Username', value: getUsername(profile), icon: '@' },
    { label: 'Name', value: profile?.name || 'Not provided', icon: 'N' },
    { label: 'Email Address', value: profile?.email || 'Not provided', icon: 'M' },
    { label: 'Contact Number', value: profile?.contactNumber || 'Not provided', icon: 'T' },
    { label: 'Organization / Business Name', value: getOrganizationName(profile), icon: 'O' },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Identity from OIDC
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-950">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-w-0 items-start gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <InfoIcon>{row.icon}</InfoIcon>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {row.label}
              </p>
              <p className="mt-1 break-words font-semibold leading-snug text-slate-900">
                {row.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AuthenticatedProfileInfo;
