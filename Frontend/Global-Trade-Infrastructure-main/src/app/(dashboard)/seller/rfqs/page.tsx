/**
 * @file seller/rfqs/page.tsx
 * @description Global Demand Signal Discovery node — real, backend-driven RFQ
 * marketplace for sellers (see `getMarketplaceRfqs`/`submitQuote`/`submitQuotesBatch`
 * in `rfq-service.ts`, all calling real trade-service endpoints).
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { rfqService, RFQ } from '@/services/rfq-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Filter, TrendingUp, Zap, Globe, Loader2, ArrowRight, Target,
  Activity, Boxes, Compass, Radio, SlidersHorizontal, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SellerMarketplaceDiscovery() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [bidTarget, setBidTarget] = useState<RFQ | null>(null);
  const [bidForm, setBidForm] = useState({ price: '', deliveryTime: '', message: '' });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchSelection, setBatchSelection] = useState<Set<string>>(new Set());
  const [batchForm, setBatchForm] = useState({ price: '', deliveryTime: '', message: '' });
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [topologyOpen, setTopologyOpen] = useState(false);
  const { toast } = useToast();

  const load = useCallback((cat?: string | null) => {
    setLoading(true);
    setError(null);
    rfqService
      .getMarketplaceRfqs({ category: cat ?? undefined })
      .then(setRfqs)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(category); }, [load, category]);

  const rescan = async () => {
    setRescanning(true);
    try {
      await rfqService.getMarketplaceRfqs({ category: category ?? undefined }).then(setRfqs);
      toast({ title: 'Network re-scanned', description: `${rfqs.length} open demand signals.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Re-scan failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRescanning(false);
    }
  };

  const filtered = rfqs.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase()),
  );

  const categories = useMemo(() => [...new Set(rfqs.map((r) => r.category).filter(Boolean))].sort(), [rfqs]);

  const submitBid = async () => {
    if (!bidTarget || !sellerName.trim() || !bidForm.price) return;
    setSubmittingBid(true);
    try {
      await rfqService.submitQuote({
        rfqId: bidTarget.id,
        sellerName: sellerName.trim(),
        price: Number(bidForm.price),
        deliveryTime: bidForm.deliveryTime,
        message: bidForm.message,
      });
      toast({ title: 'Bid submitted', description: `Your proposal for "${bidTarget.title}" was sent.` });
      setBidTarget(null);
      setBidForm({ price: '', deliveryTime: '', message: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Bid failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSubmittingBid(false);
    }
  };

  const toggleBatchSelection = (id: string) => {
    setBatchSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitBatch = async () => {
    if (!sellerName.trim() || !batchForm.price || batchSelection.size === 0) return;
    setSubmittingBatch(true);
    try {
      const result = await rfqService.submitQuotesBatch(
        [...batchSelection].map((rfqId) => ({
          rfqId,
          sellerName: sellerName.trim(),
          price: Number(batchForm.price),
          deliveryTime: batchForm.deliveryTime,
          message: batchForm.message,
        })),
      );
      toast({ title: 'Batch response executed', description: `${result.succeeded} submitted, ${result.failed} failed.` });
      setBatchOpen(false);
      setBatchSelection(new Set());
      setBatchForm({ price: '', deliveryTime: '', message: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Batch response failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSubmittingBatch(false);
    }
  };

  const countryBreakdown = Object.entries(
    rfqs.reduce<Record<string, number>>((acc, r) => {
      const key = r.deliveryCountry || r.buyer.country || 'Unspecified';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Exchange Handshake...</p>
      </div>
    );
  }

  return (
    <main className="space-y-8 pb-24">
      {/* DISCOVERY HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-primary/5 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-widest text-primary">Discovery Node: GLOBAL_DEMAND_ALPHA</p>
          </div>
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter leading-[0.8]">Demand <br />Signals.</h2>
          <p className="text-xl text-muted-foreground font-medium italic max-w-2xl leading-relaxed">
            "Absorb institutional trade requirements and respond with cryptographically secure commercial proposals."
          </p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-3 px-6 py-3 bg-background rounded-2xl border-2 border-primary/5 shadow-xl text-xs font-black uppercase tracking-widest text-primary">
              <Radio className="h-4 w-4 text-emerald-600 animate-ping" />
              Real-time Pulse Active
           </div>
           <Button variant="outline" className="h-12 px-6 border-2 font-black uppercase tracking-widest text-xs bg-background shadow-md group" onClick={() => void rescan()} disabled={rescanning}>
              {rescanning ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <Compass className="mr-3 h-4 w-4 group-hover:rotate-45 transition-transform" />} Re-Scan Network
           </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* DISCOVERY GRID */}
        <div className="lg:col-span-8 space-y-6">
           {/* SEARCH ORCHESTRATOR */}
           <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground opacity-30" />
                 <input
                   placeholder="Resolve institutional demand, commodity signatures, or node IDs..."
                   className="w-full h-12 pl-14 pr-6 bg-background border-2 rounded-2xl text-lg font-black tracking-tight shadow-inner focus:outline-none focus:border-primary/20 transition-all"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <div className="flex gap-3">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="outline" className="h-12 border-2 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md bg-background">
                          <Filter className="mr-2 h-4 w-4" /> {category ?? 'All Sectors'}
                          <ChevronDown className="ml-2 h-3 w-3 opacity-40" />
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuLabel>Filter by Sector</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={() => setCategory(null)}>All Sectors</DropdownMenuItem>
                       {categories.map((c) => (
                          <DropdownMenuItem key={c} onClick={() => setCategory(c)}>{c}</DropdownMenuItem>
                       ))}
                    </DropdownMenuContent>
                 </DropdownMenu>
                 <Button
                    variant="outline"
                    className="h-12 border-2 px-6 rounded-2xl shadow-md bg-background font-black text-[10px] uppercase tracking-widest"
                    disabled={batchSelection.size === 0}
                    onClick={() => setBatchOpen(true)}
                 >
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Batch ({batchSelection.size})
                 </Button>
              </div>
           </div>

           {filtered.length === 0 && (
              <Card className="border-2 border-dashed rounded-2xl">
                 <CardContent className="p-12 text-center text-muted-foreground font-medium">
                    {search || category ? 'No open demand signals match your filters.' : 'No open demand signals right now.'}
                 </CardContent>
              </Card>
           )}

           <div className="grid gap-8">
              <AnimatePresence>
                 {filtered.map((rfq, i) => (
                    <motion.div
                      key={rfq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                       <Card className={cn('shadow-2xl border-2 hover:border-primary/40 transition-all group overflow-hidden bg-background rounded-2xl', batchSelection.has(rfq.id) && 'border-primary')}>
                          <CardContent className="p-0 flex flex-col md:flex-row">
                             <div className="flex items-center justify-center px-4 border-r-2 border-muted/30">
                                <Checkbox checked={batchSelection.has(rfq.id)} onCheckedChange={() => toggleBatchSelection(rfq.id)} />
                             </div>
                             <div className="md:w-3 bg-primary shrink-0 transition-all duration-700 group-hover:bg-indigo-600" />
                             <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-6 flex-1 min-w-0">
                                   <div className="flex items-center gap-4">
                                      <Badge className="bg-emerald-600 text-white text-[9px] font-black h-6 px-3 border-none shadow-sm uppercase tracking-widest">ACTIVE_DEMAND</Badge>
                                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">LEDGER_REF: {rfq.rfq_id}</span>
                                   </div>
                                   <div className="space-y-2">
                                      <h3 className="text-3xl font-black uppercase tracking-tighter leading-[0.9] text-foreground group-hover:text-primary transition-colors">
                                         {rfq.title}
                                      </h3>
                                      <p className="text-base text-muted-foreground font-medium italic leading-relaxed max-w-xl">"Requirement for {rfq.category} tier artifacts. Target finality: {rfq.quantity.value} {rfq.quantity.unit}."</p>
                                   </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0 border-l-2 pl-12 border-muted/50 space-y-6">
                                   <div className="text-right space-y-1">
                                      <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40 leading-none">Target Unit Price</p>
                                      <p className="text-4xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(rfq.pricing.target_price)}</p>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{rfq.pricing.currency} PER UNIT ({rfq.pricing.pricing_model})</p>
                                   </div>
                                   <Button className="h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl rounded-2xl bg-primary" onClick={() => setBidTarget(rfq)}>
                                      INITIATE BID
                                   </Button>
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>

        {/* SIDEBAR: MARKET INTELLIGENCE */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="shadow-none border-2 bg-background p-6 space-y-8 rounded-2xl">
              <div className="flex items-center justify-between">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ecosystem Pulse</h4>
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="p-4 rounded-3xl bg-muted border-2 shadow-inner"><Boxes className="h-6 w-6 text-blue-500" /></div>
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Open Signals</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-foreground">{rfqs.length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="p-4 rounded-3xl bg-muted border-2 shadow-inner"><TrendingUp className="h-6 w-6 text-emerald-500" /></div>
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Sectors Active</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-foreground">{categories.length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="p-4 rounded-3xl bg-muted border-2 shadow-inner"><ShieldCheck className="h-6 w-6 text-indigo-500" /></div>
                       <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Selected for Batch</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-foreground">{batchSelection.size}</span>
                 </div>
              </div>
           </Card>

           <Card className="shadow-none border-2 bg-background p-6 text-center space-y-8 rounded-2xl border-dashed group hover:border-primary/20 transition-all duration-700">
              <Globe className="h-12 w-16 mx-auto text-muted-foreground opacity-10 group-hover:text-primary group-hover:opacity-30 transition-all duration-1000 group-hover:rotate-45" />
              <div className="space-y-3">
                 <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">Ecosystem Finality</p>
                 <p className="text-xs font-medium italic leading-relaxed px-4 opacity-60">
                    Real-time breakdown of open demand across jurisdictions and sectors currently visible to your organization.
                 </p>
              </div>
              <Button variant="outline" className="w-full h-12 border-2 font-black uppercase text-[9px] tracking-wide bg-background" onClick={() => setTopologyOpen(true)}>AUDIT NETWORK TOPOLOGY</Button>
           </Card>
        </div>
      </div>

      {/* BID DIALOG */}
      <Dialog open={!!bidTarget} onOpenChange={(open) => !open && setBidTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bid: {bidTarget?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Your Company Name</Label>
              <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Apex Manufacturing Co." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ({bidTarget?.pricing.currency ?? 'USD'})</Label>
                <Input type="number" min="0" value={bidForm.price} onChange={(e) => setBidForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Delivery Time</Label>
                <Input value={bidForm.deliveryTime} onChange={(e) => setBidForm((f) => ({ ...f, deliveryTime: e.target.value }))} placeholder="14 days" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={bidForm.message} onChange={(e) => setBidForm((f) => ({ ...f, message: e.target.value }))} placeholder="Terms, certifications, or notes for the buyer." />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void submitBid()} disabled={submittingBid || !sellerName.trim() || !bidForm.price}>
              {submittingBid ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : 'Submit Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BATCH RESPONSE DIALOG */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Execute Batch Response ({batchSelection.size} RFQs)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">The same price, delivery time, and message will be submitted to every selected RFQ.</p>
            <div className="space-y-2">
              <Label>Your Company Name</Label>
              <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Apex Manufacturing Co." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (per unit)</Label>
                <Input type="number" min="0" value={batchForm.price} onChange={(e) => setBatchForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Delivery Time</Label>
                <Input value={batchForm.deliveryTime} onChange={(e) => setBatchForm((f) => ({ ...f, deliveryTime: e.target.value }))} placeholder="14 days" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={batchForm.message} onChange={(e) => setBatchForm((f) => ({ ...f, message: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void submitBatch()} disabled={submittingBatch || !sellerName.trim() || !batchForm.price}>
              {submittingBatch ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing…</> : `Submit to ${batchSelection.size} RFQs`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NETWORK TOPOLOGY DIALOG */}
      <Dialog open={topologyOpen} onOpenChange={setTopologyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Network Topology Audit</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-xl bg-muted/40">
                <p className="text-2xl font-black">{rfqs.length}</p>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Open Signals</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40">
                <p className="text-2xl font-black">{countryBreakdown.length}</p>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Jurisdictions</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">By Jurisdiction</p>
              {countryBreakdown.slice(0, 8).map(([c, count]) => (
                <div key={c} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="font-medium">{c}</span>
                  <span className="font-black tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
