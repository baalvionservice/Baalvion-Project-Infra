'use client';

/**
 * @file insurance/claims/page.tsx
 * @description The claims workbench: the file, its evidence, and adjudication.
 *
 * Replaces a generic EntityManager form writing `claim_amount` / `policy_id` to
 * `/claims` — not a route. A claim now cannot reach review or approval until the
 * documentary set for its loss type is attached, and the amount authorised is the
 * settlement (capped at remaining cover, net of the deductible), not the sum claimed.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  insuranceService, InsuranceClaim, ClaimDetail, EvidenceRole,
  EVIDENCE_LABELS, EVIDENCE_DOC_TYPES, LOSS_TYPE_LABELS,
} from '@/services/insurance-service';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, XCircle, Paperclip, ShieldAlert, Banknote, Undo2, FileCheck2, AlertTriangle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const STATUS_TONE: Record<string, string> = {
  evidence_required: 'bg-amber-100 text-amber-900 border-amber-300',
  filed: 'bg-blue-100 text-blue-900 border-blue-300',
  under_review: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  approved: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  paid: 'bg-emerald-200 text-emerald-950 border-emerald-400',
  rejected: 'bg-red-100 text-red-900 border-red-300',
  withdrawn: 'bg-slate-100 text-slate-700 border-slate-300',
};

const humanise = (s?: string) => (s || '').replace(/_/g, ' ');

/** useSearchParams opts the tree into client rendering; Next requires the boundary. */
export default function ClaimsPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin opacity-40" /></div>}>
      <ClaimsWorkbench />
    </Suspense>
  );
}

