'use client';

import React from 'react';
import { IndianRupee, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  currency?: string;
  className?: string;
}

export function PriceInput({ value, onChange, label, placeholder = "0", currency = "₹", className }: PriceInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
    onChange(val);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="font-bold text-slate-700">{label}</Label>
          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Info className="h-3 w-3" />
            Market Value
          </div>
        </div>
      )}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-slate-400 font-black text-lg group-focus-within:text-primary transition-colors">
          {currency === '₹' ? <IndianRupee className="h-5 w-5" /> : currency}
        </div>
        <Input
          type="text"
          value={value === 0 ? '' : value.toLocaleString()}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-12 h-14 rounded-2xl bg-slate-50 border-none font-black text-2xl text-slate-900 focus-visible:ring-primary/20 focus-visible:bg-white"
        />
      </div>
    </div>
  );
}
