import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative bg-surface-dark/65 backdrop-blur-2xl border border-white/8 rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden ${
        glow ? 'shadow-[0_0_20px_rgba(99,102,241,0.08)] border-indigo-500/15' : ''
      } ${className}`}
      {...props}
    >
      {/* Decorative gradient border outline */}
      <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none -z-10" />
      {children}
    </div>
  );
};
