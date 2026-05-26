'use client';

import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props<T> {
  table: Table<T>;
  totalCount?: number;
  serverPage?: number;
  onPageChange?: (page: number) => void;
}

export default function DataTablePagination<T>({
  table,
  totalCount,
  serverPage,
  onPageChange,
}: Props<T>) {
  const isServer = typeof serverPage === 'number' && typeof onPageChange === 'function';
  const pageIndex = isServer ? serverPage - 1 : table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const canPrev = isServer ? serverPage > 1 : table.getCanPreviousPage();
  const canNext = isServer ? pageCount === -1 || serverPage < pageCount : table.getCanNextPage();

  const goTo = (pg: number) => {
    if (isServer) onPageChange!(pg + 1);
    else table.setPageIndex(pg);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length > 0
          ? `${table.getFilteredSelectedRowModel().rows.length} of `
          : null}
        {totalCount != null
          ? `${totalCount} row(s)`
          : `${table.getFilteredRowModel().rows.length} row(s)`}
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((s) => (
                <SelectItem key={s} value={`${s}`}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {pageCount === -1 ? '?' : pageCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(0)} disabled={!canPrev}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(pageIndex - 1)} disabled={!canPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(pageIndex + 1)} disabled={!canNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(pageCount - 1)} disabled={!canNext}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
