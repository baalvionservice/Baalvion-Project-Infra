"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/design-system/typography/text';
import { 
  Bell, 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  Search,
  Filter,
  Mail,
  Smartphone,
  MessageSquare,
  Settings2,
  Info,
  ChevronRight,
  Target,
} from "lucide-react";
import { systemService } from "@/services/data/system-service";
import {
  AlertsSystemData,
  AdvancedAlertNode,
  NotificationChannelNode,
  AlertRuleNode,
} from "@/types/system";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

/**
 * Advanced Alerts & Notification Orchestration Hub Client.
 * Specialized control suite for managing real-time infrastructure triggers and communication channels.
 */
export function AdvancedAlertsClient() {
  const [data, setData] = useState<AlertsSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("triage");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getAlertsSystemData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Alert system state sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (label: string) => {
    toast({
      title: "Action Initiated",
      description: `Targeting alert node: ${label}`,
    });
  };

  const handleToggleChannel = (channel: string) => {
    if (!data) return;
    setData({
      ...data,
      notification_channels: data.notification_channels.map((c) =>
        c.channel === channel
          ? {
              ...c,
              status:
                c.status === "mock_enabled" ? "mock_disabled" : "mock_enabled",
            }
          : c
      ),
    });
    toast({
      title: "Channel State Shifted",
      description: `Delivery node "${channel}" has been synchronized.`,
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
          Establishing Communication Matrix...
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
            High
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
      case "mock_resolved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Resolved
          </Badge>
        );
      case "mock_snoozed":
        return (
          <Badge className="bg-muted text-muted-foreground border-none font-bold uppercase text-[8px] h-5 px-2">
            Snoozed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "Email":
        return <Mail className="h-4 w-4" />;
      case "Push":
        return <Smartphone className="h-4 w-4" />;
      case "SMS":
        return <MessageSquare className="h-4 w-4" />;
      case "In-App":
        return <Bell className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const filteredAlerts = data.alerts.filter(
    (a) =>
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Bell className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Dispatch Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Alerts & Notifications</Text>
          </div>
          <div className="flex items-center gap-3">
            <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl">
              <TabsTrigger value="triage" className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary">
                <ShieldAlert className="h-4 w-4" /> Alert Triage
              </TabsTrigger>
              <TabsTrigger
                value="channels"
                className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
              >
                <Layers className="h-4 w-4" /> Gateways
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
              >
                <Target className="h-4 w-4" /> Rule Matrix
              </TabsTrigger>
            </TabsList>
          </div>
        </header>

        {/* ALERT TRIAGE TAB */}
        <TabsContent value="triage" className="mt-0 space-y-8 animate-in fade-in duration-500 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <Text variant="h3" className="font-bold">Live Alert Buffer</Text>
                    <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Instructional Anomaly Pulse</Text>
                  </div>
                </div>
                <div className="relative group w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search alert nodes..." 
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
                        <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Incident Type</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Severity</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Source Node</TableHead>
                        <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <TableRow key={alert.alert_id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                          <TableCell className="py-5 pl-8">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground/90 leading-tight">{alert.type}</span>
                              <span className="text-[9px] font-mono text-primary uppercase mt-1 font-bold">#{alert.alert_id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              {getSeverityBadge(alert.severity)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              {getStatusBadge(alert.status)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">
                            {alert.source}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all"
                                onClick={() => handleAction(alert.alert_id)}
                              >
                                Triage
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

            <div className="lg:col-span-4 space-y-8">
              <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group h-fit">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap className="h-24 w-24 text-primary" />
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Activity className="h-6 w-6" />
                    </div>
                    <Text variant="h4" className="font-bold">Transmission Vitals</Text>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Dispatch Success</span>
                        <span className="text-emerald-500">99.9%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Avg. Delivery Latency</span>
                        <span className="text-primary">450ms</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[75%]" />
                      </div>
                    </div>
                  </div>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed italic block pt-4">
                    "The alerting kernel is operating within the 180ms handshake buffer. Critical SMS nodes are prioritized during high-load cycles."
                  </Text>
                </div>
              </Card>

              <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4">
                <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> Delivery Integrity
                </div>
                <Text variant="caption" className="text-muted-foreground leading-relaxed">
                  Platform dispatches are cryptographically signed. Any verification failure in the **Handshake Registry** will automatically reroute to the fallback Email node.
                </Text>
                <Button variant="link" className="p-0 h-auto text-secondary text-xs font-bold group/link" onClick={() => handleAction('Review Logs')}>
                  Review Dispatch Logs <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* GATEWAYS TAB */}
        <TabsContent value="channels" className="mt-0 space-y-10 animate-in fade-in duration-500 outline-none">
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">Notification Gateways</Text>
                  <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Communication Node Management</Text>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl border-white/10 h-10 px-6 font-bold text-xs" onClick={() => handleAction('Provision Channel')}>
                <Plus className="mr-2 h-4 w-4" /> Provision Gateway
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.notification_channels.map((channel) => (
                <Card key={channel.channel} className="glass-card border-none shadow-xl hover:border-secondary/30 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    {getChannelIcon(channel.channel)}
                  </div>
                  <CardHeader className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-background/50 border border-white/5 text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                        {getChannelIcon(channel.channel)}
                      </div>
                      <Switch 
                        checked={channel.status === 'mock_enabled'} 
                        onCheckedChange={() => handleToggleChannel(channel.channel)}
                      />
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-secondary transition-colors">{channel.channel}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
                        <span>Last Heartbeat</span>
                        <span className="text-foreground">{channel.last_sent.split(' ')[1]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={channel.status === 'mock_enabled' ? 'default' : 'outline'} className={cn(
                          "text-[8px] font-bold uppercase",
                          channel.status === 'mock_enabled' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "text-muted-foreground"
                        )}>
                          {channel.status.split('_')[1]}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/10 border-t border-white/5 group-hover:bg-secondary/5 transition-colors">
                    <Button variant="ghost" size="sm" className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-secondary" onClick={() => handleAction(`Test ${channel.channel}`)}>
                      Dispatch Test Signal
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
              <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
                <RefreshCw className="h-10 w-10" />
              </div>
              <div className="flex-1 text-center lg:text-left space-y-2">
                <Text variant="h2" className="text-2xl font-bold">Failover Orchestration</Text>
                <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-2xl">
                  The platform architecture utilizes a **Sequential Failover Matrix**. If the Primary SMS gateway identifies a threshold failure, dispatches are automatically mirrored to the In-App buffer and Push gateways.
                </Text>
              </div>
              <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0">
                Configure Routing Order
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* RULE MATRIX TAB */}
        <TabsContent value="rules" className="mt-0 space-y-8 animate-in fade-in duration-500 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <Text variant="h3" className="font-bold">Alert Rule Matrix</Text>
                    <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Trigger Logic Engine</Text>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl border-white/10 h-10 px-6 font-bold text-xs" onClick={() => handleAction('Create Rule')}>
                  <Plus className="mr-2 h-4 w-4" /> Define New Logic
                </Button>
              </div>

              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 border-b border-white/5">
                        <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Rule Narrative</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Logic Condition</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">State</TableHead>
                        <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.alert_rules.map((rule) => (
                        <TableRow key={rule.rule_name} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                          <TableCell className="py-5 pl-8">
                            <Text variant="bodySmall" weight="bold" className="text-foreground/90">{rule.rule_name}</Text>
                          </TableCell>
                          <TableCell>
                            <code className="text-[10px] font-mono text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                              {rule.condition}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Badge variant={rule.priority === 'mock_high' ? 'destructive' : 'outline'} className="text-[8px] font-bold uppercase h-5 px-2">
                                {rule.priority.split('_')[1]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Switch checked={rule.status === 'mock_active'} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary transition-all">
                              <Settings2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-10">
              <div className="p-8 rounded-[2.5rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Info className="h-16 w-16 text-secondary" />
                </div>
                <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                  <Target className="h-4 w-4" /> Anomaly Logic
                </div>
                <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                  "Rules utilizing the **Anomaly Engine** are benchmarked against trailing 30-day performance clusters. Thresholds are auto-adjusted based on seasonal load variance."
                </Text>
              </div>

              <Card className="glass-card border-none bg-destructive/5 hover:bg-destructive/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive opacity-50" />
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <Text variant="bodySmall" weight="bold" className="text-destructive uppercase tracking-widest text-[10px]">Rule Violation</Text>
                    <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
                      Conflict detected in **Rule: High CPU Usage**. Target node `Server1` has identifying triggers in both the Infrastructure and Alerts clusters.
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
