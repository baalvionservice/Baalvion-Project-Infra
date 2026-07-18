
/**
 * @file credit-lines/page.tsx
 * @description Institutional Credit Management and syndicated trade finance oversight.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { tradeFinanceService, LetterOfCredit, InvoiceFinancing } from '@/services/trade-finance-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Landmark,
  TrendingUp,
  ShieldCheck,
  Activity,
  Loader2,
  Zap,
  ArrowRight,
  Plus,
  Lock,
  Calculator,
  History,
  FileKey
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

type Instrument =
  | { kind: 'LC'; id: string; refId: string; label: string; value: number; status: string; counterparty: string; raw: LetterOfCredit }
  | { kind: 'INVOICE'; id: string; refId: string; label: string; value: number; status: string; counterparty: string; raw: InvoiceFinancing };

export default function CreditLinesPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [selected, setSelected] = useState<Instrument | null>(null);
  const [twoKeyOpen, setTwoKeyOpen] = useState(false);

  const loadAll = useCallback(async () => {
    const [creditStats, book] = await Promise.all([
      tradeFinanceService.getCreditLineStats().catch(() => ({ totalLimit: 0, utilized: 0, available: 0, activeLcs: 0, avgRate: 0 })),
      tradeFinanceService.getBankInstruments().catch(() => ({ lettersOfCredit: [] as LetterOfCredit[], invoiceFinancing: [] as InvoiceFinancing[] })),
    ]);
    setStats(creditStats);
    setInstruments([
      ...book.lettersOfCredit.map((lc): Instrument => ({
        kind: 'LC', id: lc.id, refId: lc.lc_id, label: 'Letter of Credit', value: lc.amount,
        status: lc.status, counterparty: lc.sellerId, raw: lc,
      })),
      ...book.invoiceFinancing.map((inv): Instrument => ({
        kind: 'INVOICE', id: inv.id, refId: inv.finance_id, label: 'Invoice Financing', value: inv.amount,
        status: inv.status, counterparty: inv.companyId, raw: inv,
      })),
    ]);
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  async function reEvaluateLimits() {
    setReEvaluating(true);
    try {
      await loadAll();
      toast({ title: 'Limits re-evaluated', description: 'Credit facility recalculated from the live instrument book.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Re-evaluation failed', description: e instanceof Error ? e.message : 'Could not reach trade-finance-service.' });
    } finally {
      setReEvaluating(false);
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center opacity-20"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="space-y-8 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-primary/5 pb-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Capital Provisioning</p>
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter">Trade Finance Node</h2>
          <p className="text-muted-foreground font-medium italic">Manage syndicated credit lines, LC/BG issuance, and institutional liquidity thresholds.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" onClick={reEvaluateLimits} disabled={reEvaluating} className="font-black border-2 bg-background h-14 px-8 text-[10px] uppercase tracking-widest shadow-md">
              {reEvaluating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />} RE-EVALUATE LIMITS
           </Button>
           <IssueLcDialog onIssued={loadAll} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
           {/* CREDIT UTILIZATION MATRIX */}
           <Card className="shadow-2xl border-none bg-primary text-primary-foreground rounded-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 scale-125 group-hover:scale-150 transition-transform duration-1000">
                 <Landmark className="h-64 w-64 brightness-0 invert" />
              </div>
              <CardHeader className="bg-white/5 border-b border-white/10 p-6 relative">
                 <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <CardTitle className="text-4xl font-black uppercase tracking-tighter">Sovereign Line A</CardTitle>
                       <p className="text-[10px] font-black uppercase tracking-wide opacity-60">Financier: JPMorgan Chase Node</p>
                    </div>
                    <Badge className="bg-emerald-500 text-emerald-950 text-[10px] font-black h-7 px-4 rounded-full border-none shadow-xl">ACTIVE_SECURED</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8 relative">
                 <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <p className="text-[11px] font-black uppercase tracking-wide opacity-60">Aggregate Limit</p>
                       <p className="text-4xl font-black tracking-tighter">{formatCurrency(stats.totalLimit)}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-black uppercase tracking-wide opacity-60">Utilization Weight</p>
                       <p className="text-4xl font-black text-indigo-300 tracking-tighter">{stats.totalLimit ? Math.round((stats.utilized / stats.totalLimit) * 100) : 0}%</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="opacity-60">Liquidity Depth</span>
                       <span className="text-emerald-400">{formatCurrency(stats.available)} Available</span>
                    </div>
                    <Progress value={stats.totalLimit ? Math.round((stats.utilized / stats.totalLimit) * 100) : 0} className="h-2 bg-white/10 shadow-inner" />
                 </div>

                 <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                    <div className="text-center space-y-1">
                       <p className="text-[9px] font-black uppercase opacity-40">Active LCs</p>
                       <p className="text-xl font-black">{stats.activeLcs}</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-white/10">
                       <p className="text-[9px] font-black uppercase opacity-40">Cost of Capital</p>
                       <p className="text-xl font-black">{stats.avgRate}%</p>
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-[9px] font-black uppercase opacity-40">Finality Sync</p>
                       <p className="text-xl font-black text-emerald-400">100%</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* INSTRUMENT HISTORY */}
           <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/10 border-b py-8 px-6">
                 <CardTitle className="text-sm font-black uppercase tracking-wide">Active Finance Instruments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y-2">
                    {instruments.length === 0 ? (
                       <div className="py-16 text-center opacity-30 italic text-sm">No active finance instruments.</div>
                    ) : (
                       instruments.map(inst => (
                          <button
                             key={`${inst.kind}-${inst.id}`}
                             type="button"
                             onClick={() => setSelected(inst)}
                             className="w-full text-left p-8 flex items-center justify-between group hover:bg-primary/[0.03] transition-colors cursor-pointer"
                          >
                             <div className="flex items-center gap-6">
                                <div className="h-12 w-12 rounded-2xl bg-muted border-2 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform"><FileKey className="h-6 w-6 text-primary opacity-60" /></div>
                                <div className="space-y-1">
                                   <p className="font-black text-lg uppercase tracking-tight leading-none">{inst.label}</p>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">ID: {inst.refId} • {inst.counterparty || '—'}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <span className="font-black text-base">{formatCurrency(inst.value)}</span>
                                <Badge variant="outline" className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-2 border-emerald-200 px-3 h-6 rounded-full">{inst.status}</Badge>
                                <ArrowRight className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                             </div>
                          </button>
                       ))
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
           {/* RISK ORACLE */}
           <Card className="shadow-none border-2 bg-background p-6 space-y-6 rounded-2xl">
              <div className="flex items-center justify-between">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Finance Intelligence</h4>
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-8">
                 <p className="text-sm font-bold italic leading-relaxed opacity-80 text-center">
                    "Treasury Pulse: Global interest rate volatility is trending +14% for USD corridors. Suggest accelerating high-value LC issuance to lock current preferential rates."
                 </p>
                 <div className="space-y-6">
                    {[
                      { label: 'Default Probability', val: '0.02%', status: 'Minimal' },
                      { label: 'Settlement Stress', val: 'Low', status: 'Stable' }
                    ].map(stat => (
                       <div key={stat.label} className="flex justify-between items-center group cursor-default">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                          <span className="text-xl font-black tracking-tighter group-hover:scale-110 transition-transform">{stat.val}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </Card>

           <button
              type="button"
              onClick={() => setTwoKeyOpen(true)}
              className="w-full shadow-none border-2 bg-background p-6 text-center space-y-6 rounded-2xl border-dashed group hover:border-primary/20 transition-all cursor-pointer"
           >
              <ShieldCheck className="h-14 w-14 mx-auto text-muted-foreground opacity-20 group-hover:text-primary transition-all duration-500" />
              <div className="space-y-2">
                 <p className="text-sm font-black uppercase tracking-widest">Two-Key Finality</p>
                 <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed px-4">
                    "Trade finance issuance requires cryptographical sign-off from both Buyer Treasury and Advising Bank. Mandatory forensic audit applied to all $1M+ instruments."
                 </p>
              </div>
           </button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selected?.label} — {selected?.refId}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Status</span><Badge variant="outline" className="uppercase">{selected.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Value</span><span className="font-black">{formatCurrency(selected.value)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Counterparty</span><span className="font-bold">{selected.counterparty || '—'}</span></div>
              {selected.kind === 'LC' ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Issuing Bank</span><span className="font-bold">{selected.raw.issuingBankId || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Expiry</span><span className="font-bold">{new Date(selected.raw.expiryDate).toLocaleDateString()}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Invoice</span><span className="font-bold">{selected.raw.invoiceId}</span></div>
                  {selected.raw.feeRate ? <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Fee Rate</span><span className="font-bold">{selected.raw.feeRate}%</span></div> : null}
                </>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={twoKeyOpen} onOpenChange={setTwoKeyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Two-Key Finality — Dual Authorization Ledger</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-96 overflow-y-auto">
            {instruments.filter((i) => i.kind === 'LC').length === 0 ? (
              <p className="text-sm italic opacity-50 text-center py-8">No Letters of Credit require dual sign-off yet.</p>
            ) : (
              instruments.filter((i): i is Extract<Instrument, { kind: 'LC' }> => i.kind === 'LC').map((lc) => {
                const key1 = !!lc.raw.issuingBankId || lc.status !== 'PENDING';
                const key2 = ['ADVISED', 'ACCEPTED', 'PAID'].includes(lc.status);
                return (
                  <div key={lc.id} className="p-4 rounded-xl border-2 flex items-center justify-between">
                    <div>
                      <p className="font-black text-sm">{lc.refId}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{formatCurrency(lc.value)} • {lc.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={cn('text-[9px] font-black', key1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted')}>ISSUING BANK {key1 ? '✓' : '—'}</Badge>
                      <Badge variant="outline" className={cn('text-[9px] font-black', key2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted')}>ADVISING BANK {key2 ? '✓' : '—'}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTwoKeyOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function IssueLcDialog({ onIssued }: { onIssued: () => Promise<void> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buyerId, setBuyerId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');

  const valid = buyerId.trim() && sellerId.trim() && Number(amount) > 0;

  async function submit() {
    setSubmitting(true);
    try {
      await tradeFinanceService.requestLC({ buyerId: buyerId.trim(), sellerId: sellerId.trim(), amount: Number(amount), currency });
      toast({ title: 'Letter of Credit issued', description: 'The instrument is now live on the trade-finance ledger.' });
      setOpen(false);
      setBuyerId(''); setSellerId(''); setAmount('');
      await onIssued();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Issuance failed', description: e instanceof Error ? e.message : 'trade-finance-service rejected the request.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-black shadow-2xl h-14 px-6 text-[10px] uppercase tracking-widest bg-primary">
          <Plus className="mr-2 h-4 w-4" /> ISSUE LETTER OF CREDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Issue Letter of Credit</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Applicant (Buyer)</Label>
            <Input value={buyerId} onChange={(e) => setBuyerId(e.target.value)} placeholder="Buyer entity name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Beneficiary (Seller)</Label>
            <Input value={sellerId} onChange={(e) => setSellerId(e.target.value)} placeholder="Seller entity name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="850000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !valid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Issue LC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
