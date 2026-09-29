'use client';

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = "Select items...", className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => 
    options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const toggleOption = (val: string) => {
    const next = value.includes(val) ? value.filter(v => v !== val) : [...value, val];
    onChange(next);
  };

  const removeValue = (val: string) => {
    onChange(value.filter(v => v !== val));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-[44px] rounded-xl border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-left px-3 py-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {value.length === 0 && <span className="text-slate-400 font-medium">{placeholder}</span>}
            {value.map(val => (
              <Badge 
                key={val} 
                variant="secondary" 
                className="bg-primary/5 text-primary border-primary/10 rounded-lg py-0.5 pl-2 pr-1 gap-1 group font-bold"
                onClick={(e) => { e.stopPropagation(); removeValue(val); }}
              >
                {options.find(o => o.value === val)?.label || val}
                <X className="h-3 w-3 text-primary/40 group-hover:text-primary transition-colors" />
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
        <div className="p-3 border-b bg-slate-50/50 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            placeholder="Search options..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[250px]">
          <div className="p-2 space-y-1">
            {filteredOptions.length > 0 ? filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left",
                  value.includes(option.value) ? "bg-primary text-white shadow-md" : "hover:bg-slate-100 text-slate-600"
                )}
              >
                {option.label}
                {value.includes(option.value) && <Check className="h-4 w-4" />}
              </button>
            )) : (
              <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                No matching options
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
