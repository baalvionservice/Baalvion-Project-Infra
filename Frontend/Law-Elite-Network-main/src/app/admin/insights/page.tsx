"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { getAdvancedAnalytics } from "@/services/analyticsService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import Charts from "@/components/admin/Charts";
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  IndianRupee, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview InsightsPage
 * Specialized executive dashboard for high-level business intelligence.
 */
export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['admin']}>
        <InsightsContent />
      </RoleGuard>
    </ProtectedRoute>
  );
}

function InsightsContent() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await getAdvancedAnalytics();
        setData(res);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-12 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Command
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 px-2 py-1 rounded flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Strategic Intelligence
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="font-headline text-4xl italic text-white">Business Insights</h1>
            <p className="text-muted-foreground text-sm italic mt-2">Audit platform growth velocity and revenue synchronization trends.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 glass-panel rounded-3xl border-white/5">
            <Loader2 className="w-10 h-10 animate-spin text-accent opacity-50" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Intelligence Ledger...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InsightCard 
                label="Global Membership" 
                value={data.totalUsers} 
                icon={<Users className="w-4 h-4 text-accent" />} 
                sub="Total Registered" 
              />
              <InsightCard 
                label="Engagement Volume" 
                value={data.totalBookings} 
                icon={<CalendarCheck className="w-4 h-4 text-accent" />} 
                sub="Successful Briefs" 
              />
              <InsightCard 
                label="Settled Revenue" 
                value={`₹${data.revenue.toLocaleString()}`} 
                icon={<IndianRupee className="w-4 h-4 text-emerald-400" />} 
                sub="Gross Settlement" 
                isRevenue
              />
            </div>

            {/* Main Trend Chart */}
            <div className="glass-panel p-8 rounded-3xl border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline text-xl italic text-white flex items-center gap-3">
                  <Activity className="w-5 h-5 text-accent" /> Engagement Velocity
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">6-Month Rolling Period</span>
                  <Zap className="w-3 h-3 text-accent animate-pulse" />
                </div>
              </div>
              
              <Charts data={data.chartData} />
              
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground/60 italic">Intelligence reports are synchronized with the platform's secure escrow ledgers.</p>
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">
                  <ShieldCheck className="w-3 h-3" /> Audit Verified
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InsightCard({ label, value, icon, sub, isRevenue = false }: any) {
  return (
    <div className="glass-panel p-6 rounded-2xl border-white/5 executive-card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
          <p className="text-[9px] text-accent/60 font-medium uppercase mt-0.5">{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-headline italic ${isRevenue ? 'text-white' : 'text-white'}`}>{value}</p>
    </div>
  );
}
