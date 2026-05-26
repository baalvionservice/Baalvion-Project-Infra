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
import { Switch } from "@/components/ui/switch";
import { Text } from "@/design-system/typography/text";
import { cn } from "@/lib/utils";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Megaphone,
  ArrowUpRight,
  ShieldCheck,
  Send,
  ArrowLeft,
  Trash2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { systemService } from "@/services/data/system-service";
import { SystemAlert } from "@/types/system";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Platform System Alerts Dashboard.
 * Specialized control matrix for managing global broadcasts and critical infrastructure warnings.
 */
export default function SystemAlertsManagementPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const response = await systemService.getSystemAlerts();
        if (response.data) setAlerts(response.data);
      } catch (e) {
        console.error("Alert sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
    );

    toast({
      title:
        newStatus === "Active" ? "Alert Broadcast Active" : "Alert Node Sunset",
      description: `Target alert has been shifted to ${newStatus} state.`,
    });
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast({
      title: "Alert Node Purged",
      description: "Broadcast has been removed from the intelligence index.",
      variant: "destructive",
    });
  };

  const handleSendManualAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate dispatch
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setIsModalOpen(false);

    toast({
      title: "Manual Alert Dispatched",
      description: "Broadcast signal sent to all targeting clusters.",
    });
  };

  const filteredAlerts = alerts.filter(
    (a) =>
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeIcon = (type: SystemAlert["type"]) => {
    switch (type) {
      case "Info":
        return <Info className="h-3.5 w-3.5 text-primary" />;
      case "Warning":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case "Critical":
        return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default:
        return <Bell className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12"
            asChild
          >
            <Link href="/admin">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Megaphone className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Messaging Command
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              System Alerts
            </Text>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-12 px-8 transition-all scale-105 active:scale-95">
              <Send className="mr-2 h-4 w-4" /> Dispatch Manual Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-white/10 p-0 overflow-hidden">
            <form onSubmit={handleSendManualAlert}>
              <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <Megaphone className="h-6 w-6 text-primary" />
                  Alert Architect
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                  Draft a global broadcast signal for high-priority platform
                  events.
                </DialogDescription>
              </DialogHeader>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Alert Headline / Payload
                  </Label>
                  <Textarea
                    placeholder="Enter the critical message for broadcast..."
                    className="bg-background/50 border-white/5 min-h-[120px] resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Classification
                    </Label>
                    <Select defaultValue="Info">
                      <SelectTrigger className="bg-background/50 border-white/5 h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Info">Information (Blue)</SelectItem>
                        <SelectItem value="Warning">Warning (Amber)</SelectItem>
                        <SelectItem value="Critical">Critical (Red)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Target Nodes
                    </Label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-background/50 border-white/5 h-11">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Global (All Users)</SelectItem>
                        <SelectItem value="creators">
                          Verified Experts Only
                        </SelectItem>
                        <SelectItem value="admins">
                          Infrastructure Staff
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel Dispatch
                </Button>
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Transmitting...
                    </>
                  ) : (
                    "Broadcast Signal"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Broadcasts
            </CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Lifecycle total
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-emerald-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Live Nodes
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a) => a.status === "Active").length}
            </div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-tighter">
              Active Signals
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Critical Triage
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a) => a.type === "Critical").length}
            </div>
            <p className="text-[10px] text-destructive font-bold mt-1">
              Requiring Review
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Dispatch SLA
            </CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120ms</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Avg. propagation time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-20 z-30">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Filter alert signals by message or classification..."
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-11 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs"
        >
          <Filter className="h-3.5 w-3.5" /> Matrix Filters
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest py-4">
                  Alert Signal Payload
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Classification
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Broadcast Status
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Handshake Time
                </TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">
                  Administrative Actions
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
                      Synchronizing Alert Matrix...
                    </Text>
                  </TableCell>
                </TableRow>
              ) : filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground italic"
                  >
                    No active alert nodes localized within the discovery buffer.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                  >
                    <TableCell className="py-5 pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate max-w-[400px]">
                          {alert.message}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">
                          Node ID: {alert.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5 font-bold uppercase text-[9px] h-6 px-3 border-white/10",
                          alert.type === "Critical"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : alert.type === "Warning"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {getTypeIcon(alert.type)} {alert.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Switch
                          checked={alert.status === "Active"}
                          onCheckedChange={() =>
                            handleToggleStatus(alert.id, alert.status)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">
                          {format(new Date(alert.date), "MMM d, yyyy")}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          {format(new Date(alert.date), "HH:mm:ss")} UTC
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDelete(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">
              Broadcast Integrity
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground mt-1 leading-relaxed"
            >
              Every system alert is cryptographically signed. Activation
              triggers an immediate cache-bust across the **Intelligence CDN**
              to ensure real-time delivery.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">
              Priority Escalation
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground mt-1 leading-relaxed"
            >
              Alerts classified as **Critical** are automatically pushed to the
              SMS Protocol for infrastructure staff and pinned to the global
              header for all users.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-emerald-500/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 w-fit text-emerald-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">
              Audit Retention
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground mt-1 leading-relaxed"
            >
              Alert history is retained for **90 days** within the communication
              archive for post-incident reviews and editorial performance
              tracking.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
