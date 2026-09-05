'use client';

/**
 * @file insurance/underwriters/page.tsx
 * @description Carriers and binders — whose balance sheet the cover sits on.
 *
 * The platform is a broker, not an insurer: a licensed carrier takes the risk under a
 * binding authority, and the platform retains a commission on gross premium. Cover
 * that no binder can take is written on Baalvion's OWN book, which is the exposure
 * this page exists to keep visible rather than buried.
 *
 * Capacity here is not a dashboard nicety. Exceeding a binder's aggregate or per-risk
 * limit breaches the delegated authority itself, so the server refuses to place over
 * it — these bars show how close each binder is to that line.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  insuranceService, Underwriter, UnderwriterStatus, BrokerSummary,
} from '@/services/insurance-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, ShieldCheck, AlertTriangle, Landmark, Info } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const STATUS_TONE: Record<UnderwriterStatus, string> = {
  bound: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  prospective: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-amber-50 text-amber-800 border-amber-200',
  expired: 'bg-muted text-muted-foreground',
  terminated: 'bg-red-50 text-red-700 border-red-200',
};

/** Utilisation is a warning, not decoration: past 80% a binder is nearly full. */
const utilisationTone = (u: number | null) =>
  u == null ? 'bg-muted' : u >= 0.9 ? 'bg-red-500' : u >= 0.75 ? 'bg-amber-500' : 'bg-emerald-500';

const pct = (n: number | null) => (n == null ? '—' : `${Math.round(n * 100)}%`);
const day = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—');

