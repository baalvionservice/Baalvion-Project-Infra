"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { adminApi, type DashboardStats, type Analytics } from "@/lib/api/admin";
import AnalyticsCards from "@/components/admin/AnalyticsCards";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  BarChart3,
  Loader2,
  ArrowLeft,
  Activity
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview AnalyticsPage
 * Platform intelligence dashboard for administrators, backed by real
 * law-service data (adminApi.dashboard()/analytics()).
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [dashboardRes, analyticsRes] = await Promise.all([
          adminApi.dashboard(),
          adminApi.analytics(),
        ]);
        setStats(dashboardRes);
        setAnalytics(analyticsRes);
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

        {isLoading || !stats ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 glass-panel rounded-3xl border-white/5">
            <Loader2 className="w-10 h-10 animate-spin text-accent opacity-50" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Intelligence Ledger...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <AnalyticsCards data={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-panel p-8 rounded-3xl border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headline text-xl italic text-white flex items-center gap-3">
                    <Activity className="w-5 h-5 text-accent" /> Bookings by Status
                  </h3>
                </div>
                {analytics?.bookingsByStatus.length ? (
                  <ul className="space-y-3">
                    {analytics.bookingsByStatus.map((row) => (
                      <li key={row.status} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground uppercase tracking-wide text-[11px] font-bold">{row.status}</span>
                        <span className="text-white font-bold">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">No bookings recorded yet.</p>
                )}
              </div>

              <div className="glass-panel p-8 rounded-3xl border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headline text-xl italic text-white flex items-center gap-3">
                    <Activity className="w-5 h-5 text-accent" /> Revenue by Month
                  </h3>
                </div>
                {analytics?.revenueByMonth.length ? (
                  <ul className="space-y-3">
                    {analytics.revenueByMonth.map((row) => (
                      <li key={row.month} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground uppercase tracking-wide text-[11px] font-bold">{row.month}</span>
                        <span className="text-emerald-400 font-bold">₹{Number(row.revenue).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">No settled revenue yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
