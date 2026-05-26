"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  ChevronRight,
  RefreshCcw,
  Activity,
  LayoutDashboard,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Cpu,
  RotateCw,
  Gauge,
  Power,
  DatabaseZap,
  FastForward,
  Globe2,
  Radio,
  History,
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
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type IntegrationTab =
  | "dashboard"
  | "bus"
  | "dlq"
  | "indexing"
  | "security"
  | "health";

export default function IntegrationsAdminPanel() {
  const [activeTab, setActiveTab] = useState<IntegrationTab>("dashboard");
  const {
    integrations,
    apiLogs,
    globalSettings,
    indexingStatus,
    scopedEvents,
    scopedJobs,
    toggleEmergencyMode,
  } = useAppStore();
  const { toast } = useToast();

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              SYNC
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Systems Integration Hub
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <SyncNavItem
            icon={<LayoutDashboard />}
            label="Health Registry"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SyncNavItem
            icon={<Radio />}
            label="Global Event Bus"
            active={activeTab === "bus"}
            onClick={() => setActiveTab("bus")}
          />
          <SyncNavItem
            icon={<RotateCw />}
            label="Dead-Letter Queue"
            active={activeTab === "dlq"}
            onClick={() => setActiveTab("dlq")}
          />
          <SyncNavItem
            icon={<Gauge />}
            label="Performance"
            active={activeTab === "health"}
            onClick={() => setActiveTab("health")}
          />
          <SyncNavItem
            icon={<FastForward />}
            label="Indexing"
            active={activeTab === "indexing"}
            onClick={() => setActiveTab("indexing")}
          />
          <SyncNavItem
            icon={<Lock />}
            label="Security Keys"
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-sm space-y-3">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                Master Kill-Switch
              </span>
            </div>
            <p className="text-[8px] text-red-400 leading-relaxed italic">
              Immediately disconnect all external gateways.
            </p>
            <Button
              variant="destructive"
              className="w-full h-10 text-[9px] font-bold uppercase"
              onClick={toggleEmergencyMode}
            >
              <Power className="w-3 h-3 mr-2" /> ACTIVATE EMERGENCY
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/admin">
              <RefreshCcw className="w-4 h-4 mr-3" /> Master Control
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-ivory relative">
        <header className="flex justify-between items-center bg-white/80 luxury-blur p-8 border-b border-border sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-headline font-bold italic text-gray-900 uppercase tracking-widest">
              {activeTab === "bus" ? "Event Bus" : activeTab}
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Operational Integration Matrix
            </p>
          </div>
          <div className="w-10 h-10 bg-plum rounded-sm flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-md">
            AS
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {activeTab === "dashboard" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                  icon={<CheckCircle2 />}
                  label="Active Bridges"
                  value="12"
                  trend="Optimal"
                  positive={true}
                />
                <StatCard
                  icon={<Activity />}
                  label="Requests (24h)"
                  value="1.2M"
                  trend="+5.2%"
                  positive={true}
                />
                <StatCard
                  icon={<AlertTriangle />}
                  label="Endpoint Errors"
                  value="03"
                  trend="Action Needed"
                  positive={false}
                />
                <StatCard
                  icon={<Clock />}
                  label="Avg. Latency"
                  value="142ms"
                  trend="-12ms"
                  positive={true}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <Card className="lg:col-span-2 bg-white border-border shadow-luxury overflow-hidden">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="font-headline text-2xl">
                      Integration Health
                    </CardTitle>
                  </CardHeader>
                  <Table>
                    <TableHeader className="bg-ivory/50">
                      <TableRow>
                        <TableHead className="text-[9px] uppercase font-bold pl-8">
                          Integration
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold">
                          Type
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold">
                          Uptime
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-center">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrations.map((int) => (
                        <TableRow key={int.id} className="hover:bg-ivory/30">
                          <TableCell className="pl-8">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold leading-tight">
                                {int.name}
                              </span>
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest">
                                {int.provider}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[8px] uppercase tracking-widest"
                            >
                              {int.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-light">
                            {int.uptime}%
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-[8px] uppercase",
                                int.status === "Connected"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-red-50 text-red-600"
                              )}
                            >
                              {int.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                <Card className="bg-white border-border shadow-luxury">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="font-headline text-2xl">
                      API Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-6">
                    {apiLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-ivory rounded-sm border border-border/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              log.status === 200 ? "bg-green-500" : "bg-red-500"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase font-mono">
                              {log.method} {log.endpoint}
                            </span>
                            <span className="text-[8px] text-gray-400 uppercase">
                              {log.latency}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[7px] font-mono"
                        >
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "bus" && (
            <div className="space-y-12">
              <Card className="bg-white border-border shadow-luxury overflow-hidden">
                <CardHeader className="border-b border-border bg-plum/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="font-headline text-2xl uppercase">
                        Global Event Stream
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase tracking-widest">
                        Real-time asynchronous module communication
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-plum/10 text-plum border-none px-4 h-8 rounded-none text-[8px] uppercase animate-pulse"
                    >
                      Pulse: Active
                    </Badge>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-ivory/50">
                    <TableRow>
                      <TableHead className="text-[9px] uppercase font-bold pl-8">
                        Event ID
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Type
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Source
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-center">
                        Status
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                        Age
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedEvents.map((evt) => (
                      <TableRow
                        key={evt.id}
                        className="hover:bg-ivory/30 transition-colors"
                      >
                        <TableCell className="pl-8 font-mono text-[9px] text-gray-400">
                          {evt.id}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                            {evt.type.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[7px] uppercase border-plum/20 text-plum"
                          >
                            {evt.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "text-[7px] uppercase border-none",
                              evt.status === "processed"
                                ? "bg-green-50 text-green-600"
                                : "bg-blue-50 text-blue-600"
                            )}
                          >
                            {evt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8 font-mono text-[9px] text-gray-300">
                          {Math.round(
                            (Date.now() - new Date(evt.createdAt).getTime()) /
                              1000
                          )}
                          s ago
                        </TableCell>
                      </TableRow>
                    ))}
                    {scopedEvents.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-40 text-center opacity-20"
                        >
                          <Radio className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            No Events in current buffer
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === "dlq" && (
            <div className="space-y-12">
              <Card className="bg-white border-border shadow-luxury overflow-hidden">
                <CardHeader className="border-b border-border bg-red-50/30">
                  <div className="flex items-center space-x-4">
                    <RotateCw className="w-6 h-6 text-red-600" />
                    <div>
                      <CardTitle className="font-headline text-2xl uppercase">
                        Job Dead-Letter Queue
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase tracking-widest text-red-400">
                        Failed asynchronous workers awaiting retry or manual
                        intervention
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-ivory/50">
                    <TableRow>
                      <TableHead className="text-[9px] uppercase font-bold pl-8">
                        Job ID
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Job Type
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Failure Trace
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-center">
                        Attempts
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedJobs
                      .filter(
                        (j) => j.status === "failed" || j.status === "retrying"
                      )
                      .map((job) => (
                        <TableRow key={job.id} className="hover:bg-red-50/10">
                          <TableCell className="pl-8 font-mono text-[10px]">
                            {job.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[8px] uppercase"
                            >
                              {job.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-red-600 font-light italic max-w-[200px] truncate">
                            {job.error}
                          </TableCell>
                          <TableCell className="text-center font-bold text-[10px]">
                            {job.retryCount} / {job.maxRetries}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button
                              size="sm"
                              className="h-8 bg-black text-white hover:bg-plum text-[8px] font-bold uppercase rounded-none"
                            >
                              MANUAL RE-QUEUE
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {scopedJobs.filter(
                      (j) => j.status === "failed" || j.status === "retrying"
                    ).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-40 text-center opacity-20"
                        >
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            Job Queues Optimal
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {["health", "indexing", "security"].includes(activeTab) && (
            <div className="py-40 text-center space-y-6">
              <div className="p-12 bg-ivory border border-border rounded-full animate-pulse inline-block mx-auto">
                <RefreshCcw className="w-12 h-12 text-gold/30 mx-auto" />
              </div>
              <p className="text-2xl text-muted-foreground font-light italic font-headline">
                The {activeTab} terminal is currently synchronizing with the
                Maison Core infrastructure.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SyncNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group rounded-sm border",
        active
          ? "bg-plum text-white border-plum shadow-md"
          : "text-gray-400 hover:bg-ivory hover:text-plum border-transparent"
      )}
    >
      <span
        className={cn(
          "transition-transform group-hover:scale-110",
          active ? "text-white" : "text-gold"
        )}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-5 h-5",
        })}
      </span>
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  positive,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <Card className="bg-white border-border shadow-luxury hover:border-gold transition-colors group">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="p-4 bg-ivory rounded-full group-hover:bg-gold/10 transition-colors text-plum">
            {icon}
          </div>
          <div
            className={cn(
              "flex items-center text-[10px] font-bold tracking-widest uppercase",
              positive ? "text-gold" : "text-gray-400"
            )}
          >
            {trend}{" "}
            {positive ? <ArrowUpRight className="ml-1 w-3 h-3" /> : null}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-[10px] uppercase tracking-[0.4em] font-bold">
            {label}
          </div>
          <div className="text-4xl font-headline font-bold italic mt-2 text-gray-900">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCard({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <Card className="bg-white border-border p-6 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">
          {label}
        </p>
        <span className="text-xs font-bold text-plum">{value}</span>
      </div>
      <Progress value={progress} className="h-1 bg-ivory" />
    </Card>
  );
}

function PerformanceRow({
  label,
  val,
  max = 100,
}: {
  label: string;
  val: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-plum">
          {val}
          {max === 100 ? "%" : ` / ${max}`}
        </span>
      </div>
      <Progress value={(val / max) * 100} className="h-1 bg-ivory" />
    </div>
  );
}