export default function UnderwritersPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Underwriter[]>([]);
  const [broker, setBroker] = useState<BrokerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', legalEntity: '', binderReference: '', status: 'prospective' as UnderwriterStatus,
    currency: 'USD', capacityLimit: '', perRiskLimit: '', commissionPct: '15',
    binderStart: '', binderEnd: '',
  });

  const load = useCallback(async () => {
    try {
      const [uws, summary] = await Promise.all([
        insuranceService.getUnderwriters(),
        insuranceService.summary(),
      ]);
      setRows(uws);
      setBroker(summary?.broker ?? null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not load binders', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    setSaving(true);
    try {
      await insuranceService.createUnderwriter({
        name: form.name,
        legalEntity: form.legalEntity || undefined,
        binderReference: form.binderReference || undefined,
        status: form.status,
        currency: form.currency,
        capacityLimit: form.capacityLimit ? Number(form.capacityLimit) : null,
        perRiskLimit: form.perRiskLimit ? Number(form.perRiskLimit) : null,
        // The form asks for a percentage because that is how a binder states it; the
        // API stores a fraction.
        commissionRate: Number(form.commissionPct) / 100,
        binderStart: form.binderStart || undefined,
        binderEnd: form.binderEnd || undefined,
      });
      toast({ title: `${form.name} recorded` });
      setOpen(false);
      setForm((f) => ({ ...f, name: '', legalEntity: '', binderReference: '', capacityLimit: '', perRiskLimit: '' }));
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not record the binder', description: e instanceof Error ? e.message : '' });
    } finally {
      setSaving(false);
    }
  }

  const currency = rows[0]?.currency || 'USD';

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cargo protection</p>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Underwriters &amp; binders</h2>
          <p className="text-muted-foreground font-medium max-w-2xl">
            A binder is a delegated authority to bind cover on a carrier&apos;s paper, up to a limit. Risk that no
            binder can take is written on this platform&apos;s own balance sheet.
          </p>
        </div>
        <Button className="font-black uppercase text-[10px] tracking-widest h-12 px-6" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record a binder
        </Button>
      </div>

      {broker && (
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: 'Commission earned', value: formatCurrency(broker.commissionEarned, currency), sub: 'Revenue — no risk attached', icon: Landmark, tone: 'text-emerald-600' },
            { label: 'Premium remitted', value: formatCurrency(broker.premiumRemitted, currency), sub: `${broker.placedPolicies} policies placed`, icon: ShieldCheck, tone: 'text-primary' },
            { label: 'Carrier settled on claims', value: formatCurrency(broker.carrierSettledOnClaims, currency), sub: 'Recovered from binders', icon: ShieldCheck, tone: 'text-blue-600' },
            {
              label: 'Platform-retained exposure',
              value: formatCurrency(broker.platformRetainedExposure, currency),
              sub: `${broker.retainedPolicies} policies on our own book`,
              icon: AlertTriangle,
              tone: broker.platformRetainedExposure > 0 ? 'text-red-600' : 'text-muted-foreground',
            },
          ].map((m) => (
            <Card key={m.label} className="border-2 shadow-sm rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-wide">{m.label}</CardTitle>
                <div className="p-2 rounded-xl bg-muted/50"><m.icon className={cn('h-4 w-4', m.tone)} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tighter">{m.value}</div>
                <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-tight opacity-60">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* The broker's OWN cover. Unfunded E&O is what actually ends broking
          businesses, so an absent or lapsed policy is stated first and plainly. */}
      {broker && !broker.indemnity.covered && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-5 flex gap-3 text-red-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-tight">No professional indemnity in force</p>
              <p className="text-xs leading-relaxed">
                {broker.indemnity.reason}. Placing a risk moves the LOSS to the carrier, but if cover fails to respond
                because of an error here — wrong sum insured, a fact not disclosed to the underwriter, a binder
                breached — the assured sues this platform, and there is nothing behind that claim.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {broker && broker.indemnity.covered && (
        <Card className="border-2 rounded-2xl">
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-tight">Professional indemnity in force</p>
                <p className="text-[11px] text-muted-foreground">
                  {broker.indemnity.insurer} · {broker.indemnity.policyNumber} · {broker.indemnity.basis?.replace('_', '-')}
                  {broker.indemnity.expiresAt ? ` · expires ${new Date(broker.indemnity.expiresAt).toLocaleDateString()}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Limit / retention</p>
              <p className="text-sm font-black">
                {formatCurrency(broker.indemnity.limit ?? 0, currency)}
                <span className="text-muted-foreground font-medium"> / {formatCurrency(broker.indemnity.retention ?? 0, currency)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {broker && broker.platformRetainedExposure > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardContent className="p-5 flex gap-3 text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              <strong>{formatCurrency(broker.platformRetainedExposure, currency)}</strong> of cover is written on this
              platform&apos;s own balance sheet across {broker.retainedPolicies} polic
              {broker.retainedPolicies === 1 ? 'y' : 'ies'} — no carrier is behind it. A total loss on any of them is
              paid by Baalvion. Placing this business needs either more binder capacity or a higher per-risk limit.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 shadow-none rounded-2xl">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-sm font-black uppercase tracking-wide">Binders</CardTitle>
          <CardDescription className="text-xs">
            Capacity is enforced when a risk is placed — a binder at its limit stops taking business.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-6">
              <p className="text-sm text-muted-foreground">
                No carrier relationships recorded. Until one is, every policy is carried by this platform itself.
              </p>
              <Button variant="outline" size="sm" className="font-bold" onClick={() => setOpen(true)}>Record a binder</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Carrier</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Binder</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Commission</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Per risk</TableHead>
                  <TableHead className="text-[10px] font-black uppercase w-[240px]">Capacity used</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Expires</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="text-xs font-black">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {u.legalEntity || '—'} · adapter {u.adapter}
                        {u.tenantId ? ' · own programme' : ' · open market'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-mono">{u.binderReference || '—'}</p>
                      {((u.territoriesExcluded?.length ?? 0) > 0 || (u.commoditiesExcluded?.length ?? 0) > 0) && (
                        <p className="text-[10px] text-amber-700 mt-1">
                          excludes {[...(u.territoriesExcluded || []), ...(u.commoditiesExcluded || [])].slice(0, 4).join(', ')}
                          {(u.territoriesExcluded?.length || 0) + (u.commoditiesExcluded?.length || 0) > 4 ? '…' : ''}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        premium {u.premiumHandling === 'trust' ? 'held in trust' : 'collected by carrier'}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs font-bold">{(u.commissionRate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-xs">{u.perRiskLimit != null ? formatCurrency(u.perRiskLimit, u.currency) : 'Unlimited'}</TableCell>
                    <TableCell>
                      {u.capacity ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span>{formatCurrency(u.capacity.used, u.currency)}</span>
                            <span className="text-muted-foreground">
                              {u.capacity.limit != null ? `of ${formatCurrency(u.capacity.limit, u.currency)}` : 'unlimited'}
                            </span>
                          </div>
                          {u.capacity.limit != null && (
                            <>
                              <Progress
                                value={(u.capacity.utilisation ?? 0) * 100}
                                className="h-1.5"
                                indicatorClassName={utilisationTone(u.capacity.utilisation)}
                              />
                              <p className="text-[10px] text-muted-foreground">
                                {pct(u.capacity.utilisation)} used · {formatCurrency(u.capacity.remaining ?? 0, u.currency)} left
                              </p>
                            </>
                          )}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs">{day(u.binderEnd)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[9px] font-black uppercase border-2', STATUS_TONE[u.status])}>
                        {u.status}
                      </Badge>
                      {!u.bindable && u.bindableReason && (
                        <p className="text-[10px] text-amber-700 mt-1">{u.bindableReason}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record a binder</DialogTitle>
            <DialogDescription>
              The delegated authority a carrier grants you. Its limits are enforced when risk is placed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Carrier</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Meridian Marine Syndicate" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Legal entity</Label>
                <Input value={form.legalEntity} onChange={(e) => setForm((f) => ({ ...f, legalEntity: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Binder reference</Label>
              <Input value={form.binderReference} onChange={(e) => setForm((f) => ({ ...f, binderReference: e.target.value }))} placeholder="The binding authority agreement" />
              <p className="text-[11px] text-muted-foreground">Required before a binder can be set to &apos;bound&apos; — no agreement, no authority to bind.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Aggregate capacity</Label>
                <Input type="number" min={0} value={form.capacityLimit} onChange={(e) => setForm((f) => ({ ...f, capacityLimit: e.target.value }))} placeholder="Blank = unlimited" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Per-risk limit</Label>
                <Input type="number" min={0} value={form.perRiskLimit} onChange={(e) => setForm((f) => ({ ...f, perRiskLimit: e.target.value }))} placeholder="Blank = unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Commission %</Label>
                <Input type="number" min={0} max={100} step="0.5" value={form.commissionPct} onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Incepts</Label>
                <Input type="date" value={form.binderStart} onChange={(e) => setForm((f) => ({ ...f, binderStart: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Expires</Label>
                <Input type="date" value={form.binderEnd} onChange={(e) => setForm((f) => ({ ...f, binderEnd: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as UnderwriterStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospective">Prospective — in discussion</SelectItem>
                  <SelectItem value="bound">Bound — authority is live</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 p-3 rounded-xl bg-muted/30 border text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Only a <strong>bound</strong> binder takes business. A settlement account is provisioned for it automatically so premium can be remitted.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.name || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
