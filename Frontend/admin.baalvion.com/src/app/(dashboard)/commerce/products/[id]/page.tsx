'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Check, Circle, Eye, EyeOff, Plus, Save, Trash2, Lightbulb, ChevronDown } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import ProductPhotos from '@/components/commerce/ProductPhotos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useProduct, useUpdateProduct, useCreateProduct, useBulkUpdateProducts,
  useVariants, useCreateVariant, useUpdateVariant, useDeleteVariant,
} from '@/lib/queries/commerce-products.queries';
import { useProductMedia } from '@/lib/queries/product-media.queries';
import { productMediaApi } from '@/lib/api/product-media';
import { useCommerceCategories } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatMoney } from '@/lib/utils/format';
import { flattenCategoryPaths } from '@/lib/utils/categoryPaths';
import { placeholderReasons, splitList } from '@/lib/commerce/placeholders';

// The storefront reads the price from customFields.basePrice, falling back to the default variant.
// Amounts are whole currency units (USD), never cents.
function displayPrice(product: { customFields?: Record<string, unknown> }, variants?: { price: number; isDefault: boolean }[]) {
  const cf = product.customFields?.basePrice;
  if (cf != null && cf !== '') return String(cf);
  const v = variants?.find((x) => x.isDefault) ?? variants?.[0];
  return v ? String(Number(v.price)) : '';
}

const textareaClass =
  'w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none';

