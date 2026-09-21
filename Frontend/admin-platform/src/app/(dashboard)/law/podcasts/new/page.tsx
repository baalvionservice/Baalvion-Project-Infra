'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { PodcastShowForm } from '@/components/law/PodcastShowForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewPodcastPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Podcasts', href: '/law/podcasts' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New podcast" description="Saved as a draft. It stays off the site until you publish it." />
      <PodcastShowForm />
    </div>
  );
}
