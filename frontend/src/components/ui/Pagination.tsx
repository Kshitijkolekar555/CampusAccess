import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalElements?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
  pageSize,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[--line]">
      <div className="text-xs text-[--mute]" style={{ fontFamily: 'Inter, sans-serif' }}>
        {totalElements !== undefined && pageSize !== undefined ? (
          <span>
            Showing <span className="font-semibold text-[--text] font-mono">{Math.min(currentPage * pageSize + 1, totalElements)}</span> to{' '}
            <span className="font-semibold text-[--text] font-mono">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
            <span className="font-semibold text-[--text] font-mono">{totalElements}</span> results
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-[--text] font-mono">{currentPage + 1}</span> of{' '}
            <span className="font-semibold text-[--text] font-mono">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
