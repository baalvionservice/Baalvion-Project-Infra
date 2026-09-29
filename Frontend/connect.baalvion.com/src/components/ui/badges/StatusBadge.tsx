'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Zap, 
  FileText,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'COMPLETED' | 'DRAFT' | 'PAUSED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE: { label: 'Live', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: Zap },
  PENDING: { label: 'Pending', color: 'bg-orange-100 text-orange-600 border-orange-200', icon: Clock },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-600 border-red-200', icon: XCircle },
  COMPLETED: { label: 'Finished', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: CheckCircle2 },
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: FileText },
  PAUSED: { label: 'Paused', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Pause },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toUpperCase()] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 px-2.5 py-0.5 font-black text-[10px] uppercase tracking-widest rounded-full border shadow-sm",
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3 stroke-[3]" />
      {config.label}
    </Badge>
  );
}
