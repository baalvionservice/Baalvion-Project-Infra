"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getInvoiceById, type InvoiceData } from '@/services/invoices/invoiceService';
import { 
  FileText, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  Download,
  IndianRupee,
  Calendar,
  CreditCard,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

/**
 * @fileOverview InvoiceDetailPage
 * High-fidelity financial audit view for individual service settlements.
 */
export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (invoiceId) {
        const data = await getInvoiceById(invoiceId as string);
        setInvoice(data);
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Retrieving Audit Dossier...</p>
        </div>
      </DashboardShell>
    );
  }

  if (!invoice) return null;

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="container mx-auto px-8 pt-8 pb-12 max-w-4xl">
          <header className="mb-8 flex items-center justify-between no-print">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to Registry
            </button>
            
            <div className="flex gap-3">
              <Button variant="outline" className="h-10 px-6 border-slate-200 text-[10px] font-bold uppercase tracking-widest" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-2" /> Print Dossier
              </Button>
              <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 h-10 px-6 text-[10px] font-bold uppercase tracking-widest">
                <Download className="w-3.5 h-3.5 mr-2" /> Export PDF
              </Button>
            </div>
          </header>

          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden print:shadow-none print:border-slate-100">
            {/* Invoice Header */}
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Law Elite Network</h2>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Settlement Receipt</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">Registered Office:</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
                    12 Executive Tower, BKC, Mumbai, MH 400051<br />
                    Corporate Registry: LEN-992-001
                  </p>
                </div>
              </div>

              <div className="text-right space-y-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full font-bold uppercase text-[9px] px-3">
                  Verified Paid
                </Badge>
                <div className="pt-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Invoice Identifier</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{invoice.id}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Synchronization Date</p>
                  <p className="text-sm font-bold text-slate-900">{format(invoice.date, "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>

            {/* Billing Details */}
            <div className="p-10 grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Partner</p>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">Verified Member</p>
                  <p className="text-xs text-slate-500 font-medium">Recipient ID: {invoice.userId.slice(-8)}</p>
                  <p className="text-xs text-slate-500 font-medium">Engagement Ref: #{invoice.bookingId.slice(-6)}</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Gateway</p>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Network Secured
                  </span>
                  <p className="text-[10px] text-slate-500">Signature: SIG_VERIFIED_SECURE</p>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="px-10 py-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Description of Service</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Settlement (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-6 text-sm font-semibold text-slate-900">{item.description}</td>
                      <td className="py-6 text-sm font-bold text-slate-900 text-right">₹{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="p-10 bg-slate-50/30 flex justify-end border-t border-slate-100">
              <div className="w-64 space-y-3">
                <div className="flex justify-between items-center text-xs font-medium text-slate-500 uppercase">
                  <span>Net Base Fee</span>
                  <span>₹{invoice.baseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-500 uppercase">
                  <span>Network Tax (10%)</span>
                  <span>₹{invoice.taxAmount.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Gross Total</span>
                  <span className="text-xl font-bold text-blue-600 flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" /> {invoice.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="p-10 border-t border-slate-100 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Platform Integrity Verified</span>
              </div>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed italic">
                This is a system-generated strategic record. No physical signature is required. All network interactions are governed by the Law Elite Network Engagement Terms.
              </p>
            </div>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
