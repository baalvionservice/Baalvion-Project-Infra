'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { EntertainmentForm } from '@/components/law/EntertainmentForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewEntertainmentPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Entertainment', href: '/law/entertainment' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New entry" description="Create a draft. It stays hidden until you publish it." />
      <EntertainmentForm />
    </div>
  );
}
