'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: { label: string; value: string }[];
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  loading = false,
  filterValue,
  onFilterChange,
  filterOptions,
  children,
  className,
  headerAction
}: ChartCardProps) {
  return (
    <Card className={cn("border-none shadow-sm rounded-[2rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">{title}</CardTitle>
          {description && <CardDescription className="font-medium">{description}</CardDescription>}
        </div>
        
        <div className="flex items-center gap-3">
          {headerAction}
          {filterOptions && onFilterChange && (
            <Select value={filterValue} onValueChange={onFilterChange}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl bg-white border-slate-200 text-xs font-bold">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="font-bold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-2xl" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
