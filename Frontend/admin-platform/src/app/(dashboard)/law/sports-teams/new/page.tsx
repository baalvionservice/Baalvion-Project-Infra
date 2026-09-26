'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { TeamForm } from '@/components/law/TeamForm';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewTeamPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite', href: '/law' }, { label: 'Sports teams', href: '/law/sports-teams' }, { label: 'New' }]); }, [setBreadcrumbs]);
  return (
    <div className="space-y-6">
      <PageHeader title="New team" description="Create a draft. It stays hidden until you publish it." />
      <TeamForm />
    </div>
  );
}
