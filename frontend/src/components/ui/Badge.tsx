import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  icon,
}) => {
  const base = 'inline-flex items-center font-medium border transition-colors rounded-[2px]';

  const variants: Record<string, string> = {
    default: 'bg-slate-50  text-slate-600  border-[--line]',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50  text-amber-700  border-amber-200',
    danger:  'bg-rose-50   text-rose-700   border-rose-200',
    info:    'bg-sky-50    text-sky-700    border-sky-200',
    purple:  'bg-slate-50  text-[--accent] border-[--line]',
  };

  const sizes: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-[11px] gap-1',
  };

  return (
    <span className={clsx(base, variants[variant], sizes[size], className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.02em' }}>
        {children}
      </span>
    </span>
  );
};
