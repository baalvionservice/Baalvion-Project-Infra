'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { Skeleton } from '@/components/ui/skeleton';
import { AffiliateProductForm, type AffiliateProductValue, type AffiliateProductMeta } from '@/components/imperialpedia/AffiliateProductForm';

interface AffiliateProductDetail {
  id: string;
  slug: string;
  tracking_code: string;
  product_name: string;
  merchant_name: string;
  category?: string | null;
  cta_url: string;
  disclosure_text?: string | null;
  commission_rate?: number | null;
  avg_order_value?: number | null;
  article_id?: number | null;
  status: AffiliateProductMeta['status'];
  clicks_count: number;
}

export default function EditAffiliateProductPage() {
  const params = useParams();
  const id = String(params.id);
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Affiliate Products', href: '/imperialpedia/affiliate' },
      { label: 'Edit product' },
    ]);
  }, [setBreadcrumbs]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['imperialpedia', 'affiliate-products', 'detail', id],
    queryFn: () => serviceClients.imperialpedia.get(`/affiliate-products/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const product = data?.data as AffiliateProductDetail | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  if (isError || !product) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Affiliate product not found.</p>;
  }

  const initial: AffiliateProductValue = {
    slug: product.slug,
    product_name: product.product_name,
    merchant_name: product.merchant_name,
    category: product.category ?? '',
    cta_url: product.cta_url,
    disclosure_text: product.disclosure_text ?? '',
    commission_rate: product.commission_rate ?? '',
    avg_order_value: product.avg_order_value ?? '',
    article_id: product.article_id ?? '',
  };

  const meta: AffiliateProductMeta = {
    id: product.id,
    trackingCode: product.tracking_code,
    status: product.status,
    clicksCount: product.clicks_count,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${product.product_name}`} description="Update this affiliate product, its CTA URL, and revenue-estimate assumptions." />
      <AffiliateProductForm initial={initial} meta={meta} />
    </div>
  );
}
