import React from 'react';
import { clsx } from 'clsx';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={clsx('flex items-center justify-center p-4', className)}>
      <div className={clsx('animate-spin rounded-full border-2 border-indigo-600 border-t-transparent', sizes[size])} />
    </div>
  );
};
