'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  value: string | number;
  direction?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function TrendBadge({ value, direction = 'up', className }: TrendBadgeProps) {
  const isUp = direction === 'up';
  const isDown = direction === 'down';

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter",
      isUp ? "bg-emerald-50 text-emerald-600" : 
      isDown ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500",
      className
    )}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : isDown ? <ArrowDownRight className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {value}
    </div>
  );
}
