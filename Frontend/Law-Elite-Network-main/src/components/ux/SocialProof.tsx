"use client";

import React from 'react';
import { Zap, TrendingUp, Users } from "lucide-react";

/**
 * @fileOverview SocialProof
 * Behavioral signals to simulate platform activity and build trust.
 */
export default function SocialProof() {
  return (
    <div className="glass-panel p-4 rounded-2xl border-accent/20 bg-accent/5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <Zap className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-white uppercase tracking-widest">Marketplace Velocity</p>
          <p className="text-[9px] text-muted-foreground italic mt-0.5">High demand practitioner detected</p>
        </div>
      </div>
      
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Recent Activity:
          </span>
          <span className="text-accent">45+ Sessions Today</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Growth Match:
          </span>
          <span className="text-emerald-400">Top 1% Ranked</span>
        </div>
      </div>
    </div>
  );
}
