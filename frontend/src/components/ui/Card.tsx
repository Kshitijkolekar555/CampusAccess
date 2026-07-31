import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={hoverable ? { y: -3 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={clsx(
        'glass-card rounded-2xl p-6',
        hoverable && 'cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
