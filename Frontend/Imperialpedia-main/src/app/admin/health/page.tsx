'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Activity, 
  ShieldCheck, 
  Server, 
  Database, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  Loader2,
  Clock,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { SystemHealth } from '@/types/system';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Progress } from '@/components/ui/progress';

/**
 * System Health Monitoring Dashboard.
 * Displays critical telemetry for API, Database, and Server clusters.
 */
export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      setLoading(true);
      const response = await systemService.getSystemHealth();
      if (response.data) setHealth(response.data);
      setLoading(false);
    }
    loadHealth();
  }, []);

  if (loading || !health) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold uppercase tracking-widest text-muted-foreground">
          Establishing Telemetry Connection...
        </Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold px-3">HEALTHY</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold px-3">DEGRADED</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="font-bold px-3">CRITICAL</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Activity className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Infrastructure Intelligence</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">System Health Monitoring</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time telemetry from the Imperialpedia Index clusters.
          </Text>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Re-sync Node
        </Button>
      </header>

      {/* Core Health Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">API Availability</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.apiUptime}%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ShieldCheck className="h-3 w-3 mr-1" /> SLA Verified
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Database State</CardTitle>
            <Database className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mb-1">Cluster Alpha</div>
            {getStatusBadge(health.dbStatus)}
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Server Load</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{health.serverLoad}%</div>
            <Progress value={health.serverLoad} className="h-1.5 bg-muted/20" />
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.errorRate}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Below critical threshold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Load History Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Telemetry Velocity</CardTitle>
                <CardDescription>Visualizing infrastructure load and error cycles.</CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-500">Live Stream</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={health.history}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="load" 
                  stroke="#8272F2" 
                  fillOpacity={1} 
                  fill="url(#colorLoad)" 
                  strokeWidth={3}
                  name="Server Load (%)"
                />
                <Area 
                  type="step" 
                  dataKey="errors" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorErrors)" 
                  strokeWidth={2}
                  name="Error Spikes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resources & Status Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" /> Active Nodes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Gateway Hub', status: 'healthy', load: 24 },
                { name: 'Index Worker A', status: 'healthy', load: 68 },
                { name: 'Cache Layer', status: 'warning', load: 82 },
                { name: 'pSEO Generator', status: 'healthy', load: 12 },
              ].map((node) => (
                <div key={node.name} className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <Text variant="caption" className="font-bold">{node.name}</Text>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      node.status === 'healthy' ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={node.load} className="h-1 flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground">{node.load}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Uptime Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: '14m ago', event: 'Sitemap Re-indexed' },
                { time: '2h ago', event: 'Node B Restarted' },
                { time: '12h ago', event: 'Backup Verified' },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  <div>
                    <Text variant="caption" className="font-medium block">{ev.event}</Text>
                    <Text variant="caption" className="text-muted-foreground text-[10px]">{ev.time}</Text>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-primary mt-2">
                View Maintenance Logs <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
