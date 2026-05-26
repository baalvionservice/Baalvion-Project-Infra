'use client';

import React, { useState } from 'react';
import { X, Plus, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder = "Add tags...", className }: TagInputProps) {
  const [inputValue, setInputValues] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValues('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50/50 border-2 border-slate-100 focus-within:border-primary/20 focus-within:bg-white transition-all min-h-[56px]",
      className
    )}>
      {value.map((tag, i) => (
        <Badge 
          key={i} 
          className="bg-primary/5 text-primary border-primary/10 rounded-lg h-8 pl-3 pr-1.5 gap-2 font-bold group"
        >
          <span className="text-primary/40 font-black">#</span>
          {tag}
          <button 
            type="button" 
            onClick={() => removeTag(i)}
            className="hover:bg-primary/10 rounded-md p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
        placeholder={value.length === 0 ? placeholder : "Add more..."}
        value={inputValue}
        onChange={(e) => setInputValues(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
      />
    </div>
  );
}
