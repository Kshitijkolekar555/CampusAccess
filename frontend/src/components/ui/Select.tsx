import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, required, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
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
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={clsx(
            'block w-full text-sm bg-white transition-colors duration-150',
            'focus:outline-none focus:ring-0',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            'px-3 py-2 rounded-[4px]',
            error
              ? 'border border-rose-400 focus:border-rose-500'
              : 'border border-[--line] hover:border-[--mute] focus:border-[--accent]',
            className
          )}
          style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text)' }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1 text-xs text-rose-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs" style={{ color: 'var(--mute)' }}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';
