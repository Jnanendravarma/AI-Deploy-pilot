import React from 'react';
import { useProjects } from '../../context/ProjectContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useProjects();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300 animate-slide-up pointer-events-auto ${
              isSuccess
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/20 text-rose-300'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isSuccess ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              {isSuccess ? (
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="text-sm font-semibold">{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
};
