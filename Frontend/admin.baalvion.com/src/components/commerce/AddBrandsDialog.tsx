'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusCircle, Layers, ListPlus, Check, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { commerceStoresApi } from '@/lib/api/commerce-stores';
import { useCommerceCategories, useCommerceStores } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { applyPlan } from '@/lib/commerce/applyPlan';
import { buildBrandPlan, parseSections, norm, SUGGESTED_BAG_BRANDS, SUGGESTED_JEWELRY_BRANDS, type BrandInput } from '@/lib/commerce/newBrands';
import { cn } from '@/lib/utils/cn';

const messageOf = (e: unknown) =>
  (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
  ?? (e as { message?: string })?.message ?? 'Something went wrong';

type Mode = 'under-other' | 'under-jewelry' | 'own';

export default function AddBrandsDialog() {
  const qc = useQueryClient();
  const { activeStoreId } = useCommerceStore();
  const { data: tree = [] } = useCommerceCategories(activeStoreId ?? '');
  const { data: storesData } = useCommerceStores({ limit: 200 });
  const stores = useMemo(() => (storesData?.data ?? []).filter((s) => s.code?.toLowerCase().startsWith('amarise')), [storesData]);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('under-other');
  const [names, setNames] = useState('');
  const [brand, setBrand] = useState('');
  const [sectionsText, setSectionsText] = useState('Handbags: \nAccessories: ');
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; ok: boolean; message: string }[] | null>(null);

  const parsed = useMemo(() => parseSections(sectionsText), [sectionsText]);
  const existingNames = useMemo(() => new Set(tree.flatMap((b) => [b, ...(b.children ?? [])]).map((c) => norm(c.name))), [tree]);
  const typed = useMemo(() => new Set(names.split('\n').map((n) => norm(n)).filter(Boolean)), [names]);
  const toggleName = (n: string) => setNames((cur) => {
    const lines = cur.split('\n').filter((l) => l.trim());
    return lines.some((l) => norm(l) === norm(n)) ? lines.filter((l) => norm(l) !== norm(n)).join('\n') : [...lines, n].join('\n');
  });
  const suggestions = mode === 'under-jewelry' ? SUGGESTED_JEWELRY_BRANDS : SUGGESTED_BAG_BRANDS;
  const input: BrandInput = useMemo(
    () => (mode === 'own'
      ? { mode, brand, sections: parsed.sections }
      : { mode, names: names.split('\n') }),
    [mode, names, brand, parsed.sections],
  );
  const preview = useMemo(() => buildBrandPlan(tree, input), [tree, input]);
  const inputErrors = mode === 'own' && sectionsText.trim() ? parsed.errors : [];
  const targets = stores.filter((s) => (chosen[s.id] ?? s.id === activeStoreId));
  const canApply = preview.steps.length > 0 && preview.errors.length === 0 && inputErrors.length === 0 && targets.length > 0 && !busy;

  const apply = async () => {
    setBusy(true);
    const out: { id: string; ok: boolean; message: string }[] = [];
    for (const s of targets) {
      try {
        const res = await commerceStoresApi.categories.list(s.id);
        const plan = buildBrandPlan(res.data.data ?? [], input);
        if (plan.errors.length) throw new Error(plan.errors[0]);
        if (plan.steps.length === 0) { out.push({ id: s.id, ok: true, message: 'Nothing new to add' }); continue; }
        await applyPlan(s.id, plan);
        out.push({ id: s.id, ok: true, message: `Added ${plan.summary.items} item${plan.summary.items === 1 ? '' : 's'}` });
      } catch (e) {
        out.push({ id: s.id, ok: false, message: messageOf(e) });
      }
    }
    setResults(out);
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ['commerce'] });
    const bad = out.filter((r) => !r.ok).length;
    if (bad) toast.warning(`${out.length - bad} store(s) updated, ${bad} could not be.`); else toast.success('Brands added.');
  };

  const reset = () => { setResults(null); setNames(''); setBrand(''); setSectionsText('Handbags: \nAccessories: '); };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!activeStoreId}><PlusCircle className="mr-2 h-4 w-4" />Add brands</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add brands</DialogTitle>
          <DialogDescription>Nothing existing is changed or deleted. You see exactly what will be added before you confirm.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Where should the brand appear?">
          {([
            { v: 'under-other', icon: ListPlus, title: 'Under “Other Brands”', text: 'Bag and fashion brands, like Fendi or The Row. Add many at once.' },
            { v: 'under-jewelry', icon: ListPlus, title: 'Under “Jewelry”', text: 'Jewelry and watch brands, like Cartier. Add many at once.' },
            { v: 'own', icon: Layers, title: 'Its own menu', text: 'For a main brand with sections, like Hermès (Handbags, Accessories…).' },
          ] as const).map((o) => (
            <button key={o.v} type="button" role="radio" aria-checked={mode === o.v} onClick={() => setMode(o.v)}
              className={cn('flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50', mode === o.v && 'border-primary ring-1 ring-primary')}>
              <o.icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span><span className="block text-sm font-medium">{o.title}</span><span className="block text-xs text-muted-foreground">{o.text}</span></span>
            </button>
          ))}
        </div>

        {mode !== 'own' ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Quick pick <span className="font-normal text-muted-foreground">(suggestions only. Tick the ones you actually sell)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((n) => {
                  const have = existingNames.has(norm(n));
                  const on = typed.has(norm(n));
                  return (
                    <button key={n} type="button" disabled={have} onClick={() => toggleName(n)} aria-pressed={on}
                      className={cn('rounded-full border px-3 py-1 text-xs transition-colors', have ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted', on && 'border-primary bg-primary/10 font-medium')}>
                      {on && <Check className="mr-1 inline h-3 w-3" />}{n}{have && ' · already added'}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-names">Brand names, one per line</Label>
              <Textarea id="brand-names" rows={5} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Type or paste your own brands here'} />
              <p className="text-xs text-muted-foreground">Paste as many as you like. Brands that already exist are skipped.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Brand name</Label>
              <Input id="brand-name" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Cartier" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-sections">Sections and items</Label>
              <Textarea id="brand-sections" rows={6} className="font-mono text-xs" value={sectionsText} onChange={(e) => setSectionsText(e.target.value)} />
              <p className="text-xs text-muted-foreground">One section per line: <code>Section: item, item, item</code>. For example <code>Handbags: Classic Flap, Mini Bag</code>.</p>
            </div>
          </div>
        )}

        {/* Live preview of exactly what will happen */}
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          {[...preview.errors, ...inputErrors].length > 0 ? (
            <ul className="space-y-1 text-destructive">
              {[...preview.errors, ...inputErrors].map((e) => <li key={e} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{e}</li>)}
            </ul>
          ) : preview.steps.length === 0 ? (
            <p className="text-muted-foreground">Type a brand above to see what will be added.</p>
          ) : (
            <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />
              Will add <strong>{preview.summary.brands} brand{preview.summary.brands === 1 ? '' : 's'}</strong> with <strong>{preview.summary.items} item{preview.summary.items === 1 ? '' : 's'}</strong> to the shop.
            </p>
          )}
          {preview.warnings.map((w) => <p key={w} className="mt-1 text-xs text-muted-foreground">Note: {w}</p>)}
        </div>

        {stores.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Add to which stores?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {stores.map((s) => {
                const r = results?.find((x) => x.id === s.id);
                return (
                  <label key={s.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                    <Checkbox checked={chosen[s.id] ?? s.id === activeStoreId} disabled={busy} onCheckedChange={(v) => setChosen((c) => ({ ...c, [s.id]: !!v }))} className="mt-0.5" />
                    <span className="min-w-0"><span className="block truncate">{s.name} <span className="text-xs text-muted-foreground">· {s.countryCode}</span></span>
                      {r && <span className={cn('block text-xs', r.ok ? 'text-green-700' : 'text-destructive')}>{r.ok ? r.message : `Not updated: ${r.message}`}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>{results ? 'Close' : 'Cancel'}</Button>
          {!results && <Button onClick={apply} disabled={!canApply}>{busy ? 'Adding…' : 'Add to shop'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
