'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCcw } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filterName: string;
  options: FilterOption[];
  paramKey: string;
}

/**
 * Responsive filter UI for discovery pages.
 */
export const FilterBar = ({ filterName, options, paramKey }: FilterBarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramKey) || 'all';

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }
    params.set('page', '1'); // Reset to page 1 on filter
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(window.location.pathname);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-md sticky top-20 z-30 shadow-lg">
      <div className="flex-1 flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
          <Filter size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Triage Matrix</span>
        </div>
        
        <div className="flex-1 max-w-xs">
          <Select value={currentValue} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-11 bg-background/50 border-white/10 rounded-xl font-bold text-xs uppercase">
              <SelectValue placeholder={`Filter by ${filterName}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filterName}s</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={clearFilters}
        className="h-11 px-6 rounded-xl font-bold text-xs uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        <RefreshCcw size={14} className="mr-2" /> Reset Matrix
      </Button>
    </div>
  );
};
