import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, children, maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.body.style.overflow = 'hidden'; window.addEventListener('keydown', handleKey); }
    return () => { document.body.style.overflow = 'unset'; window.removeEventListener('keydown', handleKey); };
  }, [isOpen, onClose]);

  const widths: Record<string, string> = {
    sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-16 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative w-full ${widths[maxWidth]} z-10 my-auto`}
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 4,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 py-3.5"
              style={{ borderBottom: '1px solid var(--line)' }}
            >
              <div className="min-w-0 pr-2">
                <h3
                  className="truncate"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 17,
                    color: 'var(--text)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p
                    className="mt-0.5 text-xs truncate"
                    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--mute)' }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 transition-colors flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: 44,
                  minHeight: 44,
                  padding: 8,
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 max-h-[82vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
