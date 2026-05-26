"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Trophy, Medal, Star, TrendingUp, ChevronRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardProps {
  lawyers: any[];
}

/**
 * @fileOverview Leaderboard
 * High-fidelity visualization of the network's top-performing practitioners.
 */
export default function Leaderboard({ lawyers }: LeaderboardProps) {
  return (
    <Card className="glass-panel border-white/5 overflow-hidden shadow-2xl">
      <CardHeader className="bg-white/5 border-b border-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="font-headline text-2xl italic text-white">Network Elite</CardTitle>
              <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-0.5">Top Performing Practitioners</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-500/5">
            Live Rankings <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {lawyers.map((lawyer, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            
            return (
              <div 
                key={lawyer.id} 
                className={`p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors relative ${isTop3 ? 'bg-accent/5' : ''}`}
              >
                {isTop3 && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_15px_rgba(167,139,250,0.5)]" />
                )}
                
                <div className="flex items-center gap-5">
                  <div className="flex flex-col items-center justify-center w-8">
                    {rank === 1 && <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-lg" />}
                    {rank === 2 && <Medal className="w-5 h-5 text-slate-300 drop-shadow-lg" />}
                    {rank === 3 && <Medal className="w-5 h-5 text-amber-600 drop-shadow-lg" />}
                    {rank > 3 && <span className="text-xs font-bold text-muted-foreground">#{rank}</span>}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline text-lg italic text-white group-hover:text-accent transition-colors">
                        {lawyer.name}
                      </h4>
                      {isTop3 && <ShieldCheck className="w-3.5 h-3.5 text-accent" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {lawyer.specialization}
                      </span>
                      <span className="text-white/10">•</span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-accent/70">
                        <Star className="w-2.5 h-2.5 fill-accent/70" /> {lawyer.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-sm font-headline italic text-white">{lawyer.performanceScore}</span>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Intelligence Score</p>
                  
                  <Link href={`/lawyer/${lawyer.id}`} className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    Audit Dossier <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 bg-white/5 border-t border-white/5 text-center">
          <p className="text-[9px] text-muted-foreground italic max-w-xs mx-auto">
            Rankings are algorithmically calculated based on engagement volume, verified ratings, and marketplace activity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
