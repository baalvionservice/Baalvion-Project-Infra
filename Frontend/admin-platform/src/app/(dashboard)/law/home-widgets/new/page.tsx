'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { HomeWidgetForm } from '@/components/law/HomeWidgetForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewHomeWidgetPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Homepage widgets', href: '/law/home-widgets' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New entry" description="Saved as a draft. It stays off the homepage until you publish it." />
      <HomeWidgetForm />
    </div>
  );
}
