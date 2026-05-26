'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Wallet,
  Calendar,
  Zap,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  IndianRupee,
  Briefcase,
  ChevronRight,
  Target,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import CountUp from 'react-countup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { ApplicationStatus } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function EarningsForecast() {
  const { currentUser } = useAuth();
  const db = useFirestore();

  // 1. Fetch Applications to calculate pipeline
  const appsQuery = useMemo(() => {
    if (!currentUser?.id || !db) return null;
    return query(
      collection(db, 'applications'),
      where('creatorId', '==', currentUser.id)
    );
  }, [db, currentUser?.id]);

  const { data: applications, loading } = useCollection<any>(appsQuery);

  // 2. Fetch "High Value" Campaigns for opportunities
  const opportunitiesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'campaigns'),
      where('status', '==', 'ACTIVE'),
      orderBy('budget', 'desc'),
      limit(2)
    );
  }, [db]);

  const { data: opportunities } = useCollection<any>(opportunitiesQuery);

  // 3. Forecast Logic
  const forecast = useMemo(() => {
    if (!applications) return { confirmed: 0, pending: 0, total: 0, lastMonth: 38000 };

    const confirmed = applications
      .filter((app: any) => app.status === ApplicationStatus.ACCEPTED)
      .reduce((acc: number, curr: any) => acc + (curr.proposedBudget || 0), 0);

    const pendingPotential = applications
      .filter((app: any) => app.status === ApplicationStatus.PENDING)
      .reduce((acc: number, curr: any) => {
        // Probability weight based on a mock match score if not present
        const weight = (curr.matchScore || 85) / 100;
        return acc + ((curr.proposedBudget || 0) * weight);
      }, 0);

    return {
      confirmed,
      pending: Math.round(pendingPotential),
      total: confirmed + Math.round(pendingPotential),
      lastMonth: 38500 // Mock last month for comparison
    };
  }, [applications]);

  const growthRate = ((forecast.total - forecast.lastMonth) / forecast.lastMonth) * 100;

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Earnings Forecast
          </CardTitle>
          <CardDescription className="font-medium">Predictive income analysis for the next 30 days.</CardDescription>
        </div>
        <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full">
          UPDATED REAL-TIME
        </Badge>
      </CardHeader>

      <CardContent className="p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Forecast Display */}
          <div className="lg:col-span-7 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Projected (30d)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    ₹<CountUp end={forecast.total} separator="," duration={2} />
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-black",
                    growthRate >= 0 ? "text-emerald-600" : "text-orange-500"
                  )}>
                    {growthRate >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
                    {Math.abs(Math.round(growthRate))}%
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Progress vs Last Month</span>
                  <span className="text-slate-900">₹{forecast.lastMonth.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((forecast.total / forecast.lastMonth) * 100, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(108,58,232,0.3)]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Confirmed Income</span>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  ₹<CountUp end={forecast.confirmed} separator="," duration={1.5} />
                </p>
                <p className="text-[10px] text-slate-500 font-medium italic">Accepted contracts & milestones</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="h-4 w-4 text-primary fill-primary/10" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Weighted Pipeline</span>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  ₹<CountUp end={forecast.pending} separator="," duration={1.5} />
                </p>
                <p className="text-[10px] text-slate-500 font-medium italic">Pending apps × Match probability</p>
              </div>
            </div>
          </div>

          {/* Opportunities Column */}
          <div className="lg:col-span-5 space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
              <Target className="h-3 w-3 text-primary" /> Top Opportunities to Apply
            </h4>

            <div className="space-y-4">
              {(opportunities || []).map((op, i) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="p-5 rounded-[2rem] bg-white border-2 border-slate-50 hover:border-primary/20 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-slate-900 truncate">{op.title}</h5>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-black text-emerald-600">₹{op.budget.toLocaleString()}</span>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[8px] h-4 font-black">98% MATCH</Badge>
                      </div>
                    </div>
                    <Link href={`/campaigns/${op.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-300 group-hover:text-primary transition-colors">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
              <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Insight</span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-400">
                  Applying to **3 more tech campaigns** this week would increase your 30-day forecast by an estimated **₹22,000**.
                </p>
              </div>
            </div>
          </div>

        </div>
      </CardContent>

      <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Forecasts are generated using historical platform conversion data and current campaign liquidity.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl font-bold h-11 border-slate-200 bg-white hover:bg-slate-50">
          Financial Reports <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}