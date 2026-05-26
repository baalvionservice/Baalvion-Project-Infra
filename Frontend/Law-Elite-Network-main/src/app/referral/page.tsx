"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import {
  createReferral,
  getUserReferral,
} from "@/services/referralService";
import ReferralCard from "@/components/referral/ReferralCard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  Gift, 
  Loader2, 
  Award,
  ShieldCheck
} from "lucide-react";

/**
 * @fileOverview ReferralPage
 * Cleaned up loading state by removing text labels.
 */
export default function ReferralPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <ReferralContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function ReferralContent() {
  const { user } = useAuthStore();
  const [referral, setReferral] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let data = await getUserReferral(user.id);
        if (!data) {
          data = await createReferral(user.id);
        }
        setReferral(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 max-w-4xl animate-in fade-in duration-700">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <Gift className="w-3 h-3" />
              Network Expansion
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Refer & Earn</h1>
          <p className="text-slate-500 text-sm font-medium italic mt-2">Introduce distinguished colleagues to the network and secure executive credits.</p>
        </header>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
          </div>
        ) : referral ? (
          <div className="space-y-8">
            <ReferralCard referral={referral} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-blue-600" /> Engagement Rule
                </h4>
                <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                  Earn <span className="text-blue-600 font-bold">₹100 credits</span> for every verified practitioner or premier client who joins via your identifier and completes their first consultation commitment.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Redemption
                </h4>
                <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                  Credits are automatically applied to your next executive session settlement. Unauthorized referral cycles are audited by network security.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}