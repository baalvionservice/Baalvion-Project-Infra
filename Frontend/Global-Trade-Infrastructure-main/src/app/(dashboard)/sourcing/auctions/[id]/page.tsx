'use client';

/**
 * @file auctions/[id]/page.tsx
 * @description Institutional Reverse Auction Bid Room — backed by the real
 * proxy-bidding auction engine (`/api/auctions/:id`, `/bids`, `/actions`).
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Gavel, Timer, Users, ShieldCheck, Zap, Loader2, ChevronLeft,
  Activity, History, ArrowRight, AlertTriangle, Lock,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { auctionService, type Auction, type AuctionBid } from '@/services/auction-service';

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function AuctionBidRoomPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { toast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [, forceTick] = useState(0);

  const load = useCallback(() => {
    Promise.all([auctionService.get(id), auctionService.listBids(id)])
      .then(([a, b]) => {
        setAuction(a);
        setBids(b.items);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll every 5s while the auction is live so competing bids show up without a manual refresh.
  useEffect(() => {
    if (auction?.status !== 'LIVE') return;
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [auction?.status, load]);

  useEffect(() => {
    if (auction?.status !== 'LIVE') return;
    const tick = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(tick);
  }, [auction?.status]);

  const placeBid = async () => {
    if (!auction || !bidAmount) return;
    setPlacingBid(true);
    try {
      await auctionService.placeBid(id, bidAmount);
      setBidAmount('');
      toast({ title: 'Bid accepted' });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Bid rejected', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setPlacingBid(false);
    }
  };

  const terminate = async () => {
    setTerminating(true);
    try {
      await auctionService.transition(id, 'cancel', 'Terminated by operator');
      toast({ title: 'Auction terminated' });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not terminate', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTerminating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Bid Node...</p>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-bold text-muted-foreground">{error ?? 'Auction not found.'}</p>
        <Button variant="outline" onClick={() => router.push(PATHS.AUCTIONS)}>Back to Auctions</Button>
      </div>
    );
  }

  const minNextBid = auction.bidCount === 0 ? Number(auction.startPrice) : Number(auction.currentPrice) + Number(auction.bidIncrement);
  const uniqueBidders = new Set(bids.map((b) => b.bidderActorId)).size;

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(PATHS.AUCTIONS)} className="-ml-4 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Auctions
          </Button>
          <div className="flex items-center gap-5">
            <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter text-foreground">Auction Room</h2>
            <Badge variant="outline" className={cn('uppercase font-black text-[10px] px-4 py-1.5 border-2 rounded-full shadow-sm', auction.status === 'LIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' : 'bg-muted text-muted-foreground')}>
              {auction.status}: {id.slice(0, 8)}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium italic max-w-2xl">Mandate: <span className="font-bold text-foreground">{auction.title}</span></p>
        </div>

        {auction.status === 'LIVE' && (
          <div className="flex gap-4">
            <Button variant="destructive" onClick={() => void terminate()} disabled={terminating} className="font-black h-12 px-8 text-[10px] uppercase tracking-widest shadow-2xl rounded-2xl">
              {terminating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />} Terminate Room
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-2xl border-none bg-primary text-white relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 scale-125">
              <Timer className="h-64 w-64 brightness-0 invert" />
            </div>
            <CardContent className="p-16 relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest opacity-60">Auction Finality Window</p>
                <p className="text-4xl font-black tabular-nums tracking-tighter">{auction.status === 'LIVE' ? timeLeft(auction.endsAt) : '00:00:00'}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-20 w-full max-w-2xl">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">{auction.bidCount > 0 ? 'Current Price' : 'Start Price'}</p>
                  <p className="text-4xl font-black text-emerald-400 tracking-tighter">{formatCurrency(Number(auction.currentPrice) || Number(auction.startPrice))}</p>
                  <p className="text-[8px] font-bold opacity-40 uppercase">{auction.currency}</p>
                </div>
                <div className="space-y-1 border-l border-white/10 pl-10">
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Bids</p>
                  <p className="text-4xl font-black text-indigo-300 tracking-tighter">{auction.bidCount}</p>
                  <p className="text-[8px] font-bold opacity-40 uppercase">{uniqueBidders} unique bidders</p>
                </div>
              </div>

              {auction.status === 'LIVE' && (
                <div className="w-full max-w-xl space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      min={minNextBid}
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Min ${formatCurrency(minNextBid)}`}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    <Button onClick={() => void placeBid()} disabled={placingBid || !bidAmount} className="h-12 px-8 bg-white text-primary hover:bg-white/90 font-black uppercase text-xs">
                      {placingBid ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gavel className="mr-2 h-4 w-4" /> Place Bid</>}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/10 border-b py-8 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wide">Real-Time Bid Stream</CardTitle>
              <Activity className="h-5 w-5 text-primary opacity-30 animate-pulse" />
            </CardHeader>
            <CardContent className="p-0">
              {bids.length === 0 ? (
                <p className="p-8 text-sm text-muted-foreground font-medium text-center">No bids placed yet.</p>
              ) : (
                <div className="divide-y-2">
                  <AnimatePresence initial={false}>
                    {bids.map((bid) => (
                      <motion.div key={bid.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-8 flex items-center justify-between group hover:bg-primary/[0.01] transition-colors">
                        <div className="flex items-center gap-8">
                          <div className="h-12 w-12 rounded-2xl bg-muted border-2 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <Gavel className="h-6 w-6 text-primary opacity-60" />
                          </div>
                          <div className="space-y-1.5">
                            <p className="font-black text-lg uppercase tracking-tighter leading-none">Bidder {bid.bidderActorId}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Bid #{bid.sequence} • {new Date(bid.placedAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-foreground tracking-tighter">{formatCurrency(Number(bid.amount))}</p>
                          <Badge className={cn('text-[8px] font-black uppercase border-none px-2 h-5 mt-1', bid.status === 'WINNING' || bid.status === 'WON' ? 'bg-emerald-500 text-emerald-950' : 'bg-muted text-muted-foreground')}>{bid.status}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-2xl border-none bg-primary text-primary-foreground relative overflow-hidden group rounded-2xl">
            <CardHeader className="pb-4 relative border-b border-white/10 px-6 py-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-4 text-white">
                <Users className="h-5 w-5 text-white" /> Participation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 shadow-inner">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Unique Bidders</span>
                  <span className="text-sm font-black uppercase text-emerald-300">{uniqueBidders}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 shadow-inner">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Bids</span>
                  <span className="text-sm font-black uppercase">{auction.bidCount}</span>
                </div>
                {auction.reservePrice && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 shadow-inner">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Reserve</span>
                    <span className="text-sm font-black uppercase">{formatCurrency(Number(auction.reservePrice))}</span>
                  </div>
                )}
              </div>
              {auction.status === 'LIVE' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="opacity-60">Bid Pressure</span>
                    <span className="text-emerald-400 flex items-center gap-2"><Zap className="h-3 w-3" /> {auction.bidCount > 5 ? 'High' : auction.bidCount > 0 ? 'Building' : 'Awaiting first bid'}</span>
                  </div>
                  <Progress value={Math.min(100, auction.bidCount * 10)} className="h-1.5 bg-white/10" />
                </div>
              )}
            </CardContent>
          </Card>

          {auction.status !== 'LIVE' && (
            <Card className="shadow-none border-2 bg-background p-6 space-y-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Outcome</h4>
              </div>
              {auction.winnerActorId ? (
                <p className="text-sm font-bold">Won by bidder {auction.winnerActorId} at {formatCurrency(Number(auction.winningAmount))}.</p>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">No qualifying winner — auction closed with {auction.bidCount} bid(s).</p>
              )}
            </Card>
          )}

          <Card className="shadow-none border-2 bg-background p-6 space-y-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-primary" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Bid Increment</h4>
            </div>
            <p className="text-sm font-bold">Next bid must be at least <span className="text-primary">{formatCurrency(minNextBid)}</span>, rising in {formatCurrency(Number(auction.bidIncrement))} steps.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
