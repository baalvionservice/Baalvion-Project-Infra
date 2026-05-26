"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLawyerDashboardData } from '@/hooks/useLawyerDashboardData';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import CaseList from '@/components/case/CaseList';
import LawyerBookingCard from '@/components/cards/LawyerBookingCard';
import { 
  ShieldCheck, 
  Loader2, 
  Briefcase, 
  Clock, 
  IndianRupee, 
  MessageSquare, 
  Calendar, 
  Award,
  TrendingUp,
  ChevronRight,
  Bell,
  Zap,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function LawyerDashboardPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <LawyerDashboardContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function LawyerDashboardContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const { 
    profile, 
    cases, 
    appointments, 
    earnings,
    loading,
    stats,
    notifications
  } = useLawyerDashboardData(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 pt-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Practitioner Command
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Greetings, Counsel {profile?.name?.split(' ')[0] || "Member"}
          </h1>
          <p className="text-slate-500 text-sm mt-2 flex items-center gap-2 italic font-medium">
            <Award className="w-3.5 h-3.5 text-blue-600" /> standing: <span className="text-slate-900 font-bold uppercase tracking-tighter">Elite Tier</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl px-6 h-12 font-bold shadow-lg"
            onClick={() => router.push('/lawyer/availability')}
          >
            <Clock className="w-4 h-4 mr-2" /> Chambers Management
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard label="Assigned Briefs" value={stats.totalCases} sub="Total Dossiers" icon={<Briefcase className="w-4 h-4 text-blue-600" />} />
        <StatCard label="Active Strategy" value={stats.activeCases} sub="Managed Matters" icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Today's Session" value={stats.todayApts} sub="Executive Agenda" icon={<Calendar className="w-4 h-4 text-amber-600" />} />
        <StatCard label="Alert Ledger" value={stats.unreadNotifs} sub="Unread Signals" icon={<Bell className="w-4 h-4 text-red-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Intelligence Pulse</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Marketplace Velocity v4.2</p>
                </div>
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] font-bold uppercase px-3 py-1">
                Optimized Tier
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Response Latency</p>
                <p className="text-3xl font-bold text-slate-900">1.4h</p>
                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase">
                  <TrendingUp className="w-3 h-3" /> 12% Lift
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matter Success Rate</p>
                <p className="text-3xl font-bold text-slate-900">94.2%</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase">Network Top 1%</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Conversion</p>
                <p className="text-3xl font-bold text-slate-900">28.5%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Benchmark: 15%</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <CaseList cases={cases} title="Assigned Legal Matters" />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-[#0B1F3A] p-8 rounded-2xl border border-white/5 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-600/30 transition-all duration-700" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Escrow Secured</h3>
              <IndianRupee className="w-5 h-5 text-blue-400" />
            </div>
            <div className="relative z-10 space-y-1 mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Revenue Ledger</p>
              <p className="text-4xl font-bold">₹{earnings.total.toLocaleString()}</p>
            </div>
            <Button asChild className="w-full bg-white text-blue-900 hover:bg-slate-100 font-bold uppercase text-[9px] tracking-widest h-11 rounded-xl relative z-10">
              <Link href="/lawyer/earnings">Audit Settlements <ChevronRight className="ml-1 w-3 h-3" /></Link>
            </Button>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Upcoming Agenda
              </h3>
              <Link href="/appointments" className="text-[9px] font-bold text-blue-600 hover:underline uppercase transition-colors">View All</Link>
            </div>
            {appointments.length > 0 ? (
              appointments.slice(0, 3).map((apt: any) => (
                <LawyerBookingCard key={apt.id} booking={apt} />
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 opacity-50">
                <p className="text-[10px] font-bold uppercase text-slate-400">Agenda Clear</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Network Signals
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {notifications.slice(0, 3).map((n: any) => (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 truncate">System Signal</p>
                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-auto">
                      {n.createdAt ? formatDistanceToNow(new Date(n.createdAt.seconds ? n.createdAt.seconds * 1000 : n.createdAt)) : 'Syncing...'} ago
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight italic truncate pl-10">{n.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: number | string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col group transition-all duration-300 hover:border-blue-300 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{label}</h3>
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1 group-hover:scale-105 origin-left transition-transform duration-500">{value}</div>
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{sub}</p>
    </div>
  );
}
