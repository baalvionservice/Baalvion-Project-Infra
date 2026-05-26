'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, 
  Languages, 
  Search, 
  Filter, 
  Loader2, 
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Layers,
  Settings2,
  Activity,
  Calendar,
  Sparkles,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { LocalizationData, LanguageNode, LocalizationItem } from '@/types/system';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Multi-Language & Localization Orchestration Hub Client.
 * Manages global dialect availability and translatable metadata for the index.
 */
export function LocalizationClient() {
  const [data, setData] = useState<LocalizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('registry');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getLocalizationData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Localization state sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleLanguage = (code: string) => {
    if (!data) return;
    setData({
      ...data,
      languages: data.languages.map(l => 
        l.language_code === code ? { ...l, status: l.status === 'mock_enabled' ? 'mock_disabled' : 'mock_enabled' } : l
      )
    });
    toast({
      title: "Dialect State Shifted",
      description: `Language node "${code.toUpperCase()}" has been synchronized.`,
    });
  };

  const handleAction = (label: string) => {
    toast({
      title: "Verifying Node",
      description: `Initiating review for: ${label}`,
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Global Dialect Link...
        </Text>
      </div>
    );
  }

  const filteredContent = data.localization_content.filter(c => 
    c.key.toLowerCase().includes(search.toLowerCase()) ||
    c.source_text.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'mock_reviewed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3"><CheckCircle2 className="h-2.5 w-2.5" /> Reviewed</Badge>;
      case 'mock_pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3"><Clock className="h-2.5 w-2.5" /> Pending</Badge>;
      case 'mock_approved':
        return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-3"><ShieldCheck className="h-2.5 w-2.5" /> Approved</Badge>;
      default:
        return <Badge variant="outline">{status.split('_')[1]}</Badge>;
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Languages className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Internationalization Kernel</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Localization Hub</Text>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl">
            <TabsList className="bg-transparent border-none">
              <TabsTrigger value="registry" className="px-6 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary">
                <Globe className="h-4 w-4" /> Language Registry
              </TabsTrigger>
              <TabsTrigger value="matrix" className="px-6 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary">
                <Layers className="h-4 w-4" /> Translation Matrix
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* LANGUAGE REGISTRY TAB */}
      <TabsContent value="registry" className="mt-0 space-y-8 animate-in fade-in duration-500 outline-none">
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Supported Dialects</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Global discovery Nodes</Text>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl border-white/10 h-10 px-6 font-bold text-xs">
              <Plus className="mr-2 h-4 w-4" /> Add Language Node
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.languages.map((lang) => (
              <Card key={lang.language_code} className="glass-card border-none shadow-xl group hover:border-primary/30 transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                  <Languages className="h-16 w-16 text-primary" />
                </div>
                <CardContent className="p-6 space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Text variant="body" weight="bold" className="group-hover:text-primary transition-colors">{lang.language_name}</Text>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Code: {lang.language_code}</div>
                    </div>
                    <Switch 
                      checked={lang.status === 'mock_enabled'} 
                      onCheckedChange={() => handleToggleLanguage(lang.language_code)}
                    />
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <Text variant="label" className="text-[8px] opacity-50 uppercase tracking-widest">Visibility</Text>
                    <Badge variant={lang.status === 'mock_enabled' ? 'default' : 'outline'} className={cn(
                      "text-[8px] font-bold uppercase",
                      lang.status === 'mock_enabled' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "text-muted-foreground"
                    )}>
                      {lang.status === 'mock_enabled' ? 'Public' : 'Hidden'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Sparkles className="h-64 w-64 text-primary" />
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
              <RefreshCw className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center lg:text-left space-y-2">
              <Text variant="h2" className="text-2xl font-bold">Programmatic Localization Scaling</Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-2xl">
                The pSEO engine is currently prioritizing the **Hindi** dialect for the "Compound Interest" taxonomy. Enabling a new language triggers an automated translation cycle for 1M+ knowledge nodes within the background queue.
              </Text>
            </div>
            <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0">
              Trigger Global Sync
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* TRANSLATION MATRIX TAB */}
      <TabsContent value="matrix" className="mt-0 space-y-8 animate-in fade-in duration-500 outline-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">Key Triage Matrix</Text>
                  <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Translatable Node Registry</Text>
                </div>
              </div>
              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                <Input 
                  placeholder="Filter keys or source text..." 
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
                      <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Knowledge Key / Source</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Module</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                      <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <TableRow key={item.key} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                        <TableCell className="py-5 pl-8">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-primary uppercase font-bold">{item.key}</span>
                            <span className="text-sm font-bold text-foreground/90 mt-1">"{item.source_text}"</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-white/10 bg-background/50 text-[8px] font-bold uppercase h-5 px-2">
                            {item.module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {getStatusBadge(item.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all"
                              onClick={() => handleAction(item.key)}
                            >
                              <Settings2 className="h-3.5 w-3.5" /> Refine
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

          <div className="lg:col-span-4 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">Dialect Health</Text>
                  <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Index Translation Coverage</Text>
                </div>
              </div>

              <Card className="glass-card border-none bg-card/30">
                <CardContent className="p-6 space-y-6">
                  {data.languages.filter(l => l.status === 'mock_enabled').map(lang => (
                    <div key={lang.language_code} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                        <span>{lang.language_name}</span>
                        <span className="text-secondary">{lang.language_code === 'hi' ? '45%' : '98%'}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full transition-all duration-1000" style={{ width: lang.language_code === 'hi' ? '45%' : '98%' }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FileText className="h-16 w-16 text-secondary" />
              </div>
              <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4" /> Review Cycle
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                "Translations marked as **Reviewed** have been verified by a certified linguistic analyst. Mark as **Approved** to broadcast the string to the public-facing CDN edge nodes."
              </Text>
            </div>

            <Card className="glass-card border-none bg-destructive/5 hover:bg-destructive/10 transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive opacity-50" />
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="bodySmall" weight="bold" className="text-destructive uppercase tracking-widest text-[10px]">Linguistic Anomaly</Text>
                  <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
                    Conflict detected in **French** locale for key `glossary_term_liquidity`. Multiple conflicting variants found in the ingestion buffer.
                  </Text>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </div>
  );
}
