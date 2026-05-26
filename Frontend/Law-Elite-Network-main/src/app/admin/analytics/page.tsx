"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { getAnalyticsData } from "@/services/adminService";
import AnalyticsCards from "@/components/admin/AnalyticsCards";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { 
  BarChart3, 
  Loader2, 
  ShieldCheck, 
  ArrowLeft,
  Activity,
  Zap
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview AnalyticsPage
 * High-fidelity platform intelligence command center for administrators.
 */
export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['admin']}>
        <AnalyticsContent />
      </RoleGuard>
    </ProtectedRoute>
  );
}

function AnalyticsContent() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await getAnalyticsData();
        setData(res);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-12 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Command
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 px-2 py-1 rounded flex items-center gap-2">
                <BarChart3 className="w-3 h-3" />
                Network Intelligence
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="font-headline text-4xl italic text-white">Platform Analytics</h1>
            <p className="text-muted-foreground text-sm italic mt-2">Audit global performance metrics and revenue synchronization.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 glass-panel rounded-3xl border-white/5">
            <Loader2 className="w-10 h-10 animate-spin text-accent opacity-50" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Intelligence Ledger...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Main Stats */}
            <AnalyticsCards data={data} />

            {/* Growth & Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headline text-xl italic text-white flex items-center gap-3">
                    <Activity className="w-5 h-5 text-accent" /> Network Pulse
                  </h3>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">Real-Time Data Feed</span>
                </div>
                
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-muted-foreground/20">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Visual Trends Finalizing...</p>
                  <p className="text-[10px] text-muted-foreground italic max-w-xs mx-auto">Network telemetry is being aggregated for high-fidelity charting.</p>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel p-6 rounded-2xl border-white/5 bg-accent/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-4 h-4 text-accent" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">System Integrity</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="text-emerald-400">99.99%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">API Latency:</span>
                      <span className="text-accent">24ms</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">Encrypted:</span>
                      <span className="text-white flex items-center gap-1">AES-256 <ShieldCheck className="w-2.5 h-2.5" /></span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Platform Growth</h4>
                  <div className="text-center py-4">
                    <p className="text-3xl font-headline italic text-white">+12.4%</p>
                    <p className="text-[9px] font-bold text-accent uppercase tracking-widest mt-1">Monthly Engagement Lift</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
