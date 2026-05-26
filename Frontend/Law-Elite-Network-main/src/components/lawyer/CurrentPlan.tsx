"use client";

import React from 'react';
import { Plan, Subscription } from '@/types/subscription';
import { ShieldCheck, Calendar, Zap, Award } from 'lucide-react';

interface CurrentPlanProps {
  plan?: Plan;
  subscription?: Subscription;
}

/**
 * @fileOverview CurrentPlan
 * Displays the practitioner's active network standing and status.
 */
export default function CurrentPlan({ plan, subscription }: CurrentPlanProps) {
  if (!plan || !subscription) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-white/5 border-dashed flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
        <Zap className="w-6 h-6 text-muted-foreground/30" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">No Active Standing Detected</p>
      </div>
    );
  }

  const isElite = plan.id === 'elite';

  return (
    <div className="glass-panel p-6 rounded-2xl border-accent/20 bg-accent/5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            {isElite ? <Award className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Active Tier</p>
            <h3 className="font-headline text-2xl italic text-white">{plan.name} Standing</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-[0.2em]">
            Verified Operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div className="space-y-1">
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-accent" /> Anniversary Date
          </p>
          <p className="text-xs font-medium text-white">
            {new Date(subscription.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 justify-end">
            Renewal Protocol <Zap className="w-3 h-3 text-accent" />
          </p>
          <p className="text-xs font-medium text-white">
            {new Date(subscription.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>
        </div>
      </div>
    </div>
  );
}
