import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, triggerToast, logout } = useProjects();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const initials = (user?.name || 'DU')
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const menuItems = [
    {
      name: 'Projects',
      path: '/dashboard',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      name: 'Monitoring',
      path: '/monitoring',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  const getBreadcrumbName = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard / Connected Projects';
    if (path.startsWith('/upload')) return 'Dashboard / Import Project';
    if (path.startsWith('/deployment')) return 'Projects / Active Deployment Pipeline';
    if (path.startsWith('/doctor')) return 'Diagnostics / AI Deployment Doctor';
    if (path.startsWith('/logs')) return 'Telemetry / Live Console Stream';
    if (path.startsWith('/monitoring')) return 'Infrastructure / Telemetry Monitoring';
    if (path.startsWith('/analytics')) return 'Analytics / Performance Summary';
    if (path.startsWith('/settings')) return 'Settings / Profile Configurations';
    return 'Dashboard';
  };

  return (
    <div className="min-height-screen flex bg-bg-dark text-slate-100 overflow-hidden min-h-screen relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-white/5 p-6 flex flex-col justify-between flex-shrink-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight select-none">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.35)]">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 3L3 10.5L10.5 13.5L13.5 21L21 3Z" />
                  <path d="M10.5 13.5L21 3" />
                </svg>
              </div>
              <span>DeployPilot <span className="font-normal opacity-70">AI</span></span>
            </Link>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.06)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative">
          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 mb-3 w-full rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings?tab=account');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Account Settings
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition mt-0.5"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}

          {/* Profile Clickable Area */}
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between gap-2.5 border-t border-white/5 pt-5 cursor-pointer hover:bg-white/2 -mx-2 px-2 rounded-xl transition-all duration-150 select-none"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                  {initials}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white leading-tight truncate">{user?.name || 'Developer'}</span>
                <span className="text-[10px] text-slate-400 font-semibold leading-snug truncate mt-0.5">{user?.email || 'developer@deploypilot.ai'}</span>
                <span className="text-[9px] text-slate-500 font-medium leading-none uppercase tracking-wider mt-1">{user?.role || 'Developer'}</span>
              </div>
            </div>
            <div className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full">
        <header className="h-16 bg-slate-950/20 border-b border-white/5 px-4 sm:px-8 flex items-center justify-between select-none z-10 flex-shrink-0">
          <div className="flex items-center min-w-0 mr-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/3 border border-white/6 text-slate-400 hover:text-white cursor-pointer mr-3 transition-all"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="text-xs font-bold text-slate-400 tracking-wide truncate">{getBreadcrumbName()}</div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/upload" className="inline-flex items-center justify-center font-semibold rounded-xl bg-primary text-white hover:bg-indigo-600 px-4 py-2 text-xs transition-all duration-200">
              + New Project
            </Link>
            <div
              className="w-9 h-9 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-all"
              onClick={() => triggerToast('Notification center connected to backend API.', 'success')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};
