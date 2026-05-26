"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { Text } from "@/design-system/typography/text";
import {
  ShieldAlert,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  ArrowRight,
  Info,
  Layers,
  Zap,
  MoreVertical,
  Terminal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { IncidentResponseData, IncidentNode, SystemAlertNode, IncidentDetail } from '@/types/system';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';

/**
 * Incident Response & Alerts Management Hub Client.
 * Specialized control matrix for monitoring system health and triaging platform anomalies.
 */
export function IncidentResponseClient() {
  const [data, setData] = useState<IncidentResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentNode | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getIncidentResponseData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Incident state sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (id: string, action: string) => {
    toast({
      title: `Action Initiated: ${action}`,
      description: `Targeting incident node ${id} across production clusters.`,
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
          Calibrating Response Matrix...
        </Text>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return (
          <Badge
            variant="destructive"
            className="font-bold uppercase text-[9px] h-5 px-2"
          >
            High Impact
          </Badge>
        );
      case "Medium":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[9px] h-5 px-2">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-white/10 text-[9px] font-bold uppercase px-2 h-5"
          >
            Low
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "mock_active":
        return (
          <Badge className="bg-destructive/10 text-destructive border-none font-bold uppercase text-[8px] h-5 px-2 animate-pulse">
            Active
          </Badge>
        );
      case "mock_acknowledged":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Acknowledged
          </Badge>
        );
      case "mock_resolved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredIncidents = data.incidents.filter(
    (i) =>
      i.type.toLowerCase().includes(search.toLowerCase()) ||
      i.incident_id.toLowerCase().includes(search.toLowerCase())
  );

  const currentDetail = data.incident_details.find(
    (d) => d.incident_id === selectedIncident?.incident_id
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      {/* ALERTS QUICK-VIEW PANEL */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">
                Real-time Alert Buffer
              </Text>
              <Text
                variant="caption"
                className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
              >
                Anomalous Infrastructure Nodes
              </Text>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-bold text-xs group"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Re-sync
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.alerts.map((alert) => (
            <Card
              key={alert.alert_id}
              className="glass-card border-none shadow-xl group hover:border-destructive/30 transition-all duration-500 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <ShieldAlert className="h-16 w-16 text-destructive" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-background/50 text-[8px] font-bold uppercase tracking-tighter"
                  >
                    {alert.source}
                  </Badge>
                  {getSeverityBadge(alert.severity)}
                </div>
                <div>
                  <Text
                    variant="bodySmall"
                    weight="bold"
                    className="block text-foreground/90"
                  >
                    {alert.message}
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-mono text-[9px] mt-1 block"
                  >
                    {alert.timestamp.split(" ")[1]} UTC
                  </Text>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* MAIN INCIDENT MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Incident Pipeline
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Governance lifecycle Hub
                </Text>
              </div>
            </div>

            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search triage IDs..."
                className="pl-10 h-10 bg-card/30 border-white/5 rounded-xl text-xs"
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
                      Incident Taxonomy
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Severity
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Handshake
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.incident_id}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90 leading-tight">
                            {incident.type}
                          </span>
                          <span className="text-[9px] font-mono text-primary uppercase mt-1 font-bold">
                            {incident.incident_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {getSeverityBadge(incident.severity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {getStatusBadge(incident.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {incident.timestamp.split(" ")[1]}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Terminal className="h-3.5 w-3.5" /> Inspect
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* STRATEGIC CONTEXT SIDEBAR */}
        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Resilience Strategy
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Kernel Integrity Nodes
                </Text>
              </div>
            </div>

            <Card className="glass-card border-none bg-card/30">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Cluster Availability</span>
                    <span className="text-emerald-500">99.98%</span>
                  </div>
                  <Progress value={99.98} className="h-1 bg-white/5" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Response Velocity (MTTR)</span>
                    <span className="text-primary">14.2m</span>
                  </div>
                  <Progress value={85} className="h-1 bg-white/5" />
                </div>

                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase mb-2">
                    <Info className="h-3.5 w-3.5" /> Handshake Logic
                  </div>
                  <Text
                    variant="caption"
                    className="text-muted-foreground leading-relaxed italic"
                  >
                    "Incidents marked as **High Impact** trigger an immediate
                    vertical escalation to the Infrastructure Lead and lock
                    non-essential pSEO indexing nodes."
                  </Text>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Compliance Guard
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "The current SLA buffer is maintaining stability. Any deviation in MTTR exceeding 20% will automatically initiate a fallback state to the secondary US-West region node."
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto text-secondary text-xs font-bold group/link"
              asChild
            >
              <Link href="/admin/control/audit-trail">
                Review Audit Chain{" "}
                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* INCIDENT INSPECTION MODAL */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
      >
        <DialogContent className="max-w-2xl bg-card border-white/10 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 h-6"
              >
                Incident Triage Hub
              </Badge>
              {selectedIncident && getStatusBadge(selectedIncident.status)}
            </div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Terminal className="h-6 w-6 text-primary" />
              Incident Audit: {selectedIncident?.incident_id}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Detailed metadata and resolution matrix for{" "}
              {selectedIncident?.type}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar bg-background/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                  <Activity className="h-3.5 w-3.5" /> Affected Matrix
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentDetail?.affected_systems.map((sys) => (
                    <Badge
                      key={sys}
                      variant="outline"
                      className="border-white/10 bg-background/50 text-[10px] px-2 h-6"
                    >
                      {sys}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase tracking-widest">
                  <Clock className="h-3.5 w-3.5" /> Start Time
                </div>
                <Text variant="bodySmall" className="font-mono text-xs">
                  {selectedIncident?.timestamp}
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                <CheckCircle2 className="h-3.5 w-3.5" /> Suggested Resolution
              </div>
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-sm leading-relaxed italic text-muted-foreground">
                "{currentDetail?.suggested_resolution}"
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                <Layers className="h-3.5 w-3.5" /> Event Timeline
              </div>
              <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                {[
                  {
                    t: "09:00",
                    e: "Initial threshold violation detected on Server1",
                  },
                  { t: "09:02", e: "Load balancer initiated health-check" },
                  { t: "09:05", e: "Auto-scaling protocol triggered new node" },
                ].map((log, i) => (
                  <div key={i} className="flex gap-6 items-start relative z-10">
                    <div className="w-5 h-5 rounded-full bg-background border-2 border-primary/20 shrink-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex gap-3 items-baseline">
                      <span className="text-[10px] font-mono font-bold text-primary">
                        {log.t}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.e}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedIncident(null)}
              className="h-12 px-8 rounded-xl font-bold"
            >
              Discard Hub
            </Button>
            {selectedIncident?.status === "mock_active" && (
              <>
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-bold border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                  onClick={() =>
                    handleAction(selectedIncident.incident_id, "Acknowledge")
                  }
                >
                  Acknowledge
                </Button>
                <Button
                  className="h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                  onClick={() =>
                    handleAction(selectedIncident.incident_id, "Resolve")
                  }
                >
                  Confirm Resolution
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}