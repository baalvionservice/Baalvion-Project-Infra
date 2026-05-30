'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useProduct,
  useUpdateProduct,
  usePublishProduct,
  useVariants,
  useCreateVariant,
  useDeleteVariant,
} from '@/lib/queries/commerce-products.queries';
import { useCommerceCategories } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency } from '@/lib/utils/format';

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';
  const isNew = params.id === 'new';

  const { data: product, isLoading } = useProduct(storeId, isNew ? '' : params.id);
  const { data: variants } = useVariants(storeId, isNew ? '' : params.id);
  const { data: categories } = useCommerceCategories(storeId);

  const updateProduct = useUpdateProduct(storeId, params.id);
  const publishProduct = usePublishProduct(storeId);
  const createVariant = useCreateVariant(storeId, params.id);
  const deleteVariant = useDeleteVariant(storeId, params.id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    basePrice: '',
    compareAtPrice: '',
    categoryId: '',
    brand: '',
    tags: '',
    status: 'draft',
  });

  const [newVariantName, setNewVariantName] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        sku: product.sku ?? '',
        basePrice: product.basePrice != null ? String(product.basePrice) : '',
        compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
        categoryId: product.categoryId ?? '',
        brand: product.brand ?? '',
        tags: (product.tags ?? []).join(', '),
        status: product.status ?? 'draft',
      });
    }
  }, [product]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Commerce', href: '/commerce' },
      { label: 'Products', href: '/commerce/products' },
      { label: isNew ? 'New Product' : (product?.name ?? 'Loading...') },
    ]);
  }, [setBreadcrumbs, isNew, product?.name]);

  const handleSave = () => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      sku: form.sku || undefined,
      basePrice: form.basePrice ? Number(form.basePrice) : undefined,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      categoryId: form.categoryId || undefined,
      brand: form.brand || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    updateProduct.mutate(payload, {
      onSuccess: () => {
        if (isNew) router.push('/commerce/products');
      },
    });
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
            {product && product.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => publishProduct.mutate(params.id)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={updateProduct.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateProduct.isPending ? 'Saving...' : 'Save'}
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
          <TabsTrigger value="variants">Variants {variants ? `(${variants.length})` : ''}</TabsTrigger>
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
                    <Label htmlFor="desc">Description</Label>
                    <textarea
                      id="desc"
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Product description..."
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={form.brand}
                        onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                        placeholder="Brand name"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="basePrice">Base Price (cents)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                      placeholder="e.g. 9999"
                    />
                    {form.basePrice && product?.currencyCode && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(form.basePrice), product.currencyCode)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="compareAt">Compare At Price (cents)</Label>
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
                        {(categories ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variants" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Product Variants</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  placeholder="Variant name"
                  className="h-8 w-48"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (newVariantName.trim()) {
                      createVariant.mutate({ name: newVariantName.trim() });
                      setNewVariantName('');
                    }
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
                  <p className="text-sm text-muted-foreground">No variants yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{v.sku ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {v.price != null && (
                          <span className="text-sm">{formatCurrency(v.price, product?.currencyCode ?? 'USD')}</span>
                        )}
                        <StatusBadge status={v.isActive ? 'active' : 'inactive'} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteVariant.mutate(v.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
