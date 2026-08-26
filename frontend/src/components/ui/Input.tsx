import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  showPasswordToggle?: boolean;
  /** 'box' = bordered box (default, backward-compatible)
   *  'underline' = bottom-border only, editorial style */
  variant?: 'box' | 'underline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label, error, leftIcon, rightIcon, helperText,
      showPasswordToggle, className, id, type, required,
      variant = 'box', ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';
    const currentType = isPasswordType && showPassword ? 'text' : type;

    if (variant === 'underline') {
      return (
        <div className="w-full" style={{ marginBottom: 20 }}>
          {label && (
            <label
              htmlFor={inputId}
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--mute)',
                marginBottom: 7,
              }}
            >
              {label}{required && <span style={{ color: '#e11d48', marginLeft: 3 }}>*</span>}
            </label>
          )}
          <div
            className={clsx(
              'flex items-center gap-2',
              error ? 'border-b border-rose-400' : 'border-b border-[--line] focus-within:border-[--text]'
            )}
            style={{ paddingBottom: 7, transition: 'border-color 0.15s' }}
          >
            {leftIcon && (
              <span style={{ color: 'var(--mute)', flexShrink: 0, display: 'flex' }}>{leftIcon}</span>
            )}
            <input
              id={inputId}
              ref={ref}
              type={currentType}
              required={required}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text)', caretColor: 'var(--accent)' }}
              {...props}
            />
            {isPasswordType && showPasswordToggle !== false ? (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            ) : rightIcon ? (
              <span style={{ color: 'var(--mute)', display: 'flex' }}>{rightIcon}</span>
            ) : null}
          </div>
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
          {!error && helperText && <p className="mt-1 text-xs" style={{ color: 'var(--mute)' }}>{helperText}</p>}
        </div>
      );
    }

    // Default: box variant
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--mute)',
            }}
          >
            {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--mute)' }}>
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={currentType}
            required={required}
            className={clsx(
              'block w-full text-sm bg-white transition-colors duration-150',
              'focus:outline-none focus:ring-0',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon || (isPasswordType && showPasswordToggle !== false) ? 'pr-9' : 'pr-3',
              'py-2 rounded-[4px]',
              error
                ? 'border border-rose-400 focus:border-rose-500'
                : 'border border-[--line] hover:border-[--mute] focus:border-[--accent]',
              className
            )}
            style={{ color: 'var(--text)' }}
            {...props}
          />
          {isPasswordType && showPasswordToggle !== false ? (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              style={{ color: 'var(--mute)', background: 'none', border: 'none', cursor: 'pointer' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : rightIcon ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center" style={{ color: 'var(--mute)' }}>
              {rightIcon}
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--mute)' }}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
