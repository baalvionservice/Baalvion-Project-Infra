'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/design-system/typography/text';
import { 
  Zap, 
  Search, 
  Filter, 
  Loader2, 
  Settings2, 
  FlaskConical, 
  ShieldCheck, 
  AlertTriangle, 
  Info,
  Clock,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { FeatureFlag } from '@/types/system';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

/**
 * Feature Flag Management Dashboard.
 * Allows administrators to toggle functional nodes and experimental features across the platform.
 */
export default function FeatureFlagsPage() {
  const [flags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadFlags() {
      try {
        const response = await systemService.getFeatureFlags();
        if (response.data) setFeatureFlags(response.data);
      } catch (e) {
        console.error('Feature flag sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadFlags();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    const flag = flags.find(f => f.id === id);
    if (!flag) return;

    // Optimistic update
    setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !current } : f));
    
    try {
      await systemService.updateFeatureFlag(id, !current);
      toast({
        title: !current ? "Feature Activated" : "Feature Deactivated",
        description: `Deployment state for "${flag.name}" has been synchronized.`,
      });
    } catch (e) {
      // Revert on failure
      setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: current } : f));
      toast({
        title: "Sync Error",
        description: "Failed to update feature state. Reverting to local cache.",
        variant: "destructive"
      });
    }
  };

  const filteredFlags = flags.filter(flag => 
    flag.name.toLowerCase().includes(search.toLowerCase()) ||
    flag.description.toLowerCase().includes(search.toLowerCase()) ||
    flag.module.toLowerCase().includes(search.toLowerCase())
  );

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive" className="text-[9px] font-bold uppercase px-2 h-5">High Impact</Badge>;
      case 'medium': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-bold uppercase px-2 h-5">Medium</Badge>;
      default: return <Badge variant="outline" className="text-[9px] font-bold uppercase px-2 h-5">Low Impact</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Zap className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Deployment Control</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Feature Gateways</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Manage functional nodes and progressive rollouts for the Imperialpedia Index.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Gateway Integrity Sealed</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search gateways by identity, module, or impact..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="h-11 px-4 gap-2 border-white/10 bg-background/30 rounded-xl">
          <Filter className="h-3.5 w-3.5" /> Filter Matrix
        </Badge>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Feature Gateway</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Operational State</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Deployment Narrative</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Impact / Phase</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Syncing Deployment Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredFlags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No functional nodes localized within current search buffer.
                  </TableCell>
                </TableRow>
              ) : filteredFlags.map((flag) => (
                <TableRow key={flag.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold flex items-center gap-2">
                        {flag.name}
                        {flag.isBeta && (
                          <span className="text-[8px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">Beta</span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase mt-1">{flag.module}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Switch 
                        checked={flag.enabled} 
                        onCheckedChange={() => handleToggle(flag.id, flag.enabled)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <Text variant="caption" className="text-muted-foreground leading-relaxed line-clamp-2" title={flag.description}>
                      {flag.description}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {getImpactBadge(flag.impact)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-bold">SHA-256: 8F2D...</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                        <Clock className="h-2.5 w-2.5" /> 4h ago
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Deployment Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Blue-Green Switching</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Toggling high-impact features initiates a zero-downtime traffic shift between production clusters. All metrics are mirrored for 60 seconds post-toggle.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Experimental Sandboxing</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Features marked as **Beta** are restricted to internal administrative nodes and verified expert cohorts until sitemap integrity is validated.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Kill-Switch Protocol</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              In the event of a latency spike exceeding **250ms**, the gateway engine is configured to automatically sunset non-critical experimental nodes.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
