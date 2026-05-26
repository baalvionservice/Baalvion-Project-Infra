'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BaseCard } from './BaseCard';
import { IndianRupee, Clock, Users, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  title: string;
  brand: string;
  logo?: string;
  budget: string;
  deadline: string;
  spots: number;
  totalSpots: number;
  matchScore?: number;
  platform?: string;
  status?: string;
  className?: string;
  onClick?: () => void;
}

export const CampaignCard = memo(({
  title,
  brand,
  logo,
  budget,
  deadline,
  spots,
  totalSpots,
  matchScore,
  platform,
  status = 'ACTIVE',
  className,
  onClick
}: CampaignCardProps) => {
  const fillPercentage = ((totalSpots - spots) / totalSpots) * 100;

  return (
    <BaseCard className={cn("flex flex-col h-full", className)} onClick={onClick}>
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-slate-50 shadow-sm">
            <AvatarImage src={logo} alt={brand} loading="lazy" />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">{brand[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-end gap-2">
            {matchScore && (
              <div className="bg-primary/5 px-2.5 py-1 rounded-full flex items-center gap-1 border border-primary/10">
                <Zap className="h-3 w-3 text-primary fill-primary" />
                <span className="text-[10px] font-black text-primary">{matchScore}% MATCH</span>
              </div>
            )}
            <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-bold text-[9px] uppercase">
              {platform || 'Multiple'}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{brand}</p>
          <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
            {title}
          </h3>
        </div>
      </div>

      <div className="p-6 pt-2 flex-1 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span>Hiring Progress</span>
            <span>{totalSpots - spots} / {totalSpots} Hired</span>
          </div>
          <Progress value={fillPercentage} className="h-1 bg-slate-50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Budget</p>
              <p className="text-sm font-black text-slate-900">{budget}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Ends</p>
              <p className="text-xs font-bold text-slate-900 truncate">{deadline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-tighter">
          <Users className="h-3.5 w-3.5" />
          <span>{spots} SPOTS LEFT</span>
        </div>
        <button className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">
          View Brief
        </button>
      </div>
    </BaseCard>
  );
});

CampaignCard.displayName = 'CampaignCard';
