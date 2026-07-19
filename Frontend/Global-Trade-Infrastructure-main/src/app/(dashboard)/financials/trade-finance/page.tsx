/**
 * @file trade-finance/page.tsx
 * @description TRADE FINANCE OPERATIONS HUB.
 * Manages bank-grade instruments: Letters of Credit, Invoice Financing, and Underwriting.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { tradeFinanceService as realTradeFinanceService, LetterOfCredit, InvoiceFinancing } from '@/services/trade-finance-service';
import { underwritingService } from '@/modules/financials/services/underwriting.service';
import { resolveSessionOrgId } from '@/services/session-org';
import { TradeFinanceInstrument, CreditProfile } from '@/modules/financials/types/financial.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Landmark,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  Loader2,
  ArrowRight,
  TrendingUp,
  Scale,
  Plus,
  BarChart3,
  History,
  Lock,
  Landmark as BankIcon
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LC_STATUS_MAP: Record<LetterOfCredit['status'], TradeFinanceInstrument['status']> = {
  PENDING: 'PENDING_BANK_APPROVAL', ISSUED: 'ISSUED', ADVISED: 'ADVISED',
  ACCEPTED: 'ACCEPTED', PAID: 'REPAID', EXPIRED: 'EXPIRED',
};
const INVOICE_STATUS_MAP: Record<InvoiceFinancing['status'], TradeFinanceInstrument['status']> = {
  PENDING: 'PENDING_BANK_APPROVAL', APPROVED: 'ISSUED', FUNDED: 'UTILIZED', REPAID: 'REPAID',
};

function lcToInstrument(lc: LetterOfCredit): TradeFinanceInstrument {
  return {
    id: lc.id, type: 'LETTER_OF_CREDIT', referenceId: lc.lc_id, amount: lc.amount, currency: lc.currency as any,
    status: LC_STATUS_MAP[lc.status], issuingInstitutionId: lc.issuingBankId, beneficiaryId: lc.sellerId,
    expiryDate: lc.expiryDate, collateralRefs: [], createdAt: lc.createdAt, updatedAt: lc.createdAt,
  };
}

function invoiceToInstrument(inv: InvoiceFinancing): TradeFinanceInstrument {
  return {
    id: inv.id, type: 'INVOICE_FINANCE', referenceId: inv.finance_id, amount: inv.amount, currency: 'USD',
    status: INVOICE_STATUS_MAP[inv.status], issuingInstitutionId: inv.financierId, beneficiaryId: inv.companyId,
    expiryDate: '', interestRate: inv.feeRate, collateralRefs: [], createdAt: '', updatedAt: '',
  };
}

export default function TradeFinanceOperationsPage() {
  const [instruments, setInstruments] = useState<TradeFinanceInstrument[]>([]);
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSession, setNoSession] = useState(false);
  const [selected, setSelected] = useState<TradeFinanceInstrument | null>(null);
  const [sagaOpen, setSagaOpen] = useState(false);

  const loadInstruments = useCallback(async () => {
    const book = await realTradeFinanceService.getBankInstruments();
    setInstruments([
      ...book.lettersOfCredit.map(lcToInstrument),
      ...book.invoiceFinancing.map(invoiceToInstrument),
    ]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const orgId = await resolveSessionOrgId();
      if (!orgId) {
        setNoSession(true);
        setLoading(false);
        return;
      }
      await Promise.all([
        loadInstruments(),
        underwritingService.calculateCreditProfile(orgId).then(setProfile),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [loadInstruments]);

  if (noSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 bg-background">
        <Lock className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sign in to view trade finance instruments.</p>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Finance Handshake...</p>
      </div>
    );
  }

  return (
    <main className="space-y-8 pb-24">
      {/* OPERATIONS HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-widest text-primary">Authority Node: FINANCE_OPS_HUB</p>
          </div>
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter leading-[0.8]">Trade <br />Finance.</h2>
        </div>
        <div className="flex gap-4">
          <FinalityLogDialog
             title="Trade Finance Finality Log"
             instruments={instruments}
             trigger={
               <Button variant="outline" className="h-12 px-6 border-2 font-black uppercase tracking-widest text-xs bg-background shadow-md">
                 <History className="mr-3 h-4 w-4" /> Finality Log
               </Button>
             }
          />
          <RequestInstrumentDialog open={sagaOpen} onOpenChange={setSagaOpen} onRequested={loadInstruments} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
           {/* CREDIT UNDERWRITING MATRIX */}
           <Card className="shadow-2xl border-none bg-primary text-primary-foreground relative overflow-hidden group rounded-2xl">
              <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12 scale-125 group-hover:scale-150 transition-transform duration-1000">
                 <Scale className="h-80 w-80 brightness-0 invert" />
              </div>
              <CardHeader className="pb-6 border-b border-white/10 relative p-6">
                 <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <CardTitle className="text-3xl font-black uppercase tracking-tighter">Institutional Credit Profile</CardTitle>
                       <p className="text-white/60 font-medium italic mt-2 uppercase text-xs tracking-widest">Global Underwriting Node: ALPHA_V4</p>
                    </div>
                    <Badge className="bg-emerald-400 text-emerald-950 text-[10px] font-black h-7 px-4 rounded-full border-none shadow-xl">RATING: {profile.rating}</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-6 relative space-y-8">
                 <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <p className="text-[11px] font-black uppercase tracking-wide opacity-60">Aggregate Limit</p>
                       <p className="text-4xl font-black tracking-tighter">{formatCurrency(profile.totalLimit)}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-black uppercase tracking-wide opacity-60">Available Credit</p>
                       <p className="text-4xl font-black text-emerald-400 tracking-tighter">{formatCurrency(profile.availableCredit)}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-black uppercase tracking-wide opacity-60">Utilized Weight</p>
                       <p className="text-4xl font-black text-blue-300 tracking-tighter">{Math.round((profile.utilizedAmount / profile.totalLimit) * 100)}%</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="opacity-60">Liquidity Absorption</span>
                       <span className="text-emerald-400">OPTIMAL</span>
                    </div>
                    <Progress value={(profile.utilizedAmount / profile.totalLimit) * 100} className="h-2 bg-white/10 shadow-inner" />
                 </div>

                 <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                    <div className="text-center space-y-1">
                       <p className="text-[9px] font-black uppercase opacity-40">Default Prob.</p>
                       <p className="text-xl font-black">{profile.delinquencyProb}%</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-white/10">
                       <p className="text-[9px] font-black uppercase opacity-40">Audit Score</p>
                       <p className="text-xl font-black">{profile.score}/1000</p>
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-[9px] font-black uppercase opacity-40">Finality Sync</p>
                       <p className="text-xl font-black text-emerald-400">LOCKED</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* INSTRUMENT REGISTRY */}
           <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Active Finance Instruments</CardTitle>
                  <CardDescription className="text-xs font-medium">Authoritative record of issued Letters of Credit and Financing Mandates.</CardDescription>
                </div>
                <FileText className="h-6 w-6 text-primary opacity-30" />
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y-2">
                    {instruments.length === 0 ? (
                       <div className="py-20 text-center opacity-30 italic text-sm">No active trade instruments provisioned in this cycle.</div>
                    ) : (
                       instruments.map(inst => (
                          <div key={inst.id} onClick={() => setSelected(inst)} className="p-6 flex items-center justify-between group hover:bg-primary/[0.01] transition-colors cursor-pointer">
                             <div className="flex items-center gap-8">
                                <div className="h-12 w-16 rounded-2xl bg-muted border-2 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                   <BankIcon className="h-8 w-8 text-primary opacity-60" />
                                </div>
                                <div className="space-y-1.5">
                                   <p className="font-black text-xl uppercase tracking-tighter leading-none">{inst.type.replace(/_/g, ' ')}</p>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID: {inst.id} • Expiry: {new Date(inst.expiryDate).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-6 shrink-0 border-l-2 pl-12 border-muted/50">
                                <div className="text-right space-y-1">
                                   <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Instrument Value</p>
                                   <p className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(inst.amount, inst.currency)}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border-2 opacity-20 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); setSelected(inst); }}>
                                   <ArrowRight className="h-6 w-6" />
                                </Button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* FINANCIAL INTELLIGENCE SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="shadow-2xl border-none bg-primary text-primary-foreground relative overflow-hidden group rounded-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 scale-125 group-hover:scale-150 transition-transform duration-1000">
                 <Zap className="h-56 w-56 brightness-0 invert" />
              </div>
              <CardHeader className="pb-4 relative border-b border-white/10 p-6">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-4 text-white">
                    <TrendingUp className="h-5 w-5 text-white animate-pulse" />
                    Capital Strategy Oracle
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative space-y-6">
                 <p className="text-lg font-bold italic leading-relaxed opacity-90 leading-snug">
                    "AI Analysis: Corporate credit utilization is at 25%. Suggest initializing a programmatic Invoice Financing loop for the German export corridor to optimize Q3 cash conversion cycle."
                 </p>
                 <Button onClick={() => setSagaOpen(true)} variant="secondary" className="w-full h-12 font-black uppercase text-[10px] tracking-wide shadow-2xl transition-all hover:scale-[1.02] bg-white text-primary border-none rounded-3xl">
                    LAUNCH FINANCING SAGA
                 </Button>
              </CardContent>
           </Card>

           <Card className="shadow-none border-2 bg-background p-6 space-y-8 rounded-2xl">
              <div className="flex items-center justify-between">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ecosystem Ratios</h4>
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-6">
                 {[
                   { label: 'Asset Finality', val: '99.98%', icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Settlement Latency', val: '450ms', icon: Activity, color: 'text-blue-500' },
                   { label: 'Underwriting Precision', val: '92.4%', icon: BarChart3, color: 'text-indigo-500' }
                 ].map(stat => (
                   <div key={stat.label} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-6">
                         <div className="p-4 rounded-3xl bg-muted border-2 shadow-inner group-hover:bg-primary/5 transition-colors">
                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="text-2xl font-black tracking-tighter text-foreground">{stat.val}</span>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="shadow-none border-2 bg-background p-6 text-center space-y-6 rounded-2xl border-dashed group hover:border-primary/20 transition-all duration-700">
              <Lock className="h-14 w-14 mx-auto text-muted-foreground opacity-20 group-hover:text-primary transition-all duration-700" />
              <div className="space-y-2">
                 <p className="text-sm font-black uppercase tracking-widest">Sovereign Interoperability</p>
                 <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed px-4">
                    "Trade finance issuance requires cryptographical sign-off from both Buyer Treasury and Advising Bank. All instrument metadata is version-locked on the global ledger."
                 </p>
              </div>
              <FinalityLogDialog
                 title="Trade Finance Lineage"
                 description="Full lineage across Letters of Credit and invoice financing instruments, sourced live from the bank instrument book."
                 instruments={instruments}
                 trigger={<Button variant="outline" className="w-full h-12 border-2 font-black uppercase text-[9px] tracking-wide bg-background">AUDIT FINANCE LINEAGE</Button>}
              />
           </Card>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selected?.type.replace(/_/g, ' ')} — {selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Value</span><span className="font-black">{formatCurrency(selected.amount, selected.currency)}</span></div>
              {selected.expiryDate && (
                <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Expiry</span><span className="font-bold">{new Date(selected.expiryDate).toLocaleDateString()}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Status</span><Badge variant="outline" className="uppercase">{selected.status}</Badge></div>
              {selected.interestRate ? (
                <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Fee Rate</span><span className="font-bold">{selected.interestRate}%</span></div>
              ) : null}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FinalityLogDialog({
  title,
  description,
  instruments,
  trigger,
}: {
  title: string;
  description?: string;
  instruments: TradeFinanceInstrument[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const sorted = [...instruments].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {description ? <p className="text-xs text-muted-foreground italic -mt-2">{description}</p> : null}
        <div className="space-y-2 py-2 max-h-96 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="text-sm italic opacity-50 text-center py-8">No trade finance instruments on the live bank instrument book yet.</p>
          ) : (
            sorted.map((inst) => (
              <div key={inst.id} className="p-3 rounded-lg border flex items-center justify-between text-xs gap-4">
                <div className="min-w-0">
                  <p className="font-black uppercase truncate">{inst.type.replace(/_/g, ' ')} — {inst.referenceId}</p>
                  <p className="text-muted-foreground truncate">{inst.status} • {formatCurrency(inst.amount, inst.currency)}</p>
                </div>
                {inst.createdAt ? <span className="text-muted-foreground shrink-0">{new Date(inst.createdAt).toLocaleDateString()}</span> : null}
              </div>
            ))
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestInstrumentDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onRequested,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRequested?: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  const [submitting, setSubmitting] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [debtorName, setDebtorName] = useState('');
  const [amount, setAmount] = useState('');

  const valid = invoiceId.trim() && debtorName.trim() && Number(amount) > 0;

  async function submit() {
    setSubmitting(true);
    try {
      const orgId = await resolveSessionOrgId();
      await realTradeFinanceService.requestInvoiceFinancing({
        invoiceId: invoiceId.trim(),
        orderRef: orderRef.trim() || undefined,
        debtorName: debtorName.trim(),
        companyId: orgId || undefined,
        amount: Number(amount),
      });
      toast({ title: 'Financing request submitted', description: 'Credit-service is assessing the receivable.' });
      setOpen(false);
      setInvoiceId(''); setOrderRef(''); setDebtorName(''); setAmount('');
      await onRequested?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Request failed.';
      toast({ variant: 'destructive', title: 'Request failed', description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 bg-primary text-white font-black uppercase tracking-widest text-xs shadow-md hover:scale-[1.02] transition-all">
          <Plus className="mr-3 h-5 w-5" /> Request Instrument
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Request Invoice Financing</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Invoice Number</Label>
            <Input value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="INV-2026-0042" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Order Reference (optional)</Label>
            <Input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="Links this financing request to a GTI order" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Debtor Name</Label>
            <Input value={debtorName} onChange={(e) => setDebtorName(e.target.value)} placeholder="Buyer / debtor institution" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Face Amount (USD)</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !valid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
