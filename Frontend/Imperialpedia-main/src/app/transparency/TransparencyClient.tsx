"use client";

import React, { useEffect, useState } from "react";
import { TransparencyData, TransparencyReportNode } from "@/types/system";
import { systemService } from "@/services/data/system-service";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Globe,
  Activity,
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Loader2,
  ShieldAlert,
  Zap,
  Users,
  Scale,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * Public Platform Transparency Dashboard Client.
 * Displays governance, moderation, and community metrics to build user trust.
 */
export function TransparencyClient() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getTransparencyData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Transparency handshake failed", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownload = (title: string) => {
    toast({
      title: "Archive Export Initiated",
      description: `Compressing ${title} for download...`,
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
          Establishing Governance Handshake...
        </Text>
      </div>
    );
  }

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="max-w-3xl space-y-4 px-2">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <Text
            variant="label"
            className="text-xs font-bold tracking-widest uppercase"
          >
            Platform Integrity Index
          </Text>
        </div>
        <Text
          variant="h1"
          className="text-4xl lg:text-6xl font-bold tracking-tight"
        >
          Transparency Hub
        </Text>
        <Text
          variant="body"
          className="text-muted-foreground text-lg leading-relaxed"
        >
          Open governance for the global intelligence community. We believe in
          providing clear, auditable data regarding platform safety, editorial
          standards, and system performance.
        </Text>
      </header>

      {/* AGGREGATE GOVERNANCE Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            label: "Intelligence Nodes",
            value: data.metrics.articles_published.toLocaleString(),
            icon: FileText,
            color: "text-primary",
          },
          {
            label: "Verified Contributors",
            value: data.metrics.contributors.toLocaleString(),
            icon: Users,
            color: "text-secondary",
          },
          {
            label: "Editorial Audits",
            value: data.metrics.editorial_reviews.toLocaleString(),
            icon: ShieldCheck,
            color: "text-emerald-500",
          },
          {
            label: "Integrity Actions",
            value: data.metrics.moderation_actions.toLocaleString(),
            icon: ShieldAlert,
            color: "text-destructive",
          },
          {
            label: "Community Reports",
            value: data.metrics.community_reports.toLocaleString(),
            icon: MessageSquare,
            color: "text-amber-500",
          },
          {
            label: "Peer Revisions",
            value: data.metrics.revisions_made.toLocaleString(),
            icon: RefreshCw,
            color: "text-primary",
          },
        ].map((m) => (
          <Card
            key={m.label}
            className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all"
          >
            <CardContent className="p-8 flex items-center gap-6">
              <div
                className={cn(
                  "p-4 rounded-3xl bg-background/50 border border-white/5 shadow-inner transition-transform group-hover:scale-110",
                  m.color
                )}
              >
                <m.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tighter">
                  {m.value}
                </div>
                <Text
                  variant="label"
                  className="text-[10px] opacity-50 uppercase font-bold tracking-widest leading-none"
                >
                  {m.label}
                </Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* MODERATION STATISTICS */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Moderation Telemetry
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Content Integrity & Safety Enforcement
                </Text>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-destructive/20 bg-destructive/5 text-destructive font-bold uppercase text-[9px] h-6 px-3"
            >
              Real-time Feed
            </Badge>
          </div>

          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Safety Enforcement Trends
                </CardTitle>
                <CardDescription>
                  Visualizing content removals and community flagging cycles.
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[9px] font-bold uppercase">
                    Flagged
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-[9px] font-bold uppercase">
                    Removed
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.moderation.trends}>
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
                  <Bar
                    dataKey="flagged"
                    name="Flagged Nodes"
                    fill="#8272F2"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="removed"
                    name="Purged Nodes"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none shadow-xl bg-card/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Safety Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    label: "Content Flagged",
                    value: data.moderation.flagged,
                    color: "bg-primary",
                  },
                  {
                    label: "Content Purged",
                    value: data.moderation.removed,
                    color: "bg-destructive",
                  },
                  {
                    label: "Warnings Issued",
                    value: data.moderation.warnings,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Triage Accuracy",
                    value: "99.2%",
                    color: "bg-emerald-500",
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-foreground">{item.value}</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full", item.color)}
                        style={{ width: "75%" }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <Sparkles className="h-32 w-32 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" /> Integrity Strategy
              </div>
              <Text
                variant="caption"
                className="text-muted-foreground leading-relaxed italic block"
              >
                "Our safety protocols utilize **Algorithmic Sentiment Triage**.
                High-risk misinformation nodes are automatically throttled
                within 180 seconds of detection to protect network integrity."
              </Text>
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-bold text-xs uppercase"
                asChild
              >
                <a href="/about/safety">Review Safety Guidelines</a>
              </Button>
            </div>
          </div>
        </div>

        {/* EDITORIAL & QUALITY SIDEBAR */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Editorial Audit</CardTitle>
                  <Text
                    variant="label"
                    className="text-[9px] text-primary font-bold uppercase"
                  >
                    Verified Workflow
                  </Text>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.editorial.trends}>
                    <defs>
                      <linearGradient
                        id="colorAudit"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8272F2"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8272F2"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      name="Approved Nodes"
                      stroke="#8272F2"
                      fillOpacity={1}
                      fill="url(#colorAudit)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-bold uppercase text-[9px]"
                  >
                    Approval Handshakes
                  </Text>
                  <span className="text-sm font-mono font-bold text-emerald-500">
                    {data.editorial.approved}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-bold uppercase text-[9px]"
                  >
                    Revision Cycles
                  </Text>
                  <span className="text-sm font-mono font-bold text-amber-500">
                    {data.editorial.revised}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-bold uppercase text-[9px]"
                  >
                    Audit Throughput
                  </Text>
                  <span className="text-sm font-mono font-bold text-foreground">
                    92%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
              <Activity className="h-24 w-24 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Zap className="h-4 w-4" /> Quality Benchmarks
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Global intelligence reliability maintains an average score of **
              {data.quality.avg_score}/100**. {data.quality.verified_pct}% of
              the index is currently authored by **Verified Institutional
              Experts**.
            </Text>
          </div>

          <div className="p-8 rounded-[3rem] bg-card/30 border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-2xl">
              <Users className="h-8 w-8" />
            </div>
            <Text
              variant="bodySmall"
              weight="bold"
              className="uppercase tracking-widest"
            >
              Community Oversight
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed block"
            >
              We empower our readers to act as the final verification node.
              High-impact factual challenges are resolved by our lead editors
              within 24 hours.
            </Text>
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl border-primary/20 text-primary font-bold text-xs"
            >
              Access Moderation Matrix
            </Button>
          </div>
        </aside>
      </div>

      {/* PUBLIC REPORT ARCHIVE */}
      <section className="space-y-10 pt-16 border-t border-white/5">
        <header className="px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <Text variant="h3" className="font-bold">
              Official Governance Archive
            </Text>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground max-w-xl">
            Download our comprehensive longitudinal audits. Every report is
            cryptographically signed and stored within the public transparency
            ledger.
          </Text>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.reports.map((report) => (
            <Card
              key={report.id}
              className="glass-card border-none hover:border-primary/30 transition-all duration-500 overflow-hidden group"
            >
              <CardHeader className="bg-card/30 border-b border-white/5 p-6">
                <Badge
                  variant="secondary"
                  className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase h-5 px-2 mb-3"
                >
                  {report.period}
                </Badge>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors leading-tight">
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic block mb-6"
                >
                  "{report.summary}"
                </Text>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />{" "}
                    Identity Sealed
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary"
                    onClick={() => handleDownload(report.title)}
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden text-center lg:text-left">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Scale className="h-12 w-12" />
          </div>
          <div className="flex-1 space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">
              Institutional Faith by Default
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground leading-relaxed max-w-3xl"
            >
              Imperialpedia maintains a zero-trust architecture for data
              ingestion but a full-trust policy for transparency. Our governance
              nodes are synchronized with the **Consensus Registry** every 60
              seconds to ensure public data is never stale.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 group"
          >
            Contact Ethics Node{" "}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { RefreshCw } from "lucide-react";
import { Heart } from "lucide-react";
