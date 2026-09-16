'use client';

/**
 * @file insurance/policies/page.tsx
 * @description Quote → bind, and the book of policies.
 *
 * Replaces a generic EntityManager CRUD form that POSTed snake_case fields
 * (`insured_value`, `coverage_type`) at `/policies` — not a route — so nothing it
 * created was ever priced, bound or paid for. Cover is now quoted by the server from
 * the real shipment and bound by charging the premium through the finance suite.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  insuranceService, InsurancePolicy, QuoteResult, InsuranceType, VerificationGate,
  describeRating, RATING_TONE, DISCLOSURE_POINTS, DISCLOSURE_VERSION,
} from '@/services/insurance-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Calculator, Info, ArrowRight, Ship, Check } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { PATHS } from '@/lib/paths';

const TYPES: { value: InsuranceType; label: string; blurb: string }[] = [
  { value: 'cargo', label: 'Marine cargo', blurb: 'Physical loss of or damage to the goods in transit.' },
  { value: 'liability', label: 'Liability', blurb: 'Third-party liability arising from the shipment.' },
  { value: 'credit', label: 'Trade credit', blurb: 'Buyer default on the underlying sale.' },
  { value: 'parametric', label: 'Parametric', blurb: 'Pays on a measured trigger rather than an assessed loss.' },
];

const CONTAINER_TYPES = ['20ft', '40ft', '40hc', '45hc', 'reefer', 'tank', 'open_top', 'flat_rack'];


export default function InsurancePoliciesPage() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    type: 'cargo' as InsuranceType,
    shipmentId: '',
    coverageAmount: '',
    currency: 'USD',
    containerType: '40hc',
    insuredName: '',
  });
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [binding, setBinding] = useState(false);
  // Binding charges a premium, so it needs a verified organization behind it.
  const [gate, setGate] = useState<VerificationGate | null>(null);
  // The assured must actively accept the basis of sale before cover can be bound.
  // An unticked box becomes the broker's problem in an E&O claim, so binding waits.
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);

  const refresh = async () => {
    try {
      setPolicies(await insuranceService.getPolicies());
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not load policies', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    insuranceService.gate().then(setGate).catch(() => setGate(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function getQuote() {
    setQuoting(true);
    setQuote(null);
    setDisclosureAccepted(false);   // a new quote is a new sale; it must be re-accepted
    try {
      const q = await insuranceService.quote({
        type: form.type,
        shipmentId: form.shipmentId.trim() || undefined,
        coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : undefined,
        currency: form.currency,
        containerType: form.containerType,
      });
      setQuote(q);
      if (q.coverageAmount <= 0) {
        toast({
          variant: 'destructive',
          title: 'Nothing to insure',
          description: 'Enter a sum insured, or give a shipment id so the declared value can be read from it.',
        });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Quote failed', description: e instanceof Error ? e.message : '' });
    } finally {
      setQuoting(false);
    }
  }

  async function bind() {
    if (!quote) return;
    setBinding(true);
    try {
      const policy = await insuranceService.createPolicy({
        type: form.type,
        shipmentId: form.shipmentId.trim() || undefined,
        coverageAmount: quote.coverageAmount,
        currency: quote.currency,
        containerType: form.containerType,
        insured: form.insuredName ? { name: form.insuredName } : undefined,
        beneficiary: form.insuredName ? { name: form.insuredName } : undefined,
        // Recorded on the policy: the basis of sale and which disclosure version was
        // shown. That record is the broker's evidence if suitability is disputed.
        adviceBasis: 'non_advised',
        disclosureVersion: DISCLOSURE_VERSION,
      } as Parameters<typeof insuranceService.createPolicy>[0]);
      const bound = await insuranceService.bindPolicy(policy.id);
      toast({
        title: `Cover bound — ${bound.policyNumber}`,
        description: `${formatCurrency(bound.premium, bound.currency)} premium charged. ${
          bound.coverageBasis === 'voyage'
            ? 'Cover attaches on departure and runs 60 days past arrival.'
            : 'Bound as a term policy — the shipment carried no sailing dates.'
        }`,
      });
      setQuote(null);
      setForm((f) => ({ ...f, shipmentId: '', coverageAmount: '' }));
      refresh();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not bind the cover', description: e instanceof Error ? e.message : '' });
    } finally {
      setBinding(false);
    }
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cargo protection</p>
        <h2 className="text-3xl font-black tracking-tighter uppercase">Policies</h2>
        <p className="text-muted-foreground font-medium">Quote a cover against a booked shipment, then bind it by paying the premium.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 border-2 shadow-none rounded-2xl">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> Quote a cover
            </CardTitle>
            <CardDescription className="text-xs">
              Give a shipment id and the lane, transit time and declared value are read from the shipment itself.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Cover type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as InsuranceType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{TYPES.find((t) => t.value === form.type)?.blurb}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Shipment id</Label>
              <Input
                value={form.shipmentId}
                onChange={(e) => setForm((f) => ({ ...f, shipmentId: e.target.value }))}
                placeholder="UUID of the booked shipment"
              />
              <p className="text-[11px] text-muted-foreground">
                Optional, but without it the lane cannot be rated and the sum insured must be typed in by hand.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Sum insured</Label>
                <Input
                  type="number" min={0}
                  value={form.coverageAmount}
                  onChange={(e) => setForm((f) => ({ ...f, coverageAmount: e.target.value }))}
                  placeholder="From shipment"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} maxLength={3} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Container</Label>
              <Select value={form.containerType} onValueChange={(v) => setForm((f) => ({ ...f, containerType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Assured</Label>
              <Input value={form.insuredName} onChange={(e) => setForm((f) => ({ ...f, insuredName: e.target.value }))} placeholder="Company name on the policy" />
            </div>

            <Button onClick={getQuote} disabled={quoting} className="w-full h-12 font-black uppercase text-[10px] tracking-widest">
              {quoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Get a quote
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-2 shadow-none rounded-2xl">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-sm font-black uppercase tracking-wide">Quotation</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!quote ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Quote a cover to see the premium, the deductible and how the lane was rated.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Sum insured', value: formatCurrency(quote.coverageAmount, quote.currency) },
                    { label: 'Premium', value: formatCurrency(quote.premium, quote.currency) },
                    { label: 'Deductible', value: formatCurrency(quote.deductible, quote.currency) },
                  ].map((m) => (
                    <div key={m.label} className="p-4 rounded-2xl border-2 bg-muted/10">
                      <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">{m.label}</p>
                      <p className="text-xl font-black tracking-tighter mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>

                {quote.shipment && (
                  <div className="p-4 rounded-2xl border-2 bg-background space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Ship className="h-3.5 w-3.5" /> Read from shipment {quote.shipment.shipmentNo}
                    </p>
                    <p className="text-sm font-bold">
                      {quote.shipment.originPort || quote.shipment.originCountry || '—'}
                      <ArrowRight className="inline h-3.5 w-3.5 mx-2 opacity-50" />
                      {quote.shipment.destinationPort || quote.shipment.destinationCountry || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {quote.shipment.mode} · {quote.shipment.transitDays} days in transit · declared value{' '}
                      {formatCurrency(quote.shipment.declaredValue, quote.shipment.currency || quote.currency)}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide">How the lane was rated</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] font-black uppercase border-2',
                        RATING_TONE[describeRating(quote.risk).tone].badge,
                      )}
                    >
                      {describeRating(quote.risk).label}
                    </Badge>
                  </div>

                  {/* How much of this price is this lane's own record, and how much the
                      book's. Stated plainly so a thin sample never reads as a measurement. */}
                  <div className={cn('flex gap-3 p-4 rounded-xl border', RATING_TONE[describeRating(quote.risk).tone].panel)}>
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">{describeRating(quote.risk).sentence}</p>
                  </div>

                  {quote.risk.factors.length > 0 && (
                    <div className="space-y-2">
                      {quote.risk.factors.map((f) => (
                        <div key={f.name} className="flex items-start justify-between gap-4 p-3 rounded-xl border bg-muted/10">
                          <div className="min-w-0">
                            <p className="text-xs font-bold capitalize">{f.name.replace(/_/g, ' ')}</p>
                            <p className="text-[11px] text-muted-foreground">{f.detail}</p>
                          </div>
                          <p className="text-sm font-black shrink-0">×{f.factor}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    Base rate for {TYPES.find((t) => t.value === quote.insuranceType)?.label.toLowerCase()} is{' '}
                    {(quote.premiumRate * 100).toFixed(2)}% of the sum insured, before the lane multiplier.
                  </p>
                </div>

                {/* The basis of sale, shown before binding and versioned. An
                    execution-only sale carries a far lower duty than a recommendation,
                    and which one happened must be evidenced at the time. */}
                <div className="space-y-3 p-4 rounded-xl border-2 bg-muted/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Before you bind — what this cover is, and is not
                  </p>
                  <ul className="space-y-2">
                    {DISCLOSURE_POINTS.map((point) => (
                      <li key={point} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setDisclosureAccepted((v) => !v)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                      disclosureAccepted ? 'border-primary bg-primary/5' : 'hover:bg-muted/30',
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2',
                      disclosureAccepted ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                    )}>
                      {disclosureAccepted && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span className="text-[11px] font-medium leading-relaxed">
                      I have read the above and confirm the sum insured is adequate for these goods. I understand no
                      recommendation has been made.
                    </span>
                  </button>
                </div>

                {gate && !gate.canCommit && (
                  <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      Cover cannot be bound until the organization is verified to <strong>{gate.required}</strong> level
                      (currently <strong>{gate.level}</strong>). Outstanding: {gate.reasons.join('; ')}.
                    </p>
                  </div>
                )}

                <Button
                  onClick={bind}
                  disabled={binding || quote.coverageAmount <= 0 || !disclosureAccepted || (gate ? !gate.canCommit : false)}
                  className="w-full h-12 font-black uppercase text-[10px] tracking-widest"
                >
                  {binding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Bind cover · pay {formatCurrency(quote.premium, quote.currency)}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-none rounded-2xl">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-sm font-black uppercase tracking-wide">The book</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" /></div>
          ) : policies.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No policies yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Policy</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Sum insured</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Premium</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Cover to</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-xs">{p.policyNumber}</TableCell>
                    <TableCell className="text-xs capitalize">{p.type}</TableCell>
                    <TableCell className="text-xs font-bold">{formatCurrency(p.coverageAmount, p.currency)}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(p.premium, p.currency)}</TableCell>
                    <TableCell className="text-xs">{p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase">{p.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`${PATHS.INSURANCE}/${p.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
