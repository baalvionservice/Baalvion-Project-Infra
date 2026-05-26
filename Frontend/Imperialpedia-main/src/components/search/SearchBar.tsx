'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Standardized Search Input node.
 */
export const SearchBar = ({ 
  value, 
  onChange, 
  onFocus, 
  className, 
  placeholder = "Search countries, companies, industries, technologies...",
  autoFocus
}: SearchBarProps) => {
  return (
    <div className={cn("relative w-full group", className)}>
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="pl-12 h-12 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-background border border-white/10 text-[9px] font-bold text-muted-foreground pointer-events-none group-focus-within:hidden">
        <span>CTRL</span>
        <span>K</span>
      </div>
    </div>
  );
};
