import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There are no items to display at this time.',
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[4px] border border-dashed border-[--line]">
      <div className="p-3 bg-slate-50 text-[--accent] rounded-full mb-3 border border-[--line]">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-[--text] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{title}</h3>
      <p className="text-xs text-[--mute] max-w-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
