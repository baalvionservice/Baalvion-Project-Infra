'use client';

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BaseCard } from './BaseCard';
import { Zap, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatorCardProps {
  name: string;
  handle: string;
  image?: string;
  niches: string[];
  followers: string;
  er: string;
  matchScore: number;
  isVerified?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CreatorCard = memo(({
  name,
  handle,
  image,
  niches,
  followers,
  er,
  matchScore,
  isVerified,
  className,
  onClick
}: CreatorCardProps) => {
  return (
    <BaseCard className={cn("flex flex-col h-full", className)} onClick={onClick}>
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md ring-4 ring-primary/5">
              <AvatarImage src={image} alt={name} loading="lazy" />
              <AvatarFallback className="bg-primary/5 text-primary font-black text-lg">{name[0]}</AvatarFallback>
            </Avatar>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
              </div>
            )}
          </div>
          <div className="bg-primary/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-primary/10">
            <Zap className="h-3 w-3 text-primary fill-primary" />
            <span className="text-[10px] font-black text-primary uppercase">{matchScore}% Match</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 leading-tight truncate">{name}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{handle}</p>
        </div>
      </div>

      <div className="p-6 pt-2 flex-1 space-y-6">
        <div className="flex flex-wrap gap-1.5">
          {niches.map((n) => (
            <Badge key={n} variant="secondary" className="bg-slate-50 text-slate-500 border-none font-bold text-[9px] uppercase tracking-tighter px-2.5 py-1">
              {n}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> Reach
            </p>
            <p className="text-sm font-black text-slate-900">{followers}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5 text-emerald-500" /> Engagement
            </p>
            <p className="text-sm font-black text-emerald-600">{er}</p>
          </div>
        </div>
      </div>
    </BaseCard>
  );
});

CreatorCard.displayName = 'CreatorCard';
