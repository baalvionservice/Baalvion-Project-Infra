'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Trash2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { CdnManagementData, CdnNode, PageCacheItem, CdnLogEntry } from '@/types/system';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

/**
 * CDN & Page Cache Management Hub.
 * Orchestrates global delivery performance and edge-level cache persistence.
 */
export function CdnManagementClient() {
  const [data, setData] = useState<CdnManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getCdnManagementData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('CDN state sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePurge = async (url?: string) => {
    setPurging(url || 'global');
    toast({
      title: url ? "Cache Purge Initiated" : "Global Cache Burst",
      description: `Targeting discovery nodes for ${url || 'entire platform'}...`,
    });
    
    await new Promise(r => setTimeout(r, 1200));
    setPurging(null);
    
    toast({
      title: "Handshake Complete",
      description: "Edge nodes have been successfully synchronized.",
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Global Delivery Network...
        </Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'mock_active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3"><CheckCircle2 className="h-2.5 w-2.5" /> Active</Badge>;
      case 'mock_warning':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3"><AlertTriangle className="h-2.5 w-2.5" /> Latency</Badge>;
      case 'mock_inactive':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-3"><XCircle className="h-2.5 w-2.5" /> Inactive</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  const getCacheStatusBadge = (status: string) => {
    switch (status) {
      case 'mock_cached':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">Cached</Badge>;
      case 'mock_expired':
        return <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase text-[8px] h-5 px-2">Expired</Badge>;
      case 'mock_miss':
        return <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[8px] h-5 px-2">Miss</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCache = data.page_cache.filter(item => 
    item.page_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      {/* CDN NODE REGISTRY */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <Text variant="h3" className="font-bold">CDN Point of Presence (PoP)</Text>
              <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Global Delivery Handshake</Text>
            </div>
          </div>
          <Button 
            onClick={() => handlePurge()}
            disabled={!!purging}
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6 transition-all scale-105 active:scale-95"
          >
            {purging === 'global' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Purge Global Cache
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.cdn_nodes.map((node) => (
            <Card key={node.node_name} className="glass-card border-none shadow-xl group hover:border-primary/30 transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <Zap className="h-16 w-16 text-primary" />
              </div>
              <CardContent className="p-6 space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Text variant="body" weight="bold" className="group-hover:text-primary transition-colors uppercase tracking-tighter">{node.node_name}</Text>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono uppercase font-bold">
                      <Globe className="h-2.5 w-2.5" /> {node.region}
                    </div>
                  </div>
                  {getStatusBadge(node.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <Text variant="label" className="text-[8px] opacity-50 uppercase tracking-widest">Edge Latency</Text>
                    <div className={cn(
                      "text-xl font-bold font-mono",
                      parseInt(node.latency) > 100 ? "text-amber-500" : "text-foreground"
                    )}>{node.latency}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <Text variant="label" className="text-[8px] opacity-50 uppercase tracking-widest">Bandwidth</Text>
                    <div className="text-xl font-bold font-mono text-primary">{node.bandwidth_usage}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PAGE CACHE MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Edge Cache Matrix</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Programmatic Node Persistence</Text>
              </div>
            </div>
            
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <Input 
                placeholder="Search index paths..." 
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
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Intelligence Path (URL)</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Cache Hit</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">TTL</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCache.map((item) => (
                    <TableRow key={item.page_url} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-medium text-foreground/80 truncate max-w-[250px]">{item.page_url}</span>
                          <span className="text-[9px] text-muted-foreground uppercase mt-1 font-bold">Refresh: {item.last_refresh}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {getCacheStatusBadge(item.cache_status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-secondary">{item.cache_hit_ratio}</span>
                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-secondary" style={{ width: item.cache_hit_ratio }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {item.ttl}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={purging === item.page_url}
                            onClick={() => handlePurge(item.page_url)}
                            className="h-8 w-8 rounded-lg hover:text-primary transition-all"
                          >
                            {purging === item.page_url ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
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

        {/* ALERTS & LOGS SIDEBAR */}
        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Transmission Triage</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Edge Anomaly Pulse</Text>
              </div>
            </div>

            <div className="space-y-4">
              {data.alerts_logs.filter(l => l.alert_type).map((alert, i) => (
                <Card key={i} className="glass-card border-none bg-destructive/5 hover:bg-destructive/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-destructive opacity-50" />
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <Text variant="bodySmall" weight="bold" className="text-destructive uppercase tracking-tight">{alert.alert_type}</Text>
                      <Text variant="caption" className="text-muted-foreground font-mono text-[9px] block">
                        Node: {alert.node} • Status: {alert.status?.split('_')[1]}
                      </Text>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Cache Audit Trail</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Temporal Handshake Logs</Text>
              </div>
            </div>

            <Card className="glass-card border-none bg-card/30">
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {data.alerts_logs.filter(l => l.log_type).map((log, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                          {log.log_type === 'Cache Purge' ? <RefreshCw className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                        </div>
                        <div className="space-y-0.5">
                          <Text variant="caption" weight="bold" className="block text-foreground/90">{log.log_type}</Text>
                          {log.page && <Text variant="caption" className="text-muted-foreground font-mono text-[8px]">{log.page}</Text>}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{log.timestamp.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full h-10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none border-t border-white/5">
                  Full Dispatch Log
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Database className="h-16 w-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Persistence Strategy
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
              "Page cache logic is currently set to **Optimistic Re-validation**. Stale nodes are served for 300ms while the background ingestion pipeline warms the edge buffer."
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
