
'use client';

import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Zap } from 'lucide-react';
import { AuthenticityReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuthenticityRadarProps {
  report: AuthenticityReport;
  className?: string;
}

export function AuthenticityRadar({ report, className }: AuthenticityRadarProps) {
  const chartData = [
    { subject: 'Growth', A: report.breakdown.growth, fullMark: 100 },
    { subject: 'Engagement', A: report.breakdown.engagement, fullMark: 100 },
    { subject: 'Ratio', A: report.breakdown.ratio, fullMark: 100 },
    { subject: 'Maturity', A: report.breakdown.maturity, fullMark: 100 },
    { subject: 'Geo', A: report.breakdown.geo, fullMark: 100 },
  ];

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'HIGH': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: ShieldAlert, label: 'High Risk' };
      case 'MEDIUM': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: AlertTriangle, label: 'Moderate Risk' };
      default: return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ShieldCheck, label: 'Verified Authentic' };
    }
  };

  const risk = getRiskStyles(report.riskLevel);

  return (
    <Card className={cn("border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Authenticity Audit
          </CardTitle>
          <CardDescription className="font-medium">AI-driven audience quality breakdown.</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trust Score</p>
          <p className={cn("text-4xl font-black tracking-tighter", risk.color)}>{report.score}%</p>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Radar Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                />
                <Radar
                  name="Quality"
                  dataKey="A"
                  stroke="#6C3AE8"
                  strokeWidth={3}
                  fill="#6C3AE8"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Flags & Risk */}
          <div className="space-y-8">
            <div className={cn("p-6 rounded-[2rem] border-2 flex items-center gap-4", risk.bg, risk.border)}>
              <div className={cn("h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center", risk.color)}>
                <risk.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Platform Verdict</p>
                <h4 className={cn("text-lg font-black uppercase", risk.color)}>{risk.label}</h4>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Info className="h-3 w-3" /> Audit Intelligence Flags
              </h5>
              <div className="space-y-2">
                {report.flags.length > 0 ? report.flags.map((flag, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 items-start">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                    <p className="text-xs font-bold text-slate-600">{flag}</p>
                  </div>
                )) : (
                  <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 items-center">
                    <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600/20" />
                    <p className="text-xs font-bold text-emerald-700">Audience behavior matches natural patterns.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
