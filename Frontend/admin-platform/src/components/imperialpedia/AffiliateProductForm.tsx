'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { serviceClients, normalizeError } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface AffiliateProductValue {
  slug: string;
  product_name: string;
  merchant_name: string;
  category: string;
  cta_url: string;
  disclosure_text: string;
  commission_rate: number | '';
  avg_order_value: number | '';
  article_id: number | '';
}

export interface AffiliateProductMeta {
  id: string;
  trackingCode: string;
  status: 'active' | 'paused' | 'archived';
  clicksCount: number;
}

const EMPTY: AffiliateProductValue = {
  slug: '', product_name: '', merchant_name: '', category: '', cta_url: '',
  disclosure_text: '', commission_rate: '', avg_order_value: '', article_id: '',
};

interface Props { initial?: AffiliateProductValue; meta?: AffiliateProductMeta }

export function AffiliateProductForm({ initial, meta }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<AffiliateProductValue>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(meta);
  const set = <K extends keyof AffiliateProductValue>(key: K, v: AffiliateProductValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['imperialpedia', 'affiliate-products'] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: value.slug,
        product_name: value.product_name,
        merchant_name: value.merchant_name,
        category: value.category || undefined,
        cta_url: value.cta_url,
        disclosure_text: value.disclosure_text || undefined,
        commission_rate: value.commission_rate === '' ? undefined : Number(value.commission_rate),
        avg_order_value: value.avg_order_value === '' ? undefined : Number(value.avg_order_value),
        article_id: value.article_id === '' ? undefined : Number(value.article_id),
      };
      const client = serviceClients.imperialpedia;
      const res = isEdit ? await client.patch(`/affiliate-products/${meta!.id}`, payload) : await client.post('/affiliate-products', payload);
      return res.data;
    },
    onSuccess: () => {
      invalidate();
      router.push('/imperialpedia/affiliate');
    },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const archive = useMutation({
    mutationFn: () => serviceClients.imperialpedia.delete(`/affiliate-products/${meta!.id}`),
    onSuccess: () => { invalidate(); router.push('/imperialpedia/affiliate'); },
    onError: (err) => setError(normalizeError(err as AxiosError).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!value.slug.trim() || !value.product_name.trim() || !value.merchant_name.trim() || !value.cta_url.trim()) {
      setError('Slug, product name, merchant name, and CTA URL are required.');
      return;
    }
    save.mutate();
  };

  const redirectUrl = meta ? `${serviceClients.imperialpedia.defaults.baseURL?.replace(/\/api\/v1$/, '')}/r/${meta.trackingCode}` : null;

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {meta && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <span className="text-muted-foreground">{meta.clicksCount} clicks</span>
            <span className="font-mono text-xs text-muted-foreground">{redirectUrl}</span>
            {meta.status !== 'archived' && (
              <Button
                type="button" size="sm" variant="outline" className="ml-auto"
                onClick={() => window.confirm('Archive this affiliate product? Its redirect link will stop working.') && archive.mutate()}
                disabled={archive.isPending}
              >
                Archive
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Affiliate Product</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={value.slug} onChange={(e) => set('slug', e.target.value)} placeholder="best-online-broker" disabled={isEdit} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={value.category} onChange={(e) => set('category', e.target.value)} placeholder="broker" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product_name">Product name</Label>
            <Input id="product_name" value={value.product_name} onChange={(e) => set('product_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="merchant_name">Merchant name</Label>
            <Input id="merchant_name" value={value.merchant_name} onChange={(e) => set('merchant_name', e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="cta_url">CTA URL <span className="text-muted-foreground">(http/https only)</span></Label>
            <Input id="cta_url" value={value.cta_url} onChange={(e) => set('cta_url', e.target.value)} placeholder="https://merchant.example.com/signup?ref=baalvion" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="disclosure_text">Affiliate disclosure</Label>
            <Textarea id="disclosure_text" rows={2} value={value.disclosure_text} onChange={(e) => set('disclosure_text', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commission_rate">Commission rate (%)</Label>
            <Input
              id="commission_rate" type="number" min={0} max={100} step="0.01"
              value={value.commission_rate} onChange={(e) => set('commission_rate', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avg_order_value">Avg order value ($) <span className="text-muted-foreground">(estimate)</span></Label>
            <Input
              id="avg_order_value" type="number" min={0} step="0.01"
              value={value.avg_order_value} onChange={(e) => set('avg_order_value', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <p className="text-[11px] text-muted-foreground">
              Used only to project estimated revenue in the report — no purchase tracking exists, so this is an assumption, not a measured value.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="article_id">Linked article ID <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="article_id" type="number" min={1}
              value={value.article_id} onChange={(e) => set('article_id', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/imperialpedia/affiliate')}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
