'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { CourtForm } from '@/components/law/CourtForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewCourtPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Courts', href: '/law/courts' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New court" description="Create a draft. It stays hidden until you publish it." />
      <CourtForm />
    </div>
  );
}
