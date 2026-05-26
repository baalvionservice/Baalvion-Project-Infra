"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Loader2,
  Server,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { systemService } from "@/services/data/system-service";
import { AdminSystemHubData } from "@/types/system";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Admin Analytics & System Monitoring Hub.
 * Specialized control suite for monitoring platform performance and infrastructure vitals.
 */
export default function AdminSystemHubPage() {
  const [data, setData] = useState<AdminSystemHubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getAdminSystemHubData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("System hub sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Kernel Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              System Orchestration
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Analytics & Monitoring
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time telemetry and KPI tracking for the Imperialpedia Index.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Synchronize Hub
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* KPI Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.analytics.map((kpi) => (
          <Card
            key={kpi.metric}
            className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {kpi.metric}
              </CardTitle>
              {kpi.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive group-hover:scale-110 transition-transform" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {kpi.value.toLocaleString()}
              </div>
              <div
                className={cn(
                  "flex items-center text-[10px] font-bold mt-1 uppercase tracking-tighter",
                  kpi.trend === "up" ? "text-emerald-500" : "text-destructive"
                )}
              >
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {kpi.trend === "up"
                  ? "Increasing velocity"
                  : "Decreasing momentum"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* System Monitoring Panel */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" /> Infrastructure
                  Registry
                </CardTitle>
                <CardDescription>
                  Live health and resource consumption across production
                  clusters.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold uppercase tracking-widest px-3 h-7"
              >
                <CheckCircle2 className="h-3 w-3 mr-1.5" /> All Systems Nominal
              </Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Node Label
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      CPU Usage
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Memory Hub
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Requests
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-8">
                      SLA Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.system_monitoring.map((node) => (
                    <TableRow
                      key={node.server}
                      className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shadow-[0_0_8px]",
                              node.status === "healthy"
                                ? "bg-emerald-500 shadow-emerald-500/50"
                                : node.status === "warning"
                                ? "bg-amber-500 shadow-amber-500/50"
                                : "bg-destructive shadow-destructive/50"
                            )}
                          />
                          <span className="text-sm font-bold uppercase tracking-tight">
                            {node.server}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 min-w-[100px] px-4">
                          <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase">
                            <span>Load</span>
                            <span className="text-foreground">
                              {node.cpu_usage}
                            </span>
                          </div>
                          <Progress
                            value={parseInt(node.cpu_usage)}
                            className="h-1 bg-white/5"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 min-w-[100px] px-4">
                          <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase">
                            <span>Commit</span>
                            <span className="text-foreground">
                              {node.memory_usage}
                            </span>
                          </div>
                          <Progress
                            value={parseInt(node.memory_usage)}
                            className="h-1 bg-white/5"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold">
                        {node.active_requests}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold">
                            {node.uptime} Uptime
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase mt-1",
                              node.status === "healthy"
                                ? "text-emerald-500"
                                : node.status === "warning"
                                ? "text-amber-500"
                                : "text-destructive"
                            )}
                          >
                            {node.status}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Alerts Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-destructive/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <ShieldAlert className="h-24 w-24 text-destructive" />
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Active Threshold Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {data.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-5 hover:bg-destructive/10 transition-colors space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Text
                          variant="caption"
                          className="font-bold text-foreground block"
                        >
                          {alert.alert_type} violation
                        </Text>
                        <Text
                          variant="caption"
                          className="text-muted-foreground uppercase text-[9px] tracking-tighter"
                        >
                          Node: {alert.server}
                        </Text>
                      </div>
                      <Badge
                        variant="destructive"
                        className="animate-pulse text-[8px] font-bold h-5 px-2"
                      >
                        TRIGGERED
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <Text
                          variant="label"
                          className="text-[8px] opacity-50 block mb-1"
                        >
                          Limit
                        </Text>
                        <Text
                          variant="caption"
                          className="font-bold text-foreground"
                        >
                          {alert.threshold}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text
                          variant="label"
                          className="text-[8px] opacity-50 block mb-1"
                        >
                          Current
                        </Text>
                        <Text
                          variant="caption"
                          className="font-bold text-destructive"
                        >
                          {alert.current}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-destructive/10 border-t border-white/5">
                <Button
                  variant="ghost"
                  className="w-full h-10 text-[9px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/20 rounded-none"
                >
                  Acknowledge All Violations
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <Zap className="h-4 w-4" /> System Health Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text
                variant="caption"
                className="italic text-muted-foreground leading-relaxed"
              >
                "Infrastructure performance is currently stable within the
                **99.9% SLA** buffer. High CPU alerts on Server2 are correlated
                with the Q2 re-indexing cycle and require no immediate
                administrative traversal."
              </Text>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2.5rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <RefreshCw className="h-24 w-24 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Clock className="h-4 w-4" /> Audit Frequency
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Telemetry is synchronized with the **Institutional Data Node**
              every 60 seconds. Any state deviation exceeding ±5% triggers a
              high-priority alert.
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent"
              asChild
            >
              <Link href="/admin/control/audit-trail">
                Review Full Audit Trail
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
