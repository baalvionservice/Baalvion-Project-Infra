"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  RefreshCcw,
  LayoutDashboard,
  Filter,
  Search,
  X,
  AlertTriangle,
  History,
  Lock,
  Activity,
  Terminal,
  Eye,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ErrorMatrixPage() {
  const { scopedErrors, resolveMaisonError, currentUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const filteredErrors = scopedErrors.filter((err) => {
    const matchesSearch =
      err.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === "all" || err.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const stats = {
    total: scopedErrors.length,
    active: scopedErrors.filter((e) => !e.resolved).length,
    high: scopedErrors.filter((e) => e.severity === "high" && !e.resolved)
      .length,
    resolved: scopedErrors.filter((e) => e.resolved).length,
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              DEBUG
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Resilience & Recovery
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <AdminNavItem
            icon={<LayoutDashboard />}
            label="Intelligence Hub"
            href="/admin"
          />
          <AdminNavItem
            icon={<ShieldAlert />}
            label="Error Matrix"
            active={true}
          />
          <AdminNavItem icon={<Activity />} label="Incident Logs" />
          <AdminNavItem icon={<Lock />} label="Security Sandbox" />
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
              Error Matrix
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              System Anomaly Registry • {currentUser?.country.toUpperCase()}{" "}
              Jurisdiction
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <Badge
              variant="outline"
              className="bg-red-50 text-red-600 text-[10px] uppercase tracking-widest border-red-100 h-10 px-6 rounded-none"
            >
              {stats.high} Critical Anomalies
            </Badge>
            <div className="w-10 h-10 bg-ivory border border-border rounded-sm flex items-center justify-center font-headline text-xl font-bold italic text-red-500">
              EX
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {/* Diagnostic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              icon={<ShieldAlert />}
              label="Total Events"
              value={stats.total.toString()}
              trend="Registry Lifetime"
              positive={true}
            />
            <StatCard
              icon={<AlertTriangle />}
              label="Active Incidents"
              value={stats.active.toString()}
              trend="Action Required"
              positive={stats.active === 0}
            />
            <StatCard
              icon={<Activity />}
              label="Mean Recovery"
              value="4.2m"
              trend="Optimal"
              positive={true}
            />
            <StatCard
              icon={<CheckCircle2 />}
              label="Resolution Rate"
              value={`${((stats.resolved / stats.total) * 100 || 0).toFixed(
                0
              )}%`}
              trend="Maison Goal: 100%"
              positive={true}
            />
          </div>

          {/* Error Feed */}
          <Card className="bg-white border-border shadow-luxury overflow-hidden">
            <CardHeader className="border-b border-border flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="space-y-1">
                <CardTitle className="font-headline text-2xl">
                  Incident Feed
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  Detailed diagnostic registry of Maison anomalies
                </CardDescription>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input
                    className="bg-white border border-border h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 focus:ring-1 focus:ring-plum transition-all"
                    placeholder="FILTER MESSAGES..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    className="bg-white border border-border h-10 px-3 text-[9px] font-bold uppercase tracking-widest outline-none cursor-pointer focus:ring-1 focus:ring-plum"
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                  >
                    <option value="all">ALL SUBSYSTEMS</option>
                    <option value="AI Autopilot">AI AUTOPILOT</option>
                    <option value="Finance">FINANCE</option>
                    <option value="Onboarding">ONBOARDING</option>
                    <option value="System">SYSTEM CORE</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-ivory/50">
                  <TableRow>
                    <TableHead className="text-[9px] uppercase font-bold pl-8">
                      Anomaly ID
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Origin Hub
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Subsystem
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Diagnostic Message
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredErrors.map((err) => (
                    <TableRow
                      key={err.id}
                      className={cn(
                        "hover:bg-ivory/30 transition-colors",
                        !err.resolved && "bg-red-50/10"
                      )}
                    >
                      <TableCell className="pl-8 text-[10px] font-mono text-gray-400 uppercase">
                        {err.id}
                      </TableCell>
                      <TableCell className="text-[10px] font-bold uppercase tracking-widest">
                        {err.country.toUpperCase()} Hub
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[8px] uppercase tracking-tighter border-plum/20 text-plum"
                        >
                          {err.module}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-bold uppercase tracking-tighter text-gray-900">
                            {err.type}
                          </span>
                          <span className="text-[10px] text-gray-500 italic font-light line-clamp-1">
                            "{err.message}"
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "text-[7px] uppercase tracking-tighter border-none",
                            err.resolved
                              ? "bg-green-50 text-green-600"
                              : "bg-red-500 text-white"
                          )}
                        >
                          {err.resolved ? "RESOLVED" : "ACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end space-x-2">
                          {!err.resolved && (
                            <Button
                              size="sm"
                              className="h-8 bg-black text-white hover:bg-plum text-[8px] font-bold uppercase"
                              onClick={() => resolveMaisonError(err.id)}
                            >
                              RESOLVE
                            </Button>
                          )}
                          {currentUser?.role === "super_admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-plum"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredErrors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-40 text-center">
                        <div className="flex flex-col items-center space-y-4 opacity-20">
                          <CheckCircle2 className="w-12 h-12" />
                          <p className="text-xs font-bold uppercase tracking-[0.2em]">
                            Institutional Integrity Maintained
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
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
