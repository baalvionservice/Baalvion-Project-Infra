'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NicheBadgeProps {
  niche: string;
  className?: string;
}

export function NicheBadge({ niche, className }: NicheBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-white border-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 h-5 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all",
        className
      )}
    >
      {niche}
    </Badge>
  );
}
