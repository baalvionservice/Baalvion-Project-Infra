"use client";

import React, { useEffect, useState } from "react";
import {
  InfrastructureMockData,
  InfrastructureNode,
  PipelineNode,
  QueueNode,
} from "@/types/system";
import { systemService } from "@/services/data/system-service";
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
import { Text } from "@/design-system/typography/text";
import {
  Server,
  Database,
  Zap,
  GitPullRequest,
  RotateCcw,
  Play,
  Activity,
  Layers,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Monitor,
  Cpu,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function InfrastructureClient() {
  const [data, setData] = useState<InfrastructureMockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await systemService.getInfrastructureMockData();
      if (response.data) setData(response.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleTriggerBuild = () => {
    setIsDeploying(true);
    toast({
      title: "Build Triggered",
      description:
        "Pipeline 'Build & Deploy' initiated across production ring.",
    });
    setTimeout(() => {
      setIsDeploying(false);
      toast({
        title: "Build Success",
        description: "V4.2.1 successfully deployed to secondary cluster.",
      });
    }, 3000);
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Infrastructure Link...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* CLUSTER OVERVIEW */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                Server Clusters
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Resource Allocation Matrix
              </Text>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[9px] h-6 px-3">
            <Activity className="h-3 w-3 mr-1.5 animate-pulse" /> Nodes
            Synchronized
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.infrastructure.map((cluster) => (
            <Card
              key={cluster.cluster}
              className="glass-card border-none shadow-xl overflow-hidden group hover:border-primary/30 transition-all duration-500"
            >
              <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">
                    {cluster.cluster}
                  </CardTitle>
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-mono"
                  >
                    {cluster.nodes} Nodes Active
                  </Text>
                </div>
                <Badge
                  variant={
                    cluster.auto_scaling === "mock_active"
                      ? "default"
                      : "outline"
                  }
                  className={cn(
                    "text-[8px] font-bold uppercase h-5",
                    cluster.auto_scaling === "mock_active"
                      ? "bg-primary"
                      : "text-muted-foreground"
                  )}
                >
                  Auto-Scale: {cluster.auto_scaling.split("_")[1]}
                </Badge>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>CPU Load</span>
                      <span className="text-foreground">
                        {cluster.cpu_usage}
                      </span>
                    </div>
                    <Progress
                      value={parseInt(cluster.cpu_usage)}
                      className="h-1.5 bg-white/5"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Memory</span>
                      <span className="text-foreground">
                        {cluster.memory_usage}
                      </span>
                    </div>
                    <Progress
                      value={parseInt(cluster.memory_usage)}
                      className="h-1.5 bg-white/5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Text
                      variant="label"
                      className="text-[8px] opacity-50 block"
                    >
                      Network Usage
                    </Text>
                    <div className="flex items-center gap-2 text-sm font-mono font-bold">
                      <Globe className="h-3.5 w-3.5 text-primary" />{" "}
                      {cluster.network_usage}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CI/CD & DEPLOYMENT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                CI/CD Pipelines
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Deployment Lifecycle
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            {data.ci_cd.map((pipe) => (
              <Card
                key={pipe.pipeline_name}
                className="glass-card border-none hover:bg-white/5 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={cn(
                          "p-3 rounded-2xl bg-background/50 border border-white/5",
                          pipe.status === "mock_running"
                            ? "text-primary animate-pulse"
                            : "text-emerald-500"
                        )}
                      >
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="body"
                          weight="bold"
                          className="block truncate"
                        >
                          {pipe.pipeline_name}
                        </Text>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-[8px] h-4 border-white/10 uppercase"
                          >
                            {pipe.status.split("_")[1]}
                          </Badge>
                          <div className="flex-1 max-w-[200px]">
                            <Progress
                              value={parseInt(pipe.progress)}
                              className="h-1 bg-white/5"
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold">
                            {pipe.progress}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:text-primary"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        disabled={isDeploying || pipe.status === "mock_running"}
                        onClick={handleTriggerBuild}
                        className="h-10 px-6 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-none border border-primary/20"
                      >
                        {isDeploying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {isDeploying ? "Processing" : "Trigger"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CACHING & QUEUES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                Caching & Queues
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Asynchronous Data Health
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.caching_queues.map((queue) => (
              <Card
                key={queue.name}
                className="glass-card border-none bg-card/30"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-amber-500">
                        {queue.name.includes("Redis") ? (
                          <Database className="h-4 w-4" />
                        ) : (
                          <Layers className="h-4 w-4" />
                        )}
                      </div>
                      <Text variant="bodySmall" weight="bold">
                        {queue.name}
                      </Text>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] font-bold uppercase h-5",
                        queue.error_rate === "mock_none"
                          ? "text-emerald-500 border-emerald-500/20"
                          : "text-amber-500 border-amber-500/20"
                      )}
                    >
                      Errors: {queue.error_rate.split("_")[1]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <Text
                        variant="label"
                        className="text-[8px] opacity-50 block uppercase tracking-widest"
                      >
                        Queue Length
                      </Text>
                      <div className="text-xl font-bold font-mono">
                        {queue.queue_length}{" "}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Jobs
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Text
                        variant="label"
                        className="text-[8px] opacity-50 block uppercase tracking-widest"
                      >
                        Processed (24h)
                      </Text>
                      <div className="text-xl font-bold font-mono text-primary">
                        {queue.processed_jobs}k
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> High Availability
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic"
            >
              "Infrastructure is currently operating across **3 distinct
              availability zones**. Load balancing algorithm is set to 'Least
              Connections' for optimal discovery latency."
            </Text>
          </div>
        </div>
      </section>

      {/* STRATEGIC FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Monitor className="h-64 w-64 text-primary" />
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Cpu className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">
              Scaling Efficiency: Optimal
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl"
            >
              Platform scale is maintaining a **1:240,000** node-to-user ratio.
              Programmatic indexing pipelines are benchmarked at 42ms per
              discovery handshake.
            </Text>
          </div>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0"
            asChild
          >
            <Link href="/admin/control/audit-trail">
              System Governance Logs
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
