"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeDollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  Target,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PreviewBadge } from "@/components/admin/PreviewBadge";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  analyticsApi,
  type AnalyticsSummary,
  type TopProduct,
} from "@/lib/api-client";

/**
 * Executive Dashboard — LIVE order-service analytics for the headline KPIs, revenue
 * trajectory, sales-by-market, and top products. Surfaces that have no backing endpoint
 * (risk matrix, intelligence ledger) are explicitly marked "Preview data".
 */

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<{ date: string; revenue: number }[]>([]);
  const [byCountry, setByCountry] = useState<Record<string, number>>({});
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters = { from: isoDaysAgo(30), to: isoToday() };
    const [sumRes, seriesRes, countryRes, topRes] = await Promise.all([
      analyticsApi.summary(filters),
      analyticsApi.revenueTimeSeries(filters, "day"),
      analyticsApi.salesByCountry(filters),
      analyticsApi.topProducts(filters, 5),
    ]);
    if (!sumRes.ok) {
      setError(sumRes.error.message || "Could not load dashboard analytics.");
      setLoading(false);
      return;
    }
    setSummary(sumRes.data);
    setSeries(seriesRes.ok ? seriesRes.data : []);
    setByCountry(countryRes.ok ? countryRes.data : {});
    setTopProducts(topRes.ok ? topRes.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countryRows = useMemo(
    () =>
      Object.entries(byCountry)
        .map(([code, revenue]) => ({ code, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
    [byCountry],
  );

  const currency = summary?.currency || "USD";

  return (
    <div className="space-y-10 animate-fade-in pb-20 font-body text-white">
      <header className="flex justify-between items-end border-b border-white/5 pb-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Maison Executive Terminal</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            Master Pulse
          </h1>
          <p className="text-sm text-white/40 font-light italic">Live yield and acquisition signals (last 30 days).</p>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Analytics: Live</span>
        </div>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-white/40 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading executive analytics…</p>
        </div>
      ) : error ? (
        <div className="py-32 flex flex-col items-center justify-center text-red-400 space-y-4">
          <AlertCircle className="w-8 h-8" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-center max-w-md px-6">{error}</p>
          <Button
            variant="outline"
            onClick={load}
            className="h-10 rounded-none border-white/10 text-white/60 text-[9px] font-bold uppercase tracking-widest hover:bg-white/5"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ExecutiveStatCard
              label="Aggregate Yield"
              value={`${currency} ${(summary?.revenue ?? 0).toLocaleString()}`}
              icon={<BadgeDollarSign />}
              href="/admin/revenue"
            />
            <ExecutiveStatCard label="Orders" value={String(summary?.orders ?? 0)} icon={<ShoppingBag />} href="/admin/sales" />
            <ExecutiveStatCard label="Customers" value={String(summary?.customers ?? 0)} icon={<Users />} href="/admin/sales" />
            <ExecutiveStatCard
              label="Avg Order Value"
              value={`${currency} ${(summary?.avgOrderValue ?? 0).toLocaleString()}`}
              icon={<TrendingUp />}
              href="/admin/revenue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Card className="lg:col-span-8 bg-[#111113] border-white/5 shadow-2xl rounded-none overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl text-white italic uppercase tracking-tighter">Yield Trajectory</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Settled revenue — live, 30-day interval
                  </CardDescription>
                </div>
                <Link href="/admin/revenue">
                  <Button variant="ghost" className="text-[9px] font-bold uppercase tracking-widest text-blue-400">
                    Ledger Detail <ArrowRight className="ml-2 w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-8 h-[320px]">
                {series.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/20 text-[10px] font-bold uppercase tracking-widest italic">
                    No revenue recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#666", fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#666" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "0px" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Risk Matrix — no backing endpoint → Preview */}
            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-black text-white p-10 space-y-6 shadow-2xl relative overflow-hidden rounded-none border border-white/5 h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Target className="w-40 h-40 text-blue-500" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-headline font-bold italic tracking-tight leading-none uppercase">Risk Matrix</h3>
                    <PreviewBadge />
                  </div>
                  <p className="text-sm font-light italic text-white/60 leading-relaxed">
                    Composite risk scoring is not yet wired to a backend signal source. Values below are illustrative.
                  </p>
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <RiskFactor label="Financial" val={22} />
                    <RiskFactor label="Technical" val={14} />
                    <RiskFactor label="Security" val={9} />
                    <RiskFactor label="Operational" val={31} />
                  </div>
                </div>
              </Card>
            </aside>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Card className="lg:col-span-7 bg-[#111113] border-white/5 rounded-none shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 p-8">
                <CardTitle className="font-headline text-2xl text-white uppercase italic">Jurisdictional Performance</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Live revenue by market</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 h-12">
                    <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Market Hub</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Net Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countryRows.map((row) => (
                    <TableRow key={row.code} className="hover:bg-white/5 transition-colors border-white/5 h-14">
                      <TableCell className="pl-8 text-sm font-bold text-white tracking-tight uppercase">{row.code} Hub</TableCell>
                      <TableCell className="text-right pr-8 text-sm font-bold tabular text-blue-400">
                        {currency} {row.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {countryRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="py-16 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest italic">
                        No market revenue yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="lg:col-span-5 bg-[#111113] border-white/5 rounded-none shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 p-8">
                <CardTitle className="font-headline text-2xl text-white uppercase italic">Top Artifacts</CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">By revenue</CardDescription>
              </CardHeader>
              <Table>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.productId} className="hover:bg-white/5 border-white/5 h-14">
                      <TableCell className="pl-8 text-xs font-bold text-white uppercase tracking-tight">{p.name}</TableCell>
                      <TableCell className="text-right pr-8 text-sm font-bold tabular text-white">
                        {currency} {p.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="py-16 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest italic">
                        No sales yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Intelligence ledger — no backing endpoint → Preview */}
          <section className="space-y-6 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white/40">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.5em]">Institutional Intelligence Ledger</h2>
              </div>
              <PreviewBadge />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AuditSignal title="Dynamic Pricing" desc="Illustrative signal — no live audit feed wired." severity="low" />
              <AuditSignal title="Integrity Override" desc="Illustrative signal — no live audit feed wired." severity="medium" />
              <AuditSignal title="Fulfillment Escalation" desc="Illustrative signal — no live audit feed wired." severity="high" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ExecutiveStatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-2xl relative overflow-hidden h-full">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-blue-400 transition-colors">{label}</span>
        <div className="text-white/20 group-hover:text-blue-400 transition-colors">
          {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })}
        </div>
      </div>
      <div className="text-3xl font-headline font-bold italic tabular leading-none text-white">{value}</div>
      <div className="flex items-center justify-end">
        <ArrowRight className="w-3 h-3 text-white/10 group-hover:text-white/40 transition-colors" />
      </div>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function RiskFactor({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="opacity-40">{label}</span>
        <span className={cn("tabular", val > 70 ? "text-red-500" : val > 30 ? "text-gold" : "text-emerald-400")}>
          {val > 70 ? "CRITICAL" : val > 30 ? "FOCUS" : "OPTIMAL"}
        </span>
      </div>
      <Progress value={val} className="h-0.5 bg-white/5" />
    </div>
  );
}

function AuditSignal({ title, desc, severity }: { title: string; desc: string; severity: string }) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-3 hover:border-white/10 transition-all rounded-none">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/80">{title}</h4>
      <p className="text-xs font-light italic text-white/40 leading-relaxed">{desc}</p>
      <Badge
        className={cn(
          "text-[7px] uppercase border-none px-2",
          severity === "high" ? "bg-red-500/10 text-red-500" : severity === "medium" ? "bg-gold/10 text-gold" : "bg-white/5 text-white/40",
        )}
      >
        {severity} priority
      </Badge>
    </Card>
  );
}
