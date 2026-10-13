'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wand2, Check, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { commerceStoresApi } from '@/lib/api/commerce-stores';
import { commerceKeys, useCommerceStores } from '@/lib/queries/commerce-stores.queries';
import { buildPlan, type Plan } from '@/lib/commerce/amariseStructure';
import { applyPlan } from '@/lib/commerce/applyPlan';
import type { CommerceStore } from '@/lib/types/commerce.types';

type Loaded = { store: CommerceStore; plan: Plan | null; error?: string };
type Result = { storeId: string; ok: boolean; message: string };

const messageOf = (e: unknown) =>
  (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
  ?? (e as { message?: string })?.message ?? 'Something went wrong';

const needsWork = (p: Plan | null) => !!p && p.steps.length > 0;

export default function StructureSetupDialog() {
  const qc = useQueryClient();
  const { data } = useCommerceStores({ limit: 200 });
  const stores = (data?.data ?? []).filter((s) => s.code?.toLowerCase().startsWith('amarise'));
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Loaded[] | null>(null);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  const load = useCallback(async () => {
    setLoaded(null); setResults(null);
    const out: Loaded[] = [];
    for (const store of stores) {
      try {
        const res = await commerceStoresApi.categories.list(store.id);
        out.push({ store, plan: buildPlan(res.data.data ?? []) });
      } catch (e) {
        out.push({ store, plan: null, error: messageOf(e) });
      }
    }
    setLoaded(out);
    setChosen(Object.fromEntries(out.filter((l) => needsWork(l.plan)).map((l) => [l.store.id, true])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores.map((s) => s.id).join(',')]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const apply = async () => {
    const todo = (loaded ?? []).filter((l) => chosen[l.store.id] && l.plan && needsWork(l.plan));
    setBusy(true);
    const res: Result[] = [];
    for (const l of todo) {
      try {
        await applyPlan(l.store.id, l.plan!);
        res.push({ storeId: l.store.id, ok: true, message: 'Done' });
      } catch (e) {
        res.push({ storeId: l.store.id, ok: false, message: messageOf(e) });
      }
    }
    setResults(res);
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ['commerce'] });
    qc.invalidateQueries({ queryKey: commerceKeys.stores.all });
    const bad = res.filter((r) => !r.ok).length;
    if (bad) toast.warning(`${res.length - bad} store(s) done, ${bad} could not be updated.`); else toast.success('Shop structure is set up.');
  };

  const total = (loaded ?? []).filter((l) => chosen[l.store.id] && l.plan).reduce((n, l) => n + (l.plan?.steps.length ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={stores.length === 0}><Wand2 className="mr-2 h-4 w-4" />Set up standard structure</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set up the standard Amarisé structure</DialogTitle>
          <DialogDescription>
            Organises each brand into its sections (for example Hermès → Handbags, Accessories, Curations), in the same order as the website menu. Nothing is deleted, products are never touched, and running it again changes nothing.
          </DialogDescription>
        </DialogHeader>

        {!loaded ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking your stores…</p>
        ) : (
          <div className="space-y-3">
            {loaded.map((l) => {
              const r = results?.find((x) => x.storeId === l.store.id);
              const work = needsWork(l.plan);
              return (
                <div key={l.store.id} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={!!chosen[l.store.id]} disabled={!work || busy} onCheckedChange={(v) => setChosen((c) => ({ ...c, [l.store.id]: !!v }))} className="mt-1" aria-label={`Include ${l.store.name}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{l.store.name} <span className="text-xs font-normal text-muted-foreground">· {l.store.countryCode}</span></p>
                      {l.error ? (
                        <p className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" />Could not read this store: {l.error}</p>
                      ) : !work ? (
                        <p className="flex items-center gap-1 text-xs text-green-700"><Check className="h-3.5 w-3.5" />Already set up. Nothing to do.</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {l.plan!.counts.create > 0 && <><strong className="text-foreground">{l.plan!.counts.create}</strong> to add · </>}
                          <strong className="text-foreground">{l.plan!.counts.organise}</strong> to put in order
                          {l.plan!.counts.rename > 0 && <> · <strong className="text-foreground">{l.plan!.counts.rename}</strong> to rename</>}
                          {l.plan!.counts.keptAsOther > 0 && <> · {l.plan!.counts.keptAsOther} kept under “Other”</>}
                        </p>
                      )}
                      {l.plan?.warnings.map((w) => <p key={w} className="mt-1 text-[11px] text-muted-foreground">Note: {w}</p>)}
                      {r && <p className={`mt-1 text-xs ${r.ok ? 'text-green-700' : 'text-destructive'}`}>{r.ok ? 'Updated.' : `Not updated: ${r.message}`}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>{results ? 'Close' : 'Cancel'}</Button>
          {!results && <Button onClick={apply} disabled={busy || !loaded || total === 0}>{busy ? 'Setting up…' : `Apply (${total} changes)`}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
