'use client';

/**
 * @file insurance/general-average/page.tsx
 * @description General Average — the voyage-wide loss apportionment after a casualty.
 *
 * This is the mechanism behind "containers went over the side" that a cargo policy does
 * NOT answer on its own: when a master sacrifices cargo or incurs extraordinary expense
 * to save the voyage, every interest on that ship contributes in proportion to what it
 * had at risk — including owners whose own boxes arrived perfectly intact. Cargo is not
 * released at destination until security is posted.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  insuranceService, GeneralAverage, GeneralAverageContribution,
} from '@/services/insurance-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Ship, Plus, ShieldCheck, Banknote, Info } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const SECURITY_LABELS: Record<GeneralAverageContribution['securityType'], string> = {
  none: 'None posted',
  average_bond: 'Average bond',
  average_guarantee: 'Average guarantee',
  cash_deposit: 'Cash deposit',
};

export default function GeneralAveragePage() {
  const { toast } = useToast();
  const [list, setList] = useState<GeneralAverage[]>([]);
  const [selected, setSelected] = useState<GeneralAverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);

  const [declaration, setDeclaration] = useState({
    vesselName: '', voyageNo: '', averageAdjuster: '',
    sacrificeValue: '', salvageExpenses: '', currency: 'USD', notes: '',
  });
  const [contribution, setContribution] = useState({ cargoOwner: '', shipmentId: '', contributoryValue: '', policyId: '' });

  const refresh = useCallback(async (keepId?: string) => {
    try {
      const rows = await insuranceService.getGeneralAverages();
      setList(rows);
      const target = keepId || selected?.id || rows[0]?.id;
      if (target) setSelected(await insuranceService.getGeneralAverage(target));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not load general average', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [selected?.id, toast]);

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function open(id: string) {
    setSelected(await insuranceService.getGeneralAverage(id));
  }

  async function act(label: string, fn: () => Promise<unknown>, success: string) {
    setBusy(label);
    try {
      await fn();
      toast({ title: success });
      await refresh(selected?.id);
    } catch (e) {
      toast({ variant: 'destructive', title: `${label} failed`, description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  }

  const contributions = selected?.contributions || [];
  const allowance = selected ? selected.sacrificeValue + selected.salvageExpenses : 0;
  const apportioned = contributions.reduce((s, c) => s + c.contributionAmount, 0);

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cargo protection</p>
          <h2 className="text-3xl font-black tracking-tighter uppercase">General average</h2>
          <p className="text-muted-foreground font-medium max-w-2xl">
            When cargo is sacrificed to save the voyage, the loss is shared by every interest aboard in proportion
            to what each had at risk — insured or not, damaged or not.
          </p>
        </div>
        <Button className="font-black uppercase text-[10px] tracking-widest h-12 px-6" onClick={() => setDeclareOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Declare
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-2 shadow-none rounded-2xl h-fit">
          <CardHeader className="border-b bg-muted/10 py-5">
            <CardTitle className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              {list.length} declaration{list.length === 1 ? '' : 's'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {loading && <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin opacity-40" /></div>}
            {!loading && list.length === 0 && (
              <p className="py-12 px-6 text-center text-sm text-muted-foreground">
                No general average has been declared.
              </p>
            )}
            {list.map((ga) => (
              <button
                key={ga.id}
                onClick={() => open(ga.id)}
                className={cn('w-full text-left p-4 hover:bg-primary/[0.03]', selected?.id === ga.id && 'bg-primary/[0.05] border-l-4 border-l-primary')}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black truncate">{ga.vesselName || ga.id}</p>
                  <Badge variant="outline" className="text-[8px] font-black uppercase">{ga.status}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Voyage {ga.voyageNo || '—'}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {!selected ? (
            <Card className="border-2 shadow-none rounded-2xl">
              <CardContent className="py-24 text-center text-sm text-muted-foreground">Select a declaration.</CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-2 shadow-none rounded-2xl">
                <CardHeader className="border-b bg-muted/10 flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Ship className="h-4 w-4 text-primary" /> {selected.vesselName || selected.id}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Voyage {selected.voyageNo || '—'} · adjuster {selected.averageAdjuster || 'not appointed'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-2 h-7 px-3">{selected.status}</Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Sacrifice', value: formatCurrency(selected.sacrificeValue, selected.currency) },
                      { label: 'Salvage & expenses', value: formatCurrency(selected.salvageExpenses, selected.currency) },
                      { label: 'Contributory value', value: formatCurrency(selected.totalContributoryValue, selected.currency) },
                      {
                        label: 'Contribution rate',
                        value: selected.contributionRate != null ? `${(selected.contributionRate * 100).toFixed(4)}%` : 'Not apportioned',
                      },
                    ].map((m) => (
                      <div key={m.label} className="p-3 rounded-xl border-2 bg-muted/10">
                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">{m.label}</p>
                        <p className="text-sm font-black tracking-tight mt-1">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 p-4 rounded-xl border bg-muted/10">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 opacity-60" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      The adjuster divides the allowance ({formatCurrency(allowance, selected.currency)}) by the total
                      contributory value of the adventure to get the rate; each interest pays its own value times that
                      rate. {selected.contributionRate != null
                        ? `Apportioned so far: ${formatCurrency(apportioned, selected.currency)}.`
                        : 'Add the cargo interests below to apportion it.'}
                    </p>
                  </div>

                  {selected.notes && <p className="text-sm text-muted-foreground">{selected.notes}</p>}
                </CardContent>
              </Card>

              <Card className="border-2 shadow-none rounded-2xl">
                <CardHeader className="border-b bg-muted/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-wide">Cargo interests</CardTitle>
                    <CardDescription className="text-xs">Cargo is not released until security is posted.</CardDescription>
                  </div>
                  {!['settled', 'closed'].includes(selected.status) && (
                    <Button size="sm" variant="outline" className="font-black text-[10px] uppercase border-2" onClick={() => setContribOpen(true)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add interest
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {contributions.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No interests enrolled yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-black uppercase">Cargo owner</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Contributory value</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Owes</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Security</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contributions.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="text-xs font-bold">{c.cargoOwner || c.shipmentId || c.id}</TableCell>
                            <TableCell className="text-xs">{formatCurrency(c.contributoryValue, selected.currency)}</TableCell>
                            <TableCell className="text-xs font-black">{formatCurrency(c.contributionAmount, selected.currency)}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[9px] font-black uppercase">
                                {c.status === 'pending' ? SECURITY_LABELS.none : SECURITY_LABELS[c.securityType]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {c.status === 'pending' && (
                                <Button
                                  size="sm" variant="outline" className="text-[10px] font-black uppercase"
                                  disabled={!!busy}
                                  onClick={() => act('Post security', () => insuranceService.secureContribution(selected.id, c.id, 'average_bond', `BOND-${c.id.slice(-6)}`), 'Average bond recorded')}
                                >
                                  <ShieldCheck className="mr-1.5 h-3 w-3" /> Post bond
                                </Button>
                              )}
                              {c.status === 'secured' && (
                                <Button
                                  size="sm" className="text-[10px] font-black uppercase"
                                  disabled={!!busy}
                                  onClick={() => act('Settle', () => insuranceService.settleContribution(selected.id, c.id), 'Contribution settled')}
                                >
                                  <Banknote className="mr-1.5 h-3 w-3" /> Settle
                                </Button>
                              )}
                              {c.status === 'settled' && <span className="text-[11px] text-muted-foreground">Settled</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={declareOpen} onOpenChange={setDeclareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare general average</DialogTitle>
            <DialogDescription>Made by the shipowner for the whole voyage after a casualty.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Vessel</Label>
                <Input value={declaration.vesselName} onChange={(e) => setDeclaration((d) => ({ ...d, vesselName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Voyage</Label>
                <Input value={declaration.voyageNo} onChange={(e) => setDeclaration((d) => ({ ...d, voyageNo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Average adjuster</Label>
              <Input value={declaration.averageAdjuster} onChange={(e) => setDeclaration((d) => ({ ...d, averageAdjuster: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Sacrifice value</Label>
                <Input type="number" min={0} value={declaration.sacrificeValue} onChange={(e) => setDeclaration((d) => ({ ...d, sacrificeValue: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Salvage & expenses</Label>
                <Input type="number" min={0} value={declaration.salvageExpenses} onChange={(e) => setDeclaration((d) => ({ ...d, salvageExpenses: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Notes</Label>
              <Textarea rows={3} value={declaration.notes} onChange={(e) => setDeclaration((d) => ({ ...d, notes: e.target.value }))} placeholder="Circumstances of the casualty" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclareOpen(false)}>Cancel</Button>
            <Button
              disabled={!declaration.vesselName || !!busy}
              onClick={async () => {
                const created = await insuranceService.declareGeneralAverage({
                  vesselName: declaration.vesselName,
                  voyageNo: declaration.voyageNo,
                  averageAdjuster: declaration.averageAdjuster,
                  sacrificeValue: Number(declaration.sacrificeValue) || 0,
                  salvageExpenses: Number(declaration.salvageExpenses) || 0,
                  currency: declaration.currency,
                  notes: declaration.notes,
                }).catch((e) => {
                  toast({ variant: 'destructive', title: 'Declaration failed', description: e instanceof Error ? e.message : '' });
                  return null;
                });
                if (created) {
                  toast({ title: 'General average declared' });
                  setDeclareOpen(false);
                  await refresh(created.id);
                }
              }}
            >
              Declare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a cargo interest</DialogTitle>
            <DialogDescription>
              Contributory value is what the interest was worth at the end of the adventure, not the invoice value.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Cargo owner</Label>
              <Input value={contribution.cargoOwner} onChange={(e) => setContribution((c) => ({ ...c, cargoOwner: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Shipment id</Label>
              <Input value={contribution.shipmentId} onChange={(e) => setContribution((c) => ({ ...c, shipmentId: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Contributory value</Label>
              <Input type="number" min={0} value={contribution.contributoryValue} onChange={(e) => setContribution((c) => ({ ...c, contributoryValue: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Policy id (if insured)</Label>
              <Input value={contribution.policyId} onChange={(e) => setContribution((c) => ({ ...c, policyId: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribOpen(false)}>Cancel</Button>
            <Button
              disabled={!contribution.contributoryValue || !!busy}
              onClick={async () => {
                if (!selected) return;
                await act('Add interest', () => insuranceService.addContribution(selected.id, {
                  cargoOwner: contribution.cargoOwner || undefined,
                  shipmentId: contribution.shipmentId || undefined,
                  contributoryValue: Number(contribution.contributoryValue),
                  policyId: contribution.policyId || undefined,
                }), 'Interest enrolled and the adjustment re-apportioned');
                setContribOpen(false);
                setContribution({ cargoOwner: '', shipmentId: '', contributoryValue: '', policyId: '' });
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
