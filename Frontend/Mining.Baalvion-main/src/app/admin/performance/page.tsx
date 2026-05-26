"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Zap,
  Activity,
  Server,
  Cpu,
  Database,
  Globe,
  Clock,
  RefreshCcw,
  AlertCircle,
  Search,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Dynamic imports for charting to reduce TBT
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

// Import recharts components directly to avoid type issues with dynamic imports
import { Area, XAxis, YAxis, Tooltip } from "recharts";

const latencyData = [
  { time: "08:00", apac: 120, emea: 85, amer: 92 },
  { time: "10:00", apac: 145, emea: 90, amer: 95 },
  { time: "12:00", apac: 130, emea: 110, amer: 105 },
  { time: "14:00", apac: 115, emea: 125, amer: 110 },
  { time: "16:00", apac: 110, emea: 105, amer: 130 },
  { time: "18:00", apac: 95, emea: 92, amer: 115 },
];

export default function AdminPerformanceDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Zap className="h-8 w-8 text-secondary" />
            System Performance & Scale
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Real-time infrastructure health and global traffic telemetry.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 px-6 font-bold border-slate-300"
            onClick={handleRefresh}
          >
            <RefreshCcw
              className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
            />
            Sync Metrics
          </Button>
          <Button className="bg-primary text-white font-bold h-12 px-8 shadow-lg">
            <Settings2 className="h-4 w-4 mr-2" /> Scale Policy
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Global P95 Latency",
            val: "112ms",
            change: "-4ms",
            icon: Clock,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Cache Hit Rate",
            val: "94.2%",
            change: "+1.2%",
            icon: Database,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active Nodes",
            val: "12 / 12",
            change: "Healthy",
            icon: Server,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "System Load",
            val: "42%",
            change: "Stable",
            icon: Cpu,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-widest border-slate-200"
                >
                  {stat.change}
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">
                {stat.val}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Regional Latency Comparison
              </CardTitle>
              <CardDescription>
                Performance across global trade nodes (ms).
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  APAC
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-secondary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  EMEA
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="colorApac" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4498" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1B4498" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="apac"
                  stroke="#1B4498"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorApac)"
                />
                <Area
                  type="monotone"
                  dataKey="emea"
                  stroke="#21CEDD"
                  strokeWidth={3}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Globe className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Global Node Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-4">
                {[
                  { node: "Singapore (APAC)", status: "Optimal", ping: "22ms" },
                  { node: "Frankfurt (EMEA)", status: "Optimal", ping: "18ms" },
                  {
                    node: "São Paulo (LATAM)",
                    status: "Degraded",
                    ping: "142ms",
                  },
                  { node: "Virginia (AMER)", status: "Optimal", ping: "12ms" },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          n.status === "Optimal"
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-rose-500"
                        )}
                      />
                      <span className="text-xs font-bold">{n.node}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {n.ping}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-11 text-xs"
              >
                Run Network Diagnostics
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Async Job Queue</CardTitle>
              <CardDescription>Background trade processing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500 uppercase">
                    Queue Density
                  </span>
                  <span className="text-primary">Low (14 Jobs)</span>
                </div>
                <Progress value={15} className="h-1.5" />
              </div>
              <div className="divide-y border-t mt-4">
                {[
                  { job: "RFQ Matcher", status: "Running", time: "2s" },
                  { job: "Tax Report #882", status: "Queued", time: "12s" },
                ].map((j, i) => (
                  <div
                    key={i}
                    className="py-3 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-700">
                      {j.job}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-bold h-4"
                    >
                      {j.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Database Transaction Performance
            </CardTitle>
            <CardDescription>
              Read/Write latency for core trade tables.
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search tables..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none"
            />
          </div>
        </CardHeader>
        <div className="grid md:grid-cols-3 divide-x border-b">
          {[
            {
              table: "trade_orders",
              reads: "12ms",
              writes: "45ms",
              utilization: 62,
            },
            {
              table: "mineral_prices",
              reads: "4ms",
              writes: "18ms",
              utilization: 88,
            },
            {
              table: "audit_logs",
              reads: "24ms",
              writes: "52ms",
              utilization: 14,
            },
          ].map((t, i) => (
            <div
              key={i}
              className="p-6 space-y-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" /> {t.table}
                </h4>
                <Badge variant="outline" className="text-[9px]">
                  Verified
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Avg Read
                  </p>
                  <p className="text-lg font-bold text-primary">{t.reads}</p>
                </div>
                <div className="p-3 bg-white border rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Avg Write
                  </p>
                  <p className="text-lg font-bold text-secondary">{t.writes}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Throughput Cap</span>
                  <span>{t.utilization}%</span>
                </div>
                <Progress value={t.utilization} className="h-1" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              Optimization Recommendation
            </h3>
            <p className="text-sm text-slate-500">
              System detected high read volume on 'mineral_prices'. Increasing
              cache TTL to 5 minutes is recommended.
            </p>
          </div>
        </div>
        <Button variant="outline" className="font-bold border-slate-300 px-8">
          Apply Auto-Fix
        </Button>
      </div>
    </div>
  );
}
