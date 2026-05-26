"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Gauge,
  Cpu,
  ArrowRight,
  RefreshCcw,
  Search,
  Bell,
  MoreVertical,
  XCircle,
  Smartphone,
  Globe,
  Database,
  Terminal,
  Layers,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

/**
 * SRE Terminal: The Maison Observability Hub.
 * Monitors global system health, metrics, and institutional alerts.
 * Tier 1 Operational Dashboard.
 */
export default function SREHub() {
  const {
    systemHealth,
    scopedAlerts,
    scopedMetrics,
    systemLogs,
    adminJurisdiction,
    currentUser,
    resolveAlert,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState("pulse");

  const chartData = useMemo(() => {
    // Group metrics by 5-minute intervals for visualization
    return scopedMetrics
      .filter((m) => m.name === "api_response_time")
      .slice(0, 15)
      .map((m) => ({
        time: new Date(m.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: m.value,
      }))
      .reverse();
  }, [scopedMetrics]);

  const throughputData = useMemo(() => {
    return scopedMetrics
      .filter((m) => m.name === "request_volume")
      .slice(0, 10)
      .map((m) => ({
        name: new Date(m.timestamp).toLocaleTimeString([], {
          second: "2-digit",
        }),
        requests: m.value,
      }))
      .reverse();
  }, [scopedMetrics]);

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <Terminal className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Tactical Node Layer 4
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase">
            Observability
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Institutional telemetry and real-time resilience tracking for{" "}
            {adminJurisdiction.toUpperCase()} node.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">
              Overall Integrity
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <span
                className={cn(
                  "text-3xl font-headline font-bold italic tabular",
                  systemHealth.overall > 90 ? "text-emerald-400" : "text-gold"
                )}
              >
                {systemHealth.overall}%
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] uppercase">
                Institutional Grade
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <HealthNode
          label="Settlement"
          value={systemHealth.subsystems.payments}
          icon={<Zap />}
        />
        <HealthNode
          label="API Pulse"
          value={systemHealth.subsystems.api}
          icon={<Activity />}
        />
        <HealthNode
          label="Inventory"
          value={systemHealth.subsystems.inventory}
          icon={<Database />}
        />
        <HealthNode
          label="AI Logic"
          value={systemHealth.subsystems.ai}
          icon={<ShieldCheck />}
        />
        <HealthNode
          label="Logistics"
          value={systemHealth.subsystems.operational}
          icon={<Globe />}
        />
      </div>

      <Tabs
        defaultValue="pulse"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-[#111113] border border-white/5 h-14 w-full justify-start p-1 rounded-none space-x-2 mb-10">
          <TabsTrigger
            value="pulse"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none px-8"
          >
            Real-time Pulse
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none px-8"
          >
            Alert Registry{" "}
            {scopedAlerts.filter((a) => a.status === "active").length > 0 && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="telemetry"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none px-8"
          >
            Full Telemetry
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none px-8"
          >
            System Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pulse" className="space-y-12 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Card className="lg:col-span-8 bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
              <CardHeader className="border-b border-white/5 bg-white/5 p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl text-white italic uppercase tracking-tighter">
                    Latency Matrix (ms)
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Average API response time over rolling 15-minute window
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] border-white/10 text-emerald-400 uppercase"
                >
                  Optimal: &lt; 200ms
                </Badge>
              </CardHeader>
              <CardContent className="p-10 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#222"
                    />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#666", fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#666" }}
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
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                  <Gauge className="w-40 h-40 text-blue-500" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                    Subsystem Alerts
                  </h4>
                  <div className="space-y-6">
                    <SeverityGauge
                      label="Critical"
                      count={
                        scopedAlerts.filter((a) => a.severity === "critical")
                          .length
                      }
                      color="bg-red-500"
                    />
                    <SeverityGauge
                      label="High"
                      count={
                        scopedAlerts.filter((a) => a.severity === "high").length
                      }
                      color="bg-orange-500"
                    />
                    <SeverityGauge
                      label="Medium"
                      count={
                        scopedAlerts.filter((a) => a.severity === "medium")
                          .length
                      }
                      color="bg-blue-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-white/60 h-12 rounded-none text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black mt-4 transition-all"
                  >
                    ACKNOWLEDGE ALL SIGNALS
                  </Button>
                </div>
              </Card>

              <Card className="bg-[#111113] border-white/5 p-8 space-y-6 rounded-none">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                    Throughput Velocity
                  </h4>
                  <Badge
                    variant="outline"
                    className="border-white/5 text-[7px] text-white/40"
                  >
                    1s Pulse
                  </Badge>
                </div>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={throughputData}>
                      <Bar
                        dataKey="requests"
                        fill="#7E3F98"
                        radius={[1, 1, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="animate-fade-in">
          <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
            <CardHeader className="bg-white/5 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl text-white italic uppercase tracking-tighter">
                  Institutional Alert Registry
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                  Active system anomalies requiring SRE intervention
                </CardDescription>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="border-white/10 text-white/40 h-10 px-6 rounded-none text-[9px] font-bold uppercase tracking-widest hover:bg-white/5"
                >
                  <Filter className="w-3.5 h-3.5 mr-2" /> FILTER SEVERITY
                </Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Market Hub
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Anomaly Intelligence
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">
                    Severity
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Mitigation
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedAlerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={cn(
                      "hover:bg-white/5 transition-colors border-white/5",
                      alert.status === "resolved" ? "opacity-40" : ""
                    )}
                  >
                    <TableCell className="pl-8 text-[10px] font-mono text-white/20">
                      {new Date(alert.triggeredAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[8px] border-white/10 text-white/40 uppercase"
                      >
                        {alert.country.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-light italic text-white/80">
                      "{alert.message}"
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "text-[7px] uppercase border-none px-2",
                          alert.severity === "critical"
                            ? "bg-red-500 text-white"
                            : alert.severity === "high"
                            ? "bg-orange-500 text-white"
                            : "bg-blue-500 text-white"
                        )}
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {alert.status === "active" ? (
                        <Button
                          size="sm"
                          className="h-8 bg-white text-black hover:bg-emerald-500 hover:text-white rounded-none text-[8px] font-bold uppercase tracking-widest transition-all"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          RESOLVE
                        </Button>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                          RESOLVED
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {scopedAlerts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-40 text-center opacity-20"
                    >
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        No Active Anomaly Triggers in this Node
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="telemetry" className="animate-fade-in space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TelemetryCard
              title="Performance Suite"
              items={[
                { label: "API P99 Latency", value: "182ms", status: "optimal" },
                { label: "DB Master Load", value: "14%", status: "optimal" },
                { label: "Cache Hit Ratio", value: "94.2%", status: "optimal" },
              ]}
            />
            <TelemetryCard
              title="Business Resilience"
              items={[
                {
                  label: "Checkout Conversion",
                  value: "4.2%",
                  status: "warning",
                },
                { label: "Payment Success", value: "98.4%", status: "optimal" },
                { label: "Refund Frequency", value: "0.8%", status: "optimal" },
              ]}
            />
            <TelemetryCard
              title="AI Intelligence"
              items={[
                { label: "Rec. Confidence", value: "92.4%", status: "optimal" },
                {
                  label: "Fraud Capture Rate",
                  value: "100%",
                  status: "optimal",
                },
                { label: "Neural Latency", value: "42ms", status: "optimal" },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="animate-fade-in">
          <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
            <CardHeader className="bg-white/5 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-2xl text-white italic">
                System Event Ledger
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input
                  className="bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 text-white"
                  placeholder="SEARCH SYSTEM LOGS..."
                />
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Service Node
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Action Descriptor
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Latency
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.slice(0, 20).map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-white/5 transition-colors border-white/5 h-12"
                  >
                    <TableCell className="pl-8 text-[10px] font-mono text-white/20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[7px] border-white/10 text-blue-400 uppercase"
                      >
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-light italic text-white/80">
                      "{log.action}"
                    </TableCell>
                    <TableCell className="text-right pr-8 font-mono text-[9px] text-white/20">
                      {(Math.random() * 50 + 10).toFixed(0)}ms
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthNode({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-xl">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        <div className="p-2 bg-white/5 text-white/40 rounded-none group-hover:text-white transition-colors">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
        </div>
      </div>
      <div
        className={cn(
          "text-3xl font-headline font-bold italic tabular",
          value > 90 ? "text-white" : "text-gold"
        )}
      >
        {value}%
      </div>
      <div className="h-0.5 bg-white/5 w-full">
        <div
          className={cn(
            "h-full transition-all duration-1000",
            value > 90 ? "bg-blue-500" : "bg-gold"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </Card>
  );
}

function SeverityGauge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="opacity-40">{label} Threshold</span>
        <span
          className={cn("tabular", count > 0 ? "text-white" : "opacity-20")}
        >
          {count} ACTIVE
        </span>
      </div>
      <div className="h-1 bg-white/5 w-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000", color)}
          style={{ width: count > 0 ? "100%" : "0%" }}
        />
      </div>
    </div>
  );
}

function TelemetryCard({ title, items }: { title: string; items: any[] }) {
  return (
    <Card className="bg-[#111113] border-white/5 p-8 space-y-8 rounded-none shadow-2xl">
      <div className="flex items-center space-x-3 text-white/40">
        <Layers className="w-4 h-4" />
        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em]">
          {title}
        </h4>
      </div>
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-end border-b border-white/5 pb-4"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                {item.label}
              </span>
              <p className="text-xl font-headline font-bold italic text-white/80">
                {item.value}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[7px] uppercase border-none",
                item.status === "optimal"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-gold/10 text-gold"
              )}
            >
              {item.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
