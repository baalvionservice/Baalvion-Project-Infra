'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Search, 
  Filter, 
  Target, 
  Instagram, 
  Linkedin, 
  Loader2, 
  CheckCircle2, 
  Database, 
  Sparkles, 
  Globe, 
  Mail, 
  TrendingUp, 
  ChevronRight,
  X,
  History,
  MoreHorizontal,
  ArrowRight,
  ShieldCheck,
  Plus,
  Info
} from 'lucide-react';
import { useAcquisitionStore } from '@/store/useAcquisitionStore';
import { ScraperPlatform, ScrapedLead } from '@/types/acquisition';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function BrandAcquisitionPage() {
  const { toast } = useToast();
  const { 
    scrapedLeads, 
    enrichedLeads, 
    history, 
    loading, 
    enriching, 
    importing, 
    runScraper, 
    runEnrichment, 
    runImport, 
    fetchHistory,
    clearLeads 
  } = useAcquisitionStore();

  const [platform, setPlatform] = useState<ScraperPlatform>('instagram');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('20');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailLead, setDetailLead] = useState<ScrapedLead | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleScrape = async () => {
    if (!query.trim()) return toast({ variant: 'destructive', title: 'Query Required', description: 'Enter a search term to find brands.' });
    
    toast({ title: "Scraper Initialized", description: `Searching ${platform} for "${query}"...` });
    await runScraper(platform, query, Number(limit));
    setSelectedIds([]);
  };

  const handleEnrichSelected = async () => {
    const selected = scrapedLeads.filter(l => selectedIds.includes(l.id));
    if (selected.length === 0) return;
    
    toast({ title: "Enrichment Started", description: "Finding contact details and traffic data..." });
    await runEnrichment(selected);
    toast({ title: "Data Enriched", description: `Added intelligence to ${selected.length} leads.` });
  };

  const handleImportSelected = async () => {
    const selected = scrapedLeads.filter(l => selectedIds.includes(l.id));
    if (selected.length === 0) return;

    toast({ title: "Importing...", description: "Pushing leads to CRM pipeline." });
    const count = await runImport(selected);
    toast({ title: "Import Success", description: `Added ${count} leads to the CRM.` });
    clearLeads();
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === scrapedLeads.length ? [] : scrapedLeads.map(l => l.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Brand Acquisition Engine
          </h1>
          <p className="text-slate-500 font-medium">Discover, qualify, and ingest high-potential brands from social platforms.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-slate-900 text-white h-11 px-4 rounded-xl flex items-center gap-2 border-none shadow-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-black uppercase tracking-widest text-[10px]">AI Prospecting Active</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Scraper Control Panel */}
        <div className="lg:col-span-12">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl font-black">Search Configuration</CardTitle>
              <CardDescription>Target specific niches and platforms to find growth-stage brands.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Source Platform</Label>
                  <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                        </div>
                      </SelectItem>
                      <SelectItem value="linkedin" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-blue-600" /> LinkedIn
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="font-bold text-slate-700">Keyword / Niche Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="e.g. D2C Skincare, Sustainable Apparel..." 
                      className="pl-10 h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Result Limit</Label>
                  <Select value={limit} onValueChange={setLimit}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20" className="font-bold">20 Results</SelectItem>
                      <SelectItem value="50" className="font-bold">50 Results</SelectItem>
                      <SelectItem value="100" className="font-bold">100 Results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50/50 border-t flex justify-end gap-4">
              <Button 
                variant="ghost" 
                className="rounded-xl font-bold h-12 px-6"
                onClick={clearLeads}
              >
                Clear Results
              </Button>
              <Button 
                disabled={loading}
                onClick={handleScrape}
                className="rounded-xl font-black h-12 px-10 shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Launch Global Scrape
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Results Table */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Discovery Results
            </h2>
            
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3"
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl font-bold h-9 border-primary/20 text-primary bg-primary/5"
                    disabled={enriching}
                    onClick={handleEnrichSelected}
                  >
                    {enriching ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                    Enrich Selected ({selectedIds.length})
                  </Button>
                  <Button 
                    size="sm" 
                    className="rounded-xl font-black h-9 bg-slate-900 text-white px-6"
                    disabled={importing}
                    onClick={handleImportSelected}
                  >
                    {importing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                    Import to CRM
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-16">
                    <TableHead className="w-12 pl-8">
                      <Checkbox 
                        checked={selectedIds.length === scrapedLeads.length && scrapedLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Company</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Handle</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Platform</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Reach</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Propensity</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Intel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="h-24 border-slate-50 animate-pulse">
                        <TableCell colSpan={7} className="px-8"><div className="h-12 bg-slate-100 rounded-2xl w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : scrapedLeads.length > 0 ? (
                    scrapedLeads.map((lead) => {
                      const enriched = enrichedLeads[lead.id];
                      return (
                        <TableRow key={lead.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24">
                          <TableCell className="pl-8">
                            <Checkbox 
                              checked={selectedIds.includes(lead.id)}
                              onCheckedChange={() => toggleSelectRow(lead.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center font-black text-slate-400 group-hover:text-primary transition-colors">
                                {lead.companyName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 leading-none truncate max-w-[150px]">{lead.companyName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">{lead.niche}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium text-slate-500 text-sm">{lead.handle}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-50">
                              {lead.platform === 'instagram' ? <Instagram className="h-4 w-4 text-pink-600" /> : <Linkedin className="h-4 w-4 text-blue-600" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-900">{(lead.followers! / 1000).toFixed(1)}k</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Followers</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-7 rounded-lg bg-primary/5 text-primary font-black text-xs border border-primary/10">
                              {lead.score}
                            </div>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            {enriched ? (
                              <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[8px] uppercase">Enriched</Badge>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-lg font-bold text-[10px] uppercase text-slate-400 hover:text-primary"
                                onClick={() => setDetailLead(lead)}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                            <Search className="h-10 w-10 text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Idle</h3>
                            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Launch a search above to discover new brands across Instagram and LinkedIn.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        <aside className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {history.map((session) => (
                  <div key={session.id} className="p-5 space-y-2 hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-900 uppercase truncate pr-2">{session.query}</p>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-400">{session.platform}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{session.leadCount} Leads</span>
                      <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Lead Enrichment</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Enrichment uses AI to find corporate domains and contact patterns. Enriched leads convert **3.4x faster**.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Preview Side Drawer */}
      <AnimatePresence>
        {detailLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
              onClick={() => setDetailLead(null)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col border-l"
            >
              <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white border shadow-sm flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Lead Inspection</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">System Intelligence View</p>
                  </div>
                </div>
                <button className="rounded-full p-2 hover:bg-slate-100" onClick={() => setDetailLead(null)}><X className="h-5 w-5" /></button>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="space-y-10">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Source Profile</h4>
                    <div className="p-6 rounded-[2rem] border-2 border-slate-50 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-black text-slate-900">{detailLead.companyName}</p>
                          <p className="text-sm font-bold text-primary">{detailLead.handle}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                          {detailLead.platform === 'instagram' ? <Instagram className="h-5 w-5 text-pink-600" /> : <Linkedin className="h-5 w-5 text-blue-600" />}
                        </div>
                      </div>
                      <Separator />
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{detailLead.bio}"</p>
                    </div>
                  </section>

                  {enrichedLeads[detailLead.id] && (
                    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> Enriched Data
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Corporate Domain</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{enrichedLeads[detailLead.id].website}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Estimated Traffic</p>
                          <p className="text-xs font-bold text-slate-900">{enrichedLeads[detailLead.id].estimatedTraffic?.toLocaleString()} / mo</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 col-span-2">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Contact Strategy</p>
                          <p className="text-xs font-bold text-slate-900">Pattern: {enrichedLeads[detailLead.id].emailPattern}</p>
                        </div>
                      </div>
                    </section>
                  )}

                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                    <Info className="h-5 w-5 text-slate-400 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      This lead was identified using global search parameters. Accuracy is high but human verification is recommended before bulk import.
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-slate-50/50 grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold h-12"
                  onClick={() => setDetailLead(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="rounded-xl font-black h-12 shadow-xl shadow-primary/20"
                  onClick={() => {
                    toggleSelectRow(detailLead.id);
                    setDetailLead(null);
                  }}
                >
                  Add to Queue
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}