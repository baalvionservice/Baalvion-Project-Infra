"use client";

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useDashboardCases } from '@/hooks/useDashboardCases';
import CaseList from '@/components/case/CaseList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreateCaseModal from '@/components/case/CreateCaseModal';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { 
  ShieldCheck, 
  Briefcase, 
  Loader2
} from 'lucide-react';

export default function CasesPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <CasesContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function CasesContent() {
  const { user } = useAuthContext();
  const { 
    cases, 
    loading, 
    refresh,
    totalCases,
    activeCases
  } = useDashboardCases(user?.userId);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <Briefcase className="w-3 h-3" />
              Matter Management
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Legal Briefs Ledger
          </h1>
          <p className="text-slate-500 text-sm font-medium italic flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Auditing {totalCases} synchronized matters within the elite network.
          </p>
        </div>
        <div className="flex gap-3">
          <CreateCaseModal userId={user?.userId || ''} onSuccess={refresh} />
        </div>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        </div>
      ) : (
        <div className="space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard label="Total Matters" value={totalCases} sub="Dossiers Initialized" />
            <StatCard label="Active Strategy" value={activeCases} sub="Current Engagements" />
            <StatCard label="Network Integrity" value="100%" sub="Verified Protocol" />
          </section>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <CaseList cases={cases} title="Managed Legal Matters" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string, value: string | number, sub: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm executive-card group">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">{label}</p>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-[10px] text-blue-600/70 font-medium uppercase tracking-tight">{sub}</p>
    </div>
  );
}
