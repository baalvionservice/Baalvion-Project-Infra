"use client";

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { getUserInvoices, type InvoiceData } from '@/services/invoices/invoiceService';
import InvoiceList from '@/components/billing/InvoiceList';
import { 
  FileText, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  Filter,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * @fileOverview BillingPage
 * Comprehensive financial ledger for Law Elite Network members.
 */
export default function BillingPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <BillingContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function BillingContent() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const data = await getUserInvoices(user.id);
        setInvoices(data);
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Financial Registry
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Billing & Invoices
          </h1>
          <p className="text-slate-500 text-sm font-medium">Audit your professional expenditures and network service records.</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-200 text-[10px] font-bold uppercase tracking-widest h-10 px-6">
            <Filter className="w-3.5 h-3.5 mr-2" /> Filter Ledger
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Gross Expenditures</p>
          <div className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <IndianRupee className="w-5 h-5 text-blue-600" /> {totalSpent.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Total Strategic Investment</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Verified Records</p>
          <div className="text-3xl font-bold text-slate-900 mb-1">{invoices.length}</div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Secured Invoice Dossiers</p>
        </div>
        <div className="bg-[#0B1F3A] p-6 rounded-xl border border-white/10 shadow-sm">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Account Standing</p>
          <div className="text-3xl font-bold text-white mb-1">Premier</div>
          <p className="text-[10px] text-blue-400 font-medium uppercase tracking-tight">Financial Status: Operational</p>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Billing Records...</p>
          </div>
        ) : (
          <InvoiceList invoices={invoices} />
        )}
      </div>
    </div>
  );
}
