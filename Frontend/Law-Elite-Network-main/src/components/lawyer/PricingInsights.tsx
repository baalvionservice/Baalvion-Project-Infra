"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Sparkles, 
  Zap,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

interface PricingInsightsProps {
  data: {
    current: number;
    suggested: number;
    difference: number;
    demandLevel: string;
    recommendation: string;
  };
}

/**
 * @fileOverview PricingInsights
 * High-fidelity financial optimization module for practitioners.
 */
export default function PricingInsights({ data }: PricingInsightsProps) {
  const isIncrease = data.difference > 0;

  return (
    <Card className="glass-panel border-accent/20 bg-accent/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
      <CardHeader className="bg-white/5 border-b border-white/5 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> Intelligence Pricing Audit
        </CardTitle>
        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${
          data.demandLevel === 'High' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-muted-foreground'
        }`}>
          {data.demandLevel} Demand Match
        </span>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Current Fee</p>
            <p className="text-xl font-headline italic text-white flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-muted-foreground/50" /> {data.current.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Suggested Optimal</p>
            <p className="text-xl font-headline italic text-emerald-400 flex items-center gap-1.5 justify-end">
              <IndianRupee className="w-4 h-4" /> {data.suggested.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncrease ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {isIncrease ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-tight">Market Variance</p>
              <p className={`text-[9px] font-medium uppercase italic ${isIncrease ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isIncrease ? `Potential +₹${data.difference} Lift` : `Adjustment -₹${Math.abs(data.difference)} Advised`}
              </p>
            </div>
          </div>
          <Zap className="w-4 h-4 text-accent opacity-30 animate-pulse" />
        </div>

        <div className="space-y-3">
          <p className="text-[9px] text-muted-foreground italic leading-relaxed text-center px-4">
            "Based on your 5.0 network rating and current engagement velocity, we recommend: <span className="text-white font-bold">{data.recommendation}</span>."
          </p>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-accent/10 group">
            Apply Optimized Fee <ArrowUpRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
