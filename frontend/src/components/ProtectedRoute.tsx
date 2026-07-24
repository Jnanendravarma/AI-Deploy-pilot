import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loadingUser } = useProjects();
  const location = useLocation();

  if (loadingUser) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 select-none">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-400 to-indigo-500 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 3L3 10.5L10.5 13.5L13.5 21L21 3Z" />
              <path d="M10.5 13.5L21 3" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold tracking-wide text-white">DeployPilot AI</span>
            <span className="text-xs text-slate-400">Verifying session credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
