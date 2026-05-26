'use client';

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Target, 
  Activity, 
  AlertCircle,
  Info,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Button } from '../ui';

export interface CreatorScoreData {
  authenticity: number; // 30%
  engagement: number;   // 25%
  delivery: number;     // 20%
  safety: number;       // 15%
  growth: number;       // 10%
}

interface ScoreCardProps {
  scores: CreatorScoreData;
  displayName: string;
  category?: string;
  platformAvg?: number;
  className?: string;
}

const SCORE_CONFIG = [
  { key: 'authenticity', label: 'Authenticity', weight: 30, color: '#6C3AE8', icon: ShieldCheck, desc: 'Audience quality and bot risk factor' },
  { key: 'engagement', label: 'Engagement Quality', weight: 25, color: '#10B981', icon: Zap, desc: 'Real comments and sharing velocity' },
  { key: 'delivery', label: 'Delivery Rate', weight: 20, color: '#3B82F6', icon: CheckCircle2, desc: 'Reliability and adherence to deadlines' },
  { key: 'safety', label: 'Brand Safety', weight: 15, color: '#F97316', icon: Target, desc: 'Compliance with platform and FTC guidelines' },
  { key: 'growth', label: 'Growth Trend', weight: 10, color: '#EC4899', icon: TrendingUp, desc: 'Long-term audience expansion rate' },
];

export function ScoreCard({ 
  scores, 
  displayName, 
  category = 'Global', 
  platformAvg = 72,
  className 
}: ScoreCardProps) {
  
  const overallScore = Math.round(
    (scores.authenticity * 0.3) +
    (scores.engagement * 0.25) +
    (scores.delivery * 0.2) +
    (scores.safety * 0.15) +
    (scores.growth * 0.1)
  );

  const chartData = SCORE_CONFIG.map(item => ({
    name: item.label,
    value: item.weight,
    score: scores[item.key as keyof CreatorScoreData],
    fill: item.color
  }));

  const diff = overallScore - platformAvg;

  return (
    <Card className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary fill-primary" />
            AI Performance Score
          </CardTitle>
          <CardDescription className="font-medium">Verified benchmarks for {displayName}</CardDescription>
        </div>
        <Badge className="bg-primary text-white border-none font-black text-[10px] tracking-widest px-3 py-1">
          TOP 1% {category.toUpperCase()}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Ring Chart */}
          <div className="lg:col-span-5 relative h-[300px] flex items-center justify-center">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill} 
                        style={{ opacity: 0.1 + (entry.score / 100) * 0.9 }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs">
                            <p className="font-black uppercase tracking-widest mb-1">{data.name}</p>
                            <p className="font-medium opacity-80 mb-2">Weight: {data.value}%</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black">{data.score}%</span>
                              <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white" style={{ width: `${data.score}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Center Score Display */}
            <div className="text-center z-10">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Overall</p>
                <h3 className="text-6xl font-black text-slate-900 tracking-tighter">{overallScore}</h3>
                <div className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-black uppercase mt-2 px-2 py-0.5 rounded-lg",
                  diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                  {Math.abs(diff)}% {diff >= 0 ? 'Above' : 'Below'} Avg
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right: Breakdown Detail */}
          <div className="lg:col-span-7 space-y-6">
            <TooltipProvider>
              {SCORE_CONFIG.map((item, i) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", `bg-[${item.color}]/10`)} style={{ backgroundColor: `${item.color}15` }}>
                        <item.icon className="h-4 w-4" style={{ color: item.color }} />
                      </div>
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">{item.label}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-slate-300 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white rounded-xl p-3 border-none shadow-xl">
                          <p className="text-xs font-bold">{item.desc}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="text-sm font-black text-slate-900">{scores[item.key as keyof CreatorScoreData]}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${scores[item.key as keyof CreatorScoreData]}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </div>

        </div>
      </CardContent>

      <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketplace Verdict</p>
            <p className="text-xs font-bold text-slate-700">Verified high-performance profile. Recommended for conversion campaigns.</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl font-bold bg-white border-slate-200 h-11 px-8 text-xs uppercase tracking-widest group">
          Detailed Audit Log <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
