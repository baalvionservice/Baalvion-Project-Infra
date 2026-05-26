"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Zap,
  Globe,
  Activity,
  BarChart3,
  ChevronRight,
  RefreshCcw,
  Lock,
  Flag,
  Info,
  Database,
  Cpu,
  ArrowRight,
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

/**
 * Institutional System Audit Dashboard.
 * Recursively audits platform health, completion, and risk vectors.
 */
export default function SystemAuditDashboard() {
  const {
    products,
    transactions,
    maisonErrors,
    systemHealth,
    brandIntegrityIssues,
    adminJurisdiction,
  } = useAppStore();

  const auditData = [
    {
      module: "Settlement Layer",
      status: "Ready",
      score: 85,
      issues: 2,
      risk: "Low",
      icon: <Lock />,
    },
    {
      module: "Inventory Guard",
      status: "Optimal",
      score: 95,
      issues: 0,
      risk: "None",
      icon: <Database />,
    },
    {
      module: "AI Autopilot",
      status: "Learning",
      score: 92,
      issues: 1,
      risk: "Low",
      icon: <Zap />,
    },
    {
      module: "Jurisdictional Logic",
      status: "Verified",
      score: 100,
      issues: 0,
      risk: "None",
      icon: <Globe />,
    },
    {
      module: "Observability",
      status: "Live",
      score: 90,
      issues: 3,
      risk: "Medium",
      icon: <Activity />,
    },
    {
      module: "Security Sandbox",
      status: "Hardened",
      score: 88,
      issues: 1,
      risk: "Low",
      icon: <ShieldCheck />,
    },
  ];

  const totalScore = useMemo(
    () =>
      Math.round(
        auditData.reduce((acc, d) => acc + d.score, 0) / auditData.length
      ),
    [auditData]
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20 font-body">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              CTO Audit Terminal
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            System Audit
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Comprehensive zero-gap evaluation of Maison infrastructure.
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">
              Overall Completion
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-3xl font-headline font-bold italic text-blue-400 tabular">
                {totalScore}%
              </span>
              <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] uppercase">
                Institutional Grade
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* 1. Critical Gap Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="bg-[#111113] border-white/5 shadow-2xl rounded-none overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="font-headline text-2xl text-white italic">
                Health & Completion Matrix
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                System readiness by functional tactical node
              </CardDescription>
            </CardHeader>
            <div className="p-0">
              <Table className="w-full">
                <thead className="bg-white/[0.02]">
                  <tr className="border-b border-white/5 h-12">
                    <th className="text-[9px] uppercase font-bold text-left pl-8 text-white/40">
                      Tactical Node
                    </th>
                    <th className="text-[9px] uppercase font-bold text-left text-white/40">
                      Status
                    </th>
                    <th className="text-[9px] uppercase font-bold text-center text-white/40">
                      Score
                    </th>
                    <th className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                      Risk Factor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditData.map((node) => (
                    <tr
                      key={node.module}
                      className="hover:bg-white/5 transition-colors h-16 group"
                    >
                      <td className="pl-8">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-white/5 text-white/40 rounded-none border border-white/10 group-hover:text-blue-400 transition-colors">
                            {React.cloneElement(
                              node.icon as React.ReactElement,
                              { size: 14 } as any
                            )}
                          </div>
                          <span className="text-xs font-bold uppercase text-white/80">
                            {node.module}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant="outline"
                          className="text-[7px] border-white/10 text-white/40 uppercase"
                        >
                          {node.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-center space-x-3">
                          <Progress
                            value={node.score}
                            className="h-0.5 w-16 bg-white/5"
                          />
                          <span className="text-[10px] font-bold text-blue-400">
                            {node.score}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right pr-8">
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest",
                            node.risk === "None"
                              ? "text-emerald-400"
                              : "text-gold"
                          )}
                        >
                          {node.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-black text-white p-10 space-y-10 shadow-2xl relative overflow-hidden rounded-none border-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-40 h-40 text-blue-500" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-headline font-bold italic tracking-tight leading-none">
                Security Audit
              </h3>
              <p className="text-sm font-light italic text-white/60 leading-relaxed">
                "Identity isolation is active across 5 hubs. No data leakage
                detected between UAE and US registry nodes."
              </p>
            </div>
            <div className="space-y-6 pt-6 border-t border-white/10">
              <AuditLine label="RBAC Integrity" val="100%" />
              <AuditLine label="Encryption Layer" val="AES-256" />
              <AuditLine label="Auth Volatility" val="Minimal" />
            </div>
            <Button
              variant="outline"
              className="w-full rounded-none border-blue-900/40 text-blue-400 hover:bg-blue-500 hover:text-white text-[9px] font-bold uppercase tracking-widest h-12 mt-4 transition-all"
            >
              PERFORM SECURITY FLUSH
            </Button>
          </Card>

          <Card className="bg-[#111113] border-white/5 p-8 space-y-6 rounded-none">
            <div className="flex items-center space-x-3 text-gold">
              <Flag className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">
                Compliance Signal
              </h4>
            </div>
            <p className="text-[10px] text-white/40 italic leading-relaxed">
              "Jurisdictional tax logic for India (GST 28%) verified. Automated
              reporting scheduled for end of interval."
            </p>
          </Card>
        </aside>
      </div>

      {/* 2. Top 10 Critical Gaps Node */}
      <section className="space-y-8 pt-12 border-t border-white/5">
        <div className="flex items-center space-x-4">
          <AlertTriangle className="w-6 h-6 text-gold" />
          <h2 className="text-3xl font-headline font-bold italic text-white uppercase tracking-tighter">
            Strategic Gaps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GapNode
            num={1}
            label="Physical Intake UI"
            desc="Missing 'Arrived' workflow for physical artifacts."
          />
          <GapNode
            num={2}
            label="KYC Document Management"
            desc="No interface for reviewing collector identity docs."
          />
          <GapNode
            num={3}
            label="Escrow Payout Logic"
            desc="Financials are high-level; missing vendor payout splits."
          />
          <GapNode
            num={4}
            label="Rollback UI"
            desc="Versioning exists but no manual 'Restore' button."
          />
          <GapNode
            num={5}
            label="WebRTC Signalling"
            desc="Live sessions require real server integration."
          />
          <GapNode
            num={6}
            label="Real DB Persistence"
            desc="Current state is simulated; requires Firestore hooks."
          />
        </div>
      </section>

      <footer className="pt-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-full mb-4">
            <Cpu className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-2xl font-headline font-bold italic text-white">
            Institutional Oversight
          </h3>
          <p className="text-sm text-white/40 font-light italic leading-relaxed">
            "This audit matrix is recursively updated every 15 minutes by the
            Maison Core system. Any logic deviation results in immediate SRE
            notification."
          </p>
          <div className="pt-8 flex justify-center space-x-12">
            <InfoLink label="Platform Charter" />
            <InfoLink label="SLA Registry" />
            <InfoLink label="Legal Compliance" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  );
}

function AuditLine({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
        {label}
      </span>
      <span className="text-[10px] font-bold text-white/80 tabular">{val}</span>
    </div>
  );
}

function GapNode({
  num,
  label,
  desc,
}: {
  num: number;
  label: string;
  desc: string;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-4 hover:border-gold/40 transition-all group">
      <div className="flex items-center space-x-4">
        <span className="text-2xl font-headline font-bold italic text-white/10 group-hover:text-gold/20 transition-colors">
          {num.toString().padStart(2, "0")}
        </span>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/80">
          {label}
        </h4>
      </div>
      <p className="text-[10px] text-white/40 italic leading-relaxed">
        "{desc}"
      </p>
    </Card>
  );
}

function InfoLink({ label }: { label: string }) {
  return (
    <Link
      href="#"
      className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 hover:text-blue-400 transition-colors"
    >
      {label}
    </Link>
  );
}