function ClaimsWorkbench() {
  const { toast } = useToast();
  const search = useSearchParams();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [subrogationOpen, setSubrogationOpen] = useState(false);
  const [recovered, setRecovered] = useState('');
  const [recoveryRef, setRecoveryRef] = useState('');

  const loadList = useCallback(async () => {
    try {
      const rows = await insuranceService.getClaims();
      setClaims(rows);
      setSelectedId((cur) => cur || search.get('claim') || rows[0]?.id || null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not load claims', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      setDetail(await insuranceService.getClaimById(id));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not open the claim', description: e instanceof Error ? e.message : '' });
    }
  }, [toast]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);

  const refreshBoth = async () => {
    await loadList();
    if (selectedId) await loadDetail(selectedId);
  };

  /**
   * Attaching evidence files the document in the real document engine first, then
   * binds that document to the claim in the role it proves. The claim page never
   * stores bytes of its own.
   */
  async function attach(role: EvidenceRole, file: File | null) {
    if (!detail || !file) return;
    setBusy(`attach:${role}`);
    try {
      const created = await apiClient.post<{ id: string }>('/trade_documents', {
        doc_type: EVIDENCE_DOC_TYPES[role],
        title: file.name,
        description: `${EVIDENCE_LABELS[role]} for claim ${detail.claimNumber}`,
        classification: 'CONFIDENTIAL',
      });
      const docId = created.data?.id;
      if (!docId) throw new Error('the document engine did not return an id');

      await apiClient.upload(`/trade_documents/${docId}/versions`, file);
      await insuranceService.attachEvidence(detail.id, role, docId, file.name);
      toast({ title: `${EVIDENCE_LABELS[role]} attached` });
      await refreshBoth();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Attachment failed', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  }

  async function act(label: string, fn: () => Promise<unknown>, success: string) {
    setBusy(label);
    try {
      await fn();
      toast({ title: success });
      await refreshBoth();
    } catch (e) {
      toast({ variant: 'destructive', title: `${label} failed`, description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  }

  const currency = detail?.policy?.currency || 'USD';

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20 min-h-screen space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cargo protection</p>
        <h2 className="text-3xl font-black tracking-tighter uppercase">Claims</h2>
        <p className="text-muted-foreground font-medium">
          A claim is decided on its documents. Nothing moves to review until the file is complete.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-2 shadow-none rounded-2xl lg:col-span-1 h-fit">
          <CardHeader className="border-b bg-muted/10 py-5">
            <CardTitle className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              {claims.length} claim{claims.length === 1 ? '' : 's'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y max-h-[70vh] overflow-y-auto">
            {loading && <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>}
            {!loading && claims.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground px-6">
                No claims have been filed. A claim starts from a logged incident on a shipment, or from a policy.
              </p>
            )}
            {claims.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left p-4 hover:bg-primary/[0.03] transition-colors',
                  selectedId === c.id && 'bg-primary/[0.05] border-l-4 border-l-primary',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black truncate">{c.claimNumber}</p>
                  <Badge variant="outline" className={cn('text-[8px] font-black uppercase border', STATUS_TONE[c.status])}>
                    {humanise(c.status)}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  {c.lossType ? LOSS_TYPE_LABELS[c.lossType] : 'Loss'} · {formatCurrency(c.amount, 'USD')}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {!detail ? (
            <Card className="border-2 shadow-none rounded-2xl">
              <CardContent className="py-24 text-center text-sm text-muted-foreground">Select a claim.</CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-2 shadow-none rounded-2xl">
                <CardHeader className="border-b bg-muted/10 flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">{detail.claimNumber}</CardTitle>
                    <CardDescription className="text-xs">
                      {detail.lossType ? LOSS_TYPE_LABELS[detail.lossType] : 'Loss'}
                      {detail.lossDate ? ` on ${new Date(detail.lossDate).toLocaleDateString()}` : ''}
                      {detail.incidentId ? ' · filed from a logged incident' : ''}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] font-black uppercase border-2 h-7 px-3', STATUS_TONE[detail.status])}>
                    {humanise(detail.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Claimed', value: formatCurrency(detail.amount, currency) },
                      { label: 'Sum insured', value: detail.policy ? formatCurrency(detail.policy.coverageAmount, currency) : '—' },
                      { label: 'Deductible', value: detail.policy ? formatCurrency(detail.policy.deductible, currency) : '—' },
                      {
                        label: detail.status === 'paid' ? 'Paid' : 'Payable',
                        value: detail.payoutAmount != null
                          ? formatCurrency(detail.payoutAmount, currency)
                          : detail.settlementPreview
                            ? formatCurrency(detail.settlementPreview.payout, currency)
                            : '—',
                      },
                    ].map((m) => (
                      <div key={m.label} className="p-3 rounded-xl border-2 bg-muted/10">
                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">{m.label}</p>
                        <p className="text-base font-black tracking-tight mt-1">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {detail.reason && <p className="text-sm leading-relaxed text-muted-foreground">{detail.reason}</p>}

                  {detail.settlementPreview && (
                    <div className="p-4 rounded-xl border-2 bg-background space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">How it settles</p>
                      <p className="text-sm">
                        Gross loss {formatCurrency(detail.settlementPreview.grossLoss, currency)}
                        {detail.settlementPreview.cappedByCoverage && ` → limited to ${formatCurrency(detail.settlementPreview.indemnity, currency)} of remaining cover`}
                        {' '}− deductible {formatCurrency(detail.settlementPreview.deductible, currency)}
                        {' '}= <span className="font-black">{formatCurrency(detail.settlementPreview.payout, currency)}</span>
                      </p>
                      {detail.settlementPreview.notes.map((n) => (
                        <p key={n} className="text-[11px] text-muted-foreground flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{n}</p>
                      ))}
                    </div>
                  )}

                  {detail.status === 'paid' && (
                    <div className="p-4 rounded-xl border-2 bg-emerald-50 border-emerald-200 space-y-1">
                      <p className="text-sm font-bold text-emerald-900">
                        {formatCurrency(detail.payoutAmount || 0, currency)} paid
                        {detail.deductibleApplied ? `, after a ${formatCurrency(detail.deductibleApplied, currency)} deductible` : ''}
                      </p>
                      <p className="text-xs text-emerald-800">
                        Recovery from the carrier: {humanise(detail.subrogationStatus)}
                        {detail.subrogationRecovered > 0 && ` — ${formatCurrency(detail.subrogationRecovered, currency)} recovered`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 shadow-none rounded-2xl">
                <CardHeader className="border-b bg-muted/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-wide">Evidence</CardTitle>
                    <CardDescription className="text-xs">
                      Required for a {detail.lossType ? LOSS_TYPE_LABELS[detail.lossType].toLowerCase() : 'cargo'} claim.
                    </CardDescription>
                  </div>
                  {detail.evidence.complete
                    ? <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase">Complete</Badge>
                    : <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase">{detail.evidence.missing.length} outstanding</Badge>}
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {detail.evidence.required.map((role) => {
                    const row = detail.evidence.attached.find((a) => a.role === role);
                    const ok = !!row && row.status !== 'rejected';
                    return (
                      <div key={role} className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {ok
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            : <XCircle className="h-4 w-4 text-muted-foreground opacity-40 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{EVIDENCE_LABELS[role]}</p>
                            {row && <p className="text-[11px] text-muted-foreground truncate">{row.title} · {row.status}</p>}
                          </div>
                        </div>
                        {['paid', 'rejected', 'withdrawn'].includes(detail.status) ? null : (
                          <label className="shrink-0">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => attach(role, e.target.files?.[0] || null)}
                            />
                            <span className={cn(
                              'inline-flex items-center gap-2 h-8 px-3 rounded-lg border-2 text-[10px] font-black uppercase cursor-pointer hover:bg-muted transition-colors',
                              busy === `attach:${role}` && 'opacity-50 pointer-events-none',
                            )}>
                              {busy === `attach:${role}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                              {ok ? 'Replace' : 'Attach'}
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-2 shadow-none rounded-2xl">
                <CardHeader className="border-b bg-muted/10">
                  <CardTitle className="text-sm font-black uppercase tracking-wide">Adjudication</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-wrap gap-3">
                  {['filed'].includes(detail.status) && (
                    <Button
                      disabled={!!busy}
                      onClick={() => act('Take into review', () => insuranceService.assessClaim(detail.id), 'Claim is under review')}
                      className="font-black uppercase text-[10px] tracking-widest h-11"
                    >
                      <FileCheck2 className="mr-2 h-4 w-4" /> Take into review
                    </Button>
                  )}
                  {detail.status === 'under_review' && (
                    <Button
                      disabled={!!busy}
                      onClick={() => act('Approve', () => insuranceService.approveClaim(detail.id), 'Settlement authorised')}
                      className="font-black uppercase text-[10px] tracking-widest h-11"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve settlement
                    </Button>
                  )}
                  {detail.status === 'approved' && (
                    <Button
                      disabled={!!busy}
                      onClick={() => act('Pay', () => insuranceService.payClaim(detail.id), 'Payout issued')}
                      className="font-black uppercase text-[10px] tracking-widest h-11"
                    >
                      <Banknote className="mr-2 h-4 w-4" /> Pay {detail.payoutAmount != null ? formatCurrency(detail.payoutAmount, currency) : ''}
                    </Button>
                  )}
                  {!['paid', 'rejected', 'withdrawn'].includes(detail.status) && (
                    <Button variant="destructive" disabled={!!busy} onClick={() => setRejectOpen(true)} className="font-black uppercase text-[10px] tracking-widest h-11">
                      <ShieldAlert className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  )}
                  {detail.status === 'paid' && (
                    <Button variant="outline" disabled={!!busy} onClick={() => setSubrogationOpen(true)} className="font-black uppercase text-[10px] tracking-widest h-11 border-2">
                      <Undo2 className="mr-2 h-4 w-4" /> Record recovery
                    </Button>
                  )}
                  {detail.status === 'evidence_required' && (
                    <p className="text-xs text-muted-foreground self-center">
                      Attach the outstanding documents above before this claim can be reviewed.
                    </p>
                  )}
                  {busy && <Loader2 className="h-4 w-4 animate-spin self-center opacity-50" />}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject this claim</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold uppercase">Reason</Label>
            <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Grounds for declining the claim" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || !!busy}
              onClick={async () => {
                if (!detail) return;
                await act('Reject', () => insuranceService.rejectClaim(detail.id, rejectReason.trim()), 'Claim rejected');
                setRejectOpen(false); setRejectReason('');
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subrogationOpen} onOpenChange={setSubrogationOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record a recovery from the carrier</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Having paid the assured, the insurer stands in their shoes against the carrier.
              Recorded amounts cannot exceed the {formatCurrency(detail?.payoutAmount || 0, currency)} paid out.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Amount recovered</Label>
              <Input type="number" min={0} value={recovered} onChange={(e) => setRecovered(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Reference</Label>
              <Input value={recoveryRef} onChange={(e) => setRecoveryRef(e.target.value)} placeholder="Carrier settlement reference" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubrogationOpen(false)}>Cancel</Button>
            <Button
              disabled={!recovered || !!busy}
              onClick={async () => {
                if (!detail) return;
                await act('Record recovery', () => insuranceService.recordSubrogation(detail.id, { recovered: Number(recovered), reference: recoveryRef || undefined }), 'Recovery recorded');
                setSubrogationOpen(false); setRecovered(''); setRecoveryRef('');
              }}
            >
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
