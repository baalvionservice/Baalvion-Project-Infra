'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { CaseForm } from '@/components/law/CaseForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewCasePage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Cases', href: '/law/cases' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New case" description="Create a draft. It stays hidden until you publish it." />
      <CaseForm />
    </div>
  );
}
