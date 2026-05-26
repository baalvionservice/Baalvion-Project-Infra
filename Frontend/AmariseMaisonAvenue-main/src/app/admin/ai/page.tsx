"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  BrainCircuit,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Activity,
  Search,
  ChevronRight,
  Info,
  Clock,
  Target,
  AlertTriangle,
  Lock,
  Eye,
  BarChart3,
  Terminal,
  Layers,
  Database,
  RefreshCcw,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAI } from "@/hooks/use-ai";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

/**
 * Institutional AI Control Panel: Tactical Layer 4 Node.
 * Universal command hub for Resonance, Value, and Security logic.
 * Designed for absolute explainability and neural traceability.
 */
export default function AIControlPanel() {
  const { modules, logs, suggestions } = useAI();
  const {
    scopedFraudLogs,
    scopedPricingOptimizations,
    optimizeRegistryPricing,
    adminJurisdiction,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(
    () => ({
      activeModels: modules.filter((m) => m.enabled).length,
      confidenceScore: 98.4,
      decisionsToday: logs.length * 12, // Simulated volume
      activeAnomalies: scopedFraudLogs.filter((f) => f.riskLevel === "high")
        .length,
    }),
    [modules, logs, scopedFraudLogs]
  );

  const handlePricingCycle = () => {
    const hub = adminJurisdiction === "global" ? "us" : adminJurisdiction;
    optimizeRegistryPricing(hub as any);
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-plum">
            <BrainCircuit className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Tactical Layer 4
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            Neural Control
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Orchestrating autonomous logic and predictive matrix for the Maison.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className="h-14 px-8 rounded-none border-white/10 text-white/60 hover:bg-white hover:text-black text-[9px] font-bold uppercase tracking-widest transition-all"
            onClick={handlePricingCycle}
          >
            <RefreshCcw className="w-4 h-4 mr-3" /> TRIGGER PRICING CYCLE
          </Button>
          <Button className="h-14 px-10 rounded-none bg-plum text-white hover:bg-black transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20">
            <Cpu className="w-4 h-4 mr-3" /> RE-CALIBRATE MODELS
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <AIStatCard
          label="Model Alignment"
          value={`${stats.confidenceScore}%`}
          trend="Optimal"
          icon={<ShieldCheck />}
        />
        <AIStatCard
          label="Decisions (24h)"
          value={stats.decisionsToday.toLocaleString()}
          trend="+5.2%"
          icon={<Activity />}
        />
        <AIStatCard
          label="Active Nodes"
          value={`${stats.activeModels} / ${modules.length}`}
          trend="In Hub"
          icon={<Layers />}
        />
        <AIStatCard
          label="Risk Alerts"
          value={stats.activeAnomalies}
          trend="Priority"
          icon={<AlertTriangle />}
          color={
            stats.activeAnomalies > 0 ? "text-red-500" : "text-emerald-400"
          }
        />
      </div>

      <Tabs defaultValue="pulse" className="w-full">
        <TabsList className="bg-[#111113] border border-white/5 h-14 w-full justify-start p-1 rounded-none space-x-2 mb-10">
          <TabsTrigger
            value="pulse"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Neural Pulse
          </TabsTrigger>
          <TabsTrigger
            value="resonance"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Resonance (Recs)
          </TabsTrigger>
          <TabsTrigger
            value="value"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Value Matrix
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Security Matrix
          </TabsTrigger>
          <TabsTrigger
            value="traces"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Neural Traces
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pulse" className="space-y-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Card className="lg:col-span-8 bg-[#111113] border-white/5 rounded-none overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="font-headline text-2xl text-white italic">
                    Module Connectivity
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Health of jurisdictional autonomous nodes
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-white/10 text-blue-400 text-[8px] uppercase"
                >
                  Synced: 12ms
                </Badge>
              </CardHeader>
              <div className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                        Protocol Node
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Automation Level
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        SLA Accuracy
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => (
                      <TableRow
                        key={mod.id}
                        className="hover:bg-white/5 transition-colors border-white/5 h-16"
                      >
                        <TableCell className="pl-8">
                          <div className="flex items-center space-x-4">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                mod.enabled
                                  ? "bg-emerald-500 shadow-emerald-500/20"
                                  : "bg-red-500"
                              )}
                            />
                            <span className="text-xs font-bold text-white uppercase tracking-tight">
                              {mod.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[7px] border-white/10 text-plum uppercase"
                          >
                            {mod.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Progress
                              value={95 + Math.random() * 4}
                              className="h-0.5 w-12 bg-white/5"
                            />
                            <span className="text-[9px] font-bold text-white/40">
                              98%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[7px] border-none uppercase",
                              mod.enabled
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-white/5 text-white/20"
                            )}
                          >
                            {mod.enabled ? "Operating" : "Dormant"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles className="w-40 h-40 text-plum" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-headline font-bold italic tracking-tight">
                    AI Strategy Node
                  </h3>
                  <p className="text-sm font-light italic text-white/60 leading-relaxed">
                    "Autonomous business logic is currently focused on
                    scarcity-driven pricing in the UAE hub and personalized
                    resonance for Diamond-tier collectors."
                  </p>
                </div>
                <div className="space-y-6 pt-6 border-t border-white/10">
                  <NeuralKPI label="Predictive Accuracy" val={94} />
                  <NeuralKPI label="Resonance Score" val={88} />
                  <NeuralKPI label="Security Hardening" val={100} />
                </div>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="resonance" className="space-y-10 animate-fade-in">
          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            <CardHeader className="bg-white/5 border-b border-white/5 p-8">
              <div className="flex items-center space-x-4">
                <Target className="w-6 h-6 text-plum" />
                <div>
                  <CardTitle className="text-white font-headline text-2xl uppercase">
                    Resonance Engine suggestions
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Explainable product suggestions generated for active
                    collectors
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Target Connoisseur
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Resonance Rationale
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">
                    Score
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((sug) => (
                  <TableRow
                    key={sug.id}
                    className="hover:bg-white/5 transition-colors border-white/5 h-20"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase tracking-tight">
                          {sug.title}
                        </span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">
                          ID: {sug.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-light italic text-white/60">
                      "{sug.description}"
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-bold text-plum tabular">
                        0.94
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[7px] uppercase border-none px-2",
                          sug.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/10 text-white/40"
                        )}
                      >
                        {sug.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="value" className="space-y-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
                <CardHeader className="bg-white/5 border-b border-white/5 p-8">
                  <CardTitle className="text-white font-headline text-2xl uppercase">
                    Dynamic Pricing Log
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Explainable value adjustments based on market scarcity
                  </CardDescription>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                        Artifact
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Optimization Rationale
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Delta
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                        New Value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedPricingOptimizations.map((price) => (
                      <TableRow
                        key={price.id}
                        className="hover:bg-white/5 transition-colors border-white/5 h-20"
                      >
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase tracking-tight">
                              {price.productId}
                            </span>
                            <span className="text-[8px] text-white/20 uppercase tracking-widest">
                              {(price.country || "").toUpperCase()} HUB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[7px] border-plum/20 text-plum uppercase"
                          >
                            {price.reason}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold text-emerald-400 tabular">
                            +
                            {Math.round(
                              (price.adjustedPrice / price.basePrice - 1) * 100
                            )}
                            %
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <span className="text-sm font-bold text-white tabular">
                            ${price.adjustedPrice.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-[#111113] border-white/5 p-8 space-y-6">
                <div className="flex items-center space-x-3 text-gold">
                  <Lock className="w-5 h-5" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">
                    Maison Integrity Rails
                  </h4>
                </div>
                <p className="text-[10px] text-white/40 italic leading-relaxed">
                  "Autonomous pricing is strictly governed. Max increase cap:
                  +20%. Max discount cap: -30%."
                </p>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <RailItem label="Max Increase Cap" val="+20%" />
                  <RailItem label="Max Discount Cap" val="-30%" />
                  <RailItem label="Stability Window" val="24 Hours" />
                </div>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-10 animate-fade-in">
          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            <CardHeader className="bg-white/5 border-b border-white/5 p-8">
              <div className="flex items-center space-x-4">
                <ShieldCheck className="w-6 h-6 text-red-500" />
                <div>
                  <CardTitle className="text-white font-headline text-2xl uppercase">
                    Fraud Security matrix
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Heuristic risk evaluations for high-value acquisitions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Session Identity
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40 text-center">
                    Risk Score
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Logic Triggers
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Action Matrix
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedFraudLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-white/5 transition-colors border-white/5 h-20"
                  >
                    <TableCell className="pl-8 font-mono text-[10px] text-white/40 uppercase truncate max-w-[120px]">
                      {log.userId}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "text-xs font-bold tabular",
                          log.riskScore > 70
                            ? "text-red-500"
                            : log.riskScore > 30
                            ? "text-gold"
                            : "text-emerald-400"
                        )}
                      >
                        {log.riskScore} / 100
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-light italic text-white/60">
                      "{log.reason}"
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[7px] uppercase border-none px-2",
                          log.actionTaken === "block"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-white/5 text-white/20"
                        )}
                      >
                        {log.actionTaken}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="traces" className="animate-fade-in space-y-8">
          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            <CardHeader className="bg-white/5 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl text-white">
                  Neural Decision Traces
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                  Low-level execution logs for institutional audit
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input
                  className="bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 text-white"
                  placeholder="SEARCH TRACES..."
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
                    Module
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Decision Logic
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Latency
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-white/5 transition-colors border-white/5 h-12"
                  >
                    <TableCell className="pl-8 text-[9px] font-mono text-white/20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[7px] border-white/10 text-blue-400 uppercase"
                      >
                        {log.moduleId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-light italic text-white/60">
                      "{(log.action || "").replace("_", " ")}"
                    </TableCell>
                    <TableCell className="text-right pr-8 font-mono text-[9px] text-emerald-400">
                      14ms
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

function AIStatCard({ label, value, trend, icon, color = "text-white" }: any) {
  return (
    <Card className="bg-[#111113] border-white/5 p-8 space-y-4 group hover:border-plum transition-all rounded-none shadow-xl">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-plum transition-colors">
          {label}
        </span>
        <div className="text-white/20">
          {React.cloneElement(icon as React.ReactElement, { size: 16 } as any)}
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
      <Badge
        variant="outline"
        className="text-[7px] uppercase border-white/10 text-white/40"
      >
        {trend}
      </Badge>
    </Card>
  );
}

function NeuralKPI({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.3em]">
        <span className="opacity-40">{label}</span>
        <span className="text-plum">{val}%</span>
      </div>
      <div className="h-0.5 bg-white/5 w-full">
        <div
          className="h-full bg-plum transition-all duration-1000"
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}

function RailItem({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
        {label}
      </span>
      <span className="text-sm font-bold text-white tabular">{val}</span>
    </div>
  );
}
