
"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLawyerDashboardData } from "@/hooks/useLawyerDashboardData";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { 
  IndianRupee, 
  TrendingUp, 
  Loader2, 
  ShieldCheck, 
  ArrowLeft,
  CalendarCheck,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

/**
 * @fileOverview LawyerEarningsPage
 * High-fidelity financial audit portal for legal practitioners.
 */
export default function LawyerEarningsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <EarningsContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function EarningsContent() {
  const { user } = useAuthStore();
  const { earnings, appointments, loading } = useLawyerDashboardData(user?.id);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Revenue Ledger...</p>
      </div>
    );
  }

  const upcomingRevenue = appointments.filter(a => a.status === 'confirmed').length * 5000;

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Marketplace Revenue
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Financial Audit</h1>
          <p className="text-slate-500 text-sm font-medium italic">Audit your settled earnings and projected consultation revenue within the network.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl px-6 h-11 font-bold uppercase text-[10px] tracking-widest">
            <FileText className="w-4 h-4 mr-2" /> Export Ledger
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard label="Settled Earnings" value={`₹${earnings.total.toLocaleString()}`} sub="Verified Funds" icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Escrow Secured" value={`₹${upcomingRevenue.toLocaleString()}`} sub="Projected Intake" icon={<Wallet className="w-4 h-4 text-blue-600" />} />
        <StatCard label="Sessions Handled" value={earnings.completed} sub="Completed Briefs" icon={<CalendarCheck className="w-4 h-4 text-amber-600" />} />
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Recent Settlements
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {appointments.filter(a => a.status === 'completed' || a.status === 'confirmed').length > 0 ? (
            <div className="divide-y divide-slate-100">
              {appointments.filter(a => a.status === 'completed' || a.status === 'confirmed').map((apt) => (
                <div key={apt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Executive Consultation Fee</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Engagement ID: {apt.id.slice(-8)} • {apt.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">₹5,000</p>
                      <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {apt.status === 'completed' ? 'Settled' : 'In Escrow'}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-sm italic text-slate-400 uppercase tracking-widest">No settled transaction records located.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 opacity-40">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Financial Integrity Protocol v4.2.0</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: number | string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group transition-all duration-300 hover:border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{label}</h3>
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{sub}</p>
    </div>
  );
}
