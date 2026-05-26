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
  Zap, 
  ShieldCheck, 
  Lock, 
  User, 
  Search, 
  Loader2, 
  Plus,
  ArrowRight,
  ShieldAlert,
  Layers,
  Settings2,
  Activity,
  Calendar,
  Sparkles,
  ChevronRight,
  UserMinus,
  Key,
  Users
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { AccessManagementData } from '@/types/system';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

/**
 * Feature Flags & Role-Based Access Management Client.
 * Orchestrates functional gateways and persona-level permissions for platform governance.
 */
export function AccessManagementClient() {
  const [data, setData] = useState<AccessManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("features");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getAccessManagementData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Access state sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleFeature = (name: string) => {
    if (!data) return;
    setData({
      ...data,
      feature_flags: data.feature_flags.map((f) =>
        f.feature_name === name
          ? { ...f, status: f.status === "mock_on" ? "mock_off" : "mock_on" }
          : f
      ),
    });
    toast({
      title: "Gateway State Shifted",
      description: `Feature node "${name}" has been synchronized across the cluster.`,
    });
  };

  const handleAction = (label: string) => {
    toast({
      title: "Action Initiated",
      description: `Targeting governance node: ${label}`,
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
          Calibrating Access Matrix...
        </Text>
      </div>
    );
  }

  const filteredFeatures = data.feature_flags.filter(
    (f) =>
      f.feature_name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAssignments = data.mock_user_assignments.filter(
    (a) =>
      a.user.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Governance Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Access Orchestration</Text>
          </div>
          <div className="flex items-center gap-3">
            <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl">
              <TabsTrigger value="features" className="px-6 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary">
                <Zap className="h-4 w-4" /> Feature Toggles
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="px-6 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
              >
                <ShieldCheck className="h-4 w-4" /> Access Control
              </TabsTrigger>
            </TabsList>
          </div>
        </header>

        {/* FEATURE FLAGS TAB */}
        <TabsContent value="features" className="mt-0 space-y-8 animate-in fade-in duration-500 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <Text variant="h3" className="font-bold">Feature Gateways</Text>
                    <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Functional Node Toggles</Text>
                  </div>
                </div>
                <div className="relative group w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Filter deployment nodes..." 
                    className="pl-10 h-10 bg-card/30 border-white/5 rounded-xl text-xs" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredFeatures.map((flag) => (
                  <Card key={flag.feature_name} className="glass-card border-none hover:border-primary/20 transition-all group overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-5 items-start">
                          <div className={cn(
                            "p-3 rounded-2xl bg-background/50 border border-white/5 transition-all group-hover:scale-110",
                            flag.status === 'mock_on' ? "text-primary" : "text-muted-foreground opacity-50"
                          )}>
                            <Zap className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Text variant="body" weight="bold">{flag.feature_name}</Text>
                              <Badge variant="outline" className="text-[8px] font-bold border-white/10 uppercase bg-black/20">{flag.category}</Badge>
                            </div>
                            <Text variant="caption" className="text-muted-foreground block leading-relaxed max-w-md">
                              {flag.description}
                            </Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <Text variant="label" className="text-[8px] opacity-50 font-bold uppercase tracking-widest">Active</Text>
                            <Switch 
                              checked={flag.status === 'mock_on'} 
                              onCheckedChange={() => handleToggleFeature(flag.feature_name)}
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleAction('Schedule Rollout')}>
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group h-fit">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-24 w-24 text-primary" />
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Activity className="h-6 w-6" />
                    </div>
                    <Text variant="h4" className="font-bold">Rollout Analytics</Text>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Sync Success</span>
                        <span className="text-emerald-500">100%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Node Latency</span>
                        <span className="text-primary">180ms</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[85%]" />
                      </div>
                    </div>
                  </div>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed italic block pt-4">
                    "Feature flags are cryptographically signed. Activation triggers an immediate cache-burst across global CDN edge nodes."
                  </Text>
                </div>
              </Card>

              <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4">
                <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                  <ShieldAlert className="h-4 w-4" /> Safety Protocol
                </div>
                <Text variant="caption" className="text-muted-foreground leading-relaxed">
                  Critical features like **Monetization** and **User Migration** require multi-administrator sign-off before being toggled in the production cluster.
                </Text>
                <Button variant="link" className="p-0 h-auto text-secondary text-xs font-bold group/link" onClick={() => handleAction('Review Approval Chain')}>
                  Review Approval Chain <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ROLES & PERMISSIONS TAB */}
        <TabsContent value="roles" className="mt-0 space-y-12 animate-in fade-in duration-500 outline-none">
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">Persona Architect</Text>
                  <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Capability Logic Matrix</Text>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl border-white/10 h-10 px-6 font-bold text-xs" onClick={() => handleAction('Define New Persona')}>
                <Plus className="mr-2 h-4 w-4" /> New Persona
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.roles.map((role) => (
                <Card key={role.role_name} className="glass-card border-none shadow-xl hover:border-secondary/30 transition-all group">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 rounded-xl bg-background/50 border border-white/5 text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase tracking-widest bg-black/20">System ID</Badge>
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-secondary transition-colors">{role.role_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 space-y-6">
                    <div className="space-y-3">
                      <Text variant="label" className="text-[9px] opacity-50 font-bold uppercase tracking-widest">Active Nodes</Text>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.map(p => (
                          <Badge key={p} variant="secondary" className="bg-secondary/5 text-secondary border-none text-[8px] font-bold uppercase h-5 px-2">
                            {p.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/10 border-t border-white/5 group-hover:bg-secondary/5 transition-colors">
                    <Button variant="ghost" size="sm" className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-secondary" onClick={() => handleAction('Modify Permissions')}>
                      Modify Permissions Matrix
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">User Identity Mapping</Text>
                  <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Persona Assignment Registry</Text>
                </div>
              </div>
              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  placeholder="Search identity registry..." 
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
                      <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">User Node</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Assigned Persona</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                      <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assign) => (
                      <TableRow key={assign.user} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 transition-all">
                              <User className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold">{assign.user}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "font-bold uppercase text-[9px] h-6 px-3 border-white/10",
                            assign.assigned_role === 'Admin' ? "bg-primary/10 text-primary" :
                            assign.assigned_role === 'Editor' ? "bg-secondary/10 text-secondary" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {assign.assigned_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-bold uppercase h-5 px-2">Verified</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-4 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all" onClick={() => handleAction('Change Persona')}>
                              <ArrowRight className="h-3.5 w-3.5" /> Shift Persona
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-all" onClick={() => handleAction('Unassign Role')}>
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>

          <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
              <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
                <Key className="h-10 w-10" />
              </div>
              <div className="flex-1 text-center lg:text-left space-y-2">
                <Text variant="h2" className="text-2xl font-bold">Least Privilege Matrix</Text>
                <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-2xl">
                  The platform architecture enforces **Least Privilege by Default**. Every persona shift is logged in the immutable audit trail. Changes propagate across the identity cluster within 180 seconds.
                </Text>
              </div>
              <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0" asChild>
                <Link href="/admin/control/audit-trail">Access Security Logs</Link>
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
