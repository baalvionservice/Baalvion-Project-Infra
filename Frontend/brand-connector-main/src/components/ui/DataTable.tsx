"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  MoreHorizontal,
  Download,
  Trash2,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Inbox,
  Loader2,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface BulkAction<T> {
  label: string;
  onClick: (selectedRows: T[]) => void;
  icon?: any;
  variant?: "default" | "destructive" | "secondary";
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  bulkActions?: BulkAction<T>[];
  onExport?: (data: T[]) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  initialSort?: { key: string; direction: "asc" | "desc" };
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  bulkActions = [],
  onExport,
  searchPlaceholder = "Search records...",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search terms.",
  initialSort,
  className,
}: DataTableProps<T>) {
  // 1. State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(initialSort || null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 2. Logic: Filtering
  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      const searchStr = searchQuery.toLowerCase();
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchStr)
      );
    });
  }, [data, searchQuery]);

  // 3. Logic: Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // 4. Logic: Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // 5. Handlers
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map((d) => d.id)));
    }
  };

  const toggleSelectRow = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedRows = useMemo(
    () => data.filter((d) => selectedIds.has(d.id)),
    [data, selectedIds]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-px bg-slate-200 mx-2" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl font-bold h-10 px-4 gap-2 border border-primary/10"
                    >
                      Bulk Actions ({selectedIds.size}){" "}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56 rounded-xl p-2 shadow-2xl border-none"
                  >
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Apply to selection
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {bulkActions.map((action, i) => (
                      <DropdownMenuItem
                        key={i}
                        className={cn(
                          "rounded-lg font-bold py-2",
                          action.variant === "destructive" && "text-red-600"
                        )}
                        onClick={() => action.onClick(selectedRows)}
                      >
                        {action.icon && (
                          <action.icon className="mr-2 h-4 w-4" />
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-slate-400"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold h-11 px-6 border-slate-200 bg-white"
              onClick={() => onExport(sortedData)}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          )}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="font-bold">
                10 / pg
              </SelectItem>
              <SelectItem value="25" className="font-bold">
                25 / pg
              </SelectItem>
              <SelectItem value="50" className="font-bold">
                50 / pg
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-100 h-16 bg-slate-50/30">
              <TableHead className="w-12 pl-8">
                <Checkbox
                  checked={
                    selectedIds.size === paginatedData.length &&
                    paginatedData.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "font-black text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={cn(
                          "h-3 w-3 transition-colors",
                          sortConfig?.key === col.key
                            ? "text-primary"
                            : "text-slate-300 group-hover:text-slate-400"
                        )}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i} className="h-20 border-slate-50">
                  <TableCell className="pl-8">
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableCell>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full rounded-lg" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {paginatedData.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "group border-slate-50 hover:bg-slate-50/50 transition-colors h-20",
                      selectedIds.has(row.id) &&
                        "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    <TableCell className="pl-8">
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleSelectRow(row.id)}
                      />
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn("py-4", col.className)}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-96 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <Inbox className="h-12 w-12" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">
                        {emptyTitle}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
                        {emptyDescription}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-6 border-t bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing{" "}
              <span className="text-slate-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              -{" "}
              <span className="text-slate-900">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{" "}
              of <span className="text-slate-900">{sortedData.length}</span>{" "}
              records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 w-9 p-0 bg-white border-slate-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  // Only show 5 pages near current, plus first/last
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "ghost"}
                        size="sm"
                        className={cn(
                          "rounded-xl h-9 w-9 p-0 font-bold",
                          currentPage === pageNum
                            ? "shadow-lg shadow-primary/20"
                            : "text-slate-400 hover:text-primary"
                        )}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="text-slate-300 px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9 w-9 p-0 bg-white border-slate-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Internal ShadCN helper
function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}
function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </div>
  );
}
function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}
function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
