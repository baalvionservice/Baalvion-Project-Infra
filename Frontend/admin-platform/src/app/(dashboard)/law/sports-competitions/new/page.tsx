'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { CompetitionForm } from '@/components/law/CompetitionForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewCompetitionPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Competitions', href: '/law/sports-competitions' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New competition" description="Create a draft. It stays hidden until you publish it." />
      <CompetitionForm />
    </div>
  );
}
