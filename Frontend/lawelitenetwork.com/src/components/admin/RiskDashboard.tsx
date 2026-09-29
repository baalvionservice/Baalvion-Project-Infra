"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  Loader2,
  Target,
  Info,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PendingLawyer {
  id: number;
  name: string;
  email: string;
  specializations?: string[];
  country?: string;
  city?: string;
  created_at?: string;
}

/**
 * @fileOverview Lawyer Verification Queue
 * Real pending-verification lawyers (adminApi.list('lawyers', {status:
 * 'pending'})) with real verify/reject actions -- this used to be a "Risk
 * Perimeter Dashboard" with an entirely fabricated fraud-detection score
 * (fixed "96% accuracy", hardcoded risk factors unconnected to any real user
 * data, a "Global Lockdown" button that did nothing). Real fraud detection
 * would need dedicated behavioral-signal tracking this app doesn't have; the
 * one thing on this page that already had real backend support was lawyer
 * verification, so that's what this page does now.
 */
export default function RiskDashboard() {
  const [pending, setPending] = useState<PendingLawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<number | null>(null);
  const { toast } = useToast();

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await adminApi.list<PendingLawyer>('lawyers', { status: 'pending', limit: 50 });
      setPending(res.items);
    } catch (err) {
      console.error("Failed to load pending lawyers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleVerify = async (id: number) => {
    setActingOn(id);
    try {
      await adminApi.verifyLawyer(id);
      setPending((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Lawyer Verified", description: "Profile is now live in the public directory." });
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (id: number) => {
    setActingOn(id);
    try {
      await adminApi.suspendLawyer(id);
      setPending((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Application Rejected" });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setActingOn(null);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Loading Verification Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-headline italic">
            <ShieldAlert className="w-6 h-6 text-red-600" /> Lawyer Verification Queue
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
            Applications awaiting admin review before going live in the public directory.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all ${
            pending.length > 0 ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}>
            <Search className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">{pending.length} Pending Review</span>
          </div>
          <Button onClick={loadPending} className="bg-[#0B1F3A] hover:bg-slate-800 text-white h-10 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </header>

      {pending.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
          <Target className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h4 className="text-xl font-bold text-slate-900">Queue Clear</h4>
          <p className="text-sm text-slate-400 italic max-w-xs mx-auto mt-2">No lawyer applications currently awaiting review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pending.map((lawyer) => (
            <Card key={lawyer.id} className="bg-white border-slate-200 shadow-sm transition-all duration-300 hover:border-blue-400">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{lawyer.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{lawyer.email}</p>
                    {lawyer.specializations && lawyer.specializations.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1">{lawyer.specializations.join(', ')}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={actingOn === lawyer.id}
                      onClick={() => handleVerify(lawyer.id)}
                      className="h-9 px-4 text-[9px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actingOn === lawyer.id}
                      onClick={() => handleReject(lawyer.id)}
                      className="h-9 px-4 border-slate-200 text-[9px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" /> Verification Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
            <li>Confirm bar/license number against the stated jurisdiction</li>
            <li>Check for duplicate profiles under a different email</li>
            <li>Verify uploaded credentials match the claimed specialization</li>
          </ul>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400 italic">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Rejecting an application suspends the profile; it does not delete the account.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
