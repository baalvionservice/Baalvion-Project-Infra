
'use client';

import React from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function ScoringInsights() {
  const { insights } = useLeadStore();

  if (!insights) return null;

  const total = insights.high + insights.medium + insights.low;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Quality</p>
            <h3 className="text-2xl font-black text-slate-900">{insights.avgScore}</h3>
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 col-span-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Distribution</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{total} Total Leads</span>
        </div>
        
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(insights.high / total) * 100}%` }}
            className="h-full bg-red-500" 
            title={`High: ${insights.high}`}
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(insights.medium / total) * 100}%` }}
            className="h-full bg-yellow-400" 
            title={`Medium: ${insights.medium}`}
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(insights.low / total) * 100}%` }}
            className="h-full bg-slate-300" 
            title={`Low: ${insights.low}`}
          />
        </div>

        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase">High ({insights.high})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Medium ({insights.medium})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Low ({insights.low})</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
