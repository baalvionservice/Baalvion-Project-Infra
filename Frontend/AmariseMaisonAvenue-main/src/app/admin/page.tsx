"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  TrendingUp,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Package,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ArrowRight,
  Target,
  Clock,
  LayoutDashboard,
  BadgeDollarSign,
  Cpu,
  BrainCircuit,
  Lock,
  Search,
  Users,
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
import { useExecutiveData } from "@/hooks/use-executive-data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  BarChart,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Executive Audit Dashboard: SEMrush-Style Control Center.
 * The primary entry point for Maison leadership oversight.
 */
export default function ExecutiveDashboard() {
  const { summary, risk, jurisdiction, isGlobal } = useExecutiveData();
  const { scopedAuditLogs } = useAppStore();

  const chartData = [
    { name: "Mon", revenue: 42000 },
    { name: "Tue", revenue: 38000 },
    { name: "Wed", revenue: 54000 },
    { name: "Thu", revenue: 48000 },
    { name: "Fri", revenue: 61000 },
    { name: "Sat", revenue: 72000 },
    { name: "Sun", revenue: 68000 },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-20 font-body text-white">
      {/* 1. Header: Jurisdictional Identity */}
      <header className="flex justify-between items-end border-b border-white/5 pb-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Maison Executive Terminal
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            {isGlobal
              ? "Global Master"
              : `${(jurisdiction || "").toUpperCase()} Node`}{" "}
            Pulse
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Orchestrating yield, risk, and integrity across the network.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">
              Institutional Status
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                Registry Sync: Active
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Executive HUD: Revenue & Risk */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ExecutiveStatCard
          label="Aggregate Yield"
          value={`$${(summary.totalRevenue / 1000).toFixed(1)}k`}
          trend="+12.4%"
          positive
          icon={<BadgeDollarSign />}
          href="/admin/revenue"
        />
        <ExecutiveStatCard
          label="Risk Exposure"
          value={risk.score}
          trend={risk.level}
          positive={risk.level === "low"}
          icon={<ShieldCheck />}
          color={
            risk.level === "critical"
              ? "text-red-500"
              : risk.level === "high"
              ? "text-orange-500"
              : "text-emerald-400"
          }
          href="/admin/observability"
        />
        <ExecutiveStatCard
          label="Conversion Velocity"
          value={`${summary.conversionRate}%`}
          trend="Optimal"
          positive
          icon={<Zap />}
          href="/admin/sales"
        />
        <ExecutiveStatCard
          label="System Integrity"
          value={`${summary.systemHealth}%`}
          trend="Verified"
          positive
          icon={<Activity />}
          href="/admin/observability"
        />
      </div>

      {/* 3. Deep Analysis Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Yield Trajectory */}
        <Card className="lg:col-span-8 bg-[#111113] border-white/5 shadow-2xl rounded-none overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl text-white italic uppercase tracking-tighter">
                Yield Trajectory
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                Settled revenue performance over 7-day interval
              </CardDescription>
            </div>
            <Link href="/admin/finance">
              <Button
                variant="ghost"
                className="text-[9px] font-bold uppercase tracking-widest text-blue-400"
              >
                Ledger Detail <ChevronRight className="ml-2 w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-8 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#222"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#666", fontWeight: 700 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#666" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    border: "1px solid #333",
                    borderRadius: "0px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Breakdown Node */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
              <Target className="w-40 h-40 text-blue-500" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-3xl font-headline font-bold italic tracking-tight leading-none uppercase">
                Risk Matrix
              </h3>
              <p className="text-sm font-light italic text-white/60 leading-relaxed">
                "Institutional logic is identifying minor contention in the
                settlement layer of the UAE hub. Overall exposure remains within
                Maison thresholds."
              </p>
              <div className="space-y-6 pt-6 border-t border-white/10">
                <RiskFactor label="Financial" val={risk.factors.financial} />
                <RiskFactor label="Technical" val={risk.factors.technical} />
                <RiskFactor label="Security" val={risk.factors.security} />
                <RiskFactor
                  label="Operational"
                  val={risk.factors.operational}
                />
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* 4. Multi-Market Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-12 bg-[#111113] border-white/5 rounded-none shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl text-white uppercase italic">
                Jurisdictional Performance
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                Cross-market yield and health index
              </CardDescription>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-400" />
              <input
                className="bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 text-white focus:border-blue-500 transition-all"
                placeholder="FILTER HUBS..."
              />
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 h-12">
                <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                  Market Hub
                </TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">
                  Hub Status
                </TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">
                  Health Index
                </TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right text-white/40">
                  Active Orders
                </TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                  Net Yield
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.countryMetrics.map((hub) => (
                <TableRow
                  key={hub.code}
                  className="hover:bg-white/5 transition-colors border-white/5 h-16 group"
                >
                  <TableCell className="pl-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white/40 group-hover:text-blue-400 transition-colors">
                        {(hub.code || "").toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">
                        {hub.name} Hub
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-400 border-none text-[7px] uppercase px-2 py-0.5"
                    >
                      Operating
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-[10px] font-bold text-blue-400 tabular">
                        {hub.health.toFixed(1)}%
                      </span>
                      <Progress
                        value={hub.health}
                        className="h-0.5 w-12 bg-white/5"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold text-white/60 tabular">
                    {hub.orders}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <span className="text-sm font-bold text-white tabular">
                      ${hub.revenue.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 5. Recent Admin Intelligence */}
      <section className="space-y-6 pt-10 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-white/40">
            <History className="w-5 h-5" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em]">
              Institutional Intelligence Ledger
            </h2>
          </div>
          <Link
            href="/admin/audit"
            className="text-[8px] font-bold uppercase tracking-widest text-blue-400 hover:text-white transition-colors"
          >
            View All Actions
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AuditSignal
            title="Dynamic Pricing Execution"
            desc="AI optimized yield for Birkin 25 series in AE Hub."
            severity="low"
            time="12m ago"
          />
          <AuditSignal
            title="Manual Integrity Override"
            desc="Super Admin corrected provenance documentation for SKU: HSS-92."
            severity="medium"
            time="45m ago"
          />
          <AuditSignal
            title="Fulfillment Escalation"
            desc="In-transit lag detected in Mumbai Hub. Courier notified."
            severity="high"
            time="1h ago"
          />
        </div>
      </section>
    </div>
  );
}

function ExecutiveStatCard({
  label,
  value,
  trend,
  positive,
  icon,
  color = "text-white",
  href,
}: any) {
  const content = (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-2xl relative overflow-hidden h-full">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        <div className="text-white/20 group-hover:text-blue-400 transition-colors">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
        </div>
      </div>
      <div
        className={cn(
          "text-4xl font-headline font-bold italic tabular leading-none",
          color
        )}
      >
        {value}
      </div>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn(
            "text-[7px] uppercase border-none px-2",
            positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}
        >
          {trend}
        </Badge>
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
        <span className="opacity-40">{label} Logic</span>
        <span
          className={cn(
            "tabular",
            val > 70
              ? "text-red-500"
              : val > 30
              ? "text-gold"
              : "text-emerald-400"
          )}
        >
          {val > 70 ? "CRITICAL" : val > 30 ? "FOCUS" : "OPTIMAL"}
        </span>
      </div>
      <div className="h-0.5 bg-white/5 w-full rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000",
            val > 70 ? "bg-red-500" : val > 30 ? "bg-gold" : "bg-emerald-500"
          )}
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

function AuditSignal({
  title,
  desc,
  severity,
  time,
}: {
  title: string;
  desc: string;
  severity: string;
  time: string;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-3 hover:border-white/10 transition-all rounded-none">
      <div className="flex justify-between items-center">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/80">
          {title}
        </h4>
        <span className="text-[8px] font-mono text-white/20 uppercase">
          {time}
        </span>
      </div>
      <p className="text-xs font-light italic text-white/40 leading-relaxed">
        "{desc}"
      </p>
      <div className="pt-2">
        <Badge
          className={cn(
            "text-[7px] uppercase border-none px-2",
            severity === "high"
              ? "bg-red-500/10 text-red-500"
              : severity === "medium"
              ? "bg-gold/10 text-gold"
              : "bg-white/5 text-white/40"
          )}
        >
          {severity} priority
        </Badge>
      </div>
    </Card>
  );
}

function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
