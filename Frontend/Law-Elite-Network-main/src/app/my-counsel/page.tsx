"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getMyCounsel } from "@/services/counsel/counselService";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LawyerCard from "@/components/cards/LawyerCard";
import { 
  Users, 
  Briefcase, 
  Loader2, 
  ShieldCheck, 
  Search,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * @fileOverview My Counsel Registry
 * Specialized directory surfacing practitioners assigned to member briefs.
 */
export default function MyCounselPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <MyCounselContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function MyCounselContent() {
  const { user } = useAuthStore();
  const [counsel, setCounsel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getMyCounsel(user.id);
        setCounsel(data);
      } catch (err) {
        console.error("Counsel registry sync failure", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <Users className="w-3 h-3" />
              Verified Practitioner Registry
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">My Counsel</h1>
          <p className="text-slate-500 text-sm font-medium italic">Identify and manage your assigned executive practitioners within the network.</p>
        </div>
        <Link href="/lawyers">
          <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl px-6 font-bold shadow-lg">
            <Search className="w-4 h-4 mr-2" /> Find New Counsel
          </Button>
        </Link>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Counsel Ledger...</p>
        </div>
      ) : counsel.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
          <Briefcase className="w-16 h-16 text-slate-100 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-2 text-slate-900">No Assigned Counsel Detected</h3>
          <p className="text-slate-500 max-w-xs mx-auto italic text-sm mb-8 font-medium">
            You have not yet committed any legal briefs or assigned elite practitioners to your matters.
          </p>
          <Link href="/lawyers">
            <Button className="bg-[#0B1F3A] text-white rounded-xl px-10 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg">
              Explore the Discovery Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {counsel.map((lawyer) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </div>
      )}

      <footer className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 opacity-40">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Network Identity Protocol v4.2.0</p>
      </footer>
    </div>
  );
}
