'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlanTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

interface PlanBadgeProps {
  tier: PlanTier | string;
  className?: string;
}

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  STARTER: { label: 'Starter', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Zap },
  GROWTH: { label: 'Growth', color: 'bg-primary text-white border-primary shadow-lg shadow-primary/20', icon: Star },
  ENTERPRISE: { label: 'Enterprise', color: 'bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-900/10', icon: Crown },
};

export function PlanBadge({ tier, className }: PlanBadgeProps) {
  const config = PLAN_CONFIG[tier.toUpperCase()] || PLAN_CONFIG.STARTER;
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        "gap-1.5 px-3 py-1 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl border",
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3 fill-current" />
      {config.label}
    </Badge>
  );
}
