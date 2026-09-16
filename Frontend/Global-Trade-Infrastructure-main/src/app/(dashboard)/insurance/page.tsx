'use client';

/**
 * @file insurance/page.tsx
 * @description Cargo protection overview: the book of policies, the claims queue and
 * open general average adjustments.
 *
 * Every figure on this page is counted from the caller's own rows via
 * /insurance_policies/summary. The previous version hard-coded "$482M insured value",
 * "4.2h underwriting", "24/100 risk score", "99.8% claims recovery", a "$1.2B
 * reinsurance pool" and four regional loss probabilities, none of which came from
 * anywhere — and read them over an empty list, because it was querying `/policies`,
 * a route that does not exist.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  insuranceService, InsurancePolicy, InsuranceClaim, InsuranceSummary, GeneralAverage,
  LOSS_TYPE_LABELS,
} from '@/services/insurance-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, ShieldAlert, Loader2, FileText, AlertTriangle, ArrowRight, Plus,
  Landmark, Scale, Ship, Undo2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { PATHS } from '@/lib/paths';

const POLICY_TONE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  claimed: 'bg-blue-50 text-blue-700 border-blue-200',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

const CLAIM_TONE: Record<string, string> = {
  evidence_required: 'bg-amber-500',
  filed: 'bg-blue-500',
  under_review: 'bg-indigo-500',
  approved: 'bg-emerald-600',
  paid: 'bg-emerald-700',
  rejected: 'bg-red-600',
  withdrawn: 'bg-slate-400',
};

const humanise = (s?: string) => (s || '').replace(/_/g, ' ');

export default function InsuranceDashboardPage() {
  const [summary, setSummary] = useState<InsuranceSummary | null>(null);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [averages, setAverages] = useState<GeneralAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, c, ga] = await Promise.all([
          insuranceService.summary(),
          insuranceService.getPolicies(),
          insuranceService.getClaims(),
          insuranceService.getGeneralAverages().catch(() => []),
        ]);
        setSummary(s);
        setPolicies(p);
        setClaims(c);
        setAverages(ga);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the insurance book.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading the book…</p>
      </div>
    );
  }

  const openClaims = claims.filter((c) => !['paid', 'rejected', 'withdrawn'].includes(c.status));
  const recoverable = claims.filter((c) => c.subrogationStatus === 'pending' || c.subrogationStatus === 'partially_recovered');
  const currency = policies[0]?.currency || 'USD';

  // A book with one large claim against a thin premium produces a ratio in the
  // thousands of percent. That is the true number, but "24750%" reads as a bug, so
  // past 10x it is stated as a multiple of premium instead.
  const lossRatioLabel = summary?.lossRatio == null
    ? 'No premium yet'
    : summary.lossRatio > 10
      ? `${summary.lossRatio.toFixed(1)}× premium`
      : `${(summary.lossRatio * 100).toFixed(1)}%`;

  const stats = [
    {
      title: 'Active cover',
      value: summary ? formatCurrency(summary.insuredValueActive, currency) : '—',
      sub: summary ? `${summary.activePolicies} of ${summary.totalPolicies} policies in force` : '',
      icon: Landmark,
      tone: 'text-primary',
    },
    {
      title: 'Premium earned',
      value: summary ? formatCurrency(summary.premiumEarned, currency) : '—',
      sub: 'Bound policies only',
      icon: ShieldCheck,
      tone: 'text-emerald-600',
    },
    {
      title: 'Open claims',
      value: summary ? summary.openClaims : '—',
      sub: summary ? `${summary.totalClaims} filed in total` : '',
      icon: AlertTriangle,
      tone: 'text-orange-600',
    },
    {
      title: 'Net loss ratio',
      // Null until premium exists to divide by — shown as "no premium yet", never as 0%.
      value: lossRatioLabel,
      sub: summary
        ? `${formatCurrency(summary.claimsPaidOut, currency)} paid, ${formatCurrency(summary.subrogationRecovered, currency)} recovered`
        : '',
      icon: Scale,
      tone: 'text-blue-600',
    },
  ];

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cargo protection</p>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground leading-none">Insurance</h2>
          <p className="text-muted-foreground font-medium">
            Marine cargo cover for booked shipments, the claims file, and general average adjustments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="font-black border-2 bg-background h-12 px-6 text-[10px] uppercase tracking-widest" asChild>
            <Link href={PATHS.INSURANCE_UNDERWRITERS}>Binders</Link>
          </Button>
          <Button variant="outline" className="font-black border-2 bg-background h-12 px-6 text-[10px] uppercase tracking-widest" asChild>
            <Link href={PATHS.INSURANCE_GENERAL_AVERAGE}>General average</Link>
          </Button>
          <Button variant="outline" className="font-black border-2 bg-background h-12 px-6 text-[10px] uppercase tracking-widest" asChild>
            <Link href={PATHS.INSURANCE_CLAIMS}>Claims queue</Link>
          </Button>
          <Button className="font-black h-12 px-6 text-[10px] uppercase tracking-widest" asChild>
            <Link href={PATHS.INSURANCE_POLICIES}><Plus className="mr-2 h-4 w-4" /> Quote a cover</Link>
          </Button>
        </div>
      </div>

      {/* The single most consequential number on this page: cover written on our own
          book because no binder would take it. Never hide it behind a fold. */}
      {summary && summary.broker && summary.broker.platformRetainedExposure > 0 && (
        <Link href={PATHS.INSURANCE_UNDERWRITERS} className="block">
          <Card className="border-2 border-amber-300 bg-amber-50 hover:border-amber-400 transition-colors">
            <CardContent className="p-5 flex items-start gap-3 text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                <strong>{formatCurrency(summary.broker.platformRetainedExposure, currency)}</strong> of cover sits on
                this platform&apos;s own balance sheet across {summary.broker.retainedPolicies} polic
                {summary.broker.retainedPolicies === 1 ? 'y' : 'ies'} — no carrier is behind it.
                {summary.broker.boundBinders === 0
                  ? ' No binders are recorded at all.'
                  : ` ${summary.broker.commissionEarned > 0 ? `${formatCurrency(summary.broker.commissionEarned, currency)} of commission earned on placed business.` : ''}`}
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      {error && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-6 text-sm font-medium text-red-800">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="shadow-sm border-2 border-primary/5 bg-background rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-wide">{s.title}</CardTitle>
              <div className="p-2 rounded-xl bg-muted/50"><s.icon className={cn('h-4 w-4', s.tone)} /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tighter">{s.value}</div>
              <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-tight opacity-60">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/10 border-b py-6 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-wide">Policy ledger</CardTitle>
                <CardDescription className="text-xs font-medium">Cover written against real shipments.</CardDescription>
              </div>
              <FileText className="h-5 w-5 text-primary opacity-30" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y-2">
                {policies.slice(0, 6).map((policy) => (
                  <Link
                    key={policy.id}
                    href={`${PATHS.INSURANCE}/${policy.id}`}
                    className="p-6 flex items-center justify-between group hover:bg-primary/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-muted border-2 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-primary opacity-60" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-black uppercase tracking-tight leading-none truncate">
                          {humanise(policy.type)} · {policy.policyNumber}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 truncate">
                          {policy.shipmentId ? `Shipment ${policy.shipmentId}` : 'No shipment linked'}
                          {policy.coverageBasis ? ` · ${policy.coverageBasis} cover` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Sum insured</p>
                        <p className="text-sm font-black">{formatCurrency(policy.coverageAmount, policy.currency)}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-[9px] font-black uppercase h-7 px-3 border-2 rounded-full', POLICY_TONE[policy.status] || 'bg-muted')}>
                        {policy.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
                {policies.length === 0 && (
                  <div className="py-16 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">No cover has been written yet.</p>
                    <Button variant="outline" size="sm" className="font-bold" asChild>
                      <Link href={PATHS.INSURANCE_POLICIES}>Quote a cover</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {averages.length > 0 && (
            <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
              <CardHeader className="bg-muted/10 border-b py-6 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wide">General average</CardTitle>
                  <CardDescription className="text-xs font-medium">
                    Voyage-wide loss sharing after a casualty — owed by every cargo interest, insured or not.
                  </CardDescription>
                </div>
                <Ship className="h-5 w-5 text-primary opacity-30" />
              </CardHeader>
              <CardContent className="p-0 divide-y-2">
                {averages.slice(0, 4).map((ga) => (
                  <Link key={ga.id} href={PATHS.INSURANCE_GENERAL_AVERAGE} className="flex items-center justify-between p-6 hover:bg-primary/[0.02]">
                    <div className="space-y-1 min-w-0">
                      <p className="font-black uppercase tracking-tight text-sm truncate">{ga.vesselName || ga.id}</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-60">
                        Voyage {ga.voyageNo || '—'} · adjuster {ga.averageAdjuster || 'not appointed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Contribution rate</p>
                        <p className="text-sm font-black">
                          {ga.contributionRate != null ? `${(ga.contributionRate * 100).toFixed(3)}%` : 'Not apportioned'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase h-7 px-3 border-2 rounded-full">{ga.status}</Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/10 border-b py-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Claims needing action</CardTitle>
              <Badge variant="outline" className="text-[9px] font-black border-2 h-6 uppercase px-3 rounded-full">{openClaims.length}</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {openClaims.slice(0, 5).map((claim) => (
                <Link
                  key={claim.id}
                  href={`${PATHS.INSURANCE_CLAIMS}?claim=${claim.id}`}
                  className="flex items-start gap-4 p-4 rounded-2xl border-2 bg-muted/10 hover:border-primary/30 transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-background border-2 shrink-0">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-tight truncate">
                      {claim.lossType ? LOSS_TYPE_LABELS[claim.lossType] : 'Loss'} · {claim.claimNumber}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-70">
                      {formatCurrency(claim.amount, currency)}
                      {claim.status === 'evidence_required' && ` · ${claim.requiredDocuments.length} documents required`}
                    </p>
                  </div>
                  <Badge className={cn('text-[8px] font-black uppercase h-5 border-none px-2 rounded-full text-white shrink-0', CLAIM_TONE[claim.status])}>
                    {humanise(claim.status)}
                  </Badge>
                </Link>
              ))}
              {openClaims.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">No claims are open.</p>
              )}
              <Button variant="ghost" className="w-full h-11 text-[10px] font-black uppercase text-primary tracking-widest border-2 border-dashed border-primary/20 rounded-2xl" asChild>
                <Link href={PATHS.INSURANCE_CLAIMS}>Open the claims queue <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/10 border-b py-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Recovery from carriers</CardTitle>
              <Undo2 className="h-4 w-4 text-primary opacity-40" />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Once a claim is paid, the right to recover from the carrier passes to the insurer.
                Notice must reach the carrier inside its time bar or the recovery is lost.
              </p>
              {recoverable.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{c.claimNumber}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{humanise(c.subrogationStatus)}</p>
                  </div>
                  <p className="text-xs font-black shrink-0">
                    {formatCurrency(c.subrogationRecovered, currency)} / {formatCurrency(c.payoutAmount || 0, currency)}
                  </p>
                </div>
              ))}
              {recoverable.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing is currently open for recovery.</p>
              )}
            </CardContent>
          </Card>

          {summary && (
            <Card className="shadow-none border-2 bg-background rounded-2xl">
              <CardHeader className="bg-muted/10 border-b py-5 px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Settlement speed</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {summary.settledClaimCount > 0 ? (
                  <>
                    <p className="text-3xl font-black tracking-tighter">{summary.avgSettlementDays} days</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 opacity-60">
                      Mean, filed to resolved, over {summary.settledClaimCount} settled claim{summary.settledClaimCount === 1 ? '' : 's'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No claim has been settled yet, so there is nothing to average.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
