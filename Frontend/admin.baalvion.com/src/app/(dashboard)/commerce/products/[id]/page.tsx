'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductMediaTab from '@/components/commerce/ProductMediaTab';
import {
  useProduct,
  useUpdateProduct,
  useCreateProduct,
  useBulkUpdateProducts,
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from '@/lib/queries/commerce-products.queries';
import { useCommerceCategories } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatMoney } from '@/lib/utils/format';
import { flattenCategoryPaths } from '@/lib/utils/categoryPaths';

// The storefront reads the price from customFields.basePrice, falling back to the default
// variant. Amounts are whole currency units (USD), not cents.
function displayPrice(product: { customFields?: Record<string, unknown> }, variants?: { price: number; isDefault: boolean }[]) {
  const cf = product.customFields?.basePrice;
  if (cf != null && cf !== '') return String(cf);
  const v = variants?.find((x) => x.isDefault) ?? variants?.[0];
  return v ? String(Number(v.price)) : '';
}

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const presetCategory = useSearchParams().get('category') ?? '';
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';
  const isNew = params.id === 'new';

  const { data: product, isLoading } = useProduct(storeId, isNew ? '' : params.id);
  const { data: variants } = useVariants(storeId, isNew ? '' : params.id);
  const { data: categories } = useCommerceCategories(storeId);

  const updateProduct = useUpdateProduct(storeId, params.id);
  const createProduct = useCreateProduct(storeId);
  // Bulk "publish" is the direct-to-live path; the single-product publish only submits for
  // marketplace moderation, which Amarisé does not use.
  const bulkUpdate = useBulkUpdateProducts(storeId);
  const createVariant = useCreateVariant(storeId, params.id);
  const updateVariant = useUpdateVariant(storeId, params.id);
  const deleteVariant = useDeleteVariant(storeId, params.id);
  const categoryOptions = flattenCategoryPaths(categories ?? []);

  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    shortDescription: '',
    basePrice: '',
    compareAtPrice: '',
    categoryId: presetCategory,
    stockQuantity: '0',
    tags: '',
    status: 'draft',
  });

  // Curator/collector-value assessment — real, admin-authored fields (commerce-service
  // custom_fields, surfaced to the storefront via storefrontSerializer.js). Left blank by
  // default; nothing is shown to customers until a curator actually sets these.
  const [collectorValue, setCollectorValue] = useState('');
  const [marketRange, setMarketRange] = useState('');
  const [investmentInsight, setInvestmentInsight] = useState('');
  const [scarcityTag, setScarcityTag] = useState('');
  const [priceVisible, setPriceVisible] = useState(true);

  const [newVariant, setNewVariant] = useState({ name: '', sku: '', price: '' });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        sku: product.sku ?? '',
        shortDescription: product.shortDescription ?? '',
        basePrice: displayPrice(product, variants),
        compareAtPrice: product.customFields?.compareAtPrice != null ? String(product.customFields.compareAtPrice) : '',
        categoryId: product.categoryId ?? '',
        stockQuantity: String((product as { stockQuantity?: number }).stockQuantity ?? 0),
        tags: (product.tags ?? []).join(', '),
        status: product.status ?? 'draft',
      });
      const cf = product.customFields ?? {};
      setCollectorValue(typeof cf.collectorValue === 'string' ? cf.collectorValue : '');
      setMarketRange(typeof cf.marketRange === 'string' ? cf.marketRange : '');
      setInvestmentInsight(typeof cf.investmentInsight === 'string' ? cf.investmentInsight : '');
      setScarcityTag(typeof cf.scarcityTag === 'string' ? cf.scarcityTag : '');
      setPriceVisible(cf.priceVisible !== false);
    }
  }, [product, variants]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Commerce', href: '/commerce' },
      { label: 'Products', href: '/commerce/products' },
      { label: isNew ? 'New Product' : (product?.name ?? 'Loading...') },
    ]);
  }, [setBreadcrumbs, isNew, product?.name]);

  const handleSave = () => {
    const price = form.basePrice.trim() === '' ? undefined : Number(form.basePrice);
    const compareAt = form.compareAtPrice.trim() === '' ? undefined : Number(form.compareAtPrice);
    if ((price != null && !(price >= 0)) || (compareAt != null && !(compareAt >= 0))) {
      toast.error('Enter prices as plain numbers, e.g. 4500');
      return;
    }
    // customFields is a single JSONB column — the backend REPLACES it wholesale on PATCH,
    // so spread the EXISTING customFields first (colors/sizes/isVip/regions/... set elsewhere).
    const customFields = {
      ...(product?.customFields ?? {}),
      basePrice: price,
      compareAtPrice: compareAt,
      collectorValue: collectorValue.trim() || undefined,
      marketRange: marketRange.trim() || undefined,
      investmentInsight: investmentInsight.trim() || undefined,
      scarcityTag: scarcityTag.trim() || undefined,
      priceVisible,
    };
    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const stock = Math.max(0, Math.floor(Number(form.stockQuantity) || 0));

    if (isNew) {
      createProduct.mutate(
        {
          name: form.name.trim(),
          shortDescription: form.shortDescription || undefined,
          description: form.description || undefined,
          sku: form.sku || undefined,
          categoryId: form.categoryId || undefined,
          price: price ?? 0,
          tags,
          customFields,
          stockQuantity: stock,
        } as never,
        { onSuccess: (res) => router.replace(`/commerce/products/${res.data.data.id}`) },
      );
      return;
    }

    updateProduct.mutate(
      {
        name: form.name.trim(),
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        sku: form.sku || undefined,
        categoryId: form.categoryId || null,
        tags,
        customFields,
        stockQuantity: stock,
      } as never,
      {
        onSuccess: () => {
          // Keep the default variant's price in step with the headline price.
          const def = variants?.find((v) => v.isDefault) ?? variants?.[0];
          if (def && price != null && Number(def.price) !== price) {
            updateVariant.mutate({ variantId: def.id, payload: { price, compareAtPrice: compareAt ?? null } });
          }
        },
      },
    );
  };

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Select a store first from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New Product' : (product?.name ?? '')}
        description={isNew ? 'Add a product to your store' : `SKU: ${product?.sku ?? '—'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/commerce/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {product && product.status !== 'published' && (
              <Button
                size="sm"
                variant="outline"
                disabled={bulkUpdate.isPending}
                onClick={() => bulkUpdate.mutate({ ids: [params.id], action: 'publish' })}
              >
                <Eye className="mr-2 h-4 w-4" />
                Publish to site
              </Button>
            )}
            {product && product.status === 'published' && (
              <Button
                size="sm"
                variant="outline"
                disabled={bulkUpdate.isPending}
                onClick={() => bulkUpdate.mutate({ ids: [params.id], action: 'archive' })}
              >
                Take off site
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={updateProduct.isPending || createProduct.isPending || !form.name.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {updateProduct.isPending || createProduct.isPending ? 'Saving...' : isNew ? 'Create product' : 'Save'}
            </Button>
          </div>
        }
      />

      {!isNew && product && (
        <div className="flex items-center gap-2">
          <StatusBadge status={product.status} />
          <Badge variant="outline" className="capitalize">{product.productType}</Badge>
          {product.currencyCode && (
            <Badge variant="secondary">{product.currencyCode}</Badge>
          )}
        </div>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media" disabled={isNew}>Photos</TabsTrigger>
          <TabsTrigger value="variants" disabled={isNew}>Sizes {variants ? `(${variants.length})` : ''}</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main fields */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Product Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="short">Short description (shown on cards)</Label>
                    <Input
                      id="short"
                      value={form.shortDescription}
                      onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                      placeholder="One line, e.g. Togo leather, palladium hardware"
                      maxLength={1000}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="desc">Full description</Label>
                    <textarea
                      id="desc"
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Product description..."
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={form.sku}
                        onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                        placeholder="PROD-001"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="stock">Quantity in stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min={0}
                        value={form.stockQuantity}
                        onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="basePrice">Price (USD)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                      placeholder="e.g. 9999"
                    />
                    {form.basePrice && product?.currencyCode && (
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(Number(form.basePrice), product.currencyCode)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="compareAt">Original price (USD, optional)</Label>
                    <Input
                      id="compareAt"
                      type="number"
                      value={form.compareAtPrice}
                      onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                      placeholder="e.g. 14999"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Organization</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={form.categoryId || 'none'}
                      onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === 'none' ? '' : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      placeholder="luxury, featured, sale (comma separated)"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Collector Value</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Curator assessment shown on the storefront. Leave blank unless a curator
                    has actually evaluated this piece — nothing here is fabricated by default.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="collectorValue">Collector Value</Label>
                    <Input
                      id="collectorValue"
                      value={collectorValue}
                      onChange={(e) => setCollectorValue(e.target.value)}
                      placeholder="e.g. Exceptional, Museum Grade"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="marketRange">Market Range</Label>
                    <Input
                      id="marketRange"
                      value={marketRange}
                      onChange={(e) => setMarketRange(e.target.value)}
                      placeholder="e.g. $12,000 - $15,000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scarcityTag">Scarcity Tag</Label>
                    <Input
                      id="scarcityTag"
                      value={scarcityTag}
                      onChange={(e) => setScarcityTag(e.target.value)}
                      placeholder="e.g. Only 1 available globally"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="investmentInsight">Investment Insight</Label>
                    <textarea
                      id="investmentInsight"
                      rows={3}
                      value={investmentInsight}
                      onChange={(e) => setInvestmentInsight(e.target.value)}
                      placeholder="A real, verifiable note — never a fabricated statistic."
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <Label htmlFor="priceVisible">Price Visible</Label>
                      <p className="text-xs text-muted-foreground">Off shows &quot;Inquire for Private Quote&quot; instead of the price.</p>
                    </div>
                    <Switch id="priceVisible" checked={priceVisible} onCheckedChange={setPriceVisible} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          {!isNew && <ProductMediaTab storeId={storeId} productId={params.id} />}
        </TabsContent>

        <TabsContent value="variants" className="mt-4">
          <Card>
            <CardHeader className="space-y-3">
              <div>
                <CardTitle className="text-sm">Sizes &amp; variants</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add one row per size or colour (e.g. &ldquo;Birkin 30cm &middot; Black&rdquo;) with its own price.
                  Edit a price below and click away to save it.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                <Input
                  value={newVariant.name}
                  onChange={(e) => setNewVariant((v) => ({ ...v, name: e.target.value }))}
                  placeholder="Size / name, e.g. 30cm Black"
                  className="h-9"
                />
                <Input
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant((v) => ({ ...v, sku: e.target.value }))}
                  placeholder="SKU (auto if empty)"
                  className="h-9 font-mono text-xs"
                />
                <Input
                  type="number"
                  min={0}
                  value={newVariant.price}
                  onChange={(e) => setNewVariant((v) => ({ ...v, price: e.target.value }))}
                  placeholder="Price USD"
                  className="h-9"
                />
                <Button
                  size="sm"
                  className="h-9"
                  disabled={!newVariant.name.trim() || newVariant.price === '' || createVariant.isPending}
                  onClick={() => {
                    const name = newVariant.name.trim();
                    const base = (product?.sku || product?.slug || 'SKU').toString();
                    const sku =
                      newVariant.sku.trim() ||
                      `${base}-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
                    createVariant.mutate(
                      { name, sku, price: Number(newVariant.price), currencyCode: product?.currencyCode ?? 'USD' },
                      { onSuccess: () => setNewVariant({ name: '', sku: '', price: '' }) },
                    );
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!variants || variants.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No sizes yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {variants.map((v) => (
                    <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {v.name || 'Default'} {v.isDefault && <Badge variant="secondary" className="ml-1 text-[10px]">default</Badge>}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{v.sku ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <Input
                            type="number"
                            min={0}
                            defaultValue={Number(v.price)}
                            key={`${v.id}-${v.price}`}
                            className="h-8 w-28"
                            onBlur={(e) => {
                              const next = Number(e.target.value);
                              if (e.target.value !== '' && next >= 0 && next !== Number(v.price)) {
                                updateVariant.mutate({ variantId: v.id, payload: { price: next } });
                              }
                            }}
                          />
                        </div>
                        <StatusBadge status={v.isActive ? 'active' : 'inactive'} />
                        {!v.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteVariant.mutate(v.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">SEO Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Meta Title</Label>
                <Input
                  value={product?.seoTitle ?? ''}
                  readOnly
                  placeholder="Defaults to product name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <textarea
                  rows={3}
                  value={product?.seoDescription ?? ''}
                  readOnly
                  placeholder="Defaults to product description"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL Handle / Slug</Label>
                <Input value={product?.slug ?? ''} readOnly className="font-mono text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
