'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { AffiliateProductForm } from '@/components/imperialpedia/AffiliateProductForm';

export default function NewAffiliateProductPage() {
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Affiliate Products', href: '/imperialpedia/affiliate' },
      { label: 'New product' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="New affiliate product" description="A tracking code and /r/ redirect link are generated automatically on save." />
      <AffiliateProductForm />
    </div>
  );
}
