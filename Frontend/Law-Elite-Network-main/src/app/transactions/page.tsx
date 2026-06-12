"use client";

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { getUserPayments, type PaymentData } from '@/services/payments/paymentService';
import TransactionHistory from '@/components/payment/TransactionHistory';
import { 
  IndianRupee, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  FileText,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * @fileOverview TransactionsPage
 * Comprehensive financial audit portal for Law Elite Network members.
 */
export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <TransactionsContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function TransactionsContent() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const data = await getUserPayments(user.id);
        setTransactions(data);
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Financial Integrity
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Settlement History
          </h1>
          <p className="text-slate-500 text-sm font-medium">Audit your secure professional engagements and financial transfers.</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-[10px] font-bold uppercase tracking-widest h-10 px-6">
            <Filter className="w-3.5 h-3.5 mr-2" /> Filter Ledger
          </Button>
          <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 text-[10px] font-bold uppercase tracking-widest h-10 px-6">
            <FileText className="w-3.5 h-3.5 mr-2" /> Export Report
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          label="Gross Settlement" 
          value={`₹${totalSpent.toLocaleString()}`} 
          sub="Total Funds Committed" 
          icon={<IndianRupee className="w-4 h-4 text-blue-600" />} 
        />
        <StatCard 
          label="Verified Transactions" 
          value={transactions.length} 
          sub="Secured Ledger Entries" 
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} 
        />
        <StatCard 
          label="Network Escrow" 
          value="Active" 
          sub="E2E Encryption Secured" 
          icon={<Loader2 className="w-4 h-4 text-amber-600" />} 
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Financial Audit Trail
          </h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Financial Records...</p>
          </div>
        ) : (
          <TransactionHistory transactions={transactions} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: number | string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col group transition-all duration-300 hover:border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h3>
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{sub}</p>
    </div>
  );
}
