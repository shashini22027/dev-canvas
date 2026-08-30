import React from 'react';

const LoginPage = () => {
  const handleAsgardeoLogin = () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.location.href = `${baseURL}/auth/asgardeo`;
  };

  return (
    <div className="flex h-screen w-screen bg-white font-sans overflow-hidden">
      {/* Left side - Image Hero (Only visible on large screens) */}
      <div className="hidden lg:flex lg:w-1/2 p-6 h-full flex-col box-border">
        <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-lg">
          {/* Main Hero Photo */}
          <img
            src="https://images.unsplash.com/photo-1603201667230-bd139210db18?q=80&w=1188&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Students collaborating"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark Gradient Overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 flex flex-col justify-end p-12">
            <h2 className="text-white text-5xl font-bold leading-tight mb-4 tracking-tight max-w-lg">
              Showcase Your Tech with Clarity
            </h2>
            <p className="text-slate-200 text-base leading-relaxed max-w-md">
              DevCanvas helps you showcase your innovations, connect with recruiters, and track computing coursework feedback all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between items-center p-8 sm:p-12 md:p-16 box-border">
        {/* Empty placeholder for alignment */}
        <div className="hidden lg:block h-8"></div>

        <div className="w-full max-w-md flex flex-col my-auto">
          {/* Top Logo */}
          <div className="flex items-center gap-2.5 mb-8 justify-center lg:justify-start">

            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              DevCanvas
            </span>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome to DevCanvas</h1>
            <p className="text-slate-500 text-sm">Please sign in to access your student workspace</p>
          </div>

          {/* Asgardeo OIDC Login Action */}
          <div className="w-full">
            <button
              onClick={handleAsgardeoLogin}
              className="w-full py-4 px-6 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-3 transition-all focus:outline-none cursor-pointer text-base"
            >
              <span className="w-5 h-5 rounded bg-orange-500 text-white text-xs flex items-center justify-center font-black">A</span>
              Sign in with Asgardeo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full text-center">
          <p className="text-slate-400 text-xs">
            Faculty of Computing &copy; 2026. Need assistance? <a href="#" className="text-purple-600 font-semibold hover:underline">Contact your admin.</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
