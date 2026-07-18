/**
 * @file auctions/page.tsx
 * @description Institutional Reverse Auction Terminal — backed by the real
 * proxy-bidding auction engine (`/api/auctions`, see `src/server/auction/*`).
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Gavel, Users, ShieldCheck, Zap, Loader2, ArrowRight, TrendingDown,
  History, Activity, Boxes, Globe, AlertTriangle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { auctionService, type Auction, type AuctionStatus } from '@/services/auction-service';

const CLOSED_STATUSES: AuctionStatus[] = ['ENDED', 'SETTLED', 'FAILED', 'CANCELLED'];

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function ReverseAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'live' | 'finality'>('live');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', currency: 'USD', startPrice: '', bidIncrement: '1', reservePrice: '', durationHours: '24' });
  const [, forceTick] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const load = (status?: AuctionStatus) => {
    setLoading(true);
    setError(null);
    auctionService
      .list(status ? { status } : {})
      .then((r) => setAuctions(r.items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(view === 'live' ? 'LIVE' : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Live countdown re-render for LIVE auctions.
  useEffect(() => {
    if (view !== 'live') return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [view]);

  const closedAuctions = view === 'finality' ? auctions.filter((a) => CLOSED_STATUSES.includes(a.status)) : auctions;

  const handleCreate = async () => {
    if (!form.title.trim() || !form.startPrice) return;
    setCreating(true);
    try {
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + Number(form.durationHours || '24') * 3_600_000).toISOString();
      await auctionService.create({
        title: form.title.trim(),
        currency: form.currency,
        startPrice: form.startPrice,
        bidIncrement: form.bidIncrement || '1',
        reservePrice: form.reservePrice || undefined,
        startsAt,
        endsAt,
        autoOpen: true,
      });
      toast({ title: 'Auction authorized', description: `"${form.title}" is now live.` });
      setCreateOpen(false);
      setForm({ title: '', currency: 'USD', startPrice: '', bidIncrement: '1', reservePrice: '', durationHours: '24' });
      load(view === 'live' ? 'LIVE' : undefined);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not authorize auction', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Bid Room Handshake...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-primary/5 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic node: AUCTION_COMMAND</p>
          </div>
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter leading-[0.8]">Dynamic <br />Discovery.</h2>
          <p className="text-xl text-muted-foreground font-medium italic max-w-2xl">Execute real-time competitive bidding sessions for high-volume institutional mandates.</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="h-12 px-6 border-2 font-black uppercase tracking-widest text-xs bg-background shadow-md"
            onClick={() => setView((v) => (v === 'live' ? 'finality' : 'live'))}
          >
            <History className="mr-3 h-4 w-4" /> {view === 'live' ? 'Finality Log' : 'Back to Live'}
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 bg-primary text-white font-black uppercase tracking-widest text-xs shadow-md hover:scale-[1.02] transition-all">
                <PlusIcon className="mr-3 h-4 w-4" /> Authorize New Auction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Authorize New Auction</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Mandate Title</Label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Q4 Copper Cathode Procurement" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase().slice(0, 3) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (hours)</Label>
                    <Input type="number" min="1" value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Price</Label>
                    <Input type="number" min="0" value={form.startPrice} onChange={(e) => setForm((f) => ({ ...f, startPrice: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bid Increment</Label>
                    <Input type="number" min="0.01" value={form.bidIncrement} onChange={(e) => setForm((f) => ({ ...f, bidIncrement: e.target.value }))} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Reserve Price (optional)</Label>
                    <Input type="number" min="0" value={form.reservePrice} onChange={(e) => setForm((f) => ({ ...f, reservePrice: e.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => void handleCreate()} disabled={creating || !form.title.trim() || !form.startPrice}>
                  {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authorizing…</> : 'Authorize'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* AUCTION KPIS — computed from real fetched auctions */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Live Bids', val: String(auctions.filter((a) => a.status === 'LIVE').reduce((sum, a) => sum + a.bidCount, 0)), icon: Zap, color: 'text-orange-600' },
          { label: 'Active Lots', val: String(auctions.filter((a) => a.status === 'LIVE').length), icon: Boxes, color: 'text-blue-600' },
          { label: 'Settled', val: String(auctions.filter((a) => a.status === 'SETTLED').length), icon: TrendingDown, color: 'text-emerald-600' },
          { label: 'Finality Rate', val: auctions.length ? `${Math.round((auctions.filter((a) => CLOSED_STATUSES.includes(a.status)).length / auctions.length) * 100)}%` : '—', icon: ShieldCheck, color: 'text-indigo-600' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="shadow-lg border-2 border-primary/5 bg-background rounded-3xl overflow-hidden group hover:border-primary/20 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-8 pt-8">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-wide">{stat.label}</CardTitle>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-2">
                <div className="text-3xl font-black tracking-tighter">{stat.val}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6">
        {closedAuctions.length === 0 && (
          <Card className="border-2 border-dashed rounded-2xl">
            <CardContent className="p-12 text-center text-muted-foreground font-medium">
              {view === 'live' ? 'No live auctions right now — authorize one above.' : 'No closed auctions yet.'}
            </CardContent>
          </Card>
        )}
        <AnimatePresence>
          {closedAuctions.map((auc, i) => (
            <motion.div key={auc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="shadow-2xl border-2 hover:border-primary/40 transition-all rounded-2xl overflow-hidden bg-background group">
                <CardContent className="p-0 flex flex-col lg:flex-row">
                  <div className="lg:w-96 bg-primary p-6 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                    <div className="space-y-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={cn('h-2 w-2 rounded-full', auc.status === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-white/40')} />
                        <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-black h-6 px-4 uppercase tracking-wide backdrop-blur-md">{auc.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Time Finality</p>
                        <p className="text-4xl font-black tabular-nums tracking-tighter leading-none">{auc.status === 'LIVE' ? timeLeft(auc.endsAt) : '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between space-y-8">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wide opacity-40">MANDATE: {auc.reference ?? auc.id.slice(0, 8)}</span>
                        <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-[0.9] group-hover:text-primary transition-colors">{auc.title}</h3>
                      </div>
                      <div className="flex gap-6 shrink-0 border-l-2 pl-12 border-muted/50">
                        <div className="text-right space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">{auc.bidCount > 0 ? 'Current Price' : 'Start Price'}</p>
                          <p className="text-4xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(Number(auc.currentPrice) || Number(auc.startPrice))}</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{auc.currency}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      {[
                        { label: 'Bids', val: `${auc.bidCount}`, icon: Users },
                        { label: 'Type', val: auc.type, icon: Boxes },
                        { label: 'Currency', val: auc.currency, icon: Globe },
                      ].map((stat) => (
                        <div key={stat.label} className="p-5 rounded-2xl border-2 bg-muted/5 group/stat hover:border-primary/20 transition-all cursor-default">
                          <div className="flex items-center gap-3 mb-2 opacity-40 group-hover/stat:opacity-100 transition-opacity">
                            <stat.icon className="h-4 w-4 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                          </div>
                          <p className="text-sm font-black uppercase tracking-tight text-foreground">{stat.val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end items-center gap-8 pt-8 border-t-2 border-muted/50">
                      <div className="flex gap-4">
                        <Button variant="outline" className="h-14 border-2 px-6 font-black uppercase text-[11px] tracking-widest bg-background group shadow-md" onClick={() => router.push(`${PATHS.AUCTIONS}/${auc.id}`)}>
                          <Activity className="mr-2 h-4 w-4 group-hover:rotate-45 transition-transform" /> AUDIT BID STREAM
                        </Button>
                        <Button className="h-14 px-6 font-black uppercase text-[11px] tracking-widest shadow-lg rounded-2xl bg-primary hover:scale-[1.05] transition-all" onClick={() => router.push(`${PATHS.AUCTIONS}/${auc.id}`)}>
                          ENTER COMMAND ROOM <ArrowRight className="ml-3 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
