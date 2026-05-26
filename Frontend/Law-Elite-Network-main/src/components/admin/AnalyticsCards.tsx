"use client";

import React from "react";
import { 
  Users, 
  Briefcase, 
  CalendarCheck, 
  TrendingUp, 
  IndianRupee,
  ShieldCheck
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalLawyers: number;
  totalBookings: number;
  revenue: number;
}

/**
 * @fileOverview AnalyticsCards
 * High-fidelity visualization of key platform performance metrics.
 */
export default function AnalyticsCards({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <StatCard 
        label="Global Network" 
        value={data.totalUsers} 
        sub="Registered Members"
        icon={<Users className="w-5 h-5 text-accent" />}
      />

      <StatCard 
        label="Verified Counsel" 
        value={data.totalLawyers} 
        sub="Active Marketplace"
        icon={<Briefcase className="w-5 h-5 text-accent" />}
      />

      <StatCard 
        label="Consultations" 
        value={data.totalBookings} 
        sub="Executive Agenda"
        icon={<CalendarCheck className="w-5 h-5 text-accent" />}
      />

      <StatCard 
        label="Gross Revenue" 
        value={`₹${data.revenue.toLocaleString()}`} 
        sub="Settled Settlements"
        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
        isRevenue
      />

    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  sub, 
  icon, 
  isRevenue = false 
}: { 
  label: string; 
  value: string | number; 
  sub: string;
  icon: React.ReactNode;
  isRevenue?: boolean;
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl border-white/5 executive-card group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-accent/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
          <p className="text-[9px] text-accent/60 font-medium uppercase mt-0.5">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRevenue ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
          {icon}
        </div>
      </div>

      <div className="relative z-10 flex items-baseline gap-2">
        <h2 className={`font-headline text-3xl italic ${isRevenue ? 'text-white' : 'text-white'}`}>
          {value}
        </h2>
        {isRevenue && <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Verified</span>}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 relative z-10">
        <ShieldCheck className="w-3 h-3 text-accent/40" />
        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Synchronized Live</span>
      </div>
    </div>
  );
}
