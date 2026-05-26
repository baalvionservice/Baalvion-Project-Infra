"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  RefreshCcw,
  ChevronRight,
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Search,
  Settings,
  History,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  FlaskConical,
  Palette,
  Eye,
  Type,
  BookOpen,
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
import { useToast } from "@/hooks/use-toast";

/**
 * Brand Integrity Auditor: The 21st Tactical Node.
 * Audits regional deviations from the core 1924 Maison standards.
 */
export default function BrandIntegrityHub() {
  const { scopedBrandIntegrity, resolveBrandIntegrity, currentUser } =
    useAppStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIssues = scopedBrandIntegrity.filter(
    (i) =>
      i.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.issueType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFix = (id: string) => {
    resolveBrandIntegrity(id);
    toast({
      title: "Compliance Restored",
      description:
        "The regional narrative has been aligned with Maison standards.",
    });
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              BRAND
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Integrity Protocol
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <IntegrityNavItem
            icon={<LayoutDashboard />}
            label="Audit Registry"
            active={true}
          />
          <IntegrityNavItem
            icon={<Palette />}
            label="Visual Standards"
            active={false}
          />
          <IntegrityNavItem
            icon={<Type />}
            label="Voice & Tone"
            active={false}
          />
          <IntegrityNavItem
            icon={<BookOpen />}
            label="The 1924 Charter"
            active={false}
          />
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
              Brand Integrity
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Institutional Heritage Audit •{" "}
              {currentUser?.country.toUpperCase()} Jurisdiction
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <Badge
              variant="outline"
              className="bg-plum/5 text-plum text-[10px] uppercase tracking-widest border-plum/10 h-10 px-6 rounded-none"
            >
              98.2% Consistency Score
            </Badge>
            <div className="w-10 h-10 bg-plum rounded-sm flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-md">
              BI
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {/* Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              icon={<ShieldCheck />}
              label="Audited Items"
              value="1,240"
              trend="100% Core"
              positive
            />
            <StatCard
              icon={<AlertTriangle />}
              label="Active Deviations"
              value={filteredIssues
                .filter((i) => i.status === "pending")
                .length.toString()}
              trend="Action Needed"
              positive={false}
            />
            <StatCard
              icon={<Zap />}
              label="AI Audit Velocity"
              value="850/s"
              trend="Optimal"
              positive
            />
            <StatCard
              icon={<Lock />}
              label="Compliance"
              value="Verified"
              trend="Maison Std"
              positive
            />
          </div>

          {/* Audit Log Table */}
          <Card className="bg-white border-border shadow-luxury overflow-hidden">
            <CardHeader className="border-b border-border flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 bg-ivory/10">
              <div className="space-y-1">
                <CardTitle className="font-headline text-2xl">
                  Integrity Feed
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  Regional deviations detected by AI Autopilot
                </CardDescription>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input
                    className="bg-white border border-border h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 focus:ring-1 focus:ring-plum transition-all"
                    placeholder="FILTER DEVIATIONS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-ivory/50">
                  <TableRow>
                    <TableHead className="text-[9px] uppercase font-bold pl-8">
                      Artifact
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Issue Type
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Deviation Description
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-center">
                      Severity
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow
                      key={issue.id}
                      className={cn(
                        "hover:bg-ivory/30 transition-colors",
                        issue.status === "fixed" && "opacity-40"
                      )}
                    >
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight uppercase tracking-tight">
                            {issue.productName}
                          </span>
                          <span className="text-[8px] text-gray-400 uppercase tracking-widest">
                            {issue.country.toUpperCase()} Hub
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[8px] uppercase tracking-tighter border-plum/20 text-plum"
                        >
                          {issue.issueType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-light italic text-gray-700 max-w-md">
                        "{issue.description}"
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "text-[7px] uppercase tracking-tighter border-none",
                            issue.severity === "high"
                              ? "bg-red-500 text-white"
                              : issue.severity === "medium"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-green-50 text-green-600"
                          )}
                        >
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        {issue.status === "pending" ? (
                          <Button
                            size="sm"
                            className="h-8 bg-black text-white hover:bg-plum text-[8px] font-bold uppercase rounded-none"
                            onClick={() => handleFix(issue.id)}
                          >
                            FIX ALIGNMENT
                          </Button>
                        ) : (
                          <div className="flex justify-end items-center text-green-500 space-x-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase">
                              Aligned
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredIssues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-40 text-center">
                        <div className="flex flex-col items-center space-y-4 opacity-20">
                          <CheckCircle2 className="w-12 h-12" />
                          <p className="text-xs font-bold uppercase tracking-[0.2em]">
                            All Regional Hubs Aligned with 1924 Charter
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

function IntegrityNavItem({
  icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
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
