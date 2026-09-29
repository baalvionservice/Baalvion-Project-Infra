'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { VideoItemForm } from '@/components/law/VideoItemForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewVideoItemFormPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Videos', href: '/law/videos' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New video" description="Saved as a draft. It stays off the site until you publish it." />
      <VideoItemForm />
    </div>
  );
}
