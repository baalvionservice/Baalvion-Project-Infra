'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { SiteContentForm } from '@/components/imperialpedia/SiteContentForm';

export default function NewSiteContentPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Imperialpedia', href: '/imperialpedia' },
      { label: 'Site Content', href: '/imperialpedia/site-content' },
      { label: 'New content' },
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader title="New site content" description="Create or override content for a public Imperialpedia page." />
      <SiteContentForm />
    </div>
  );
}
