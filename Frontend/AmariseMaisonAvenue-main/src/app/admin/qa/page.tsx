"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Play,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Activity,
  LayoutDashboard,
  ChevronRight,
  History,
  FastForward,
  ShieldCheck,
  Zap,
  Clock,
  Search,
  Gauge,
  Cpu,
  AlertTriangle,
  FileText,
  Terminal,
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
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QADashboard() {
  const {
    scopedQATests,
    runQATest,
    runAllQATests,
    runStressTest,
    scopedStressTests,
    currentUser,
  } = useAppStore();

  const [activeModule, setActiveTab] = useState("all");
  const [loadSize, setLoadSize] = useState<number>(1000);

  const filteredTests =
    activeModule === "all"
      ? scopedQATests
      : scopedQATests.filter((t) => t.module === activeModule);

  const stats = {
    total: scopedQATests.length,
    passed: scopedQATests.filter((t) => t.status === "passed").length,
    failed: scopedQATests.filter((t) => t.status === "failed").length,
    running: scopedQATests.filter((t) => t.status === "running").length,
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              QA
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Automation & Integrity
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <AdminNavItem
            icon={<LayoutDashboard />}
            label="Intelligence Hub"
            href="/admin"
          />
          <AdminNavItem
            icon={<FlaskConical />}
            label="Test Matrix"
            active={true}
          />
          <AdminNavItem icon={<Gauge />} label="Stress Lab" active={false} />
          <AdminNavItem icon={<History />} label="Execution Logs" />
          <AdminNavItem icon={<ShieldCheck />} label="Compliance Audit" />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
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
              Integrity Terminal
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Automated Verification Flow • {currentUser?.country.toUpperCase()}{" "}
              Jurisdiction
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <Button
              className="bg-plum text-white hover:bg-black h-10 px-6 rounded-none text-[9px] font-bold uppercase tracking-widest shadow-lg"
              onClick={runAllQATests}
            >
              <FastForward className="w-3.5 h-3.5 mr-2" /> EXECUTE ALL TESTS
            </Button>
            <div className="w-10 h-10 bg-plum rounded-sm flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-md">
              QA
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {/* Integrity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              icon={<Zap />}
              label="Total Suites"
              value={stats.total.toString()}
              trend="Local Scope"
              positive
            />
            <StatCard
              icon={<CheckCircle2 />}
              label="Passed"
              value={stats.passed.toString()}
              trend="Optimal"
              positive
            />
            <StatCard
              icon={<XCircle />}
              label="Failed"
              value={stats.failed.toString()}
              trend="Alert"
              positive={stats.failed === 0}
            />
            <StatCard
              icon={<Clock />}
              label="Running"
              value={stats.running.toString()}
              trend="Execution"
              positive
            />
          </div>

          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="bg-white border border-border h-14 p-1 rounded-none mb-8">
              <TabsTrigger
                value="matrix"
                className="rounded-none px-8 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-plum data-[state=active]:text-white"
              >
                Test Matrix
              </TabsTrigger>
              <TabsTrigger
                value="stress"
                className="rounded-none px-8 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-plum data-[state=active]:text-white"
              >
                Stress Test Lab
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      {[
                        "all",
                        "AI",
                        "Finance",
                        "Onboarding",
                        "Audit",
                        "Security",
                      ].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-4 py-2 border transition-all",
                            activeModule === tab
                              ? "bg-plum text-white border-plum shadow-md"
                              : "bg-white border-border text-gray-400 hover:text-plum"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {filteredTests.map((test) => (
                      <Card
                        key={test.id}
                        className="bg-white border-border shadow-luxury hover:border-plum transition-all overflow-hidden group"
                      >
                        <CardHeader className="bg-ivory/20 border-b border-border p-6">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                                {test.module} Module
                              </span>
                              <CardTitle className="font-headline text-xl italic">
                                {test.name}
                              </CardTitle>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[8px] uppercase tracking-tighter border-none",
                                  test.status === "passed"
                                    ? "bg-green-50 text-green-600"
                                    : test.status === "failed"
                                    ? "bg-red-50 text-red-600"
                                    : test.status === "running"
                                    ? "bg-plum/5 text-plum animate-pulse"
                                    : "bg-gray-50 text-gray-400"
                                )}
                              >
                                {test.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 group-hover:bg-plum/5"
                                onClick={() => runQATest(test.id)}
                                disabled={test.status === "running"}
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          {test.logs.length > 0 ? (
                            <div className="divide-y divide-border/40">
                              {test.logs.map((log: any) => (
                                <div
                                  key={log.id}
                                  className="p-4 flex items-start space-x-4 bg-ivory/5"
                                >
                                  <Activity className="w-3 h-3 text-plum mt-1 opacity-40" />
                                  <div className="flex-1">
                                    <p className="text-[10px] text-gray-600 italic">
                                      "{log.message}"
                                    </p>
                                    <span className="text-[7px] text-gray-300 font-mono uppercase">
                                      {new Date(
                                        log.timestamp
                                      ).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center opacity-20">
                              <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
                                No execution history
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                  <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <ShieldCheck className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center space-x-3 text-secondary">
                        <FlaskConical className="w-5 h-5" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest">
                          Automation Integrity
                        </h4>
                      </div>
                      <p className="text-xs font-light italic leading-relaxed opacity-70">
                        "Institutional quality is a constant dialogue. Every
                        module is verified against our Founding Principles of
                        1924."
                      </p>
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <PerformanceRow label="Core Logic Sync" val={100} />
                        <PerformanceRow label="Security Enforcement" val={98} />
                        <PerformanceRow label="Market Isolation" val={100} />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white border-border shadow-sm p-8 space-y-6">
                    <div className="flex items-center space-x-3 text-plum">
                      <History className="w-5 h-5" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest">
                        Recent Activity
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {scopedQATests
                        .filter((t) => t.lastRun)
                        .slice(0, 3)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest border-b border-border pb-3"
                          >
                            <span className="text-gray-400 truncate w-32">
                              {t.name}
                            </span>
                            <span
                              className={
                                t.status === "passed"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              {t.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="stress" className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                  {/* Load Selection Card */}
                  <Card className="bg-white border-border shadow-luxury">
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center space-x-3 text-plum">
                        <Cpu className="w-6 h-6" />
                        <CardTitle className="font-headline text-2xl uppercase italic">
                          Stress Lab Parameters
                        </CardTitle>
                      </div>
                      <CardDescription className="text-[10px] uppercase tracking-widest">
                        Configure load simulation magnitude
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                      <div className="space-y-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
                          Target Iteration Size
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          {[1000, 5000, 10000].map((size) => (
                            <button
                              key={size}
                              onClick={() => setLoadSize(size)}
                              className={cn(
                                "h-16 border flex flex-col items-center justify-center space-y-1 transition-all",
                                loadSize === size
                                  ? "bg-plum text-white border-plum shadow-xl scale-105"
                                  : "bg-ivory/50 text-gray-400 hover:bg-white border-border"
                              )}
                            >
                              <span className="text-lg font-headline font-bold italic">
                                {size.toLocaleString()}
                              </span>
                              <span className="text-[8px] font-bold uppercase tracking-tighter">
                                Items
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StressActionBtn
                          label="AI Metadata Engine"
                          type="AI"
                          onClick={() => runStressTest("AI")}
                        />
                        <StressActionBtn
                          label="Global CMS Replication"
                          type="CMS"
                          onClick={() => runStressTest("CMS")}
                        />
                        <StressActionBtn
                          label="SEO Search Indexing"
                          type="SEO"
                          onClick={() => runStressTest("SEO")}
                        />
                        <StressActionBtn
                          label="CRM Lead Routing"
                          type="CRM"
                          onClick={() => runStressTest("CRM")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stress Results Feed */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">
                      Laboratory Feed
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {scopedStressTests.map((test) => (
                        <Card
                          key={test.id}
                          className="bg-white border-border shadow-luxury overflow-hidden"
                        >
                          <div className="p-6 bg-ivory/20 border-b border-border flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  test.status === "running"
                                    ? "bg-plum/10 text-plum animate-pulse"
                                    : "bg-green-50 text-green-600"
                                )}
                              >
                                {test.status === "running" ? (
                                  <RefreshCcw className="w-5 h-5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold uppercase tracking-tight">
                                  {test.name}
                                </h4>
                                <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">
                                  {test.type} Subsystem •{" "}
                                  {test.country.toUpperCase()} Jurisdiction
                                </p>
                              </div>
                            </div>
                            {test.metrics.durationMs && (
                              <div className="text-right">
                                <p className="text-[10px] font-headline font-bold italic text-plum">
                                  {test.metrics.durationMs.toFixed(0)}ms
                                </p>
                                <p className="text-[8px] text-gray-400 uppercase font-bold">
                                  Duration
                                </p>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Progression
                              </p>
                              <div className="space-y-2">
                                <Progress
                                  value={
                                    (test.metrics.processedCount /
                                      test.loadSize) *
                                    100
                                  }
                                  className="h-1 bg-ivory"
                                />
                                <div className="flex justify-between text-[8px] font-bold uppercase">
                                  <span>
                                    {test.metrics.processedCount.toLocaleString()}{" "}
                                    Processed
                                  </span>
                                  <span>
                                    {test.loadSize.toLocaleString()} Total
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4 border-l border-border pl-8">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Integrity Matrix
                              </p>
                              <div className="flex justify-between">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-gray-900">
                                    {test.metrics.errorCount}
                                  </span>
                                  <p className="text-[7px] text-red-500 uppercase font-bold">
                                    Errors
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <span className="text-xs font-bold text-gray-900">
                                    {(
                                      (1 -
                                        test.metrics.errorCount /
                                          (test.metrics.processedCount || 1)) *
                                      100
                                    ).toFixed(2)}
                                    %
                                  </span>
                                  <p className="text-[7px] text-green-500 uppercase font-bold">
                                    Reliability
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4 border-l border-border pl-8">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Failure Logic
                              </p>
                              <Badge
                                className={cn(
                                  "text-[8px] uppercase tracking-tighter",
                                  test.metrics.failureCount > 0
                                    ? "bg-red-500"
                                    : "bg-green-50 text-green-600"
                                )}
                              >
                                {test.metrics.failureCount > 0
                                  ? "CRITICAL FAILURE"
                                  : "SYSTEM OPTIMAL"}
                              </Badge>
                            </div>
                          </CardContent>
                          <div className="p-4 bg-ivory/10 border-t border-border/40 font-mono text-[8px] text-gray-400 overflow-hidden truncate italic">
                            Last Trace:{" "}
                            {test.logs[test.logs.length - 1]?.message}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                  <Card className="bg-plum text-white p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Terminal className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center space-x-3 text-gold">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">
                          Stability Thresholds
                        </h4>
                      </div>
                      <div className="space-y-6">
                        <ThresholdRow
                          label="AI Latency"
                          val="< 50ms / item"
                          status="PASSED"
                        />
                        <ThresholdRow
                          label="CMS Sync Rate"
                          val="> 500 ops / sec"
                          status="PASSED"
                        />
                        <ThresholdRow
                          label="SEO Concurrency"
                          val="10k active nodes"
                          status="PASSED"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white border-border shadow-sm p-8 space-y-6">
                    <div className="flex items-center space-x-3 text-plum">
                      <FileText className="w-5 h-5" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest">
                        Bottleneck Analysis
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-100 rounded-sm">
                        <p className="text-[9px] font-bold text-red-700 uppercase mb-1">
                          Global CMS Sync
                        </p>
                        <p className="text-[8px] text-red-500 italic leading-relaxed">
                          Minor contention detected at 10k load size in
                          Singapore hub.
                        </p>
                      </div>
                      <div className="p-4 bg-ivory border border-border rounded-sm">
                        <p className="text-[9px] font-bold text-gray-700 uppercase mb-1">
                          AI Metadata Engine
                        </p>
                        <p className="text-[8px] text-gray-400 italic leading-relaxed">
                          Execution optimal across all hubs. Throughput stable
                          at 850 items/sec.
                        </p>
                      </div>
                    </div>
                  </Card>
                </aside>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function ThresholdRow({
  label,
  val,
  status,
}: {
  label: string;
  val: string;
  status: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="opacity-60">{label}</span>
        <span className="text-gold">{status}</span>
      </div>
      <p className="text-[8px] text-white/40 italic">{val}</p>
    </div>
  );
}

function StressActionBtn({
  label,
  type,
  onClick,
}: {
  label: string;
  type: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="h-14 border-border hover:border-plum hover:bg-plum/5 rounded-none flex justify-between items-center px-6 group transition-all"
      onClick={onClick}
    >
      <div className="flex flex-col items-start">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-900 group-hover:text-plum">
          {label}
        </span>
        <span className="text-[7px] text-gray-400 uppercase font-bold">
          Subsystem: {type}
        </span>
      </div>
      <Play className="w-3 h-3 text-gray-300 group-hover:text-plum" />
    </Button>
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
    <Card className="bg-white border-border shadow-luxury hover:border-plum transition-colors group">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="p-4 bg-ivory rounded-full group-hover:bg-plum/10 transition-colors text-plum">
            {icon}
          </div>
          <div
            className={cn(
              "text-[10px] font-bold tracking-widest uppercase",
              positive ? "text-gold" : "text-red-500"
            )}
          >
            {trend}
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

function PerformanceRow({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="opacity-60">{label}</span>
        <span className="text-secondary">{val}%</span>
      </div>
      <Progress value={val} className="h-1 bg-white/10" />
    </div>
  );
}

function AdminNavItem({
  icon,
  label,
  active,
  href,
}: {
  icon: any;
  label: string;
  active?: boolean;
  href?: string;
}) {
  const content = (
    <button
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

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
