import React from 'react';
import { clsx } from 'clsx';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  keyExtractor?: (item: T) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your request.',
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col, i) => (
              <th
                key={i}
                className={clsx(
                  'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, rowIdx) => (
            <tr
              key={keyExtractor ? keyExtractor(item) : item.id || rowIdx}
              onClick={() => onRowClick && onRowClick(item)}
              className={clsx(
                'hover:bg-slate-50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={clsx('px-4 py-3 text-slate-800 align-middle', col.className)}
                >
                  {col.render ? col.render(item) : col.accessor ? item[col.accessor] : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
