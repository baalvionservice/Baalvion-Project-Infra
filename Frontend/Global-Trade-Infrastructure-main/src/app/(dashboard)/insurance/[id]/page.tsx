'use client';

/**
 * @file insurance/[id]/page.tsx
 * @description One policy: its cover, how it was rated, the claims against it, and
 * filing a new one.
 *
 * The previous version displayed a hard-coded "Shanghai Port → Mumbai Port" corridor,
 * a hard-coded order "ORD-9921" and two invented activity entries on every policy, and
 * "filing a claim" was a setTimeout that showed a toast and navigated away without
 * writing anything. All four are gone; everything below is read from the policy.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  insuranceService, InsurancePolicy, InsuranceClaim, LossType, LOSS_TYPE_LABELS, describeRating, RATING_TONE,
} from '@/services/insurance-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft, Loader2, ShieldCheck, AlertCircle, CheckCircle2, Info, ArrowRight, Ban,
} from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { cn, formatCurrency } from '@/lib/utils';

const CLAIMABLE_LOSSES: LossType[] = [
  'total_loss', 'partial_loss', 'damage', 'theft', 'non_delivery', 'contamination', 'delay', 'general_average',
];

const humanise = (s?: string) => (s || '').replace(/_/g, ' ');
const day = (d?: string) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export default function InsuranceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ lossType: 'damage' as LossType, amount: '', lossDate: '', reason: '' });

  const load = useCallback(async () => {
    if (typeof id !== 'string') return;
    try {
      setPolicy(await insuranceService.getPolicyById(id));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not load the policy', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  async function fileClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!policy) return;
    setSubmitting(true);
    try {
      const claim = await insuranceService.fileClaim({
        policyId: policy.id,
        amount: Number(form.amount),
        lossType: form.lossType,
        lossDate: form.lossDate || undefined,
        reason: form.reason,
      });
      toast({
        title: `Claim ${claim.claimNumber} filed`,
        description: `${claim.requiredDocuments.length} documents are required before it can be reviewed.`,
      });
      setClaimOpen(false);
      router.push(`${PATHS.INSURANCE_CLAIMS}?claim=${claim.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Claim rejected', description: err instanceof Error ? err.message : '' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!policy) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center gap-4">
        <h2 className="text-2xl font-bold">Policy not found</h2>
        <Button onClick={() => router.push(PATHS.INSURANCE)}>Back to insurance</Button>
      </div>
    );
  }

  const claims: InsuranceClaim[] = policy.claims || [];
  const remaining = policy.remainingCoverage ?? policy.coverageAmount;
  const used = Math.max(0, policy.coverageAmount - remaining);
  const usedPct = policy.coverageAmount > 0 ? (used / policy.coverageAmount) * 100 : 0;
  const risk = policy.riskAssessment;
  const canClaim = policy.status === 'active' && remaining > 0;

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(PATHS.INSURANCE)} className="-ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to insurance
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-black tracking-tighter">{policy.policyNumber}</h2>
            <Badge variant="outline" className="uppercase font-black text-[10px] border-2">{policy.status}</Badge>
            {policy.coverageBasis && (
              <Badge variant="outline" className="uppercase font-black text-[10px] border-2">{policy.coverageBasis} cover</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {humanise(policy.type)} cover
            {policy.shipmentId ? ` on shipment ${policy.shipmentId}` : ' — not linked to a shipment'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="destructive" className="font-bold" disabled={!canClaim} onClick={() => setClaimOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4" /> File a claim
          </Button>
        </div>
      </div>

      {!canClaim && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3 text-amber-900">
            <Ban className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm">
              {policy.status !== 'active'
                ? `This policy is ${policy.status}, so no claim can be filed against it.`
                : 'The sum insured has been exhausted by earlier settlements.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-none border-2 rounded-2xl">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-sm font-black uppercase tracking-wide">Cover</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sum insured</p>
                  <p className="text-2xl font-black text-primary">{formatCurrency(policy.coverageAmount, policy.currency)}</p>
                  <div className="mt-3 space-y-1.5">
                    <Progress value={usedPct} className="h-1.5" />
                    <p className="text-[11px] text-muted-foreground">
                      {formatCurrency(remaining, policy.currency)} still available
                      {used > 0 && ` · ${formatCurrency(used, policy.currency)} consumed by settled claims`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border bg-muted/10">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Premium</p>
                    <p className="text-sm font-black mt-1">{formatCurrency(policy.premium, policy.currency)}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-muted/10">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Deductible</p>
                    <p className="text-sm font-black mt-1">{formatCurrency(policy.deductible, policy.currency)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:border-l sm:pl-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Cover period</p>
                  <p className="text-sm font-semibold mt-1">{day(policy.startDate)} → {day(policy.endDate)}</p>
                  {policy.metadata?.coverPeriod && (
                    <p className="text-[11px] text-muted-foreground mt-1">{policy.metadata.coverPeriod}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Assured</p>
                  <p className="text-sm font-semibold mt-1">{policy.insured?.name || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Bound</p>
                  <p className="text-sm font-semibold mt-1">{day(policy.boundAt)}</p>
                  {policy.premiumPaymentRef && (
                    <p className="text-[11px] text-muted-foreground mt-1">Premium reference {policy.premiumPaymentRef}</p>
                  )}
                </div>
              </div>
            </div>

            {risk && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide">How this was rated</p>
                    <Badge variant="outline" className={cn('text-[9px] font-black uppercase border-2', RATING_TONE[describeRating(risk).tone].badge)}>
                      {describeRating(risk).label}
                    </Badge>
                  </div>
                  <div className={cn('flex gap-3 p-4 rounded-xl border', RATING_TONE[describeRating(risk).tone].panel)}>
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">{describeRating(risk).sentence}</p>
                  </div>
                  {risk.factors.map((f) => (
                    <div key={f.name} className="flex items-start justify-between gap-4 p-3 rounded-xl border bg-background">
                      <div className="min-w-0">
                        <p className="text-xs font-bold capitalize">{f.name.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-muted-foreground">{f.detail}</p>
                      </div>
                      <p className="text-sm font-black shrink-0">×{f.factor}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-none border-2 rounded-2xl">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Claims on this policy</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {claims.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No claims filed.</p>}
              {claims.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`${PATHS.INSURANCE_CLAIMS}?claim=${c.id}`)}
                  className="w-full text-left p-4 hover:bg-primary/[0.03] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black truncate">{c.claimNumber}</p>
                    <Badge variant="outline" className="text-[8px] font-black uppercase">{humanise(c.status)}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {c.lossType ? LOSS_TYPE_LABELS[c.lossType] : 'Loss'} · claimed {formatCurrency(c.amount, policy.currency)}
                    {c.payoutAmount != null && ` · paid ${formatCurrency(c.payoutAmount, policy.currency)}`}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          {policy.shipmentId && (
            <Card className="shadow-none border-2 rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase">Insured shipment</p>
                <Button
                  variant="outline"
                  className="w-full font-bold text-xs border-2"
                  onClick={() => router.push(`/logistics-shipment/${policy.shipmentId}`)}
                >
                  Track the cargo <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Whose balance sheet answers for this risk. A platform-retained policy is
              not a neutral default — it means Baalvion pays a total loss itself. */}
          <Card className={cn(
            'shadow-none border-2 rounded-2xl',
            policy.placementStatus === 'platform_retained' && 'border-amber-300 bg-amber-50',
          )}>
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Who carries this risk
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {policy.placementStatus === 'placed' ? (
                <>
                  <p className="text-sm font-black">Placed with a carrier</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Written on the carrier&apos;s paper under a binding authority
                    {policy.underwriterPolicyRef ? <> — their policy <span className="font-mono">{policy.underwriterPolicyRef}</span></> : ' (their policy number not yet confirmed)'}.
                  </p>
                  {policy.commissionAmount != null && (
                    <div className="pt-2 space-y-1.5 border-t">
                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">How the premium splits</p>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Gross paid by the assured</span><span className="font-bold">{formatCurrency(policy.premium, policy.currency)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Commission retained ({((policy.commissionRate ?? 0) * 100).toFixed(1)}%)</span><span className="font-bold">{formatCurrency(policy.commissionAmount, policy.currency)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Remitted to the carrier</span><span className="font-bold">{formatCurrency(policy.netPremium ?? 0, policy.currency)}</span></div>
                    </div>
                  )}
                </>
              ) : policy.placementStatus === 'platform_retained' ? (
                <div className="flex gap-3 text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-black">Carried by this platform</p>
                    <p className="text-xs leading-relaxed">
                      No binder could take this risk, so Baalvion&apos;s own balance sheet answers for the full{' '}
                      {formatCurrency(policy.coverageAmount, policy.currency)} if it is a total loss.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {policy.placementStatus === 'declined'
                    ? 'The carrier declined this risk.'
                    : 'Not yet placed — placement happens when the cover is bound.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none border-2 rounded-2xl">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-xs font-black uppercase tracking-wide">Claims are decided on documents</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Each loss type has its own documentary set — bill of lading, invoice, packing list, plus a survey
                report or non-delivery certificate. A claim cannot be reviewed until that file is complete, and a
                claim letter must reach the carrier inside its time bar or the recovery is lost.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={fileClaim}>
            <DialogHeader>
              <DialogTitle>File a claim</DialogTitle>
              <DialogDescription>
                Against {policy.policyNumber}. {formatCurrency(remaining, policy.currency)} of cover remains.
              </DialogDescription>
            </DialogHeader>
            <div className="py-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Loss type</Label>
                <Select value={form.lossType} onValueChange={(v) => setForm((f) => ({ ...f, lossType: v as LossType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLAIMABLE_LOSSES.map((l) => <SelectItem key={l} value={l}>{LOSS_TYPE_LABELS[l]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Amount</Label>
                  <Input type="number" min={1} required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Date of loss</Label>
                  <Input type="date" value={form.lossDate} onChange={(e) => setForm((f) => ({ ...f, lossDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">What happened</Label>
                <Textarea rows={4} required value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Circumstances of the loss" />
              </div>
              <div className="p-3 bg-muted/30 border rounded-lg flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <p>The date of loss is checked against the cover period, and the amount against the cover remaining.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClaimOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} File claim
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
