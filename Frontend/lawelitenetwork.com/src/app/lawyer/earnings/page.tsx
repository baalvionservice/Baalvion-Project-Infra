
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLawyerDashboardData } from "@/hooks/useLawyerDashboardData";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { payoutApi } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
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
  FileText,
  CheckCircle2
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

const CUR: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹", AED: "AED ", SGD: "S$", BRL: "R$", JPY: "¥" };
const fmt = (n: number, cur = "USD") => `${CUR[cur] || "$"}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Balance { lifetimeEarnings: number; paidOut: number; pendingPayouts: number; available: number; currency: string; feePercent: number; }

function EarningsContent() {
  const { user } = useAuthStore();
  const { earnings, loading } = useLawyerDashboardData(user?.id);
  const { toast } = useToast();

  const [balance, setBalance] = useState<Balance | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(true);

  const load = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const [bal, po] = await Promise.all([payoutApi.balance(), payoutApi.list()]);
      setBalance(bal.data?.data?.balance || null);
      setLedger(bal.data?.data?.ledger || []);
      setPayouts(po.data?.data || []);
    } catch {
      setBalance(null);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cur = balance?.currency || "USD";

  const requestPayout = async () => {
    if (!balance || balance.available <= 0) return;
    setBusy(true);
    try {
      await payoutApi.request();
      toast({ title: "Payout requested", description: `${fmt(balance.available, cur)} will be transferred to your account.` });
      await load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Payout failed", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Revenue Ledger...</p>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Earnings & Payouts</h1>
          <p className="text-slate-500 text-sm font-medium italic">
            Your net earnings after the {balance?.feePercent ?? 15}% platform fee, and withdrawals to your account.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={requestPayout}
            disabled={busy || !balance || balance.available <= 0}
            className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl px-6 h-11 font-bold uppercase text-[10px] tracking-widest disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
            {balance && balance.available > 0 ? `Withdraw ${fmt(balance.available, cur)}` : "Nothing to withdraw"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard label="Available to withdraw" value={fmt(balance?.available || 0, cur)} sub="Settled, unpaid" icon={<Wallet className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Lifetime earnings" value={fmt(balance?.lifetimeEarnings || 0, cur)} sub="Net of platform fee" icon={<TrendingUp className="w-4 h-4 text-blue-600" />} />
        <StatCard label="Pending payouts" value={fmt(balance?.pendingPayouts || 0, cur)} sub="Being processed" icon={<Loader2 className="w-4 h-4 text-amber-600" />} />
        <StatCard label="Paid out" value={fmt(balance?.paidOut || 0, cur)} sub="Transferred" icon={<CheckCircle2 className="w-4 h-4 text-slate-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ledger */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Earnings ledger
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {loadingLedger ? (
              <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600 inline opacity-40" /></div>
            ) : ledger.length ? (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {ledger.map((e) => (
                  <div key={e.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.entry_type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        {e.entry_type === "credit" ? <ArrowUpRight className="w-5 h-5 rotate-180" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{e.description || (e.entry_type === "credit" ? "Earnings" : "Payout")}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(e.created_at || e.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-base font-bold ${e.entry_type === "credit" ? "text-emerald-700" : "text-slate-500"}`}>
                      {e.entry_type === "credit" ? "+" : "−"}{fmt(e.amount, e.currency || cur)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center"><p className="text-sm italic text-slate-400 uppercase tracking-widest">No earnings yet.</p></div>
            )}
          </div>
        </div>

        {/* Payout history */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-blue-600" /> Payout history
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {payouts.length ? (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {payouts.map((p) => (
                  <div key={p.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-base font-bold text-slate-900">{fmt(p.amount, p.currency || cur)}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(p.requested_at || p.created_at || p.createdAt).toLocaleDateString()} • {p.method?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-widest ${
                      p.status === "paid" ? "bg-emerald-50 text-emerald-700" :
                      p.status === "failed" || p.status === "cancelled" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"}`}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center"><p className="text-sm italic text-slate-400 uppercase tracking-widest">No payouts yet.</p></div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 opacity-40">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Bank-to-bank settlement · {balance?.feePercent ?? 15}% platform fee</p>
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
