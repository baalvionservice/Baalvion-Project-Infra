'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Zap, 
  ArrowUpRight,
  ShieldCheck,
  Target,
  Users,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HealthStats {
  applicationRate: number; // 0-100
  acceptanceRate: number; // 0-100
  submissionTimeliness: number; // 0-100
  approvalRate: number; // 0-100
  spotsFilled: number;
  totalSpots: number;
}

interface HealthMonitorProps {
  campaignId: string;
  stats?: HealthStats;
  className?: string;
}

export function CampaignHealthMonitor({ campaignId, stats, className }: HealthMonitorProps) {
  // Default mock stats for prototype if none provided
  const data = useMemo(() => stats || {
    applicationRate: 85,
    acceptanceRate: 40,
    submissionTimeliness: 92,
    approvalRate: 100,
    spotsFilled: 2,
    totalSpots: 5
  }, [stats]);

  const healthScore = useMemo(() => {
    return Math.round(
      (data.applicationRate * 0.25) +
      (data.acceptanceRate * 0.25) +
      (data.submissionTimeliness * 0.25) +
      (data.approvalRate * 0.25)
    );
  }, [data]);

  const getHealthConfig = (score: number) => {
    if (score >= 80) return { 
      label: 'HEALTHY', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-100', 
      icon: CheckCircle2,
      desc: 'Campaign is performing at peak efficiency.'
    };
    if (score >= 50) return { 
      label: 'NEEDS ATTENTION', 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      border: 'border-orange-100', 
      icon: AlertCircle,
      desc: 'Minor friction points detected in the hiring funnel.'
    };
    return { 
      label: 'AT RISK', 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-100', 
      icon: ShieldAlert,
      desc: 'Critical issues detected. Project timeline may be impacted.'
    };
  };

  const health = getHealthConfig(healthScore);

  const alerts = useMemo(() => {
    const list = [];
    if (data.acceptanceRate < 50) list.push({
      text: `Only ${data.spotsFilled}/${data.totalSpots} creators accepted - consider increasing budget per creator to attract top talent.`,
      icon: Zap,
      color: 'text-orange-600'
    });
    if (data.submissionTimeliness < 80) list.push({
      text: 'Submissions are trending late - check creator messages for potential blockers.',
      icon: Clock,
      color: 'text-red-600'
    });
    if (data.applicationRate > 90 && data.spotsFilled < data.totalSpots) list.push({
      text: 'High interest detected! Review pending applications to secure creators before they take other jobs.',
      icon: TrendingUp,
      color: 'text-primary'
    });
    return list;
  }, [data]);

  return (
    <Card className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Campaign Health Monitor
          </CardTitle>
          <CardDescription className="font-medium">Real-time diagnostic for ID #{campaignId.substring(0, 8)}</CardDescription>
        </div>
        <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border-none", health.bg, health.color)}>
          <health.icon className="h-3.5 w-3.5 mr-1.5" />
          {health.label}
        </Badge>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Overall Score Circle */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4">
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="stroke-slate-100 fill-none"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  className={cn("fill-none transition-all duration-1000", 
                    healthScore >= 80 ? "stroke-emerald-500" : healthScore >= 50 ? "stroke-orange-500" : "stroke-red-500"
                  )}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={440}
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * healthScore) / 100 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{healthScore}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Index</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium text-center max-w-[200px]">
              {health.desc}
            </p>
          </div>

          {/* Right: Detailed Vector Breakdown */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {[
                { label: 'Hiring Velocity', val: data.applicationRate, icon: Users, color: 'text-primary' },
                { label: 'Creator Interest', val: data.acceptanceRate, icon: Target, color: 'text-orange-500' },
                { label: 'Delivery Integrity', val: data.submissionTimeliness, icon: Clock, color: 'text-blue-500' },
                { label: 'Quality Approval', val: data.approvalRate, icon: ShieldCheck, color: 'text-emerald-500' },
              ].map((vector, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <vector.icon className={cn("h-4 w-4", vector.color)} />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{vector.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{vector.val}%</span>
                  </div>
                  <Progress value={vector.val} className="h-1.5 bg-slate-50" />
                </div>
              ))}
            </div>

            {/* Actionable Alerts Area */}
            <div className="pt-6 border-t">
              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                <Lightbulb className="h-3 w-3" /> AI Optimization Alerts
              </h5>
              <div className="space-y-3">
                {alerts.length > 0 ? alerts.map((alert, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 group hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0", alert.color)}>
                      <alert.icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                      {alert.text}
                    </p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-auto text-slate-300 group-hover:text-primary">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                    <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600/20" />
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">No critical optimizations needed at this time.</p>
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

function ShieldAlert(props: any) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