function StepCard({ n, title, tag, hint, children }: { n: number; title: string; tag: 'Required' | 'Optional'; hint: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{n}</span>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {title}
              <Badge variant={tag === 'Required' ? 'default' : 'secondary'} className="text-[10px] font-medium">{tag}</Badge>
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">{hint}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const presetCategory = useSearchParams().get('category') ?? '';
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId, activeStore } = useCommerceStore();
  const storeId = activeStoreId ?? '';
  const isNew = params.id === 'new';
  const currency = activeStore?.currencyCode ?? 'USD';

  const { data: product, isLoading } = useProduct(storeId, isNew ? '' : params.id);
  const { data: variants } = useVariants(storeId, isNew ? '' : params.id);
  const { data: categories } = useCommerceCategories(storeId);
  const { data: media } = useProductMedia(storeId, isNew ? '' : params.id);

  const updateProduct = useUpdateProduct(storeId, params.id);
  const createProduct = useCreateProduct(storeId);
  // Bulk "publish" is the direct-to-live path; the single-product publish only submits for
  // marketplace moderation, which Amarisé does not use.
  const bulkUpdate = useBulkUpdateProducts(storeId);
  const createVariant = useCreateVariant(storeId, params.id);
  const updateVariant = useUpdateVariant(storeId, params.id);
  const deleteVariant = useDeleteVariant(storeId, params.id);
  const categoryOptions = useMemo(() => flattenCategoryPaths(categories ?? []), [categories]);

  const [form, setForm] = useState({
    name: '', shortDescription: '', description: '', sku: '', basePrice: '', compareAtPrice: '',
    categoryId: presetCategory, stockQuantity: '1', tags: '', colors: '',
  });
  const [priceVisible, setPriceVisible] = useState(true);
  const [extras, setExtras] = useState({ collectorValue: '', marketRange: '', investmentInsight: '', scarcityTag: '' });
  const [pending, setPending] = useState<File[]>([]);
  const [catFilter, setCatFilter] = useState('');
  const [newVariant, setNewVariant] = useState({ name: '', sku: '', price: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name ?? '',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      sku: product.sku ?? '',
      basePrice: displayPrice(product, variants),
      compareAtPrice: product.customFields?.compareAtPrice != null ? String(product.customFields.compareAtPrice) : '',
      categoryId: product.categoryId ?? '',
      stockQuantity: String((product as { stockQuantity?: number }).stockQuantity ?? 0),
      tags: (product.tags ?? []).join(', '),
      colors: Array.isArray(product.customFields?.colors) ? (product.customFields!.colors as string[]).join(', ') : '',
    });
    const cf = product.customFields ?? {};
    const s = (v: unknown) => (typeof v === 'string' ? v : '');
    setExtras({ collectorValue: s(cf.collectorValue), marketRange: s(cf.marketRange), investmentInsight: s(cf.investmentInsight), scarcityTag: s(cf.scarcityTag) });
    setPriceVisible(cf.priceVisible !== false);
  }, [product, variants]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Commerce', href: '/commerce' },
      { label: 'Products', href: '/commerce/products' },
      { label: isNew ? 'New product' : (product?.name ?? 'Loading…') },
    ]);
  }, [setBreadcrumbs, isNew, product?.name]);

  const priceNum = form.basePrice.trim() === '' ? null : Number(form.basePrice);
  const placeholders = placeholderReasons({ description: form.description, colors: splitList(form.colors), listingStatus: product?.customFields?.listingStatus });
  // The setup marker clears itself on save, so only real placeholder content blocks publishing.
  const blockingPlaceholders = placeholders.filter((r) => !r.includes('Pending Real Details'));
  const photoCount = isNew ? pending.length : (media?.length ?? 0);
  const checklist = [
    { label: 'A name', ok: form.name.trim().length > 0 },
    { label: 'A category (where it appears in the shop)', ok: !!form.categoryId },
    { label: 'A price', ok: priceNum != null && priceNum > 0 },
    { label: 'At least one photo', ok: photoCount > 0 },
    { label: 'No placeholder text left', ok: blockingPlaceholders.length === 0 },
  ];
  const ready = checklist.every((c) => c.ok);
  const status = product?.status ?? 'draft';
  const live = status === 'published';

  const shownCats = categoryOptions.filter((c) => !catFilter.trim() || c.label.toLowerCase().includes(catFilter.trim().toLowerCase()));

  const customFieldsFor = () => ({
    ...(product?.customFields ?? {}),
    basePrice: priceNum ?? undefined,
    compareAtPrice: form.compareAtPrice.trim() === '' ? undefined : Number(form.compareAtPrice),
    collectorValue: extras.collectorValue.trim() || undefined,
    marketRange: extras.marketRange.trim() || undefined,
    investmentInsight: extras.investmentInsight.trim() || undefined,
    scarcityTag: extras.scarcityTag.trim() || undefined,
    priceVisible,
    colors: splitList(form.colors),
    // Once nothing placeholder-like is left, drop the setup marker so the product reads as finished.
    ...(blockingPlaceholders.length === 0 ? { listingStatus: 'Ready' } : {}),
  });

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Please give the product a name.';
    if (priceNum != null && !(priceNum >= 0)) return 'Enter the price as a plain number, like 4500.';
    if (form.compareAtPrice.trim() !== '' && !(Number(form.compareAtPrice) >= 0)) return 'The original price must be a plain number.';
    return null;
  };

  const save = async (andPublish = false) => {
    const problem = validate();
    if (problem) { toast.error(problem); return; }
    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const stock = Math.max(0, Math.floor(Number(form.stockQuantity) || 0));
    setSaving(true);
    try {
      if (isNew) {
        const res = await createProduct.mutateAsync({
          name: form.name.trim(),
          shortDescription: form.shortDescription || undefined,
          description: form.description || undefined,
          sku: form.sku || undefined,
          categoryId: form.categoryId || undefined,
          price: priceNum ?? 0,
          tags,
          customFields: customFieldsFor(),
          stockQuantity: stock,
        } as never);
        const id = res.data.data.id;
        let failed = 0;
        for (const [i, file] of pending.entries()) {
          try { await productMediaApi.upload(storeId, id, file, { isFeatured: i === 0 }); } catch { failed++; }
        }
        if (failed) toast.warning(`${failed} photo${failed > 1 ? 's' : ''} did not upload. Add them below.`);
        if (andPublish && ready && failed === 0) await bulkUpdate.mutateAsync({ ids: [id], action: 'publish' });
        router.replace(`/commerce/products/${id}`);
        return;
      }
      await updateProduct.mutateAsync({
        name: form.name.trim(),
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        sku: form.sku || undefined,
        categoryId: form.categoryId || null,
        tags,
        customFields: customFieldsFor(),
        stockQuantity: stock,
      } as never);
      const def = variants?.find((v) => v.isDefault) ?? variants?.[0];
      if (def && priceNum != null && Number(def.price) !== priceNum) {
        await updateVariant.mutateAsync({ variantId: def.id, payload: { price: priceNum, compareAtPrice: form.compareAtPrice.trim() === '' ? null : Number(form.compareAtPrice) } });
      }
      if (andPublish && ready && !live) await bulkUpdate.mutateAsync({ ids: [params.id], action: 'publish' });
    } catch {
      /* the mutation hooks already show the reason */
    } finally {
      setSaving(false);
    }
  };

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">Pick a store first from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }
  if (!isNew && isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" />{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>;
  }

  const busy = saving || createProduct.isPending || updateProduct.isPending || bulkUpdate.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'Add a product' : (product?.name ?? '')}
        description={isNew ? `Adding to ${activeStore?.name ?? 'your store'}. Follow the steps below.` : undefined}
        titleAdornment={!isNew ? <StatusBadge status={live ? 'published' : status} /> : undefined}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href="/commerce/products"><ArrowLeft className="mr-2 h-4 w-4" />All products</Link>
          </Button>
        }
      />

      {placeholders.length > 0 && (
        <Card className={live ? 'border-destructive/60 bg-destructive/5' : 'border-amber-400/60 bg-amber-50 dark:bg-amber-500/10'}>
          <CardContent className="space-y-1.5 py-4 text-sm">
            <p className="font-semibold">{live ? 'This product is LIVE on the website but still has setup placeholder text.' : 'This product still has setup placeholder text.'}</p>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">{placeholders.map((r) => <li key={r}>{r}</li>)}</ul>
            {live && <p className="text-xs">Fix it below, or click <strong>Take off the website</strong> until the real details are ready.</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Steps ── */}
        <div className="space-y-6 lg:col-span-2">
          <StepCard n={1} title="What is it?" tag="Required" hint="The name customers see, and where it belongs in the shop.">
            <div className="space-y-1.5">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" value={form.name} maxLength={500} placeholder="e.g. Hermès Birkin 30 Togo Gold" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={catFilter} onChange={(e) => setCatFilter(e.target.value)} placeholder="Type to search categories, e.g. Birkin" className="h-9" />
              <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Choose where it appears" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not chosen yet</SelectItem>
                  {shownCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  {shownCats.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No category matches “{catFilter}”.</div>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Pick the most specific one. Brand › Category, for example “Hermès › Birkin Bags”.</p>
            </div>
          </StepCard>

          <StepCard n={2} title="Price" tag="Required" hint={`Enter it once in ${currency}. Customers in other countries see it converted automatically.`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price ({currency})</Label>
                <Input id="price" type="number" inputMode="decimal" min={0} value={form.basePrice} placeholder="e.g. 18500" onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
                {priceNum != null && priceNum > 0 && <p className="text-xs text-muted-foreground">Customers will see <strong>{formatMoney(priceNum, currency)}</strong></p>}
                <p className="text-xs text-muted-foreground">Plain number. No commas or symbols.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compare">Original price <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="compare" type="number" inputMode="decimal" min={0} value={form.compareAtPrice} placeholder="Only if it is on sale" onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Shows as a crossed-out price. Skip it normally.</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <Label htmlFor="pv" className="flex items-center gap-2 text-sm">{priceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}Show the price on the website</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">Turn off to show “Inquire for Private Quote” instead.</p>
              </div>
              <Switch id="pv" checked={priceVisible} onCheckedChange={setPriceVisible} />
            </div>
          </StepCard>

          <StepCard n={3} title="Photos" tag="Required" hint="At least one. The first photo is the main one shown in the shop.">
            <ProductPhotos storeId={storeId} productId={isNew ? undefined : params.id} pending={pending} onPendingChange={setPending} />
          </StepCard>

          <StepCard n={4} title="Sizes" tag="Optional" hint="Only if the same product comes in different sizes or colours with different prices. Otherwise skip.">
            {isNew ? (
              <p className="text-sm text-muted-foreground">Create the product first, then add sizes here.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                  <Input value={newVariant.name} onChange={(e) => setNewVariant((v) => ({ ...v, name: e.target.value }))} placeholder="Size or colour, e.g. 30cm Black" className="h-9" />
                  <Input value={newVariant.sku} onChange={(e) => setNewVariant((v) => ({ ...v, sku: e.target.value }))} placeholder="Code (made for you if empty)" className="h-9 font-mono text-xs" />
                  <Input type="number" min={0} value={newVariant.price} onChange={(e) => setNewVariant((v) => ({ ...v, price: e.target.value }))} placeholder={`Price ${currency}`} className="h-9" />
                  <Button type="button" size="sm" className="h-9" disabled={!newVariant.name.trim() || newVariant.price === '' || createVariant.isPending}
                    onClick={() => {
                      const name = newVariant.name.trim();
                      const base = (product?.sku || product?.slug || 'SKU').toString();
                      const sku = newVariant.sku.trim() || `${base}-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
                      createVariant.mutate({ name, sku, price: Number(newVariant.price), currencyCode: product?.currencyCode ?? currency }, { onSuccess: () => setNewVariant({ name: '', sku: '', price: '' }) });
                    }}>
                    <Plus className="mr-1 h-3 w-3" />Add
                  </Button>
                </div>
                {(variants ?? []).length > 0 && (
                  <div className="divide-y rounded-lg border">
                    {(variants ?? []).map((v) => (
                      <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{v.name || 'Standard'} {v.isDefault && <Badge variant="secondary" className="ml-1 text-[10px]">main</Badge>}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{v.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{currency}</span>
                          <Input type="number" min={0} defaultValue={Number(v.price)} key={`${v.id}-${v.price}`} className="h-8 w-28"
                            onBlur={(e) => { const next = Number(e.target.value); if (e.target.value !== '' && next >= 0 && next !== Number(v.price)) updateVariant.mutate({ variantId: v.id, payload: { price: next } }); }} />
                          {!v.isDefault && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Remove size" onClick={() => deleteVariant.mutate(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Change a price, then click away to save it.</p>
              </>
            )}
          </StepCard>

          <StepCard n={5} title="Extra details" tag="Optional" hint="Good to have, never required. Skip anything you are unsure about.">
            <div className="space-y-1.5">
              <Label htmlFor="short">One-line summary</Label>
              <Input id="short" value={form.shortDescription} maxLength={1000} placeholder="e.g. Togo leather, palladium hardware" onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Shown under the name on shop cards.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Full description</Label>
              <textarea id="desc" rows={5} className={textareaClass} value={form.description} placeholder="Condition, materials, size, what is included…" onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Only write what is true. Customers read this before buying.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="colors">Colour</Label>
              <Input id="colors" value={form.colors} placeholder="e.g. Gold, Etoupe" onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Shown on the product page. Separate several with commas. Leave empty if unsure. Never leave “TBD”.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">How many do you have?</Label>
              <Input id="stock" type="number" min={0} value={form.stockQuantity} className="max-w-[10rem]" onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))} />
            </div>
            <details className="group rounded-lg border">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium">
                More options (usually skip)
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t p-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="sku">Product code</Label><Input id="sku" value={form.sku} placeholder="Made for you if empty" className="font-mono text-xs" onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="tags">Search words</Label><Input id="tags" value={form.tags} placeholder="birkin, togo, gold" onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Collector notes appear on the product page only when filled in. Leave blank unless a specialist has assessed the piece.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="cv">Collector value</Label><Input id="cv" value={extras.collectorValue} onChange={(e) => setExtras((x) => ({ ...x, collectorValue: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="mr">Market range</Label><Input id="mr" value={extras.marketRange} onChange={(e) => setExtras((x) => ({ ...x, marketRange: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="st">Scarcity note</Label><Input id="st" value={extras.scarcityTag} onChange={(e) => setExtras((x) => ({ ...x, scarcityTag: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="ii">Investment insight</Label><Input id="ii" value={extras.investmentInsight} onChange={(e) => setExtras((x) => ({ ...x, investmentInsight: e.target.value }))} /></div>
                </div>
              </div>
            </details>
          </StepCard>
        </div>

        {/* ── Checklist (sticks beside the steps on large screens) ── */}
        <div className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-4">
            <Card className={ready ? 'border-green-500/50' : undefined}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{live ? 'Live on the website' : ready ? 'Ready to publish' : 'Before you can publish'}</CardTitle>
                <CardDescription className="text-xs">{live ? 'Customers can see this product now.' : 'Draft products are never shown to customers.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {checklist.map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-sm">
                      {c.ok ? <Check className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className={c.ok ? '' : 'text-muted-foreground'}>{c.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => save(false)} disabled={busy}>
                    <Save className="mr-2 h-4 w-4" />{busy ? 'Saving…' : isNew ? 'Create product (as draft)' : 'Save changes'}
                  </Button>
                  {!live && (
                    <Button className="w-full" variant="outline" onClick={() => save(true)} disabled={busy || !ready}>
                      {isNew ? 'Create and publish' : 'Save and publish to site'}
                    </Button>
                  )}
                  {live && (
                    <Button className="w-full" variant="outline" disabled={busy} onClick={() => bulkUpdate.mutate({ ids: [params.id], action: 'archive' })}>
                      Take off the website
                    </Button>
                  )}
                  {!ready && !live && <p className="text-center text-xs text-muted-foreground">Publishing unlocks when every item above is ticked.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="h-4 w-4 text-amber-500" />Quick guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <p className="mb-1 font-semibold text-foreground">Do add</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>A clear name with brand, model and size.</li>
                    <li>Real photos of the actual item, from several angles.</li>
                    <li>The price in {currency}, as a plain number.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-foreground">Skip</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Everything under “More options” unless you know what it does.</li>
                    <li>Original price, unless it is really on sale.</li>
                    <li>Sizes, unless one listing has several prices.</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-foreground">Never</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Use another company’s photos or invent details you cannot prove.</li>
                    <li>Type prices in cents, or with commas or symbols.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
