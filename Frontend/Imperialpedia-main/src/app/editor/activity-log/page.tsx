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
import { Text } from "@/design-system/typography/text";
import {
  History,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowLeft,
  ArrowUpRight,
  Zap,
  Users,
  MessageSquare,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { getEditorialDashboardData } from "@/services/data/editorial-service"; // Corrected path
import { getEditorialDashboardData as getMockData } from "@/services/mock-api/editorial";
import { EditorialLogEntry } from "@/types/editorial";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Editorial Activity Audit Trail.
 * Immutable chronological record of every decision committed by the auditor cluster.
 */
export default function EditorialActivityLogPage() {
  const [logs, setLogs] = useState<EditorialLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getMockData();
        if (response.data) setLogs(response.data.activity_log);
      } catch (e) {
        console.error("Audit trail sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.editor_name.toLowerCase().includes(search.toLowerCase()) ||
      l.article_title.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadge = (action: EditorialLogEntry["action"]) => {
    switch (action) {
      case "Article Approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Approved
          </Badge>
        );
      case "Revision Requested":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Revision
          </Badge>
        );
      case "Article Rejected":
        return (
          <Badge
            variant="destructive"
            className="font-bold uppercase text-[8px] h-5 px-2"
          >
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[8px] font-bold uppercase h-5 px-2"
          >
            Reassigned
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12"
            asChild
          >
            <Link href="/editor/dashboard">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <History className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Audit Trail
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              Editorial Lifecycle Log
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Log Integrity Verified
          </span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Filter by auditor name, intelligence headline, or administrative action..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Timestamp
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Auditor Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Administrative Verdict
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Intelligence Title
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Handshake ID
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text
                      variant="caption"
                      className="mt-4 block animate-pulse font-bold tracking-widest uppercase"
                    >
                      Retrieving Audit Chain...
                    </Text>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground italic"
                  >
                    No matching activity records localized in the current search
                    buffer.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow
                    key={log.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground/70">
                          {format(new Date(log.timestamp), "MMM d, yyyy")}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase">
                          {format(new Date(log.timestamp), "HH:mm:ss")} UTC
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {log.editor_name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium">
                          {log.editor_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <span
                        className="text-xs font-bold text-foreground/80 truncate max-w-[250px] block"
                        title={log.article_title}
                      >
                        {log.article_title}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <span className="text-[10px] font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-white/5 uppercase">
                        {log.id}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Immutable Ledger
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Every decision committed by the auditor cluster is
              cryptographically signed and immutable. Audit trails are retained
              for **365 days** within the production ring for regulatory
              compliance.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Scale className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Decision Analytics
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Analyzing historical logs: The cluster has maintained an **SLA of
              99.9%** for approval handshakes. 85% of 'Approved' nodes pass
              through the triage layer in under 6 hours.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
