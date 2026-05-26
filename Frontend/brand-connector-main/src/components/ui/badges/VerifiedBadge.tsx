'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export function VerifiedBadge({ size = 'md', className, showTooltip = true }: VerifiedBadgeProps) {
  const sizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const badge = (
    <div className={cn("inline-flex items-center justify-center shrink-0", className)}>
      <CheckCircle2 
        className={cn(
          "text-blue-500 fill-blue-500/10 transition-transform hover:scale-110",
          sizeMap[size]
        )} 
      />
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white border-none rounded-xl px-3 py-1.5 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest">Verified Partner</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
