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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
      <div>
        {totalElements !== undefined && pageSize !== undefined ? (
          <span>
            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPage * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{totalElements}</span> results
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPage + 1}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
