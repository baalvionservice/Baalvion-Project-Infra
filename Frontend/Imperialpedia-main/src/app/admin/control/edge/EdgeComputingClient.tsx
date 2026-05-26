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
import { Progress } from "@/components/ui/progress";
import { Text } from "@/design-system/typography/text";
import {
  Globe,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Monitor,
  Cpu,
  Network,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldAlert,
  XCircle,
  CheckCircle2,
  Layers,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { systemService } from "@/services/data/system-service";
import {
  EdgeComputingData,
  RegionNode,
  EdgeNode,
  EdgeAlert,
} from "@/types/system";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * Edge Computing & Multi-Region Governance Dashboard.
 * Orchestrates global distribution and node-level resource allocation.
 */
export function EdgeComputingClient() {
  const [data, setData] = useState<EdgeComputingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getEdgeComputingData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Edge state sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeploy = async (nodeName: string) => {
    setDeploying(nodeName);
    toast({
      title: "Edge Deployment Initiated",
      description: `Synchronizing functional nodes with ${nodeName}...`,
    });

    await new Promise((r) => setTimeout(r, 1500));
    setDeploying(null);

    toast({
      title: "Synchronization Complete",
      description: `Targeting cache burst successful at ${nodeName}.`,
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Global Edge Link...
        </Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "mock_active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3">
            <CheckCircle2 className="h-2.5 w-2.5" /> Active
          </Badge>
        );
      case "mock_warning":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3">
            <AlertTriangle className="h-2.5 w-2.5" /> Warning
          </Badge>
        );
      case "mock_offline":
        return (
          <Badge
            variant="destructive"
            className="gap-1.5 font-bold uppercase text-[9px] h-6 px-3"
          >
            <XCircle className="h-2.5 w-2.5" /> Offline
          </Badge>
        );
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* REGION OVERVIEW SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                Deployment Regions
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Global Replication Zones
              </Text>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30 h-10 px-4"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Synchronize States
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.regions.map((region) => (
            <Card
              key={region.region_name}
              className="glass-card border-none shadow-xl group hover:border-primary/30 transition-all duration-500"
            >
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Text
                      variant="body"
                      weight="bold"
                      className="group-hover:text-primary transition-colors"
                    >
                      {region.region_name}
                    </Text>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono uppercase font-bold">
                      <MapPin className="h-2.5 w-2.5" /> Zone Alpha-1
                    </div>
                  </div>
                  {getStatusBadge(region.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <Text
                      variant="label"
                      className="text-[8px] opacity-50 uppercase tracking-widest"
                    >
                      Latency
                    </Text>
                    <div
                      className={cn(
                        "text-xl font-bold font-mono",
                        parseInt(region.latency) > 100
                          ? "text-amber-500"
                          : "text-foreground"
                      )}
                    >
                      {region.latency}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <Text
                      variant="label"
                      className="text-[8px] opacity-50 uppercase tracking-widest"
                    >
                      Active Nodes
                    </Text>
                    <div className="text-xl font-bold font-mono text-primary">
                      {region.nodes}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* EDGE NODES & ALERTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* EDGE NODE REGISTRY */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                Edge Node Registry
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Instruction Hub Performance
              </Text>
            </div>
          </div>

          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Node Label
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Region Hub
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      CPU/Mem Load
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                      Network Flow
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.edge_nodes.map((node) => (
                    <TableRow
                      key={node.node_name}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-all">
                            <Monitor className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-tight">
                            {node.node_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-[9px] uppercase font-bold tracking-tighter"
                        >
                          {node.region}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 min-w-[120px] px-4">
                          <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase">
                            <span>Composite</span>
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
                      <TableCell className="text-right font-mono text-xs font-bold text-primary">
                        {node.network_traffic}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deploying === node.node_name}
                          onClick={() => handleDeploy(node.node_name)}
                          className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          {deploying === node.node_name ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Activity className="h-3.5 w-3.5" />
                          )}
                          {deploying === node.node_name
                            ? "Syncing"
                            : "Deploy Node"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* ANOMALY TELEMETRY SIDEBAR */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                Edge Telemetry
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Anomaly & Threshold Warnings
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            {data.alerts.map((alert, i) => (
              <Card
                key={i}
                className="glass-card border-none bg-destructive/5 hover:bg-destructive/10 transition-all group overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive opacity-50" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        className="text-destructive uppercase tracking-tight"
                      >
                        {alert.alert_type}
                      </Text>
                      <Text
                        variant="caption"
                        className="text-muted-foreground font-mono text-[10px]"
                      >
                        Target: {alert.region || alert.node}
                      </Text>
                    </div>
                    <Badge
                      variant="destructive"
                      className="animate-pulse text-[8px] font-bold px-2 h-5"
                    >
                      TRIGGERED
                    </Badge>
                  </div>
                  {alert.current && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <Text
                        variant="label"
                        className="text-[8px] opacity-50 uppercase font-bold"
                      >
                        Measured Value:
                      </Text>
                      <span className="text-sm font-mono font-bold text-foreground">
                        {alert.current}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Network className="h-16 w-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Routing Intelligence
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic"
            >
              "The Anycast Routing engine is currently optimizing for **minimum
              hop-count**. Traffic from South America is being re-routed to
              US-East via the hot-standby node to mitigate local offline
              status."
            </Text>
          </div>
        </div>
      </div>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Layers className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">
              Edge Resilience Matrix
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl"
            >
              Imperialpedia utilizes a **Multi-Cloud Edge Strategy**.
              Intelligence nodes are cached across 140+ global points of
              presence, ensuring sub-50ms discovery for 98% of the international
              audience network.
            </Text>
          </div>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0"
            asChild
          >
            <Link href="/admin/control/audit-trail">Governance Logs</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
