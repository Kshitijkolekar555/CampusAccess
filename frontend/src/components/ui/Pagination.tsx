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
  currentPage: rawCurrentPage,
  totalPages,
  onPageChange,
  totalElements,
  pageSize: rawPageSize,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const currentPage = typeof rawCurrentPage === 'number' && !isNaN(rawCurrentPage) ? rawCurrentPage : 0;
  const pageSize = typeof rawPageSize === 'number' && !isNaN(rawPageSize) ? rawPageSize : undefined;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-500 font-sans">
      <div>
        <span>
          Page <strong className="font-semibold text-slate-800">{currentPage + 1}</strong> of{' '}
          <strong className="font-semibold text-slate-800">{totalPages}</strong>
        </span>
        {totalElements !== undefined && (
          <span className="text-slate-400 ml-1.5">
            ({totalElements} total)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          className="min-w-[84px] justify-center"
        >
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage + 1 >= totalPages}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          className="min-w-[84px] justify-center"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
