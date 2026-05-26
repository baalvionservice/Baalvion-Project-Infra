'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import DataTablePagination from './DataTablePagination';
import DataTableToolbar from './DataTableToolbar';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  toolbar?: React.ReactNode;
  pageSize?: number;
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  selectable?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
}

export default function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchColumn,
  searchPlaceholder = 'Search...',
  filters,
  toolbar,
  pageSize = 20,
  totalCount,
  page,
  onPageChange,
  selectable = false,
  onSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const isServerPaginated = typeof page === 'number' && typeof onPageChange === 'function';

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    enableRowSelection: selectable,
    onRowSelectionChange: (updater) => {
      setRowSelection(typeof updater === 'function' ? updater(rowSelection) : updater);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isServerPaginated ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: isServerPaginated,
    pageCount: isServerPaginated && totalCount ? Math.ceil(totalCount / pageSize) : undefined,
    initialState: { pagination: { pageSize } },
  });

  // notify parent of selection changes
  if (onSelectionChange) {
    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
    onSelectionChange(selectedRows);
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchColumn={searchColumn}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        toolbar={toolbar}
      />
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        totalCount={totalCount}
        serverPage={page}
        onPageChange={onPageChange}
      />
    </div>
  );
}
