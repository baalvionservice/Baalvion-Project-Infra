'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BaseCard } from './BaseCard';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: any;
  color?: string;
  bg?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'up',
  icon: Icon,
  color = 'text-primary',
  bg = 'bg-primary/5',
  className
}: StatCardProps) {
  return (
    <BaseCard className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-colors", bg, color)}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg",
            trendDirection === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trendDirection === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <h3 className="text-2xl font-black mt-1 text-slate-900 tracking-tight">{value}</h3>
    </BaseCard>
  );
}
