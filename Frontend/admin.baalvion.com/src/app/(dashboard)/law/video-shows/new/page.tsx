'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { VideoShowForm } from '@/components/law/VideoShowForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewVideoShowFormPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Shows', href: '/law/video-shows' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New show" description="Saved as a draft. It stays off the site until you publish it." />
      <VideoShowForm />
    </div>
  );
}
