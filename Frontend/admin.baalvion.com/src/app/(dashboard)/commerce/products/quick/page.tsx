'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Check, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ProductPhotos from '@/components/commerce/ProductPhotos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBulkUpdateProducts, useCreateProduct } from '@/lib/queries/commerce-products.queries';
import { useCommerceCategories } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { productMediaApi } from '@/lib/api/product-media';
import { flattenCategoryPaths } from '@/lib/utils/categoryPaths';
import { placeholderReasons, splitList } from '@/lib/commerce/placeholders';

// Phone-first: photos, name, category, price. Four things, big controls, then "Save and add another".
export default function QuickAddPage() {
  const { activeStoreId, activeStore } = useCommerceStore();
  const storeId = activeStoreId ?? '';
  const currency = activeStore?.currencyCode ?? 'USD';
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { data: categories } = useCommerceCategories(storeId);
  const createProduct = useCreateProduct(storeId);
  const bulk = useBulkUpdateProducts(storeId);
  const options = useMemo(() => flattenCategoryPaths(categories ?? []), [categories]);

  const [photos, setPhotos] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [filter, setFilter] = useState('');
  const [price, setPrice] = useState('');
  const [colors, setColors] = useState('');
  const [busy, setBusy] = useState<null | 'draft' | 'publish'>(null);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => { setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Products', href: '/commerce/products' }, { label: 'Quick add' }]); }, [setBreadcrumbs]);

  const priceNum = price.trim() === '' ? null : Number(price);
  const bad = placeholderReasons({ colors: splitList(colors) }).length > 0;
  const steps = [
    { label: 'Photo', ok: photos.length > 0 },
    { label: 'Name', ok: name.trim().length > 0 },
    { label: 'Category', ok: !!categoryId },
    { label: 'Price', ok: priceNum != null && priceNum > 0 },
  ];
  const ready = steps.every((s) => s.ok) && !bad;
  const shown = options.filter((c) => !filter.trim() || c.label.toLowerCase().includes(filter.trim().toLowerCase()));

  const save = async (publish: boolean) => {
    if (!name.trim()) { toast.error('Please type the product name.'); return; }
    if (priceNum != null && !(priceNum >= 0)) { toast.error('Enter the price as a plain number, like 4500.'); return; }
    if (bad) { toast.error('The colour looks like a placeholder. Enter the real colour or clear it.'); return; }
    setBusy(publish ? 'publish' : 'draft');
    try {
      const res = await createProduct.mutateAsync({
        name: name.trim(),
        categoryId: categoryId || undefined,
        price: priceNum ?? 0,
        stockQuantity: 1,
        customFields: { basePrice: priceNum ?? undefined, priceVisible: true, colors: splitList(colors), listingStatus: 'Ready' },
      } as never);
      const id = res.data.data.id;
      let failed = 0;
      for (const [i, f] of photos.entries()) {
        try { await productMediaApi.upload(storeId, id, f, { isFeatured: i === 0 }); } catch { failed++; }
      }
      if (failed) toast.warning(`${failed} photo${failed > 1 ? 's' : ''} did not upload. Open the product to add them.`);
      if (publish && ready && failed === 0) await bulk.mutateAsync({ ids: [id], action: 'publish' });
      setAdded((a) => [name.trim(), ...a].slice(0, 5));
      // Ready for the next one; the category stays because batches usually share it.
      setPhotos([]); setName(''); setPrice(''); setColors('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { /* the mutation hooks already explain the failure */ } finally { setBusy(null); }
  };

  if (!storeId) {
    return <div className="py-20 text-center"><p className="mb-4 text-muted-foreground">Pick a store first.</p><Button asChild variant="outline"><Link href="/commerce">Go to Commerce</Link></Button></div>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-28">
      <PageHeader
        title="Quick add"
        description={`Four things and it is saved to ${activeStore?.name ?? 'your store'}.`}
        actions={<Button size="sm" variant="outline" asChild><Link href="/commerce/products"><ArrowLeft className="mr-2 h-4 w-4" />Products</Link></Button>}
      />

      {added.length > 0 && (
        <div className="rounded-lg border border-green-500/40 bg-green-50 p-3 text-sm dark:bg-green-500/10">
          <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-green-600" />Added {added.length === 1 ? added[0] : `${added.length} products`}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">The form is clear for the next one. {added.length > 1 && `Latest: ${added[0]}.`}</p>
        </div>
      )}

      <ol className="flex items-center justify-between gap-1 text-[11px]" aria-label="Progress">
        {steps.map((s) => (
          <li key={s.label} className="flex flex-1 flex-col items-center gap-1">
            {s.ok ? <Check className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
            <span className={s.ok ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
          </li>
        ))}
      </ol>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">1. Photos</h2>
        <ProductPhotos storeId={storeId} pending={photos} onPendingChange={setPhotos} />
      </section>

      <section className="space-y-2">
        <Label htmlFor="q-name" className="text-base font-semibold">2. Name</Label>
        <Input id="q-name" value={name} maxLength={500} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hermès Birkin 30 Togo Gold" className="h-12 text-base" autoComplete="off" />
      </section>

      <section className="space-y-2">
        <Label className="text-base font-semibold">3. Category</Label>
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Type to search, e.g. Birkin" className="h-12 text-base" />
        <Select value={categoryId || 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)}>
          <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Choose where it appears" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="none">Not chosen yet</SelectItem>
            {shown.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-2">
        <Label htmlFor="q-price" className="text-base font-semibold">4. Price ({currency})</Label>
        <Input id="q-price" type="number" inputMode="decimal" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 18500" className="h-12 text-lg" />
        <p className="text-xs text-muted-foreground">Plain number. Other countries see it converted automatically.</p>
      </section>

      <section className="space-y-2">
        <Label htmlFor="q-colors" className="text-sm font-medium">Colour <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id="q-colors" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="e.g. Gold" className="h-11" />
      </section>

      {/* Thumb-reach action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl gap-2">
          <Button className="h-12 flex-1 text-base" variant="outline" disabled={!!busy || !name.trim()} onClick={() => void save(false)}>
            {busy === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save as draft'}
          </Button>
          <Button className="h-12 flex-1 text-base" disabled={!!busy || !ready} onClick={() => void save(true)}>
            {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & publish'}
          </Button>
        </div>
        {!ready && <p className="mx-auto mt-1 max-w-xl text-center text-[11px] text-muted-foreground">Publish unlocks when all four are ticked.</p>}
      </div>
    </div>
  );
}
