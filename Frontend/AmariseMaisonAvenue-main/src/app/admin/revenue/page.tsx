"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ChevronRight,
  TrendingUp,
  Users,
  ShoppingBag,
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  analyticsApi,
  type AnalyticsSummary,
  type TopProduct,
} from "@/lib/api-client";

/**
 * Revenue Matrix — LIVE order-service analytics.
 * Summary KPIs, revenue time-series, sales-by-country, and top products are all
 * pulled from analyticsApi (no mock simulation). Honest loading / empty / error states.
 */

const RANGES: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RevenueDashboard() {
  const [range, setRange] = useState<keyof typeof RANGES>("30d");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [byCountry, setByCountry] = useState<Record<string, number>>({});
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [series, setSeries] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters = { from: isoDaysAgo(RANGES[range]), to: isoToday() };
    const [sumRes, countryRes, topRes, seriesRes] = await Promise.all([
      analyticsApi.summary(filters),
      analyticsApi.salesByCountry(filters),
      analyticsApi.topProducts(filters, 10),
      analyticsApi.revenueTimeSeries(filters, "day"),
    ]);

    if (!sumRes.ok) {
      setError(sumRes.error.message || "Could not load analytics.");
      setLoading(false);
      return;
    }
    setSummary(sumRes.data);
    setByCountry(countryRes.ok ? countryRes.data : {});
    setTopProducts(topRes.ok ? topRes.data : []);
    setSeries(seriesRes.ok ? seriesRes.data : []);
    setLoading(false);
  }, [range]);

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
    <div className="space-y-8 animate-fade-in pb-20 font-body text-white">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-1">
          <nav className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30 flex items-center space-x-2">
            <Link href="/admin" className="hover:text-white transition-colors">Terminal</Link>
            <ChevronRight className="w-2 h-2" />
            <span className="text-white">Yield Matrix</span>
          </nav>
          <h1 className="text-3xl font-headline font-bold italic tracking-tight uppercase">Revenue Matrix</h1>
          <p className="text-xs text-white/40 font-light italic">Live unit economics from order-service analytics.</p>
        </div>
        <div className="flex bg-[#111113] border border-white/10 p-0.5">
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all",
                range === r ? "bg-plum text-white" : "text-white/20 hover:text-plum",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-white/40 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading analytics…</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Revenue"
              value={`${currency} ${(summary?.revenue ?? 0).toLocaleString()}`}
            />
            <StatCard icon={<ShoppingBag className="w-4 h-4" />} label="Orders" value={String(summary?.orders ?? 0)} />
            <StatCard icon={<Users className="w-4 h-4" />} label="Customers" value={String(summary?.customers ?? 0)} />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Avg Order Value"
              value={`${currency} ${(summary?.avgOrderValue ?? 0).toLocaleString()}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 bg-[#111113] border-white/5 rounded-none overflow-hidden">
              <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                <CardTitle className="font-headline text-xl uppercase italic text-white">Yield Trajectory</CardTitle>
                <CardDescription className="text-[9px] uppercase tracking-widest text-white/20">
                  Settled revenue over the selected interval
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 h-[320px]">
                {series.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/20 text-[10px] font-bold uppercase tracking-widest italic">
                    No revenue recorded in this interval.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7E3F98" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#7E3F98" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#666", fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#666" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "0px" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#7E3F98" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 bg-[#111113] border-white/5 rounded-none overflow-hidden">
              <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                <CardTitle className="font-headline text-lg uppercase italic text-white">By Market</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {countryRows.map((row) => (
                      <TableRow key={row.code} className="hover:bg-white/5 border-white/5 h-12">
                        <TableCell className="pl-6 text-[10px] font-bold uppercase tracking-widest text-white/70">
                          {row.code.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-right pr-6 text-xs font-bold tabular text-blue-400">
                          {currency} {row.revenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {countryRows.length === 0 && (
                      <TableRow>
                        <TableCell className="py-16 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest italic">
                          No market data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
              <CardTitle className="font-headline text-lg uppercase italic text-white">Top Artifacts</CardTitle>
              <CardDescription className="text-[9px] uppercase tracking-widest text-white/20">
                Best-selling pieces by revenue
              </CardDescription>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Artifact</TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40 text-center">Units</TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.productId} className="hover:bg-white/5 border-white/5 h-14">
                    <TableCell className="pl-8 text-xs font-bold text-white uppercase tracking-tight">{p.name}</TableCell>
                    <TableCell className="text-center text-xs font-bold tabular text-white/60">{p.unitsSold}</TableCell>
                    <TableCell className="text-right pr-8 text-sm font-bold tabular text-white">
                      {currency} {p.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-16 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest italic">
                      No product sales in this interval.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="bg-[#111113] border-white/5 p-5 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-2xl">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/5 rounded-none text-blue-400 border border-white/5">{icon}</div>
      </div>
      <div>
        <div className="text-white/20 text-[8px] uppercase tracking-[0.4em] font-bold">{label}</div>
        <div className="text-2xl font-body font-bold tabular mt-1.5 text-white">{value}</div>
      </div>
    </Card>
  );
}
