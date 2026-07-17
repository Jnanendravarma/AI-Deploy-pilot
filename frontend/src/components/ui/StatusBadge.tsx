import React from 'react';

type StatusType = 'Active' | 'Healed' | 'Offline' | 'Warning' | 'Healthy';

interface StatusBadgeProps {
  status: StatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'Active':
      case 'Healthy':
        return {
          bg: 'bg-emerald-500/8',
          border: 'border-emerald-500/20',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400'
        };
      case 'Healed':
        return {
          bg: 'bg-indigo-500/8',
          border: 'border-indigo-500/20',
          text: 'text-indigo-400',
          dot: 'bg-indigo-400'
        };
      case 'Warning':
        return {
          bg: 'bg-amber-500/8',
          border: 'border-amber-500/20',
          text: 'text-amber-400',
          dot: 'bg-amber-400'
        };
      default:
        return {
          bg: 'bg-rose-500/8',
          border: 'border-rose-500/20',
          text: 'text-rose-400',
          dot: 'bg-rose-400'
        };
    }
  };

  const styles = getStyles();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${styles.bg} ${styles.border} ${styles.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${styles.dot}`} />
      <span>{status}</span>
    </span>
  );
};
