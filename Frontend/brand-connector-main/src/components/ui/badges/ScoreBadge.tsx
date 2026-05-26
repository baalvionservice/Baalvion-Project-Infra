'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function ScoreBadge({ score, label, showIcon = true, className }: ScoreBadgeProps) {
  // Logic-driven color scale
  const getColor = (s: number) => {
    if (s >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (s >= 70) return 'text-primary bg-primary/5 border-primary/10';
    if (s >= 50) return 'text-orange-500 bg-orange-50 border-orange-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const colorClasses = getColor(score);

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-black text-[10px] uppercase tracking-tighter shadow-sm transition-all hover:scale-105",
      colorClasses,
      className
    )}>
      {showIcon && <Zap className="h-3 w-3 fill-current" />}
      <span>{score}% {label || 'Match'}</span>
    </div>
  );
}
