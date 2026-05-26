'use client';

import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props<T> {
  table: Table<T>;
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  toolbar?: React.ReactNode;
}

export default function DataTableToolbar<T>({
  table,
  searchColumn,
  searchPlaceholder = 'Search...',
  filters,
  toolbar,
}: Props<T>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
            className="h-8 w-[200px] lg:w-[280px]"
          />
        )}
        {filters}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 text-xs"
          >
            Clear
            <X className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">{toolbar}</div>
    </div>
  );
}
