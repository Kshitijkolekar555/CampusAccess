import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children, className, hoverable = false, onClick, style,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: '20px',
        transition: 'border-color 0.15s',
        cursor: hoverable ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => { e.currentTarget.style.borderColor = 'var(--mute)'; } : undefined}
      onMouseLeave={hoverable ? (e) => { e.currentTarget.style.borderColor = 'var(--line)'; } : undefined}
      className={clsx(className)}
    >
      {children}
    </div>
  );
};
