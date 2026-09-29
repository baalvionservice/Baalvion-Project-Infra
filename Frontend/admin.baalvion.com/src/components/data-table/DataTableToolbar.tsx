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
  /**
   * When provided, the search box is controlled by the caller (e.g. to drive a
   * server-side query) instead of filtering the currently loaded page client-side.
   * Required together — a value with no handler (or vice versa) falls back to the
   * default client-side column filter.
   */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function DataTableToolbar<T>({
  table,
  searchColumn,
  searchPlaceholder = 'Search...',
  filters,
  toolbar,
  searchValue,
  onSearchChange,
}: Props<T>) {
  const isServerSearch = onSearchChange !== undefined;
  const isFiltered = table.getState().columnFilters.length > 0 || (isServerSearch && !!searchValue);

  const handleClear = () => {
    table.resetColumnFilters();
    onSearchChange?.('');
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={
              isServerSearch
                ? (searchValue ?? '')
                : ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? '')
            }
            onChange={(e) =>
              isServerSearch
                ? onSearchChange(e.target.value)
                : table.getColumn(searchColumn)?.setFilterValue(e.target.value)
            }
            className="h-8 w-[200px] lg:w-[280px]"
          />
        )}
        {filters}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
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
