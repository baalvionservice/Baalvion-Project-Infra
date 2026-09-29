'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  LineChart as LineIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Tooltip 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface HealthMetric {
  label: string;
  value: number;
  weight: number;
  icon: any;
  color: string;
}

const TREND_DATA = [
  { day: 'Mon', score: 82 },
  { day: 'Tue', score: 84 },
  { day: 'Wed', score: 81 },
  { day: 'Thu', score: 79 },
  { day: 'Fri', score: 85 },
  { day: 'Sat', score: 88 },
  { day: 'Sun', score: 86 },
];

export function PlatformHealthMonitor() {
  // Mock live data - in production these would come from Firestore aggregations
  const rawStats = {
    completion: 92,
    retention: 78,
    returnRate: 65,
    paymentSuccess: 99,
    disputeRate: 4 // Lower is better
  };

  const compositeScore = useMemo(() => {
    return Math.round(
      (rawStats.completion * 0.25) +
      (rawStats.retention * 0.25) +
      (rawStats.returnRate * 0.20) +
      (rawStats.paymentSuccess * 0.20) +
      ((100 - rawStats.disputeRate) * 0.10)
    );
  }, [rawStats]);

  const isAtRisk = compositeScore < 75;

  const metrics: HealthMetric[] = [
    { label: 'Campaign Completion', value: rawStats.completion, weight: 25, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Creator Retention', value: rawStats.retention, weight: 25, icon: TrendingUp, color: 'text-primary' },
    { label: 'Brand Return Rate', value: rawStats.returnRate, weight: 20, icon: Zap, color: 'text-orange-500' },
    { label: 'Payment Success', value: rawStats.paymentSuccess, weight: 20, icon: Activity, color: 'text-blue-500' },
    { label: 'Dispute Rate', value: rawStats.disputeRate, weight: 10, icon: AlertCircle, color: 'text-red-500' },
  ];

  const gaugeData = [
    { name: 'Health', value: compositeScore },
    { name: 'Remaining', value: 100 - compositeScore },
  ];

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Marketplace Stability Index
          </CardTitle>
          <CardDescription className="font-medium">Composite platform health based on weighted operational vectors.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border-none shadow-sm",
            isAtRisk ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          )}>
            {isAtRisk ? 'SYSTEM WARNING' : 'SYSTEM OPTIMAL'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Gauge & Sparkline */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-8">
            <div className="relative h-56 w-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell 
                      fill={isAtRisk ? '#EF4444' : '#6C3AE8'} 
                      className="drop-shadow-[0_0_10px_rgba(108,58,232,0.3)]"
                    />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{compositeScore}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Health Score</span>
              </div>
            </div>

            {/* Sparkline Trend */}
            <div className="w-full bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <LineIcon className="h-3 w-3" /> 7-Day Velocity
                </p>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                  <ArrowUpRight className="h-3 w-3" /> +4.2%
                </div>
              </div>
              <div className="h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={TREND_DATA}>
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6C3AE8" 
                      strokeWidth={3} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Metric Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Stability Vectors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {metrics.map((metric, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <metric.icon className={cn("h-4 w-4", metric.color)} />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{metric.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{metric.value}{metric.label === 'Dispute Rate' ? '%' : '%'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.label === 'Dispute Rate' ? 100 - (metric.value * 10) : metric.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", metric.color.replace('text-', 'bg-'))}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Weight: {metric.weight}% of total</p>
                </div>
              ))}
            </div>

            {/* Alert Condition UI */}
            <AnimatePresence>
              {isAtRisk && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-8 p-6 rounded-3xl bg-red-50 border-2 border-red-100 flex items-start gap-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-red-900 uppercase">Critical Degradation Detected</h5>
                    <p className="text-xs text-red-700 font-medium leading-relaxed mt-1">
                      Platform health has dropped below the 75-point threshold. Primary cause: **Rise in Payment Failures**. Audit manual gateway reconciliation logs immediately.
                    </p>
                    <Button variant="link" className="text-red-600 font-black text-[10px] uppercase p-0 h-auto mt-2">
                      Launch Emergency Audit <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </CardContent>

      <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-md uppercase tracking-wider">
            Health Index is recalculated every 15 minutes based on marketplace transactional depth and user engagement retention logs.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl font-bold h-11 border-slate-200 bg-white hover:bg-slate-50 group">
          Detailed Systems Report <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function ChevronRight(props: any) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
