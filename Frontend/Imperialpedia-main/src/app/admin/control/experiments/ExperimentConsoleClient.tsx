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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/design-system/typography/text";
import {
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Play,
  Square,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  FlaskConical,
  LineChart,
  ChevronRight,
  MousePointer2,
  Users,
  CheckCircle2,
  Clock,
  Layout,
  Filter,
} from "lucide-react";
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { systemService } from "@/services/data/system-service";
import {
  ExperimentManagementData,
  ExperimentNode,
  AbVariant,
  ExperimentDetail,
} from "@/types/system";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

/**
 * Experiment Tracking & A/B Testing Console Client.
 * Orchestrates conversion rate optimization and feature validation through progressive rollouts.
 */
export function ExperimentConsoleClient() {
  const [data, setData] = useState<ExperimentManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState<ExperimentNode | null>(null);
  const [activeTab, setActiveTab] = useState("registry");
  const [trafficA, setTrafficA] = useState(50);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getExperimentManagementData();
        if (response.data) {
          setData(response.data);
          setSelectedExp(response.data.experiments[0]);
        }
      } catch (e) {
        console.error("Experiment state sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleState = (id: string, currentStatus: string) => {
    const newStatus =
      currentStatus === "mock_running" ? "mock_completed" : "mock_running";
    toast({
      title:
        newStatus === "mock_running"
          ? "Experiment Reactivated"
          : "Experiment Finalized",
      description: `Target node state shifted to ${newStatus.split("_")[1]}.`,
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
          Calibrating Testing Clusters...
        </Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "mock_running":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3">
            <Activity className="h-2.5 w-2.5 animate-pulse" /> Running
          </Badge>
        );
      case "mock_completed":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3">
            <CheckCircle2 className="h-2.5 w-2.5" /> Completed
          </Badge>
        );
      case "mock_draft":
        return (
          <Badge
            variant="outline"
            className="border-white/10 text-muted-foreground text-[9px] h-6 px-3"
          >
            DRAFT
          </Badge>
        );
      default:
        return <Badge variant="outline">{status.split("_")[1]}</Badge>;
    }
  };

  const currentDetails = data.experiment_details.find(
    (d) => d.experiment_name === selectedExp?.experiment_name
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <FlaskConical className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Optimization Kernel
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Experiment Console
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
          >
            <Filter className="mr-2 h-4 w-4" /> Global Matrix
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Start New A/B Test
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* EXPERIMENT REGISTRY */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Experiment Registry</CardTitle>
                  <CardDescription>
                    Managing the lifecycle of platform-wide conversion tests.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-widest px-3 h-7"
                >
                  ACTIVE PIPELINE
                </Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Experiment Name
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      CTR
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Temporal Node
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.experiments.map((exp) => (
                    <TableRow
                      key={exp.id}
                      className={cn(
                        "group transition-colors border-b border-white/5 cursor-pointer",
                        selectedExp?.id === exp.id
                          ? "bg-primary/5"
                          : "hover:bg-white/5"
                      )}
                      onClick={() => setSelectedExp(exp)}
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90">
                            {exp.experiment_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1 mt-1 max-w-[200px] italic">
                            {exp.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {getStatusBadge(exp.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold font-mono text-primary">
                            {exp.kpi.CTR}
                          </span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-primary"
                              style={{ width: exp.kpi.CTR }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {exp.start_date}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50 font-mono">
                            TO {exp.end_date}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* PERFORMANCE TRAJECTORY */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Performance Trajectory
                </CardTitle>
                <CardDescription>
                  Comparison of conversion events between Variant A and Variant
                  B.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Control
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Challenger
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLine data={currentDetails?.chart_data || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff05"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1822",
                      border: "1px solid #ffffff10",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="variantA"
                    stroke="#8272F2"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8272F2" }}
                    name="Control (A)"
                  />
                  <Line
                    type="monotone"
                    dataKey="variantB"
                    stroke="#69B9FF"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#69B9FF" }}
                    name="Variant B"
                  />
                </RechartsLine>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* A/B CONSOLE SIDEBAR */}
        <div className="lg:col-span-5 space-y-10">
          <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Zap className="h-32 w-32 text-primary" />
            </div>
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">A/B Testing Console</CardTitle>
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest"
                  >
                    Active Test: {selectedExp?.experiment_name}
                  </Text>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {/* Traffic Orchestration */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Text
                    variant="bodySmall"
                    weight="bold"
                    className="uppercase tracking-widest text-primary text-[10px]"
                  >
                    Traffic Distribution
                  </Text>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-none font-mono"
                  >
                    {trafficA}% / {100 - trafficA}%
                  </Badge>
                </div>
                <div className="space-y-4">
                  <Slider
                    value={[trafficA]}
                    onValueChange={(val) => setTrafficA(val[0])}
                    max={100}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tighter px-1">
                    <span>Control (Variant A)</span>
                    <span>Variant B (Challenger)</span>
                  </div>
                </div>
              </div>

              {/* Variant Matrix */}
              <div className="grid grid-cols-2 gap-6">
                {data.ab_variants.map((v) => (
                  <div
                    key={v.variant}
                    className={cn(
                      "p-6 rounded-2xl border transition-all duration-500",
                      v.variant === "A"
                        ? "bg-background/40 border-white/5"
                        : "bg-secondary/5 border-secondary/20 shadow-lg"
                    )}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                          v.variant === "A"
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary/20 text-secondary"
                        )}
                      >
                        {v.variant}
                      </div>
                      {v.variant === "B" && (
                        <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                          <TrendingUp className="h-3 w-3" /> +20%
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Text
                          variant="label"
                          className="text-[8px] opacity-50 uppercase tracking-widest block"
                        >
                          Conv. Rate
                        </Text>
                        <div className="text-2xl font-bold font-mono">
                          {v.metric_values.Conversions}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Text
                          variant="label"
                          className="text-[8px] opacity-50 uppercase tracking-widest block"
                        >
                          CTR Node
                        </Text>
                        <div className="text-xl font-bold font-mono text-muted-foreground">
                          {v.metric_values.CTR}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights Buffer */}
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase mb-3">
                  <Sparkles className="h-3 w-3" /> Statistical Significance
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic block"
                >
                  "
                  {currentDetails?.variant_insights ||
                    "Awaiting enough data nodes to finalize the winning variant signature."}
                  "
                </Text>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() =>
                    handleToggleState(selectedExp?.id!, selectedExp?.status!)
                  }
                  className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                >
                  {selectedExp?.status === "mock_running" ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {selectedExp?.status === "mock_running"
                    ? "Stop Experiment"
                    : "Launch Experiment"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl border-white/10 bg-background/30"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-background/30 p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Activity className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Integrity
              Node
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Every variant shift is logged in the immutable **Audit Trail**.
              Traffic redistribution triggers an immediate cache-burst across
              global CDN edge nodes to ensure consistent user experience.
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto w-fit text-primary font-bold text-xs group/link"
            >
              Review Governance Logs{" "}
              <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
