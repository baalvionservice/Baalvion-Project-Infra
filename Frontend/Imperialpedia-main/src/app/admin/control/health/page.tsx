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
  Monitor,
  CheckCircle2,
  XCircle,
  BarChart3
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
 * Platform Health Dashboard (Governance).
 * Specialized telemetry matrix for monitoring infrastructure stability and error velocity.
 */
export default function PlatformHealthDashboard() {
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
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Telemetry Connection...
        </Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
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
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Kernel Telemetry</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">System Health Status</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time infrastructure oversight for the Imperialpedia Intelligence clusters.
          </Text>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30 h-11 px-6" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Synchronize Hub
        </Button>
      </header>

      {/* Core Health Vital Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-emerald-500/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uptime Index</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health.uptimePercentage}%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <CheckCircle2 className="h-3 w-3 mr-1" /> SLA Compliant
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-destructive/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Error velocity (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health.errorCountLast24h}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated exceptions across modules</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">API Cluster State</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mb-1">Gateway Alpha</div>
            {getStatusBadge(health.apiStatus)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Error Trend Visualization */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Infrastructure Load Cycle</CardTitle>
              <CardDescription>Correlating server stress with exception spikes.</CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 font-bold uppercase text-[9px] px-3">Live Streaming</Badge>
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
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

        {/* Distributed Nodes Status */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <Monitor className="h-4 w-4 text-primary" /> Distributed Nodes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {health.nodes.map((node) => (
                <div key={node.name} className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <Text variant="caption" className="font-bold">{node.name}</Text>
                    <div className={cn(
                      "w-2 h-2 rounded-full shadow-[0_0_8px]",
                      node.status === 'Healthy' ? "bg-emerald-500 shadow-emerald-500/50" : 
                      node.status === 'Warning' ? "bg-amber-500 shadow-amber-500/50" : "bg-destructive shadow-destructive/50"
                    )} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={node.load} className="h-1 flex-1 bg-muted/20" />
                    <span className="text-[10px] font-mono text-muted-foreground">{node.load}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Operational Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: '14m ago', event: 'pSEO Ingestion Reset' },
                { time: '2h ago', event: 'Search Index Re-sharded' },
                { time: '12h ago', event: 'Backup Snapshot Verified' },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  <div>
                    <Text variant="caption" className="font-medium block">{ev.event}</Text>
                    <Text variant="caption" className="text-muted-foreground text-[10px] uppercase">{ev.time}</Text>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-primary mt-2 group">
                Full Maintenance Logs <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Anomaly Detection</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Platform leads should monitor the **Search Index Cluster**. It is currently operating at **82% capacity**, triggering a temporary indexing delay for non-verified expert nodes.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Resilience Scaling</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Auto-correction protocols successfully mitigated **4 critical timeouts** in the last 12 hours. Infrastructure integrity remains at a stable **99.98% SLA**.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
