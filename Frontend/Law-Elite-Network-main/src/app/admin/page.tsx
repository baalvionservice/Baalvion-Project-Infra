"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/console/AdminShell";
import { adminApi, DashboardStats, Analytics } from "@/lib/api/admin";
import { Card } from "@/components/ui/card";
import {
  Scale, Users, Briefcase, CalendarClock, CreditCard, Newspaper, Star,
  BadgeDollarSign, Loader2, AlertCircle, ArrowRight,
} from "lucide-react";

const fmtMoney = (n: number) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function Stat({ icon: Icon, label, value, sub, href }: { icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition-shadow h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
        </div>
      </Card>
    </Link>
  );
}

function Bars({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-sm mb-1"><span className="capitalize text-muted-foreground">{d.label.replace(/_/g, " ")}</span><span className="font-medium">{d.value}</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(d.value / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([adminApi.dashboard(), adminApi.analytics()]);
        if (!alive) return;
        setStats(s); setAnalytics(a);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <AdminShell title="Dashboard">
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : error ? (
        <Card className="p-6 text-destructive flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</Card>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Scale} label="Lawyers" value={stats.lawyers.total} sub={`${stats.lawyers.active} active · ${stats.lawyers.pending} pending`} href="/admin/lawyers" />
            <Stat icon={Users} label="Clients" value={stats.clients.total} href="/admin/clients" />
            <Stat icon={Briefcase} label="Cases" value={stats.cases.total} sub={`${stats.cases.open} open`} href="/admin/cases" />
            <Stat icon={CalendarClock} label="Bookings" value={stats.bookings.total} sub={`${stats.bookings.pending} pending`} href="/admin/bookings" />
            <Stat icon={CreditCard} label="Revenue" value={fmtMoney(stats.payments.totalRevenue)} sub={`${stats.payments.succeeded}/${stats.payments.total} succeeded`} href="/admin/payments" />
            <Stat icon={BadgeDollarSign} label="Subscriptions" value={stats.subscriptions.active} sub={`${stats.subscriptions.total} total`} href="/admin/subscriptions" />
            <Stat icon={Newspaper} label="Articles" value={stats.articles.total} sub={`${stats.articles.published} published`} href="/admin/articles" />
            <Stat icon={Star} label="Reviews" value={stats.reviews.total} href="/admin/reviews" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Bars title="Bookings by status" data={(analytics?.bookingsByStatus || []).map((b) => ({ label: b.status, value: Number(b.count) }))} />
            <Bars title="Revenue by month" data={(analytics?.revenueByMonth || []).map((r) => ({ label: new Date(r.month).toLocaleDateString(undefined, { month: "short", year: "2-digit" }), value: Math.round(Number(r.revenue)) }))} />
          </div>

          {stats.lawyers.pending > 0 && (
            <Link href="/admin/lawyers">
              <Card className="p-4 flex items-center justify-between bg-amber-50 border-amber-200 hover:bg-amber-100 transition-colors">
                <span className="text-sm text-amber-900">{stats.lawyers.pending} lawyer{stats.lawyers.pending > 1 ? "s" : ""} pending verification</span>
                <ArrowRight className="w-4 h-4 text-amber-700" />
              </Card>
            </Link>
          )}
        </div>
      ) : null}
    </AdminShell>
  );
}
