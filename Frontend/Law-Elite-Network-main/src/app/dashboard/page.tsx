"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/DashboardShell';
import CaseList from '@/components/case/CaseList';
import RecommendationFeed from '@/components/dashboard/RecommendationFeed';
import BookingCard from '@/components/cards/BookingCard';
import CreateCaseModal from '@/components/case/CreateCaseModal';
import EmptyDashboard from '@/components/dashboard/EmptyDashboard';
import NextBestAction from '@/components/dashboard/NextBestAction';
import CaseProgressTracker from '@/components/dashboard/CaseProgressTracker';
import FinancialPanel from '@/components/dashboard/FinancialPanel';
import LawyerSnapshot from '@/components/dashboard/LawyerSnapshot';
import CaseTimeline from '@/components/dashboard/CaseTimeline';
import SubscriptionOverview from '@/components/dashboard/SubscriptionOverview';
import { 
  ShieldCheck, 
  Award, 
  Search,
  Clock,
  Briefcase,
  TrendingUp,
  Bell,
  Calendar,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { role, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && role !== 'client') {
      if (role === 'lawyer') router.push('/lawyer/dashboard');
      else if (role === 'admin') router.push('/admin/dashboard');
    }
  }, [role, loading, router]);

  if (loading || (role && role !== 'client')) {
    return <DashboardSkeleton />;
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <DashboardContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, profile } = useAuthContext();
  const router = useRouter();
  
  const { 
    cases, 
    appointments, 
    recentDocuments,
    loading,
    refresh,
    stats,
    error
  } = useDashboardData(user?.uid || user?.userId);

  useEffect(() => {
    const handleStorageChange = () => refresh();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-8 py-20 text-center">
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl max-w-md mx-auto">
          <p className="text-red-600 font-bold uppercase text-xs tracking-widest mb-2">Protocol Sync Failure</p>
          <p className="text-slate-600 text-sm italic mb-6">{error}</p>
          <Button onClick={() => refresh()} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
            Re-Initialize Connection
          </Button>
        </div>
      </div>
    );
  }

  const hasData = cases.length > 0 || appointments.length > 0;
  const primaryCase = cases.length > 0 ? cases[0] : null;
  const assignedLawyer = primaryCase?.assignedLawyerId ? { name: 'Harvey Specter', role: 'Counsel' } : null;

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Identity Verified
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Greetings, {profile?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || "Member"}
          </h1>
          <p className="text-slate-500 text-sm font-medium italic">Platform Standing: <span className="font-bold text-slate-900 uppercase tracking-tighter">Premier Member</span></p>
        </div>
        <div className="flex gap-3">
          <CreateCaseModal userId={user?.uid || user?.userId || ''} onSuccess={refresh} />
          <Button 
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-lg px-6 font-semibold text-xs uppercase tracking-wider shadow-sm transition-all"
            onClick={() => router.push('/lawyers')}
          >
            <Search className="w-4 h-4 mr-2 text-slate-400" /> Find Counsel
          </Button>
        </div>
      </header>

      {!hasData ? (
        <EmptyDashboard userId={user?.uid || user?.userId || ''} onRefresh={refresh} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <NextBestAction cases={cases} appointments={appointments} />
            </div>
            <div className="lg:col-span-3">
              <FinancialPanel />
            </div>
            <div className="lg:col-span-3">
              <SubscriptionOverview />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <CaseProgressTracker activeCase={primaryCase} />
              
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <CaseList cases={cases} />
              </div>
            </div>
            
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
                <CaseTimeline currentStatus={primaryCase?.status || 'draft'} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Active Briefs" value={stats.activeCases} sub="Dossiers Initialized" icon={<Briefcase className="w-4 h-4 text-blue-600" />} />
            <StatCard label="Agenda" value={stats.upcomingApts} sub="Consultations Scheduled" icon={<Calendar className="w-4 h-4 text-emerald-600" />} />
            <StatCard label="Alert Ledger" value={stats.unreadNotifs} sub="Priority Signals" icon={<Bell className="w-4 h-4 text-amber-600" />} />
            <StatCard label="Standing" value="Elite" sub="Verified Professional" icon={<Award className="w-4 h-4 text-blue-600" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <RecommendationFeed userId={user?.uid || user?.userId || ''} />
              
              <section className="bg-blue-50/50 p-8 rounded-xl border border-blue-100 relative overflow-hidden group hover:bg-blue-50 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-100/40 transition-all" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Platform Intelligence</h3>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">AI Audit v4.2</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic relative z-10 font-medium">
                  "Based on current market velocity and your {stats.activeCases} active briefs, platform intelligence recommends finalizing your document uploads for 'Enterprise Compliance' to unlock predictive auditing."
                </p>
              </section>
            </div>

            <div className="space-y-8">
              <LawyerSnapshot lawyer={assignedLawyer} />

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Upcoming Agenda
                </h3>
                {appointments.length > 0 ? (
                  appointments.slice(0, 2).map((apt: any) => (
                    <BookingCard key={apt.id} booking={apt} />
                  ))
                ) : (
                  <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-200 opacity-60">
                    <p className="text-[10px] font-bold uppercase text-slate-400">No Events</p>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Secure Vault Recent
                </h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {recentDocuments.length > 0 ? (
                    recentDocuments.map((doc: any) => (
                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => router.push('/vault')}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-700">{doc.fileName}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">
                              {doc.createdAt?.seconds ? formatDistanceToNow(new Date(doc.createdAt.seconds * 1000)) : 'Syncing...'} ago
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-300">Vault Empty</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: number | string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col group transition-all duration-300 hover:border-blue-200">
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

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  );
}