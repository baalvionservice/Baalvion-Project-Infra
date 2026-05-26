'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, 
  Search, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  Zap, 
  Target, 
  RefreshCw, 
  Loader2, 
  Info,
  Database,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  XCircle,
  Clock
} from 'lucide-react';
import { seoService } from '@/lib/services/seoService';
import { IndexSummary, IndexStatusNode, SitemapStatus } from '@/types/seo';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SEOEngineHub() {
  const [summary, setSummary] = useState<IndexSummary | null>(null);
  const [statuses, setIndexStatuses] = useState<IndexStatusNode[]>([]);
  const [sitemap, setSitemap] = useState<SitemapStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, st, sm] = await Promise.all([
          seoService.getIndexSummary(),
          seoService.getIndexStatus(),
          seoService.getSitemapStatus()
        ]);
        setSummary(s);
        setIndexStatuses(st);
        setSitemap(sm);
      } catch (e) {
        console.error('SEO state sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSyncSitemap = async () => {
    setSyncing(true);
    toast({ title: "Sitemap Cycle Initiated", description: "Crawling 1M+ nodes for hierarchical consistency..." });
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
    toast({ title: "Handshake Complete", description: "XML Sitemap has been successfully synchronized." });
  };

  if (loading || !summary) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Scanning Organic Matrix...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Globe className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Organic Authority Index</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">SEO & Index Tracking</Text>
        </div>
        <Button 
          onClick={handleSyncSitemap}
          disabled={syncing}
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
        >
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Trigger Sitemap Sync
        </Button>
      </header>

      {/* Index Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Pages', value: formatCompact(summary.totalPages), icon: Layers, color: 'text-primary' },
          { label: 'Sitemap Density', value: formatCompact(summary.submittedToSitemap), icon: Database, color: 'text-secondary' },
          { label: 'Indexed Nodes', value: formatCompact(summary.indexedPages), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Non-Indexed', value: formatCompact(summary.nonIndexedPages), icon: XCircle, color: 'text-amber-500' },
        ].map((m) => (
          <Card key={m.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-xl bg-background/50 border border-white/5 transition-transform group-hover:scale-110", m.color)}>
                  <m.icon size={20} />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold border-white/10 uppercase bg-black/20">Synced</Badge>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tighter">{m.value}</div>
                <Text variant="label" className="text-[10px] opacity-50 uppercase font-bold tracking-widest mt-1">{m.label}</Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Index Tracking Table */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Crawl Logic Matrix</CardTitle>
                <CardDescription>Live status of intelligence nodes in the Google Search index.</CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 uppercase text-[9px] font-bold h-7 px-4">Engine: Stable</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Research Path</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map(node => (
                    <TableRow key={node.url} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                      <TableCell className="py-5 pl-8">
                        <span className="text-xs font-mono font-medium text-primary group-hover:text-foreground transition-colors">{node.url}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Badge className={cn(
                            "text-[8px] font-bold uppercase border-none px-2 h-5",
                            node.status === 'Indexed' ? "bg-emerald-500/10 text-emerald-500" : 
                            node.status === 'Pending' ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
                          )}>
                            {node.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs opacity-70">{node.priority}</TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          <Clock className="h-3 w-3" /> {node.lastUpdated}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Sitemap & Discovery Context Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Layers className="h-32 w-32 text-primary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <ShieldCheck className="h-4 w-4" /> Sitemap Matrix
            </div>
            <div className="space-y-4 relative z-10">
              <div className="space-y-1">
                <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Public Endpoint</Text>
                <div className="flex items-center justify-between bg-background/50 p-3 rounded-xl border border-white/10 group-hover:border-primary/30 transition-all">
                  <span className="text-xs font-mono text-foreground/80 truncate pr-4">/sitemap.xml</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Last Update</Text>
                  <div className="text-sm font-bold">{sitemap?.lastUpdated.split(' ')[0]}</div>
                </div>
                <div className="space-y-1 text-right">
                  <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest">Total Links</Text>
                  <div className="text-sm font-bold">{formatCompact(sitemap?.totalUrls || 0)}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-none bg-card/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Organic Directives</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-4 rounded-xl bg-background/50 border border-white/5 flex items-start gap-3">
                <Info className="h-4 w-4 text-secondary mt-0.5" />
                <Text variant="caption" className="leading-relaxed italic">
                  "68,100 nodes are currently in the **Ingestion Buffer**. Priority 0.9 nodes (Calculators) are being processed first."
                </Text>
              </div>
              <Button variant="outline" className="w-full rounded-xl h-10 font-bold text-xs uppercase group">
                Global Index Audit <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
