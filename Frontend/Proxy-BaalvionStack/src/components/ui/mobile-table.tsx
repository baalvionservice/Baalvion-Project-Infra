import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";

type RowData = Record<string, unknown>;

interface MobileTableProps {
  data: RowData[];
  columns: {
    key: string;
    label: string;
    render?: (value: unknown, row: RowData) => React.ReactNode;
    primary?: boolean;
    badge?: boolean;
    hidden?: boolean;
  }[];
  onRowClick?: (row: RowData) => void;
  keyExtractor?: (row: RowData) => string;
  className?: string;
}

export function MobileTable({
  data,
  columns,
  onRowClick,
  keyExtractor = (row) => String(row.id),
  className,
}: MobileTableProps) {
  const primaryColumns = columns.filter((col) => col.primary);
  const secondaryColumns = columns.filter((col) => !col.primary && !col.hidden);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((row) => (
        <Card
          key={keyExtractor(row)}
          className={cn(
            "transition-colors",
            onRowClick && "cursor-pointer hover:bg-secondary/30"
          )}
          onClick={() => onRowClick?.(row)}
        >
          <CardContent className="p-4">
            {/* Primary row - main info */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                {primaryColumns.map((col) => {
                  const value = row[col.key];
                  const rendered = col.render ? col.render(value, row) : (value as React.ReactNode);
                  
                  return (
                    <div key={col.key} className="mb-1 last:mb-0">
                      {col.badge ? (
                        <Badge variant="secondary">{rendered}</Badge>
                      ) : (
                        <p className="font-semibold truncate">{rendered}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary rows - details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {secondaryColumns.map((col) => {
                const value = row[col.key];
                const rendered = col.render ? col.render(value, row) : (value as React.ReactNode);

                return (
                  <div key={col.key} className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{col.label}</span>
                    <span className="text-sm font-medium truncate">
                      {col.badge ? (
                        <Badge variant="outline" className="text-xs">
                          {rendered}
                        </Badge>
                      ) : (
                        rendered
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ResponsiveTableProps {
  children: React.ReactNode;
  mobileComponent?: React.ReactNode;
  breakpoint?: "sm" | "md" | "lg";
}

export function ResponsiveTable({
  children,
  mobileComponent,
  breakpoint = "lg",
}: ResponsiveTableProps) {
  const breakpointClass = {
    sm: "sm:block",
    md: "md:block",
    lg: "lg:block",
  };

  const hideClass = {
    sm: "sm:hidden",
    md: "md:hidden",
    lg: "lg:hidden",
  };

  return (
    <>
      {/* Desktop table */}
      <div className={cn("hidden", breakpointClass[breakpoint])}>
        {children}
      </div>

      {/* Mobile cards */}
      {mobileComponent && (
        <div className={cn("block", hideClass[breakpoint])}>
          {mobileComponent}
        </div>
      )}
    </>
  );
}

interface CollapsibleFiltersProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleFilters({ children, className }: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={className}>
      {/* Mobile toggle */}
      <button
        className="flex lg:hidden items-center justify-between w-full p-3 rounded-lg bg-secondary/50 mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium">Filters</span>
        <svg
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      <div
        className={cn(
          "lg:block overflow-hidden transition-all",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 lg:max-h-none opacity-0 lg:opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface StickyActionsProps {
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}

export function StickyActions({ children, className, show = true }: StickyActionsProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 lg:hidden p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40",
        className
      )}
    >
      <div className="max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
}
