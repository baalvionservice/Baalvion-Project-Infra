"use client";

import React, { useEffect, useState } from 'react';
import { IndianRupee, ShieldCheck, Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserPayments, type PaymentData } from '@/services/payments/paymentService';
import { useAuthStore } from '@/store/authStore';

/**
 * @fileOverview FinancialPanel
 * Dynamic reconciliation of case settlements based on mock payment history.
 */
export default function FinancialPanel() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const data = await getUserPayments(user.id);
        setPayments(data);
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-full">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <IndianRupee className="w-3.5 h-3.5 text-blue-600" /> Settlement Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 opacity-20" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Settled Funds</p>
                <p className="text-lg font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Engagement Value</p>
                <p className="text-lg font-bold text-slate-900">₹{(totalPaid + totalPending).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <div>
                  <p className="text-[9px] font-bold text-blue-600 uppercase">Pending Settlement</p>
                  <p className="text-xl font-bold text-blue-700">₹{totalPending.toLocaleString()}</p>
                </div>
                <Wallet className="w-6 h-6 text-blue-200" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-50 border border-slate-100 opacity-60">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Escrow Active • Secure Gateway</p>
        </div>
      </CardContent>
    </Card>
  );
}
