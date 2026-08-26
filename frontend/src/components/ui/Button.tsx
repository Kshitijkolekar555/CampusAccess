import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const base = [
    'inline-flex items-center justify-center font-medium transition-all duration-150',
    'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none',
  ].join(' ');

  const variants: Record<string, string> = {
    primary:   'bg-[--ink] text-white hover:bg-[--accent] focus-visible:outline-[--accent]',
    secondary: 'bg-[--text] text-white hover:bg-[--accent] focus-visible:outline-[--accent]',
    outline:   'border border-[--line] bg-white text-[--text] hover:border-[--text] focus-visible:outline-[--accent]',
    ghost:     'bg-transparent text-[--mute] hover:text-[--text] hover:bg-slate-50 focus-visible:outline-[--accent]',
    danger:    'bg-rose-700 text-white hover:bg-rose-800 focus-visible:outline-rose-600',
    success:   'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-600',
  };

  // 2px radius — restrained, not pill-shaped
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-[2px]',
    md: 'px-4 py-2 text-sm gap-2 rounded-[2px]',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-[2px]',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
